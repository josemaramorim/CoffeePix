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
import { CreatePaymentRequestDto } from './dto/create-payment-request.dto';
import { PaymentWebhookDto } from './dto/webhook.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('request')
  @ApiBody({ type: CreatePaymentRequestDto })
  @ApiHeader({ name: 'x-hmac-signature', required: false })
  async requestPayment(@Body() body: CreatePaymentRequestDto, @Headers('x-hmac-signature') hmac?: string) {
    // HMAC validation to be implemented — for now accept and log header
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
