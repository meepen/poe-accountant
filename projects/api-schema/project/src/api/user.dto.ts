import { z } from "zod";

export const sessionCookieName = "session";

export const UserDto = z.object({
  id: z.uuid(),
  username: z.string(),
  authorizationToken: z.string(),
  expiresAt: z.iso.datetime(),
});
