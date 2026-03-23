import * as customerController from "../controllers/customer.controller";
import authMiddleware from "../middleware/authenticate";

import { createRoute, RouteConfig } from "./route.utils";

/**
 * @openapi
 * /customer:
 *   get:
 *     summary: Get customer list
 *     responses:
 *       200:
 *         description: List of customers
 * /customer/{custId}:
 *   get:
 *     summary: Get customer by ID
 *     parameters:
 *       - in: path
 *         name: custId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer details
 * /customer/create:
 *   post:
 *     summary: Create customer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - custName
 *             properties:
 *               custName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Customer created
 * /customer/update:
 *   patch:
 *     summary: Update customer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - custId
 *             properties:
 *               custId:
 *                 type: string
 *               custName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Customer updated
 */
export const custRoutes = (): RouteConfig => {
  return createRoute("/customer", (router) => {
    router.get("/", authMiddleware("jwt-basic"), customerController.getCustList);
    router.get("/:custId", authMiddleware("jwt-basic"), customerController.getCustomer);
    router.post("/create", authMiddleware("jwt-basic"), customerController.createCustomer);
    router.patch("/update", authMiddleware("jwt-basic"), customerController.updateCustInfo);
  });
};