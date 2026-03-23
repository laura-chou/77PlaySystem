import * as collectionController from "../controllers/collection.controller";
import authMiddleware from "../middleware/authenticate";

import { createRoute, RouteConfig } from "./route.utils";

/**
 * @openapi
 * /collection/{name}/clear:
 *   delete:
 *     summary: Clear collection
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Collection cleared
 */
export const collectionRoutes = (): RouteConfig => {
  return createRoute("/collection", (router) => {
    router.delete("/:name/clear", authMiddleware("jwt-admin"), collectionController.clearCollection);
  });
};