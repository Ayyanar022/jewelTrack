import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { SubscriptionService } from 'src/subscription/subscription.service';
import { CreateSchemeDto } from './dto/create-scheme.dto';
import { DepositSchemeDto } from './dto/deposit-scheme.dto';
import { RedeemSchemeDto } from './dto/redeem-scheme.dto';
import { SchemeStatus } from '@prisma/client';

@Injectable()
export class SchemeService {
  constructor(
    private prisma: PrismaService,
    private subscriptionService: SubscriptionService,
  ) {}

  // 1. Dashboard summary stats
  async getSchemeStats(shopId: string) {
    if (!shopId) throw new BadRequestException('Shop ID is required');

    const [totalAccounts, activeAccounts, redeemedAccounts, aggActive, recentRate, aggRedeemed] =
      await Promise.all([
        this.prisma.goldSavingsAccount.count({ where: { shop_id: shopId } }),
        this.prisma.goldSavingsAccount.count({
          where: { shop_id: shopId, status: SchemeStatus.ACTIVE },
        }),
        this.prisma.goldSavingsAccount.count({
          where: { shop_id: shopId, status: SchemeStatus.REDEEMED },
        }),
        this.prisma.goldSavingsAccount.aggregate({
          where: { shop_id: shopId, status: SchemeStatus.ACTIVE },
          _sum: {
            total_cash_deposited: true,
            total_gold_grams: true,
          },
        }),
        this.prisma.rate.findFirst({
          where: { shop_id: shopId },
          orderBy: { created_at: 'desc' },
        }),
        this.prisma.goldSavingsAccount.aggregate({
          where: { shop_id: shopId },
          _sum: {
            total_gold_redeemed: true,
          },
        }),
      ]);

    const totalActiveCash = aggActive._sum.total_cash_deposited || 0;
    const totalActiveGrams = Math.round((aggActive._sum.total_gold_grams || 0) * 1000) / 1000;
    const totalRedeemedGrams = Math.round((aggRedeemed._sum.total_gold_redeemed || 0) * 1000) / 1000;
    const currentRate22k = recentRate?.rate_22k || 0;
    const currentMarketValue = Math.round(totalActiveGrams * currentRate22k);

    return {
      totalAccounts,
      activeAccounts,
      redeemedAccounts,
      totalActiveCash,
      totalActiveGrams,
      totalRedeemedGrams,
      currentRate22k,
      currentMarketValue,
    };
  }

  // 2. List all scheme accounts with pagination, search, status filter
  async getAllSchemes(
    shopId: string,
    search?: string,
    status?: string,
    page: number = 1,
    limit: number = 10,
  ) {
    if (!shopId) throw new BadRequestException('Shop ID is required');

    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, Math.min(100, limit));
    const skip = (safePage - 1) * safeLimit;

    const where: any = { shop_id: shopId };

