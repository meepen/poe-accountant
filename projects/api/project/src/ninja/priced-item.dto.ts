import { Item } from "@meepen/poe-common";
import { Type } from "class-transformer";
import { Price } from "./price.dto.js";
import { ValidateNested } from "class-validator";

export class PricedItem {
  @ValidateNested()
  @Type(() => Item)
  item!: Item;

  @ValidateNested()
  @Type(() => Price)
  price!: Price;
}
