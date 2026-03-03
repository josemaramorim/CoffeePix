import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreatePaymentRequestDto {
  @ApiProperty({ example: '16e8a470-7f2e-4e77-b0fc-afd7e86823f6' })
  @IsString()
  machine_id!: string;

  @ApiProperty({ example: 'product-id-uuid' })
  @IsString()
  product_id!: string;
}
