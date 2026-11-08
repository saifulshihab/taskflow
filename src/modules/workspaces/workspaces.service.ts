import { recordActivity } from "../../lib/activity.js";
import { prisma } from "../../lib/prisma.js";
import { requireMembership, visibleProjects } from "../../lib/rbac.js";
import { badRequest, conflict, notFound } from "../../lib/errors.js";
import {
  paginated,
  toSkipTake,
  type Pagination,
} from "../../lib/pagination.js";
import type { Actor } from "../../lib/actor.js";
import { Role } from "../../generated/prisma/enums.js";
import type {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  AddMemberInput,
} from "./workspaces.schema.js";
import { scheduleDeletion } from "../../lib/recovery.js";
const userSelect = { id: true, name: true, email: true, avatar: true };
export const create = async (actor: Actor, input: CreateWorkspaceInput) => {
  const base =
    input.slug ||
    input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") ||
    "workspace";
  const slug = input.slug || base + "-" + crypto.randomUUID().slice(0, 8);
  const workspace = await prisma.workspace.create({
    data: {
      name: input.name,
      slug,
      ownerId: actor.id,
      memberships: { create: { userId: actor.id } },
    },
  });
  await recordActivity({
    workspaceId: workspace.id,
    actorId: actor.id,
    entityType: "workspace",
    entityId: workspace.id,
    action: "workspace.created",
    metadata: { name: workspace.name },
  });
  return { ...workspace, role: Role.WORKSPACE_OWNER };
};
export const list = async (actor: Actor, pagination: Pagination) => {
  const where = { userId: actor.id, active: true, deletedAt: null };
  const [members, total] = await Promise.all([
    prisma.membership.findMany({
      where,
      ...toSkipTake(pagination),
      orderBy: { createdAt: "desc" },
      include: { workspace: true },
    }),
    prisma.membership.count({ where }),
  ]);
  const data = await Promise.all(
    members.map(async (m) => ({
      ...m.workspace,
      role:
        m.workspace.ownerId === actor.id ? Role.WORKSPACE_OWNER : Role.MEMBER,
      _count: {
        projects: await prisma.project.count({
          where: visibleProjects(actor.id, m.workspaceId),
        }),
      },
    })),
  );
  return paginated(data, total, pagination);
};
export const get = async (actor: Actor, id: string) => {
  const m = await requireMembership(actor.id, id);
  return {
    ...m.workspace,
    role: m.role,
    _count: {
      projects: await prisma.project.count({
        where: visibleProjects(actor.id, id),
      }),
    },
  };
};
export const update = async (
  actor: Actor,
  id: string,
  input: UpdateWorkspaceInput,
) => {
  await requireMembership(actor.id, id, Role.WORKSPACE_OWNER);
  const updated = await prisma.workspace.update({ where: { id }, data: input });
  await recordActivity({
    workspaceId: id,
    actorId: actor.id,
    entityType: "workspace",
    entityId: id,
    action: "workspace.updated",
    metadata: input,
  });
  return updated;
};
export const remove = async (actor: Actor, id: string) => {
  await requireMembership(actor.id, id, Role.WORKSPACE_OWNER);
  await prisma.workspace.delete({ where: { id } });
};
export const listMembers = async (
  actor: Actor,
  workspaceId: string,
  p: Pagination,
) => {
  await requireMembership(actor.id, workspaceId, Role.WORKSPACE_OWNER);
  const where = { workspaceId, deletedAt: null };
  const [rows, total] = await Promise.all([
    prisma.membership.findMany({
      where,
      ...toSkipTake(p),
      include: {
        user: { select: userSelect },
        projects: {
          include: { project: { select: { id: true, name: true, key: true } } },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.membership.count({ where }),
  ]);
  const ws = await prisma.workspace.findUniqueOrThrow({
    where: { id: workspaceId },
  });
  return paginated(
    rows.map((m) => ({
      ...m,
      role: m.userId === ws.ownerId ? Role.WORKSPACE_OWNER : Role.MEMBER,
    })),
    total,
    p,
  );
};
export const addMember = async (
  actor: Actor,
  workspaceId: string,
  input: AddMemberInput,
) => {
  await requireMembership(actor.id, workspaceId, Role.WORKSPACE_OWNER);
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw notFound("Registered account with that email");
  const existing = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId } },
  });
  if (existing)
    throw conflict("User is already a workspace member or pending removal");
  const added = await prisma.membership.create({
    data: { workspaceId, userId: user.id },
    include: { user: { select: userSelect } },
  });
  await recordActivity({
    workspaceId,
    actorId: actor.id,
    entityType: "membership",
    entityId: added.id,
    action: "member.added",
    metadata: { userId: user.id },
  });
  return added;
};
export const updateMemberRole = async (
  actor: Actor,
  workspaceId: string,
  userId: string,
  active: boolean,
) => {
  const owner = await requireMembership(
    actor.id,
    workspaceId,
    Role.WORKSPACE_OWNER,
  );
  if (userId === owner.workspace.ownerId)
    throw badRequest("The workspace owner cannot be deactivated");
  const target = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  if (!target || target.deletedAt) throw notFound("Membership");
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Workspace" WHERE id = ${workspaceId} FOR UPDATE`;
    await requireMembership(
      actor.id,
      workspaceId,
      Role.WORKSPACE_OWNER,
      "Workspace",
      tx,
    );
    if (!active)
      await tx.task.updateMany({
        where: { project: { workspaceId }, assigneeId: userId },
        data: { assigneeId: null },
      });
    const updated = await tx.membership.update({
      where: { id: target.id },
      data: { active },
      include: { user: { select: userSelect } },
    });
    await recordActivity(
      {
        workspaceId,
        actorId: actor.id,
        entityType: "membership",
        entityId: target.id,
        action: active ? "member.reactivated" : "member.deactivated",
        metadata: { userId },
      },
      tx,
    );
    return updated;
  });
};
export const removeMember = async (
  actor: Actor,
  workspaceId: string,
  userId: string,
) => {
  const owner = await requireMembership(
    actor.id,
    workspaceId,
    Role.WORKSPACE_OWNER,
  );
  if (userId === owner.workspace.ownerId)
    throw badRequest("Transfer ownership or delete the workspace instead");
  const target = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  if (!target || target.deletedAt) throw notFound("Membership");
  return scheduleDeletion(actor, workspaceId, "membership", target.id);
};
export const transfer = async (
  actor: Actor,
  workspaceId: string,
  userId: string,
  assignments: { projectId: string; role: Role }[],
) => {
  await requireMembership(actor.id, workspaceId, Role.WORKSPACE_OWNER);
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Workspace" WHERE id = ${workspaceId} FOR UPDATE`;
    const ws = await tx.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
    });
    if (ws.ownerId !== actor.id)
      throw conflict("Ownership changed; reload and try again");
    if (userId === actor.id) throw badRequest("Choose another owner");
    const target = await tx.membership.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
    if (!target || !target.active || target.deletedAt)
      throw badRequest("Choose an active workspace user");
    const former = await tx.membership.findUniqueOrThrow({
      where: { userId_workspaceId: { userId: actor.id, workspaceId } },
    });
    if (
      new Set(assignments.map((a) => a.projectId)).size !== assignments.length
    )
      throw badRequest("Duplicate project assignment");
    await tx.projectMembership.deleteMany({
      where: { membershipId: { in: [target.id, former.id] } },
    });
    for (const a of assignments) {
      if (a.role === Role.WORKSPACE_OWNER)
        throw badRequest("Project assignments must use ADMIN or MEMBER");
      const project = await tx.project.findFirst({
        where: { id: a.projectId, workspaceId, deletedAt: null },
      });
      if (!project) throw notFound("Project");
      const used = await tx.projectMembership.count({
        where: { projectId: a.projectId },
      });
      if (used >= project.seats)
        throw conflict("Not enough seats for former owner");
      await tx.projectMembership.create({
        data: { projectId: a.projectId, membershipId: former.id, role: a.role },
      });
    }
    await tx.workspace.update({
      where: { id: workspaceId },
      data: { ownerId: userId },
    });
    await tx.task.updateMany({
      where: {
        project: {
          workspaceId,
          id: { notIn: assignments.map((a) => a.projectId) },
        },
        assigneeId: actor.id,
      },
      data: { assigneeId: null },
    });
    await recordActivity(
      {
        workspaceId,
        actorId: actor.id,
        entityType: "workspace",
        entityId: workspaceId,
        action: "workspace.ownership_transferred",
        metadata: { newOwnerId: userId },
      },
      tx,
    );
    return { transferred: true };
  });
};
