import type z from "zod";
import type { ApiEndpoint } from "./api-endpoints.js";

export class ApiError extends Error {
  public readonly name = "ApiError";

  constructor(
    message: string,
    public readonly status: number,
    public readonly statusText: string,
    public readonly response: string,
  ) {
    super(message);
  }
}

type ApiRouteParamKey<T extends string> =
  T extends `${infer _Start}:${infer Param}/${infer Rest}`
    ? Param | ApiRouteParamKey<Rest>
    : T extends `${infer _Start}:${infer Param}`
      ? Param
      : never;

type ApiRouteParamData<T extends string> = {
  [K in ApiRouteParamKey<T>]: string;
};

type ArgumentsForEndpoint<
  T extends (typeof ApiEndpoint)[keyof typeof ApiEndpoint],
> = [
  ...(ApiRouteParamData<T["path"]> extends infer ParamData
    ? keyof ParamData extends never
      ? []
      : [params: ParamData]
    : []),
  ...(T["inputSchema"] extends z.ZodNever
    ? []
    : [data: z.infer<T["inputSchema"]>]),
];

export class ApiService {
  constructor(
    public readonly baseUrl: URL,
    private readonly fetcher = fetch,
  ) {}

  async request<T extends (typeof ApiEndpoint)[keyof typeof ApiEndpoint]>(
    endpoint: T,
    ...data: ArgumentsForEndpoint<T>
  ): Promise<z.infer<T["outputSchema"]>> {
    const split = endpoint.path.split("/");
    const hasParams = split.some((part) => part.startsWith(":"));

    const params = split
      .map((part) => {
        if (!part.startsWith(":")) {
          return part;
        }
        const paramName = part.slice(1) as keyof ApiRouteParamData<T["path"]>;
        const paramValue = (data[0] as Partial<ApiRouteParamData<T["path"]>>)[
          paramName
        ];
        if (paramValue == null) {
          throw new Error(`Missing parameter value for ${paramName}`);
        }
        return encodeURIComponent(paramValue);
      })
      .join("/");

    const dataContent = hasParams ? data.slice(1) : data;
    const method = endpoint.method;

    const response = await this.fetcher(new URL(params, this.baseUrl), {
      method,
      credentials: "include",
      ...(dataContent.length > 0
        ? {
            body: JSON.stringify(dataContent[0]),
            headers: { "Content-Type": "application/json" },
          }
        : {}),
    });

    if (!response.ok) {
      throw new ApiError(
        `Request failed with status ${response.status}`,
        response.status,
        response.statusText,
        await response.text(),
      );
    }

    return (await endpoint.outputSchema.parseAsync(
      await response.json(),
    )) as z.infer<T["outputSchema"]>;
  }
}
