import { Body, Controller, Get,  Post, Query, Request, UseGuards } from '@nestjs/common';
import { BillService } from './bill.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { CreateBillDto } from './dto/craete-bill.dto';

@ApiBearerAuth('JWT-auth')
@ApiTags('Bills')
@Controller('bill')
@UseGuards(JwtAuthGuard)
export class BillController {

    constructor(private billService : BillService){}

    @Post()
    create(@Body() dto:CreateBillDto , @Request() req:any ){
        return this.billService.create(dto , req.user.id)
    }

    @Get('search')
    fetch(@Query('q') billId:string ,@Request() req ){
        return this.billService.findOne(billId , req.user.id)
    }

    @Get('all')
    fetchAll(@Query('customerId') customerId:string , @Request() req ){
        return this.billService.findAll(customerId ,req.user.id)
    }


}
