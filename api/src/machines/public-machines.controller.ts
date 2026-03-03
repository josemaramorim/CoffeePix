import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MachinesService } from './machines.service';

@ApiTags('Public Machines')
@Controller('public/machines')
export class PublicMachinesController {
  constructor(private readonly machinesService: MachinesService) {}

  @Get(':id/requests')
  async getRequests(@Param('id') id: string) {
    return this.machinesService.getMachineRequests(id);
  }

  @Get(':id/requests/:reqId')
  async getRequest(@Param('id') id: string, @Param('reqId') reqId: string) {
    return this.machinesService.getMachineRequest(id, reqId);
  }
}
