import { StashTab } from "@meepen/poe-common";
import { Type } from "class-transformer";
import { IsString } from "class-validator";

export class PriceTabRequest {
  @IsString()
  leagueId!: string;

  @IsString()
  realm!: string;

  @Type(() => StashTab)
  tab!: StashTab;
}
