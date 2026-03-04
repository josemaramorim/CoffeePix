import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Param,
  Headers,
  Res,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBody, ApiHeader } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentRequestDto } from './dto/create-payment-request.dto';
import { PaymentWebhookDto } from './dto/webhook.dto';
import type { Response } from 'express';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService, private readonly prisma: PrismaService) {}

  @Post('request')
  @ApiBody({ type: CreatePaymentRequestDto })
  @ApiHeader({ name: 'x-hmac-signature', required: false })
  async requestPayment(
    @Body() body: CreatePaymentRequestDto,
    @Headers('x-hmac-signature') hmac?: string,
    @Headers() headers?: Record<string, any>,
    @Res() res?: Response,
  ) {
    // support two payload shapes:
    // 1) { machine_id, product_id }
    // 2) { url: 'https://.../?machine_id=...&product_id=...' }

    let machineId = body.machine_id as string | undefined;
    let productId = body.product_id as string | undefined;

    if (!machineId || !productId) {
      if (body.url) {
        try {
          const parsed = new URL(body.url);
          machineId = parsed.searchParams.get('machine_id') ?? undefined;
          productId = parsed.searchParams.get('product_id') ?? undefined;
        } catch (e) {
          throw new BadRequestException('Invalid url format');
        }
      }
    }

    if (!machineId || !productId) {
      throw new BadRequestException('machine_id and product_id are required (either in body or url query)');
    }

    // Persist raw payload + headers for inspection (machine_requests)
    let reqRecord: { id: string } | null = null;
    try {
      reqRecord = await this.prisma.machineRequest.create({
        data: {
          machine_id: machineId,
          payload: body as any,
          headers: headers as any,
        },
        select: { id: true },
      });
    } catch (e) {
      // ignore if prisma model not migrated yet
    }

    const result = await this.paymentsService.requestPayment(machineId, productId);

    const reqId = reqRecord?.id ?? null;

    const responseBody: Record<string, any> = {
      reqId,
      transaction: result.transaction,
      payloadSummary: { expires_in: result.payload?.expires_in ?? 90 },
    };

    if (res) {
      if (reqId) {
        res.setHeader('Location', `/public/machines/${machineId}/requests/${reqId}`);
      }
      return res.status(HttpStatus.CREATED).json(responseBody);
    }

    return responseBody;
  }

  @Get('request')
  async requestPaymentGet(
    @Query('url') url?: string,
    @Query('machine_id') machine_id?: string,
    @Query('product_id') product_id?: string,
    @Headers('x-hmac-signature') hmac?: string,
    @Headers() headers?: Record<string, any>,
    @Res() res?: Response,
  ) {
    // Accept either: ?machine_id=...&product_id=... OR ?url=... (containing those params)
    if (machine_id && product_id) {
      const body = { machine_id, product_id } as any;
      return this.requestPayment(body, hmac, headers, res);
    }

    if (url) {
      const body = { url } as any;
      return this.requestPayment(body, hmac, headers, res);
    }

    throw new BadRequestException('Provide either url or both machine_id and product_id as query parameters');
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
