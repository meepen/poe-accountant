import { Expose, plainToInstance, Type } from "class-transformer";
import {
  IsArray,
  IsNumber,
  IsString,
  validate,
  ValidateNested,
} from "class-validator";
import {
  Dictionary,
  IsDictionary,
  TransformDictionary,
} from "./is-dictionary.js";

import { describe, it, expect } from "vitest";

describe("IsDictionary", () => {
  it("should validate a Dictionary<unknown> as a dictionary", async () => {
    class TestClass {
      @IsDictionary()
      testProperty!: Dictionary<unknown>;
    }
    const plain = {
      testProperty: {
        key1: "value1",
        key2: 42,
      },
    };
    const instance = plainToInstance(TestClass, plain);
    const errors = await validate(instance);

    expect(errors).toStrictEqual([]);
    expect(instance.testProperty).toEqual(plain.testProperty);
  });

  it("should validate a Dictionary<string> as a dictionary", async () => {
    class TestClass {
      @IsDictionary([IsString()])
      testProperty!: Dictionary<string>;
    }
    const plain = {
      testProperty: {
        key1: "value1",
        key2: "value2",
      },
    };
    const instance = plainToInstance(TestClass, plain);
    const errors = await validate(instance);

    expect(errors).toStrictEqual([]);
    expect(instance.testProperty).toEqual(plain.testProperty);
  });

  it("should fail validation for non-validated values", async () => {
    class TestClass {
      @IsDictionary([IsString()])
      testProperty!: Dictionary<string>;
    }
    const plain = {
      testProperty: {
        key1: "value1",
        key2: 42, // Non-string value
      },
    };
    const instance = plainToInstance(TestClass, plain);
    const errors = await validate(instance);

    expect(errors.length).toBeGreaterThan(0);
  });

  it("should pass validation for an empty dictionary", async () => {
    class TestClass {
      @IsDictionary([])
      testProperty!: Dictionary<unknown>;
    }
    const plain = {
      testProperty: {},
    };
    const instance = plainToInstance(TestClass, plain);
    const errors = await validate(instance);

    expect(errors).toStrictEqual([]);
  });

  it("should pass validation for an empty array of decorators", async () => {
    class TestClass {
      @IsDictionary([])
      testProperty!: Dictionary<unknown>;
    }
    const plain = {
      testProperty: {
        key1: "value1",
        key2: 42,
      },
    };
    const instance = plainToInstance(TestClass, plain);
    const errors = await validate(instance);

    expect(errors).toStrictEqual([]);
  });

  it("should fail on value validation", async () => {
    class TestClass {
      @IsDictionary([IsNumber()])
      testProperty!: Dictionary<number>;
    }
    const plain = {
      testProperty: {
        key1: "value1", // Non-number value
        key2: 42,
      },
    };
    const instance = plainToInstance(TestClass, plain);
    const errors = await validate(instance);

    expect(errors.length).toBeGreaterThan(0);
  });

  it("should successfully validate nested objects", async () => {
    class InnerType {
      @Expose()
      @IsString()
      field!: string;
    }
    class TestClass {
      @Type(() => Dictionary<InnerType>)
      @IsDictionary([])
      testProperty!: Dictionary<InnerType>;
    }

    const plain = {
      testProperty: {
        key1: { field: "value1" },
        key2: { field: "value2" },
      },
    };
    const instance = plainToInstance(TestClass, plain);
    const errors = await validate(instance);

    expect(errors).toStrictEqual([]);
    expect(instance.testProperty).toEqual(plain.testProperty);
  });

  it("should fail validation for nested objects with incorrect types", async () => {
    class InnerType {
      @Expose()
      @IsString()
      field!: string;
    }
    class TestClass {
      @IsDictionary([Type(() => InnerType)])
      testProperty!: Dictionary<InnerType>;
    }

    const plain = {
      testProperty: {
        key1: { field: "value1" },
        key2: { field: 42 }, // Incorrect type
      },
    };
    const instance = plainToInstance(TestClass, plain);
    const errors = await validate(instance);

    expect(errors.length).toBeGreaterThan(0);
  });
});

describe("Dictionary", () => {
  it("should transform inner types", () => {
    class InnerType {
      @Expose()
      field!: string;
    }
    class TestClass {
      @TransformDictionary(InnerType)
      @IsDictionary([])
      testProperty!: Dictionary<InnerType>;
    }

    const plain = {
      testProperty: {
        key1: { field: "value1" },
        key2: { field: "value2" },
      },
    };

    const instance = plainToInstance(TestClass, plain);

    expect(instance.testProperty).toBeInstanceOf(Dictionary);
    expect(instance.testProperty.key1).toBeInstanceOf(InnerType);
  });

  it("should transform inner type arrays", async () => {
    class InnerType {
      @Expose()
      @IsString()
      field!: string;
    }
    class TestClass {
      @TransformDictionary(() => InnerType)
      @IsDictionary([IsArray(), ValidateNested()])
      testProperty!: Dictionary<InnerType[]>;
    }

    const plain = {
      testProperty: {
        key1: [{ field: "value1" }],
        key2: [{ field: "value2" }],
      },
    };

    const instance = plainToInstance(TestClass, plain);
    const errors = await validate(instance);

    expect(errors).toStrictEqual([]);
    expect(instance.testProperty).toBeInstanceOf(Dictionary);
    expect(instance.testProperty.key1[0]).toBeInstanceOf(InnerType);
  });

  it("should validate inner type arrays", async () => {
    class InnerType {
      @Expose()
      @IsString()
      field!: string;
    }
    class TestClass {
      @TransformDictionary(() => InnerType)
      @IsDictionary([IsArray(), ValidateNested()])
      testProperty!: Dictionary<InnerType[]>;
    }

    const plain = {
      testProperty: {
        key1: [{ field: 1 }],
        key2: [{ field: "value2" }],
      },
    };

    const instance = plainToInstance(TestClass, plain);
    const errors = await validate(instance);

    expect(errors.length).toBeGreaterThan(0);
  });
});
