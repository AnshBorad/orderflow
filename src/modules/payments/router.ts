import { Router } from "express";
import { verifyAccessToken } from "../../middlewares/auth.js";
import { createPaymentController } from "./controller.js";

const paymentsRouter = Router();

paymentsRouter.post("/create", verifyAccessToken, createPaymentController);

export { paymentsRouter };