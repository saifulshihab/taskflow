import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { labelsController } from "./labels.controller.js";

export const workspaceLabelsRouter = Router({ mergeParams: true });

workspaceLabelsRouter.use(requireAuth);
workspaceLabelsRouter.get("/", labelsController.list);
workspaceLabelsRouter.post("/", labelsController.create);

export const labelsRouter = Router();

labelsRouter.use(requireAuth);
labelsRouter.patch("/:labelId", labelsController.update);
labelsRouter.delete("/:labelId", labelsController.remove);
