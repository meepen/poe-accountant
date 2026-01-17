// Scrapes the URL https://www.pathofexile.com/developer/docs/reference#types
// and converts the types to TypeScript interfaces.

// import axios from 'axios';
import { createWriteStream } from "fs";
import { readFile, writeFile } from "fs/promises";
import { htmlToData } from "./html-to-data.js";
import { ScrapeTypesManager } from "./types-manager.js";

// #region Type and Endpoint Generation
const BASE_URL = "https://www.pathofexile.com/developer/docs/reference#types";
const OUTPUT_FILE = "./src/poe.gen.ts";
const outStream = createWriteStream(OUTPUT_FILE);

// const response = (await axios.get(BASE_URL)).data;
const response = await readFile("./docs/docs.htm", "utf-8");

const htmlData = htmlToData(response);
// #endregion Type and Endpoint Generation

// #region Output Generation
outStream.write(`// This file is auto-generated from ${BASE_URL}\n\n`);

outStream.write("\n\n// #region Type Information\n");
const typesManager = new ScrapeTypesManager(htmlData.typeDetails);
for (const type of typesManager.generateTypeScriptTypes()) {
  outStream.write(type);
}
outStream.write("\n\n// #endregion Type Information\n\n");

outStream.write("\n\n// #region Endpoint Information\n\n");
outStream.write(
  `export const serverEndpoint = ${JSON.stringify(htmlData.apiEndpoint)};\n`,
);

outStream.write("export const serverApiPaths = {\n");

for (const [categoryName, categoryEndpoints] of Object.entries(
  htmlData.apiCategories,
)) {
  outStream.write(`\n// #region ${categoryName}\n`);

  for (const endpoint of categoryEndpoints.endpoints) {
    outStream.write(`\n// #region ${endpoint.name}
  ${JSON.stringify(endpoint.name)}: {
    requiredScope: ${JSON.stringify(categoryEndpoints.requiredScope)},
    name: ${JSON.stringify(endpoint.name)},
    method: ${JSON.stringify(endpoint.method)},
    path: ${JSON.stringify(endpoint.path)},
    responseType: ${ScrapeTypesManager.safeName(endpoint.type.name)},
  },\n`);
    outStream.write(`\n// #endregion ${endpoint.name}\n`);
  }

  outStream.write(`\n// #endregion ${categoryName}\n`);
}

outStream.write("} as const;\n\n// #endregion Endpoint Information\n\n");

outStream.end();
// #endregion Output Generation

// #region Trade Stats Generation
// Retrieved from https://www.pathofexile.com/api/trade/data/stats
const data = await readFile("./docs/stats.json", "utf-8");
await writeFile(
  "./src/trade-stats.gen.ts",
  `import { Type, plainToInstance } from 'class-transformer';
import { IsArray, IsString, ValidateNested, IsInt, IsOptional } from 'class-validator';
import "reflect-metadata";

export class TradeStatsEntryOption {
  @IsInt()
  id!: number;

  @IsString()
  text!: string;
}

export class TradeStatsEntryOptions {
  @Type(() => TradeStatsEntryOption)
  @IsArray()
  @ValidateNested({ each: true })
  options!: TradeStatsEntryOption[];
}

export class TradeStatsEntry {
  @IsString()
  id!: string;

  @IsString()
  text!: string;

  @IsString()
  type!: string;

  @IsOptional()
  option?: TradeStatsEntryOptions;
}

export class TradeStatsGroup {
  @IsString()
  id!: string;

  @IsString()
  label!: string;

  @Type(() => TradeStatsEntry)
  @IsArray()
  @ValidateNested({ each: true })
  entries!: TradeStatsEntry[];
}

export class TradeStats {
  @Type(() => TradeStatsGroup)
  @IsArray()
  @ValidateNested({ each: true })
  result!: TradeStatsGroup[];
}

export const tradeStats = plainToInstance(TradeStats, ${JSON.stringify(JSON.parse(data), null, 2)});
`,
  "utf-8",
);

// #endregion Trade Stats Generation

// #region API Interface

const poeApiStream = createWriteStream("./src/poe-api.gen.ts");

poeApiStream.write(`// This file is auto-generated from ${BASE_URL}\n\n`);

poeApiStream.write('import { serverApiPaths } from "./poe.gen.js";\n');

poeApiStream.write(`
export abstract class PoeApi {
  protected abstract request<T>(endpointData: typeof serverApiPaths[keyof typeof serverApiPaths], path: string, postData?: FormData): Promise<T>;`);

