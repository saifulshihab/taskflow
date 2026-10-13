import type { Request } from "express";
import { unauthorized } from "./errors.js";

/**
 * The caller identity every service takes explicitly, so authorization does
 * not depend on Express. MCP tool handlers will build one of these the same
 * way and call the same services.
 */
export interface Actor {
  id: string;
  email: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      actor?: Actor;
    }
  }
}

export const actorOf = (req: Request): Actor => {
  if (!req.actor) throw unauthorized();
  return req.actor;
};
