import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { prisma } from "./shared/prisma";
import { redis } from "./shared/redis";
import { logger } from "./shared/logger";

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
export default app;