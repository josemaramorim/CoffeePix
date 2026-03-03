import { Module } from '@nestjs/common';
import { MachinesService } from './machines.service';
import { MachinesController } from './machines.controller';
import { PublicMachinesController } from './public-machines.controller';

@Module({
  providers: [MachinesService],
  controllers: [MachinesController, PublicMachinesController],
})
export class MachinesModule {}
