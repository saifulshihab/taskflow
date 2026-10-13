import { z } from "zod";

export const commentIdParams = z.object({
  commentId: z.uuid(),
});

export const createCommentSchema = z.object({
  body: z.string().trim().min(1).max(10_000),
});

export const updateCommentSchema = z.object({
  body: z.string().trim().min(1).max(10_000),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
