import * as indexController from "../controllers/index.controller";

import { createRoute, RouteConfig } from "./route";

export const indexRoute = (): RouteConfig => {
  return createRoute("/", (router) => {
    router.get("/", indexController.getResponse);
  });
};