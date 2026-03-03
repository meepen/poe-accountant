import schema, { League, User } from "./index.js";

describe("db-schema", () => {
  it("exports expected table definitions", () => {
    expect(schema.User).toBe(User);
    expect(schema.League).toBe(League);
  });

  it("defines important column names", () => {
    expect(User.id.name).toBe("id");
    expect(League.leagueId.name).toBe("league_id");
    expect(League.realm.name).toBe("realm");
  });
});
