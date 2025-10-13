import * as collectionController from "../controllers/collection.controller";
import authMiddleware from "../middleware/authenticate";

import { createRoute, RouteConfig } from "./route.utils";

export const collectionRoutes = (): RouteConfig => {
  return createRoute("/collection", (router) => {
    router.delete("/:name/clear", authMiddleware("jwt-admin"), collectionController.clearCollection);
  });
};