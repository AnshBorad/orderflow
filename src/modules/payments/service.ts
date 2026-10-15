import Razorpay from "razorpay";
import { prisma } from "../../shared/prisma.js"
import { config } from "../../shared/config.js";
import { ApiError } from "../../utils/ApiError.js";

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

    if (!order || order.userId !== userId) throw new ApiError(404, "Order not found");
    if (order.payment) throw new ApiError(409, "Payment already initiated");
    if (order.status !== "PENDING_PAYMENT") throw new ApiError(409, `Order is ${order.status}, not payable`);

    const rzpOrder = await razorpay.orders.create({
        amount: order.totalCents,
        currency: "INR",
        receipt: orderId,
    })

    const payment = await prisma.payment.create({
        data: {
            orderId: orderId,
            providerOrderId: rzpOrder.id,
            amountCents: order.totalCents


        }
    })
    return {
        paymentId: payment.id,
        razorpayOrderId: rzpOrder.id,
        amount: order.totalCents,
        keyId: config.RAZORPAY_KEY_ID,
    };

}


export { createPaymentService };

