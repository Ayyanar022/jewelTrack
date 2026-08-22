import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LoanService } from './loan.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { RepayLoanDto } from './dto/repay-loan.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role, LoanStatus } from '@prisma/client';

@ApiBearerAuth('JWT-auth')
@ApiTags('Gold & Silver Loans')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('loan')
export class LoanController {
  constructor(private loanService: LoanService) {}

  // 1. Dashboard Statistics with optional Date Period filter
  @Roles(Role.SHOP_OWNER, Role.MANAGER)
  @Get('stats')
  getStats(@Request() req: any, @Query('period') period?: string) {
    return this.loanService.getLoanStats(req.user.shop_id, period);
  }

  // 2. List all loans with status, search, date period, customer_id, and pagination
  @Roles(Role.SHOP_OWNER, Role.MANAGER)
  @Get()
  getLoans(
    @Request() req: any,
    @Query('status') status?: LoanStatus,
    @Query('search') search?: string,
    @Query('period') period?: string,
    @Query('customer_id') customerId?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.loanService.getLoans(req.user.shop_id, status, search, period, customerId, page, limit);
  }

  // 3. Single loan details with collateral items & repayments
  @Roles(Role.SHOP_OWNER, Role.MANAGER)
  @Get(':id')
  getLoanById(@Request() req: any, @Param('id') id: string) {
    return this.loanService.getLoanById(req.user.shop_id, id);
  }

  // 4. Create New Gold / Silver Loan Pledge
  @Roles(Role.SHOP_OWNER, Role.MANAGER)
  @Post()
  createLoan(@Request() req: any, @Body() dto: CreateLoanDto) {
    return this.loanService.createLoan(req.user.shop_id, dto);
  }

  // 5. Record Repayment (Interest payment / Principal settlement)
  @Roles(Role.SHOP_OWNER, Role.MANAGER)
  @Post(':id/repay')
  repayLoan(@Request() req: any, @Param('id') id: string, @Body() dto: RepayLoanDto) {
    return this.loanService.repayLoan(req.user.shop_id, id, dto);
  }
}
