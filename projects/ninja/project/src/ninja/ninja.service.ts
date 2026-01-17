/* eslint-disable @typescript-eslint/require-await */
import {
  ApiEndpoint,
  ApiRequest,
  ApiResponse,
} from "@meepen/poe-accountant-api";
import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";

@Injectable()
export class NinjaService {
  public async getItemPrice(
    _request: ApiRequest<ApiEndpoint.PriceItemRequest>,
  ): Promise<ApiResponse<ApiEndpoint.PriceItemRequest>> {
    return {
      searchId: randomUUID(),
    };
  }

  public async getTabPrice(
    _request: ApiRequest<ApiEndpoint.PriceTabRequest>,
  ): Promise<ApiResponse<ApiEndpoint.PriceTabRequest>> {
    return {
      searchId: randomUUID(),
    };
  }

  public async getItemPriceResult(
    _request: ApiRequest<ApiEndpoint.PriceItemResult>,
  ): Promise<ApiResponse<ApiEndpoint.PriceItemResult>> {
    return {
      completed: false,
    };
  }

  public async getTabPriceResult(
    _request: ApiRequest<ApiEndpoint.PriceTabResult>,
  ): Promise<ApiResponse<ApiEndpoint.PriceTabResult>> {
    return {
      completed: false,
    };
  }
}
