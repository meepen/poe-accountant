import type { TypeDetails } from "./html-to-data.js";
import type { ObjectTypeDetails } from "./object-type-details.js";

class TokenLexer {
  constructor(
    private readonly valueType: string,
    private _index = 0,
  ) {}

  private peekToken: [number, string] | null = null;

  public next(): string {
    if (this.peekToken === null) {
      this.peek();
    }

    if (this.peekToken === null) {
      throw new Error(
        `No more tokens in value type "${this.valueType}" at index ${this.index}`,
      );
    }

    const [nextIndex, token] = this.peekToken;
    this.peekToken = null; // reset peek token
    this.index = nextIndex; // update index to the next token's index
    if (token === "") {
      return this.next(); // skip empty tokens
    }

    return token;
  }

  public tryConsume(value: string): boolean {
    if (this.peek() === value) {
      this.next(); // consume the token
      return true;
    }
    return false;
  }

  public consume(value: string): string {
    if (this.peek() !== value) {
      throw new Error(
        `Expected "${value}" but found "${this.peek()}" in value type "${this.valueType}" at index ${this.index}`,
      );
    }
    return this.next(); // consume the token
  }

  public peek(): string | null {
    if (this.peekToken !== null) {
      return this.peekToken[1];
    }

    if (this.index >= this.valueType.length) {
      return null;
    }
    const nextSpace = this.valueType.indexOf(" ", this.index);
    this.peekToken =
      nextSpace === -1
        ? [this.valueType.length, this.valueType.slice(this.index)]
        : [nextSpace + 1, this.valueType.slice(this.index, nextSpace)];

    return this.peekToken[1];
  }

  set index(index: number) {
    if (index < 0 || index > this.valueType.length) {
      throw new Error(`Index out of bounds: ${index}`);
    }
    this._index = index;
    this.peekToken = null; // reset peek token when index is set
  }

  get index(): number {
    return this._index;
  }

  public eof(): boolean {
    return this.index >= this.valueType.length;
  }
}

function tab(count: number): string {
  return "  ".repeat(count);
}

function key(str: string): string {
  const jsonKey = JSON.stringify(str);
  if (jsonKey === `"${str}"`) {
    return str;
  }
  return jsonKey;
}

/**
 * Manages the types being scraped and converts them to TypeScript types.
 */
export class ScrapeTypesManager {
  private readonly typeMap = new Map<string, TypeDetails>();
  private readonly allTypes: Map<string, TypeDetails>;
  private readonly sortedTypeEntries: [string, TypeDetails][] = [];
  private static readonly rawTypes = new Map<
    string,
    {
      zod: string;
      ts: string;
    }
  >([
    [
      "uint",
      {
        zod: "z.uint32()",
        ts: "number",
      },
    ],
    [
      "int",
      {
        zod: "z.int32()",
        ts: "number",
      },
    ], // signed 32 bit integer
    ["float", { zod: "z.float32()", ts: "number" }],
    ["double", { zod: "z.float64()", ts: "number" }],
    ["string", { zod: "z.string()", ts: "string" }],
    ["bool", { zod: "z.boolean()", ts: "boolean" }],
  ]);
  private static readonly renameMap = new Map<string, string>([
    ["Error", "ApiError"],
  ]);

  private getDependencies(valueType: string): string[] {
    const dependencies: string[] = [];
    if (!valueType.trim()) {
      return [];
    }

    const isOptional = valueType.charAt(0) === "?";
    const lex = new TokenLexer(valueType, isOptional ? 1 : 0);

    if (lex.eof()) {
      return [];
    }

    let currentToken = lex.next();

    while (currentToken === "array" || currentToken === "dictionary") {
      if (lex.peek() !== "of") {
        break;
      }
      lex.next(); // consume 'of'
      if (lex.eof()) {
        break;
      }
      currentToken = lex.next();
    }

    for (;;) {
      if (currentToken === "object" || currentToken === "array") {
        // ignore
      } else if (ScrapeTypesManager.rawTypes.has(currentToken)) {
        if (lex.tryConsume("as")) {
          const typeName = lex.next();
          dependencies.push(ScrapeTypesManager.safeName(typeName));
        }
      } else {
        dependencies.push(ScrapeTypesManager.safeName(currentToken));
      }

      if (lex.eof()) {
        break;
      }
      if (lex.peek() !== "or") {
        break;
      }
      lex.next(); // skips 'or'
      if (lex.eof()) {
        break;
      }
      currentToken = lex.next();
    }

    return dependencies;
  }

