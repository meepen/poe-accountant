import { IsString } from "class-validator";

export class PriceTabResultRequest {
  @IsString()
  searchId!: string;
}
