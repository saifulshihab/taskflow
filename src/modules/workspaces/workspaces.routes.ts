import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { workspacesController } from "./workspaces.controller.js";

export const workspacesRouter = Router();

workspacesRouter.use(requireAuth);

workspacesRouter.post("/", workspacesController.create);
workspacesRouter.get("/", workspacesController.list);
workspacesRouter.get("/:workspaceId", workspacesController.get);
workspacesRouter.patch("/:workspaceId", workspacesController.update);
workspacesRouter.delete("/:workspaceId", workspacesController.remove);

workspacesRouter.get("/:workspaceId/members", workspacesController.listMembers);
workspacesRouter.post("/:workspaceId/members", workspacesController.addMember);
workspacesRouter.patch(
  "/:workspaceId/members/:userId",
  workspacesController.updateMemberRole,
);
workspacesRouter.delete(
  "/:workspaceId/members/:userId",
  workspacesController.removeMember,
);

workspacesRouter.post("/:workspaceId/transfer", workspacesController.transfer);

import { route } from "../../lib/http.js";
import { actorOf } from "../../lib/actor.js";
import { prisma } from "../../lib/prisma.js";
import { requireMembership, visibleProjects } from "../../lib/rbac.js";
import { workspaceIdParams } from "./workspaces.schema.js";
workspacesRouter.get(
  "/:workspaceId/stats",
  route({ params: workspaceIdParams }, async ({ req, params }) => {
    const actor = actorOf(req);
    await requireMembership(actor.id, params.workspaceId);
    const scope = {
      assigneeId: actor.id,
      deletedAt: null,
      project: visibleProjects(actor.id, params.workspaceId),
    };
    const [open, done, comments] = await Promise.all([
      prisma.task.count({
        where: { ...scope, status: { notIn: ["DONE", "CANCELLED"] } },
      }),
      prisma.task.count({ where: { ...scope, status: "DONE" } }),
      prisma.comment.count({
        where: {
          authorId: actor.id,
          deletedAt: null,
          task: {
            deletedAt: null,
            project: visibleProjects(actor.id, params.workspaceId),
          },
        },
      }),
    ]);
    return { open, done, comments };
  }),
);
