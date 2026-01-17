import {
  IsEnum,
  IsArray,
  MinLength,
  MaxLength,
  IsNumber,
  Max,
  Min,
} from "class-validator";
import { Currency } from "./currency.enum.js";

export class Price {
  @IsEnum(Currency)
  currency!: Currency;

  @IsArray()
  @MinLength(2)
  @MaxLength(2)
  @IsNumber({}, { each: true })
  @Max(1, { each: true })
  @Min(0, { each: true })
  // Represents a fractional value as [numerator, denominator]
  fractional!: [number, number];
}
