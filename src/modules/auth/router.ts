import { Router } from "express";
import { signInController, signUpController, meController, getAllUsersController } from "./controller.js";
import { verifyAccessToken } from "../../middlewares/auth.js";

const authRouter = Router();

authRouter.get("/me", verifyAccessToken, meController);
authRouter.get("/getAllUsers", verifyAccessToken, getAllUsersController);
authRouter.post("/register", signUpController);
authRouter.post("/login", signInController);

export { authRouter };