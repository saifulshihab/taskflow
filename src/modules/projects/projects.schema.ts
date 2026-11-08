import { z } from "zod";
import { paginationSchema } from "../../lib/pagination.js";
import {
  ProjectStatus,
  TaskStatus,
  Priority,
} from "../../generated/prisma/enums.js";
export const projectIdParams = z.object({ projectId: z.uuid() });
const key = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z][A-Z0-9]{0,4}$/);
const fields = {
  name: z.string().trim().min(1).max(120),
  key: key.optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  status: z.enum(ProjectStatus).default(ProjectStatus.ACTIVE),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
};
export const createProjectSchema = z.object(fields);
export const updateProjectSchema = z
  .object({
    ...fields,
    status: z.enum(ProjectStatus),
    seats: z.number().int().min(1).max(100),
    defaultStatus: z.enum(TaskStatus),
    defaultPriority: z.enum(Priority),
    showCancelled: z.boolean(),
    wipLimit: z.number().int().min(0).max(99),
    cardFields: z.object({
      assignee: z.boolean(),
      due: z.boolean(),
      labels: z.boolean(),
      subtasks: z.boolean(),
      comments: z.boolean(),
    }),
  })
  .partial()
  .refine((d) => Object.keys(d).length > 0, "Provide at least one field");
export const listProjectsQuery = paginationSchema.extend({
  status: z.enum(ProjectStatus).optional(),
  search: z.string().trim().max(120).optional(),
  includeArchived: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ListProjectsQuery = z.infer<typeof listProjectsQuery>;
