import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { SubscriptionService } from 'src/subscription/subscription.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { RepayLoanDto } from './dto/repay-loan.dto';
import { LoanStatus } from '@prisma/client';

function getDateFilter(period?: string): { gte?: Date } | undefined {
  if (!period || period === 'ALL') return undefined;

  const now = new Date();
  if (period === 'TODAY') {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    return { gte: startOfToday };
  }
  if (period === 'WEEK') {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);
    return { gte: startOfWeek };
  }
  if (period === 'MONTH') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    return { gte: startOfMonth };
  }
  return undefined;
}

@Injectable()
export class LoanService {
  constructor(
    private prisma: PrismaService,
    private subscriptionService: SubscriptionService,
  ) {}

  // Helper to calculate elapsed months and accrued interest according to Indian jeweller practice
  private calculateLoanInterest(loan: any) {
    const loanDate = new Date(loan.loan_date);
    const now = new Date();

    const diffMs = Math.max(0, now.getTime() - loanDate.getTime());
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Exact Indian Jeweller Calendar Running Month Rule:
    // Loan Date: 22-08-2026
    // Up to 22-09-2026 = 1 Month
    // On 23-09-2026 (1 day exceeded) = 2 Months
    // On 22-10-2026 = 2 Months
    // On 23-10-2026 = 3 Months
    const startYear = loanDate.getFullYear();
    const startMonth = loanDate.getMonth();
    const startDay = loanDate.getDate();

    const endYear = now.getFullYear();
    const endMonth = now.getMonth();
    const endDay = now.getDate();

    let calendarMonths = (endYear - startYear) * 12 + (endMonth - startMonth);
    if (endDay > startDay) {
      calendarMonths += 1;
    }
    const elapsedMonths = Math.max(1, calendarMonths);

    const totalPrincipalPaid = (loan.loanRepayment || []).reduce((sum: number, r: any) => sum + (r.principal_paid || 0), 0);
    const totalInterestPaid = (loan.loanRepayment || []).reduce((sum: number, r: any) => sum + (r.interest_paid || 0), 0);
    const totalDiscountGiven = (loan.loanRepayment || []).reduce((sum: number, r: any) => sum + (r.discount_amount || 0), 0);
    const currentPrincipalBalance = Math.max(0, loan.loan_amount - totalPrincipalPaid);

    // Exact Indian Jeweller Month-by-Month Interest Accrual:
    // For each running month cycle, interest is charged based on the principal balance at the START of that month cycle.
    // If a principal repayment is made during a month, the reduced balance takes effect from the NEXT month cycle onward.
    let totalAccruedInterest = 0;
    for (let m = 1; m <= elapsedMonths; m++) {
      const monthStartDate = new Date(startYear, startMonth + (m - 1), startDay);
      const principalPaidBeforeMonth = (loan.loanRepayment || [])
        .filter((r: any) => new Date(r.payment_date || r.created_at) < monthStartDate)
        .reduce((sum: number, r: any) => sum + (r.principal_paid || 0), 0);

      const principalAtMonthStart = Math.max(0, loan.loan_amount - principalPaidBeforeMonth);
      const monthInterest = Math.round((principalAtMonthStart * loan.interest_rate) / 100);
      totalAccruedInterest += monthInterest;
    }

    const monthlyInterestAmount = Math.round((currentPrincipalBalance * loan.interest_rate) / 100);
    const pendingInterest = Math.max(0, totalAccruedInterest - totalInterestPaid - totalDiscountGiven);

    return {
      total_principal_paid: totalPrincipalPaid,
      total_interest_paid: totalInterestPaid,
      total_discount_given: totalDiscountGiven,
      current_principal_balance: currentPrincipalBalance,
      monthly_interest_amount: monthlyInterestAmount,
      days_elapsed: diffDays,
      months_elapsed: elapsedMonths,
      total_accrued_interest: totalAccruedInterest,
      pending_interest: pendingInterest,
    };
  }

