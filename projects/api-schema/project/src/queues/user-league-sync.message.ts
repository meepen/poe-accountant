import { z } from "zod";

export const UserLeagueSyncMessageQueue = "user_league_sync_queue";

export const UserLeagueSyncMessage = z.object({
  userId: z.uuid(),
});

export const UserLeagueSyncMailboxSchema = z.object({
  targetQueue: z.literal(UserLeagueSyncMessageQueue),
  message: UserLeagueSyncMessage,
});
