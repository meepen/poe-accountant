import { ApiEndpoint, ApiEndpointMethods } from "./api-endpoints.enum.js";
import {
  ApiResultResponseData,
  ApiResultResponseTypes,
} from "./api-request-data.dto.js";

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

type ArgumentsForEndpoint<T extends ApiEndpoint> = [
  ...(ApiRouteParamData<T> extends infer ParamData
    ? keyof ParamData extends never
      ? []
      : [params: ParamData]
    : []),
  ...(ApiResultResponseData<T>[0] extends object
    ? [data: ApiResultResponseData<T>[0]]
    : []),
];

export class ApiService {
  constructor(
    public readonly baseUrl: URL,
    private readonly fetcher = fetch,
  ) {}

  async request<T extends ApiEndpoint>(
    endpoint: T,
    ...data: ArgumentsForEndpoint<T>
  ): Promise<ApiResultResponseData<T>[1]> {
    const split = endpoint.split("/");
    const hasParams = split.some((part) => part.startsWith(":"));

    const params = split
      .map((part) => {
        if (!part.startsWith(":")) {
          return part;
        }
        const paramName = part.slice(1) as keyof ApiRouteParamData<T>;
        const paramValue = (data[0] as Partial<ApiRouteParamData<T>>)[
          paramName
        ];
        if (paramValue == null) {
          throw new Error(`Missing parameter value for ${paramName}`);
        }
        return encodeURIComponent(paramValue);
      })
      .join("/");

    const dataContent = hasParams ? data.slice(1) : data;

    const response = await this.fetcher(new URL(params, this.baseUrl), {
      method: ApiEndpointMethods[endpoint],
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

    return (await ApiResultResponseTypes[endpoint][1].parseAsync(
      await response.json(),
    )) as ApiResultResponseData<T>[1];
  }
}
