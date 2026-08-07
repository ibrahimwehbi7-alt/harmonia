export class CreateRegistrationDto { eventId!: string; name!: string; email!: string; guests?: number; source?: string; }
export class CreateStaffingDto { eventId!: string; userId!: string; role!: string; startsAt?: string; endsAt?: string; notes?: string; }
export class UpdateStaffingDto { status!: string; }
export class CreateRelationshipDto { organizationId!: string; contactId?: string; externalOrganizationId?: string; type!: string; title!: string; notes?: string; occurredAt?: string; followUpAt?: string; }
export class CreateCampaignDto { organizationId!: string; name!: string; subject?: string; body!: string; audienceType!: string; channel?: string; }
