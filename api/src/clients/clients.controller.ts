import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AppUser } from '../types/app-user';

@ApiTags('Clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Roles('SAAS_ADMIN', 'COMPANY_ADMIN')
  @Post()
  async create(
    @Body() createClientDto: CreateClientDto,
    @CurrentUser() user: AppUser,
  ) {
    return this.clientsService.create(
      createClientDto,
      user.role,
      user.company_id ?? '',
    );
  }

  @Roles('SAAS_ADMIN', 'COMPANY_ADMIN')
  @Get()
  async findAll(@CurrentUser() user: AppUser) {
    return this.clientsService.findAll(user.role, user.company_id ?? '');
  }

  @Roles('SAAS_ADMIN', 'COMPANY_ADMIN', 'CLIENT_ADMIN')
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: AppUser) {
    return this.clientsService.findOne(
      id,
      user.role,
      user.company_id ?? '',
      user.client_id ?? '',
    );
  }

  @Roles('SAAS_ADMIN', 'COMPANY_ADMIN', 'CLIENT_ADMIN')
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateClientDto: Partial<CreateClientDto>,
    @CurrentUser() user: AppUser,
  ) {
    return this.clientsService.update(
      id,
      updateClientDto,
      user.role,
      user.company_id ?? '',
      user.client_id ?? '',
    );
  }
}
