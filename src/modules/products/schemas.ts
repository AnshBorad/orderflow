import z from "zod";

const createProductSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    price: z.number().int().positive("Price must be positive"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    stock: z.number().int().min(0,"Stock cannot be negative"),
})

const updateProductSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    price: z.number().int().positive("Price must be positive"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    stock: z.number().int().min(0,"Stock cannot be negative"),
})

const deleteProductSchema = z.object({
    id: z.string().min(1, "Product ID is required"),
})

const getProductSchema = z.object({
    id: z.string().min(1, "Product ID is required"),
})

const getAllProductsSchema = z.object({
    search: z.string().optional(),
    category: z.string().optional(),
    brand: z.string().optional(),
    minPrice: z.number().positive("Min price must be positive").optional(),
    maxPrice: z.number().positive("Max price must be positive").optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
    page: z.number().positive("Page must be positive").optional(),
    limit: z.number().positive("Limit must be positive").optional(),
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

const deleteProductReviewSchema = z.object({
    productId: z.string().min(1, "Product ID is required"),
})

const getProductReviewsSchema = z.object({
    productId: z.string().min(1, "Product ID is required"),
})

const getProductRatingsSchema = z.object({
    productId: z.string().min(1, "Product ID is required"),
})

export { createProductSchema, updateProductSchema, deleteProductSchema, getProductSchema, getAllProductsSchema, getSingleProductSchema, createProductReviewSchema, updateProductReviewSchema, deleteProductReviewSchema, getProductReviewsSchema, getProductRatingsSchema };