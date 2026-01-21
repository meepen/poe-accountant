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

export class ApiService {
  constructor(public readonly baseUrl: URL) {}

  async request<T extends ApiEndpoint>(
    endpoint: T,
    ...data: ApiResultResponseData<T>[0] extends object
      ? [data: ApiResultResponseData<T>[0]]
      : []
  ): Promise<ApiResultResponseData<T>[1]> {
    const response = await fetch(new URL(endpoint, this.baseUrl), {
      method: ApiEndpointMethods[endpoint],
      credentials: "include",
      ...(data.length > 0
        ? {
            body: JSON.stringify(data[0]),
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
