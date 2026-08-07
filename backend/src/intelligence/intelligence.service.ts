import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type Actor = { userId: string; role: string };
@Injectable()
export class IntelligenceService {
  constructor(private readonly prisma: PrismaService) {}
  private assertAdmin(actor: Actor) { if (!['ADMIN','SUPER_ADMIN'].includes(actor.role)) throw new ForbiddenException('Administrator access required'); }
  private assertOwner(actor: Actor) { if (actor.role !== 'SUPER_ADMIN') throw new ForbiddenException('Owner access required'); }
  private requireOrg(id: string) { if (!id) throw new BadRequestException('organizationId is required'); return id; }
  async overview(actor: Actor, organizationId: string) {
    this.assertAdmin(actor); const org = this.requireOrg(organizationId);
    const [projects, tasks, events, contacts, members, metrics, checks] = await Promise.all([
      this.prisma.project.count({ where: { organizationId: org } }),
      this.prisma.task.count({ where: { project: { organizationId: org } } }),
      this.prisma.event.count({ where: { organizationId: org } }),
      this.prisma.contact.count({ where: { organizationId: org } }),
      this.prisma.organizationMember.count({ where: { organizationId: org } }),
      this.prisma.impactMetric.findMany({ where: { organizationId: org }, orderBy: { updatedAt: 'desc' }, take: 12 }),
      this.prisma.readinessCheck.findMany({ where: { organizationId: org }, select: { completed: true } }),
    ]);
    const readiness = checks.length ? Math.round((checks.filter(c=>c.completed).length / checks.length) * 100) : 0;
    return { counts: { projects, tasks, events, contacts, members }, readiness, metrics };
  }
  async search(actor: Actor, organizationId: string, q: string) {
    this.assertAdmin(actor); const org = this.requireOrg(organizationId); const term = q.trim(); if (term.length < 2) return [];
    const [projects, events, contacts, notes] = await Promise.all([
      this.prisma.project.findMany({ where: { organizationId: org, OR: [{ name: { contains: term, mode: 'insensitive' } }, { description: { contains: term, mode: 'insensitive' } }] }, select: { id:true, name:true, description:true }, take:10 }),
      this.prisma.event.findMany({ where: { organizationId: org, OR: [{ title: { contains: term, mode: 'insensitive' } }, { description: { contains: term, mode: 'insensitive' } }] }, select: { id:true, title:true, description:true }, take:10 }),
      this.prisma.contact.findMany({ where: { organizationId: org, OR: [{ firstName: { contains: term, mode: 'insensitive' } }, { lastName: { contains: term, mode: 'insensitive' } }, { email: { contains: term, mode: 'insensitive' } }] }, select: { id:true, firstName:true, lastName:true, email:true }, take:10 }),
      this.prisma.note.findMany({ where: { organizationId: org, OR: [{ title: { contains: term, mode: 'insensitive' } }, { content: { contains: term, mode: 'insensitive' } }] }, select: { id:true, title:true, content:true }, take:10 }),
    ]);
    return [
      ...projects.map(x=>({type:'PROJECT',id:x.id,title:x.name,detail:x.description||''})),
      ...events.map(x=>({type:'EVENT',id:x.id,title:x.title,detail:x.description||''})),
      ...contacts.map(x=>({type:'CONTACT',id:x.id,title:`${x.firstName} ${x.lastName}`,detail:x.email||''})),
      ...notes.map(x=>({type:'NOTE',id:x.id,title:x.title,detail:x.content.slice(0,160)})),
    ];
  }
  async listImpact(actor: Actor, organizationId: string) { this.assertAdmin(actor); return this.prisma.impactMetric.findMany({ where:{organizationId:this.requireOrg(organizationId)}, orderBy:{updatedAt:'desc'} }); }
  async createImpact(actor: Actor, organizationId: string, dto: any) { this.assertOwner(actor); const row=await this.prisma.impactMetric.create({data:{organizationId:this.requireOrg(organizationId),createdById:actor.userId,name:dto.name.trim(),category:(dto.category||'MISSION').trim(),value:dto.value,unit:(dto.unit||'count').trim(),target:dto.target,periodLabel:dto.periodLabel?.trim(),notes:dto.notes?.trim()}}); await this.log(actor,organizationId,'CREATE','ImpactMetric',row.id,`Created impact metric: ${row.name}`); return row; }
  async listReadiness(actor: Actor, organizationId: string, eventId = '') { this.assertAdmin(actor); return this.prisma.readinessCheck.findMany({ where:{organizationId:this.requireOrg(organizationId),...(eventId?{eventId}: {})}, orderBy:[{completed:'asc'},{dueAt:'asc'}] }); }
  async createReadiness(actor: Actor, organizationId: string, dto: any) { this.assertAdmin(actor); const row=await this.prisma.readinessCheck.create({data:{organizationId:this.requireOrg(organizationId),createdById:actor.userId,eventId:dto.eventId||null,label:dto.label.trim(),category:(dto.category||'GENERAL').trim(),ownerName:dto.ownerName?.trim(),dueAt:dto.dueAt?new Date(dto.dueAt):null}}); await this.log(actor,organizationId,'CREATE','ReadinessCheck',row.id,`Created readiness check: ${row.label}`); return row; }
  async updateReadiness(actor: Actor, id: string, completed: boolean) { this.assertAdmin(actor); const row=await this.prisma.readinessCheck.update({where:{id},data:{completed}}); await this.log(actor,row.organizationId,'UPDATE','ReadinessCheck',row.id,`${completed?'Completed':'Reopened'} readiness check: ${row.label}`); return row; }
  async audit(actor: Actor, organizationId: string) { this.assertOwner(actor); return this.prisma.auditEntry.findMany({ where:{organizationId:this.requireOrg(organizationId)}, include:{actor:{select:{firstName:true,lastName:true,email:true}}}, orderBy:{createdAt:'desc'}, take:200 }); }
  async plan(actor: Actor, prompt: string) { this.assertAdmin(actor); const clean=prompt.trim(); if (!clean) throw new BadRequestException('Prompt is required'); const title=clean.length>90?clean.slice(0,87)+'...':clean; return { title, summary:'Structured planning draft generated locally. Review before creating records.', project:{name:title,status:'PLANNING'}, suggestedWork:[{title:'Define objective and success measure',priority:'HIGH'},{title:'Identify owners and stakeholders',priority:'HIGH'},{title:'Create timeline and milestones',priority:'MEDIUM'},{title:'Prepare communications and public content',priority:'MEDIUM'},{title:'Review readiness and risks',priority:'HIGH'}], suggestedMetrics:['Participation','Completion rate','Partner engagement','Volunteer hours'] }; }
  private async log(actor: Actor, organizationId: string, action:string, entityType:string, entityId:string, summary:string) { await this.prisma.auditEntry.create({data:{organizationId,actorId:actor.userId,action,entityType,entityId,summary}}); }
}
