import 'dotenv/config';
import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { mkdir } from 'node:fs/promises';
import pino from 'pino-http';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

async function bootstrap(): Promise<void> {
  await mkdir('uploads', {
    recursive: true,
  });

  const app = await NestFactory.create(AppModule, {
    logger: false,
  });

  app.use(
    pino({
      level: process.env.LOG_LEVEL ?? 'info',
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

const defaultOrigins = [
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'http://localhost:3000',
  'http://localhost:5173',
];

const environmentOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
  : [];

// Allow both local development and production domains.
const defaultOrigins = [
  "http://localhost:8000",
  "http://127.0.0.1:8000",
  "http://localhost:3000",
  "http://localhost:5173",
  "https://theharmoniaproject.org",
  "https://www.theharmoniaproject.org",
];

const environmentOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN
      .split(",")
      .map(origin => origin.trim())
      .filter(Boolean)
  : [];

const allowedOrigins = [
  ...new Set([
    ...defaultOrigins,
    ...environmentOrigins,
  ]),
];

app.enableCors({
  origin: (origin, callback) => {
    // Allow requests with no Origin (curl, Postman, mobile apps)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.error("Blocked by CORS:", origin);

    return callback(
      new Error(`Origin ${origin} is not allowed by CORS`),
      false
    );
  },
  credentials: true,
});

  const port = Number(process.env.PORT ?? 3000);

  await app.listen(port, '0.0.0.0');

  console.log(
    `Harmonia backend listening on port ${port}`,
  );
}

bootstrap().catch((error: unknown) => {
  console.error('Failed to start Harmonia backend:', error);
  process.exit(1);
});