import { collectionRoutes } from "./collection.route";
import { custRoutes } from "./customer.route";
import { indexRoute } from "./index.route";
import { RouteConfig } from "./route";
import { txnRoutes } from "./transaction.route";
import { userRoutes } from "./user.route";

export const router: Array<RouteConfig> = [
  indexRoute(),
  userRoutes(),
  custRoutes(),
  txnRoutes(),
  collectionRoutes()
];