  // 1. Create New Gold / Silver Loan Pledge
  async createLoan(shopId: string, dto: CreateLoanDto) {
    if (!shopId) throw new BadRequestException('Shop ID is required');

    // Strict validation: Net weight cannot exceed Gross weight
    if (Number(dto.net_weight) > Number(dto.gross_weight)) {
      throw new BadRequestException(
        `Total Net Weight (${dto.net_weight}g) cannot be greater than Total Gross Weight (${dto.gross_weight}g)`,
      );
    }

    for (const item of dto.items) {
      if (Number(item.net_weight || 0) > Number(item.gross_weight || 0)) {
        throw new BadRequestException(
          `Item "${item.description}" Net Weight (${item.net_weight}g) cannot exceed its Gross Weight (${item.gross_weight}g)`,
        );
      }
    }

    // Generate unique sequential loan number (e.g. GL-001, GL-002)
    const count = await this.prisma.jewelLoan.count({ where: { shop_id: shopId } });
    const loan_number = `GL-${String(count + 1).padStart(3, '0')}`;

    return this.prisma.jewelLoan.create({
      data: {
        shop_id: shopId,
        customer_id: dto.customer_id,
        loan_number,
        loan_amount: dto.loan_amount,
        interest_rate: dto.interest_rate,
        gross_weight: dto.gross_weight,
        net_weight: dto.net_weight,
        notes: dto.notes,
        status: LoanStatus.ACTIVE,
        loanCollateralItem: {
          create: dto.items.map((item) => ({
            metal: item.metal || 'GOLD',
            description: item.description,
            purity: item.metal === 'SILVER' ? null : (item.purity || 'K22'),
            pieces: item.pieces || 1,
            gross_weight: item.gross_weight || 0,
            net_weight: item.net_weight || 0,
          })),
        },
      },
      include: {
        customer: true,
        loanCollateralItem: true,
        loanRepayment: true,
      },
    });
  }

