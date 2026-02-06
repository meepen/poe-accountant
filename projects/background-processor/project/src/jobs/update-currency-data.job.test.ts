import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const setMock = vi.fn();
const pttlMock = vi.fn();
const pexpireMock = vi.fn();
const evalMock = vi.fn();

vi.mock("../connections/valkey.js", () => ({
  valkey: {
    set: setMock,
    pttl: pttlMock,
    pexpire: pexpireMock,
    eval: evalMock,
  },
}));

vi.mock("../connections/poe-api.js", () => ({
  appApi: {
    getExchangeMarkets: vi.fn(),
  },
  realms: ["pc", "console"],
}));

describe("UpdateCurrencyDataJob", () => {
  const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

  beforeEach(() => {
    setMock.mockReset();
    pttlMock.mockReset();
    pexpireMock.mockReset();
    evalMock.mockReset();
    logSpy.mockClear();
    warnSpy.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("skips processing when lock is already held", async () => {
    setMock.mockResolvedValue(null);
    pttlMock.mockResolvedValue(-1);

    const { UpdateCurrencyDataJob } =
      await import("./update-currency-data.job.js");

    const processRealmSpy = vi
      .spyOn(
        UpdateCurrencyDataJob as unknown as { processRealm: () => void },
        "processRealm",
      )
      .mockResolvedValue(undefined);

    await UpdateCurrencyDataJob.processNow();

    expect(pttlMock).toHaveBeenCalledTimes(1);
    expect(pexpireMock).toHaveBeenCalledTimes(1);
    expect(processRealmSpy).not.toHaveBeenCalled();
  });

  it("processes all realms when lock is acquired", async () => {
    setMock.mockResolvedValue("OK");
    evalMock.mockResolvedValue(1);

    const { UpdateCurrencyDataJob } =
      await import("./update-currency-data.job.js");

    const processRealmSpy = vi
      .spyOn(
        UpdateCurrencyDataJob as unknown as { processRealm: () => void },
        "processRealm",
      )
      .mockResolvedValue(undefined);

    await UpdateCurrencyDataJob.processNow();

    expect(processRealmSpy).toHaveBeenCalledTimes(2);
    expect(evalMock).toHaveBeenCalledTimes(1);
  });
});
