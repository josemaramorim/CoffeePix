import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { CompaniesModule } from './companies/companies.module';
import { ClientsModule } from './clients/clients.module';
import { MachinesModule } from './machines/machines.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [AuthModule, UsersModule, PrismaModule, CompaniesModule, ClientsModule, MachinesModule, ProductsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
