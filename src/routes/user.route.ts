import * as userController from "../controllers/user.controller";
import authMiddleware from "../middleware/authenticate";
import validateLoginRequest from "../middleware/validateLoginRequest";

import { createRoute, RouteConfig } from "./route.utils";

/**
 * @openapi
 * /user/login:
 *   post:
 *     summary: User login
 *     description: Authenticates a user and returns a token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - account
 *               - password
 *             properties:
 *               account:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 * /user/create:
 *   post:
 *     summary: Create user
 *     description: Creates a new user (admin access required).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - account
 *               - password
 *               - name
 *               - role
 *             properties:
 *               account:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, basic]
 *     responses:
 *       201:
 *         description: User created
 * /user/logout:
 *   post:
 *     summary: User logout
 *     description: Logouts the current user.
 *     responses:
 *       200:
 *         description: Logout successful
 */
export const userRoutes = (): RouteConfig => {
  return createRoute("/user", (router) => {
    router.post("/login", validateLoginRequest, authMiddleware("login"), userController.userLogin);
    router.post("/create", authMiddleware("jwt-admin"), userController.userCreate);
    router.post("/logout", authMiddleware("jwt-basic"), userController.userLogout);
  });
};