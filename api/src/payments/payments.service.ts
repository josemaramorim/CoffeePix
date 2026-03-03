import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async requestPayment(machine_id: string, product_id: string) {
    // lookup machine, product and derive client/company
    const machine = await this.prisma.machine.findUnique({ where: { id: machine_id } });
    if (!machine) throw new NotFoundException('Machine not found');

    const product = await this.prisma.product.findUnique({ where: { id: product_id } });
    if (!product) throw new NotFoundException('Product not found');

    const amount = product.price; // already stored in cents

    const tx = await this.prisma.transaction.create({
      data: {
        machine_id: machine.id,
        client_id: machine.client_id,
        company_id: machine.company_id,
        product_id: product.id,
        amount,
        status: 'PENDING',
      },
    });

    // placeholder QR/payload — real implementation calls gateway using client's payment_config
    const payload = { qr: 'PLACEHOLDER_QR_CODE', expires_in: 90 };

    return { transaction: tx, payload };
  }

  async getStatus(transactionId: string) {
    const tx = await this.prisma.transaction.findUnique({ where: { id: transactionId } });
    if (!tx) throw new NotFoundException('Transaction not found');
    return { id: tx.id, status: tx.status };
  }

  async handleWebhook(transactionId: string, status: string, providerRef?: string) {
    const tx = await this.prisma.transaction.findUnique({ where: { id: transactionId } });
    if (!tx) throw new NotFoundException('Transaction not found');

    await this.prisma.transaction.update({
      where: { id: transactionId },
      data: { status, provider_tx_reference: providerRef ?? null },
    });

    return { ok: true };
  }
}
