import { forbidden, notFound } from "./errors.js";
import { prisma } from "./prisma.js";
import { Role } from "../generated/prisma/enums.js";

const rank: Record<Role, number> = {
  [Role.VIEWER]: 0,
  [Role.MEMBER]: 1,
  [Role.ADMIN]: 2,
  [Role.OWNER]: 3,
};

export const atLeast = (role: Role, minimum: Role) =>
  rank[role] >= rank[minimum];

/**
 * The single authorization gate for everything workspace-scoped. Services call
 * it with the actor rather than reading request state, so an MCP tool handler
 * gets identical enforcement.
 *
 * A non-member gets 404 rather than 403: workspaces they cannot see should not
 * be distinguishable from ones that do not exist.
 */
export const requireMembership = async (
  actorId: string,
  workspaceId: string,
  minimum: Role = Role.VIEWER,
  // Named after the resource the caller asked for, so a non-member cannot tell
  // "exists but hidden" from "does not exist" by reading the message.
  resourceName = "Workspace",
) => {
  const membership = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId: actorId, workspaceId } },
  });

  if (!membership) throw notFound(resourceName);
  if (!atLeast(membership.role, minimum)) {
    throw forbidden(`This action requires the ${minimum} role or higher`);
  }

  return membership;
};
