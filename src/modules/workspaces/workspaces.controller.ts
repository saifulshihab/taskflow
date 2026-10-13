import { actorOf } from "../../lib/actor.js";
import { route } from "../../lib/http.js";
import { paginationSchema } from "../../lib/pagination.js";
import {
  addMemberSchema,
  createWorkspaceSchema,
  memberParams,
  updateMemberSchema,
  updateWorkspaceSchema,
  workspaceIdParams,
} from "./workspaces.schema.js";
import * as workspaceService from "./workspaces.service.js";

export const workspacesController = {
  create: route(
    { body: createWorkspaceSchema },
    ({ body, req }) => workspaceService.create(actorOf(req), body),
    201,
  ),

  list: route({ query: paginationSchema }, ({ query, req }) =>
    workspaceService.list(actorOf(req), query),
  ),

  get: route({ params: workspaceIdParams }, ({ params, req }) =>
    workspaceService.get(actorOf(req), params.workspaceId),
  ),

  update: route(
    { params: workspaceIdParams, body: updateWorkspaceSchema },
    ({ params, body, req }) =>
      workspaceService.update(actorOf(req), params.workspaceId, body),
  ),

  remove: route({ params: workspaceIdParams }, async ({ params, req }) => {
    await workspaceService.remove(actorOf(req), params.workspaceId);
  }),

  listMembers: route(
    { params: workspaceIdParams, query: paginationSchema },
    ({ params, query, req }) =>
      workspaceService.listMembers(actorOf(req), params.workspaceId, query),
  ),

  addMember: route(
    { params: workspaceIdParams, body: addMemberSchema },
    ({ params, body, req }) =>
      workspaceService.addMember(actorOf(req), params.workspaceId, body),
    201,
  ),

  updateMemberRole: route(
    { params: memberParams, body: updateMemberSchema },
    ({ params, body, req }) =>
      workspaceService.updateMemberRole(
        actorOf(req),
        params.workspaceId,
        params.userId,
        body.role,
      ),
  ),

  removeMember: route({ params: memberParams }, async ({ params, req }) => {
    await workspaceService.removeMember(
      actorOf(req),
      params.workspaceId,
      params.userId,
    );
  }),
};
