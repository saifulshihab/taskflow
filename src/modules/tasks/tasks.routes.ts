import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { tasksController } from "./tasks.controller.js";

export const projectTasksRouter = Router({ mergeParams: true });

projectTasksRouter.use(requireAuth);
projectTasksRouter.post("/", tasksController.create);
projectTasksRouter.get("/", tasksController.listForProject);

// Cross-project view: the board every filter in listTasksQuery targets.
export const workspaceTasksRouter = Router({ mergeParams: true });

workspaceTasksRouter.use(requireAuth);
workspaceTasksRouter.get("/", tasksController.listForWorkspace);

export const tasksRouter = Router();

tasksRouter.use(requireAuth);
tasksRouter.get("/:taskId", tasksController.get);
tasksRouter.patch("/:taskId", tasksController.update);
tasksRouter.delete("/:taskId", tasksController.remove);
tasksRouter.get("/:taskId/subtasks", tasksController.listSubtasks);
tasksRouter.patch("/:taskId/status", tasksController.setStatus);
tasksRouter.patch("/:taskId/assignee", tasksController.setAssignee);
tasksRouter.post("/:taskId/labels", tasksController.attachLabel);
tasksRouter.delete("/:taskId/labels/:labelId", tasksController.detachLabel);
