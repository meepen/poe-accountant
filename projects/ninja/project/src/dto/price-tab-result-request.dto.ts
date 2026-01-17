import { PriceTabResultRequest } from "@meepen/poe-accountant-api";
import { ApiProperty } from "@nestjs/swagger";

export class PriceTabResultRequestDto extends PriceTabResultRequest {
  @ApiProperty()
  declare searchId: string;
}
