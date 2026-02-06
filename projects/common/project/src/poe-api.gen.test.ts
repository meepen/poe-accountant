import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { z } from "zod";

import { PoeApi } from "./poe-api.gen.js";

class PoeApiImplementation extends PoeApi {
  protected override readonly userAgent = "PoeApiImplementation-Test-Agent";
  override authenticate = vi.fn().mockResolvedValue("mock-token");
  override voidAuthentication = vi.fn().mockResolvedValue(undefined);
  override fetch = vi.fn<InstanceType<typeof PoeApi>["fetch"]>();

  public static readonly ENDPOINT_DEF = {
    method: "GET",
    path: "/:realm",
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

  it('should get rid of `realm` parameter when it is "pc" and optional', async () => {
    api.fetch.mockResolvedValue(new Response(null, { status: 400 }));
    await expect(
      api.getCharacter({ name: "name", realm: "pc" }),
    ).rejects.toThrow();

    expect(api.fetch).toHaveBeenCalledWith(
      expect.any(Object),
      expect.toSatisfy((url: URL) =>
        url.toString().endsWith("/character/name"),
      ),
      expect.any(Object),
    );
  });
});
