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
const productIdSchema = z.object({ id: z.string().min(1, "Invalid product id") });





const getAllProductsSchema = z.object({
    search: z.string().optional(),
    category: z.string().optional(),
    brand: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().max(50).positive().optional(),
})

const getSingleProductSchema = z.object({
    id: z.string().min(1, "Product ID is required"),
})



export { createProductSchema, updateProductSchema, getAllProductsSchema, getSingleProductSchema, productIdSchema };