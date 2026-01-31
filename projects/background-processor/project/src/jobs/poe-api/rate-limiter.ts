import { createValkeyConnection } from "../../connections/valkey.js";

const PREFIX_LIMITS = "{poe}:limits";
const PREFIX_CONFIG_POLICY = "{poe}:config:policy";
const PREFIX_CONFIG_RULE = "{poe}:config:rule";
const PREFIX_BLOCK = "{poe}:block";

export interface PoeLimiterOptions {
  hitCountBuffer?: number;
  hitTimingBuffer?: number;
  publicIp?: string;
}

async function getPublicIp(): Promise<string> {
  const response = await fetch("https://checkip.amazonaws.com");
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const ip = (await response.text()).trim();
  if (!ip) {
    throw new Error("Empty IP response");
  }
  return ip;
}

/**
 * CHECK SCRIPT
 */
const LUA_CHECK_SCRIPT = `
local time = redis.call('TIME')
local now = (tonumber(time[1]) * 1000) + math.floor(tonumber(time[2]) / 1000)

local unique_id = table.remove(ARGV, 1) -- Pop UUID
local cost = tonumber(table.remove(ARGV, 1))
local count_buffer = tonumber(table.remove(ARGV, 1)) or 0
local timing_buffer = tonumber(table.remove(ARGV, 1)) or 0
local max_delay = 0

local cjson = cjson

-- ITERATE RULES
for i, rule_name in ipairs(ARGV) do
    
    -- 1. CHECK BANS
    local block_key = "${PREFIX_BLOCK}:" .. rule_name
    local block_ttl = redis.call("PTTL", block_key)
    
    if block_ttl == -1 then
        max_delay = 3600000 -- 1 hour fallback for perma-bans
    elseif block_ttl > 0 then
        local safe_block = block_ttl + timing_buffer
        if safe_block > max_delay then max_delay = safe_block end
    end

    -- 2. FETCH CONFIG ATOMICALLY
    local config_key = "${PREFIX_CONFIG_RULE}:" .. rule_name
    local config_json = redis.call("GET", config_key)
    local limits = {}

    if config_json then
        local status, result = pcall(cjson.decode, config_json)
        if status then
            limits = result
        end
    else
        -- PROBE MODE
        local probe_key = "${PREFIX_CONFIG_RULE}:probe:" .. rule_name
        -- Acquire lock for 10s
        local acquired = redis.call("SET", probe_key, "1", "NX", "PX", 10000)
        
        if acquired then
            -- We are the probe. Return success (0 delay).
        else
            -- Wait for probe.
            local probe_wait = 1500
            if probe_wait > max_delay then max_delay = probe_wait end
        end
    end

    -- 3. CHECK LIMITS
    for _, pair in ipairs(limits) do
        local raw_limit = tonumber(pair[1])
        local window = tonumber(pair[2])
        
        local limit = raw_limit - count_buffer
        if limit < 1 then limit = 1 end

        local key = "${PREFIX_LIMITS}:" .. rule_name .. ":" .. window
        
        -- TYPO FIXED HERE
        redis.call("ZREMRANGEBYSCORE", key, 0, now - (window * 1000))
        local current_hits = redis.call("ZCARD", key)
        
        if current_hits + cost > limit then
            local oldest = redis.call("ZRANGE", key, 0, 0, "WITHSCORES")
            local oldest_time = tonumber(oldest[2]) or now 
            local wait_time = (oldest_time + (window * 1000)) - now
            
            if wait_time > 0 then wait_time = wait_time + timing_buffer end
            if wait_time > max_delay then max_delay = wait_time end
        end
    end
end

if max_delay > 0 then return max_delay end

-- COMMIT PHASE
for i, rule_name in ipairs(ARGV) do
    local config_key = "${PREFIX_CONFIG_RULE}:" .. rule_name
    local config_json = redis.call("GET", config_key)
    local limits = {}
    
    if config_json then
        local status, result = pcall(cjson.decode, config_json)
        if status then limits = result end
    end
    -- If config is missing (Probe), we skip ZADD.
    -- The hit is added later via updateState/syncPoeState.

    for _, pair in ipairs(limits) do
        local window = tonumber(pair[2])
        local key = "${PREFIX_LIMITS}:" .. rule_name .. ":" .. window
        
        redis.call("ZADD", key, now, unique_id) 
        redis.call("PEXPIRE", key, window * 1000) 
    end
end

return 0
`;

const LUA_SYNC_SCRIPT = `
local time = redis.call('TIME')
local now = (tonumber(time[1]) * 1000) + math.floor(tonumber(time[2]) / 1000)
local key = KEYS[1]
local server_count = tonumber(ARGV[1])
local window = tonumber(ARGV[2])

redis.call("ZREMRANGEBYSCORE", key, 0, now - (window * 1000))
local current_count = redis.call("ZCARD", key)

if current_count < server_count then
    local diff = server_count - current_count
    for j = 1, diff do
        redis.call("ZADD", key, now, "sync:" .. now .. ":" .. j)
    end
    redis.call("PEXPIRE", key, window * 1000)
end
return 0
`;

