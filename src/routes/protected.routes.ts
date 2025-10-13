import { collectionRoutes } from "./collection.route";
import { custRoutes } from "./customer.route";
import { RouteConfig } from "./route.utils";
import { userRoutes } from "./user.route";

const protectedRoutes: Array<RouteConfig> = [
  userRoutes(),
  custRoutes(),
  collectionRoutes()
];

export default protectedRoutes;
