import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ExternalOrganizationsController } from './external-organizations.controller';
import { ExternalOrganizationsService } from './external-organizations.service';
@Module({ imports: [PrismaModule], controllers: [ExternalOrganizationsController], providers: [ExternalOrganizationsService] })
export class ExternalOrganizationsModule {}
