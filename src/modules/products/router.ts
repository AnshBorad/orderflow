import { Router } from "express";
import { verifyAccessToken } from "../../middlewares/auth.js";
import { getAllProductsController ,getProductByIDController} from "./controller.js";

const productRouter = Router();

productRouter.get("/", getAllProductsController);
productRouter.get("/:id", getProductByIDController);
// productRouter.post("/", verifyAccessToken );


export { productRouter };