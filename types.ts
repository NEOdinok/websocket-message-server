import { z } from "zod";

export const MessageSchema = z
  .object({
    text: z.string().min(1),
    createdAt: z.date().default(() => new Date()),
  })
  .strict();

export type Message = z.infer<typeof MessageSchema>;
