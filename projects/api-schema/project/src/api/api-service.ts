import { ApiEndpoint, ApiEndpointMethods } from "./api-endpoints.enum.js";
import {
  ApiResultResponseData,
  ApiResultResponseTypes,
} from "./api-request-data.dto.js";

export class ApiService {
  constructor(private readonly baseUrl: URL) {}

  async request<T extends ApiEndpoint>(
    endpoint: T,
    data: ApiResultResponseData<T>[0],
  ): Promise<ApiResultResponseData<T>[1]> {
    const response = await fetch(new URL(endpoint, this.baseUrl), {
      method: ApiEndpointMethods[endpoint],
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`, {
        cause: {
          status: response.status,
          statusText: response.statusText,
          response: await response.text(),
        },
      });
    }

    return (await ApiResultResponseTypes[endpoint][1].parseAsync(
      await response.json(),
    )) as ApiResultResponseData<T>[1];
  }
}
