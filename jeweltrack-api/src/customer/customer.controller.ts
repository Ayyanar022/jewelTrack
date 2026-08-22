import { Body, Controller, Get, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/create-customer.dto';

@ApiBearerAuth('JWT-auth')
@ApiTags('Customer')
@Controller('customer')
@UseGuards(JwtAuthGuard)
export class CustomerController {
    constructor(private customerService:CustomerService){}

    @Post()
    create(@Body()dto:CreateCustomerDto , @Request() req:any){
        return this.customerService.create(dto, req.user.shop_id)
    }

    @Put(':id')
    updateCustomer(@Body() dto :UpdateCustomerDto , @Param('id') customerID:string , @Request() req:any) {
        return this.customerService.updateCustomer(dto ,customerID , req.user.shop_id )
    }

    @Get('search')
    search(@Query('q') query:string , @Request() req:any){
        return this.customerService.search(query, req.user.shop_id)
    }

    @Get('all')
    fetchAll(@Request() req:any){
        return this.customerService.fetchAll(req.user.shop_id)
    }

    @Get('purchase/:id')
    purchaseBills(@Request() req:any , @Param('id') customerId:string ){
        return this.customerService.purchaseBills(customerId, req.user.shop_id )
    }

    @Get('stats/:id')
    stats(@Request() req:any , @Param('id') customerId:string){
        return this.customerService.stats(customerId , req.user.shop_id)
    }

    @Get(':id')
    findById(@Request() req:any, @Param('id') customerId:string){
        return this.customerService.findById(customerId, req.user.shop_id);
    }
}
