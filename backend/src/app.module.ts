import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AttachmentsModule } from './attachments/attachments.module';
import { AuthModule } from './auth/auth.module';
import { ContactsModule } from './contacts/contacts.module';
import { EventsModule } from './events/events.module';
import { ExternalOrganizationsModule } from './external-organizations/external-organizations.module';
import { FilesModule } from './files/files.module';
import { HealthController } from './health.controller';
import { NotesModule } from './notes/notes.module';
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
    ContactsModule,
    ExternalOrganizationsModule,
    EventsModule,
    NotesModule,
    FilesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
