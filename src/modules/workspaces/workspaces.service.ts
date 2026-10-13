import { recordActivity } from "../../lib/activity.js";
import { badRequest, conflict, forbidden, notFound } from "../../lib/errors.js";
import {
  paginated,
  toSkipTake,
  type Pagination,
} from "../../lib/pagination.js";
import { prisma } from "../../lib/prisma.js";
import { atLeast, requireMembership } from "../../lib/rbac.js";
import type { Actor } from "../../lib/actor.js";
import { Role } from "../../generated/prisma/enums.js";
import type {
  AddMemberInput,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
} from "./workspaces.schema.js";

const memberSelect = {
  id: true,
  role: true,
  createdAt: true,
  user: { select: { id: true, email: true, name: true } },
} as const;

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || "workspace";

const availableSlug = async (desired: string) => {
  const base = slugify(desired);
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const taken = await prisma.workspace.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
  }
  throw conflict("Could not derive a free slug; provide one explicitly");
};

const countOwners = (workspaceId: string) =>
  prisma.membership.count({ where: { workspaceId, role: Role.OWNER } });

export const create = async (actor: Actor, input: CreateWorkspaceInput) => {
  let slug: string;
  if (input.slug) {
    const taken = await prisma.workspace.findUnique({
      where: { slug: input.slug },
      select: { id: true },
    });
    if (taken) throw conflict("Slug is already taken");
    slug = input.slug;
  } else {
    slug = await availableSlug(input.name);
  }

  return prisma.$transaction(async (tx) => {
    const workspace = await tx.workspace.create({
      data: {
        name: input.name,
        slug,
        memberships: { create: { userId: actor.id, role: Role.OWNER } },
      },
    });

    await recordActivity(
      {
        workspaceId: workspace.id,
        actorId: actor.id,
        entityType: "workspace",
        entityId: workspace.id,
        action: "workspace.created",
        metadata: { name: workspace.name },
      },
      tx,
    );

    return { ...workspace, role: Role.OWNER };
  });
};

export const list = async (actor: Actor, pagination: Pagination) => {
  const where = { memberships: { some: { userId: actor.id } } };

  const [memberships, total] = await Promise.all([
    prisma.membership.findMany({
      where: { userId: actor.id },
      ...toSkipTake(pagination),
      orderBy: { createdAt: "desc" },
      select: {
        role: true,
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            createdAt: true,
            _count: { select: { projects: true, memberships: true } },
          },
        },
      },
    }),
    prisma.workspace.count({ where }),
  ]);

  const data = memberships.map((membership) => ({
    ...membership.workspace,
    role: membership.role,
  }));

  return paginated(data, total, pagination);
};

export const get = async (actor: Actor, workspaceId: string) => {
  const membership = await requireMembership(actor.id, workspaceId);

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: { _count: { select: { projects: true, memberships: true } } },
  });
  if (!workspace) throw notFound("Workspace");

  return { ...workspace, role: membership.role };
};

export const update = async (
  actor: Actor,
  workspaceId: string,
  input: UpdateWorkspaceInput,
) => {
  await requireMembership(actor.id, workspaceId, Role.ADMIN);

  const workspace = await prisma.workspace.update({
    where: { id: workspaceId },
    data: input,
  });

  await recordActivity({
    workspaceId,
    actorId: actor.id,
    entityType: "workspace",
    entityId: workspaceId,
    action: "workspace.updated",
    metadata: input,
  });

  return workspace;
};

export const remove = async (actor: Actor, workspaceId: string) => {
  await requireMembership(actor.id, workspaceId, Role.OWNER);
  await prisma.workspace.delete({ where: { id: workspaceId } });
};

export const listMembers = async (
  actor: Actor,
  workspaceId: string,
  pagination: Pagination,
) => {
  await requireMembership(actor.id, workspaceId);

  const [members, total] = await Promise.all([
    prisma.membership.findMany({
      where: { workspaceId },
      ...toSkipTake(pagination),
      orderBy: { createdAt: "asc" },
      select: memberSelect,
    }),
    prisma.membership.count({ where: { workspaceId } }),
  ]);

  return paginated(members, total, pagination);
};

export const addMember = async (
  actor: Actor,
  workspaceId: string,
  input: AddMemberInput,
) => {
  const actorMembership = await requireMembership(
    actor.id,
    workspaceId,
    Role.ADMIN,
  );

  // Granting ownership is reserved for owners; admins would otherwise be able
  // to promote themselves by proxy.
  if (input.role === Role.OWNER && actorMembership.role !== Role.OWNER) {
    throw forbidden("Only an owner can grant the OWNER role");
  }

  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw notFound("User with that email");

  const existing = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId } },
  });
  if (existing) throw conflict("User is already a member of this workspace");

  const membership = await prisma.membership.create({
    data: { userId: user.id, workspaceId, role: input.role },
    select: memberSelect,
  });

  await recordActivity({
    workspaceId,
    actorId: actor.id,
    entityType: "membership",
    entityId: membership.id,
    action: "member.added",
    metadata: { userId: user.id, role: input.role },
  });

  return membership;
};

export const updateMemberRole = async (
  actor: Actor,
  workspaceId: string,
  userId: string,
  role: Role,
) => {
  const actorMembership = await requireMembership(
    actor.id,
    workspaceId,
    Role.ADMIN,
  );

  const target = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  if (!target) throw notFound("Membership");

  const ownershipInvolved = role === Role.OWNER || target.role === Role.OWNER;
  if (ownershipInvolved && actorMembership.role !== Role.OWNER) {
    throw forbidden("Only an owner can change ownership");
  }

  if (target.role === Role.OWNER && role !== Role.OWNER) {
    const owners = await countOwners(workspaceId);
    if (owners <= 1)
      throw badRequest("A workspace must keep at least one owner");
  }

  const membership = await prisma.membership.update({
    where: { id: target.id },
    data: { role },
    select: memberSelect,
  });

  await recordActivity({
    workspaceId,
    actorId: actor.id,
    entityType: "membership",
    entityId: membership.id,
    action: "member.role_changed",
    metadata: { userId, from: target.role, to: role },
  });

  return membership;
};

export const removeMember = async (
  actor: Actor,
  workspaceId: string,
  userId: string,
) => {
  const actorMembership = await requireMembership(actor.id, workspaceId);
  const removingSelf = actor.id === userId;

  // Anyone may leave; removing someone else needs admin rights.
  if (!removingSelf && !atLeast(actorMembership.role, Role.ADMIN)) {
    throw forbidden("This action requires the ADMIN role or higher");
  }

  const target = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  if (!target) throw notFound("Membership");

  if (target.role === Role.OWNER) {
    if (!removingSelf && actorMembership.role !== Role.OWNER) {
      throw forbidden("Only an owner can remove another owner");
    }
    const owners = await countOwners(workspaceId);
    if (owners <= 1)
      throw badRequest("A workspace must keep at least one owner");
  }

  await prisma.membership.delete({ where: { id: target.id } });

  await recordActivity({
    workspaceId,
    actorId: actor.id,
    entityType: "membership",
    entityId: target.id,
    action: removingSelf ? "member.left" : "member.removed",
    metadata: { userId },
  });
};
