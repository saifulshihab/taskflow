import { actorOf } from "../../lib/actor.js";
import { route } from "../../lib/http.js";
import { workspaceIdParams } from "../workspaces/workspaces.schema.js";
import {
  createProjectSchema,
  listProjectsQuery,
  projectIdParams,
  updateProjectSchema,
} from "./projects.schema.js";
import * as projectService from "./projects.service.js";

export const projectsController = {
  create: route(
    { params: workspaceIdParams, body: createProjectSchema },
    ({ params, body, req }) =>
      projectService.create(actorOf(req), params.workspaceId, body),
    201,
  ),

  list: route(
    { params: workspaceIdParams, query: listProjectsQuery },
    ({ params, query, req }) =>
      projectService.list(actorOf(req), params.workspaceId, query),
  ),

  get: route({ params: projectIdParams }, ({ params, req }) =>
    projectService.get(actorOf(req), params.projectId),
  ),

  update: route(
    { params: projectIdParams, body: updateProjectSchema },
    ({ params, body, req }) =>
      projectService.update(actorOf(req), params.projectId, body),
  ),

  archive: route({ params: projectIdParams }, ({ params, req }) =>
    projectService.setArchived(actorOf(req), params.projectId, true),
  ),

  unarchive: route({ params: projectIdParams }, ({ params, req }) =>
    projectService.setArchived(actorOf(req), params.projectId, false),
  ),

  remove: route({ params: projectIdParams }, async ({ params, req }) => {
    await projectService.remove(actorOf(req), params.projectId);
  }),
};
