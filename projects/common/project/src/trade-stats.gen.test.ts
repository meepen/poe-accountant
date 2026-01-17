import { describe, it, expect } from "vitest";

describe("Trade Stats", () => {
  it("should import", async () => {
    const stats = await import("./trade-stats.gen.js");
    expect(stats).toBeDefined();
  });

  it("should have tradeStats export", async () => {
    const stats = await import("./trade-stats.gen.js");
    expect(stats.tradeStats).toBeDefined();
    expect(stats.tradeStats.result).toBeInstanceOf(Array);
    expect(stats.tradeStats.result.length).toBeGreaterThan(0);
  });
});
