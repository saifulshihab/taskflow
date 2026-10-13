import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { commentsController } from "./comments.controller.js";

export const taskCommentsRouter = Router({ mergeParams: true });

taskCommentsRouter.use(requireAuth);
taskCommentsRouter.get("/", commentsController.list);
taskCommentsRouter.post("/", commentsController.create);

export const commentsRouter = Router();

commentsRouter.use(requireAuth);
commentsRouter.patch("/:commentId", commentsController.update);
commentsRouter.delete("/:commentId", commentsController.remove);
