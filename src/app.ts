import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import { prisma } from "./shared/prisma.js";
import { redis } from "./shared/redis.js";
import { logger } from "./shared/logger.js";
import { authRouter } from './modules/auth/router.js';
import { errorHandler } from './shared/errorHandler.js';
import { productRouter } from './modules/products/router.js';

dotenv.config();

const app = express();

app.set('trust proxy', 1);
app.use(cors({ origin: true, credentials: true }));
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(pinoHttp({ logger }));


app.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

app.get('/ready', async (_req, res) => {
    try {
        await Promise.all([prisma.$queryRaw`SELECT 1`, redis.ping()]);
        res.json({ status: 'ready' });
    } catch {
        res.status(503).json({ status: 'degraded' });
    }
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/products", productRouter);
app.use(errorHandler)
export default app;