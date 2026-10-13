import { actorOf } from "../../lib/actor.js";
import { route } from "../../lib/http.js";
import { workspaceIdParams } from "../workspaces/workspaces.schema.js";
import {
  createLabelSchema,
  labelIdParams,
  updateLabelSchema,
} from "./labels.schema.js";
import * as labelService from "./labels.service.js";

export const labelsController = {
  list: route({ params: workspaceIdParams }, ({ params, req }) =>
    labelService.list(actorOf(req), params.workspaceId),
  ),

  create: route(
    { params: workspaceIdParams, body: createLabelSchema },
    ({ params, body, req }) =>
      labelService.create(actorOf(req), params.workspaceId, body),
    201,
  ),

  update: route(
    { params: labelIdParams, body: updateLabelSchema },
    ({ params, body, req }) =>
      labelService.update(actorOf(req), params.labelId, body),
  ),

  remove: route({ params: labelIdParams }, async ({ params, req }) => {
    await labelService.remove(actorOf(req), params.labelId);
  }),
};
