import { IsString } from "class-validator";

export class PriceItemResultRequest {
  @IsString()
  searchId!: string;
}
