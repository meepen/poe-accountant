import { type ServerApi } from "@meepen/poe-common/api";
import { getEnvVar } from "../utils.js";
import { BasePoeApi } from "./base-poe-api.js";

class ApplicationPoeApi extends BasePoeApi {
  private readonly authScopes = new Map<string, Promise<string>>();

  protected override userAgent = this.getBaseUserAgent(
    `background-processor/${ApplicationPoeApi.name}`,
  );

  protected override authenticate(endpointData: ServerApi): Promise<string> {
    const authPromise = this.authScopes.get(endpointData.requiredScope);
    if (authPromise) {
      return authPromise;
    }

    const headers = {
      "User-Agent": this.userAgent,
      "Content-Type": "application/x-www-form-urlencoded",
    };

    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: getEnvVar("PATHOFEXILE_CLIENT_ID"),
      client_secret: getEnvVar("PATHOFEXILE_CLIENT_SECRET"),
      scope: endpointData.requiredScope,
    });

    const newAuthPromise = fetch("https://www.pathofexile.com/oauth/token", {
      method: "POST",
      headers,
      body,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Authentication failed with status ${response.status}: ${response.statusText}`,
          );
        }
        return response.json() as Promise<{
          access_token: string;
          sub: string;
          [key: string]: unknown;
        }>;
      })
      .then((data) => {
        this.authTokenMap.set(data.access_token, data.sub);
        return data.access_token;
      })
      .catch((err: unknown) => {
        this.authScopes.delete(endpointData.requiredScope);
        throw err;
      });

    this.authScopes.set(endpointData.requiredScope, newAuthPromise);

    return newAuthPromise;
  }

  protected override voidAuthentication(endpointData: ServerApi): void {
    this.authScopes.delete(endpointData.requiredScope);
  }

  protected override getRequestAccountSub(
    _endpointData: ServerApi,
    headers: Headers,
  ): string | undefined {
    const bearer = headers.get("Authorization");

    if (!bearer?.startsWith("Bearer ")) {
      return undefined;
    }

    const accessToken = bearer.substring("Bearer ".length);
    return this.authTokenMap.get(accessToken);
  }
}

export const appApi = new ApplicationPoeApi();
export const realms = ["pc"] as const;
