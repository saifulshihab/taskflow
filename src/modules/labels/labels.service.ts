import { conflict, notFound } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { requireMembership } from "../../lib/rbac.js";
import type { Actor } from "../../lib/actor.js";
import { Role } from "../../generated/prisma/enums.js";
import type { CreateLabelInput, UpdateLabelInput } from "./labels.schema.js";

const loadLabel = async (
  actorId: string,
  labelId: string,
  minimum: Role = Role.VIEWER,
) => {
  const label = await prisma.label.findUnique({ where: { id: labelId } });
  if (!label) throw notFound("Label");
  await requireMembership(actorId, label.workspaceId, minimum, "Label");
  return label;
};

export const list = async (actor: Actor, workspaceId: string) => {
  await requireMembership(actor.id, workspaceId);
  return prisma.label.findMany({
    where: { workspaceId },
    orderBy: { name: "asc" },
    include: { _count: { select: { tasks: true } } },
  });
};

export const create = async (
  actor: Actor,
  workspaceId: string,
  input: CreateLabelInput,
) => {
  await requireMembership(actor.id, workspaceId, Role.MEMBER);

  const existing = await prisma.label.findUnique({
    where: { workspaceId_name: { workspaceId, name: input.name } },
  });
  if (existing) throw conflict("A label with that name already exists");

  return prisma.label.create({
    data: { workspaceId, name: input.name, color: input.color },
  });
};

export const update = async (
  actor: Actor,
  labelId: string,
  input: UpdateLabelInput,
) => {
  await loadLabel(actor.id, labelId, Role.MEMBER);
  return prisma.label.update({ where: { id: labelId }, data: input });
};

export const remove = async (actor: Actor, labelId: string) => {
  await loadLabel(actor.id, labelId, Role.ADMIN);
  await prisma.label.delete({ where: { id: labelId } });
};
