import { Router } from "express";

export interface RouteConfig {
  prefix: string;
  router: Router;
}

export const createRouter = (_prefix: string): Router => {
  return Router();
};

export const createRoute = (prefix: string, setupRoutes: (router: Router) => void): RouteConfig => {
  const router = createRouter(prefix);
  setupRoutes(router);
  return { prefix, router };
};