import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { authController } from "./auth.controller.js";

export const authRouter = Router();

authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
authRouter.post("/refresh", authController.refresh);
authRouter.post("/logout", authController.logout);
authRouter.get("/me", requireAuth, authController.me);

import { z } from "zod";
import { route } from "../../lib/http.js";
import { actorOf } from "../../lib/actor.js";
import * as service from "./auth.service.js";
const profile = z
  .object({
    name: z.string().trim().min(1).max(120),
    email: z.email().toLowerCase(),
    avatar: z
      .string()
      .max(200000)
      .refine(
        (v) => v === "" || /^data:image\/(png|jpeg|webp);base64,/.test(v),
        "Use a PNG, JPEG or WebP avatar",
      ),
    jobTitle: z.string().max(120),
    bio: z.string().max(2000),
    timezone: z.string().refine((v) => {
      try {
        new Intl.DateTimeFormat("en", { timeZone: v });
        return true;
      } catch {
        return false;
      }
    }),
    theme: z.enum(["light", "dark", "system"]),
    startPage: z.enum(["board", "list", "activity"]),
  })
  .partial();
authRouter.patch(
  "/me",
  requireAuth,
  route({ body: profile }, ({ req, body }) =>
    service.updateProfile(actorOf(req).id, body),
  ),
);
authRouter.post(
  "/password",
  requireAuth,
  route(
    {
      body: z.object({
        currentPassword: z.string(),
        password: z.string().min(8).max(128),
      }),
    },
    ({ req, body }) =>
      service.changePassword(
        actorOf(req).id,
        body.currentPassword,
        body.password,
      ),
  ),
);
authRouter.delete(
  "/me",
  requireAuth,
  route({ body: z.object({ password: z.string() }) }, async ({ req, body }) => {
    await service.deleteAccount(actorOf(req).id, body.password);
    return { deleted: true };
  }),
);
