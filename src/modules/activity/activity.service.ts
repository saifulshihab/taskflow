import { prisma } from "../../lib/prisma.js";
import { requireMembership, visibleProjects } from "../../lib/rbac.js";
import { forbidden } from "../../lib/errors.js";
import { paginated, toSkipTake } from "../../lib/pagination.js";
import { Role } from "../../generated/prisma/enums.js";
import type { Actor } from "../../lib/actor.js";
import type { Prisma } from "../../generated/prisma/client.js";
import type { ListActivityQuery } from "./activity.schema.js";
export const list = async (
  actor: Actor,
  workspaceId: string,
  q: ListActivityQuery,
) => {
  const m = await requireMembership(actor.id, workspaceId);
  const owner = m.role === Role.WORKSPACE_OWNER;
  if (
    !owner &&
    (q.entityType ||
      q.entityId ||
      q.actorId ||
      q.action ||
      q.since ||
      q.projectId)
  )
    throw forbidden("Activity filters are owner-only");
  const projects = owner
    ? []
    : await prisma.project.findMany({
        where: visibleProjects(actor.id, workspaceId),
        select: { id: true },
      });
  const where: Prisma.ActivityEventWhereInput = {
    workspaceId,
    ...(!owner ? { projectId: { in: projects.map((p) => p.id) } } : {}),
    ...(q.projectId ? { projectId: q.projectId } : {}),
    ...(q.entityType ? { entityType: q.entityType } : {}),
    ...(q.entityId ? { entityId: q.entityId } : {}),
    ...(q.actorId ? { actorId: q.actorId } : {}),
    ...(q.action ? { action: q.action } : {}),
    ...(q.since ? { createdAt: { gte: q.since } } : {}),
  };
  const [data, total] = await Promise.all([
    prisma.activityEvent.findMany({
      where,
      ...toSkipTake(q),
      include: { actor: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.activityEvent.count({ where }),
  ]);
  return paginated(data, total, q);
};
