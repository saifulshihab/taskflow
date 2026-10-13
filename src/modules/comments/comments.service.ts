import { recordActivity } from "../../lib/activity.js";
import { forbidden, notFound } from "../../lib/errors.js";
import {
  paginated,
  toSkipTake,
  type Pagination,
} from "../../lib/pagination.js";
import { prisma } from "../../lib/prisma.js";
import { atLeast, requireMembership } from "../../lib/rbac.js";
import { taskScope } from "../../lib/scope.js";
import type { Actor } from "../../lib/actor.js";
import { Role } from "../../generated/prisma/enums.js";
import type { CreateCommentInput } from "./comments.schema.js";

const commentSelect = {
  id: true,
  taskId: true,
  body: true,
  createdAt: true,
  updatedAt: true,
  editedAt: true,
  author: { select: { id: true, email: true, name: true } },
} as const;

const loadComment = async (actorId: string, commentId: string) => {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: {
      task: { include: { project: { select: { workspaceId: true } } } },
    },
  });
  if (!comment || comment.deletedAt) throw notFound("Comment");

  const workspaceId = comment.task.project.workspaceId;
  const membership = await requireMembership(
    actorId,
    workspaceId,
    Role.VIEWER,
    "Comment",
  );

  return { comment, membership, workspaceId };
};

export const list = async (
  actor: Actor,
  taskId: string,
  pagination: Pagination,
) => {
  await taskScope(actor.id, taskId);

  const where = { taskId, deletedAt: null };
  const [data, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      ...toSkipTake(pagination),
      orderBy: { createdAt: "asc" },
      select: commentSelect,
    }),
    prisma.comment.count({ where }),
  ]);

  return paginated(data, total, pagination);
};

export const create = async (
  actor: Actor,
  taskId: string,
  input: CreateCommentInput,
) => {
  const { workspaceId } = await taskScope(actor.id, taskId, Role.MEMBER);

  const comment = await prisma.comment.create({
    data: { taskId, authorId: actor.id, body: input.body },
    select: commentSelect,
  });

  await recordActivity({
    workspaceId,
    actorId: actor.id,
    entityType: "comment",
    entityId: comment.id,
    action: "comment.created",
    metadata: { taskId },
  });

  return comment;
};

export const update = async (actor: Actor, commentId: string, body: string) => {
  const { comment, workspaceId } = await loadComment(actor.id, commentId);

  // Editing someone else's words is never allowed, regardless of role.
  if (comment.authorId !== actor.id) {
    throw forbidden("Only the author can edit a comment");
  }

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: { body, editedAt: new Date() },
    select: commentSelect,
  });

  await recordActivity({
    workspaceId,
    actorId: actor.id,
    entityType: "comment",
    entityId: commentId,
    action: "comment.updated",
    metadata: { taskId: comment.taskId },
  });

  return updated;
};

export const remove = async (actor: Actor, commentId: string) => {
  const { comment, membership, workspaceId } = await loadComment(
    actor.id,
    commentId,
  );

  // Authors can retract their own; admins can moderate anyone's.
  const isAuthor = comment.authorId === actor.id;
  if (!isAuthor && !atLeast(membership.role, Role.ADMIN)) {
    throw forbidden("Only the author or an admin can delete a comment");
  }

  // Soft delete keeps the activity trail pointing at something real.
  await prisma.comment.update({
    where: { id: commentId },
    data: { deletedAt: new Date() },
  });

  await recordActivity({
    workspaceId,
    actorId: actor.id,
    entityType: "comment",
    entityId: commentId,
    action: "comment.deleted",
    metadata: { taskId: comment.taskId, moderated: !isAuthor },
  });
};
