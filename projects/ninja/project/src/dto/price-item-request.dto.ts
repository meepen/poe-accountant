import { PriceItemRequest } from "@meepen/poe-accountant-api";
import { Item } from "@meepen/poe-common";
import { ApiProperty } from "@nestjs/swagger";

export class PriceItemRequestDto extends PriceItemRequest {
  @ApiProperty({
    description:
      "The item to request the price for. Refer to https://www.pathofexile.com/developer/docs/reference#type-Item",
  })
  declare item: Item;

  @ApiProperty({
    description:
      "The league ID to request the price for. Refer to https://www.pathofexile.com/developer/docs/reference#type-League id",
  })
  declare leagueId: string;
}
