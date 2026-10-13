import { z } from "zod";
import { paginationSchema } from "../../lib/pagination.js";
import { Priority, TaskStatus } from "../../generated/prisma/enums.js";

export const taskIdParams = z.object({
  taskId: z.uuid(),
});

export const taskLabelParams = z.object({
  taskId: z.uuid(),
  labelId: z.uuid(),
});

export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(10_000).optional(),
  status: z.enum(TaskStatus).default(TaskStatus.BACKLOG),
  priority: z.enum(Priority).default(Priority.MEDIUM),
  assigneeId: z.uuid().nullish(),
  parentTaskId: z.uuid().nullish(),
  dueDate: z.coerce.date().nullish(),
  labelIds: z.array(z.uuid()).max(20).optional(),
});

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(10_000).nullable(),
    status: z.enum(TaskStatus),
    priority: z.enum(Priority),
    assigneeId: z.uuid().nullable(),
    dueDate: z.coerce.date().nullable(),
    position: z.number().int().min(0),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, "Provide at least one field");

export const updateStatusSchema = z.object({
  status: z.enum(TaskStatus),
});

export const updateAssigneeSchema = z.object({
  assigneeId: z.uuid().nullable(),
});

export const attachLabelSchema = z.object({
  labelId: z.uuid(),
});

const csvEnum = <T extends Record<string, string>>(values: T) =>
  z
    .union([z.enum(values), z.array(z.enum(values))])
    .optional()
    .transform((value) =>
      value === undefined ? undefined : Array.isArray(value) ? value : [value],
    );

export const listTasksQuery = paginationSchema.extend({
  status: csvEnum(TaskStatus),
  priority: csvEnum(Priority),
  // "me" and "unassigned" save callers from having to look up their own id.
  assigneeId: z
    .union([z.uuid(), z.literal("me"), z.literal("unassigned")])
    .optional(),
  projectId: z.uuid().optional(),
  labelId: z.uuid().optional(),
  parentTaskId: z.uuid().optional(),
  dueBefore: z.coerce.date().optional(),
  dueAfter: z.coerce.date().optional(),
  search: z.string().trim().min(1).max(200).optional(),
  topLevelOnly: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  sort: z
    .enum([
      "createdAt",
      "-createdAt",
      "updatedAt",
      "-updatedAt",
      "dueDate",
      "-dueDate",
      "priority",
      "-priority",
      "position",
      "-position",
    ])
    .default("-createdAt"),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuery>;
