import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const selectMock = vi.fn();
const transactionMock = vi.fn();

vi.mock("../connections/db.js", () => ({
  db: {
    select: selectMock,
    transaction: transactionMock,
  },
}));

const makeSelectChain = <T>(result: T[]) => {
  const chain = {
    from: vi.fn(() => chain),
    innerJoin: vi.fn(() => chain),
    leftJoin: vi.fn(() => chain),
    where: vi.fn(() => chain),
    orderBy: vi.fn(() => chain),
    limit: vi.fn(async () => result),
  };
  return chain;
};

describe("UpdateCurrencySnapshotsJob", () => {
  const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

  beforeEach(() => {
    selectMock.mockReset();
    transactionMock.mockReset();
    logSpy.mockClear();
    warnSpy.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("skips when no missing snapshots are found", async () => {
    selectMock.mockReturnValue(makeSelectChain([]));

    const { UpdateCurrencySnapshotsJob } =
      await import("./update-currency-snapshots.job.js");

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

    selectMock.mockReturnValue(makeSelectChain([history]));
    transactionMock.mockImplementation(
      async (handler: (tx: unknown) => void) => {
        handler({
          query: {
            CurrencyExchangeLeagueSnapshotData: {
              findFirst: vi.fn().mockResolvedValue({ historyId: history.id }),
            },
          },
        });
      },
    );

    const { UpdateCurrencySnapshotsJob } =
      await import("./update-currency-snapshots.job.js");

    const persistSpy = vi
      .spyOn(UpdateCurrencySnapshotsJob, "persistExchangeSnapshots")
      .mockResolvedValue(null);

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

    selectMock.mockReturnValue(makeSelectChain([history]));
    transactionMock.mockImplementation(
      async (handler: (tx: unknown) => void) => {
        handler({
          query: {
            CurrencyExchangeLeagueSnapshotData: {
              findFirst: vi.fn().mockResolvedValue(null),
            },
          },
        });
      },
    );

    const { UpdateCurrencySnapshotsJob } =
      await import("./update-currency-snapshots.job.js");

    const persistSpy = vi
      .spyOn(UpdateCurrencySnapshotsJob, "persistExchangeSnapshots")
      .mockResolvedValue(null);

    await UpdateCurrencySnapshotsJob.processNow();

    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(persistSpy).toHaveBeenCalledWith(
      {},
      "pc",
      {
        timestamp: history.timestamp,
        nextChangeId: history.timestamp,
      },
      new Map([["Standard", history]]),
    );
  });
});
