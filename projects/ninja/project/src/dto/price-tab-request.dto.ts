import { PriceTabRequest } from "@meepen/poe-accountant-api";
import { StashTab } from "@meepen/poe-common";
import { ApiProperty } from "@nestjs/swagger";

export class PriceTabRequestDto extends PriceTabRequest {
  @ApiProperty({
    description:
      "The league ID to request the price for. Refer to https://www.pathofexile.com/developer/docs/reference#type-League id",
  })
  declare leagueId: string;

  @ApiProperty({
    description:
      "The stash tab to request the price for. Refer to https://www.pathofexile.com/developer/docs/reference#type-StashTab",
  })
  declare stashTab: StashTab;
}
