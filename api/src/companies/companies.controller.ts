import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AppUser } from '../types/app-user';

@ApiTags('Companies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Roles('SAAS_ADMIN')
  @Post()
  async create(@Body() createCompanyDto: { name: string; cnpj: string }) {
    return this.companiesService.create(createCompanyDto);
  }

  @Roles('SAAS_ADMIN')
  @Get()
  async findAll() {
    return this.companiesService.findAll();
  }

  @Roles('SAAS_ADMIN', 'COMPANY_ADMIN')
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: AppUser) {
    // Isolamento ABAC: COMPANY_ADMIN só pode ver a própria empresa
    if (user.role === 'COMPANY_ADMIN' && user.company_id !== id) {
      throw new ForbiddenException('You can only access your own company data');
    }
    return this.companiesService.findOne(id);
  }

  @Roles('SAAS_ADMIN', 'COMPANY_ADMIN')
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCompanyDto: { name?: string; status?: string },
    @CurrentUser() user: AppUser,
  ) {
    // Isolamento ABAC: COMPANY_ADMIN só pode editar a própria empresa
    if (user.role === 'COMPANY_ADMIN' && user.company_id !== id) {
      throw new ForbiddenException('You can only update your own company data');
    }
    // COMPANY_ADMIN não pode mudar o próprio status (ex: se desbloquear)
    if (user.role === 'COMPANY_ADMIN' && updateCompanyDto.status) {
      throw new ForbiddenException(
        'COMPANY_ADMIN cannot change company status',
      );
    }

    return this.companiesService.update(id, updateCompanyDto);
  }
}
