import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

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
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://theharmoniaproject.org',
    'https://www.theharmoniaproject.org',
  ];

  const environmentOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN
        .split(',')
        .map((origin: string) => origin.trim())
        .filter(Boolean)
    : [];

  const allowedOrigins = Array.from(
    new Set([
      ...defaultOrigins,
      ...environmentOrigins,
    ]),
  );

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (
        error: Error | null,
        allowed?: boolean,
      ) => void,
    ) => {
      // Allow curl, Postman, server-to-server requests,
      // and other requests without an Origin header.
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      console.warn(
        `Blocked CORS request from origin: ${origin}`,
      );

      callback(
        new Error(
          `Origin ${origin} is not allowed by CORS`,
        ),
        false,
      );
    },
    credentials: true,
    methods: [
      'GET',
      'HEAD',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS',
    ],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
    ],
  });

  const port = Number(process.env.PORT) || 3000;

  await app.listen(port, '0.0.0.0');

  console.log(
    `Harmonia backend is running on port ${port}`,
  );
}

bootstrap().catch((error: unknown) => {
  console.error(
    'Harmonia backend failed to start:',
    error,
  );

  process.exit(1);
});