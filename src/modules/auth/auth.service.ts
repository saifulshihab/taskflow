import { conflict, notFound, unauthorized } from "../../lib/errors.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { prisma } from "../../lib/prisma.js";
import {
  createRefreshToken,
  hashRefreshToken,
  refreshTokenExpiry,
  signAccessToken,
} from "../../lib/tokens.js";
import type { User } from "../../generated/prisma/client.js";
import type { LoginInput, RegisterInput } from "./auth.schema.js";

const publicUser = (user: User) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  createdAt: user.createdAt,
  avatar: user.avatar,
  jobTitle: user.jobTitle,
  bio: user.bio,
  timezone: user.timezone,
  theme: user.theme,
  startPage: user.startPage,
});

const issueTokens = async (user: User) => {
  const { token, tokenHash } = createRefreshToken();
  const session = await prisma.refreshToken.create({
    data: { tokenHash, userId: user.id, expiresAt: refreshTokenExpiry() },
  });
  return {
    accessToken: signAccessToken({
      sub: user.id,
      email: user.email,
      sid: session.id,
    }),
    refreshToken: token,
  };
};

export const register = async (input: RegisterInput) => {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) throw conflict("Email is already registered");

  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      passwordHash: await hashPassword(input.password),
    },
  });

  return { user: publicUser(user), tokens: await issueTokens(user) };
};

export const login = async (input: LoginInput) => {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  // Same error for unknown email and wrong password, so the endpoint cannot
  // be used to enumerate registered addresses.
  if (!user) throw unauthorized("Invalid email or password");

  const valid = await verifyPassword(user.passwordHash, input.password);
  if (!valid) throw unauthorized("Invalid email or password");

  return { user: publicUser(user), tokens: await issueTokens(user) };
};

export const refresh = async (presentedToken: string) => {
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashRefreshToken(presentedToken) },
    include: { user: true },
  });

  if (!stored || stored.revokedAt || stored.expiresAt <= new Date()) {
    throw unauthorized("Invalid or expired refresh token");
  }

  // Rotation: the presented token dies as the new one is issued, so a replay
  // of the old token fails.
  const revoked = await prisma.refreshToken.updateMany({
    where: { id: stored.id, revokedAt: null, expiresAt: { gt: new Date() } },
    data: { revokedAt: new Date() },
  });
  if (revoked.count !== 1) throw unauthorized("Refresh token already used");

  return { tokens: await issueTokens(stored.user) };
};

export const logout = async (presentedToken: string) => {
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashRefreshToken(presentedToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
};

export const me = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw notFound("User");
  return publicUser(user);
};

export const updateProfile = async (
  userId: string,
  input: Prisma.UserUpdateInput,
) =>
  publicUser(await prisma.user.update({ where: { id: userId }, data: input }));

import type { Prisma } from "../../generated/prisma/client.js";
import { badRequest } from "../../lib/errors.js";
export const changePassword = async (
  userId: string,
  currentPassword: string,
  password: string,
) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (!(await verifyPassword(user.passwordHash, currentPassword)))
    throw unauthorized("Current password is incorrect");
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(password) },
    }),
    prisma.refreshToken.deleteMany({ where: { userId } }),
  ]);
  return { changed: true };
};
export const deleteAccount = async (userId: string, password: string) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (!(await verifyPassword(user.passwordHash, password)))
    throw unauthorized("Password is incorrect");
  if (await prisma.workspace.count({ where: { ownerId: userId } }))
    throw badRequest("Transfer or delete owned workspaces first");
  await prisma.$transaction(async (tx) => {
    if (await tx.workspace.count({ where: { ownerId: userId } }))
      throw badRequest("Transfer or delete owned workspaces first");
    await tx.membership.deleteMany({ where: { userId } });
    await tx.refreshToken.deleteMany({ where: { userId } });
    await tx.savedView.deleteMany({ where: { userId } });
    await tx.task.updateMany({
      where: { assigneeId: userId },
      data: { assigneeId: null },
    });
    await tx.user.update({
      where: { id: userId },
      data: {
        name: "Deleted user",
        email: userId + "@deleted.invalid",
        avatar: null,
        bio: "",
        jobTitle: "",
        passwordHash: await hashPassword(crypto.randomUUID()),
      },
    });
  });
};
