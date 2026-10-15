import z from "zod";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { createPaymentService } from "./service.js";

const createPaymentController = asyncHandler(async (req, res) => {
    if (!req.user) throw new ApiError(401, "Unauthorized");
    const input = z.object({ orderId: z.string().min(1) }).parse(req.body);
    const result = await createPaymentService(req.user.id, input.orderId);
    res.status(201).json(new ApiResponse(201, result, "Payment initiated"));
}); 

export { createPaymentController };