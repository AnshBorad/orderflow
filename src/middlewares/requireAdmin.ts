import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError.js";
import { logger } from "../shared/logger.js";


export const requireAdmin = (req: Request, _res: Response, next: NextFunction) => {
    try {
        if (req.user?.role !== "ADMIN") return next(new ApiError(403, "Admin access required"));
        next();
    } catch (error) {
        logger.error(error);
        next(error);
    }
};