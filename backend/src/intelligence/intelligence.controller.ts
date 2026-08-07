import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateImpactMetricDto, CreateReadinessCheckDto, PlanPromptDto, UpdateReadinessCheckDto } from './dto/intelligence.dto';
import { IntelligenceService } from './intelligence.service';

type Req = { user: { userId: string; email: string; role: string } };
@Controller('intelligence')
@UseGuards(JwtAuthGuard)
export class IntelligenceController {
  constructor(private readonly service: IntelligenceService) {}
  @Get('overview') overview(@Request() req: Req, @Query('organizationId') organizationId = '') { return this.service.overview(req.user, organizationId); }
  @Get('search') search(@Request() req: Req, @Query('organizationId') organizationId = '', @Query('q') q = '') { return this.service.search(req.user, organizationId, q); }
  @Get('impact') impact(@Request() req: Req, @Query('organizationId') organizationId = '') { return this.service.listImpact(req.user, organizationId); }
  @Post('impact') createImpact(@Request() req: Req, @Query('organizationId') organizationId: string, @Body() dto: CreateImpactMetricDto) { return this.service.createImpact(req.user, organizationId, dto); }
  @Get('readiness') readiness(@Request() req: Req, @Query('organizationId') organizationId = '', @Query('eventId') eventId = '') { return this.service.listReadiness(req.user, organizationId, eventId); }
  @Post('readiness') createReadiness(@Request() req: Req, @Query('organizationId') organizationId: string, @Body() dto: CreateReadinessCheckDto) { return this.service.createReadiness(req.user, organizationId, dto); }
  @Patch('readiness/:id') updateReadiness(@Request() req: Req, @Param('id') id: string, @Body() dto: UpdateReadinessCheckDto) { return this.service.updateReadiness(req.user, id, dto.completed); }
  @Get('audit') audit(@Request() req: Req, @Query('organizationId') organizationId = '') { return this.service.audit(req.user, organizationId); }
  @Post('plan') plan(@Request() req: Req, @Body() dto: PlanPromptDto) { return this.service.plan(req.user, dto.prompt); }
}
