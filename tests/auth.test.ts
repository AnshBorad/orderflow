import app from "../src/app.js";
import request from "supertest";
import { prisma } from "../src/shared/prisma.js";
import { redis } from "../src/shared/redis.js";

describe("Auth", () => {
    const testEmail = `test${Date.now()}@gmail.com`; // Unique email every run

    const testUser = {
        name: `TestUser${Date.now()}`,
        email: testEmail,
        password: 'Test@1234',
    };

    let accessToken: string;
    let refreshToken: string;

    const createdEmails: string[] = [];
    beforeAll(async () => {
        const res = await request(app).post("/api/v1/auth/login").send({
            email: `customer@orderflow.dev`,
            password: 'Password123!',
        });
        // console.log(res.body);

        accessToken = res.body.data.accessToken;
        refreshToken = res.body.data.refreshToken;
    });

    afterAll(async () => {
        if (createdEmails.length > 0) {
            await prisma.user.deleteMany({ where: { email: { in: createdEmails } } }).catch(() => { });
        }
        await prisma.$disconnect();
        await redis.quit();
    });
    it("should sign up", async () => {
        const res = await request(app).post("/api/v1/auth/register").send(testUser);
        expect(res.statusCode).toBe(201);
        createdEmails.push(testUser.email);
        expect(res.body.data.email).toBe(testUser.email);
    });
    it("should not sign up duplicate email", async () => {
        const res = await request(app).post("/api/v1/auth/register").send(testUser);
        expect(res.statusCode).toBe(409);
    });

    it("should not sign up with weak password", async () => {
        const res = await request(app).post("/api/v1/auth/register").send({
            name: `TestUser${Date.now()}`,
            email: `testWeakPassword${Date.now()}@gmail.com`,
            password: '123',
        });
        expect(res.statusCode).toBe(400);
    });

    it("should sign in", async () => {
        const res = await request(app).post("/api/v1/auth/login").send(testUser);
        expect(res.statusCode).toBe(200);
        expect(res.body.data.user.email).toBe(testUser.email);
    });

    it("should not sign in with wrong password", async () => {
        const res = await request(app).post("/api/v1/auth/login").send({
            email: testUser.email,
            password: '"WrongPass123',
        });
        expect(res.statusCode).toBe(401);
        // console.log(res);

    });

    it("should get current user", async () => {
        const res = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${accessToken}`);
        expect(res.statusCode).toBe(200);
    });

    it("should not get current user without token", async () => {
        const res = await request(app).get("/api/v1/auth/me");
        expect(res.statusCode).toBe(401);
    });

    it("should not get current user with invalid token", async () => {
        const res = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${accessToken}invalid`);
        expect(res.statusCode).toBe(401);
    });

    it("should deny customer access to user list", async () => {
        const res = await request(app).get("/api/v1/auth/users").set("Authorization", `Bearer ${accessToken}`);
        expect(res.statusCode).toBe(403);           // customer token
    });

    it("should allow admin to list users", async () => {
        const login = await request(app).post("/api/v1/auth/login")
            .send({ email: "admin@orderflow.dev", password: "Password123!" });
        const res = await request(app).get("/api/v1/auth/users")
            .set("Authorization", `Bearer ${login.body.data.accessToken}`);
        expect(res.statusCode).toBe(200);
    });
});