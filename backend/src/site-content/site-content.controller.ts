import { Body, Controller, Get, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateSiteContentDto } from './dto/update-site-content.dto';
import { SiteContentService } from './site-content.service';

type Req = { user: { userId: string; email: string; role: UserRole } };

@Controller()
export class SiteContentController {
  constructor(private readonly service: SiteContentService) {}

  @Get('public/site/:slug')
  site(@Param('slug') slug: string) {
    return this.service.getPublicSite(slug);
  }

  @Get('public/site/:slug/events')
  events(@Param('slug') slug: string, @Query('limit') limit?: string) {
    return this.service.getPublicEvents(slug, Number(limit) || 12);
  }

  @UseGuards(JwtAuthGuard)
  @Get('site-content/:key')
  one(
    @Param('key') key: string,
    @Query('organizationId') org: string,
    @Request() req: Req,
  ) {
    return this.service.getOne(org, key, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Put('site-content/:key/draft')
  draft(
    @Param('key') key: string,
    @Query('organizationId') org: string,
    @Body() dto: UpdateSiteContentDto,
    @Request() req: Req,
  ) {
    return this.service.saveDraft(org, key, dto.data, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('site-content/:key/publish')
  publishDraft(
    @Param('key') key: string,
    @Query('organizationId') org: string,
    @Request() req: Req,
  ) {
    return this.service.publishDraft(org, key, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Put('site-content/:key')
  publishDirect(
    @Param('key') key: string,
    @Query('organizationId') org: string,
    @Body() dto: UpdateSiteContentDto,
    @Request() req: Req,
  ) {
    return this.service.publishDirect(org, key, dto.data, req.user);
  }
}
