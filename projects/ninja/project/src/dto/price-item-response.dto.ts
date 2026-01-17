import { PriceItemResponse } from "@meepen/poe-accountant-api";
import { ApiProperty } from "@nestjs/swagger";

export class PriceItemResponseDto extends PriceItemResponse {
  @ApiProperty()
  declare searchId: string;
}
