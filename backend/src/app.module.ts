import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';

@Module({
  imports: [
    PrismaModule,
    ProjectsModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
