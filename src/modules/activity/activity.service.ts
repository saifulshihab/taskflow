import { paginated, toSkipTake } from "../../lib/pagination.js";
import { prisma } from "../../lib/prisma.js";
import { requireMembership } from "../../lib/rbac.js";
import type { Actor } from "../../lib/actor.js";
import type { Prisma } from "../../generated/prisma/client.js";
import type { ListActivityQuery } from "./activity.schema.js";

export const list = async (
  actor: Actor,
  workspaceId: string,
  query: ListActivityQuery,
) => {
  await requireMembership(actor.id, workspaceId);

  const where: Prisma.ActivityEventWhereInput = {
    workspaceId,
    ...(query.entityType ? { entityType: query.entityType } : {}),
    ...(query.entityId ? { entityId: query.entityId } : {}),
    ...(query.actorId ? { actorId: query.actorId } : {}),
    ...(query.action ? { action: query.action } : {}),
    ...(query.since ? { createdAt: { gte: query.since } } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.activityEvent.findMany({
      where,
      ...toSkipTake(query),
      orderBy: { createdAt: "desc" },
      include: { actor: { select: { id: true, email: true, name: true } } },
    }),
    prisma.activityEvent.count({ where }),
  ]);

  return paginated(data, total, query);
};
