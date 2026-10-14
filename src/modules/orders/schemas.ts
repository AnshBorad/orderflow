import { z } from "zod";

const createOrderSchema = z.object({
    productId: z.string().min(1, "Product ID is required"),
    quantity: z.coerce.number().int().min(1, "Minimum quantity is 1").max(10, "Maximum quantity is 10"),
});

export { createOrderSchema };
export type CreateOrderInput = z.infer<typeof createOrderSchema>;