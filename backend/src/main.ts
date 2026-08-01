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

  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    : ['http://localhost:3000', 'http://localhost:5173'];

  app.enableCors({
    origin: allowedOrigins,
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