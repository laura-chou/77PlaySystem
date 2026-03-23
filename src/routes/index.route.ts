import * as indexController from "../controllers/index.controller";

import { createRoute, RouteConfig } from "./route.utils";

/**
 * @openapi
 * /healthz:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns a success message if the server is healthy.
 *     responses:
 *       200:
 *         description: OK
 */
export const indexRoute = (): RouteConfig => {
  return createRoute("/", (router) => {
    router.get("/healthz", indexController.getResponse);
  });
};