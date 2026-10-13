import type { RequestHandler } from "express";
import { unauthorized } from "../lib/errors.js";
import { verifyAccessToken } from "../lib/tokens.js";

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(unauthorized("Missing Bearer token"));
    return;
  }

  try {
    const payload = verifyAccessToken(header.slice("Bearer ".length));
    req.actor = { id: payload.sub, email: payload.email };
    next();
  } catch (error) {
    next(error);
  }
};
