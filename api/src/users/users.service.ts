import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService implements OnModuleInit {
    constructor(private readonly prisma: PrismaService) { }

    async onModuleInit() {
        await this.seedAdmin();
    }

    async findByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email },
            include: { role: true },
        });
    }

    async findById(id: string) {
        return this.prisma.user.findUnique({
            where: { id },
            include: { role: true },
        });
    }

    private async seedAdmin() {
        // Garantir que as roles padrões existem
        const roles = ['SAAS_ADMIN', 'COMPANY_ADMIN', 'CLIENT_ADMIN'];
        for (const roleName of roles) {
            await this.prisma.role.upsert({
                where: { name: roleName },
                update: {},
                create: { name: roleName },
            });
        }

        // Criar o super admin do CoffeePix se não existir
        const __adminEmail = 'admin@coffeepix.com';
        const admin = await this.prisma.user.findUnique({ where: { email: __adminEmail } });

        if (!admin) {
            const role = await this.prisma.role.findUnique({ where: { name: 'SAAS_ADMIN' } });
            const passwordHash = await bcrypt.hash('SenhaForte123!', 10);

            if (role) {
                await this.prisma.user.create({
                    data: {
                        email: __adminEmail,
                        password_hash: passwordHash,
                        role_id: role.id,
                    },
                });
                console.log(`[UsersService] Admin default created: ${__adminEmail}`);
            }
        }
    }
}