const LUA_ROLLBACK_SCRIPT = `
local unique_id = ARGV[1]
for i = 2, #ARGV do
    local key = ARGV[i]
    redis.call("ZREM", key, unique_id)
end
return 0
`;

export class PoeRateLimiter {
  private readonly hitCountBuffer: number;
  private readonly hitTimingBuffer: number;
  private clientIp: string | null = null;
  private ipPromise: Promise<string> | null = null;

  constructor(
    private readonly redis: ReturnType<typeof createValkeyConnection>,
    options: PoeLimiterOptions = {},
  ) {
    this.hitCountBuffer = options.hitCountBuffer ?? 0;
    this.hitTimingBuffer = options.hitTimingBuffer ?? 0;

    if (options.publicIp) {
      this.clientIp = options.publicIp;
    }

    this.registerScripts();
  }

  private registerScripts() {
    const r = this.redis.valkey;
    // @ts-expect-error - Dynamic command check
    if (typeof r.checkPoeLimits !== "function") {
      r.defineCommand("checkPoeLimits", {
        numberOfKeys: 0,
        lua: LUA_CHECK_SCRIPT,
      });
    }
    // @ts-expect-error - Dynamic command check
    if (typeof r.syncPoeState !== "function") {
      r.defineCommand("syncPoeState", {
        numberOfKeys: 1,
        lua: LUA_SYNC_SCRIPT,
      });
    }
    // @ts-expect-error - Dynamic command check
    if (typeof r.rollbackPoeHit !== "function") {
      r.defineCommand("rollbackPoeHit", {
        numberOfKeys: 0,
        lua: LUA_ROLLBACK_SCRIPT,
      });
    }
  }

  private async getClientIp(): Promise<string> {
    if (this.clientIp) {
      return this.clientIp;
    }
    if (!this.ipPromise) {
      this.ipPromise = getPublicIp()
        .then((ip) => {
          this.clientIp = ip;
          return ip;
        })
        .catch((err: unknown) => {
          this.ipPromise = null;
          throw err;
        });
    }
    return this.ipPromise;
  }

  private getRuleNameKey(
    ruleName: string,
    details: { ip: string; accountId?: string },
  ): string {
    switch (ruleName.toLowerCase()) {
      case "account":
        if (details.accountId) {
          return `${ruleName}:${details.accountId}`;
        }
        break;
      case "ip":
        return `${ruleName}:${details.ip}`;
      default:
        break;
    }
    return ruleName;
  }

  /**
   * Helper to clear probe locks if we fail to get headers
   * or need to rollback.
   */
  private async clearProbeLocks(endpointName: string, accountId: string) {
    const ruleDetails = { ip: await this.getClientIp(), accountId };
    const policyKey = `${PREFIX_CONFIG_POLICY}:${endpointName}`;
    let ruleNames = await this.redis.valkey.smembers(policyKey);

    if (ruleNames.length === 0) {
      ruleNames = ["ip"];
    }

    const probeKeys = ruleNames.map(
      (r) =>
        `${PREFIX_CONFIG_RULE}:probe:${this.getRuleNameKey(r, ruleDetails)}`,
    );

    if (probeKeys.length > 0) {
      await this.redis.valkey.del(...probeKeys);
    }
  }

  async updateRules(endpointName: string, accountId: string, headers: Headers) {
    const ruleDetails = { ip: await this.getClientIp(), accountId };
    const rulesHeader = headers.get("x-rate-limit-rules");

    // FAILSAFE: If no headers (e.g. 404/500), clear locks so we don't freeze.
    if (!rulesHeader) {
      await this.clearProbeLocks(endpointName, accountId);
      return;
    }

    await this.updateState(accountId, headers);

    const ruleNames = rulesHeader
      .toLowerCase()
      .split(",")
      .map((s) => s.trim());
    const policyKey = `${PREFIX_CONFIG_POLICY}:${endpointName}`;

    const currentRules = await this.redis.valkey.smembers(policyKey);
    const isPolicySame =
      currentRules.length === ruleNames.length &&
      currentRules.every((r) => ruleNames.includes(r));

    const transaction = this.redis.valkey.multi();

    if (!isPolicySame) {
      transaction.del(policyKey);
      transaction.sadd(policyKey, ...ruleNames);
    }

    for (const ruleName of ruleNames) {
      const probeKey = `${PREFIX_CONFIG_RULE}:probe:${this.getRuleNameKey(ruleName, ruleDetails)}`;

      // ALWAYS release the probe lock if we got a response for this rule
      transaction.del(probeKey);

      const limitHeader = headers.get(`x-rate-limit-${ruleName}`);
      if (!limitHeader) {
        continue;
      }

      try {
        const parsedRules = limitHeader.split(",").map((part) => {
          const segments = part.split(":").map(Number);
          return [segments[0], segments[1]];
        });

        if (parsedRules.length > 0) {
          const configKey = `${PREFIX_CONFIG_RULE}:${this.getRuleNameKey(ruleName, ruleDetails)}`;
          transaction.set(configKey, JSON.stringify(parsedRules));
        }
      } catch (err) {
        console.warn(
          `Failed to parse headers for rule ${ruleName} (${limitHeader})`,
          err,
        );
      }
    }

    await transaction.exec();
  }

