import { prisma } from "./prisma.js";
import type { Prisma } from "../generated/prisma/client.js";

export type EntityType =
  "workspace" | "membership" | "project" | "task" | "comment";

export interface ActivityInput {
  workspaceId: string;
  actorId: string | null;
  entityType: EntityType;
  entityId: string;
  action: string;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Append an audit event. Pass the transaction client when the event must land
 * with the change it describes; otherwise the default client is used.
 */
export const recordActivity = (
  input: ActivityInput,
  client: Prisma.TransactionClient | typeof prisma = prisma,
) =>
  client.activityEvent.create({
    data: {
      workspaceId: input.workspaceId,
      actorId: input.actorId,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      ...(input.metadata === undefined ? {} : { metadata: input.metadata }),
    },
  });
