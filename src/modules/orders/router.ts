import { Router } from "express";
import { verifyAccessToken } from "../../middlewares/auth.js";
import { createOrderController, getMyOrdersController } from "./controller.js";

const ordersRouter = Router();

ordersRouter.post("/", verifyAccessToken, createOrderController);
ordersRouter.get("/", verifyAccessToken, getMyOrdersController);

export { ordersRouter };