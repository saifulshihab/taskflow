import type { Role } from "./api-types";

const rank: Record<Role, number> = {
  VIEWER: 0,
  MEMBER: 1,
  ADMIN: 2,
  OWNER: 3,
};

/**
 * Mirrors the API's role ranking so the UI can hide actions that would be
 * rejected. The API remains the enforcement point.
 */
export const can = (role: Role | undefined, minimum: Role) =>
  role !== undefined && rank[role] >= rank[minimum];
