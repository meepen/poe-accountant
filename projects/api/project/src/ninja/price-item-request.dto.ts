import { Item } from "@meepen/poe-common";
import { Type } from "class-transformer";
import { IsString } from "class-validator";

export class PriceItemRequest {
  @Type(() => Item)
  item!: Item;

  @IsString()
  leagueId!: string;

  @IsString()
  realm!: string;
}