  async updateState(accountId: string, headers: Headers) {
    const ruleDetails = { ip: await this.getClientIp(), accountId };
    const rulesHeader = headers.get("x-rate-limit-rules");
    if (!rulesHeader) {
      return;
    }

    const ruleNames = rulesHeader
      .toLowerCase()
      .split(",")
      .map((s) => s.trim());
    const pipeline = this.redis.valkey.pipeline();

    for (const ruleName of ruleNames) {
      const stateHeader = headers.get(`x-rate-limit-${ruleName}-state`);
      if (!stateHeader) {
        continue;
      }

      const scopedRuleName = this.getRuleNameKey(ruleName, ruleDetails);

      try {
        const states = stateHeader.split(",");
        for (const part of states) {
          const segments = part.split(":").map(Number);
          const serverCount = segments[0];
          const period = segments[1];
          const banDuration = segments[2];

          if (banDuration && banDuration > 0) {
            const blockKey = `${PREFIX_BLOCK}:${scopedRuleName}`;
            pipeline.set(blockKey, "1", "PX", banDuration * 1000);
          }

          const key = `${PREFIX_LIMITS}:${scopedRuleName}:${period}`;

          // @ts-expect-error - Dynamic command
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          pipeline.syncPoeState(key, serverCount, period);
        }
      } catch (err) {
        console.warn(
          `Failed to parse state for rule ${ruleName} (${stateHeader})`,
          err,
        );
      }
    }
    await pipeline.exec();
  }

  async reserveSlot(
    endpointName: string,
    accountId: string,
    jobId: string,
  ): Promise<number> {
    const ruleDetails = { ip: await this.getClientIp(), accountId };
    const cost = 1;
    const policyKey = `${PREFIX_CONFIG_POLICY}:${endpointName}`;

    let ruleNames = await this.redis.valkey.smembers(policyKey);
    if (ruleNames.length === 0) {
      ruleNames = ["ip"];
    }

    const scopedRuleNames = ruleNames.map((r) =>
      this.getRuleNameKey(r, ruleDetails),
    );

    const scriptArgs: (string | number)[] = [
      jobId,
      cost,
      this.hitCountBuffer,
      this.hitTimingBuffer,
      ...scopedRuleNames,
    ];

    // @ts-expect-error - Dynamic command
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const result = (await this.redis.valkey.checkPoeLimits(
      ...scriptArgs,
    )) as number;

    return result;
  }

  async rollbackSlot(
    endpointName: string,
    accountId: string,
    jobId: string,
  ): Promise<void> {
    const ruleDetails = { ip: await this.getClientIp(), accountId };
    const policyKey = `${PREFIX_CONFIG_POLICY}:${endpointName}`;

    let ruleNames = await this.redis.valkey.smembers(policyKey);
    if (ruleNames.length === 0) {
      ruleNames = ["ip"];
    }

    // NEW: Always try to clear probe locks on rollback
    // This prevents a failed probe (e.g. network error) from freezing the queue.
    const probeKeys = ruleNames.map(
      (r) =>
        `${PREFIX_CONFIG_RULE}:probe:${this.getRuleNameKey(r, ruleDetails)}`,
    );
    if (probeKeys.length > 0) {
      await this.redis.valkey.del(...probeKeys);
    }

    const configKeys = ruleNames.map(
      (r) => `${PREFIX_CONFIG_RULE}:${this.getRuleNameKey(r, ruleDetails)}`,
    );

    const configs = await this.redis.valkey.mget(...configKeys);
    const targetKeys: string[] = [];

    for (const [idx, name] of ruleNames.entries()) {
      const scopedName = this.getRuleNameKey(name, ruleDetails);
      const configStr = configs[idx];
      let parsed: number[][] = [];

      if (configStr) {
        try {
          parsed = JSON.parse(configStr) as number[][];
        } catch {
          /* ignore */
        }
      } else if (name === "ip") {
        parsed = [[20, 5]];
      }

      for (const pair of parsed) {
        const window = pair[1];
        targetKeys.push(`${PREFIX_LIMITS}:${scopedName}:${window}`);
      }
    }

    if (targetKeys.length === 0) {
      return;
    }

    // @ts-expect-error - Dynamic command
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await this.redis.valkey.rollbackPoeHit(jobId, ...targetKeys);
  }
}
