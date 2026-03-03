import app from "../index";
import { testEnv } from "../test/test-env";

describe("redirect safety", () => {
  it("returns 400 on invalid login redirect target", async () => {
    const response = await app.request(
      "http://localhost/redirect/login?redirect_to=https://evil.example.com/phish",
      undefined,
      testEnv,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid redirect target",
    });
  });

  it("returns 400 when login redirect_to is not a valid URL", async () => {
    const response = await app.request(
      "http://localhost/redirect/login?redirect_to=not-a-url",
      undefined,
      testEnv,
    );

    expect(response.status).toBe(400);
  });

  it("returns 400 when callback query is missing required params", async () => {
    const response = await app.request(
      "http://localhost/redirect",
      undefined,
      testEnv,
    );

    expect(response.status).toBe(400);
  });
});
