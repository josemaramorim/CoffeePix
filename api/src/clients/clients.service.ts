import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: { name: string; company_id: string },
    userRole: string,
    userCompanyId: string,
  ) {
    if (userRole === 'COMPANY_ADMIN' && userCompanyId !== data.company_id) {
      throw new ForbiddenException(
        'You can only create clients for your own company',
      );
    }
    return this.prisma.client.create({
      data,
    });
  }

  async findAll(userRole: string, userCompanyId: string) {
    if (userRole === 'COMPANY_ADMIN') {
      return this.prisma.client.findMany({
        where: { company_id: userCompanyId },
      });
    }
    return this.prisma.client.findMany(); // SAAS_ADMIN vê tudo
  }

  async findOne(
    id: string,
    userRole: string,
    userCompanyId: string,
    userClientId: string,
  ) {
    const client = await this.prisma.client.findUnique({
      where: { id },
    });
    if (!client) throw new NotFoundException('Client not found');

    if (userRole === 'COMPANY_ADMIN' && client.company_id !== userCompanyId) {
      throw new ForbiddenException(
        'You can only access clients from your company',
      );
    }
    if (userRole === 'CLIENT_ADMIN' && client.id !== userClientId) {
      throw new ForbiddenException('You can only access your own client data');
    }

    return client;
  }

  async update(
    id: string,
    data: { name?: string },
    userRole: string,
    userCompanyId: string,
    userClientId: string,
  ) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) throw new NotFoundException('Client not found');

    if (userRole === 'COMPANY_ADMIN' && client.company_id !== userCompanyId) {
      throw new ForbiddenException(
        'You can only update clients from your company',
      );
    }
    if (userRole === 'CLIENT_ADMIN' && client.id !== userClientId) {
      throw new ForbiddenException('You can only update your own client data');
    }

    return this.prisma.client.update({
      where: { id },
      data,
    });
  }
}
