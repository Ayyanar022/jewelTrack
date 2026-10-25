import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { SchemeService } from './scheme.service';
import { CreateSchemeDto } from './dto/create-scheme.dto';
import { DepositSchemeDto } from './dto/deposit-scheme.dto';
import { RedeemSchemeDto } from './dto/redeem-scheme.dto';

@ApiBearerAuth('JWT-auth')
@ApiTags('Gold Savings Schemes (தங்க சேமிப்பு திட்டம்)')
@Controller('scheme')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchemeController {
  constructor(private schemeService: SchemeService) {}

  @Roles(Role.SHOP_OWNER, Role.MANAGER, Role.CASHIER)
  @Get('stats')
  @ApiOperation({ summary: 'Get summary statistics of active gold schemes and gold accumulated' })
  getStats(@Request() req: any) {
    return this.schemeService.getSchemeStats(req.user.shop_id);
  }

  @Roles(Role.SHOP_OWNER, Role.MANAGER, Role.CASHIER)
  @Get()
  @ApiOperation({ summary: 'List all customer gold schemes with pagination and search' })
  findAll(
    @Query('search') search: string,
    @Query('status') status: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Request() req: any,
  ) {
    return this.schemeService.getAllSchemes(
      req.user.shop_id,
      search,
      status,
      Number(page) || 1,
      Number(limit) || 10,
    );
  }

  @Roles(Role.SHOP_OWNER, Role.MANAGER, Role.CASHIER)
  @Get(':id')
  @ApiOperation({ summary: 'Get scheme details, passbook ledger and redemption gain' })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.schemeService.getSchemeById(req.user.shop_id, id);
  }

  @Roles(Role.SHOP_OWNER, Role.MANAGER, Role.CASHIER)
  @Post()
  @ApiOperation({ summary: 'Open new Gold Savings Account for customer' })
  create(@Body() dto: CreateSchemeDto, @Request() req: any) {
    return this.schemeService.createScheme(req.user.shop_id, req.user.id, dto);
  }

  @Roles(Role.SHOP_OWNER, Role.MANAGER, Role.CASHIER)
  @Post(':id/deposit')
  @ApiOperation({ summary: 'Record cash deposit and convert to 916 gold grams' })
  deposit(
    @Param('id') id: string,
    @Body() dto: DepositSchemeDto,
    @Request() req: any,
  ) {
    return this.schemeService.depositCash(req.user.shop_id, req.user.id, id, dto);
  }

  @Roles(Role.SHOP_OWNER, Role.MANAGER, Role.CASHIER)
  @Post(':id/redeem')
  @ApiOperation({ summary: 'Redeem accumulated gold (partial or full) for jewellery purchase' })
  redeem(
    @Param('id') id: string,
    @Body() dto: RedeemSchemeDto,
    @Request() req: any,
  ) {
    return this.schemeService.redeemScheme(req.user.shop_id, req.user.id, id, dto);
  }

  @Roles(Role.SHOP_OWNER, Role.MANAGER)
  @Post(':id/close')
  @ApiOperation({ summary: 'Close or cancel scheme account' })
  close(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req: any,
  ) {
    return this.schemeService.closeScheme(req.user.shop_id, id, reason);
  }

  @Roles(Role.SHOP_OWNER, Role.MANAGER)
  @Delete(':id/payment/:paymentId')
  @ApiOperation({ summary: 'Reverse/delete erroneous deposit entry' })
  deletePayment(
    @Param('id') id: string,
    @Param('paymentId') paymentId: string,
    @Request() req: any,
  ) {
    return this.schemeService.deletePayment(req.user.shop_id, id, paymentId);
  }
}
