import { Injectable } from "@nestjs/common";
import { PriceItemRequestDto } from "../dto/price-item-request.dto.js";

@Injectable()
export class NinjaProcessorService {
  public processItemRequest(_itemRequest: PriceItemRequestDto) {}
}
