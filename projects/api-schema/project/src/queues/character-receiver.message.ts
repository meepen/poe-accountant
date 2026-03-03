import { z } from "zod";

export const CharacterReceiverMessageQueue = "character_receiver_queue";

export const CharacterReceiverMessage = z.object({
  userId: z.uuid(),
});

export const CharacterReceiverMailboxSchema = z.object({
  targetQueue: z.literal(CharacterReceiverMessageQueue),
  message: CharacterReceiverMessage,
});