  private addType(type: TypeDetails): void {
    const fullName = ScrapeTypesManager.safeName(type.name);
    if (this.typeMap.has(fullName)) {
      return;
    }

    this.typeMap.set(fullName, type);

    if (type.type === "object") {
      const tryAddType = (typeName: string) => {
        const allType = this.allTypes.get(typeName);
        if (allType) {
          this.addType(allType);
        }
      };

      const collectDependencies = (details: ObjectTypeDetails) => {
        const dependencies = this.getDependencies(details.valueType);
        for (const dep of dependencies) {
          tryAddType(dep);
        }
        if (details.children) {
          for (const child of details.children) {
            collectDependencies(child);
          }
        }
      };

      for (const child of type.details) {
        collectDependencies(child);
      }
    }

    this.sortedTypeEntries.push([fullName, type]);
  }

  constructor(types: TypeDetails[]) {
    this.allTypes = new Map(
      types.map((type) => [ScrapeTypesManager.safeName(type.name), type]),
    );
    for (const type of types) {
      this.addType(type);
    }
  }

  public static safeName(name: string): string {
    const safeName = name
      .trim()
      .replace(/[^a-zA-Z0-9_ ]/g, "")
      .replace(/^[0-9]/, "_$&")
      .split(" ")
      .map((part, index) =>
        index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1),
      )
      .join("");

    const remap = ScrapeTypesManager.renameMap.get(safeName);
    if (remap) {
      return remap;
    }

