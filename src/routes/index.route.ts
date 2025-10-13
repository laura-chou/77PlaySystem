import * as indexController from "../controllers/index.controller";

import { createRoute, RouteConfig } from "./route.utils";

export const indexRoute = (): RouteConfig => {
  return createRoute("/", (router) => {
    router.get("/healthz", indexController.getResponse);
  });
};