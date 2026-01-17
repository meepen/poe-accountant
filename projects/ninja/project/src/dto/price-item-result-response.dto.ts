import { PriceItemResultResponse } from "@meepen/poe-accountant-api";
import { ApiProperty } from "@nestjs/swagger";
import { PriceDto } from "./price.dto.js";

export class PriceItemResultResponseDto extends PriceItemResultResponse {
  @ApiProperty()
  declare completed: boolean;

  @ApiProperty({ required: false })
  declare price?: PriceDto;
}
