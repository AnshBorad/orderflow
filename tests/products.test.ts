import app from "../src/app.js";
import request from "supertest";
import { prisma } from "../src/shared/prisma.js";
import { redis } from "../src/shared/redis.js";

describe("Products", () => {

    let accessToken: string;
    let customerAccessToken: string;
    let productId: string[] = [];
    const createProduct = {
        name: "Product 1",
        priceCents: 100,
        description: "Product 1 description",
        stock: 10,
    }


    beforeAll(async () => {
        const login = await request(app).post("/api/v1/auth/login")
            .send({ email: "admin@orderflow.dev", password: "Password123!" });
        accessToken = login.body.data.accessToken;
        const customerLogin = await request(app).post("/api/v1/auth/login")
            .send({ email: "customer@orderflow.dev", password: "Password123!" });
        customerAccessToken = customerLogin.body.data.accessToken;
        await prisma.$connect();
    });
    afterAll(async () => {
        if (productId.length > 0) {
            await prisma.product.deleteMany({ where: { id: { in: productId } } }).catch(() => { });
        }
        await prisma.$disconnect();
        await redis.quit();
    });
    it("should get all products", async () => {
        const res = await request(app).get("/api/v1/products");
        expect(res.statusCode).toBe(200);
    });
    it("should get product by id", async () => {
        const res = await request(app).post("/api/v1/products").send(createProduct).set("Authorization", `Bearer ${accessToken}`);
        productId.push(res.body.data.id);
        const id = res.body.data.id;
        const res2 = await request(app).get(`/api/v1/products/${id}`);
        expect(res2.statusCode).toBe(200);
    });
    it("should not get product by invalid id", async () => {
        const res = await request(app).get("/api/v1/products/invalid");
        expect(res.statusCode).toBe(404);
    });
    it("should create product", async () => {
        const res = await request(app).post("/api/v1/products").send({
            name: "Product 1",
            priceCents: 100,
            description: "Product 1 description",
            stock: 10,
        }).set("Authorization", `Bearer ${accessToken}`);
        expect(res.statusCode).toBe(201);
    });
    it("should not create product without access token", async () => {
        const res = await request(app).post("/api/v1/products").send({
            name: "Product 1",
            priceCents: 100,
            description: "Product 1 description",
            stock: 10,
        });
        expect(res.statusCode).toBe(401);
    });
    it("should not create product as customer (RBAC)", async () => {
        const res = await request(app).post("/api/v1/products").send({
            name: "Product 1",
            priceCents: 100,
            description: "Product 1 description",
            stock: 10,
        }).set("Authorization", `Bearer ${customerAccessToken}`);
        expect(res.statusCode).toBe(403);
    });
})