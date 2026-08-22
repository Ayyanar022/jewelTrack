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
@ApiTags('Gold Loans')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('loan')
export class LoanController {
  constructor(private loanService: LoanService) {}

  // 1. Dashboard Statistics
  @Roles(Role.SHOP_OWNER, Role.MANAGER)
  @Get('stats')
  getStats(@Request() req: any) {
    return this.loanService.getLoanStats(req.user.shop_id);
  }

  // 2. List all loans with optional status & search filter
  @Roles(Role.SHOP_OWNER, Role.MANAGER)
  @Get()
  getLoans(
    @Request() req: any,
    @Query('status') status?: LoanStatus,
    @Query('search') search?: string,
  ) {
    return this.loanService.getLoans(req.user.shop_id, status, search);
  }

  // 3. Single loan details with collateral items & repayments
  @Roles(Role.SHOP_OWNER, Role.MANAGER)
  @Get(':id')
  getLoanById(@Request() req: any, @Param('id') id: string) {
    return this.loanService.getLoanById(req.user.shop_id, id);
  }

  // 4. Create New Gold Loan Pledge
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
