import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class MachinesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: {
      serial_number: string;
      model?: string;
      client_id: string;
      company_id: string;
    },
    userRole: string,
    userCompanyId: string,
  ) {
    if (userRole === 'COMPANY_ADMIN' && userCompanyId !== data.company_id) {
      throw new ForbiddenException(
        'You can only create machines for your own company',
      );
    }

    // Gerar um hmac_secret seguro para a máquina
    const hmacSecret = crypto.randomBytes(32).toString('hex');

    return this.prisma.machine.create({
      data: {
        ...data,
        hmac_secret: hmacSecret,
      },
    });
  }

  async findAll(userRole: string, userCompanyId: string, userClientId: string) {
    if (userRole === 'COMPANY_ADMIN') {
      return this.prisma.machine.findMany({
        where: { company_id: userCompanyId },
      });
    }
    if (userRole === 'CLIENT_ADMIN') {
      return this.prisma.machine.findMany({
        where: { client_id: userClientId },
      });
    }
    return this.prisma.machine.findMany(); // SAAS_ADMIN vê tudo
  }

  async findOne(
    id: string,
    userRole: string,
    userCompanyId: string,
    userClientId: string,
  ) {
    const machine = await this.prisma.machine.findUnique({
      where: { id },
    });
    if (!machine) throw new NotFoundException('Machine not found');

    if (userRole === 'COMPANY_ADMIN' && machine.company_id !== userCompanyId) {
      throw new ForbiddenException(
        'You can only access machines from your company',
      );
    }
    if (userRole === 'CLIENT_ADMIN' && machine.client_id !== userClientId) {
      throw new ForbiddenException('You can only access your own machine data');
    }

    return machine;
  }

  async update(
    id: string,
    data: { status?: string; client_id?: string },
    userRole: string,
    userCompanyId: string,
  ) {
    const machine = await this.prisma.machine.findUnique({ where: { id } });
    if (!machine) throw new NotFoundException('Machine not found');

    if (userRole === 'COMPANY_ADMIN' && machine.company_id !== userCompanyId) {
      throw new ForbiddenException(
        'You can only update machines from your company',
      );
    }
    // CLIENT_ADMIN não pode atualizar máquinas (não tem permissão técnica)
    if (userRole === 'CLIENT_ADMIN') {
      throw new ForbiddenException(
        'CLIENT_ADMIN cannot modify machine details',
      );
    }

    return this.prisma.machine.update({
      where: { id },
      data,
    });
  }

  // Machine request inspection methods
  async getMachineRequests(id: string, limit = 50) {
    return this.prisma.machineRequest.findMany({
      where: { machine_id: id },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  }

  async getMachineRequest(id: string, reqId: string) {
    return this.prisma.machineRequest.findUnique({ where: { id: reqId } });
  }
}
