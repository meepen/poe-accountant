import { beforeEach, describe, expect, it, vi } from "vitest";

const defineCommandMock = vi.fn();
const smembersMock = vi.fn();
const delMock = vi.fn();
const getMock = vi.fn();
const mgetMock = vi.fn();
const checkPoeLimitsMock = vi.fn();
const rollbackPoeHitMock = vi.fn();
const pipelineExecMock = vi.fn();
const pipelineSetMock = vi.fn();
const pipelineSyncPoeStateMock = vi.fn();
const multiExecMock = vi.fn();
const multiDelMock = vi.fn();
const multiSaddMock = vi.fn();
const multiSetMock = vi.fn();

const pipelineMock = {
  set: pipelineSetMock,
  syncPoeState: pipelineSyncPoeStateMock,
  exec: pipelineExecMock,
};

const multiMock = {
  del: multiDelMock,
  sadd: multiSaddMock,
  set: multiSetMock,
  exec: multiExecMock,
};

const valkeyMock = {
  defineCommand: defineCommandMock,
  smembers: smembersMock,
  del: delMock,
  get: getMock,
  mget: mgetMock,
  checkPoeLimits: checkPoeLimitsMock,
  rollbackPoeHit: rollbackPoeHitMock,
  multi: vi.fn(() => multiMock),
  pipeline: vi.fn(() => pipelineMock),
};

vi.mock("../../connections/valkey.js", () => ({
  valkey: valkeyMock,
  valkeyForBullMQ: {},
}));

