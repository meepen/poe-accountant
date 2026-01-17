import { TypeDetails } from "./html-to-data.js";
import { ObjectTypeDetails } from "./object-type-details.js";

export interface TypeScriptTypeDetails {
  isOptional?: true;
  type: string;
  decorators: string[];
}

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
      typeName: string;
      decorators: string[];
    }
  >([
    [
      "uint",
      {
        typeName: "number",
        decorators: ["IsInt({})", "Max(0xFFFFFFFF{,})", "Min(0{,})"],
      },
    ], // unsigned 32 bit integer
    [
      "int",
      {
        typeName: "number",
        decorators: ["IsInt({})", "Max(0x7FFFFFFF{,})", "Min(-0x80000000{,})"],
      },
    ], // signed 32 bit integer
    ["float", { typeName: "number", decorators: ["IsNumber({})"] }], // 32 bit floating point number
    ["double", { typeName: "number", decorators: ["IsNumber({})"] }], // 64 bit floating point number
    ["string", { typeName: "string", decorators: ["IsString({})"] }],
    ["bool", { typeName: "boolean", decorators: ["IsBoolean({})"] }], // boolean value
  ]);

  private addType(type: TypeDetails): void {
    const fullName = ScrapeTypesManager.safeName(type.name);
    if (this.typeMap.has(fullName)) {
      return;
    }

    this.typeMap.set(fullName, type);

    if (type.type === "object") {
      for (const child of type.details) {
        const lastIndex = child.valueType.lastIndexOf(" ");
        const type =
          lastIndex === -1
            ? ScrapeTypesManager.safeName(child.valueType)
            : ScrapeTypesManager.safeName(child.valueType.slice(lastIndex));
        if (type === "array") {
          continue; // 'array' is not a valid type, it is usually a tuple
        }
        if (child.children && child.children.length > 0) {
          this.addType({
            type: "object",
            name: ScrapeTypesManager.fullName(fullName, child.key),
            details: child.children,
          });
        } else {
          const allType = this.allTypes.get(type);
          if (!this.typeMap.has(type) && allType) {
            this.addType(allType);
          }
        }
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
    return name
      .trim()
      .replace(/[^a-zA-Z0-9_ ]/g, "")
      .replace(/^[0-9]/, "_$&")
      .split(" ")
      .map((part, index) =>
        index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1),
      )
      .join("");
  }

  private static fullName(parentTypeName: string, key: string): string {
    return ScrapeTypesManager.safeName(
      `${parentTypeName} ${this.safeName(key)}`,
    );
  }

  /**
   * Translates a value type to a TypeScript type.
   * @param details The details of the object type, including the value type.
   * @param parentTypeName Optional parent type name for complex types.
   * @return The TypeScript type as a string, e.g., 'number', 'string[]', 'Dictionary<string[]>'
   */
  private translateValueTypeToTypeScript(
    details: ObjectTypeDetails,
    parentTypeName?: string,
  ): TypeScriptTypeDetails {
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

    const types: {
      type: string;
      validationDecorators: string[];
      transformDecorators: string[];
    }[] = [];

    for (;;) {
      const typeData: (typeof types)[0] = {
        type: "",
        validationDecorators: [],
        transformDecorators: [],
      };
      types.push(typeData);
      if (currentToken === "object") {
        // always create a type for objects so we don't have to deal with unnamed types
        if (details.children && details.children.length > 0) {
          const typeName = parentTypeName
            ? ScrapeTypesManager.fullName(parentTypeName, details.key)
            : ScrapeTypesManager.safeName(details.key);
          typeData.type = typeName;
          typeData.transformDecorators.push(`Type(() => ${typeName})`); // use class-transformer to handle nested objects
          typeData.validationDecorators.push("ValidateNested({})"); // use class-validator to handle nested objects
        } else {
          typeData.validationDecorators.push("IsObject({})"); // if no children, we just use 'IsObject' as the validation decorator
          typeData.type = "Dictionary<object>"; // if no children, we just use 'Dictionary<object>' as the type
        }
      } else if (currentToken === "array") {
        // actually a tuple type, so we need to handle it differently
        // get the types of the elements in the array
        if (!details.children) {
          throw new Error(
            `Array type "${details.key}" has no children in value type "${valueType}" at index ${lex.index}`,
          );
        }

        const tupleTypes = details.children
          .map((child) =>
            this.translateValueTypeToTypeScript(child, parentTypeName),
          )
          .map((type) =>
            type.isOptional ? type.type + " | undefined" : type.type,
          );

        typeData.type = `[${tupleTypes.join(", ")}]`;
      } else if (ScrapeTypesManager.rawTypes.has(currentToken)) {
        // if it contains ' as Type' we need to extract the type name from the rest of valueType
        if (lex.tryConsume("as")) {
          const typeName = lex.next();
          if (typeName) {
            typeData.type = ScrapeTypesManager.safeName(typeName);
          }
        } else {
          const rawType = ScrapeTypesManager.rawTypes.get(currentToken);
          if (!rawType) {
            throw new Error(
              `Unknown raw type "${currentToken}" in value type "${valueType}" at index ${lex.index}`,
            );
          }
          typeData.type = rawType.typeName;
          typeData.validationDecorators.push(...rawType.decorators);
        }
      } else {
        typeData.type = currentToken; // this is a custom type, so we just use the name
        typeData.transformDecorators.push(
          `Type(() => ${ScrapeTypesManager.safeName(currentToken)})`,
        );
        typeData.validationDecorators.push("ValidateNested({})");
      }
      if (lex.eof()) {
        break;
      }
      if (lex.peek() !== "or") {
        break;
      }
      lex.next(); // skip 'or'
      currentToken = lex.next();
    }

    const fullType: (typeof types)[0] & { arrayType?: string } = {
      type:
        types.length === 1
          ? types[0].type
          : types.map((type) => type.type).join(" | "),
      validationDecorators: [],
      transformDecorators: [],
    };
    if (types.length > 1) {
      fullType.validationDecorators = [
        `IsAny([${types
          .map(
            ({ validationDecorators }) =>
              `[${validationDecorators
                .map((decorator) => decorator.replace(/\{,?\}/g, ""))
                .join(", ")}]`,
          )
          .join(", ")}]{,})`,
      ];
      fullType.transformDecorators = types.flatMap(
        ({ transformDecorators }) => transformDecorators,
      );
    } else {
      fullType.validationDecorators = types[0].validationDecorators;
      fullType.transformDecorators = types[0].transformDecorators;
    }

    for (let i = ofParts.length - 1; i >= 0; i--) {
      const part = ofParts[i];
      switch (part) {
        case "array":
          fullType.arrayType = fullType.type; // save the type for later
          fullType.type =
            fullType.type.indexOf(" ") === -1
              ? `${fullType.type}[]`
              : `(${fullType.type})[]`; // if the type has a space, it is a complex type
          fullType.validationDecorators = [
            "IsArray({})",
            ...fullType.validationDecorators.map((decorator) =>
              decorator
                .replace(/\{\}/g, "{ each: true }")
                .replace(/\{,\}/g, ", { each: true }"),
            ),
          ];
          break;
        case "dictionary":
          fullType.transformDecorators = [
            `IsDictionary([${[
              ...fullType.transformDecorators,
              ...fullType.validationDecorators,
            ]
              .map((decorator) => decorator.replace(/\{,?\}/g, ""))
              .join(", ")}]{,})`,

            this.typeMap.has(fullType.arrayType ?? fullType.type)
              ? fullType.arrayType
                ? `TransformDictionary(() => ${fullType.arrayType ?? fullType.type})`
                : `TransformDictionary(${fullType.arrayType ?? fullType.type})`
              : `Type(() => Dictionary<unknown>)`,
          ];
          fullType.type = `Dictionary<${fullType.type}>`;
          fullType.validationDecorators = [];
          delete fullType.arrayType;
          break;
      }
    }

    const finalDecorators = [
      ...fullType.transformDecorators,
      ...fullType.validationDecorators,
    ].map((decorator) => decorator.replace(/\{,?\}/g, "")); // remove empty braces from decorators

    if (!lex.eof()) {
      throw new Error(
        `Unexpected token "${lex.peek()}" in value type "${valueType}" at index ${lex.index}`,
      );
    }

    return {
      type: fullType.type,
      isOptional: isOptional ? true : undefined,
      decorators: [
        "@Expose()",
        ...(isOptional ? ["@IsOptional()"] : []),
        ...finalDecorators.map((decorator) => `@${decorator}`),
      ],
    };
  }

  *generateTypeScriptTypes(): Generator<string> {
    yield `// This file is auto-generated from https://www.pathofexile.com/developer/docs/reference#types\n\n`;
    yield `import { Type, Expose } from 'class-transformer';\n`;
    const decorators = Array.from(ScrapeTypesManager.rawTypes.entries())
      .flatMap(([, value]) => value.decorators)
      .map((decorator) => decorator.match(/^(\w+)/)?.[1] ?? decorator);
    yield `import { IsOptional, ValidateNested, IsArray, IsObject, ${Array.from(new Set(decorators)).join(", ")} } from 'class-validator';\n`;
    yield `import { IsAny } from './is-any.js';\n`;
    yield `import { Dictionary, IsDictionary, TransformDictionary } from './is-dictionary.js';\n\n`;

    for (const [name, type] of this.sortedTypeEntries) {
      yield `/**\n * ${type.type} ${name}${type.subtitle ? `\n * ${type.subtitle}` : ""}\n * Generated from https://www.pathofexile.com/developer/docs/reference#types\n */\n`;
      switch (type.type) {
        case "enum":
          yield `export enum ${name} {\n`;
          for (const [value, key] of type.details.values.entries()) {
            yield `  ${ScrapeTypesManager.safeName(key)} = ${value}, // ${key}\n`;
          }
          yield `}\n`;
          break;
        case "object":
          yield `export class ${name} {\n`;
          for (const value of type.details) {
            const typeScriptType = this.translateValueTypeToTypeScript(
              value,
              name,
            );
            if (type.subtitle) {
              yield `  /**\n   * ${value.extraInfo || ""}\n   */\n`;
            }
            for (const decorator of typeScriptType.decorators) {
              yield `  ${decorator}\n`;
            }
            yield `  ${ScrapeTypesManager.safeName(value.key)}${typeScriptType.isOptional ? "?" : "!"}: ${typeScriptType.type};\n`;
          }
          yield `}\n`;
          break;
      }
    }
  }
}
