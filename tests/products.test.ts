import app from "../src/app.js";
import request from "supertest";
import { prisma } from "../src/shared/prisma.js";
import { redis } from "../src/shared/redis.js";

describe("Products", () => {

    let accessToken: string;
    let refreshToken: string;



    beforeAll(async () => {
        const login = await request(app).post("/api/v1/auth/login")
            .send({ email: "admin@orderflow.dev", password: "Password123!" });
        accessToken = login.body.data.accessToken;
        refreshToken = login.body.data.refreshToken;
        await prisma.$connect();
    });
    afterAll(async () => {
        await prisma.$disconnect();
        await redis.quit();
    });
    it("should get all products", async () => {
        const res = await request(app).get("/api/v1/products");
        expect(res.statusCode).toBe(200);
    });
    it("should get product by id", async () => {
        const res = await request(app).get("/api/v1/products/cmuuprs1m0000uj4kvhd7lhjs");
        expect(res.statusCode).toBe(200);
    });
    it("should not get product by invalid id", async () => {
        const res = await request(app).get("/api/v1/products/invalid");
        expect(res.statusCode).toBe(400);
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
    it("should not create product with invalid access token", async () => {
        const res = await request(app).post("/api/v1/products").send({
            name: "Product 1",
            priceCents: 100,
            description: "Product 1 description",
            stock: 10,
        }).set("Authorization", `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtdWwyZTdiYzAwMDF1anJna3ZvaG1uOGUiLCJlbWFpbCI6ImN1c3RvbWVyQG9yZGVyZmxvdy5kZXYiLCJuYW1lIjoiVGVzdCBDdXN0b21lciIsInJvbGUiOiJDVVNUT01FUiIsImlhdCI6MTc5MTE3Mzg4NCwiZXhwIjoxNzkxMTc0Nzg0fQ.b2034LBxEgAD056ldDHfFNVoPJLSBd_JYS75HjaG2Lw`);
        expect(res.statusCode).toBe(403);
    });
})