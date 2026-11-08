import { z } from "zod";
import { Role } from "../../generated/prisma/enums.js";

export const workspaceIdParams = z.object({
  workspaceId: z.uuid(),
});

export const memberParams = z.object({
  workspaceId: z.uuid(),
  userId: z.uuid(),
});

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens")
    .optional(),
});

export const updateWorkspaceSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, "Provide at least one field");

export const addMemberSchema = z.object({
  email: z.email().toLowerCase(),
});

export const updateMemberSchema = z.object({
  active: z.boolean(),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;

export const transferSchema = z.object({
  userId: z.uuid(),
  assignments: z
    .array(
      z.object({
        projectId: z.uuid(),
        role: z.enum([Role.ADMIN, Role.MEMBER]),
      }),
    )
    .max(100),
});
