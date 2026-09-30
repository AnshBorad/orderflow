import { Router } from "express";
import { verifyAccessToken } from "../../middlewares/auth.js";

const productRouter = Router();

productRouter.get("/", );
productRouter.get("/:id", );
productRouter.post("/", verifyAccessToken, );


export { productRouter };