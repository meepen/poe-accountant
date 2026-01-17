import { IsNumber, IsString, validate } from "class-validator";
import { describe, it, expect } from "vitest";

import { IsAny } from "./is-any.js";
import { plainToInstance } from "class-transformer";

describe("IsAny", () => {
  it("should validate against multiple validators", async () => {
    class TestClass {
      @IsAny([[IsString()], [IsNumber()]])
      field!: number | string;
    }

    const instance = plainToInstance(TestClass, { field: "test" });

    const errors = await validate(instance);
    expect(errors).toStrictEqual([]);
  });

  it("should fail validation if no validators match", async () => {
    class TestClass {
      @IsAny([[IsString()], [IsNumber()]])
      field!: boolean;
    }

    const instance = plainToInstance(TestClass, { field: true });

    const errors = await validate(instance);
    expect(errors.length).toBe(1);
  });

  it("should validate against the second validator if the first fails", async () => {
    class TestClass {
      @IsAny([[IsString()], [IsNumber()]])
      field!: number | string;
    }

    const instance = plainToInstance(TestClass, { field: 123 });

    const errors = await validate(instance);
    expect(errors).toStrictEqual([]);
  });
});