function generateApiMethodName(name: string): string {
  return name
    .trim()
    .replace(/[^a-zA-Z0-9_ ]/g, "") // Remove special characters
    .replace(/\([^)]*\)/g, "") // Remove anything in parentheses
    .split(/\s+/g) // Split by whitespace
    .map((word, index) =>
      index === 0
        ? word.charAt(0).toLowerCase() + word.slice(1)
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join("");
}

type TemplatedPart =
  | { type: "template"; name: string; optional: boolean }
  | { type: "literal"; value: string };

/**
 * Splits a path template into its constituent parts, distinguishing between literal strings and template parameters.
 */
function splitTemplateIntoParts(template: string): TemplatedPart[] {
  const results: TemplatedPart[] = [];

  let lastIndex = 0;

  function addCurrentLiteral(endIndex: number) {
    if (endIndex > lastIndex) {
      results.push({
        type: "literal",
        value: template.substring(lastIndex, endIndex),
      });
    }
  }

  for (let i = 0; i < template.length; i++) {
    if (template[i] === "<") {
      addCurrentLiteral(i);
      const endIndex = template.indexOf(">", i);
      if (endIndex === -1) {
        throw new Error(`Unclosed parameter in path: ${template}`);
      }
      const paramName = template.substring(i + 1, endIndex);
      results.push({ type: "template", name: paramName, optional: false });
      lastIndex = endIndex + 1;
      i = endIndex;
    } else if (template[i] === "[") {
      addCurrentLiteral(i);
      const endIndex = template.indexOf("]", i);
      if (endIndex === -1) {
        throw new Error(`Unclosed optional parameter in path: ${template}`);
      }
      const optionalPart = template.substring(i + 1, endIndex);
      const match = optionalPart.match(/<([^>]+)>/);
      if (!match) {
        throw new Error(
          `No parameter found in optional part of path: ${template}`,
        );
      }
      const paramName = match[1];
      results.push({ type: "template", name: paramName, optional: true });
      lastIndex = endIndex + 1;
      i = endIndex;
    }
  }

  addCurrentLiteral(template.length);

  return results;
}

function generateArgumentsFromPath(path: string): string {
  // path can contain optional parameters (e.g. `/stash[/<realm>]/list`) which should be translation to realm: string | undefined
  // it can also contain required parameters (e.g. `/character/<name>`) which should be translated to name: string

  const parts = splitTemplateIntoParts(path);
  const args = parts.filter((part) => part.type === "template");

  const requiredArgs = args.filter((arg) => !arg.optional);
  const optionalArgs = args.filter((arg) => arg.optional);

  // Required arguments first
  return [
    ...requiredArgs.map((arg) => `${arg.name}: string`),
    ...optionalArgs.map((arg) => `${arg.name}?: string`),
  ].join(", ");
}

/**
 * Fills the generated method body with the arguments expected by the template.
 * @param template The path template (e.g. `/character[/<name>]/items/<item_id>`)
 */
function fillArgumentsToTemplate(template: string): string {
  const parts = splitTemplateIntoParts(template);

  return `\`${parts
    .map((part) => {
      switch (part.type) {
        case "literal":
          return part.value;
        case "template":
          return part.optional
            ? `\${${part.name} ? \`/\${${part.name}}\` : ''}`
            : `\${${part.name}}`;
        default:
          throw new Error("Unreachable");
      }
    })
    .join("")}\``;
}

for (const [categoryName, categoryEndpoints] of Object.entries(
  htmlData.apiCategories,
)) {
  poeApiStream.write(`\n// #region ${categoryName}`);

  for (const endpoint of categoryEndpoints.endpoints) {
    poeApiStream.write(`
  public async ${generateApiMethodName(
    endpoint.name,
  )}(${generateArgumentsFromPath(endpoint.path)}): Promise<(typeof serverApiPaths)[${JSON.stringify(
    endpoint.name,
  )}]["responseType"]> {
    return await this.request<(typeof serverApiPaths)[${JSON.stringify(endpoint.name)}]['responseType']>(
      serverApiPaths[${JSON.stringify(endpoint.name)}],
      ${fillArgumentsToTemplate(endpoint.path)}
    );
  }`);
  }

  poeApiStream.write(`\n// #endregion ${categoryName}\n`);
}

poeApiStream.write("\n}\n");

// TODO: implementation of a concrete PoeApi class that uses fetch
poeApiStream.end();

// #endregion API Interface
