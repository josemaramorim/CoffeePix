import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AppUser } from '../types/app-user';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Roles('SAAS_ADMIN', 'COMPANY_ADMIN')
  @Post()
  async create(
    @Body()
    createProductDto: CreateProductDto,
    @CurrentUser() user: AppUser,
  ) {
    // converter preço em reais para centavos (Int) exigido pelo Prisma
    const priceInCents = Math.round((createProductDto.price ?? 0) * 100);
    const payload = {
      name: createProductDto.name,
      price: priceInCents,
      company_id: createProductDto.company_id,
    };
    return this.productsService.create(payload, user.role, user.company_id ?? '');
  }

  @Roles('SAAS_ADMIN', 'COMPANY_ADMIN', 'CLIENT_ADMIN')
  @Get()
  async findAll(@CurrentUser() user: AppUser) {
    return this.productsService.findAll(
      user.role,
      user.company_id ?? '',
      user.client_id ?? '',
    );
  }

  @Roles('SAAS_ADMIN', 'COMPANY_ADMIN', 'CLIENT_ADMIN')
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: AppUser) {
    return this.productsService.findOne(
      id,
      user.role,
      user.company_id ?? '',
      user.client_id ?? '',
    );
  }

  @Roles('SAAS_ADMIN', 'COMPANY_ADMIN')
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: Partial<CreateProductDto>,
    @CurrentUser() user: AppUser,
  ) {
    const payload: { name?: string; price?: number } = {};
    if (updateProductDto.name !== undefined) payload.name = updateProductDto.name;
    if (updateProductDto.price !== undefined)
      payload.price = Math.round(updateProductDto.price * 100);
    return this.productsService.update(id, payload, user.role, user.company_id ?? '');
  }
}
