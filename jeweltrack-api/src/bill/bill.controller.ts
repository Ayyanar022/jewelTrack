import { Body, Controller, Get,  Param,  Post, Query, Request, UseGuards } from '@nestjs/common';
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
        return this.billService.create(dto , req.user.shop_id, req.user.id)
    }

    @Get('search')
    fetch(@Query('q') billId:string ,@Request() req:any ){
        return this.billService.findOne(billId , req.user.shop_id)
    }

    @Get('all')
    fetchAll(
        @Query('search') search: string,
        @Query('page') page: string,
        @Query('limit') limit: string,
        @Query('period') period: string,
        @Request() req: any 
    ){
        return this.billService.findAll(search, req.user.shop_id, page, limit, period)
    }

    @Get(':id')
    findOne(@Param('id') billId:string,@Request() req:any){
        return this.billService.findOne(billId , req.user.shop_id)
    }

    @Get('bill-detail-payment-entry/:id')
    findBillDetaile(@Param('id') billId:string,@Request() req:any){
        return this.billService.findBillDetaile(billId , req.user.shop_id)
    }

    @Post('payment/bill-add-entry/:id')
    postBillPayment(@Param('id') billId:string ,@Body() data:any , @Request() req:any){
        return this.billService.AddPayment(billId,data , req.user.shop_id, req.user.id )
    }
}
