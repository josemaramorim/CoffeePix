import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateMachineDto {
  @ApiProperty({ example: 'SN-123456' })
  @IsString()
  serial_number!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiProperty({ example: 'client-id-uuid' })
  @IsString()
  client_id!: string;

  @ApiProperty({ example: 'company-id-uuid' })
  @IsString()
  company_id!: string;
}
