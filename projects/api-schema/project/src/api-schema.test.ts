import { UserDto } from "./api/dtos/user/user.dto.js";

describe("api-schema", () => {
  it("parses valid user DTO payloads", () => {
    const parsed = UserDto.parse({
      id: "6f3ef8d5-8cc3-4c77-8e2b-4f5ea2495810",
      username: "tester",
      authorizationToken: "token",
      expiresAt: new Date().toISOString(),
    });

    expect(parsed.username).toBe("tester");
  });
});
