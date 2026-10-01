import { prisma } from "../../shared/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { logger } from "../../shared/logger.js";
import type { z } from "zod";
import type { productIdSchema, getAllProductsSchema } from "./schemas.js";


type GetAllInput = z.infer<typeof getAllProductsSchema>;

const getAllProductsService = async (input: GetAllInput) => {
    const page = input.page ?? 1;
    const limit = input.limit ?? 10;
    const skip = (page - 1) * limit;

    const [products, total] = await prisma.$transaction([
        prisma.product.findMany({
            where: input.search ? { name: { contains: input.search, mode: "insensitive" } } : {},

            orderBy: {
                createdAt: "desc",
            },
            skip,
            take: limit,
            select: { id: true, name: true, description: true, priceCents: true, stock: true }
        }),
        prisma.product.count({ where: input.search ? { name: { contains: input.search, mode: "insensitive" } } : {} })
    ])

    return {
        data: products,
        meta: { page, limit, total, totalPage: Math.ceil(total / limit) }
    };
}

const getProductByIDService = async (id: string) => {
    const product = await prisma.product.findUnique(
        {
            where: { id },
            select: { id: true, name: true, description: true, priceCents: true, stock: true }
        });
    if (!product) throw new ApiError(404, "Product not found");
    return product;
}

export { getAllProductsService, getProductByIDService };
