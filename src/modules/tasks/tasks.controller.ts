import { actorOf } from "../../lib/actor.js";
import { route } from "../../lib/http.js";
import { projectIdParams } from "../projects/projects.schema.js";
import { workspaceIdParams } from "../workspaces/workspaces.schema.js";
import {
  attachLabelSchema,
  createTaskSchema,
  listTasksQuery,
  taskIdParams,
  taskLabelParams,
  updateAssigneeSchema,
  updateStatusSchema,
  updateTaskSchema,
} from "./tasks.schema.js";
import * as taskService from "./tasks.service.js";

export const tasksController = {
  create: route(
    { params: projectIdParams, body: createTaskSchema },
    ({ params, body, req }) =>
      taskService.create(actorOf(req), params.projectId, body),
    201,
  ),

  listForProject: route(
    { params: projectIdParams, query: listTasksQuery },
    ({ params, query, req }) =>
      taskService.listForProject(actorOf(req), params.projectId, query),
  ),

  listForWorkspace: route(
    { params: workspaceIdParams, query: listTasksQuery },
    ({ params, query, req }) =>
      taskService.listForWorkspace(actorOf(req), params.workspaceId, query),
  ),

  get: route({ params: taskIdParams }, ({ params, req }) =>
    taskService.get(actorOf(req), params.taskId),
  ),

  listSubtasks: route({ params: taskIdParams }, ({ params, req }) =>
    taskService.listSubtasks(actorOf(req), params.taskId),
  ),

  update: route(
    { params: taskIdParams, body: updateTaskSchema },
    ({ params, body, req }) =>
      taskService.update(actorOf(req), params.taskId, body),
  ),

  setStatus: route(
    { params: taskIdParams, body: updateStatusSchema },
    ({ params, body, req }) =>
      taskService.setStatus(actorOf(req), params.taskId, body.status),
  ),

  setAssignee: route(
    { params: taskIdParams, body: updateAssigneeSchema },
    ({ params, body, req }) =>
      taskService.setAssignee(actorOf(req), params.taskId, body.assigneeId),
  ),

  attachLabel: route(
    { params: taskIdParams, body: attachLabelSchema },
    ({ params, body, req }) =>
      taskService.attachLabel(actorOf(req), params.taskId, body.labelId),
    201,
  ),

  detachLabel: route({ params: taskLabelParams }, ({ params, req }) =>
    taskService.detachLabel(actorOf(req), params.taskId, params.labelId),
  ),

  remove: route({ params: taskIdParams }, async ({ params, req }) => {
    await taskService.remove(actorOf(req), params.taskId);
  }),
};