    if (status && status !== 'ALL') {
      where.status = status as SchemeStatus;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { account_number: { contains: q, mode: 'insensitive' } },
        { customer: { name: { contains: q, mode: 'insensitive' } } },
        { customer: { phone: { contains: q, mode: 'insensitive' } } },
        { title: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, items, recentRate] = await Promise.all([
      this.prisma.goldSavingsAccount.count({ where }),
      this.prisma.goldSavingsAccount.findMany({
        where,
        include: {
          customer: {
            select: { id: true, name: true, phone: true, village: true },
          },
          _count: {
            select: { payments: true },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.rate.findFirst({
        where: { shop_id: shopId },
        orderBy: { created_at: 'desc' },
      }),
    ]);

    const rate22k = recentRate?.rate_22k || 0;

    // Enhance items with current market valuation
    const enrichedItems = items.map((acc) => {
      const marketValue = rate22k > 0 ? Math.round(acc.total_gold_grams * rate22k) : 0;
      const gainAmount = marketValue - acc.total_cash_deposited;
      return {
        ...acc,
        current_market_value: marketValue,
        customer_gain_amount: gainAmount,
      };
    });

    return {
      items: enrichedItems,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit) || 1,
      today_rate_22k: rate22k,
    };
  }

  // 3. Get single scheme account details with full payment statement / passbook
  async getSchemeById(shopId: string, id: string) {
    if (!shopId) throw new BadRequestException('Shop ID is required');

    const account = await this.prisma.goldSavingsAccount.findFirst({
      where: { id, shop_id: shopId },
      include: {
        customer: true,
        created_by: { select: { id: true, name: true, role: true } },
        payments: {
          include: {
            created_by: { select: { id: true, name: true } },
          },
          orderBy: { payment_date: 'asc' },
        },
        redemptions: {
          include: {
            created_by: { select: { id: true, name: true } },
          },
          orderBy: { redemption_date: 'asc' },
        },
      },
    });

    if (!account) {
      throw new NotFoundException('Gold scheme account not found');
    }

    const recentRate = await this.prisma.rate.findFirst({
      where: { shop_id: shopId },
      orderBy: { created_at: 'desc' },
    });

    const rate22k = recentRate?.rate_22k || 0;
    const currentMarketValue = rate22k > 0 ? Math.round(account.total_gold_grams * rate22k) : 0;
    const customerGain = currentMarketValue - account.total_cash_deposited;

    // Combine payments (deposits) and redemptions (withdrawals) into unified passbook ledger
    const allEvents: any[] = [];

    account.payments.forEach((p) => {
      allEvents.push({
        id: p.id,
        type: 'DEPOSIT',
        date: p.payment_date,
        ref_number: p.receipt_number,
        cash_in: p.cash_amount,
        cash_out: 0,
        rate_applied: p.gold_rate_applied,
        grams_in: p.grams_credited,
        grams_out: 0,
        mode: p.payment_mode,
        bill_number: null,
        notes: p.notes,
        created_by: p.created_by,
      });
    });

    account.redemptions?.forEach((r) => {
      allEvents.push({
        id: r.id,
        type: 'REDEMPTION',
        date: r.redemption_date,
        ref_number: r.voucher_number,
        cash_in: 0,
        cash_out: r.cash_equivalent,
        rate_applied: r.gold_rate_applied,
        grams_in: 0,
        grams_out: r.grams_redeemed,
        mode: 'GOLD_DEBIT',
        bill_number: r.bill_number,
        notes: r.notes,
        created_by: r.created_by,
      });
    });

    allEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningGrams = 0;
    let runningCash = 0;

    const passbookLedger = allEvents.map((ev) => {
      if (ev.type === 'DEPOSIT') {
        runningGrams += ev.grams_in;
        runningCash += ev.cash_in;
      } else {
        runningGrams -= ev.grams_out;
      }
      runningGrams = Math.round(runningGrams * 1000) / 1000;

      return {
        ...ev,
        running_gold_grams: runningGrams,
        running_cash_total: runningCash,
      };
    });

    return {
      ...account,
      payments: account.payments,
      redemptions: account.redemptions,
      ledger: passbookLedger,
      today_rate_22k: rate22k,
      current_market_value: currentMarketValue,
      customer_gain: customerGain,
    };
  }

  // 4. Create new savings scheme account (with optional initial deposit)
  async createScheme(shopId: string, userId: string, dto: CreateSchemeDto) {
    if (!shopId) throw new BadRequestException('Shop ID is required');
    await this.subscriptionService.assertActiveSubscription(shopId, 'open new gold savings schemes');
    await this.subscriptionService.assertFeature(shopId, 'gold_schemes', 'Gold Savings Schemes');

    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customer_id, shop_id: shopId },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    // 1. Fetch shop scheme prefix
    const shopSetting = await this.prisma.shopSetting.findUnique({
      where: { shop_id: shopId },
      select: { scheme_prefix: true },
    });
    const prefix = shopSetting?.scheme_prefix?.trim() || 'GS-';

    // 2. Auto-generate account number
    const count = await this.prisma.goldSavingsAccount.count({ where: { shop_id: shopId } });
    const accountNumber = `${prefix}${String(count + 1).padStart(4, '0')}`;

    // If initial deposit is provided, validate rate
    let initialGrams = 0;
    let appliedRate = 0;

    if (dto.initial_deposit && dto.initial_deposit.amount > 0) {
      if (dto.initial_deposit.custom_rate && dto.initial_deposit.custom_rate > 0) {
        appliedRate = dto.initial_deposit.custom_rate;
      } else {
        const recentRate = await this.prisma.rate.findFirst({
          where: { shop_id: shopId },
          orderBy: { created_at: 'desc' },
        });
        if (!recentRate?.rate_22k || recentRate.rate_22k <= 0) {
          throw new BadRequestException(
            "Today's 22K gold rate is not set yet. Please set daily rate first or enter custom rate.",
          );
        }
        appliedRate = recentRate.rate_22k;
      }

      initialGrams = Math.round((dto.initial_deposit.amount / appliedRate) * 1000) / 1000;
    }

    return this.prisma.$transaction(async (tx) => {
      const account = await tx.goldSavingsAccount.create({
        data: {
          shop_id: shopId,
          customer_id: dto.customer_id,
          account_number: accountNumber,
          title: dto.title?.trim() || 'Flexi 916 Gold Scheme',
          target_grams: dto.target_grams || 0,
          target_amount: dto.target_amount || 0,
          total_cash_deposited: dto.initial_deposit?.amount ? dto.initial_deposit.amount : 0,
          total_gold_grams: initialGrams,
          notes: dto.notes,
          created_by_user_id: userId,
          status: SchemeStatus.ACTIVE,
        },
      });

      if (dto.initial_deposit && dto.initial_deposit.amount > 0) {
        const receiptNumber = `RCP-${Date.now().toString().slice(-6)}`;
        await tx.goldSavingsPayment.create({
          data: {
            shop_id: shopId,
            account_id: account.id,
            receipt_number: receiptNumber,
            cash_amount: dto.initial_deposit.amount,
            gold_rate_applied: appliedRate,
            grams_credited: initialGrams,
            payment_mode: dto.initial_deposit.payment_mode || 'CASH',
            transaction_ref: dto.initial_deposit.transaction_ref,
            notes: dto.initial_deposit.notes || 'Initial opening deposit',
            created_by_user_id: userId,
          },
        });
      }

      return account;
    });
  }

  // 5. Deposit cash and convert to 916 gold grams
  async depositCash(
    shopId: string,
    userId: string,
    accountId: string,
    dto: DepositSchemeDto,
  ) {
    if (!shopId) throw new BadRequestException('Shop ID is required');
    await this.subscriptionService.assertActiveSubscription(shopId, 'record gold scheme deposits');
    await this.subscriptionService.assertFeature(shopId, 'gold_schemes', 'Gold Savings Schemes');

    const account = await this.prisma.goldSavingsAccount.findFirst({
      where: { id: accountId, shop_id: shopId },
      include: { customer: true },
    });

    if (!account) throw new NotFoundException('Gold scheme account not found');

    if (account.status !== SchemeStatus.ACTIVE) {
      throw new BadRequestException(
        `Cannot accept payments for account in ${account.status} status`,
      );
    }

    // Determine 22K gold rate
    let appliedRate = dto.gold_rate_applied;
    if (!appliedRate || appliedRate <= 0) {
      const recentRate = await this.prisma.rate.findFirst({
        where: { shop_id: shopId },
        orderBy: { created_at: 'desc' },
      });
      if (!recentRate?.rate_22k || recentRate.rate_22k <= 0) {
        throw new BadRequestException(
          "Today's 22K gold rate is not configured. Please set daily rate or enter rate manually.",
        );
      }
      appliedRate = recentRate.rate_22k;
    }

    // Precision calculation: round to 3 decimal places (milligrams)
    const gramsCredited = Math.round((dto.cash_amount / appliedRate) * 1000) / 1000;
    const receiptNumber = `RCP-${Date.now().toString().slice(-6)}`;
    const paymentDate = dto.payment_date ? new Date(dto.payment_date) : new Date();

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.goldSavingsPayment.create({
        data: {
          shop_id: shopId,
          account_id: account.id,
          receipt_number: receiptNumber,
          payment_date: paymentDate,
          cash_amount: dto.cash_amount,
          gold_rate_applied: appliedRate,
          grams_credited: gramsCredited,
          payment_mode: dto.payment_mode || 'CASH',
          transaction_ref: dto.transaction_ref,
          notes: dto.notes,
          created_by_user_id: userId,
        },
      });

      const updatedAccount = await tx.goldSavingsAccount.update({
        where: { id: account.id },
        data: {
          total_cash_deposited: { increment: dto.cash_amount },
          total_gold_grams: { increment: gramsCredited },
        },
        include: {
          customer: true,
        },
      });

      return {
        payment,
        account: updatedAccount,
        message: `Successfully credited ${gramsCredited}g of 916 Gold at ₹${appliedRate}/g for ₹${dto.cash_amount}`,
      };
    });
  }

