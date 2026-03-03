import { Controller, Get, Post, Body, Param, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Roles('SAAS_ADMIN', 'COMPANY_ADMIN')
    @Post()
    async create(@Body() createProductDto: { name: string; price: number; company_id: string }, @CurrentUser() user: any) {
        return this.productsService.create(createProductDto, user.role, user.company_id);
    }

    @Roles('SAAS_ADMIN', 'COMPANY_ADMIN', 'CLIENT_ADMIN')
    @Get()
    async findAll(@CurrentUser() user: any) {
        return this.productsService.findAll(user.role, user.company_id, user.client_id);
    }

    @Roles('SAAS_ADMIN', 'COMPANY_ADMIN', 'CLIENT_ADMIN')
    @Get(':id')
    async findOne(@Param('id') id: string, @CurrentUser() user: any) {
        return this.productsService.findOne(id, user.role, user.company_id, user.client_id);
    }

    @Roles('SAAS_ADMIN', 'COMPANY_ADMIN')
    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() updateProductDto: { name?: string; price?: number },
        @CurrentUser() user: any
    ) {
        return this.productsService.update(id, updateProductDto, user.role, user.company_id);
    }
}
