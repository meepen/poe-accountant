import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { PricedItem } from "./priced-item.dto.js";
import { Currency } from "../index.js";

describe("PricedItem DTO", () => {
  it("should fail validation if item is missing", async () => {
    const pricedItem = plainToInstance(PricedItem, <PricedItem>{
      price: {
        currency: Currency.Chaos,
        fractional: [1, 1],
      },
    });

    const errors = await validate(pricedItem);
    expect(errors.length).toBeGreaterThan(0);
  });
});
