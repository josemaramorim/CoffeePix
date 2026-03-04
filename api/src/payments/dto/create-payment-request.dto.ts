import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreatePaymentRequestDto {
  @ApiPropertyOptional({ example: '16e8a470-7f2e-4e77-b0fc-afd7e86823f6' })
  @IsOptional()
  @IsString()
  machine_id?: string;

  @ApiPropertyOptional({ example: 'product-id-uuid' })
  @IsOptional()
  @IsString()
  product_id?: string;

  @ApiPropertyOptional({ example: 'https://example.com/callback?machine_id=...&product_id=...' })
  @IsOptional()
  @IsString()
  url?: string;
}
