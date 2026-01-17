import { DOMWindow } from "jsdom";
import { ObjectTypeDetails } from "./object-type-details.js";
import { JSDOM } from "jsdom";

const htmlTab = String.fromCharCode(0x2002) + String.fromCharCode(0x2003);
const htmlKeyChar = String.fromCharCode(0x21b3) + String.fromCharCode(0x2003);

export interface EnumTypeDetails {
  values: Map<number, string>;
}

export type TypeDetails =
  | { type: "enum"; name: string; subtitle?: string; details: EnumTypeDetails }
  | {
      type: "object";
      name: string;
      subtitle?: string;
      details: ObjectTypeDetails[];
    };

function nextSiblingWhere(
  ele: HTMLElement,
  predicate: (ele: HTMLElement) => boolean,
): HTMLElement | null {
  let sibling = ele.nextElementSibling as HTMLElement | null;
  while (sibling) {
    if (predicate(sibling)) {
      return sibling;
    }
    sibling = sibling.nextElementSibling as HTMLElement | null;
  }
  return null;
}

export function htmlToData(html: string): {
  typeDetails: TypeDetails[];
  apiEndpoint: string;
  apiCategories: Record<
    string,
    {
      requiredScope: string | null;
      endpoints: {
        name: string;
        method: string;
        path: string;
        type: TypeDetails;
      }[];
    }
  >;
} {
  const dom = new JSDOM(html);

  const typesArticle = dom.window.document.querySelector("article#types");

  if (!typesArticle) {
    throw new Error("Types article not found");
  }

  const tables = typesArticle.querySelectorAll("table");

  const apiEndpointElement = dom.window.document.querySelector(
    "article#endpoint code",
  );
  if (!apiEndpointElement) {
    throw new Error("API endpoint element not found");
  }

  const apiArticles = Array.from(
    dom.window.document.querySelectorAll("article"),
  ).filter(
    (article) =>
      !article.id.startsWith("endpoint") &&
      article.id !== "types" &&
      article.id !== "extra",
  );

  const apiCategories = Object.fromEntries(
    apiArticles
      .map((apiArticle) => {
        const articleName = apiArticle.querySelector("h2")?.textContent.trim();
        if (!articleName) {
          console.warn(`Article without a name found, skipping`, apiArticle.id);
          return null;
        }

        const requiredScope =
          apiArticle
            .querySelector('div[role="doc-subtitle"]')
            ?.querySelector("a")
            ?.textContent.trim() ?? null;

        if (!requiredScope) {
          console.warn(`No required scope found for article ${apiArticle.id}`);
          // Unknown if scope is required for everything, so we continue processing
        }

        return [
          articleName,
          {
            requiredScope,
            endpoints: Array.from(apiArticle.querySelectorAll("h3")).map(
              (endpointHeader) => {
                const id = endpointHeader.id;

                const prettyName = endpointHeader.textContent.trim();
                if (!prettyName) {
                  throw new Error(
                    `No name found for endpoint ${id} in article ${apiArticle.id}#${id}`,
                  );
                }

                const methodAndPath = nextSiblingWhere(
                  endpointHeader,
                  (ele) => ele.tagName === "PRE",
                )?.querySelector("code")?.textContent;

                if (!methodAndPath) {
                  throw new Error(
                    `No method and path found for endpoint ${id} in article ${apiArticle.id}#${id}`,
                  );
                }

                // TODO: extract required headers

                // TODO: extract query parameters

                // TODO: extract body parameters

                const [method, path] = methodAndPath.split(" ");

                const returnsTable = nextSiblingWhere(
                  endpointHeader,
                  (ele) =>
                    ele.tagName === "H4" && ele.textContent.includes("Returns"),
                )?.nextElementSibling?.querySelector<HTMLTableElement>("table");

                if (!returnsTable) {
                  throw new Error(
                    `No table found for endpoint ${id} in article ${apiArticle.id}#${id}`,
                  );
                }

                const type = convertTableToTypeDetails(
                  "object",
                  `${articleName} ${prettyName} Response`,
                  undefined,
                  returnsTable,
                );
                if (!type) {
                  throw new Error(
                    `Failed to convert table to type details for endpoint ${id} in article ${apiArticle.id}#${id}`,
                  );
                }

                return {
                  name: prettyName,
                  method,
                  path,
                  type,
                };
              },
            ),
          },
        ] as const;
      })
      .filter((val): val is NonNullable<typeof val> => val !== null),
  );

  return {
    apiEndpoint: apiEndpointElement.textContent.trim(),
    apiCategories,
    typeDetails: [
      ...Array.from(tables)
        .map((table) => findTableDetails(table, dom.window))
        .filter((val): val is NonNullable<typeof val> => val !== null),
      ...Object.values(apiCategories)
        .flatMap((category) => category.endpoints)
        .map((endpoint) => endpoint.type),
    ],
  };
}

