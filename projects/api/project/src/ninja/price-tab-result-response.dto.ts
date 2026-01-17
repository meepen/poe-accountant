import {
  IsArray,
  IsBoolean,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { Price } from "./price.dto.js";
import { Item } from "@meepen/poe-common";

export class ItemPrice {
  @ValidateNested()
  @Type(() => Price)
  price!: Price;

  @ValidateNested()
  @Type(() => Item)
  item!: Item;
}

export class PriceTabResultResponse {
  @IsBoolean()
  completed!: boolean;

  @ValidateIf((o: PriceTabResultResponse) => o.completed)
  @Type(() => ItemPrice)
  @IsArray()
  @ValidateNested({ each: true })
  prices?: ItemPrice[];
}
