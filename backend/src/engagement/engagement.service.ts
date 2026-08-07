import { ForbiddenException, Injectable } from '@nestjs/common'; import { PrismaService } from '../prisma/prisma.service';
@Injectable() export class EngagementService { constructor(private prisma:PrismaService){} private admin(u:any){if(!['ADMIN','SUPER_ADMIN'].includes(u.role)) throw new ForbiddenException();}
register(dto:any,u:any){return this.prisma.eventRegistration.create({data:{...dto,userId:u?.userId||null,guests:Number(dto.guests||0)}})}
listRegistrations(eventId:string,u:any){this.admin(u);return this.prisma.eventRegistration.findMany({where:{eventId},orderBy:{createdAt:'desc'}})}
checkIn(id:string,u:any){this.admin(u);return this.prisma.eventRegistration.update({where:{id},data:{status:'ATTENDED',checkedInAt:new Date()}})}
createStaffing(dto:any,u:any){this.admin(u);return this.prisma.eventStaffing.create({data:{...dto,startsAt:dto.startsAt?new Date(dto.startsAt):null,endsAt:dto.endsAt?new Date(dto.endsAt):null}})}
myStaffing(u:any){return this.prisma.eventStaffing.findMany({where:{userId:u.userId},include:{event:true},orderBy:{createdAt:'desc'}})}
respondStaffing(id:string,status:string,u:any){return this.prisma.eventStaffing.updateMany({where:{id,userId:u.userId},data:{status}})}
relationships(orgId:string,u:any){this.admin(u);return this.prisma.relationshipRecord.findMany({where:{organizationId:orgId},include:{contact:true,externalOrganization:true},orderBy:{occurredAt:'desc'}})}
createRelationship(dto:any,u:any){this.admin(u);return this.prisma.relationshipRecord.create({data:{...dto,createdById:u.userId,occurredAt:dto.occurredAt?new Date(dto.occurredAt):new Date(),followUpAt:dto.followUpAt?new Date(dto.followUpAt):null}})}
campaigns(orgId:string,u:any){this.admin(u);return this.prisma.communicationCampaign.findMany({where:{organizationId:orgId},orderBy:{createdAt:'desc'}})}
createCampaign(dto:any,u:any){this.admin(u);return this.prisma.communicationCampaign.create({data:{...dto,createdById:u.userId,status:'DRAFT'}})} }
