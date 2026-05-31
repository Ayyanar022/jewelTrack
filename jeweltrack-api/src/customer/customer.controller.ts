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
        return this.customerService.create(dto,req.user.id)
    }

    @Put(':id')
    updateCustomer(@Body() dto :UpdateCustomerDto , @Param('id') customerID:string , @Request() req:any) {
        return this.customerService.updateCustomer(dto ,customerID , req.user.id )
    }


    @Get('search')
    search(@Query('q') query:string , @Request() req){
        return this.customerService.search(query, req.user.id)
    }


    @Get('all')
    fetchAll(@Request() req){
        return this.customerService.fetchAll(req.user.id)
    }

    @Get('purchase/:id')
    purchaseBills(@Request() req:any , @Param('id') customerId:string ){
        return this.customerService.purchaseBills(customerId,req.user.id )
    }

    @Get('stats/:id')
    stats(@Request() req:any , @Param('id') customerId:string){
        return this.customerService.stats(customerId , req.user.id)
    }

}
