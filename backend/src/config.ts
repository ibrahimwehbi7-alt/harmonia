import * as dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().optional().default(''),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.preprocess((val) => Number(val), z.number().int().positive().default(3000)),
  LOG_LEVEL: z.string().default('info'),
}).passthrough();

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // Do not crash in non-production environments; surface a warning instead.
  // In production, this should be treated as fatal by deployment.
  // eslint-disable-next-line no-console
  console.warn('Environment validation warning:', parsed.error.format());
}

const value = parsed.success ? parsed.data : {
  DATABASE_URL: '',
  NODE_ENV: 'development',
  PORT: 3000,
  LOG_LEVEL: 'info',
};

export default {
  databaseUrl: value.DATABASE_URL || process.env.DATABASE_URL || '',
  nodeEnv: value.NODE_ENV,
  port: value.PORT,
  logLevel: value.LOG_LEVEL,
};
