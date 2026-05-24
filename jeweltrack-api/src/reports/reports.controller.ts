import { Body, Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { ReportsService } from './reports.service';

@ApiBearerAuth('JWT-auth')
@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {

    constructor(private reportService :ReportsService){}

    @Get('/sale-stats')
    saleStats(@Request() req:any){
        return this.reportService.saleStats(req.user.id)
    }

}
