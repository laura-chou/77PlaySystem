import { collectionRoutes } from "./collection.route";
import { custRoutes } from "./customer.route";
import { RouteConfig } from "./route.utils.ts";
import { txnRoutes } from "./transaction.route";
import { userRoutes } from "./user.route";

const protectedRoutes: Array<RouteConfig> = [
  userRoutes(),
  custRoutes(),
  txnRoutes(),
  collectionRoutes()
];

export default protectedRoutes;
