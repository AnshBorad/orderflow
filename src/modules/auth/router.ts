import { Router } from "express";
import { signInController, signUpController } from "./controller.js";

const authRouter = Router();

authRouter.post("/register", signUpController);
authRouter.post("/login", signInController);

export { authRouter };