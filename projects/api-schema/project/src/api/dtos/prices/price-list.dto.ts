import { z } from "zod";
import { PriceRelativeToDto } from "./price-relative-to.dto.js";

export const PriceListDto = z.array(
  z.object({
    currency: z.string(),
    value: PriceRelativeToDto,
    confidenceScore: z.number(),
  }),
);
