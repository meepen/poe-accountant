import { IsString } from "class-validator";

export class PriceItemResponse {
  @IsString()
  searchId!: string;
}
