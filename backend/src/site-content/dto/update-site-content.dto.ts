import { IsObject } from 'class-validator';
export class UpdateSiteContentDto { @IsObject() data!: Record<string, unknown>; }
