import { IsString } from "class-validator";

export class PriceTabResponse {
  @IsString()
  searchId!: string;
}
