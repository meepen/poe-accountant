import { ItemPrice, PriceTabResultResponse } from "@meepen/poe-accountant-api";
import { ApiProperty } from "@nestjs/swagger";
import { PriceDto } from "./price.dto.js";
import { Item } from "@meepen/poe-common";

class ItemPriceDto extends ItemPrice {
  @ApiProperty()
  declare price: PriceDto;

  @ApiProperty()
  declare item: Item;
}

export class PriceTabResultResponseDto extends PriceTabResultResponse {
  @ApiProperty()
  declare completed: boolean;

  @ApiProperty({
    isArray: true,
  })
  declare prices?: ItemPriceDto[];
}
