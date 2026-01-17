import { beforeEach, describe, it, expect, vi } from "vitest";

import { PoeApi } from "./poe-api.gen.js";
import { serverApiPaths } from "./poe.gen.js";
class PoeApiImplementation extends PoeApi {
  request = vi.fn();
}

describe("PoeApi", () => {
  let api: PoeApiImplementation;
  beforeEach(() => {
    api = new PoeApiImplementation();
  });

  it("should instantiate PoeApiImplementation", () => {
    expect(api).toBeDefined();
  });

  it("should call request method", async () => {
    await api.listLeagues();
    expect(api.request).toHaveBeenCalledWith(
      serverApiPaths["List Leagues"],
      serverApiPaths["List Leagues"].path,
    );
  });

  it("should fill path parameters", async () => {
    await api.getItemFilter("example-id");
    expect(api.request).toHaveBeenCalledWith(
      serverApiPaths["Get Item Filter"],
      "/item-filter/example-id",
    );
  });

  it("should handle missing optional path parameters", async () => {
    await api.getCharacter("example");
    expect(api.request).toHaveBeenCalledWith(
      serverApiPaths["Get Character"],
      "/character/example",
    );
  });

  it("should handle present optional path parameters", async () => {
    await api.getCharacter("example", "details");
    expect(api.request).toHaveBeenCalledWith(
      serverApiPaths["Get Character"],
      "/character/details/example",
    );
  });
});
