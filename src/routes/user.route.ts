import * as userController from "../controllers/user.controller";
import { createRoute, RouteConfig } from "./route";
import authMiddleware from "../middleware/authenticate";

export const userRoutes = (): RouteConfig => {
  return createRoute("/user", (router) => {
    router.get("/", authMiddleware("jwt"), userController.userLogin);
    router.post("/action", authMiddleware("login"), userController.userLogin);
  });
};