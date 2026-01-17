import { Currency, Price } from "@meepen/poe-accountant-api";
import { ApiProperty } from "@nestjs/swagger";

export class PriceDto extends Price {
  @ApiProperty()
  declare currency: Currency;

  @ApiProperty()
  declare fractional: [number, number];
}
