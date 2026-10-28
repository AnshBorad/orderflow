import app from "../src/app.js";
import request from "supertest";
import { prisma } from "../src/shared/prisma.js";
import { redis } from "../src/shared/redis.js";
import { config } from "../src/shared/config.js";
import crypto from "crypto";


//3 scenarios (valid/forged/duplicate)

describe("Payments", () => {
    let adminToken: string;
    let customerToken: string;
    let orderId: string;
    let razorpayOrderId: string;
    const webhookSecret = config.RAZORPAY_WEBHOOK_SECRET;
    beforeAll(async () => {
        const adminLogin = await request(app).post("/api/v1/auth/login")
            .send({ email: "admin@orderflow.dev", password: "Password123!" });
        adminToken = adminLogin.body.data.accessToken;
        const customerLogin = await request(app).post("/api/v1/auth/login")
            .send({ email: "customer@orderflow.dev", password: "Password123!" });
        customerToken = customerLogin.body.data.accessToken;

        // create order (stock 2 so other tests don't break it) + initiate payment
        const created = await request(app).post("/api/v1/products")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ name: `wh-test-${Date.now()}`, priceCents: 50000, description: "webhook test product", stock: 2 });
        const productId = created.body.data.id;

        const order = await request(app).post("/api/v1/orders")
            .set("Authorization", `Bearer ${customerToken}`)
            .set("Idempotency-Key", `wh-${Date.now()}`)
            .send({ productId, quantity: 1 });
        orderId = order.body.data.id;

        const payment = await request(app).post("/api/v1/payments/create")
            .set("Authorization", `Bearer ${customerToken}`)
            .send({ orderId });
        razorpayOrderId = payment.body.data.razorpayOrderId;   // the order_... from Razorpay

    });
    afterAll(async () => {
        await prisma.payment.deleteMany({ where: { orderId } });
        await prisma.order.deleteMany({ where: { id: orderId } });
        await prisma.$disconnect();
        await redis.quit();
    });

    function buildWebhook(eventId: string) {
        const payload = JSON.stringify({
            event: "payment.captured",
            payload: {
                payment: {
                    entity: {
                        id: "pay_TEST_" + crypto.randomUUID().slice(0, 8),
                        order_id: razorpayOrderId,
                        amount: 50000,                        // must match order totalCents
                        status: "captured",
                    }
                }
            },
        });
        const signature = crypto.createHmac("sha256", webhookSecret).update(payload).digest("hex");
        return { payload, signature, eventId };
    }

    it("should process a valid signed webhook and mark order PAID", async () => {
        const { payload, signature, eventId } = buildWebhook(`evt-${Date.now()}-1`);
        const res = await request(app).post("/api/v1/payments/webhook")
            .set("Content-Type", "application/json")
            .set("X-Razorpay-Signature", signature)
            .set("X-Razorpay-Event-Id", eventId)    
            .send(payload);                            // raw string body → express.raw keeps it

        expect(res.statusCode).toBe(200);

        // the REAL assertions — state changed in DB:
        const payment = await prisma.payment.findUnique({ where: { orderId } });
        expect(payment?.status).toBe("CAPTURED");       
        expect(payment?.providerPaymentId).toContain("pay_TEST_");
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        expect(order?.status).toBe("PAID");
    });

    it("should reject a forged signature", async () => {
        const { payload } = buildWebhook(`evt-${Date.now()}-2`);
        const badSignature = crypto.createHmac("sha256", "attacker_secret").update(payload).digest("hex");

        const res = await request(app).post("/api/v1/payments/webhook")
            .set("Content-Type", "application/json")
            .set("X-Razorpay-Signature", badSignature)
            .send(payload);

        expect(res.statusCode).toBe(400);
    });

    it("should ignore duplicate event id (dedup)", async () => {
        const { payload, signature, eventId } = buildWebhook("evt-dup-fixed-id");  // SAME id sent twice

        const first = await request(app).post("/api/v1/payments/webhook")
            .set("Content-Type", "application/json")
            .set("X-Razorpay-Signature", signature)
            .set("X-Razorpay-Event-Id", eventId)
            .send(payload);
        expect(first.statusCode).toBe(200);

        const second = await request(app).post("/api/v1/payments/webhook")
            .set("Content-Type", "application/json")
            .set("X-Razorpay-Signature", signature)
            .set("X-Razorpay-Event-Id", eventId)       // ← same eventId again
            .send(payload);
        expect(second.statusCode).toBe(200);           // 200 = acknowledged, deduped
    });

    it("should still be PAID exactly once (no double processing)", async () => {
        const payments = await prisma.payment.findMany({ where: { orderId } });
        expect(payments).toHaveLength(1);
        expect(payments[0].status).toBe("CAPTURED");
    });


});
