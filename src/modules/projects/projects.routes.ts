import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { projectsController } from "./projects.controller.js";

// Creating and listing happen inside a workspace; everything else addresses
// the project directly, which resolves its own workspace for authorization.
export const workspaceProjectsRouter = Router({ mergeParams: true });

workspaceProjectsRouter.use(requireAuth);
workspaceProjectsRouter.post("/", projectsController.create);
workspaceProjectsRouter.get("/", projectsController.list);

export const projectsRouter = Router();

projectsRouter.use(requireAuth);
projectsRouter.get("/:projectId", projectsController.get);
projectsRouter.patch("/:projectId", projectsController.update);
projectsRouter.delete("/:projectId", projectsController.remove);
projectsRouter.post("/:projectId/archive", projectsController.archive);
projectsRouter.post("/:projectId/unarchive", projectsController.unarchive);

import { z } from "zod";
import { route } from "../../lib/http.js";
import { actorOf } from "../../lib/actor.js";
import * as service from "./projects.service.js";
const params = z.object({ projectId: z.uuid() });
const memberParams = z.object({ projectId: z.uuid(), userId: z.uuid() });
projectsRouter.get(
  "/:projectId/members",
  route({ params }, ({ req, params }) =>
    service.members(actorOf(req), params.projectId),
  ),
);
projectsRouter.get(
  "/:projectId/candidates",
  route({ params }, ({ req, params }) =>
    service.candidates(actorOf(req), params.projectId),
  ),
);
projectsRouter.post(
  "/:projectId/members",
  route(
    {
      params,
      body: z.object({ userId: z.uuid(), role: z.enum(["ADMIN", "MEMBER"]) }),
    },
    ({ req, params, body }) =>
      service.setMember(actorOf(req), params.projectId, body.userId, body.role),
  ),
);
projectsRouter.patch(
  "/:projectId/members/:userId",
  route(
    {
      params: memberParams,
      body: z.object({ role: z.enum(["ADMIN", "MEMBER"]) }),
    },
    ({ req, params, body }) =>
      service.setMember(
        actorOf(req),
        params.projectId,
        params.userId,
        body.role,
      ),
  ),
);
projectsRouter.delete(
  "/:projectId/members/:userId",
  route({ params: memberParams }, ({ req, params }) =>
    service.setMember(actorOf(req), params.projectId, params.userId, null),
  ),
);
