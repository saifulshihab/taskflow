import { recordActivity } from "../../lib/activity.js";
import { badRequest, conflict } from "../../lib/errors.js";
import { paginated, toSkipTake } from "../../lib/pagination.js";
import { prisma } from "../../lib/prisma.js";
import { requireMembership } from "../../lib/rbac.js";
import { projectScope } from "../../lib/scope.js";
import type { Actor } from "../../lib/actor.js";
import type { Prisma } from "../../generated/prisma/client.js";
import { Role } from "../../generated/prisma/enums.js";
import type {
  CreateProjectInput,
  ListProjectsQuery,
  UpdateProjectInput,
} from "./projects.schema.js";

const deriveKey = (name: string) => {
  const words = name
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  const initials = words.map((word) => word[0]).join("");
  const candidate = initials.length >= 2 ? initials : (words[0] ?? "PROJ");
  return candidate.slice(0, 10).padEnd(2, "X");
};

const availableKey = async (workspaceId: string, desired: string) => {
  const base = deriveKey(desired);
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}${attempt + 1}`;
    const taken = await prisma.project.findUnique({
      where: { workspaceId_key: { workspaceId, key: candidate } },
      select: { id: true },
    });
    if (!taken) return candidate;
  }
  throw conflict("Could not derive a free project key; provide one explicitly");
};

export const create = async (
  actor: Actor,
  workspaceId: string,
  input: CreateProjectInput,
) => {
  await requireMembership(actor.id, workspaceId, Role.MEMBER);

  let key: string;
  if (input.key) {
    const taken = await prisma.project.findUnique({
      where: { workspaceId_key: { workspaceId, key: input.key } },
      select: { id: true },
    });
    if (taken) throw conflict("Project key is already used in this workspace");
    key = input.key;
  } else {
    key = await availableKey(workspaceId, input.name);
  }

  const project = await prisma.project.create({
    data: {
      workspaceId,
      key,
      name: input.name,
      status: input.status,
      ...(input.description === undefined
        ? {}
        : { description: input.description }),
    },
  });

  await recordActivity({
    workspaceId,
    actorId: actor.id,
    entityType: "project",
    entityId: project.id,
    action: "project.created",
    metadata: { name: project.name, key: project.key },
  });

  return project;
};

export const list = async (
  actor: Actor,
  workspaceId: string,
  query: ListProjectsQuery,
) => {
  await requireMembership(actor.id, workspaceId);

  const where: Prisma.ProjectWhereInput = {
    workspaceId,
    ...(query.includeArchived ? {} : { archivedAt: null }),
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" } },
            { key: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.project.findMany({
      where,
      ...toSkipTake(query),
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { tasks: true } } },
    }),
    prisma.project.count({ where }),
  ]);

  return paginated(data, total, query);
};

export const get = async (actor: Actor, projectId: string) => {
  const { project } = await projectScope(actor.id, projectId);

  const counts = await prisma.task.groupBy({
    by: ["status"],
    where: { projectId },
    _count: { _all: true },
  });

  return {
    ...project,
    taskCounts: Object.fromEntries(
      counts.map((row) => [row.status, row._count._all]),
    ),
  };
};

export const update = async (
  actor: Actor,
  projectId: string,
  input: UpdateProjectInput,
) => {
  await projectScope(actor.id, projectId, Role.MEMBER);

  const project = await prisma.project.update({
    where: { id: projectId },
    data: input,
  });

  await recordActivity({
    workspaceId: project.workspaceId,
    actorId: actor.id,
    entityType: "project",
    entityId: project.id,
    action: "project.updated",
    metadata: input,
  });

  return project;
};

export const setArchived = async (
  actor: Actor,
  projectId: string,
  archived: boolean,
) => {
  const { project } = await projectScope(actor.id, projectId, Role.ADMIN);

  if (archived && project.archivedAt)
    throw badRequest("Project is already archived");
  if (!archived && !project.archivedAt)
    throw badRequest("Project is not archived");

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: { archivedAt: archived ? new Date() : null },
  });

  await recordActivity({
    workspaceId: project.workspaceId,
    actorId: actor.id,
    entityType: "project",
    entityId: project.id,
    action: archived ? "project.archived" : "project.unarchived",
  });

  return updated;
};

export const remove = async (actor: Actor, projectId: string) => {
  const { project } = await projectScope(actor.id, projectId, Role.ADMIN);

  await prisma.project.delete({ where: { id: projectId } });

  await recordActivity({
    workspaceId: project.workspaceId,
    actorId: actor.id,
    entityType: "project",
    entityId: project.id,
    action: "project.deleted",
    metadata: { name: project.name, key: project.key },
  });
};
