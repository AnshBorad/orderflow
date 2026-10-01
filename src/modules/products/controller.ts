import { asyncHandler } from "../../utils/asyncHandler.js";
import { getAllProductsService, getProductByIdService  } from "./service.js";
import { getAllProductsSchema, productIdSchema } from "./schemas.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

const getAllProductsController = asyncHandler(async (req, res) => {
    const input = getAllProductsSchema.parse(req.query);
    const { data, meta } = await getAllProductsService(input);
    res.status(200).json(new ApiResponse(200, { products: data, meta }, "Products fetched successfully"));
});

const getProductByIDController = asyncHandler(async (req, res) => {
    const input = productIdSchema.parse(req.params);
    const result = await getProductByIdService (input.id);
    res.status(200).json(new ApiResponse(200, result, "Product fetched successfully"));
});
export { getAllProductsController, getProductByIDController };