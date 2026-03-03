import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateClientDto {
  @ApiProperty({ example: 'Cliente A' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'company-id-uuid' })
  @IsString()
  company_id!: string;
}
