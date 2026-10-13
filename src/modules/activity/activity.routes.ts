import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { activityController } from "./activity.controller.js";

export const workspaceActivityRouter = Router({ mergeParams: true });

workspaceActivityRouter.use(requireAuth);
workspaceActivityRouter.get("/", activityController.list);
