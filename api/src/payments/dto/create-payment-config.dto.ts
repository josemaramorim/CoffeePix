import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreatePaymentConfigDto {
  @ApiProperty({ example: 'client-id-uuid' })
  @IsString()
  client_id!: string;

  @ApiProperty({ example: 'MercadoPago' })
  @IsString()
  gateway_provider!: string;

  @ApiProperty({ example: 'encrypted:...' })
  @IsString()
  encrypted_credentials!: string;

  @ApiProperty({ example: 'pix@example.com' })
  @IsString()
  pix_key!: string;
}