    return safeName;
  }

  private static fullName(parentTypeName: string, key: string): string {
    return ScrapeTypesManager.safeName(
      `${parentTypeName} ${this.safeName(key)}`,
    );
  }

  /**
   * Translates a value type to a TypeScript interface/type field.
   */
  private translateValueTypeToTypeScript(
    details: ObjectTypeDetails,
    indentationLevel: number = 0,
  ): string {
    const { valueType } = details;
    const isOptional = valueType.charAt(0) === "?";
    const lex = new TokenLexer(valueType, isOptional ? 1 : 0);

    const ofParts: ("array" | "dictionary")[] = [];

    let currentToken = lex.next();

    while (currentToken === "array" || currentToken === "dictionary") {
      if (lex.peek() !== "of") {
        break;
      }
      lex.next(); // consume 'of'
      ofParts.push(currentToken);

      currentToken = lex.next();
    }

    const allTypes: string[] = [];

    // parse types
    for (;;) {
      let currentType: string;
      switch (currentToken) {
        case "object":
          if (details.children && details.children.length > 0) {
            currentType = `{\n${details.children
              .map((x) => {
                const isChildOptional = x.valueType.startsWith("?");
                return `${tab(indentationLevel + 2)}${key(x.key)}${isChildOptional ? "?" : ""}: ${this.translateValueTypeToTypeScript(x, indentationLevel + 1)}${isChildOptional ? " | null" : ""};`;
              })
              .join("\n")}\n${tab(indentationLevel + 1)}}`;
          } else {
            currentType = "Record<string, any>";
          }
          break;
        case "array":
          if (!details.children) {
            throw new Error(
              `Array type "${details.key}" has no children in value type "${valueType}" at index ${lex.index}`,
            );
          }
          currentType = `[${details.children.map((x) => this.translateValueTypeToTypeScript(x, indentationLevel)).join(", ")}]`;
          break;
        default:
          if (ScrapeTypesManager.rawTypes.has(currentToken)) {
            if (lex.tryConsume("as")) {
              const typeName = lex.next();
              const safeName = ScrapeTypesManager.safeName(typeName);
              const type = this.allTypes.get(safeName);

              if (type && type.type === "enum") {
                currentType = `${safeName}Enum`;
              } else if (ScrapeTypesManager.renameMap.has(safeName)) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                currentType = ScrapeTypesManager.renameMap.get(safeName)!;
              } else {
                currentType = safeName;
              }
            } else {
              const rawType = ScrapeTypesManager.rawTypes.get(currentToken);
              if (!rawType) {
                throw new Error(
                  `Unknown raw type "${currentToken}" in value type "${valueType}" at index ${lex.index}`,
                );
              }
              currentType = rawType.ts;
            }
          } else {
            const safeName = ScrapeTypesManager.safeName(currentToken);
            const type = this.allTypes.get(safeName);

            if (type && type.type === "enum") {
              currentType = `${safeName}Enum`;
            } else if (ScrapeTypesManager.renameMap.has(safeName)) {
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              currentType = ScrapeTypesManager.renameMap.get(safeName)!;
            } else {
              currentType = safeName;
            }
          }
          break;
      }

      allTypes.push(currentType);
      if (lex.eof()) {
        break;
      }
      if (lex.peek() !== "or") {
        break;
      }
      lex.next(); // skip 'or'
      currentToken = lex.next();
    }

    let fullType = allTypes.join(" | ");

    if (allTypes.length > 1) {
      fullType = `(${fullType})`;
    }

    for (let i = ofParts.length - 1; i >= 0; i--) {
      const part = ofParts[i];
      switch (part) {
        case "array":
          fullType = `${fullType}[]`;
          break;
        case "dictionary":
          fullType = `Record<string, ${fullType}>`;
          break;
      }
    }

    if (!lex.eof()) {
      throw new Error(
        `Unexpected token "${lex.peek()}" in value type "${valueType}" at index ${lex.index}`,
      );
    }

    if (isOptional) {
      fullType = `${fullType} | undefined | null`;
    }

    return fullType;
  }

  /**
   * Translates a value type to a Zod type.
   * @param details The details of the object type, including the value type.
   * @param parentTypeName Optional parent type name for complex types.
   * @return The Zod type as a string, e.g., 'z.string()', 'z.number().optional()', etc.
   */
  private translateValueTypeToZod(
    details: ObjectTypeDetails,
    parentTypeName?: string,
    indentationLevel: number = 0,
    definedSchemas: Set<string> = new Set(),
  ): string {
    const { valueType } = details;

    const isOptional = valueType.charAt(0) === "?";
    const lex = new TokenLexer(valueType, isOptional ? 1 : 0); // skip '?' if present

    const ofParts: ("array" | "dictionary")[] = [];

    let currentToken = lex.next();

    while (currentToken === "array" || currentToken === "dictionary") {
      if (lex.peek() !== "of") {
        break;
      }
      lex.next(); // consume 'of'
      ofParts.push(currentToken);

      currentToken = lex.next();
    }

    const allTypes: string[] = [];

    // parse types
    for (;;) {
      let currentType: string;
      switch (currentToken) {
        case "object":
          if (details.children && details.children.length > 0) {
            currentType = `z.object({\n${details.children
              .map(
                (x) =>
                  `${tab(indentationLevel + 2)}${key(x.key)}: ${this.translateValueTypeToZod(
                    x,
                    parentTypeName
                      ? ScrapeTypesManager.fullName(parentTypeName, details.key)
                      : details.key,
                    indentationLevel + 1,
                    definedSchemas,
                  )},`,
              )
              .join("\n")}\n${tab(indentationLevel + 1)}})`;
          } else {
            currentType = "z.record(z.string(), z.any())"; // if no children, we just use 'Record<string, any>' as the type
          }
          break;
        case "array":
          // actually a tuple type, so we need to handle it differently
          // get the types of the elements in the array
          if (!details.children) {
            throw new Error(
              `Array type "${details.key}" has no children in value type "${valueType}" at index ${lex.index}`,
            );
          }

          currentType = `z.tuple([\n${details.children.map((x) => `${tab(indentationLevel + 2)}${this.translateValueTypeToZod(x, parentTypeName, indentationLevel + 2, definedSchemas)}`).join(`,\n`)}\n${tab(indentationLevel + 1)}])`;
          break;
        default:
          if (ScrapeTypesManager.rawTypes.has(currentToken)) {
            // if it contains ' as Type' we need to extract the type name from the rest of valueType
            if (lex.tryConsume("as")) {
              const typeName = lex.next();
              const safeName = ScrapeTypesManager.safeName(typeName);
              const resolvedName = safeName;

              if (definedSchemas.has(resolvedName)) {
                currentType = resolvedName;
              } else {
                currentType = `z.lazy(() => ${resolvedName})`;
              }
            } else {
              const rawType = ScrapeTypesManager.rawTypes.get(currentToken);
              if (!rawType) {
                throw new Error(
                  `Unknown raw type "${currentToken}" in value type "${valueType}" at index ${lex.index}`,
                );
              }
              currentType = rawType.zod;
            }
          } else {
            const safeName = ScrapeTypesManager.safeName(currentToken);
            const resolvedName = safeName;

            if (definedSchemas.has(resolvedName)) {
              currentType = resolvedName;
            } else {
              currentType = `z.lazy(() => ${resolvedName})`;
            }
          }
          break;
      }

      allTypes.push(currentType);
      if (lex.eof()) {
        break;
      }
      if (lex.peek() !== "or") {
        break;
      }
      lex.next(); // skip 'or'
      currentToken = lex.next();
    }

    // combine types into a single type
    // TODO

    let fullType =
      allTypes.length === 1 ? allTypes[0] : `z.union([${allTypes.join(", ")}])`;

    for (let i = ofParts.length - 1; i >= 0; i--) {
      const part = ofParts[i];
      switch (part) {
        case "array":
          fullType = `z.array(${fullType})`;
          break;
        case "dictionary":
          fullType = `z.record(z.string(), ${fullType})`;
          break;
      }
    }

    if (!lex.eof()) {
      throw new Error(
        `Unexpected token "${lex.peek()}" in value type "${valueType}" at index ${lex.index}`,
      );
    }

    if (isOptional) {
      fullType = `${fullType}.nullable().optional()`;
    }

    return fullType;
  }

  *generateTypeScriptTypes(): Generator<string> {
    yield `import { z } from 'zod';\n`;

    // I'm too lazy to figure out the non-standard parsing for Error objects from the api...

    yield `/**\n * ApiError\n * Manually Generated from https://www.pathofexile.com/developer/docs/index#errors\n */\n`;
    yield `export enum ErrorMessage {
  Accepted = 0,
  ResourceNotFound = 1,
  InvalidQuery = 2,
  RateLimitExceeded = 3,
  InternalError = 4,
  UnexpectedContentType = 5,
  Forbidden = 6,
  TemporarilyUnavailable = 7,
  Unauthorized = 8,
  MethodNotAllowed = 9,
  UnprocessableEntity = 10,
}\n\n`;
    yield `export interface ApiError {
  code: ErrorMessage;
  message: string;
}\n\n`;
    yield `export const ApiError = z.object({
  code: z.enum(ErrorMessage),
  message: z.string(),
});\n\n`;

    const definedSchemas = new Set<string>([
      "ApiError",
      "Error",
      "ErrorMessage",
    ]);

    // Pass 1: Interfaces and Enums
    for (const [name, type] of this.sortedTypeEntries) {
      yield `/**\n * ${type.type} ${name}${type.subtitle ? `\n * ${type.subtitle}` : ""}\n * Generated from https://www.pathofexile.com/developer/docs/reference#type-${name}\n */\n`;
      switch (type.type) {
        case "enum":
          yield `export enum ${name}Enum {\n`;
          for (const [value, key] of type.details.values.entries()) {
            yield `  ${ScrapeTypesManager.safeName(key)} = ${value}, // ${key}\n`;
          }
          yield `};\n\n`;
          break;
        case "object":
          yield `export interface ${name} {\n`;
          for (const value of type.details) {
            if (type.subtitle) {
              yield `  /**\n   * ${value.extraInfo || ""}\n   */\n`;
            }
            const isOpt = value.valueType.startsWith("?");
            yield `  ${key(value.key)}${isOpt ? "?" : ""}: ${this.translateValueTypeToTypeScript(value, 0)};\n`;
          }
          yield `}\n\n`;
          break;
      }
    }

    // Pass 2: Zod Schemas
    for (const [name, type] of this.sortedTypeEntries) {
      switch (type.type) {
        case "enum":
          yield `export const ${name} = z.enum(${name}Enum);\n`;
          definedSchemas.add(name);
          break;
        case "object":
          yield `export const ${name}: z.ZodType<${name}> = z.object({\n`;
          for (const value of type.details) {
            const zodType = this.translateValueTypeToZod(
              value,
              name,
              0,
              definedSchemas,
            );
            if (type.subtitle) {
              yield `  /**\n   * ${value.extraInfo || ""}\n   */\n`;
            }
            yield `  ${key(value.key)}: ${zodType},\n`;
          }
          yield `})\n`;
          definedSchemas.add(name);
          break;
      }
    }
  }
}
