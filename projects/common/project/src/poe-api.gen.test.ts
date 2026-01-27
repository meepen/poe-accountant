import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { z } from "zod";

import { PoeApi } from "./poe-api.gen.js";

class PoeApiImplementation extends PoeApi {
  authenticate = vi.fn().mockResolvedValue("mock-token");
  voidAuthentication = vi.fn().mockResolvedValue(undefined);
  fetch = vi.fn();

  public static readonly ENDPOINT_DEF = {
    method: "GET",
    path: "/:test",
    responseType: z.object({
      name: z.string().optional(),
      some: z.string().optional(),
    }),
  } as any;

  public async testRequest(path: string = "test") {
    return this.request(PoeApiImplementation.ENDPOINT_DEF, path);
  }
}

describe("PoeApi", () => {
  let api: PoeApiImplementation;

  beforeEach(() => {
    api = new PoeApiImplementation();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should perform a basic request", async () => {
    api.fetch.mockResolvedValue(
      new Response(JSON.stringify({ name: "TestName" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const response = await api.testRequest("test-path");

    expect(api.authenticate).toHaveBeenCalledTimes(1);
    expect(api.fetch).toHaveBeenCalledTimes(1);
    expect(response).toEqual({ name: "TestName" });
  });
});
