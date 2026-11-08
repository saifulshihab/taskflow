import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/requireAuth.js";
import { route } from "../../lib/http.js";
import { actorOf } from "../../lib/actor.js";
import { projectScope } from "../../lib/scope.js";
import { prisma } from "../../lib/prisma.js";
import { notFound } from "../../lib/errors.js";
const params = z.object({ projectId: z.uuid() });
export const viewsRouter = Router({ mergeParams: true });
viewsRouter.use(requireAuth);
viewsRouter.get(
  "/",
  route({ params }, async ({ req, params }) => {
    const actor = actorOf(req);
    await projectScope(actor.id, params.projectId);
    return prisma.savedView.findMany({
      where: { userId: actor.id, projectId: params.projectId },
      orderBy: { createdAt: "asc" },
    });
  }),
);
viewsRouter.post(
  "/",
  route(
    {
      params,
      body: z.object({
        name: z.string().trim().min(1).max(80),
        filters: z.record(
          z.string(),
          z.union([z.string(), z.boolean(), z.number(), z.array(z.string())]),
        ),
      }),
    },
    async ({ req, params, body }) => {
      const actor = actorOf(req);
      await projectScope(actor.id, params.projectId);
      return prisma.savedView.create({
        data: { ...body, userId: actor.id, projectId: params.projectId },
      });
    },
  ),
);
viewsRouter.delete(
  "/:id",
  route(
    { params: params.extend({ id: z.uuid() }) },
    async ({ req, params }) => {
      const actor = actorOf(req);
      await projectScope(actor.id, params.projectId);
      const result = await prisma.savedView.deleteMany({
        where: { id: params.id, userId: actor.id, projectId: params.projectId },
      });
      if (!result.count) throw notFound("Saved view");
    },
  ),
);
