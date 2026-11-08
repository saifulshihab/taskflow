import type { RequestHandler } from "express";
import { unauthorized } from "../lib/errors.js";
import { verifyAccessToken } from "../lib/tokens.js";
import { prisma } from "../lib/prisma.js";
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(unauthorized("Missing Bearer token"));
    return;
  }
  try {
    const payload = verifyAccessToken(header.slice(7));
    const session = await prisma.refreshToken.findUnique({
      where: { id: payload.sid },
      include: { user: true },
    });
    if (
      !session ||
      session.userId !== payload.sub ||
      session.revokedAt ||
      session.expiresAt <= new Date()
    )
      throw unauthorized("Session expired");
    req.actor = { id: session.user.id, email: session.user.email };
    next();
  } catch (error) {
    next(error);
  }
};
