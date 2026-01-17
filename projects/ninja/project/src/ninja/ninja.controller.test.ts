import { describe, beforeEach, it, expect } from "vitest";

import { Test, TestingModule } from "@nestjs/testing";
import { NinjaController } from "./ninja.controller.js";
import {
  NinjaServiceMock,
  NinjaServiceMockImpl,
} from "./ninja.service.mock.js";
import { PriceItemRequestDto } from "../dto/price-item-request.dto.js";
import { PriceItemResponseDto } from "../dto/price-item-response.dto.js";

describe("NinjaController", () => {
  let appController: NinjaController;
  let ninjaServiceMock: NinjaServiceMockImpl;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [NinjaController],
      providers: [NinjaServiceMock],
    }).compile();

    appController = app.get<NinjaController>(NinjaController);
    ninjaServiceMock = app.get<NinjaServiceMockImpl>(NinjaServiceMock.provide);
  });

  describe("requestItemPrice", () => {
    it("should call NinjaService.getItemPrice", async () => {
      const mockRequest = new PriceItemRequestDto();
      const mockResponse = new PriceItemResponseDto();

      ninjaServiceMock.getItemPrice.mockResolvedValue(mockResponse);

      const result = await appController.requestItemPrice(mockRequest);
      expect(result).toEqual(mockResponse);
      expect(ninjaServiceMock.getItemPrice).toHaveBeenCalledWith(mockRequest);
    });
  });
});
