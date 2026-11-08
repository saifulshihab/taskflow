import { recordActivity } from "../../lib/activity.js";
import { prisma } from "../../lib/prisma.js";
import { projectScope } from "../../lib/scope.js";
import { notFound } from "../../lib/errors.js";
import { scheduleDeletion } from "../../lib/recovery.js";
import { Role } from "../../generated/prisma/enums.js";
import type { Actor } from "../../lib/actor.js";
import type { CreateLabelInput, UpdateLabelInput } from "./labels.schema.js";
export const list = async (actor: Actor, projectId: string) => {
  await projectScope(actor.id, projectId);
  return prisma.label.findMany({
    where: { projectId, deletedAt: null },
    orderBy: { name: "asc" },
  });
};
export const create = async (
  actor: Actor,
  projectId: string,
  input: CreateLabelInput,
) => {
  const { project } = await projectScope(actor.id, projectId, Role.MEMBER);
  const label = await prisma.label.create({ data: { ...input, projectId } });
  await recordActivity({
    workspaceId: project.workspaceId,
    projectId,
    actorId: actor.id,
    entityType: "label",
    entityId: label.id,
    action: "label.created",
    metadata: { name: label.name },
  });
  return label;
};
const load = async (actor: Actor, id: string) => {
  const l = await prisma.label.findUnique({ where: { id } });
  if (!l || l.deletedAt) throw notFound("Label");
  const { project } = await projectScope(actor.id, l.projectId, Role.ADMIN);
  return { l, project };
};
export const update = async (
  actor: Actor,
  id: string,
  input: UpdateLabelInput,
) => {
  const { l, project } = await load(actor, id);
  const label = await prisma.label.update({ where: { id }, data: input });
  await recordActivity({
    workspaceId: project.workspaceId,
    projectId: l.projectId,
    actorId: actor.id,
    entityType: "label",
    entityId: id,
    action: "label.updated",
    metadata: input,
  });
  return label;
};
export const remove = async (actor: Actor, id: string) => {
  const { l, project } = await load(actor, id);
  return scheduleDeletion(actor, project.workspaceId, "label", id, l.projectId);
};
