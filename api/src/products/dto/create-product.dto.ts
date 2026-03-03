import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({ example: 'Café Especial' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 12.5, description: 'Valor em reais (ex: 12.5). Será convertido para centavos automaticamente.' })
  @Type(() => Number)
  @IsNumber()
  price!: number;

  @ApiProperty({ example: 'company-id-uuid' })
  @IsString()
  company_id!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
