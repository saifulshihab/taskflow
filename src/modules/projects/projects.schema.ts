import { z } from "zod";
import { paginationSchema } from "../../lib/pagination.js";
import { ProjectStatus } from "../../generated/prisma/enums.js";

export const projectIdParams = z.object({
  projectId: z.uuid(),
});

export const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(120),
  key: z
    .string()
    .trim()
    .toUpperCase()
    .min(2)
    .max(10)
    .regex(/^[A-Z0-9]+$/, "Use uppercase letters and numbers")
    .optional(),
  description: z.string().trim().max(2000).optional(),
  status: z.enum(ProjectStatus).default(ProjectStatus.ACTIVE),
});

export const updateProjectSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(2000).nullable(),
    status: z.enum(ProjectStatus),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, "Provide at least one field");

export const listProjectsQuery = paginationSchema.extend({
  status: z.enum(ProjectStatus).optional(),
  search: z.string().trim().min(1).max(120).optional(),
  includeArchived: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ListProjectsQuery = z.infer<typeof listProjectsQuery>;
