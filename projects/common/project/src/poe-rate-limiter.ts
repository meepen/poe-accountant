import type { serverApiPaths } from "./poe.gen.js";

type ServerApiPathKey = keyof typeof serverApiPaths;
type ServerApiPath = (typeof serverApiPaths)[ServerApiPathKey];

export interface PoeRateLimiterOptions {
  /**
   * The additionalDelayMs defines how much extra delay to add on top of
   * what is calculated from the rate limit headers.
   */
  additionalDelayMs: number;

  /**
   * The extraRuleThreshold defines how many hits you go under what is reported as maximum
   * before you are considered restricted by that rule.
   */
  extraRuleThreshold: number;
}

export abstract class Rule {
  public constructor(
    public readonly name: string,
    protected readonly options: PoeRateLimiterOptions,
  ) {}

  public abstract updateState(
    maximumHitCount: number,
    periodTested: number,
    restrictionIfBrokenInSeconds: number,
  ): Promise<void> | void;

  public abstract updateCurrentState(
    currentHitCount: number,
    activePeriodTested: number,
    activeRestrictionTimeInSeconds: number,
  ): Promise<void> | void;

  public abstract getNextAvailableTime(): Promise<Date> | Date;
}

export abstract class Policy<RuleImpl extends Rule = Rule> {
  public abstract updateRuleSet(ruleNames: string[]): Promise<void> | void;

  public abstract getRules(): Promise<RuleImpl[]> | RuleImpl[];

  public abstract getNextAvailableTime(): Promise<Date> | Date;
}

export abstract class RateLimitManager<
  PolicyImpl extends Policy = Policy,
  RuleImpl extends Rule = Rule,
> {
  public abstract getRule(name: string): Promise<RuleImpl> | RuleImpl;
  public abstract getPolicy(name: string): Promise<PolicyImpl> | PolicyImpl;
}

export class LocalRule extends Rule {
  private maximumHitCount = 0;
  private periodTested = 0;
  private listOfSentTimestamps: Date[] = [];

  private nextAvailableTime = new Date();

  public override updateState(
    maximumHitCount: number,
    periodTested: number,
    _restrictionIfBrokenInSeconds: number,
  ): void {
    this.maximumHitCount = maximumHitCount;
    this.periodTested = periodTested;
  }

  public override updateCurrentState(
    currentHitCount: number,
    activePeriodTested: number,
    activeRestrictionTimeInSeconds: number,
  ): void {
    this.listOfSentTimestamps.push(new Date());
    this.listOfSentTimestamps.splice(
      0,
      Math.max(0, this.listOfSentTimestamps.length - currentHitCount),
    );

    this.nextAvailableTime.setTime(Date.now());

    // If we are currently restricted, set the next available time accordingly
    if (activeRestrictionTimeInSeconds > 0) {
      this.nextAvailableTime.setTime(
        this.nextAvailableTime.getTime() +
          activeRestrictionTimeInSeconds * 1000 +
          this.options.additionalDelayMs,
      );
      return;
    }

    if (
      currentHitCount + this.options.extraRuleThreshold <
      this.maximumHitCount
    ) {
      return;
    }

    // At this point we are close to the limit...
    // If we don't have the proper amount of timestamps, we can't calculate the next available time
    if (this.listOfSentTimestamps.length != currentHitCount) {
      this.nextAvailableTime.setTime(
        Date.now() + this.periodTested * 1000 + this.options.additionalDelayMs,
      );
      return;
    }

    // now we need to calculate when we can make the next request...
    this.nextAvailableTime.setTime(
      this.listOfSentTimestamps[0].getTime() +
        activePeriodTested * 1000 +
        this.options.additionalDelayMs,
    );
  }

  public override getNextAvailableTime(): Date {
    return this.nextAvailableTime;
  }
}

export class LocalPolicy extends Policy<LocalRule> {
  private rules: LocalRule[] = [];

  public constructor(
    public readonly name: string,
    public readonly ruleManager: LocalRuleManager,
  ) {
    super();
  }

  public override updateRuleSet(ruleNames: string[]): void {
    this.rules = ruleNames.map((ruleName) =>
      this.ruleManager.getRule(ruleName),
    );
  }

  public override getRules(): LocalRule[] {
    return this.rules;
  }

