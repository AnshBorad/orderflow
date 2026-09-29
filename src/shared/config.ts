import 'dotenv/config';
import { z } from 'zod';

// Fail FAST at startup if config is wrong — never mid-request
const envSchema = z.object({
    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url(),
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    JWT_ACCESS_SECRET: z.string().min(10),
    JWT_REFRESH_SECRET: z.string().min(10),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
    process.exit(1);
}

export const config = parsed.data;

