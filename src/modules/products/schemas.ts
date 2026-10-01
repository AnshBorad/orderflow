import z from "zod";

const createProductSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    priceCents: z.number().int().positive("Price must be positive"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    stock: z.number().int().min(0, "Stock cannot be negative"),
})

const updateProductSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    priceCents: z.number().int().positive("Price must be positive"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    stock: z.number().int().min(0, "Stock cannot be negative"),
})
const productIdSchema = z.object({ id: z.string().cuid("Invalid product id") });





const getAllProductsSchema = z.object({
    search: z.string().optional(),
    category: z.string().optional(),
    brand: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
    page: z.number().int().positive("Page must be positive").optional(),
    limit: z.number().int().max(50).positive("Limit must be positive").optional(),
})

const getSingleProductSchema = z.object({
    id: z.string().min(1, "Product ID is required"),
})

const createProductReviewSchema = z.object({
    productId: z.string().min(1, "Product ID is required"),
    rating: z.number().positive("Rating must be positive"),
    comment: z.string().min(10, "Comment must be at least 10 characters"),
})

const updateProductReviewSchema = z.object({
    productId: z.string().min(1, "Product ID is required"),
    rating: z.number().positive("Rating must be positive"),
    comment: z.string().min(10, "Comment must be at least 10 characters"),
})



export { createProductSchema, updateProductSchema, getAllProductsSchema, getSingleProductSchema, createProductReviewSchema, updateProductReviewSchema, productIdSchema };