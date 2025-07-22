import { indexRoute } from "./index.route";
import { RouteConfig } from "./route";
import { userRoutes } from "./user.route";

export const router: Array<RouteConfig> = [
  indexRoute(),
  userRoutes()
];
