import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { createOrderSchema } from "./schemas.js";
import { createOrderService, getMyOrdersService } from "./service.js";

const createOrderController = asyncHandler(async (req, res) => {
    if (!req.user) throw new ApiError(401, "Unauthorized");
    const idempotencyKey = req.header("Idempotency-Key");
    if (!idempotencyKey) throw new ApiError(400, "Idempotency-Key header is required");

    const input = createOrderSchema.parse(req.body);
    const { order, replayed } = await createOrderService(req.user.id, input, idempotencyKey);
    res.status(replayed ? 200 : 201).json(new ApiResponse(replayed ? 200 : 201, order, replayed ? "Order already exists" : "Order created successfully"));
});

const getMyOrdersController = asyncHandler(async (req, res) => {
    if (!req.user) throw new ApiError(401, "Unauthorized");

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const { data, meta } = await getMyOrdersService(req.user.id, page, limit);
    res.status(200).json(new ApiResponse(200, { data, meta }, "Orders fetched successfully"));
});

export { createOrderController, getMyOrdersController }