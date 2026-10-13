import { actorOf } from "../../lib/actor.js";
import { route } from "../../lib/http.js";
import { paginationSchema } from "../../lib/pagination.js";
import { taskIdParams } from "../tasks/tasks.schema.js";
import {
  commentIdParams,
  createCommentSchema,
  updateCommentSchema,
} from "./comments.schema.js";
import * as commentService from "./comments.service.js";

export const commentsController = {
  list: route(
    { params: taskIdParams, query: paginationSchema },
    ({ params, query, req }) =>
      commentService.list(actorOf(req), params.taskId, query),
  ),

  create: route(
    { params: taskIdParams, body: createCommentSchema },
    ({ params, body, req }) =>
      commentService.create(actorOf(req), params.taskId, body),
    201,
  ),

  update: route(
    { params: commentIdParams, body: updateCommentSchema },
    ({ params, body, req }) =>
      commentService.update(actorOf(req), params.commentId, body.body),
  ),

  remove: route({ params: commentIdParams }, async ({ params, req }) => {
    await commentService.remove(actorOf(req), params.commentId);
  }),
};
