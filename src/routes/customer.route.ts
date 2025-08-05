import * as customerController from "../controllers/customer.controller";
import authMiddleware from "../middleware/authenticate";

import { createRoute, RouteConfig } from "./route";

export const custRoutes = (): RouteConfig => {
  return createRoute("/customer", (router) => {
    router.get("/", authMiddleware("jwt"), customerController.getCustList);
    router.get("/:custId", authMiddleware("jwt"), customerController.getCustomer);
    router.patch("/update/:custId", authMiddleware("jwt"), customerController.updateCustInfo);
  });
};