import * as customerController from "../controllers/customer.controller";
import authMiddleware from "../middleware/authenticate";

import { createRoute, RouteConfig } from "./route.utils.ts";

export const custRoutes = (): RouteConfig => {
  return createRoute("/customer", (router) => {
    router.get("/", authMiddleware("jwt-basic"), customerController.getCustList);
    router.get("/:custId", authMiddleware("jwt-basic"), customerController.getCustomer);
    router.post("/create", authMiddleware("jwt-basic"), customerController.createCustomer);
    router.patch("/update", authMiddleware("jwt-basic"), customerController.updateCustInfo);
  });
};