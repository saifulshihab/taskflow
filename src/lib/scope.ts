import type { Prisma } from "../generated/prisma/client.js";
import { badRequest, forbidden, notFound } from "./errors.js";
import { prisma } from "./prisma.js";
import { atLeast, requireMembership } from "./rbac.js";
import { Role } from "../generated/prisma/enums.js";
export const projectScope = async (
  actorId: string,
  projectId: string,
  minimum?: Role,
  client: Prisma.TransactionClient | typeof prisma = prisma,
) => {
  const project = await client.project.findUnique({ where: { id: projectId } });
  if (!project || project.deletedAt) throw notFound("Project");
  const membership = await requireMembership(
    actorId,
    project.workspaceId,
    Role.MEMBER,
    "Project",
    client,
  );
  const assignment =
    membership.role === Role.WORKSPACE_OWNER
      ? null
      : await client.projectMembership.findUnique({
          where: {
            projectId_membershipId: { projectId, membershipId: membership.id },
          },
        });
  const role =
    membership.role === Role.WORKSPACE_OWNER
      ? Role.WORKSPACE_OWNER
      : assignment?.role;
  if (!role) throw notFound("Project");
  if (minimum && !atLeast(role, minimum))
    throw forbidden("Insufficient project permissions");
  if (minimum && project.archivedAt)
    throw badRequest("Restore the archived project before making changes");
  return { project, membership: { ...membership, role } };
};
export const taskScope = async (
  actorId: string,
  taskId: string,
  minimum?: Role,
  client: Prisma.TransactionClient | typeof prisma = prisma,
) => {
  const task = await client.task.findUnique({
    where: { id: taskId },
    include: { parentTask: { select: { deletedAt: true } } },
  });
  if (!task || task.deletedAt || task.parentTask?.deletedAt)
    throw notFound("Task");
  const { project, membership } = await projectScope(
    actorId,
    task.projectId,
    minimum,
    client,
  );
  return { task, membership, workspaceId: project.workspaceId };
};
