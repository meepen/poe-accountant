import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const findManyMock = vi.fn();
const transactionMock = vi.fn();

vi.mock("../connections/db.js", () => ({
  db: {
    query: {
      CurrencyExchangeHistory: {
        findMany: findManyMock,
      },
    },
    transaction: transactionMock,
  },
}));

describe("UpdateCurrencySnapshotsJob", () => {
  const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

  beforeEach(() => {
    findManyMock.mockReset();
    transactionMock.mockReset();
    logSpy.mockClear();
    warnSpy.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("skips when no missing snapshots are found", async () => {
    findManyMock.mockResolvedValue([]);

    const { UpdateCurrencySnapshotsJob } = await import(
      "./update-currency-snapshots.job.js"
    );

    await UpdateCurrencySnapshotsJob.processNow();

    expect(transactionMock).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(
      "[currency-snapshots] No missing snapshots detected.",
    );
  });

  it("skips when snapshot already exists", async () => {
    const history = {
      id: "history-id",
      realm: "pc",
      leagueId: "Standard",
      timestamp: new Date("2024-01-01T00:00:00.000Z"),
      nextTimestamp: null,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
    };

    findManyMock
      .mockResolvedValueOnce([
        {
          ...history,
          currencies: [{ id: "currency-1" }],
          snapshotData: [],
        },
      ])
      .mockResolvedValueOnce([]);
    transactionMock.mockImplementation(
      async (handler: (tx: unknown) => Promise<unknown>) => {
        await handler({
          query: {
            CurrencyExchangeLeagueSnapshotData: {
              findFirst: vi.fn().mockResolvedValue({ historyId: history.id }),
            },
          },
        });
      },
    );

    const { UpdateCurrencySnapshotsJob } = await import(
      "./update-currency-snapshots.job.js"
    );

    const persistSpy = vi
      .spyOn(UpdateCurrencySnapshotsJob, "persistExchangeSnapshots")
      .mockResolvedValue();

    await UpdateCurrencySnapshotsJob.processNow();

    expect(persistSpy).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(
      `[currency-snapshots] Snapshot already exists for history ${history.id}, skipping.`,
    );
  });

  it("backfills missing snapshots", async () => {
    const history = {
      id: "history-id",
      realm: "pc",
      leagueId: "Standard",
      timestamp: new Date("2024-01-01T00:00:00.000Z"),
      nextTimestamp: null,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
    };

    findManyMock
      .mockResolvedValueOnce([
        {
          ...history,
          currencies: [{ id: "currency-1" }],
          snapshotData: [],
        },
      ])
      .mockResolvedValueOnce([]);

    const txMock = {
      query: {
        CurrencyExchangeLeagueSnapshotData: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
      },
    };

    transactionMock.mockImplementation(
      async (handler: (tx: unknown) => Promise<unknown>) => {
        await handler(txMock);
      },
    );

    const { UpdateCurrencySnapshotsJob } = await import(
      "./update-currency-snapshots.job.js"
    );

    const persistSpy = vi
      .spyOn(UpdateCurrencySnapshotsJob, "persistExchangeSnapshots")
      .mockResolvedValue();

    await UpdateCurrencySnapshotsJob.processNow();

    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(persistSpy).toHaveBeenCalledTimes(1);

    const [txArg, realmArg, contextArg, historyMapArg] =
      persistSpy.mock.calls[0];

    expect(txArg).toBe(txMock);
    expect(realmArg).toBe("pc");
    expect(contextArg).toEqual({
      timestamp: history.timestamp,
      nextChangeId: history.timestamp,
    });
    expect(historyMapArg).toBeInstanceOf(Map);
    expect(
      (historyMapArg as Map<string, { id: string }>).get("Standard")?.id,
    ).toBe(history.id);
  });
});
