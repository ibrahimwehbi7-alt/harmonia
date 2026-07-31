import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import pino from 'pino-http';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: false });

  // Structured request logging
  app.use(pino({ level: process.env.LOG_LEVEL || 'info' }));

  // Global error handling
  app.useGlobalFilters(new AllExceptionsFilter());

  // Validation pipe for incoming requests
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = process.env.PORT || 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://0.0.0.0:${port}`);
}

bootstrap();
