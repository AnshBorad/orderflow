import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError.js";
import { logger } from "./logger.js";

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ZodError) {
        return res.status(400).json({ success: false, errors: err.flatten().fieldErrors });
    }
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    logger.error({ err }, "Unhandled error");          // unexpected: log it fully
    return res.status(500).json({ success: false, message: "Internal server error" }); // hide details
};