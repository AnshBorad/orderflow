import { Router } from "express";
import { signInController, signUpController, signOutController, meController, getAllUsersController } from "./controller.js";
import { verifyAccessToken } from "../../middlewares/auth.js";

const authRouter = Router();

authRouter.get("/me", verifyAccessToken, meController);
authRouter.get("/users", verifyAccessToken, getAllUsersController);
authRouter.post("/register", signUpController);
authRouter.post("/login", signInController);
authRouter.post("/signOut", verifyAccessToken, signOutController);
export { authRouter };