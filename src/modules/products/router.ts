import { Router } from "express";
import { verifyAccessToken } from "../../middlewares/auth.js";
import { getAllProductsController, getProductByIDController, createProductController } from "./controller.js";
import { requireAdmin } from "../../middlewares/requireAdmin.js";

const productRouter = Router();

productRouter.get("/", getAllProductsController);
productRouter.get("/:id", getProductByIDController);
productRouter.post("/", verifyAccessToken, requireAdmin, createProductController);


export { productRouter };