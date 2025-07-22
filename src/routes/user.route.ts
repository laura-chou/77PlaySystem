import * as userController from "../controllers/user.controller";
import { createRoute, RouteConfig } from "./route";
import authMiddleware from "../middleware/authenticate";
import validateLoginRequest from "../middleware/validateLoginRequest";

export const userRoutes = (): RouteConfig => {
  return createRoute("/user", (router) => {
    router.post("/action", validateLoginRequest,authMiddleware("login"), userController.userLogin);
    router.get("/", authMiddleware("jwt"), userController.getUserList);
  });
};