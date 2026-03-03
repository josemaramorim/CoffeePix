import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({ example: 'Empresa X' })
  @IsString()
  name!: string;

  @ApiProperty({ example: '00.000.000/0000-00' })
  @IsString()
  cnpj!: string;

  @ApiProperty({ example: 'Rua Exemplo, 123', required: false })
  @IsString()
  address?: string;
}
