import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AttachmentsModule } from './attachments/attachments.module';
import { AuthModule } from './auth/auth.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { TaskCommentsModule } from './task-comments/task-comments.module';
import { TasksModule } from './tasks/tasks.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    OrganizationsModule,
    ProjectsModule,
    TasksModule,
    TaskCommentsModule,
    AttachmentsModule,
  ],
})
export class AppModule {}