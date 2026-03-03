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
import { I18nModule, AcceptLanguageResolver, QueryResolver, HeaderResolver } from 'nestjs-i18n';
import * as path from 'path';
import * as fs from 'fs';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    PrismaModule,
    CompaniesModule,
    ClientsModule,
    MachinesModule,
    ProductsModule,
    I18nModule.forRoot({
      fallbackLanguage: 'pt-BR',
      loaderOptions: {
        path: ((): string => {
          const candidates = [
            path.join(__dirname, '..', 'i18n'),
            path.join(__dirname, 'i18n'),
            path.join(process.cwd(), 'src', 'i18n'),
          ];
          for (const p of candidates) {
            if (fs.existsSync(p)) return p;
          }
          return path.join(__dirname, '/i18n/');
        })(),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
        new HeaderResolver(['x-custom-lang']),
      ],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
