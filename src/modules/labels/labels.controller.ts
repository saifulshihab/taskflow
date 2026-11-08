import { actorOf } from "../../lib/actor.js";
import { route } from "../../lib/http.js";
import { projectIdParams } from "../projects/projects.schema.js";
import {
  createLabelSchema,
  labelIdParams,
  updateLabelSchema,
} from "./labels.schema.js";
import * as labelService from "./labels.service.js";

export const labelsController = {
  list: route({ params: projectIdParams }, ({ params, req }) =>
    labelService.list(actorOf(req), params.projectId),
  ),

  create: route(
    { params: projectIdParams, body: createLabelSchema },
    ({ params, body, req }) =>
      labelService.create(actorOf(req), params.projectId, body),
    201,
  ),

  update: route(
    { params: labelIdParams, body: updateLabelSchema },
    ({ params, body, req }) =>
      labelService.update(actorOf(req), params.labelId, body),
  ),

  remove: route({ params: labelIdParams }, async ({ params, req }) => {
    return labelService.remove(actorOf(req), params.labelId);
  }),
};
