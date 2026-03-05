import { valkey } from "../../connections/valkey.js";

const PREFIX_PROBE = "{poe}:probe";
const PREFIX_MAP_E2P = "{poe}:map:e2p"; // Endpoint -> Policy
const PREFIX_MAP_P2R = "{poe}:map:p2r"; // Policy -> Rules
const PREFIX_CONFIG_RULE = "{poe}:config:rule";
const PREFIX_LIMITS = "{poe}:limits";
const PREFIX_BLOCK = "{poe}:block";

export interface PoeLimiterOptions {
  hitCountBuffer?: number;
  hitTimingBuffer?: number;
  publicIp?: string;
}

interface PolicyMapping {
  policy: string;
  rules: string[];
}

/**
 * CHECK SCRIPT
 * Inputs: unique_id, cost, count_buffer, timing_buffer, probe_key, ...scoped_rule_names
 */
const LUA_CHECK_SCRIPT = `
local time = redis.call('TIME')
local now = (tonumber(time[1]) * 1000) + math.floor(tonumber(time[2]) / 1000)

local unique_id = table.remove(ARGV, 1)
local cost = tonumber(table.remove(ARGV, 1))
local count_buffer = tonumber(table.remove(ARGV, 1)) or 0
local timing_buffer = tonumber(table.remove(ARGV, 1)) or 0
local probe_key = table.remove(ARGV, 1)

local cjson = cjson
local max_delay = 0
local needs_probe = false
local parsed_limits = {}

-- If no rules were passed, we immediately enter probe mode
if #ARGV == 0 then
    needs_probe = true
end

-- 1. ITERATE RULES (CHECK PHASE)
for i, scoped_rule in ipairs(ARGV) do
    
    -- A. Check Bans
    local block_key = "${PREFIX_BLOCK}:" .. scoped_rule
    local block_ttl = redis.call("PTTL", block_key)
    
    if block_ttl == -1 then
        max_delay = math.max(max_delay, 3600000) -- 1 hour fallback for perma-bans
    elseif block_ttl > 0 then
        max_delay = math.max(max_delay, block_ttl + timing_buffer)
    end

    -- B. Fetch Config
    local config_key = "${PREFIX_CONFIG_RULE}:" .. scoped_rule
    local config_json = redis.call("GET", config_key)
    
    if not config_json then
        needs_probe = true
        break
    end

    local status, limits = pcall(cjson.decode, config_json)
    if not status or #limits == 0 then
        needs_probe = true
        break
    end
    
    parsed_limits[scoped_rule] = limits

    -- C. Check Limits
    for _, pair in ipairs(limits) do
        local raw_limit = tonumber(pair[1])
        local window = tonumber(pair[2])
        
        local limit = math.max(1, raw_limit - count_buffer)
        local key = "${PREFIX_LIMITS}:" .. scoped_rule .. ":" .. window
        
        redis.call("ZREMRANGEBYSCORE", key, 0, now - (window * 1000))
        local current_hits = redis.call("ZCARD", key)
        
        if current_hits + cost > limit then
            local oldest = redis.call("ZRANGE", key, 0, 0, "WITHSCORES")
            local oldest_time = tonumber(oldest[2]) or now 
            local wait_time = (oldest_time + (window * 1000)) - now
            
            if wait_time > 0 then wait_time = wait_time + timing_buffer end
            max_delay = math.max(max_delay, wait_time)
        end
    end
end

-- 2. HANDLE PROBING
if needs_probe then
    local is_locked = redis.call("GET", probe_key)
    if is_locked then
        -- Someone else is probing, wait for them
        return math.max(max_delay, 1500)
    else
        -- Acquire probe lock and allow THIS request through to fetch headers
        redis.call("SET", probe_key, "1", "NX", "PX", 10000)
        return 0
    end
end

if max_delay > 0 then return max_delay end

-- 3. COMMIT PHASE (Only if max_delay == 0 and not probing)
for i, scoped_rule in ipairs(ARGV) do
    local limits = parsed_limits[scoped_rule]
    for _, pair in ipairs(limits) do
        local window = tonumber(pair[2])
        local key = "${PREFIX_LIMITS}:" .. scoped_rule .. ":" .. window
        
        redis.call("ZADD", key, now, unique_id) 
        redis.call("PEXPIRE", key, window * 1000) 
    end
end

return 0
`;

