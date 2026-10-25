import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { DealerService } from './dealer.service';
import { CreateDealerDto } from './dto/create-dealer.dto';
import { CreateSettlementDto } from './dto/create-settlement.dto';

@ApiBearerAuth('JWT-auth')
@ApiTags('Dealers & Peer Shop Ledger')
@Controller('dealer')
@UseGuards(JwtAuthGuard)
export class DealerController {
  constructor(private dealerService: DealerService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new partner dealer / peer shop' })
  create(@Body() dto: CreateDealerDto, @Request() req: any) {
    return this.dealerService.createDealer(req.user.shop_id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List dealers with live pure gold running balances' })
  findAll(
    @Query('search') search: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Request() req: any,
  ) {
    return this.dealerService.getDealers(req.user.shop_id, search, Number(page) || 1, Number(limit) || 10);
  }

  @Get('settlements')
  @ApiOperation({ summary: 'Get all settlements recorded for the shop' })
  getAllSettlements(@Query('dealer_id') dealerId: string, @Request() req: any) {
    return this.dealerService.getSettlements(req.user.shop_id, dealerId);
  }

  @Post('settlement')
  @ApiOperation({ summary: 'Record a Pure Gold / Cash settlement payment from a dealer' })
  recordSettlement(@Body() dto: CreateSettlementDto, @Request() req: any) {
    return this.dealerService.createSettlement(req.user.shop_id, req.user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single dealer by ID with transaction history' })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.dealerService.getDealerById(req.user.shop_id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update dealer details' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateDealerDto>, @Request() req: any) {
    return this.dealerService.updateDealer(req.user.shop_id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate / delete dealer' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.dealerService.deleteDealer(req.user.shop_id, id);
  }

  @Get(':id/weekly-statement')
  @ApiOperation({ summary: 'Generate high-precision Dealer Weekly Bill / Statement (வாரப் பில்)' })
  getWeeklyStatement(
    @Param('id') id: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Request() req: any,
  ) {
    return this.dealerService.getWeeklyStatement(req.user.shop_id, id, from, to);
  }
}