  // 2. List All Loans with Pagination, Date Filter, Customer ID, and Search
  async getLoans(
    shopId: string,
    status?: LoanStatus,
    search?: string,
    period?: string,
    customerId?: string,
    page: number = 1,
    limit: number = 10,
  ) {
    if (!shopId) return { items: [], total: 0, page: 1, limit: 10, totalPages: 0 };

    const where: any = { shop_id: shopId };
    if (status) {
      where.status = status;
    }
    if (customerId) {
      where.customer_id = customerId;
    }
    const dateFilter = getDateFilter(period);
    if (dateFilter) {
      where.loan_date = dateFilter;
    }

    if (search && search.trim().length > 0) {
      const q = search.trim();
      where.OR = [
        { loan_number: { contains: q, mode: 'insensitive' } },
        { customer: { name: { contains: q, mode: 'insensitive' } } },
        { customer: { phone: { contains: q, mode: 'insensitive' } } },
        { customer: { village: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || 10);
    const skip = (pageNum - 1) * limitNum;

    const [totalCount, loans] = await Promise.all([
      this.prisma.jewelLoan.count({ where }),
      this.prisma.jewelLoan.findMany({
        where,
        include: {
          customer: true,
          loanCollateralItem: true,
          loanRepayment: {
            orderBy: { created_at: 'desc' },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limitNum,
      }),
    ]);

    const items = loans.map((loan) => {
      const calculations = this.calculateLoanInterest(loan);
      return {
        ...loan,
        ...calculations,
      };
    });

    return {
      items,
      total: totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalCount / limitNum),
    };
  }

  // 3. Get Single Loan Details
  async getLoanById(shopId: string, id: string) {
    if (!shopId) throw new BadRequestException('Shop ID is required');

    const loan = await this.prisma.jewelLoan.findFirst({
      where: { id, shop_id: shopId },
      include: {
        customer: true,
        loanCollateralItem: true,
        loanRepayment: {
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!loan) throw new NotFoundException('Gold loan not found');

    const calculations = this.calculateLoanInterest(loan);

    return {
      ...loan,
      ...calculations,
    };
  }

  // 4. Record Interest / Principal Repayment or Settle Loan with Strict Validations
  async repayLoan(shopId: string, loanId: string, dto: RepayLoanDto) {
    if (!shopId) throw new BadRequestException('Shop ID is required');

    const loan = await this.prisma.jewelLoan.findFirst({
      where: { id: loanId, shop_id: shopId },
      include: { loanRepayment: true },
    });

    if (!loan) throw new NotFoundException('Gold loan not found');
    if (loan.status === LoanStatus.CLOSED) {
      throw new BadRequestException('This gold loan is already closed and settled');
    }

    const calculations = this.calculateLoanInterest(loan);
    const currentPrincipalBalance = calculations.current_principal_balance;
    const pendingInterest = calculations.pending_interest;

    const principalPaidNow = Number(dto.principal_paid) || 0;
    const interestPaidNow = Number(dto.interest_paid) || 0;
    const discountNow = Number(dto.discount_amount) || 0;

    // Strict validation: Principal paid cannot exceed remaining balance
    if (principalPaidNow > currentPrincipalBalance) {
      throw new BadRequestException(
        `Principal repayment (₹${principalPaidNow.toLocaleString('en-IN')}) cannot exceed outstanding principal balance (₹${currentPrincipalBalance.toLocaleString('en-IN')})`,
      );
    }

    // Strict validation: Interest paid cannot exceed accrued pending interest (unless 0)
    if (interestPaidNow > pendingInterest && pendingInterest >= 0) {
      throw new BadRequestException(
        `Interest payment (₹${interestPaidNow.toLocaleString('en-IN')}) cannot exceed accrued pending interest (₹${pendingInterest.toLocaleString('en-IN')})`,
      );
    }

    // 1. Create Repayment Entry
    await this.prisma.loanRepayment.create({
      data: {
        loan_id: loanId,
        principal_paid: principalPaidNow,
        interest_paid: interestPaidNow,
        discount_amount: discountNow,
        payment_date: new Date(),
        notes: dto.notes,
      },
    });

    // 2. Check if loan should be closed
    const totalPrincipalPaidSoFar = calculations.total_principal_paid;
    const newTotalPrincipalPaid = totalPrincipalPaidSoFar + principalPaidNow;
    const shouldClose = dto.is_closing || newTotalPrincipalPaid >= loan.loan_amount;

    if (shouldClose) {
      await this.prisma.jewelLoan.update({
        where: { id: loanId },
        data: { status: LoanStatus.CLOSED },
      });
    }

    return this.getLoanById(shopId, loanId);
  }

  // 5. Gold & Silver Loans Summary Dashboard Metrics with Separate Weights
  async getLoanStats(shopId: string, period?: string) {
    if (!shopId) {
      return {
        active_loans_count: 0,
        total_principal_lent: 0,
        total_gold_weight_grams: 0,
        total_silver_weight_grams: 0,
        total_interest_collected: 0,
        monthly_accruing_interest: 0,
      };
    }

    const dateFilter = getDateFilter(period);
    const whereLoan: any = { shop_id: shopId, status: LoanStatus.ACTIVE };
    if (dateFilter) {
      whereLoan.loan_date = dateFilter;
    }

    const [activeLoans, allRepayments] = await Promise.all([
      this.prisma.jewelLoan.findMany({
        where: whereLoan,
        include: {
          loanCollateralItem: true,
        },
      }),
      this.prisma.loanRepayment.findMany({
        where: {
          loan: { shop_id: shopId },
          ...(dateFilter ? { payment_date: dateFilter } : {}),
        },
        select: {
          interest_paid: true,
          principal_paid: true,
          discount_amount: true,
        },
      }),
    ]);

    let totalGoldWeight = 0;
    let totalSilverWeight = 0;

    activeLoans.forEach((loan) => {
      loan.loanCollateralItem.forEach((item) => {
        if (item.metal === 'SILVER') {
          totalSilverWeight += item.net_weight || 0;
        } else {
          totalGoldWeight += item.net_weight || 0;
        }
      });
    });

    const activeCount = activeLoans.length;
    const totalPrincipalLent = activeLoans.reduce((sum, l) => sum + l.loan_amount, 0);
    const totalInterestCollected = allRepayments.reduce((sum, r) => sum + (r.interest_paid || 0), 0);
    const monthlyAccruingInterest = activeLoans.reduce(
      (sum, l) => sum + Math.round((l.loan_amount * l.interest_rate) / 100),
      0,
    );

    return {
      active_loans_count: activeCount,
      total_principal_lent: totalPrincipalLent,
      total_gold_weight_grams: Number(totalGoldWeight.toFixed(3)),
      total_silver_weight_grams: Number(totalSilverWeight.toFixed(3)),
      total_interest_collected: totalInterestCollected,
      monthly_accruing_interest: monthlyAccruingInterest,
    };
  }
}
