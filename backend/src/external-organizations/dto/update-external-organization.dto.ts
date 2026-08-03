import { PartialType } from '@nestjs/mapped-types';
import { CreateExternalOrganizationDto } from './create-external-organization.dto';
export class UpdateExternalOrganizationDto extends PartialType(CreateExternalOrganizationDto) {}
