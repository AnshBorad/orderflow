import { Prisma } from "@prisma/client";
import { prisma } from "../../shared/prisma.js";
import { ApiError } from "../../utils/ApiError.js";

const createOrderService = async (
    userId: string,
    input: { productId: string; quantity: number },
    idempotencyKey: string
) => {
    // ── 1. Idempotency fast-path ──────────────────────────
    const existing = await prisma.order.findUnique({ where: { idempotencyKey } });
    if (existing) return { order: existing, replayed: true };

    // ── 2. The transaction ────────────────────────────────
    try {
        const order = await prisma.$transaction(async (tx) => {
            const product = await tx.product.findUnique({ where: { id: input.productId } });
            if (!product) throw new ApiError(404, "Product not found");
            if (product.stock < input.quantity) throw new ApiError(409, "Insufficient stock");

            // optimistic lock: update ONLY if version unchanged since my read
            const updated = await tx.product.updateMany({
                where: { id: product.id, version: product.version },
                data: { stock: { decrement: input.quantity }, version: { increment: 1 } },
            });
            if (updated.count === 0) {
                throw new ApiError(409, "Product was just purchased by someone else");
            }

            // create order + item (unitPrice snapshot = DB price NOW)
            return tx.order.create({
                data: {
                    userId,
                    totalCents: product.priceCents * input.quantity,
                    idempotencyKey,
                    items: {
                        create: {
                            productId: product.id,
                            quantity: input.quantity,
                            unitPriceCents: product.priceCents,
                        },
                    },
                },
                include: { items: true },
            });
        });

        return { order, replayed: false };
    } catch (error) {
        // race on the unique key itself (two retries at same ms): treat as replay
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            const replay = await prisma.order.findUnique({ where: { idempotencyKey } });
            if (replay) return { order: replay, replayed: true };
        }
        throw error; // ApiErrors pass through honestly
    }
};

const getMyOrdersService = async (userId: string, page: number, limit: number) => {
    const skip = (page - 1) * limit;
    const where = { userId };
    const [orders, total] = await prisma.$transaction([
        prisma.order.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit, include: { items: true } }),
        prisma.order.count({ where }),
    ]);
    return { data: orders, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export { createOrderService, getMyOrdersService };