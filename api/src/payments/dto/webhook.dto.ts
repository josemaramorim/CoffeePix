import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn, IsOptional } from 'class-validator';

export class PaymentWebhookDto {
  @ApiProperty({ example: 'transaction-id-uuid' })
  @IsString()
  transaction_id!: string;

  @ApiProperty({ example: 'SUCCESS' })
  @IsString()
  @IsIn(['PENDING', 'SUCCESS', 'FAILED', 'TIMEOUT'])
  status!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  provider_tx_reference?: string;
}
