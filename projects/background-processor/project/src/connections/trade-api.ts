import z from "zod";
import { getEnvVar } from "../utils.js";

const StaticTradeDataSchema = z.object({
  result: z.array(
    z.object({
      id: z.string(),
      label: z.string().nullable(),
      entries: z.array(
        z.object({
          id: z.string(),
          text: z.string(),
          image: z.string().optional(),
        }),
      ),
    }),
  ),
});

export type StaticTradeData = z.infer<typeof StaticTradeDataSchema>;

export class TradeApi {
  protected readonly baseUrl = new URL(
    "https://www.pathofexile.com/api/trade/",
  );

  private readonly userAgent = `${getEnvVar("PATHOFEXILE_CLIENT_ID")}/${getEnvVar("PATHOFEXILE_APP_VERSION")} (contact: ${getEnvVar("PATHOFEXILE_CONTACT_EMAIL")}) background-processor/${TradeApi.name}`;

  protected fetch(
    input: string | URL | Request,
    init?: RequestInit,
  ): Promise<Response> {
    if (init) {
      init.headers = new Headers(init.headers);
      init.headers.append("User-Agent", this.userAgent);
    } else {
      init = {
        headers: {
          "User-Agent": this.userAgent,
        },
      };
    }
    return fetch(input, init);
  }

  public async getStaticData(): Promise<StaticTradeData> {
    const response = await this.fetch(new URL("data/static", this.baseUrl));

    if (!response.ok) {
      throw new Error(
        `Failed to fetch static trade data with status ${response.status}: ${response.statusText}`,
      );
    }

    return StaticTradeDataSchema.parse(await response.json());
  }
}
