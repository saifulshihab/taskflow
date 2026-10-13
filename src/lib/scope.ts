import { notFound } from "./errors.js";
import { prisma } from "./prisma.js";
import { requireMembership } from "./rbac.js";
import { Role } from "../generated/prisma/enums.js";

/**
 * Resolves a project to its workspace and authorizes the actor there, so
 * project- and task-scoped routes do not have to carry the workspace id.
 */
export const projectScope = async (
  actorId: string,
  projectId: string,
  minimum: Role = Role.VIEWER,
) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });
  if (!project) throw notFound("Project");

  const membership = await requireMembership(
    actorId,
    project.workspaceId,
    minimum,
    "Project",
  );

  return { project, membership };
};

export const taskScope = async (
  actorId: string,
  taskId: string,
  minimum: Role = Role.VIEWER,
) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: { select: { id: true, workspaceId: true } } },
  });
  if (!task) throw notFound("Task");

  const membership = await requireMembership(
    actorId,
    task.project.workspaceId,
    minimum,
    "Task",
  );

  return { task, membership, workspaceId: task.project.workspaceId };
};
