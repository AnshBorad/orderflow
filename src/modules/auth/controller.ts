import { Request, Response, NextFunction } from "express";
import { signInService, signUpService, getAllUsersService, signOutService } from "./service.js";
import { loginSchema, signUpSchema } from "./schemas.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { prisma } from "../../shared/prisma.js";
import { ApiError } from "../../utils/ApiError.js";

const options = {
    httpOnly: true,
    secure: true,
};

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



    return res
        .cookie("refreshToken", user.refreshToken, options)
        .cookie("accessToken", user.accessToken, options)
        .status(200)
        .json(
            new ApiResponse(200, user, "User signed in successfully")
        );
})

const signOutController = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!refreshToken) throw new ApiError(400, "Refresh token is required");
    await signOutService(refreshToken);
    return res
        .clearCookie("refreshToken", options)
        .clearCookie("accessToken", options)
        .status(200)
        .json(new ApiResponse(200, null, "User signed out successfully"));
});

const meController = asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user!.id },              // ! is SAFE here: middleware guarantees it
        select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    if (!user) throw new ApiError(404, "User not found"); // valid token, deleted user
    res.status(200).json(new ApiResponse(200, { user }));
});

const getAllUsersController = asyncHandler(async (req, res) => {
    if (!req.user) throw new ApiError(401, "Unauthorized");
    const users = await getAllUsersService(req.user);
    res.status(200).json(new ApiResponse(200, users, "Users fetched successfully"));
});

export { signUpController, signInController, signOutController, meController, getAllUsersController };