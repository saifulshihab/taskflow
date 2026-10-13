import { recordActivity } from "../../lib/activity.js";
import { badRequest, conflict, notFound } from "../../lib/errors.js";
import { paginated, toSkipTake } from "../../lib/pagination.js";
import { prisma } from "../../lib/prisma.js";
import { requireMembership } from "../../lib/rbac.js";
import { projectScope, taskScope } from "../../lib/scope.js";
import type { Actor } from "../../lib/actor.js";
import type { Prisma } from "../../generated/prisma/client.js";
import { Role, TaskStatus } from "../../generated/prisma/enums.js";
import type {
  CreateTaskInput,
  ListTasksQuery,
  UpdateTaskInput,
} from "./tasks.schema.js";

const userSelect = { id: true, email: true, name: true } as const;

const taskInclude = {
  assignee: { select: userSelect },
  creator: { select: userSelect },
  project: { select: { id: true, key: true, name: true, workspaceId: true } },
  labels: {
    select: { label: { select: { id: true, name: true, color: true } } },
  },
  _count: { select: { subtasks: true, comments: true } },
} as const;

type TaskWithRelations = Prisma.TaskGetPayload<{ include: typeof taskInclude }>;

// Flatten the join rows so clients see labels, not TaskLabel records.
const present = (task: TaskWithRelations) => ({
  ...task,
  labels: task.labels.map((entry) => entry.label),
});

const assertAssignee = async (
  workspaceId: string,
  assigneeId: string | null | undefined,
) => {
  if (!assigneeId) return;
  const membership = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId: assigneeId, workspaceId } },
    select: { id: true },
  });
  if (!membership) {
    throw badRequest("Assignee must be a member of the workspace");
  }
};

const assertParent = async (
  projectId: string,
  parentTaskId: string | null | undefined,
) => {
  if (!parentTaskId) return;
  const parent = await prisma.task.findUnique({
    where: { id: parentTaskId },
    select: { id: true, projectId: true, parentTaskId: true },
  });
  if (!parent || parent.projectId !== projectId) {
    throw badRequest("Parent task must belong to the same project");
  }
  // One level of nesting keeps lists and completion rules predictable.
  if (parent.parentTaskId) {
    throw badRequest("Subtasks cannot be nested further");
  }
};

const assertLabels = async (workspaceId: string, labelIds: string[]) => {
  if (labelIds.length === 0) return;
  const found = await prisma.label.count({
    where: { id: { in: labelIds }, workspaceId },
  });
  if (found !== labelIds.length) {
    throw badRequest("One or more labels do not belong to this workspace");
  }
};

const orderFor = (
  sort: ListTasksQuery["sort"],
): Prisma.TaskOrderByWithRelationInput => {
  const descending = sort.startsWith("-");
  const field = (descending ? sort.slice(1) : sort) as
    "createdAt" | "updatedAt" | "dueDate" | "priority" | "position";
  return { [field]: descending ? "desc" : "asc" };
};

const buildWhere = (
  actor: Actor,
  scope: Prisma.TaskWhereInput,
  query: ListTasksQuery,
): Prisma.TaskWhereInput => {
  const where: Prisma.TaskWhereInput = { ...scope };

  if (query.status) where.status = { in: query.status };
  if (query.priority) where.priority = { in: query.priority };
  if (query.projectId) where.projectId = query.projectId;
  if (query.parentTaskId) where.parentTaskId = query.parentTaskId;
  if (query.topLevelOnly) where.parentTaskId = null;
  if (query.labelId) where.labels = { some: { labelId: query.labelId } };

  if (query.assigneeId === "me") where.assigneeId = actor.id;
  else if (query.assigneeId === "unassigned") where.assigneeId = null;
  else if (query.assigneeId) where.assigneeId = query.assigneeId;

  if (query.dueBefore || query.dueAfter) {
    where.dueDate = {
      ...(query.dueBefore ? { lte: query.dueBefore } : {}),
      ...(query.dueAfter ? { gte: query.dueAfter } : {}),
    };
  }

  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } },
    ];
  }

  return where;
};

const runList = async (
  actor: Actor,
  scope: Prisma.TaskWhereInput,
  query: ListTasksQuery,
) => {
  const where = buildWhere(actor, scope, query);

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      ...toSkipTake(query),
      orderBy: orderFor(query.sort),
      include: taskInclude,
    }),
    prisma.task.count({ where }),
  ]);

  return paginated(tasks.map(present), total, query);
};

export const create = async (
  actor: Actor,
  projectId: string,
  input: CreateTaskInput,
) => {
  const { project } = await projectScope(actor.id, projectId, Role.MEMBER);
  if (project.archivedAt) throw badRequest("Project is archived");

  const labelIds = input.labelIds ?? [];
  await assertAssignee(project.workspaceId, input.assigneeId);
  await assertParent(projectId, input.parentTaskId);
  await assertLabels(project.workspaceId, labelIds);

  const highest = await prisma.task.aggregate({
    where: { projectId },
    _max: { position: true },
  });

  const task = await prisma.task.create({
    data: {
      projectId,
      creatorId: actor.id,
      title: input.title,
      status: input.status,
      priority: input.priority,
      position: (highest._max.position ?? 0) + 1,
      ...(input.description === undefined
        ? {}
        : { description: input.description }),
      ...(input.assigneeId === undefined
        ? {}
        : { assigneeId: input.assigneeId }),
      ...(input.parentTaskId === undefined
        ? {}
        : { parentTaskId: input.parentTaskId }),
      ...(input.dueDate === undefined ? {} : { dueDate: input.dueDate }),
      ...(input.status === TaskStatus.DONE ? { completedAt: new Date() } : {}),
      ...(labelIds.length > 0
        ? { labels: { create: labelIds.map((labelId) => ({ labelId })) } }
        : {}),
    },
    include: taskInclude,
  });

  await recordActivity({
    workspaceId: project.workspaceId,
    actorId: actor.id,
    entityType: "task",
    entityId: task.id,
    action: "task.created",
    metadata: { title: task.title, projectId },
  });

  return present(task);
};

