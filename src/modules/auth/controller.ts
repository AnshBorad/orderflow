import { Request, Response, NextFunction } from "express";
import { signInService, signUpService } from "./service.js";
import { loginSchema, signUpSchema } from "./schema.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

const signUpController = asyncHandler(async (req, res) => {

    const input = signUpSchema.parse(req.body);
    const user = await signUpService(input);
    return res.status(201).json(
        new ApiResponse(201, user, "User created successfully")
    );

})

const signInController = asyncHandler(async (req, res) => {
    const input = loginSchema.parse(req.body);
    const user = await signInService(input);
    return res.status(200).json(
        new ApiResponse(200, user, "User signed in successfully")
    );
})

export { signUpController, signInController };