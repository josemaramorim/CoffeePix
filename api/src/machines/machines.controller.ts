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
import { MachinesService } from './machines.service';
import { CreateMachineDto } from './dto/create-machine.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AppUser } from '../types/app-user';

@ApiTags('Machines')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('machines')
export class MachinesController {
  constructor(private readonly machinesService: MachinesService) {}

  @Roles('SAAS_ADMIN', 'COMPANY_ADMIN')
  @Post()
  async create(
    @Body()
      createMachineDto: CreateMachineDto,
    @CurrentUser() user: AppUser,
  ) {
    return this.machinesService.create(
      createMachineDto,
      user.role,
      user.company_id ?? '',
    );
  }

  @Roles('SAAS_ADMIN', 'COMPANY_ADMIN', 'CLIENT_ADMIN')
  @Get()
  async findAll(@CurrentUser() user: AppUser) {
    return this.machinesService.findAll(
      user.role,
      user.company_id ?? '',
      user.client_id ?? '',
    );
  }

  @Roles('SAAS_ADMIN', 'COMPANY_ADMIN', 'CLIENT_ADMIN')
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: AppUser) {
    return this.machinesService.findOne(
      id,
      user.role,
      user.company_id ?? '',
      user.client_id ?? '',
    );
  }

  @Roles('SAAS_ADMIN', 'COMPANY_ADMIN')
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateMachineDto: Partial<CreateMachineDto>,
    @CurrentUser() user: AppUser,
  ) {
    return this.machinesService.update(
      id,
      updateMachineDto,
      user.role,
      user.company_id ?? '',
    );
  }

  @Roles('SAAS_ADMIN', 'COMPANY_ADMIN', 'CLIENT_ADMIN')
  @Get(':id/requests')
  async getRequests(@Param('id') id: string, @CurrentUser() user: AppUser) {
    // RBAC enforced in service
    return this.machinesService.getMachineRequests(id);
  }

  @Roles('SAAS_ADMIN', 'COMPANY_ADMIN', 'CLIENT_ADMIN')
  @Get(':id/requests/:reqId')
  async getRequest(@Param('id') id: string, @Param('reqId') reqId: string, @CurrentUser() user: AppUser) {
    return this.machinesService.getMachineRequest(id, reqId);
  }
}
