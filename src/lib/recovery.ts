import { recordActivity } from "./activity.js";
import { prisma } from "./prisma.js";
import { requireMembership } from "./rbac.js";
import { projectScope } from "./scope.js";
import { badRequest, notFound, forbidden } from "./errors.js";
import { Role } from "../generated/prisma/enums.js";
import type { Actor } from "./actor.js";
import type { Prisma } from "../generated/prisma/client.js";
const mutate = async (
  tx: Prisma.TransactionClient,
  type: string,
  id: string,
  deletedAt: Date | null,
) => {
  if (type === "project")
    await tx.project.update({ where: { id }, data: { deletedAt } });
  else if (type === "task")
    await tx.task.update({ where: { id }, data: { deletedAt } });
  else if (type === "label")
    await tx.label.update({ where: { id }, data: { deletedAt } });
  else if (type === "membership")
    await tx.membership.update({ where: { id }, data: { deletedAt } });
  else throw badRequest("Unknown recovery type");
};
export const scheduleDeletion = async (
  actor: Actor,
  workspaceId: string,
  entityType: string,
  entityId: string,
  projectId?: string,
) => {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Workspace" WHERE id = ${workspaceId} FOR UPDATE`;
    if (entityType === "membership" || entityType === "project")
      await requireMembership(
        actor.id,
        workspaceId,
        Role.WORKSPACE_OWNER,
        "Workspace",
        tx,
      );
    else if (projectId)
      await projectScope(
        actor.id,
        projectId,
        entityType === "label" ? Role.ADMIN : Role.MEMBER,
        tx,
      );
    const existing = await tx.recovery.findFirst({
      where: { entityId, entityType },
    });
    if (existing) throw badRequest("Already pending deletion");
    const expiresAt = new Date(Date.now() + 6000);
    await mutate(tx, entityType, entityId, new Date());
    if (entityType === "membership") {
      const m = await tx.membership.findUniqueOrThrow({
        where: { id: entityId },
      });
      await tx.task.updateMany({
        where: { project: { workspaceId }, assigneeId: m.userId },
        data: { assigneeId: null },
      });
    }
    await recordActivity(
      {
        workspaceId,
        projectId,
        actorId: actor.id,
        entityType: entityType as "task" | "label" | "project" | "membership",
        entityId,
        action: entityType + ".deleted",
      },
      tx,
    );
    const record = await tx.recovery.create({
      data: {
        actorId: actor.id,
        workspaceId,
        projectId,
        entityId,
        entityType,
        expiresAt,
      },
    });
    return { recoveryId: record.id, expiresAt: record.expiresAt };
  });
};
export const undo = async (actor: Actor, id: string) => {
  const r = await prisma.recovery.findUnique({ where: { id } });
  if (!r) throw notFound("Recovery");
  if (r.actorId !== actor.id) throw forbidden();
  if (r.entityType === "project" || r.entityType === "membership")
    await requireMembership(actor.id, r.workspaceId, Role.WORKSPACE_OWNER);
  else if (r.projectId)
    await projectScope(
      actor.id,
      r.projectId,
      r.entityType === "label" ? Role.ADMIN : Role.MEMBER,
    );
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Workspace" WHERE id = ${r.workspaceId} FOR UPDATE`;
    if (r.entityType === "membership" || r.entityType === "project")
      await requireMembership(
        actor.id,
        r.workspaceId,
        Role.WORKSPACE_OWNER,
        "Workspace",
        tx,
      );
    else if (r.projectId)
      await projectScope(
        actor.id,
        r.projectId,
        r.entityType === "label" ? Role.ADMIN : Role.MEMBER,
        tx,
      );
    const current = await tx.recovery.findUnique({ where: { id } });
    if (!current || current.expiresAt.getTime() <= Date.now())
      throw badRequest("The six-second Undo window has expired");
    await mutate(tx, current.entityType, current.entityId, null);
    await tx.recovery.delete({ where: { id } });
    await recordActivity(
      {
        workspaceId: r.workspaceId,
        ...(r.projectId ? { projectId: r.projectId } : {}),
        actorId: actor.id,
        entityType: r.entityType as "task" | "label" | "project" | "membership",
        entityId: r.entityId,
        action: r.entityType + ".restored",
      },
      tx,
    );
    return { restored: true };
  });
};
// Expiry is checked by Undo even if this cleanup worker has not run yet.
export const purgeExpired = async () => {
  const records = await prisma.recovery.findMany({
    where: { expiresAt: { lte: new Date() } },
  });
  for (const r of records)
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Workspace" WHERE id = ${r.workspaceId} FOR UPDATE`;
      const current = await tx.recovery.findUnique({ where: { id: r.id } });
      if (!current || current.expiresAt.getTime() > Date.now()) return;
      if (r.entityType === "project")
        await tx.project.deleteMany({
          where: { id: r.entityId, deletedAt: { not: null } },
        });
      if (r.entityType === "task")
        await tx.task.deleteMany({
          where: { id: r.entityId, deletedAt: { not: null } },
        });
      if (r.entityType === "label")
        await tx.label.deleteMany({
          where: { id: r.entityId, deletedAt: { not: null } },
        });
      if (r.entityType === "membership")
        await tx.membership.deleteMany({
          where: { id: r.entityId, deletedAt: { not: null } },
        });
      await tx.recovery.deleteMany({ where: { id: r.id } });
    });
};
