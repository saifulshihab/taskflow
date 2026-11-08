import { prisma } from "../../lib/prisma.js";
import { taskScope } from "../../lib/scope.js";
import { forbidden, notFound } from "../../lib/errors.js";
import {
  paginated,
  toSkipTake,
  type Pagination,
} from "../../lib/pagination.js";
import { recordActivity } from "../../lib/activity.js";
import { Role } from "../../generated/prisma/enums.js";
import type { Actor } from "../../lib/actor.js";
import type { CreateCommentInput } from "./comments.schema.js";
const select = {
  id: true,
  taskId: true,
  body: true,
  createdAt: true,
  updatedAt: true,
  editedAt: true,
  author: { select: { id: true, name: true, email: true } },
} as const;
export const list = async (actor: Actor, taskId: string, p: Pagination) => {
  await taskScope(actor.id, taskId);
  const where = { taskId, deletedAt: null };
  const [data, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      ...toSkipTake(p),
      select,
      orderBy: { createdAt: "asc" },
    }),
    prisma.comment.count({ where }),
  ]);
  return paginated(data, total, p);
};
export const create = async (
  actor: Actor,
  taskId: string,
  input: CreateCommentInput,
) => {
  const { task, workspaceId } = await taskScope(actor.id, taskId, Role.MEMBER);
  const c = await prisma.comment.create({
    data: { taskId, authorId: actor.id, body: input.body },
    select,
  });
  await recordActivity({
    workspaceId,
    projectId: task.projectId,
    actorId: actor.id,
    entityType: "comment",
    entityId: c.id,
    action: "comment.created",
    metadata: { taskId },
  });
  return c;
};
const load = async (actor: Actor, id: string) => {
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment || comment.deletedAt) throw notFound("Comment");
  await taskScope(actor.id, comment.taskId, Role.MEMBER);
  if (comment.authorId !== actor.id)
    throw forbidden("Only the author can change a comment");
  return comment;
};
export const update = async (actor: Actor, id: string, body: string) => {
  const comment = await load(actor, id);
  const scope = await taskScope(actor.id, comment.taskId, Role.MEMBER);
  const updated = await prisma.comment.update({
    where: { id },
    data: { body, editedAt: new Date() },
    select,
  });
  await recordActivity({
    workspaceId: scope.workspaceId,
    projectId: scope.task.projectId,
    actorId: actor.id,
    entityType: "comment",
    entityId: id,
    action: "comment.updated",
    metadata: { taskId: comment.taskId },
  });
  return updated;
};
export const remove = async (actor: Actor, id: string) => {
  const comment = await load(actor, id);
  const scope = await taskScope(actor.id, comment.taskId, Role.MEMBER);
  await prisma.comment.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  await recordActivity({
    workspaceId: scope.workspaceId,
    projectId: scope.task.projectId,
    actorId: actor.id,
    entityType: "comment",
    entityId: id,
    action: "comment.deleted",
    metadata: { taskId: comment.taskId },
  });
};