describe("PoeRateLimiter", () => {
  beforeEach(() => {
    vi.resetModules();
    defineCommandMock.mockReset();
    smembersMock.mockReset();
    delMock.mockReset();
    getMock.mockReset();
    mgetMock.mockReset();
    checkPoeLimitsMock.mockReset();
    rollbackPoeHitMock.mockReset();
    pipelineExecMock.mockReset();
    pipelineSetMock.mockReset();
    pipelineSyncPoeStateMock.mockReset();
    multiExecMock.mockReset();
    multiDelMock.mockReset();
    multiSaddMock.mockReset();
    multiSetMock.mockReset();

    delete (valkeyMock as Record<string, unknown>).checkPoeLimits;
    delete (valkeyMock as Record<string, unknown>).syncPoeState;
    delete (valkeyMock as Record<string, unknown>).rollbackPoeHit;

    multiDelMock.mockReturnValue(multiMock);
    multiSaddMock.mockReturnValue(multiMock);
    multiSetMock.mockReturnValue(multiMock);
    multiExecMock.mockResolvedValue([]);

    pipelineSetMock.mockReturnValue(pipelineMock);
    pipelineSyncPoeStateMock.mockReturnValue(pipelineMock);
    pipelineExecMock.mockResolvedValue([]);

    getMock.mockResolvedValue(null);
  });

  it("registers dynamic scripts on construction when missing", async () => {
    const { PoeRateLimiter } = await import("./rate-limiter.js");

    new PoeRateLimiter();

    expect(defineCommandMock).toHaveBeenCalledTimes(3);
    expect(defineCommandMock).toHaveBeenCalledWith(
      "checkPoeLimits",
      expect.objectContaining({ numberOfKeys: 0 }),
    );
    expect(defineCommandMock).toHaveBeenCalledWith(
      "syncPoeState",
      expect.objectContaining({ numberOfKeys: 1 }),
    );
    expect(defineCommandMock).toHaveBeenCalledWith(
      "rollbackPoeHit",
      expect.objectContaining({ numberOfKeys: 0 }),
    );
  });

  it("reserves slot using mapped policy and scoped rule names", async () => {
    const { PoeRateLimiter } = await import("./rate-limiter.js");

    (valkeyMock as Record<string, unknown>).checkPoeLimits = checkPoeLimitsMock;
    getMock.mockResolvedValue("currency-exchange");
    smembersMock.mockResolvedValue(["ip"]);
    checkPoeLimitsMock.mockResolvedValue(250);

    const limiter = new PoeRateLimiter({
      hitCountBuffer: 2,
      hitTimingBuffer: 300,
    });

    const delay = await limiter.reserveSlot(
      "currency-exchange",
      { ip: "1.2.3.4" },
      "job-123",
    );

    expect(delay).toBe(250);
    expect(getMock).toHaveBeenCalledWith("{poe}:map:e2p:currency-exchange");
    expect(smembersMock).toHaveBeenCalledWith(
      "{poe}:map:p2r:currency-exchange",
    );
    expect(checkPoeLimitsMock).toHaveBeenCalledWith(
      "job-123",
      1,
      2,
      300,
      "{poe}:probe:currency-exchange",
      "currency-exchange:ip:1.2.3.4",
    );
  });

  it("clears probe locks when updateRules receives no rate-limit headers", async () => {
    const { PoeRateLimiter } = await import("./rate-limiter.js");

    smembersMock.mockResolvedValue(["ip", "account"]);
    delMock.mockResolvedValue(2);

    const limiter = new PoeRateLimiter();
    await limiter.updateRules(
      "currency-exchange",
      { ip: "1.2.3.4" },
      new Headers(),
    );

    expect(delMock).toHaveBeenCalledWith("{poe}:probe:currency-exchange");
  });

  it("parses account headers and updates state + config", async () => {
    const { PoeRateLimiter } = await import("./rate-limiter.js");

    smembersMock.mockResolvedValue([]);

    const headers = new Headers({
      "x-rate-limit-policy": "Currency-Exchange",
      "x-rate-limit-rules": "Account",
      "x-rate-limit-account": "15:10:60,30:300:300",
      "x-rate-limit-account-state": "1:10:0,28:300:0",
    });

    const limiter = new PoeRateLimiter();
    await limiter.updateRules("currency-exchange", {}, headers);

    expect(pipelineSyncPoeStateMock).toHaveBeenCalledWith(
      "{poe}:limits:currency-exchange:account:10",
      1,
      10,
    );
    expect(pipelineSyncPoeStateMock).toHaveBeenCalledWith(
      "{poe}:limits:currency-exchange:account:300",
      28,
      300,
    );
    expect(pipelineSetMock).not.toHaveBeenCalled();
    expect(pipelineExecMock).toHaveBeenCalledTimes(1);

    expect(multiSetMock).toHaveBeenCalledWith(
      "{poe}:map:e2p:currency-exchange",
      "currency-exchange",
    );
    expect(multiDelMock).toHaveBeenCalledWith(
      "{poe}:map:p2r:currency-exchange",
    );
    expect(multiSaddMock).toHaveBeenCalledWith(
      "{poe}:map:p2r:currency-exchange",
      "account",
    );
    expect(multiDelMock).toHaveBeenCalledWith("{poe}:probe:currency-exchange");
    expect(multiSetMock).toHaveBeenCalledWith(
      "{poe}:config:rule:currency-exchange:account",
      JSON.stringify([
        [15, 10, 60],
        [30, 300, 300],
      ]),
    );
    expect(multiExecMock).toHaveBeenCalledTimes(1);
  });

  it("is not blocked after account headers are learned", async () => {
    const { PoeRateLimiter } = await import("./rate-limiter.js");

    (valkeyMock as Record<string, unknown>).checkPoeLimits = checkPoeLimitsMock;
    checkPoeLimitsMock.mockResolvedValue(0);
    smembersMock.mockResolvedValueOnce([]).mockResolvedValueOnce(["account"]);

    const headers = new Headers({
      "x-rate-limit-policy": "Currency-Exchange",
      "x-rate-limit-rules": "Account",
      "x-rate-limit-account": "15:10:60,30:300:300",
      "x-rate-limit-account-state": "1:10:0,28:300:0",
    });

    const limiter = new PoeRateLimiter();
    await limiter.updateRules("currency-exchange", {}, headers);

    const delay = await limiter.reserveSlot(
      "currency-exchange",
      {},
      "job-not-blocked",
    );

    expect(delay).toBe(0);
    expect(checkPoeLimitsMock).toHaveBeenCalledWith(
      "job-not-blocked",
      1,
      0,
      0,
      "{poe}:probe:currency-exchange",
      "currency-exchange:account",
    );
  });

  it("rolls back reserved hit and clears probe lock keys", async () => {
    const { PoeRateLimiter } = await import("./rate-limiter.js");

    (valkeyMock as Record<string, unknown>).rollbackPoeHit = rollbackPoeHitMock;
    getMock.mockResolvedValue("currency-exchange");
    smembersMock.mockResolvedValue(["ip", "account"]);
    mgetMock.mockResolvedValue([
      JSON.stringify([
        [20, 5],
        [100, 60],
      ]),
      null,
    ]);
    delMock.mockResolvedValue(2);
    rollbackPoeHitMock.mockResolvedValue(1);

    const limiter = new PoeRateLimiter();

    await limiter.rollbackSlot(
      "currency-exchange",
      { ip: "1.2.3.4" },
      "job-123",
    );

    expect(delMock).toHaveBeenCalledWith("{poe}:probe:currency-exchange");
    expect(rollbackPoeHitMock).toHaveBeenCalledWith(
      "job-123",
      "{poe}:limits:currency-exchange:ip:1.2.3.4:5",
      "{poe}:limits:currency-exchange:ip:1.2.3.4:60",
    );
  });
});
