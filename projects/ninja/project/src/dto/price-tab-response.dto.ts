import { PriceTabResponse } from "@meepen/poe-accountant-api";
import { ApiProperty } from "@nestjs/swagger";

export class PriceTabResponseDto extends PriceTabResponse {
  @ApiProperty()
  declare searchId: string;
}
