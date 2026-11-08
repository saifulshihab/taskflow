import { recordActivity } from "../../lib/activity.js";
import { prisma } from "../../lib/prisma.js";
import { requireMembership, visibleProjects } from "../../lib/rbac.js";
import { projectScope } from "../../lib/scope.js";
import { badRequest, conflict, notFound } from "../../lib/errors.js";
import { paginated, toSkipTake } from "../../lib/pagination.js";
import { scheduleDeletion } from "../../lib/recovery.js";
import { Role } from "../../generated/prisma/enums.js";
import type { Actor } from "../../lib/actor.js";
import type {
  CreateProjectInput,
  ListProjectsQuery,
  UpdateProjectInput,
} from "./projects.schema.js";
export const create = async (
  actor: Actor,
  workspaceId: string,
  input: CreateProjectInput,
) => {
  await requireMembership(actor.id, workspaceId, Role.WORKSPACE_OWNER);
  const key =
    input.key ||
    input.name
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .slice(0, 3) ||
    "PRJ";
  const project = await prisma.project.create({
    data: { ...input, key, workspaceId },
  });
  await recordActivity({
    workspaceId,
    projectId: project.id,
    actorId: actor.id,
    entityType: "project",
    entityId: project.id,
    action: "project.created",
    metadata: { name: project.name },
  });
  return project;
};
export const list = async (
  actor: Actor,
  workspaceId: string,
  q: ListProjectsQuery,
) => {
  await requireMembership(actor.id, workspaceId);
  const where = {
    AND: [
      visibleProjects(actor.id, workspaceId),
      ...(q.search
        ? [
            {
              OR: [
                { name: { contains: q.search, mode: "insensitive" as const } },
                { key: { contains: q.search, mode: "insensitive" as const } },
              ],
            },
          ]
        : []),
    ],
    ...(q.includeArchived ? {} : { archivedAt: null }),
    ...(q.status ? { status: q.status } : {}),
  };
  const [data, total] = await Promise.all([
    prisma.project.findMany({
      where,
      ...toSkipTake(q),
      include: {
        members: {
          where: { membership: { userId: actor.id } },
          select: { role: true },
        },
        _count: {
          select: { tasks: { where: { deletedAt: null } }, members: true },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.project.count({ where }),
  ]);
  const m = await requireMembership(actor.id, workspaceId);
  return paginated(
    data.map((p) => ({
      ...p,
      role: m.role === Role.WORKSPACE_OWNER ? m.role : p.members[0]?.role,
    })),
    total,
    q,
  );
};
export const get = async (actor: Actor, projectId: string) => {
  const { project, membership } = await projectScope(actor.id, projectId);
  const used = await prisma.projectMembership.count({ where: { projectId } });
  return { ...project, role: membership.role, seatsUsed: used };
};
export const update = async (
  actor: Actor,
  projectId: string,
  input: UpdateProjectInput,
) => {
  const { project, membership } = await projectScope(
    actor.id,
    projectId,
    Role.ADMIN,
  );
  if (input.seats !== undefined && membership.role !== Role.WORKSPACE_OWNER)
    throw badRequest("Only the workspace owner can change seat limits");
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Workspace" WHERE id = ${project.workspaceId} FOR UPDATE`;
    await projectScope(
      actor.id,
      projectId,
      input.seats !== undefined ? Role.WORKSPACE_OWNER : Role.ADMIN,
      tx,
    );
    if (input.seats !== undefined) {
      const count = await tx.projectMembership.count({ where: { projectId } });
      if (input.seats < count)
        throw conflict("Remove people before reducing the seat limit");
    }
    const updated = await tx.project.update({
      where: { id: projectId },
      data: input,
    });
    await recordActivity(
      {
        workspaceId: project.workspaceId,
        projectId,
        actorId: actor.id,
        entityType: "project",
        entityId: projectId,
        action: "project.updated",
        metadata: { fields: Object.keys(input) },
      },
      tx,
    );
    return updated;
  });
};
export const setArchived = async (
  actor: Actor,
  projectId: string,
  archived: boolean,
) => {
  const { project } = await projectScope(actor.id, projectId);
  await requireMembership(actor.id, project.workspaceId, Role.WORKSPACE_OWNER);
  const updated = await prisma.project.update({
    where: { id: projectId },
    data: { archivedAt: archived ? new Date() : null },
  });
  await recordActivity({
    workspaceId: project.workspaceId,
    projectId,
    actorId: actor.id,
    entityType: "project",
    entityId: projectId,
    action: archived ? "project.archived" : "project.restored",
  });
  return updated;
};
export const remove = async (actor: Actor, projectId: string) => {
  const { project } = await projectScope(
    actor.id,
    projectId,
    Role.WORKSPACE_OWNER,
  );
  return scheduleDeletion(
    actor,
    project.workspaceId,
    "project",
    projectId,
    projectId,
  );
};
export const members = async (actor: Actor, projectId: string) => {
  const { project } = await projectScope(actor.id, projectId);
  const ws = await prisma.workspace.findUniqueOrThrow({
    where: { id: project.workspaceId },
    include: {
      owner: { select: { id: true, name: true, email: true, avatar: true } },
    },
  });
  const rows = await prisma.projectMembership.findMany({
    where: { projectId, membership: { deletedAt: null } },
    include: {
      membership: {
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
        },
      },
    },
  });
  return [
    {
      id: ws.ownerId,
      userId: ws.ownerId,
      role: Role.WORKSPACE_OWNER,
      active: true,
      user: ws.owner,
    },
    ...rows.map((r) => ({
      id: r.membershipId,
      userId: r.membership.userId,
      role: r.role,
      active: r.membership.active,
      user: r.membership.user,
    })),
  ];
};
export const candidates = async (actor: Actor, projectId: string) => {
  const { project } = await projectScope(actor.id, projectId, Role.ADMIN);
  return prisma.membership.findMany({
    where: {
      workspaceId: project.workspaceId,
      active: true,
      deletedAt: null,
      userId: {
        not: (
          await prisma.workspace.findUniqueOrThrow({
            where: { id: project.workspaceId },
          })
        ).ownerId,
      },
      NOT: { projects: { some: { projectId } } },
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
};
export const setMember = async (
  actor: Actor,
  projectId: string,
  userId: string,
  role: Role | null,
) => {
  if (role === "WORKSPACE_OWNER")
    throw badRequest("Ownership is managed at workspace scope");
  const { project, membership } = await projectScope(
    actor.id,
    projectId,
    Role.ADMIN,
  );
  if (userId === actor.id && membership.role !== Role.WORKSPACE_OWNER)
    throw badRequest("Admins cannot remove or change their own role");
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Workspace" WHERE id = ${project.workspaceId} FOR UPDATE`;
    await projectScope(actor.id, projectId, Role.ADMIN, tx);
    const ws = await tx.workspace.findUniqueOrThrow({
      where: { id: project.workspaceId },
    });
    if (userId === actor.id && ws.ownerId !== actor.id)
      throw badRequest("Admins cannot remove or change their own role");
    if (ws.ownerId === userId)
      throw badRequest("The owner has inherent project access");
    const target = await tx.membership.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId: project.workspaceId },
      },
    });
    if (!target || target.deletedAt || !target.active)
      throw badRequest("Choose an active workspace user");
    const where = {
      projectId_membershipId: { projectId, membershipId: target.id },
    };
    const existing = await tx.projectMembership.findUnique({ where });
    if (!role) {
      if (!existing) throw notFound("Project membership");
      await tx.projectMembership.delete({ where });
      await tx.task.updateMany({
        where: { projectId, assigneeId: userId },
        data: { assigneeId: null },
      });
      await recordActivity(
        {
          workspaceId: project.workspaceId,
          projectId,
          actorId: actor.id,
          entityType: "membership",
          entityId: target.id,
          action: "project.member_removed",
          metadata: { userId },
        },
        tx,
      );
      return { removed: true };
    }
    if (!existing) {
      const used = await tx.projectMembership.count({ where: { projectId } });
      const current = await tx.project.findUniqueOrThrow({
        where: { id: projectId },
      });
      if (used >= current.seats) throw conflict("Project seat limit reached");
    }
    const assignment = await tx.projectMembership.upsert({
      where,
      create: { projectId, membershipId: target.id, role },
      update: { role },
    });
    await recordActivity(
      {
        workspaceId: project.workspaceId,
        projectId,
        actorId: actor.id,
        entityType: "membership",
        entityId: target.id,
        action: existing
          ? "project.member_role_changed"
          : "project.member_added",
        metadata: { userId, role },
      },
      tx,
    );
    return assignment;
  });
};