function convertObjectRowsToTypeDetails(
  table: HTMLTableElement,
): ObjectTypeDetails[] | null {
  const headerKeys = Array.from(table.querySelectorAll("thead tr th"))
    .map((th) => th.textContent.trim())
    .filter(Boolean);

  const keyStrings = ["Key"];
  const valueTypeStrings = ["Value Type", "Type"];
  const extraInfoStrings = ["Extra Information", "Information"];

  const keyHeader = headerKeys.find((key) => keyStrings.includes(key));
  const valueTypeHeader = headerKeys.find((key) =>
    valueTypeStrings.includes(key),
  );
  const extraInfoHeader = headerKeys.find((key) =>
    extraInfoStrings.includes(key),
  );

  if (!keyHeader) {
    console.warn('No "Key" column found in table, skipping');
    return null;
  }
  if (!valueTypeHeader) {
    console.warn('No "Value Type" column found in table, skipping');
    return null;
  }

  const rows = Array.from(table.querySelectorAll("tbody tr")).map((tr) => {
    const cells = Array.from(tr.querySelectorAll("td"));
    const row: Record<string, string> = {};
    for (let i = 0; i < headerKeys.length; i++) {
      row[headerKeys[i]] = cells[i]?.textContent || "";
    }
    return row;
  });

  const typeDetails: ObjectTypeDetails[] = [];
  for (const row of rows) {
    let key = row[keyHeader];
    const valueType = row[valueTypeHeader];
    const extraInfo = extraInfoHeader ? row[extraInfoHeader] : undefined;

    if (!key || !valueType) {
      console.warn("Missing required fields in row, skipping");
      continue;
    }

    // find parent if applicable
    let parent: ObjectTypeDetails[] = typeDetails;
    while (key.startsWith(htmlTab)) {
      key = key.slice(htmlTab.length);
      let newParent = parent[parent.length - 1].children;
      if (!newParent) {
        newParent = [];
        parent[parent.length - 1].children = newParent;
      }
      parent = newParent;
    }

    if (key.startsWith(htmlKeyChar)) {
      // indicates something new needs to be created
      key = key.slice(htmlKeyChar.length); // Remove the htmlKeyChar
      let newParent = parent[parent.length - 1].children;
      if (!newParent) {
        newParent = [];
        parent[parent.length - 1].children = newParent;
      }
      parent = newParent;
    }

    const typeDetail: ObjectTypeDetails = {
      key: key.trim(),
      valueType,
      extraInfo: extraInfo || undefined,
    };

    parent.push(typeDetail);
  }

  return typeDetails;
}

function convertEnumRowsToTypeDetails(
  table: HTMLTableElement,
): EnumTypeDetails | null {
  const headerKeys = Array.from(table.querySelectorAll("thead tr th"))
    .map((th) => th.textContent.trim())
    .filter(Boolean);

  if (!headerKeys.includes("Value") || !headerKeys.includes("Information")) {
    console.warn('No "Value" or "Information" column found in table, skipping');
    return null;
  }

  const rows = Array.from(table.querySelectorAll("tbody tr")).map((tr) => {
    const cells = Array.from(tr.querySelectorAll("td"));
    const row: Record<string, string> = {};
    for (let i = 0; i < headerKeys.length; i++) {
      row[headerKeys[i]] = cells[i]?.textContent || "";
    }
    return row;
  });

  const enumDetails: EnumTypeDetails = { values: new Map() };
  for (const row of rows) {
    const value = row["Value"];
    const info = row["Information"];

    if (!value || !info) {
      console.warn("Missing required fields in row, skipping");
      continue;
    }

    // Parse the value, which can be a number or a string
    const parsedValue = parseInt(value, 10);
    if (isNaN(parsedValue)) {
      console.warn(`Invalid value "${value}" in row, skipping`);
      continue;
    }

    // Store the information associated with the value
    enumDetails.values.set(parsedValue, info.trim());
  }

  return enumDetails;
}

function convertTableToTypeDetails(
  typeType: string,
  typeName: string,
  subtitle: string | undefined,
  table: HTMLTableElement,
): TypeDetails | null {
  switch (typeType) {
    case "enum": {
      const enumDetails = convertEnumRowsToTypeDetails(table);
      if (!enumDetails) {
        console.warn("No enum details found in table, skipping");
        return null;
      }
      return {
        type: "enum",
        name: typeName,
        details: enumDetails,
        subtitle,
      };
    }
    case "object": {
      const details = convertObjectRowsToTypeDetails(table);
      if (!details) {
        console.warn("No details found in table, skipping");
        return null;
      }

      return {
        type: "object",
        name: typeName,
        details: details,
        subtitle,
      };
    }
    default:
      console.warn(`Unknown type "${typeType}" in header, skipping`);
      return null;
  }
}

function findTableDetails(
  table: HTMLTableElement,
  { Node }: DOMWindow,
): TypeDetails | null {
  let header: ChildNode | null = table.previousSibling;
  let subtitle: string | undefined;
  while (
    header &&
    (header.nodeType !== Node.ELEMENT_NODE || header.nodeName !== "H3")
  ) {
    if (header.nodeName === "DIV") {
      const div = header as HTMLDivElement;
      if (div.getAttribute("role") === "doc-subtitle") {
        subtitle = div.textContent.trim() || undefined;
      }
    }
    header = header.previousSibling;
  }

  if (!header) {
    console.warn("No header found for table, skipping");
    return null;
  }

  if (header.nodeType !== Node.ELEMENT_NODE) {
    console.warn("Header is not an element node, skipping");
    return null;
  }

  const typeType = (header as HTMLElement)
    .querySelector("small")
    ?.textContent.trim();
  if (!typeType) {
    console.warn("No type info found in header, skipping");
    return null;
  }

  const typeName = (header as HTMLElement)
    .querySelector("small")
    ?.nextSibling?.textContent?.trim();
  if (!typeName) {
    console.warn("No type name found in header, skipping");
    return null;
  }

  return convertTableToTypeDetails(typeType, typeName, subtitle, table);
}
