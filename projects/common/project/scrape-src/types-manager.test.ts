import { describe, it, expect } from "vitest";
import ts from "typescript";
import { ScrapeTypesManager } from "./types-manager.js";
import { pathToFileURL } from "node:url";
import { basename, join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import type { z } from "zod";

function collectCode(code: Generator<string>): string {
  const result: string[] = [];
  for (const line of code) {
    result.push(line);
  }
  return result.join("");
}

async function importTypescriptCode<T = any>(code: string): Promise<T> {
  const baseDir = resolve(join(import.meta.dirname, ".."));
  const tsconfigPath = join(baseDir, "tsconfig.json");
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const parsed = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  if (parsed.error) {
    throw new Error(
      `Failed to read tsconfig at ${tsconfigPath}: ${JSON.stringify(parsed.error.messageText)}`,
    );
  }
  const config = ts.parseJsonConfigFileContent(parsed.config, ts.sys, baseDir);

  const tmp = join(baseDir, ".tmp", `poe-accountant-${randomUUID()}`);
  const tmpFile = join(tmp, "tmp.js");

  const jsCode = ts.transpileModule(code, {
    compilerOptions: {
      ...config.options,
      inlineSourceMap: true,
    },
    fileName: `${basename(tmpFile)}.ts`,
  });

  await mkdir(tmp, { recursive: true });
  try {
    await writeFile(tmpFile, jsCode.outputText);
    await cp(join(baseDir, "src"), join(tmp), {
      recursive: true,
    });

    return (await import(pathToFileURL(tmpFile).href)) as T;
  } finally {
    await rm(tmp, { recursive: true });
  }
}

describe("ScrapeTypesManager", () => {
  it("should be defined", () => {
    expect(ScrapeTypesManager).toBeDefined();
  });

  it("should create an instance", () => {
    const manager = new ScrapeTypesManager([]);
    expect(manager).toBeInstanceOf(ScrapeTypesManager);
  });

  it("should register an enum", async () => {
    const manager = new ScrapeTypesManager([
      {
        type: "enum",
        name: "Test",
        details: {
          values: new Map<number, string>([
            [1, "One"],
            [2, "Two"],
          ]),
        },
      },
    ]);

    const module = await importTypescriptCode<{
      TestEnum: Record<string, string | number>;
      Test: z.ZodType<any>;
    }>(collectCode(manager.generateTypeScriptTypes()));

    expect(module.TestEnum.One).toBe(1);
    expect(module.TestEnum.Two).toBe(2);
    expect(module.Test).toBeDefined();
  });

  it("should register a schema", async () => {
    const manager = new ScrapeTypesManager([
      {
        type: "object",
        name: "Test",
        details: [
          {
            key: "prop1",
            valueType: "string",
          },
          {
            key: "prop2",
            valueType: "int",
          },
        ],
      },
    ]);

    const data = {
      prop1: "test",
      prop2: 123,
    };

    const module = await importTypescriptCode<{
      Test: z.ZodType<{ prop1: string; prop2: number }>;
    }>(collectCode(manager.generateTypeScriptTypes()));

    const result = module.Test.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.prop1).toBe("test");
      expect(result.data.prop2).toBe(123);
    }
  });

  it("should validate a schema with dictionary properly", async () => {
    const manager = new ScrapeTypesManager([
      {
        type: "object",
        name: "Test",
        details: [
          {
            key: "prop1",
            valueType: "dictionary of string",
          },
          {
            key: "prop2",
            valueType: "int",
          },
        ],
      },
    ]);

    const module = await importTypescriptCode<{
      Test: z.ZodType<{ prop1: Record<string, string>; prop2: number }>;
    }>(collectCode(manager.generateTypeScriptTypes()));

    const data = {
      prop1: { test: "test" },
      prop2: 123,
    };

    const result = module.Test.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.prop1).toBeInstanceOf(Object);
      expect(result.data.prop1.test).toBe("test");
      expect(result.data.prop2).toBe(123);
    }
  });

  it("should fail to validate a schema with dictionary with incorrect types", async () => {
    const manager = new ScrapeTypesManager([
      {
        type: "object",
        name: "Test",
        details: [
          {
            key: "prop1",
            valueType: "dictionary of string",
          },
          {
            key: "prop2",
            valueType: "int",
          },
        ],
      },
    ]);
    const module = await importTypescriptCode<{ Test: z.ZodType<any> }>(
      collectCode(manager.generateTypeScriptTypes()),
    );

    const data1 = {
      prop1: {
        test: 123, // Incorrect type
      },
      prop2: 123,
    };

    const result1 = module.Test.safeParse(data1);
    expect(result1.success).toBe(false);

    const data2 = {
      prop1: {
        test: [123], // Incorrect type
      },
      prop2: 123,
    };
    const result2 = module.Test.safeParse(data2);
    expect(result2.success).toBe(false);
  });

  it("should validate a schema with dictionary of arrays properly", async () => {
    const manager = new ScrapeTypesManager([
      {
        type: "object",
        name: "Test",
        details: [
          {
            key: "prop1",
            valueType: "dictionary of array of string",
          },
          {
            key: "prop2",
            valueType: "int",
          },
        ],
      },
    ]);

    const module = await importTypescriptCode<{
      Test: z.ZodType<{ prop1: Record<string, string[]>; prop2: number }>;
    }>(collectCode(manager.generateTypeScriptTypes()));

    const data = {
      prop1: {
        test: ["test1", "test2"],
      },
      prop2: 123,
    };

    const result = module.Test.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.prop1.test).toEqual(["test1", "test2"]);
      expect(result.data.prop2).toBe(123);
    }
  });

  it("should fail to validate a schema with dictionary of arrays with incorrect types", async () => {
    const manager = new ScrapeTypesManager([
      {
        type: "object",
        name: "Test",
        details: [
          {
            key: "prop1",
            valueType: "dictionary of array of string",
          },
          {
            key: "prop2",
            valueType: "int",
          },
        ],
      },
    ]);

    const module = await importTypescriptCode<{ Test: z.ZodType<any> }>(
      collectCode(manager.generateTypeScriptTypes()),
    );

    const data = {
      prop1: {
        test: ["test1", 123], // Incorrect type
      },
      prop2: 123,
    };

    const result = module.Test.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("should validate nested objects with dictionaries", async () => {
    const manager = new ScrapeTypesManager([
      {
        type: "object",
        name: "Test",
        details: [
          {
            key: "prop1",
            valueType: "dictionary of NestedObject",
          },
          {
            key: "prop2",
            valueType: "int",
          },
        ],
      },
      {
        type: "object",
        name: "NestedObject",
        details: [
          {
            key: "field",
            valueType: "string",
          },
        ],
      },
    ]);

    const module = await importTypescriptCode<{
      Test: z.ZodType<{
        prop1: Record<string, { field: string }>;
        prop2: number;
      }>;
      NestedObject: z.ZodType<any>;
    }>(collectCode(manager.generateTypeScriptTypes()));

    const data = {
      prop1: {
        test: { field: "value1" },
        another: { field: "value2" },
      },
      prop2: 123,
    };

    const result = module.Test.safeParse(data);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.prop1.test).toEqual({ field: "value1" });
      expect(result.data.prop1.another).toEqual({ field: "value2" });
      expect(result.data.prop2).toBe(123);
    }
  });

  it("should fail to validate nested objects with dictionaries with incorrect types", async () => {
    const manager = new ScrapeTypesManager([
      {
        type: "object",
        name: "Test",
        details: [
          {
            key: "prop1",
            valueType: "dictionary of NestedObject",
          },
          {
            key: "prop2",
            valueType: "int",
          },
        ],
      },
      {
        type: "object",
        name: "NestedObject",
        details: [
          {
            key: "field",
            valueType: "string",
          },
        ],
      },
    ]);

    const module = await importTypescriptCode<{
      Test: z.ZodType<any>;
      NestedObject: z.ZodType<any>;
    }>(collectCode(manager.generateTypeScriptTypes()));

    const data = {
      prop1: {
        test: { field: 123 }, // Incorrect type
        another: { field: "value2" },
      },
      prop2: 123,
    };

    const result = module.Test.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("should validate nested objects with dictionaries of arrays", async () => {
    const manager = new ScrapeTypesManager([
      {
        type: "object",
        name: "Test",
        details: [
          {
            key: "prop1",
            valueType: "dictionary of array of NestedObject",
          },
          {
            key: "prop2",
            valueType: "int",
          },
        ],
      },
      {
        type: "object",
        name: "NestedObject",
        details: [
          {
            key: "field",
            valueType: "string",
          },
        ],
      },
    ]);

    const module = await importTypescriptCode<{
      Test: z.ZodType<{
        prop1: Record<string, { field: string }[]>;
        prop2: number;
      }>;
      NestedObject: z.ZodType<any>;
    }>(collectCode(manager.generateTypeScriptTypes()));

    const data = {
      prop1: {
        test: [{ field: "value1" }, { field: "value2" }],
      },
      prop2: 123,
    };

    const result = module.Test.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.prop1.test[0].field).toBe("value1");
      expect(result.data.prop1.test[1].field).toBe("value2");
      expect(result.data.prop2).toBe(123);
    }
  });

  it("should fail to validate nested objects with dictionaries of arrays with incorrect types", async () => {
    const manager = new ScrapeTypesManager([
      {
        type: "object",
        name: "Test",
        details: [
          {
            key: "prop1",
            valueType: "dictionary of array of NestedObject",
          },
          {
            key: "prop2",
            valueType: "int",
          },
        ],
      },
      {
        type: "object",
        name: "NestedObject",
        details: [
          {
            key: "field",
            valueType: "string",
          },
        ],
      },
    ]);

    const module = await importTypescriptCode<{
      Test: z.ZodType<any>;
      NestedObject: z.ZodType<any>;
    }>(collectCode(manager.generateTypeScriptTypes()));

    const data = {
      prop1: {
        test: [{ field: 123 }, { field: "value2" }], // Incorrect type
      },
      prop2: 123,
    };

    const result = module.Test.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("should validate number types", async () => {
    const manager = new ScrapeTypesManager([
      {
        type: "object",
        name: "Test",
        details: [
          {
            key: "prop1",
            valueType: "int",
          },
          {
            key: "prop2",
            valueType: "float",
          },
          {
            key: "prop3",
            valueType: "double",
          },
          {
            key: "prop4",
            valueType: "uint",
          },
        ],
      },
    ]);

    const module = await importTypescriptCode<{
      Test: z.ZodType<{
        prop1: number;
        prop2: number;
        prop3: number;
        prop4: number;
      }>;
    }>(collectCode(manager.generateTypeScriptTypes()));

    const data = {
      prop1: -123,
      prop2: 123.456,
      prop3: 123.456789,
      prop4: 123,
    };

    const result = module.Test.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.prop1).toBe(-123);
      expect(result.data.prop2).toBe(123.456);
      expect(result.data.prop3).toBe(123.456789);
      expect(result.data.prop4).toBe(123);
    }
  });

  it("should fail to validate number types with incorrect values", async () => {
    const manager = new ScrapeTypesManager([
      {
        type: "object",
        name: "Test",
        details: [
          {
            key: "prop1",
            valueType: "int",
          },
          {
            key: "prop2",
            valueType: "float",
          },
          {
            key: "prop3",
            valueType: "double",
          },
          {
            key: "prop4",
            valueType: "uint",
          },
        ],
      },
    ]);

    const module = await importTypescriptCode<{ Test: z.ZodType<any> }>(
      collectCode(manager.generateTypeScriptTypes()),
    );

    const data = {
      prop1: 1e100, // Too large for int
      prop2: "123.456",
      prop3: false,
      prop4: -123, // Negative value for uint
    };

    const result = module.Test.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("should generate a array of two different type options", async () => {
    const manager = new ScrapeTypesManager([
      {
        type: "object",
        name: "Test",
        details: [
          {
            key: "prop1",
            valueType: "array of string or int",
          },
        ],
      },
    ]);

    const module = await importTypescriptCode<{
      Test: z.ZodType<{ prop1: (string | number)[] }>;
    }>(collectCode(manager.generateTypeScriptTypes()));

    const data = {
      prop1: ["test", 123],
    };

    const result = module.Test.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.prop1).toEqual(["test", 123]);
    }
  });
});
