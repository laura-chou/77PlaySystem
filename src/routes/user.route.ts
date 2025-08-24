import * as userController from "../controllers/user.controller";
import authMiddleware from "../middleware/authenticate";
import validateLoginRequest from "../middleware/validateLoginRequest";

import { createRoute, RouteConfig } from "./route.utils.ts";

export const userRoutes = (): RouteConfig => {
  return createRoute("/user", (router) => {
    router.post("/login", validateLoginRequest, authMiddleware("login"), userController.userLogin);
    router.post("/create", authMiddleware("jwt-admin"), userController.userCreate);
  });
};