import Razorpay from "razorpay";
import { prisma } from "../../shared/prisma.js"
import { config } from "../../shared/config.js";
import { ApiError } from "../../utils/ApiError.js";
import { Prisma } from "@prisma/client";

const razorpay = new Razorpay({
    key_id: config.RAZORPAY_KEY_ID,
    key_secret: config.RAZORPAY_KEY_SECRET,
});

async function createPaymentService(userId: string, orderId: string,) {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            payment: true,
        }
    });

    if (!order || order.userId !== userId) throw new ApiError(400, "Invalid request");
    if (order.status !== "PENDING_PAYMENT") throw new ApiError(409, `Order is ${order.status}, not payable`);
    if (order.payment) {
        return {
            paymentId: order.payment.id,
            razorpayOrderId: order.payment.providerOrderId,
            amount: order.payment.amountCents,
            keyId: config.RAZORPAY_KEY_ID,
        }
    };

    const rzpOrder = await razorpay.orders.create({
        amount: order.totalCents,
        currency: "INR",
        receipt: orderId,
    })

    try {
        const payment = await prisma.payment.create({
            data: {
                orderId: orderId,
                providerOrderId: rzpOrder.id,
                amountCents: order.totalCents,
            },
        });
        return {
            paymentId: payment.id,
            razorpayOrderId: rzpOrder.id,
            amount: order.totalCents,
            keyId: config.RAZORPAY_KEY_ID,
        };
    } catch (err: any) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err?.code === "P2002") {
            // concurrent request won the race — replay THEIR payment
            const winner = await prisma.payment.findUniqueOrThrow({ where: { orderId } });
            return {
                paymentId: winner.id,
                razorpayOrderId: winner.providerOrderId,
                amount: winner.amountCents,
                keyId: config.RAZORPAY_KEY_ID,
            };
        }
        throw err;
    }

}


export { createPaymentService };

