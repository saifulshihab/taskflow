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