  public override getNextAvailableTime(): Date {
    // Check the latest available time for all rules
    return this.rules.reduce((latest, rule) => {
      const ruleNextTime = rule.getNextAvailableTime();
      return ruleNextTime > latest ? ruleNextTime : latest;
    }, new Date(0));
  }
}

export class LocalRuleManager extends RateLimitManager<LocalPolicy, LocalRule> {
  public constructor(private readonly options: PoeRateLimiterOptions) {
    super();
  }

  private readonly rulesMap = new Map<string, LocalRule>();
  private readonly policyMap = new Map<string, LocalPolicy>();

  public getRule(name: string): LocalRule {
    let rule = this.rulesMap.get(name);
    if (!rule) {
      rule = new LocalRule(name, this.options);
      this.rulesMap.set(name, rule);
    }
    return rule;
  }

  public getPolicy(name: string): LocalPolicy {
    let policy = this.policyMap.get(name);
    if (!policy) {
      policy = new LocalPolicy(name, this);
      this.policyMap.set(name, policy);
    }
    return policy;
  }
}

const defaultOptions: PoeRateLimiterOptions = {
  additionalDelayMs: 100,
  extraRuleThreshold: 5,
};

/**
 * A rate limiter for the Poe API. Each instance should only be used for a single client id / account id.
 */
export class PoeRateLimiter<PolicyImpl extends Policy, RuleImpl extends Rule> {
  private readonly options: PoeRateLimiterOptions;
  public readonly manager: RateLimitManager<PolicyImpl, RuleImpl>;

  public constructor(
    options: Partial<PoeRateLimiterOptions>,
    managerClass: new (
      options: PoeRateLimiterOptions,
    ) => RateLimitManager<PolicyImpl, RuleImpl>,
  ) {
    this.options = { ...defaultOptions, ...options };
    this.manager = new managerClass(this.options);
  }

  private apiPathToPolicyMap = new Map<ServerApiPath, PolicyImpl>();

  /**
   * Updates the rate limiter state based on the response headers from an API call.
   * @param apiPath The API path that was called.
   * @param responseHeaders The headers from the API response.
   * @param accountId Optional account ID associated with the request. This will apply to account-specific rate limits.
   * @returns A promise that resolves when the rate limiter state has been updated.
   */
  public async updateLimiter(
    apiPath: ServerApiPath,
    responseHeaders: Record<string, string>,
  ): Promise<void> {
    const lowerCaseHeaders = Object.fromEntries(
      Object.entries(responseHeaders).map(([key, value]) => [
        key.toLowerCase(),
        value,
      ]),
    );

    // Policy -> Rules -> Rule States
    const rateLimitPolicy = lowerCaseHeaders["x-rate-limit-policy"];
    if (!rateLimitPolicy) {
      return; // No rate limit info present
    }
    const policy = await this.manager.getPolicy(rateLimitPolicy);
    this.apiPathToPolicyMap.set(apiPath, policy);

    const rateLimitRules = (lowerCaseHeaders["x-rate-limit-rules"] ?? "")
      .split(",")
      .map((rule) => rule.trim().toLowerCase());
    if (rateLimitRules.length === 0) {
      return; // No rate limit info present
    }
    await policy.updateRuleSet(rateLimitRules);

    for (const rule of await policy.getRules()) {
      const ruleState = lowerCaseHeaders[`x-rate-limit-${rule.name}-state`];
      const ruleData = lowerCaseHeaders[`x-rate-limit-${rule.name}`];

      if (!ruleState || !ruleData) {
        throw new Error(`Missing rate limit headers for rule ${rule.name}`);
      }

      const [maximumHitCount, periodTested, restrictionIfBrokenInSeconds] =
        ruleData.split(":").map((part) => parseInt(part, 10));

      const [
        currentHitCount,
        activePeriodTested,
        activeRestrictionTimeInSeconds,
      ] = ruleState.split(":").map((part) => parseInt(part, 10));

      await rule.updateState(
        maximumHitCount,
        periodTested,
        restrictionIfBrokenInSeconds,
      );

      await rule.updateCurrentState(
        currentHitCount,
        activePeriodTested,
        activeRestrictionTimeInSeconds,
      );
    }
  }

  public async getNextAvailableTime(apiPath: ServerApiPath): Promise<Date> {
    const policy = this.apiPathToPolicyMap.get(apiPath);
    return (await policy?.getNextAvailableTime()) ?? new Date(0);
  }
}
