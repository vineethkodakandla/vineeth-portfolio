import { z } from "zod";

// Request-body schemas. Each API route validates with `.safeParse` and returns
// 400 on failure, replacing ad-hoc try/catch parsing.

export const chatBodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(8000),
      })
    )
    .min(1)
    .max(40),
});

export const contactBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  message: z.string().trim().min(1).max(4000),
  // Honeypot: real users never see this field. We let any value through
  // validation and handle it in the route (soft-accept) so bots aren't tipped off.
  company: z.string().max(200).optional(),
});

export const trackBodySchema = z.object({
  type: z.enum(["pageview", "project"]),
  path: z.string().max(512).optional(),
  id: z.string().max(64).optional(),
});

export type ChatBody = z.infer<typeof chatBodySchema>;
export type ContactBody = z.infer<typeof contactBodySchema>;
export type TrackBody = z.infer<typeof trackBodySchema>;
