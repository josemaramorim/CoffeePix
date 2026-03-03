import { ApiProperty } from '@nestjs/swagger';

export class MachineRequestDto {
  @ApiProperty({ example: 'request-id-uuid' })
  id!: string;

  @ApiProperty({ type: Object })
  payload!: Record<string, any>;

  @ApiProperty({ type: Object })
  headers!: Record<string, any>;

  @ApiProperty({ example: new Date() })
  created_at!: string;
}
