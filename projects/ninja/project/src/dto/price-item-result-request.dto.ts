import { PriceItemResultRequest } from "@meepen/poe-accountant-api";
import { ApiProperty } from "@nestjs/swagger";

export class PriceItemResultRequestDto extends PriceItemResultRequest {
  @ApiProperty()
  declare searchId: string;
}