export const listForProject = async (
  actor: Actor,
  projectId: string,
  query: ListTasksQuery,
) => {
  await projectScope(actor.id, projectId);
  return runList(actor, { projectId }, query);
};

export const listForWorkspace = async (
  actor: Actor,
  workspaceId: string,
  query: ListTasksQuery,
) => {
  await requireMembership(actor.id, workspaceId);
  return runList(actor, { project: { workspaceId } }, query);
};

export const get = async (actor: Actor, taskId: string) => {
  await taskScope(actor.id, taskId);

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: taskInclude,
  });
  if (!task) throw notFound("Task");

  return present(task);
};

export const listSubtasks = async (actor: Actor, taskId: string) => {
  await taskScope(actor.id, taskId);
  const subtasks = await prisma.task.findMany({
    where: { parentTaskId: taskId },
    orderBy: { position: "asc" },
    include: taskInclude,
  });
  return subtasks.map(present);
};

export const update = async (
  actor: Actor,
  taskId: string,
  input: UpdateTaskInput,
) => {
  const { task, workspaceId } = await taskScope(actor.id, taskId, Role.MEMBER);

  if (input.assigneeId !== undefined) {
    await assertAssignee(workspaceId, input.assigneeId);
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...input,
      ...completionPatch(task.status, input.status),
    },
    include: taskInclude,
  });

  await recordActivity({
    workspaceId,
    actorId: actor.id,
    entityType: "task",
    entityId: taskId,
    action: "task.updated",
    metadata: { fields: Object.keys(input) },
  });

  return present(updated);
};

/**
 * completedAt is derived from status rather than accepted from the client, so
 * it cannot drift out of sync with it.
 */
const completionPatch = (
  previous: TaskStatus,
  next: TaskStatus | undefined,
) => {
  if (!next || next === previous) return {};
  if (next === TaskStatus.DONE) return { completedAt: new Date() };
  if (previous === TaskStatus.DONE) return { completedAt: null };
  return {};
};

export const setStatus = async (
  actor: Actor,
  taskId: string,
  status: TaskStatus,
) => {
  const { task, workspaceId } = await taskScope(actor.id, taskId, Role.MEMBER);

  // A no-op transition should not show up in the activity feed.
  if (task.status === status) return get(actor, taskId);

  // Closing a parent while subtasks are open hides unfinished work.
  if (status === TaskStatus.DONE) {
    const openSubtasks = await prisma.task.count({
      where: {
        parentTaskId: taskId,
        status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] },
      },
    });
    if (openSubtasks > 0) {
      throw badRequest(`Task has ${openSubtasks} unfinished subtask(s)`);
    }
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { status, ...completionPatch(task.status, status) },
    include: taskInclude,
  });

  await recordActivity({
    workspaceId,
    actorId: actor.id,
    entityType: "task",
    entityId: taskId,
    action: "task.status_changed",
    metadata: { from: task.status, to: status },
  });

  return present(updated);
};

export const setAssignee = async (
  actor: Actor,
  taskId: string,
  assigneeId: string | null,
) => {
  const { task, workspaceId } = await taskScope(actor.id, taskId, Role.MEMBER);
  await assertAssignee(workspaceId, assigneeId);

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { assigneeId },
    include: taskInclude,
  });

  await recordActivity({
    workspaceId,
    actorId: actor.id,
    entityType: "task",
    entityId: taskId,
    action: assigneeId ? "task.assigned" : "task.unassigned",
    metadata: { from: task.assigneeId, to: assigneeId },
  });

  return present(updated);
};

export const attachLabel = async (
  actor: Actor,
  taskId: string,
  labelId: string,
) => {
  const { workspaceId } = await taskScope(actor.id, taskId, Role.MEMBER);
  await assertLabels(workspaceId, [labelId]);

  const existing = await prisma.taskLabel.findUnique({
    where: { taskId_labelId: { taskId, labelId } },
  });
  if (existing) throw conflict("Label is already attached to this task");

  await prisma.taskLabel.create({ data: { taskId, labelId } });
  return get(actor, taskId);
};

export const detachLabel = async (
  actor: Actor,
  taskId: string,
  labelId: string,
) => {
  await taskScope(actor.id, taskId, Role.MEMBER);

  const existing = await prisma.taskLabel.findUnique({
    where: { taskId_labelId: { taskId, labelId } },
  });
  if (!existing) throw notFound("Label on this task");

  await prisma.taskLabel.delete({
    where: { taskId_labelId: { taskId, labelId } },
  });
  return get(actor, taskId);
};

export const remove = async (actor: Actor, taskId: string) => {
  const { task, workspaceId } = await taskScope(actor.id, taskId, Role.MEMBER);

  await prisma.task.delete({ where: { id: taskId } });

  await recordActivity({
    workspaceId,
    actorId: actor.id,
    entityType: "task",
    entityId: taskId,
    action: "task.deleted",
    metadata: { title: task.title },
  });
};
