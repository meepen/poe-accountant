import { type ServerApi } from "@meepen/poe-common/api";
import { BasePoeApi } from "./base-poe-api.js";

export class UserPoeApi extends BasePoeApi {
  public static readonly instances = new Map<string, UserPoeApi>();

  public static getOrCreate(
    sub: string,
    accessToken: string,
    scope: string,
  ): UserPoeApi {
    const existing = UserPoeApi.instances.get(sub);

    if (existing) {
      existing.updateCredentials(accessToken, scope);
      return existing;
    }

    const created = new UserPoeApi(sub, accessToken, scope);
    UserPoeApi.instances.set(sub, created);
    return created;
  }

  private scopes = new Set<string>();

  private constructor(
    private readonly sub: string,
    private accessToken: string,
    scope: string,
  ) {
    super();
    this.updateCredentials(accessToken, scope);
  }

  private updateCredentials(accessToken: string, scope: string): void {
    this.accessToken = accessToken;
    this.scopes = new Set(
      scope
        .split(" ")
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    );
    this.authTokenMap.set(accessToken, this.sub);
  }

  protected override userAgent = this.getBaseUserAgent(
    `background-processor/${UserPoeApi.name}`,
  );

  protected override authenticate(endpointData: ServerApi): string {
    const requiredScope = endpointData.requiredScope;

    if (!this.scopes.has(requiredScope)) {
      throw new Error(
        `Missing required scope '${requiredScope}' for user '${this.sub}'.`,
      );
    }

    return this.accessToken;
  }

  protected override voidAuthentication(_endpointData: ServerApi): void {
    UserPoeApi.instances.delete(this.sub);
  }

  protected override getRequestAccountSub(
    _endpointData: ServerApi,
    _headers: Headers,
  ): string {
    return this.sub;
  }
}
