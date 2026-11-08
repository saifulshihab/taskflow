import { recordActivity } from "../../lib/activity.js";
import { badRequest, conflict, notFound } from "../../lib/errors.js";
import { paginated, toSkipTake } from "../../lib/pagination.js";
import { prisma } from "../../lib/prisma.js";
import { requireMembership, visibleProjects } from "../../lib/rbac.js";
import { projectScope, taskScope } from "../../lib/scope.js";
import type { Actor } from "../../lib/actor.js";
import type { Prisma } from "../../generated/prisma/client.js";
import { scheduleDeletion } from "../../lib/recovery.js";
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
    select: {
      label: { select: { id: true, name: true, color: true, deletedAt: true } },
    },
  },
  _count: {
    select: {
      subtasks: { where: { deletedAt: null } },
      comments: { where: { deletedAt: null } },
    },
  },
} as const;

type TaskWithRelations = Prisma.TaskGetPayload<{ include: typeof taskInclude }>;

// Flatten the join rows so clients see labels, not TaskLabel records.
const present = (task: TaskWithRelations) => ({
  ...task,
  key: task.project.key + "-" + task.number,
  labels: task.labels.map((entry) => entry.label).filter((l) => !l.deletedAt),
});

const assertAssignee = async (
  projectId: string,
  assigneeId: string | null | undefined,
) => {
  if (!assigneeId) return;
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: { workspace: true },
  });
  if (project.workspace.ownerId === assigneeId) return;
  const member = await prisma.projectMembership.findFirst({
    where: {
      projectId,
      membership: { userId: assigneeId, active: true, deletedAt: null },
    },
  });
  if (!member) throw badRequest("Assignee must be an active project user");
};
const assertParent = async (
  projectId: string,
  parentTaskId: string | null | undefined,
) => {
  if (!parentTaskId) return;
  const parent = await prisma.task.findUnique({
    where: { id: parentTaskId },
    select: { id: true, projectId: true, parentTaskId: true, deletedAt: true },
  });
  if (!parent || parent.deletedAt || parent.projectId !== projectId) {
    throw badRequest("Parent task must belong to the same project");
  }
  // One level of nesting keeps lists and completion rules predictable.
  if (parent.parentTaskId) {
    throw badRequest("Subtasks cannot be nested further");
  }
};

const assertLabels = async (projectId: string, labelIds: string[]) => {
  if (labelIds.length === 0) return;
  const found = await prisma.label.count({
    where: { id: { in: labelIds }, projectId, deletedAt: null },
  });
  if (found !== labelIds.length) {
    throw badRequest("One or more labels do not belong to this project");
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
  const where: Prisma.TaskWhereInput = {
    AND: [scope],
    deletedAt: null,
    OR: [{ parentTaskId: null }, { parentTask: { deletedAt: null } }],
  };

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
    where.AND = [
      scope,
      {
        OR: [
          { title: { contains: query.search, mode: "insensitive" } },
          { description: { contains: query.search, mode: "insensitive" } },
        ],
      },
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
  await assertAssignee(projectId, input.assigneeId);
  await assertParent(projectId, input.parentTaskId);
  await assertLabels(projectId, labelIds);

  const highest = await prisma.task.aggregate({
    where: { projectId },
    _max: { position: true },
  });

  const task = await prisma.$transaction(async (tx) => {
    const sequence = await tx.project.update({
      where: { id: projectId },
      data: { sequence: { increment: 1 } },
    });
    return tx.task.create({
      data: {
        projectId,
        creatorId: actor.id,
        number: sequence.sequence,
        title: input.title,
        status: input.status ?? project.defaultStatus,
        priority: input.priority ?? project.defaultPriority,
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
        ...((input.status ?? project.defaultStatus) === TaskStatus.DONE
          ? { completedAt: new Date() }
          : {}),
        ...(labelIds.length > 0
          ? { labels: { create: labelIds.map((labelId) => ({ labelId })) } }
          : {}),
      },
      include: taskInclude,
    });
  });

  await recordActivity({
    projectId,
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
  return runList(
    actor,
    { project: visibleProjects(actor.id, workspaceId) },
    query,
  );
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
    where: { parentTaskId: taskId, deletedAt: null },
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
    await assertAssignee(task.projectId, input.assigneeId);
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
    projectId: task.projectId,
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

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { status, ...completionPatch(task.status, status) },
    include: taskInclude,
  });

  await recordActivity({
    projectId: task.projectId,
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
  await assertAssignee(task.projectId, assigneeId);

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { assigneeId },
    include: taskInclude,
  });

  await recordActivity({
    projectId: task.projectId,
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
  const { task } = await taskScope(actor.id, taskId, Role.MEMBER);
  await assertLabels(task.projectId, [labelId]);

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

  return scheduleDeletion(actor, workspaceId, "task", taskId, task.projectId);
};

export const duplicate = async (actor: Actor, id: string) => {
  const source = await get(actor, id);
  await projectScope(actor.id, source.projectId, Role.MEMBER);
  const copy = await create(actor, source.projectId, {
    title: source.title + " (copy)",
    description: source.description ?? undefined,
    status: source.status,
    priority: source.priority,
    assigneeId: source.assigneeId,
    dueDate: source.dueDate,
    labelIds: source.labels.map((l) => l.id),
  });
  const subs = await listSubtasks(actor, id);
  for (const sub of subs)
    await create(actor, source.projectId, {
      title: sub.title,
      description: sub.description ?? undefined,
      status: sub.status,
      priority: sub.priority,
      assigneeId: sub.assigneeId,
      dueDate: sub.dueDate,
      parentTaskId: copy.id,
    });
  return copy;
};
