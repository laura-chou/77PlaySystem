import { indexRoute } from "./index.route";
import { userRoutes } from "./user.route";
import { RouteConfig } from "./route";

export const router: Array<RouteConfig> = [
  indexRoute(),
  userRoutes()
];
