import app from "./index";
import { testEnv } from "./test/test-env";

describe("api app", () => {
  it("returns health status", async () => {
    const response = await app.request(
      "http://localhost/health",
      undefined,
      testEnv,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "ok" });
  });
});
