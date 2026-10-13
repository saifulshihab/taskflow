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
