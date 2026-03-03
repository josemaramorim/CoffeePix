import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiBody, ApiHeader } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentRequestDto } from './dto/create-payment-request.dto';
import { PaymentWebhookDto } from './dto/webhook.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService, private readonly prisma: PrismaService) {}

  @Post('request')
  @ApiBody({ type: CreatePaymentRequestDto })
  @ApiHeader({ name: 'x-hmac-signature', required: false })
  async requestPayment(@Body() body: CreatePaymentRequestDto, @Headers('x-hmac-signature') hmac?: string, @Headers() headers?: Record<string, any>) {
    // Persist raw payload + headers for inspection (machine_requests)
    try {
      await this.prisma.machineRequest.create({
        data: {
          machine_id: body.machine_id,
          payload: body as any,
          headers: headers as any,
        },
      });
    } catch (e) {
      // ignore if prisma model not migrated yet
    }
    return this.paymentsService.requestPayment(body.machine_id, body.product_id);
  }

  @Get(':id/status')
  async status(@Param('id') id: string) {
    return this.paymentsService.getStatus(id);
  }

  @Post('webhook')
  @ApiBody({ type: PaymentWebhookDto })
  async webhook(@Body() body: PaymentWebhookDto) {
    return this.paymentsService.handleWebhook(body.transaction_id, body.status, body.provider_tx_reference);
  }
}
