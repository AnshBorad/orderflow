import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { config } from "../shared/config.js";

export const verifyAccessToken = asyncHandler(async (req, res, next) => {
    const token = req.cookies.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) throw new ApiError(401, "Unauthorized");

    let decoded: jwt.JwtPayload;
    try {
        decoded = jwt.verify(token, config.JWT_ACCESS_SECRET) as jwt.JwtPayload;
        //                    ↑ no "!" — zod config guarantees the string, TS knows it
    } catch {
        throw new ApiError(401, "Unauthorized"); // expired, tampered, malformed — all 401
    }

    if (!decoded.id) throw new ApiError(401, "Unauthorized");

    req.user = {                        // attach typed, minimal identity — not raw payload
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
    };
    next();
});