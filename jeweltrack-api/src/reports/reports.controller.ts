import { Body, Controller, Get, Param, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { ReportsService } from './reports.service';

@ApiBearerAuth('JWT-auth')
@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
    constructor(private reportService :ReportsService){}

    // bill report
    @Get('sale-stats')
    saleStats(@Query('from') fromDate:string , @Query('to')toDate:string, @Request() req:any){
        return this.reportService.saleStats( fromDate,toDate,req.user.shop_id)
    }

    @Get('gst-report')
    gstReport(@Query('from') fromDate:string , @Query('to')toDate:string, @Request() req:any){
        return this.reportService.gstReport( fromDate,toDate,req.user.shop_id)
    }

    @Get('item-wise-sales-report')
    itemWisesalesReport(@Query('from') fromDate:string , @Query('to')toDate:string, @Request() req:any){
        return this.reportService.itemWisesalesReport( fromDate,toDate,req.user.shop_id)
    }

    @Get('pending-payments-report')
    pendingPayments(@Query('from') fromDate:string , @Query('to')toDate:string, @Request() req:any){
        return this.reportService.pendingPayments( fromDate,toDate,req.user.shop_id)
    }

    @Get('customer-wise-sales-report')
    customerWiseSalesReport(@Query('from') fromDate:string , @Query('to')toDate:string, @Request() req:any){
        return this.reportService.customerWiseSalesReport( fromDate,toDate,req.user.shop_id)
    }
}
