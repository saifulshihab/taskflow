import { forbidden, notFound } from "./errors.js";
import { prisma } from "./prisma.js";
import { Role } from "../generated/prisma/enums.js";
import type { Prisma } from "../generated/prisma/client.js";
const rank: Record<Role, number> = { MEMBER: 0, ADMIN: 1, WORKSPACE_OWNER: 2 };
export const atLeast = (role: Role, minimum: Role) =>
  rank[role] >= rank[minimum];
export const requireMembership = async (
  actorId: string,
  workspaceId: string,
  minimum: Role = Role.MEMBER,
  resourceName = "Workspace",
  client: Prisma.TransactionClient | typeof prisma = prisma,
) => {
  const membership = await client.membership.findUnique({
    where: { userId_workspaceId: { userId: actorId, workspaceId } },
    include: { workspace: true },
  });
  if (!membership || !membership.active || membership.deletedAt)
    throw notFound(resourceName);
  const role =
    membership.workspace.ownerId === actorId
      ? Role.WORKSPACE_OWNER
      : Role.MEMBER;
  if (!atLeast(role, minimum))
    throw forbidden("Only the workspace owner can perform this action");
  return { ...membership, role };
};
export const visibleProjects = (
  actorId: string,
  workspaceId?: string,
): Prisma.ProjectWhereInput => ({
  ...(workspaceId ? { workspaceId } : {}),
  deletedAt: null,
  workspace: {
    memberships: { some: { userId: actorId, active: true, deletedAt: null } },
  },
  OR: [
    { workspace: { ownerId: actorId } },
    {
      members: {
        some: {
          membership: { userId: actorId, active: true, deletedAt: null },
        },
      },
    },
  ],
});
