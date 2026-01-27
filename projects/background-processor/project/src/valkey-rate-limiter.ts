import type { RateLimitBackend } from "@meepen/poe-common/api";
import type { Redis } from "ioredis";

export class ValkeyRateLimitBackend implements RateLimitBackend {
  constructor(
    private readonly valkey: Redis,
    private readonly key: string,
  ) {}

  async update(
    max: number,
    period: number,
    restriction: number,
  ): Promise<void> {
    await this.valkey.hmset(this.key, {
      max,
      period,
      restriction,
    });
  }

  async setCurrent(
    current: number,
    activePeriod: number,
    activeRestriction: number,
  ): Promise<void> {
    await this.valkey.hmset(this.key, {
      current,
      activePeriod,
      activeRestriction,
      lastUpdate: Date.now(),
      // When we sync with server state, we assume server 'current' includes handled requests.
      // But 'pending' are requests in flight that haven't returned.
      // We don't touch pending here.
    });
  }

  async getWaitTime(now: number, additionalDelay: number): Promise<number> {
    const data = await this.valkey.hgetall(this.key);

    // Parse everything or default to 0
    const max = Number(data.max || 0);
    const period = Number(data.period || 0);
    const current = Number(data.current || 0);
    const activeRestriction = Number(data.activeRestriction || 0);
    const pending = Number(data.pending || 0);
    const lastUpdate = Number(data.lastUpdate || 0);

    const timeSinceUpdate = Math.max(0, now - lastUpdate);

    if (activeRestriction > 0) {
      const banWait = activeRestriction * 1000 - timeSinceUpdate;
      return Math.max(0, banWait) + additionalDelay;
    }

    if (current + pending < max) {
      return 0; // Available
    }

    // Capacity full
    const resetTime = period * 1000;
    const waitTime = resetTime - timeSinceUpdate;
    return Math.max(0, waitTime) + additionalDelay;
  }

  async tryReserve(now: number): Promise<boolean> {
    // Lua script for atomic check-and-increment
    const script = `
      local key = KEYS[1]
      local now = tonumber(ARGV[1])
      
      local max = tonumber(redis.call('HGET', key, 'max') or 0)
      local current = tonumber(redis.call('HGET', key, 'current') or 0)
      local pending = tonumber(redis.call('HGET', key, 'pending') or 0)
      local activeRestriction = tonumber(redis.call('HGET', key, 'activeRestriction') or 0)
      local lastUpdate = tonumber(redis.call('HGET', key, 'lastUpdate') or 0)
      
      -- Check ban
      if activeRestriction > 0 then
        local timeSinceUpdate = math.max(0, now - lastUpdate)
        local banWait = (activeRestriction * 1000) - timeSinceUpdate
        if banWait > 0 then
          return 0 -- Banned
        end
      end

      if (current + pending) < max then
        redis.call('HINCRBY', key, 'pending', 1)
        return 1
      end
      
      return 0
    `;

    const result = await this.valkey.eval(script, 1, this.key, now);
    return result === 1;
  }

  async release(success: boolean): Promise<void> {
    if (success) {
      // pending--, current++
      const script = `
        local key = KEYS[1]
        redis.call('HINCRBY', key, 'pending', -1)
        redis.call('HINCRBY', key, 'current', 1)
      `;
      await this.valkey.eval(script, 1, this.key);
    } else {
      // pending--
      await this.valkey.hincrby(this.key, "pending", -1);
    }
  }
}