  // 6. Redeem accumulated gold towards jewelry purchase (supports partial & full redemption)
  async redeemScheme(
    shopId: string,
    userId: string,
    accountId: string,
    dto: RedeemSchemeDto,
  ) {
    if (!shopId) throw new BadRequestException('Shop ID is required');
    await this.subscriptionService.assertActiveSubscription(shopId, 'redeem gold schemes');
    await this.subscriptionService.assertFeature(shopId, 'gold_schemes', 'Gold Savings Schemes');

    const account = await this.prisma.goldSavingsAccount.findFirst({
      where: { id: accountId, shop_id: shopId },
      include: { customer: true },
    });

    if (!account) throw new NotFoundException('Gold scheme account not found');

    if (account.status !== SchemeStatus.ACTIVE) {
      throw new BadRequestException(`Account is already ${account.status}`);
    }

    if (account.total_gold_grams <= 0) {
      throw new BadRequestException('Cannot redeem from an account with 0.000g available gold');
    }

    const requestedGrams = Math.round(Number(dto.grams_redeemed) * 1000) / 1000;
    if (!requestedGrams || requestedGrams <= 0) {
      throw new BadRequestException('Please enter valid gold grams to redeem');
    }

    if (requestedGrams > account.total_gold_grams) {
      throw new BadRequestException(
        `Cannot redeem ${requestedGrams}g. Available balance is only ${account.total_gold_grams}g.`,
      );
    }

    // Determine 22K rate applied
    let appliedRate = dto.gold_rate_applied;
    if (!appliedRate || appliedRate <= 0) {
      const recentRate = await this.prisma.rate.findFirst({
        where: { shop_id: shopId },
        orderBy: { created_at: 'desc' },
      });
      appliedRate = recentRate?.rate_22k || 0;
    }

    const cashEquivalent = Math.round(requestedGrams * appliedRate);
    const voucherNumber = `RED-${Date.now().toString().slice(-6)}`;
    const remainingGrams = Math.round((account.total_gold_grams - requestedGrams) * 1000) / 1000;
    const isFullRedemption = remainingGrams <= 0.0001;

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Redemption Record
      const redemption = await tx.goldSavingsRedemption.create({
        data: {
          shop_id: shopId,
          account_id: account.id,
          voucher_number: voucherNumber,
          grams_redeemed: requestedGrams,
          gold_rate_applied: appliedRate,
          cash_equivalent: cashEquivalent,
          bill_number: dto.bill_number?.trim() || undefined,
          notes: dto.notes?.trim() || undefined,
          created_by_user_id: userId,
        },
      });

      // 2. Update Account
      const updatedAccount = await tx.goldSavingsAccount.update({
        where: { id: account.id },
        data: {
          total_gold_grams: remainingGrams,
          total_gold_redeemed: { increment: requestedGrams },
          status: isFullRedemption ? SchemeStatus.REDEEMED : SchemeStatus.ACTIVE,
          redeemed_at: isFullRedemption ? new Date() : undefined,
          redeemed_bill_id: dto.bill_number?.trim() || account.redeemed_bill_id,
          redeemed_notes: isFullRedemption
            ? dto.notes || `Full redemption of ${requestedGrams}g`
            : account.redeemed_notes,
        },
        include: { customer: true },
      });

      return {
        redemption,
        account: updatedAccount,
        redeemed_grams: requestedGrams,
        remaining_grams: remainingGrams,
        cash_equivalent: cashEquivalent,
        is_full_redemption: isFullRedemption,
        message: isFullRedemption
          ? `Fully redeemed ${requestedGrams}g 916 Gold (Worth ₹${cashEquivalent.toLocaleString('en-IN')}). Account completed.`
          : `Partially redeemed ${requestedGrams}g 916 Gold (Worth ₹${cashEquivalent.toLocaleString('en-IN')}). Remaining balance: ${remainingGrams}g.`,
      };
    });
  }

  // 7. Close account (cash refund or cancellation)
  async closeScheme(shopId: string, accountId: string, reason?: string) {
    if (!shopId) throw new BadRequestException('Shop ID is required');

    const account = await this.prisma.goldSavingsAccount.findFirst({
      where: { id: accountId, shop_id: shopId },
    });

    if (!account) throw new NotFoundException('Gold scheme account not found');

    return this.prisma.goldSavingsAccount.update({
      where: { id: account.id },
      data: {
        status: SchemeStatus.CLOSED,
        notes: reason ? `${account.notes || ''} [Closed: ${reason}]`.trim() : account.notes,
      },
    });
  }

  // 8. Delete a mistaken deposit payment and safely rollback account totals
  async deletePayment(shopId: string, accountId: string, paymentId: string) {
    if (!shopId) throw new BadRequestException('Shop ID is required');

    const payment = await this.prisma.goldSavingsPayment.findFirst({
      where: { id: paymentId, account_id: accountId, shop_id: shopId },
      include: { account: true },
    });

    if (!payment) throw new NotFoundException('Payment record not found');

    if (payment.account.status !== SchemeStatus.ACTIVE) {
      throw new BadRequestException('Cannot modify transactions for an inactive or redeemed scheme');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.goldSavingsPayment.delete({ where: { id: payment.id } });

      const updatedAccount = await tx.goldSavingsAccount.update({
        where: { id: accountId },
        data: {
          total_cash_deposited: {
            decrement: payment.cash_amount,
          },
          total_gold_grams: {
            decrement: payment.grams_credited,
          },
        },
      });

      return {
        message: 'Payment reversed successfully',
        account: updatedAccount,
      };
    });
  }
}
