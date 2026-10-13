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
  role: z.enum(Role).default(Role.MEMBER),
});

export const updateMemberSchema = z.object({
  role: z.enum(Role),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
