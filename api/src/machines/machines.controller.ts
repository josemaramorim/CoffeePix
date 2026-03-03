import { Controller, Get, Post, Body, Param, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MachinesService } from './machines.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('Machines')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('machines')
export class MachinesController {
    constructor(private readonly machinesService: MachinesService) { }

    @Roles('SAAS_ADMIN', 'COMPANY_ADMIN')
    @Post()
    async create(@Body() createMachineDto: { serial_number: string; model?: string; client_id: string; company_id: string }, @CurrentUser() user: any) {
        return this.machinesService.create(createMachineDto, user.role, user.company_id);
    }

    @Roles('SAAS_ADMIN', 'COMPANY_ADMIN', 'CLIENT_ADMIN')
    @Get()
    async findAll(@CurrentUser() user: any) {
        return this.machinesService.findAll(user.role, user.company_id, user.client_id);
    }

    @Roles('SAAS_ADMIN', 'COMPANY_ADMIN', 'CLIENT_ADMIN')
    @Get(':id')
    async findOne(@Param('id') id: string, @CurrentUser() user: any) {
        return this.machinesService.findOne(id, user.role, user.company_id, user.client_id);
    }

    @Roles('SAAS_ADMIN', 'COMPANY_ADMIN')
    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() updateMachineDto: { status?: string; client_id?: string },
        @CurrentUser() user: any
    ) {
        return this.machinesService.update(id, updateMachineDto, user.role, user.company_id);
    }
}
