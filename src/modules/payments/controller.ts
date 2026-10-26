import z from "zod";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { createPaymentService } from "./service.js";
import crypto from "crypto";
import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../../shared/prisma.js";
import { config } from "../../shared/config.js";
import { logger } from "../../shared/logger.js";

const createPaymentController = asyncHandler(async (req, res) => {
    if (!req.user) throw new ApiError(401, "Unauthorized");
    const input = z.object({ orderId: z.string().min(1) }).parse(req.body);
    const result = await createPaymentService(req.user.id, input.orderId);
    res.status(201).json(new ApiResponse(201, result, "Payment initiated"));
});
const verifySignature = (rawBody: Buffer, received: string | undefined): boolean => {
    if (!received) return false;
    const expected = crypto
        .createHmac("sha256", config.RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest("hex");

    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(received, "utf8");
    if (a.length !== b.length) return false;        // timingSafeEqual throws on length mismatch
    return crypto.timingSafeEqual(a, b);            // constant-time compare — no timing leaks
};

// ── webhook endpoint ─────────────────────────────────────────
const webhookController = async (req: Request, res: Response) => {
    // ① SIGNATURE — the security gate. Fake webhook? Dead here.
    if (!verifySignature(req.body as Buffer, req.headers["x-razorpay-signature"] as string | undefined)) {
        logger.warn("Webhook rejected: invalid signature");
        return res.status(400).json({ status: "invalid signature" });
    }

    // ② parse AFTER verification — only bouncer-approved bytes get parsed
    const event = JSON.parse((req.body as Buffer).toString("utf8"));
    const eventId = req.headers["x-razorpay-event-id"] as string | undefined;

    if (event.event !== "payment.captured") {
        return res.status(200).json({ status: "ignored event" });   // acknowledge, don't process
    }

    // ③ DEDUP — insert first; P2002 = provider sent it again = already handled
    try {
        await prisma.webhookEvent.create({
            data: {
                provider: "razorpay",
                eventId: eventId ?? `evt-${crypto.randomUUID()}`,
                type: event.event,
                payload: event,
            },
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            logger.info("Duplicate webhook ignored");
            return res.status(200).json({ status: "duplicate ignored" });
        }
        throw error; // real DB problem → 500 → Razorpay retries later (correct behavior)
    }

    // ④ FIND + VALIDATE — our Payment row via their order_id
    const entity = event.payload.payment.entity;
    const payment = await prisma.payment.findUnique({ where: { providerOrderId: entity.order_id } });
    if (!payment) {
        logger.warn({ orderId: entity.order_id }, "Webhook for unknown razorpay order");
        return res.status(200).json({ status: "unknown order" });
    }
    if (payment.amountCents !== entity.amount) {
        logger.error({ expected: payment.amountCents, got: entity.amount }, "Webhook amount mismatch");
        return res.status(400).json({ status: "amount mismatch" });
    }
    if (payment.status === "CAPTURED") {
        return res.status(200).json({ status: "already captured" });   // state machine: no double-capture
    }

    // ⑤ MARK PAID — atomically
    await prisma.$transaction(async (tx) => {
        await tx.payment.update({
            where: { id: payment.id },
            data: { status: "CAPTURED", providerPaymentId: entity.id },   // ← the id is finally born
        });
        await tx.order.update({
            where: { id: payment.orderId },
            data: { status: "PAID" },
        });
    });

    logger.info({ paymentId: payment.id, providerPaymentId: entity.id }, "Payment captured, order PAID");
    return res.status(200).json({ status: "ok" });
};

export { createPaymentController ,webhookController};