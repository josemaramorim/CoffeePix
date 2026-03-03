import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async findByClient(clientId: string) {
    return this.prisma.paymentConfig.findUnique({ where: { client_id: clientId } });
  }

  async create(data: { client_id: string; gateway_provider: string; encrypted_credentials: string; pix_key: string }) {
    return this.prisma.paymentConfig.create({ data });
  }

  async update(clientId: string, data: Partial<{ encrypted_credentials: string; pix_key: string }>) {
    const existing = await this.findByClient(clientId);
    if (!existing) throw new NotFoundException('PaymentConfig not found');
    return this.prisma.paymentConfig.update({ where: { client_id: clientId }, data });
  }
}
