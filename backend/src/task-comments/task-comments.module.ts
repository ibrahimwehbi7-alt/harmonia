import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TaskCommentsController } from './task-comments.controller';
import { TaskCommentsService } from './task-comments.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
  ],
  controllers: [TaskCommentsController],
  providers: [TaskCommentsService],
  exports: [TaskCommentsService],
})
export class TaskCommentsModule {}