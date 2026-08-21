import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { CreateRateDto } from './dto/create-rate.dto';
import { RateService } from './rate.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth('JWT-auth')
@ApiTags('Rate')
@UseGuards(JwtAuthGuard)
@Controller('rate')
export class RateController {
    constructor(private rateService :RateService){}

    @Post()
    newRate(@Body() dto:CreateRateDto ,@Request() req:any ){
        return this.rateService.createNewRate(dto, req.user.shop_id)
    }

    @Get('rate-history')
    rateHistory(@Request() req:any ){
        return this.rateService.getHistory(req.user.shop_id)
    }

    @Get('recent-rate')
    recentRate(@Request() req:any ){
        return this.rateService.getRecentRate(req.user.shop_id)
    }
}