/**
 * SYNC SCRIPT (Fixed backwards distribution)
 */
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
    local time_step = (window * 1000) / diff
    
    for j = 1, diff do
        local fake_time = now - math.floor(time_step * j)
        redis.call("ZADD", key, fake_time, "sync:" .. now .. ":" .. j)
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

  // Local cache so we don't query policy mapping every single request
  private mappingCache = new Map<string, PolicyMapping>();

  constructor(options: PoeLimiterOptions = {}) {
    this.hitCountBuffer = options.hitCountBuffer ?? 0;
    this.hitTimingBuffer = options.hitTimingBuffer ?? 0;

    if (options.publicIp) {
      this.clientIp = options.publicIp;
    }

    this.registerScripts();
  }

  private registerScripts() {
    // @ts-expect-error - Dynamic command check
    if (typeof valkey.checkPoeLimits !== "function") {
      valkey.defineCommand("checkPoeLimits", {
        numberOfKeys: 0,
        lua: LUA_CHECK_SCRIPT,
      });
    }
    // @ts-expect-error - Dynamic command check
    if (typeof valkey.syncPoeState !== "function") {
      valkey.defineCommand("syncPoeState", {
        numberOfKeys: 1,
        lua: LUA_SYNC_SCRIPT,
      });
    }
    // @ts-expect-error - Dynamic command check
    if (typeof valkey.rollbackPoeHit !== "function") {
      valkey.defineCommand("rollbackPoeHit", {
        numberOfKeys: 0,
        lua: LUA_ROLLBACK_SCRIPT,
      });
    }
  }

  /**
   * Generates the fully scoped key name: {policy}:{rule}:{detail}
   */
  private getScopedRuleName(
    policyName: string,
    ruleName: string,
    details: Record<string, string>,
  ): string {
    const scope =
      ruleName in details ? `${ruleName}:${details[ruleName]}` : ruleName;
    return `${policyName}:${scope}`;
  }

  /**
   * Helper to resolve the endpoint -> policy -> rules mapping.
   */
  private async getPolicyMapping(
    endpointName: string,
  ): Promise<PolicyMapping | null> {
    if (this.mappingCache.has(endpointName)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return this.mappingCache.get(endpointName)!;
    }

    const policy = await valkey.get(`${PREFIX_MAP_E2P}:${endpointName}`);
    if (!policy) {
      return null;
    }

    const rules = await valkey.smembers(`${PREFIX_MAP_P2R}:${policy}`);
    if (rules.length === 0) {
      return null;
    }

    const mapping = { policy, rules };
    this.mappingCache.set(endpointName, mapping);
    return mapping;
  }

  async updateRules(
    endpointName: string,
    ruleDetails: Record<string, string>,
    headers: Headers,
  ) {
    const policyHeader = headers.get("x-rate-limit-policy");
    const rulesHeader = headers.get("x-rate-limit-rules");

    const probeKey = `${PREFIX_PROBE}:${endpointName}`;

    if (!policyHeader || !rulesHeader) {
      // Failsafe: Clear probe lock if we hit a 404/500 without headers
      await valkey.del(probeKey);
      return;
    }

    const policyName = policyHeader.toLowerCase().trim();
    const ruleNames = rulesHeader
      .toLowerCase()
      .split(",")
      .map((s) => s.trim());

    // Sync current hits state first
    await this.updateState(endpointName, ruleDetails, headers);

    const transaction = valkey.multi();

    // Store Mappings
    transaction.set(`${PREFIX_MAP_E2P}:${endpointName}`, policyName);
    transaction.del(`${PREFIX_MAP_P2R}:${policyName}`);
    transaction.sadd(`${PREFIX_MAP_P2R}:${policyName}`, ...ruleNames);

    // Always clear the endpoint probe lock on success
    transaction.del(probeKey);

    for (const ruleName of ruleNames) {
      const limitHeader = headers.get(`x-rate-limit-${ruleName}`);
      if (!limitHeader) {
        continue;
      }

      try {
        const parsedRules = limitHeader
          .split(",")
          .map((part) => part.split(":").map(Number));
        if (parsedRules.length > 0) {
          const scopedRule = this.getScopedRuleName(
            policyName,
            ruleName,
            ruleDetails,
          );
          const configKey = `${PREFIX_CONFIG_RULE}:${scopedRule}`;
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

    // Update local cache
    this.mappingCache.set(endpointName, {
      policy: policyName,
      rules: ruleNames,
    });
  }

  async updateState(
    endpointName: string,
    ruleDetails: Record<string, string>,
    headers: Headers,
  ) {
    const policyHeader = headers.get("x-rate-limit-policy");
    const rulesHeader = headers.get("x-rate-limit-rules");

    if (!policyHeader || !rulesHeader) {
      return;
    }

    const policyName = policyHeader.toLowerCase().trim();
    const ruleNames = rulesHeader
      .toLowerCase()
      .split(",")
      .map((s) => s.trim());
    const pipeline = valkey.pipeline();

    for (const ruleName of ruleNames) {
      const stateHeader = headers.get(`x-rate-limit-${ruleName}-state`);
      if (!stateHeader) {
        continue;
      }

      const scopedRule = this.getScopedRuleName(
        policyName,
        ruleName,
        ruleDetails,
      );

      try {
        const states = stateHeader.split(",");
        for (const part of states) {
          const segments = part.split(":").map(Number);
          const serverCount = segments[0];
          const period = segments[1];
          const banDuration = segments[2];

          if (banDuration && banDuration > 0) {
            const blockKey = `${PREFIX_BLOCK}:${scopedRule}`;
            pipeline.set(blockKey, "1", "PX", banDuration * 1000);
          }

          const key = `${PREFIX_LIMITS}:${scopedRule}:${period}`;

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
    ruleDetails: Record<string, string>,
    jobId: string,
  ): Promise<number> {
    const cost = 1;
    const probeKey = `${PREFIX_PROBE}:${endpointName}`;
    const mapping = await this.getPolicyMapping(endpointName);

    const scopedRuleNames: string[] = [];

    // If we have a mapped policy, we construct the scoped names.
    // If we don't, the array remains empty, signaling the Lua script to PROBE.
    if (mapping) {
      for (const rule of mapping.rules) {
        scopedRuleNames.push(
          this.getScopedRuleName(mapping.policy, rule, ruleDetails),
        );
      }
    }

    const scriptArgs: (string | number)[] = [
      jobId,
      cost,
      this.hitCountBuffer,
      this.hitTimingBuffer,
      probeKey,
      ...scopedRuleNames,
    ];

    // @ts-expect-error - Dynamic command
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const result = (await valkey.checkPoeLimits(...scriptArgs)) as number;
    return result;
  }

  async rollbackSlot(
    endpointName: string,
    ruleDetails: Record<string, string>,
    jobId: string,
  ): Promise<void> {
    const probeKey = `${PREFIX_PROBE}:${endpointName}`;
    await valkey.del(probeKey); // Always release lock on failure

    const mapping = await this.getPolicyMapping(endpointName);
    if (!mapping) {
      return;
    } // Can't rollback if we never learned the policy

    const configKeys = mapping.rules.map(
      (r) =>
        `${PREFIX_CONFIG_RULE}:${this.getScopedRuleName(mapping.policy, r, ruleDetails)}`,
    );

    const configs = await valkey.mget(...configKeys);
    const targetKeys: string[] = [];

    for (let i = 0; i < mapping.rules.length; i++) {
      const scopedName = this.getScopedRuleName(
        mapping.policy,
        mapping.rules[i],
        ruleDetails,
      );
      const configStr = configs[i];
      let parsed: number[][] = [];

      if (configStr) {
        try {
          parsed = JSON.parse(configStr) as number[][];
        } catch {
          /* ignore */
        }
      } else if (mapping.rules[i] === "ip") {
        parsed = [[20, 5]]; // Fallback assumption
      }

      for (const pair of parsed) {
        targetKeys.push(`${PREFIX_LIMITS}:${scopedName}:${pair[1]}`);
      }
    }

    if (targetKeys.length === 0) {
      return;
    }

    // @ts-expect-error - Dynamic command
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await valkey.rollbackPoeHit(jobId, ...targetKeys);
  }
}
