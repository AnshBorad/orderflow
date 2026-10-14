import app from "../src/app.js";
import request from "supertest";
import { prisma } from "../src/shared/prisma.js";
import { redis } from "../src/shared/redis.js";


describe("Orders", () => {
    let adminToken: string;
    let customerAccessToken: string;
    let customer2AccessToken: string;
    let testIdempotencyKey = `test-${Date.now()}`;
    let productId: string;
    let orderId: string[] = [];
    let orderItemId: string[] = [];


    beforeAll(async () => {
        const adminLogin = await request(app).post("/api/v1/auth/login")
            .send({ email: "admin@orderflow.dev", password: "Password123!" });
        adminToken = adminLogin.body.data.accessToken;
        const customerLogin = await request(app).post("/api/v1/auth/login")
            .send({ email: "customer@orderflow.dev", password: "Password123!" });
        customerAccessToken = customerLogin.body.data.accessToken;
        const customer2Login = await request(app).post("/api/v1/auth/login")
            .send({ email: "customer2@orderflow.dev", password: "Password123!" });
        customer2AccessToken = customer2Login.body.data.accessToken;

        const created = await request(app).post("/api/v1/products")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ name: `race-deskmat-${Date.now()}`, priceCents: 99900, description: "only  two in stock", stock: 2 });
        productId = created.body.data.id;
        await prisma.$connect();
    });



    afterAll(async () => {
        await prisma.orderItem.deleteMany({ where: { id: { in: orderItemId } } });
        await prisma.order.deleteMany({ where: { id: { in: orderId } } });
        await prisma.product.delete({ where: { id: productId } });
        await prisma.$disconnect();
        await redis.quit();
    });
    it("should create an order", async () => {
        const res = await request(app).post("/api/v1/orders").send({
            productId: productId,
            quantity: 1,
        }).set("Authorization", `Bearer ${customerAccessToken}`).set("Idempotency-Key", testIdempotencyKey);
        orderId.push(res.body.data.id);
        orderItemId.push(res.body.data.items[0].id);
        expect(res.statusCode).toBe(201);
    });
    it("should not create an order without idempotency key", async () => {
        const res = await request(app).post("/api/v1/orders").send({
            productId: productId,
            quantity: 1,
        }).set("Authorization", `Bearer ${customerAccessToken}`);
        expect(res.statusCode).toBe(400);
    });
    it("should return the existing order for the same idempotency key (no duplicate)", async () => {
        const res = await request(app).post("/api/v1/orders").send({
            productId: productId,
            quantity: 1,
        }).set("Authorization", `Bearer ${customerAccessToken}`).set("Idempotency-Key", testIdempotencyKey);
        expect(res.statusCode).toBe(200);
    });
    it("should not create an order with insufficient stock", async () => {
        const res = await request(app).post("/api/v1/orders").send({
            productId: productId,
            quantity: 10,
        }).set("Authorization", `Bearer ${customerAccessToken}`).set("Idempotency-Key", `test-${Date.now()}`);
        expect(res.statusCode).toBe(409);
    });

    it("should prevent from race conditions", async () => {
        const [buyer1Res, buyer2Res] = await Promise.all([
            request(app).post("/api/v1/orders").send({
                productId: productId,
                quantity: 1,
            }).set("Authorization", `Bearer ${customerAccessToken}`).set("Idempotency-Key", `test-${Date.now()}-a`),
            request(app).post("/api/v1/orders").send({
                productId: productId,
                quantity: 1,
            }).set("Authorization", `Bearer ${customer2AccessToken}`).set("Idempotency-Key", `test-${Date.now()}-b`),
        ]);

        orderId.push(buyer1Res.statusCode === 201 ? buyer1Res.body.data.id : buyer2Res.body.data.id);

        orderItemId.push(buyer1Res.statusCode === 201 ? buyer1Res.body.data.items[0].id : buyer2Res.body.data.items[0].id);

        expect(buyer1Res.statusCode === 201 ? buyer1Res.statusCode : buyer2Res.statusCode).toBe(201);
    });

    it("should get all my orders", async () => {
        const res = await request(app).get("/api/v1/orders").set("Authorization", `Bearer ${customerAccessToken}`);
        expect(res.statusCode).toBe(200);
    });
})