import { Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { CreateCustomerDto } from './dto/create-customer.dto';

@ApiBearerAuth('JWT-auth')
@ApiTags('Customer')
@Controller('customer')
@UseGuards(JwtAuthGuard)
export class CustomerController {
    constructor(private custormerSerice:CustomerService){}

    @Post()
    create(@Body()dto:CreateCustomerDto , @Request() req:any){
        return this.custormerSerice.create(dto,req.user.id)
    }

    @Get('search')
    search(@Query('q') query:string , @Request() req){
        return this.custormerSerice.search(query, req.user.id)
    }


    @Get('all')
    fetchAll(@Request() req){
        return this.custormerSerice.fetchAll(req.user.id)
    }

}
