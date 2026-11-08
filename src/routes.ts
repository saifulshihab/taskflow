import { Router } from "express";
import { workspaceActivityRouter } from "./modules/activity/activity.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import {
  commentsRouter,
  taskCommentsRouter,
} from "./modules/comments/comments.routes.js";
import {
  labelsRouter,
  workspaceLabelsRouter,
} from "./modules/labels/labels.routes.js";
import {
  projectsRouter,
  workspaceProjectsRouter,
} from "./modules/projects/projects.routes.js";
import {
  projectTasksRouter,
  tasksRouter,
  workspaceTasksRouter,
} from "./modules/tasks/tasks.routes.js";
import { workspacesRouter } from "./modules/workspaces/workspaces.routes.js";

import { viewsRouter } from "./modules/projects/views.routes.js";
export const apiRouter = Router();
apiRouter.use("/projects/:projectId/views", viewsRouter);

apiRouter.use("/auth", authRouter);

// Nested routers come first so their paths are not swallowed by the
// workspace/project/task routers mounted on the shorter prefixes.
apiRouter.use("/workspaces/:workspaceId/projects", workspaceProjectsRouter);
apiRouter.use("/projects/:projectId/labels", workspaceLabelsRouter);
apiRouter.use("/workspaces/:workspaceId/tasks", workspaceTasksRouter);
apiRouter.use("/workspaces/:workspaceId/activity", workspaceActivityRouter);
apiRouter.use("/projects/:projectId/tasks", projectTasksRouter);
apiRouter.use("/tasks/:taskId/comments", taskCommentsRouter);

apiRouter.use("/workspaces", workspacesRouter);
apiRouter.use("/projects", projectsRouter);
apiRouter.use("/tasks", tasksRouter);
apiRouter.use("/labels", labelsRouter);
apiRouter.use("/comments", commentsRouter);

import { route } from "./lib/http.js";
import { requireAuth } from "./middleware/requireAuth.js";
import { actorOf } from "./lib/actor.js";
import { undo } from "./lib/recovery.js";
import { z } from "zod";
apiRouter.post(
  "/recovery/:id/undo",
  requireAuth,
  route({ params: z.object({ id: z.uuid() }) }, ({ req, params }) =>
    undo(actorOf(req), params.id),
  ),
);
