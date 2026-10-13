import { actorOf } from "../../lib/actor.js";
import { route } from "../../lib/http.js";
import { loginSchema, refreshSchema, registerSchema } from "./auth.schema.js";
import * as authService from "./auth.service.js";

export const authController = {
  register: route(
    { body: registerSchema },
    ({ body }) => authService.register(body),
    201,
  ),

  login: route({ body: loginSchema }, ({ body }) => authService.login(body)),

  refresh: route({ body: refreshSchema }, ({ body }) =>
    authService.refresh(body.refreshToken),
  ),

  logout: route({ body: refreshSchema }, async ({ body }) => {
    await authService.logout(body.refreshToken);
  }),

  me: route({}, ({ req }) => authService.me(actorOf(req).id)),
};
