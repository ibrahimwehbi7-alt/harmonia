import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrganizationRole,
  Prisma,
  UserRole,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { AddEventContactDto } from './dto/add-event-contact.dto';
import { CreateEventDto } from './dto/create-event.dto';
import { EventQueryDto } from './dto/event-query.dto';
import { UpdateEventContactDto } from './dto/update-event-contact.dto';
import { UpdateEventDto } from './dto/update-event.dto';

type AuthenticatedUser = {
  userId: string;
  email: string;
  role: UserRole;
};

const eventInclude = {
  organization: true,
  project: true,
  createdBy: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
  contacts: {
    include: {
      contact: {
        include: {
          externalOrganization: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc' as const,
    },
  },
};

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEventDto, user: AuthenticatedUser) {
    await this.assertCanManage(dto.organizationId, user);
    await this.assertProject(dto.projectId, dto.organizationId);

    const startAt = new Date(dto.startAt);
    const endAt = dto.endAt ? new Date(dto.endAt) : undefined;

    this.assertDateRange(startAt, endAt);

    return this.prisma.event.create({
      data: {
        title: dto.title.trim(),
        description: dto.description,
        type: dto.type,
        status: dto.status,
        startAt,
        endAt,
        timezone: dto.timezone,
        location: dto.location,
        virtualUrl: dto.virtualUrl,
        capacity: dto.capacity,
        isPublic: dto.isPublic,
        registrationUrl: dto.registrationUrl,
        notes: dto.notes,
        tags: dto.tags?.map((tag) => tag.trim()).filter(Boolean) ?? [],
        organizationId: dto.organizationId,
        projectId: dto.projectId,
        createdById: user.userId,
      },
      include: eventInclude,
    });
  }

  async findAll(query: EventQueryDto, user: AuthenticatedUser) {
    const allowedOrganizationIds =
      await this.allowedOrganizationIds(user);

    if (
      query.organizationId &&
      !this.isGlobalAdmin(user) &&
      !allowedOrganizationIds.includes(query.organizationId)
    ) {
      throw new ForbiddenException(
        'You cannot access this organization',
      );
    }

    const where: Prisma.EventWhereInput = {
      organizationId:
        query.organizationId ??
        (this.isGlobalAdmin(user)
          ? undefined
          : { in: allowedOrganizationIds }),
      projectId: query.projectId,
      status: query.status,
      type: query.type,
      startAt: {
        gte: query.from ? new Date(query.from) : undefined,
        lte: query.to ? new Date(query.to) : undefined,
      },
      ...(query.search
        ? {
            OR: [
              {
                title: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                description: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                location: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                tags: {
                  has: query.search,
                },
              },
            ],
          }
        : {}),
    };

    const skip = (query.page - 1) * query.limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.event.findMany({
        where,
        include: eventInclude,
        orderBy: {
          startAt: 'asc',
        },
        skip,
        take: query.limit,
      }),
      this.prisma.event.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
    };
  }

  async findUpcoming(
    organizationId: string,
    limit: number,
    user: AuthenticatedUser,
  ) {
    if (!organizationId) {
      throw new BadRequestException(
        'organizationId is required',
      );
    }

    await this.assertMember(organizationId, user);

    const safeLimit = Number.isFinite(limit)
      ? Math.min(Math.max(Math.trunc(limit), 1), 50)
      : 10;

    return this.prisma.event.findMany({
      where: {
        organizationId,
        startAt: {
          gte: new Date(),
        },
        status: {
          notIn: ['CANCELLED', 'COMPLETED'],
        },
      },
      include: eventInclude,
      orderBy: {
        startAt: 'asc',
      },
      take: safeLimit,
    });
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: eventInclude,
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    await this.assertMember(event.organizationId, user);

    return event;
  }

  async update(
    id: string,
    dto: UpdateEventDto,
    user: AuthenticatedUser,
  ) {
    const current = await this.findOne(id, user);
    const organizationId =
      dto.organizationId ?? current.organizationId;

    await this.assertCanManage(organizationId, user);
    await this.assertProject(dto.projectId, organizationId);

    const startAt = dto.startAt
      ? new Date(dto.startAt)
      : current.startAt;

    const endAt =
      dto.endAt === undefined
        ? current.endAt ?? undefined
        : new Date(dto.endAt);

    this.assertDateRange(startAt, endAt);

    return this.prisma.event.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        description: dto.description,
        type: dto.type,
        status: dto.status,
        startAt: dto.startAt ? startAt : undefined,
        endAt:
          dto.endAt === undefined
            ? undefined
            : endAt,
        timezone: dto.timezone,
        location: dto.location,
        virtualUrl: dto.virtualUrl,
        capacity: dto.capacity,
        isPublic: dto.isPublic,
        registrationUrl: dto.registrationUrl,
        notes: dto.notes,
        tags: dto.tags?.map((tag) => tag.trim()).filter(Boolean),
        organizationId: dto.organizationId,
        projectId: dto.projectId,
      },
      include: eventInclude,
    });
  }

  async remove(id: string, user: AuthenticatedUser) {
    const event = await this.findOne(id, user);
    await this.assertCanManage(event.organizationId, user);

    return this.prisma.event.delete({
      where: { id },
    });
  }

  async addContact(
    eventId: string,
    dto: AddEventContactDto,
    user: AuthenticatedUser,
  ) {
    const event = await this.findOne(eventId, user);
    await this.assertCanManage(event.organizationId, user);

    const contact = await this.prisma.contact.findUnique({
      where: {
        id: dto.contactId,
      },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    if (contact.organizationId !== event.organizationId) {
      throw new BadRequestException(
        'Event and contact must belong to the same organization',
      );
    }

    try {
      return await this.prisma.eventContact.create({
        data: {
          eventId,
          contactId: dto.contactId,
          status: dto.status,
          role: dto.role,
          notes: dto.notes,
        },
        include: {
          contact: {
            include: {
              externalOrganization: true,
            },
          },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          'This contact is already linked to the event',
        );
      }

      throw error;
    }
  }

  async updateContact(
    eventId: string,
    contactId: string,
    dto: UpdateEventContactDto,
    user: AuthenticatedUser,
  ) {
    const event = await this.findOne(eventId, user);
    await this.assertCanManage(event.organizationId, user);

    const link = await this.prisma.eventContact.findUnique({
      where: {
        eventId_contactId: {
          eventId,
          contactId,
        },
      },
    });

    if (!link) {
      throw new NotFoundException(
        'Event contact link not found',
      );
    }

    return this.prisma.eventContact.update({
      where: {
        eventId_contactId: {
          eventId,
          contactId,
        },
      },
      data: dto,
      include: {
        contact: {
          include: {
            externalOrganization: true,
          },
        },
      },
    });
  }

  async removeContact(
    eventId: string,
    contactId: string,
    user: AuthenticatedUser,
  ) {
    const event = await this.findOne(eventId, user);
    await this.assertCanManage(event.organizationId, user);

    const link = await this.prisma.eventContact.findUnique({
      where: {
        eventId_contactId: {
          eventId,
          contactId,
        },
      },
    });

    if (!link) {
      throw new NotFoundException(
        'Event contact link not found',
      );
    }

    return this.prisma.eventContact.delete({
      where: {
        eventId_contactId: {
          eventId,
          contactId,
        },
      },
    });
  }

  private assertDateRange(
    startAt: Date,
    endAt?: Date,
  ): void {
    if (
      Number.isNaN(startAt.getTime()) ||
      (endAt && Number.isNaN(endAt.getTime()))
    ) {
      throw new BadRequestException(
        'Event dates are invalid',
      );
    }

    if (endAt && endAt < startAt) {
      throw new BadRequestException(
        'Event end date cannot be before its start date',
      );
    }
  }

  private isGlobalAdmin(user: AuthenticatedUser): boolean {
    return (
      user.role === UserRole.ADMIN ||
      user.role === UserRole.SUPER_ADMIN
    );
  }

  private async allowedOrganizationIds(
    user: AuthenticatedUser,
  ): Promise<string[]> {
    if (this.isGlobalAdmin(user)) {
      return [];
    }

    const memberships =
      await this.prisma.organizationMember.findMany({
        where: {
          userId: user.userId,
        },
        select: {
          organizationId: true,
        },
      });

    return memberships.map(
      (membership) => membership.organizationId,
    );
  }

  private async assertMember(
    organizationId: string,
    user: AuthenticatedUser,
  ): Promise<void> {
    const organization =
      await this.prisma.organization.findUnique({
        where: {
          id: organizationId,
        },
      });

    if (!organization) {
      throw new NotFoundException(
        'Organization not found',
      );
    }

    if (this.isGlobalAdmin(user)) {
      return;
    }

    const membership =
      await this.prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: user.userId,
            organizationId,
          },
        },
      });

    if (!membership) {
      throw new ForbiddenException(
        'You are not a member of this organization',
      );
    }
  }

  private async assertCanManage(
    organizationId: string,
    user: AuthenticatedUser,
  ): Promise<void> {
    await this.assertMember(organizationId, user);

    if (this.isGlobalAdmin(user)) {
      return;
    }

    const membership =
      await this.prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: user.userId,
            organizationId,
          },
        },
      });

    if (
      membership?.role !== OrganizationRole.OWNER &&
      membership?.role !== OrganizationRole.ADMIN &&
      membership?.role !== OrganizationRole.MODERATOR
    ) {
      throw new ForbiddenException(
        'You do not have permission to manage events',
      );
    }
  }

  private async assertProject(
    projectId: string | undefined,
    organizationId: string,
  ): Promise<void> {
    if (!projectId) {
      return;
    }

    const project = await this.prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.organizationId !== organizationId) {
      throw new BadRequestException(
        'Project and event must belong to the same organization',
      );
    }
  }
}
