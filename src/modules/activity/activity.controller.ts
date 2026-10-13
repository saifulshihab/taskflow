import { actorOf } from "../../lib/actor.js";
import { route } from "../../lib/http.js";
import { workspaceIdParams } from "../workspaces/workspaces.schema.js";
import { listActivityQuery } from "./activity.schema.js";
import * as activityService from "./activity.service.js";

export const activityController = {
  list: route(
    { params: workspaceIdParams, query: listActivityQuery },
    ({ params, query, req }) =>
      activityService.list(actorOf(req), params.workspaceId, query),
  ),
};
