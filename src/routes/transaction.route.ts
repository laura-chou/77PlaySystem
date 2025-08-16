import * as transactionController from "../controllers/transaction.controller";
import authMiddleware from "../middleware/authenticate";

import { createRoute, RouteConfig } from "./route";

export const txnRoutes = (): RouteConfig => {
  return createRoute("/transaction", (router) => {
    router.post("/create/:custId", authMiddleware("jwt-basic"), transactionController.createTransaction);
  });
};