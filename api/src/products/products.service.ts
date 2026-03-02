import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(data: { name: string; price: number; company_id: string }, userRole: string, userCompanyId: string) {
        if (userRole === 'COMPANY_ADMIN' && userCompanyId !== data.company_id) {
            throw new ForbiddenException('You can only create products for your own company');
        }

        return this.prisma.product.create({
            data,
        });
    }

    async findAll(userRole: string, userCompanyId: string, userClientId: string) {
        if (userRole === 'COMPANY_ADMIN') {
            return this.prisma.product.findMany({ where: { company_id: userCompanyId } });
        }
        // CLIENT_ADMIN só precisa ver os produtos da empresa a qual pertence
        if (userRole === 'CLIENT_ADMIN') {
            const client = await this.prisma.client.findUnique({ where: { id: userClientId } });
            if (client) {
                return this.prisma.product.findMany({ where: { company_id: client.company_id } });
            }
            return [];
        }
        return this.prisma.product.findMany(); // SAAS_ADMIN vê tudo
    }

    async findOne(id: string, userRole: string, userCompanyId: string, userClientId: string) {
        const product = await this.prisma.product.findUnique({
            where: { id },
        });
        if (!product) throw new NotFoundException('Product not found');

        if (userRole === 'COMPANY_ADMIN' && product.company_id !== userCompanyId) {
            throw new ForbiddenException('You can only access products from your company');
        }
        if (userRole === 'CLIENT_ADMIN') {
            const client = await this.prisma.client.findUnique({ where: { id: userClientId } });
            if (!client || product.company_id !== client.company_id) {
                throw new ForbiddenException('You can only access products from your company catalog');
            }
        }

        return product;
    }

    async update(id: string, data: { name?: string; price?: number }, userRole: string, userCompanyId: string) {
        const product = await this.prisma.product.findUnique({ where: { id } });
        if (!product) throw new NotFoundException('Product not found');

        if (userRole === 'COMPANY_ADMIN' && product.company_id !== userCompanyId) {
            throw new ForbiddenException('You can only update products from your company');
        }

        return this.prisma.product.update({
            where: { id },
            data,
        });
    }
}
