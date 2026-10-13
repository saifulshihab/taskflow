import { z } from "zod";
import { paginationSchema } from "../../lib/pagination.js";

export const listActivityQuery = paginationSchema.extend({
  entityType: z
    .enum(["workspace", "membership", "project", "task", "comment"])
    .optional(),
  entityId: z.uuid().optional(),
  actorId: z.uuid().optional(),
  action: z.string().trim().min(1).max(60).optional(),
  since: z.coerce.date().optional(),
});

export type ListActivityQuery = z.infer<typeof listActivityQuery>;
