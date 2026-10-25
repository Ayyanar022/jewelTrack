import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { SubscriptionService } from 'src/subscription/subscription.service';
import { CreateDealerDto } from './dto/create-dealer.dto';
import { CreateSettlementDto } from './dto/create-settlement.dto';

@Injectable()
export class DealerService {
  constructor(
    private prisma: PrismaService,
    private subscriptionService: SubscriptionService,
  ) {}

  // 1. Create Dealer
  async createDealer(shopId: string, dto: CreateDealerDto) {
    if (!shopId) throw new BadRequestException('Shop ID is required');
    await this.subscriptionService.assertActiveSubscription(shopId, 'add new dealer accounts');

    return this.prisma.dealer.create({
      data: {
        shop_id: shopId,
        name: dto.name.trim(),
        shop_name: dto.shop_name.trim(),
        phone: dto.phone.trim(),
        address: dto.address?.trim() || null,
        city: dto.city?.trim() || null,
        opening_pure_balance: Number(dto.opening_pure_balance) || 0,
        notes: dto.notes?.trim() || null,
      },
    });
  }

  // 2. List Dealers with Live Pure Gold Running Ledger Balance
  async getDealers(shopId: string, search?: string, page = 1, limit = 10) {
    if (!shopId) return { items: [], total: 0, page: 1, totalPages: 1 };

    const pageNum = Math.max(1, Number(page) || 1);
    const take = Math.max(1, Number(limit) || 10);
    const skip = (pageNum - 1) * take;

    const where: any = {
      shop_id: shopId,
      is_active: true,
      ...(search?.trim() && {
        OR: [
          { name: { contains: search.trim(), mode: 'insensitive' } },
          { shop_name: { contains: search.trim(), mode: 'insensitive' } },
          { phone: { contains: search.trim(), mode: 'insensitive' } },
          { city: { contains: search.trim(), mode: 'insensitive' } },
        ],
      }),
    };

    const [dealers, total] = await Promise.all([
      this.prisma.dealer.findMany({
        where,
        include: {
          approvalMemos: {
            include: {
              items: true,
            },
          },
          settlements: true,
        },
        orderBy: { updated_at: 'desc' },
        skip,
        take,
      }),
      this.prisma.dealer.count({ where }),
    ]);

    const enrichedDealers = dealers.map((d) => {
      let totalSoldPureGrams = 0;
      let pendingOutwardPieces = 0;
      let pendingOutwardNetWeight = 0;
      let activeApprovalsCount = 0;

      d.approvalMemos.forEach((memo) => {
        if (memo.status === 'OUTWARD' || memo.status === 'PARTIAL_RETURN') {
          activeApprovalsCount += 1;
        }

        memo.items.forEach((item) => {
          totalSoldPureGrams += Number(item.pure_weight || 0);

          const remPieces = Math.max(0, Number(item.pieces_out || 0) - Number(item.pieces_in || 0));
          const remWeight = Math.max(0, Number(item.net_weight_out || 0) - Number(item.net_weight_in || 0));

          if (item.status === 'PENDING' || item.status === 'PARTIAL') {
            pendingOutwardPieces += remPieces;
            pendingOutwardNetWeight += remWeight;
          }
        });
      });

      const totalPureReceived = d.settlements.reduce(
        (sum, s) => sum + Number(s.pure_weight_received || 0),
        0,
      );

      const netPendingPureGold = Number(
        (
          Number(d.opening_pure_balance || 0) +
          totalSoldPureGrams -
          totalPureReceived
        ).toFixed(3),
      );

      return {
        id: d.id,
        name: d.name,
        shop_name: d.shop_name,
        phone: d.phone,
        address: d.address,
        city: d.city,
        opening_pure_balance: Number(d.opening_pure_balance || 0),
        notes: d.notes,
        created_at: d.created_at,
        updated_at: d.updated_at,
        stats: {
          total_sold_pure_grams: Number(totalSoldPureGrams.toFixed(3)),
          total_pure_received: Number(totalPureReceived.toFixed(3)),
          net_pending_pure_gold: netPendingPureGold,
          pending_outward_pieces: pendingOutwardPieces,
          pending_outward_net_weight: Number(pendingOutwardNetWeight.toFixed(3)),
          active_approvals_count: activeApprovalsCount,
        },
      };
    });

    return {
      items: enrichedDealers,
      total,
      page: pageNum,
      limit: take,
      totalPages: Math.ceil(total / take) || 1,
    };
  }

  // 3. Get Single Dealer by ID with complete ledger summary
  async getDealerById(shopId: string, dealerId: string) {
    if (!shopId) throw new BadRequestException('Shop ID is required');

    const dealer = await this.prisma.dealer.findFirst({
      where: { id: dealerId, shop_id: shopId },
      include: {
        approvalMemos: {
          include: {
            items: {
              include: { category: true },
            },
          },
          orderBy: { date: 'desc' },
        },
        settlements: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!dealer) throw new NotFoundException('Dealer not found');

    let totalSoldPureGrams = 0;
    let pendingOutwardPieces = 0;
    let pendingOutwardNetWeight = 0;

    dealer.approvalMemos.forEach((memo) => {
      memo.items.forEach((item) => {
        totalSoldPureGrams += Number(item.pure_weight || 0);
        if (item.status === 'PENDING' || item.status === 'PARTIAL') {
          pendingOutwardPieces += Math.max(0, Number(item.pieces_out || 0) - Number(item.pieces_in || 0));
          pendingOutwardNetWeight += Math.max(0, Number(item.net_weight_out || 0) - Number(item.net_weight_in || 0));
        }
      });
    });

    const totalPureReceived = dealer.settlements.reduce(
      (sum, s) => sum + Number(s.pure_weight_received || 0),
      0,
    );

    const netPendingPureGold = Number(
      (
        Number(dealer.opening_pure_balance || 0) +
        totalSoldPureGrams -
        totalPureReceived
      ).toFixed(3),
    );

    return {
      ...dealer,
      stats: {
        total_sold_pure_grams: Number(totalSoldPureGrams.toFixed(3)),
        total_pure_received: Number(totalPureReceived.toFixed(3)),
        net_pending_pure_gold: netPendingPureGold,
        pending_outward_pieces: pendingOutwardPieces,
        pending_outward_net_weight: Number(pendingOutwardNetWeight.toFixed(3)),
      },
    };
  }

  // 4. Update Dealer
  async updateDealer(shopId: string, dealerId: string, dto: Partial<CreateDealerDto>) {
    await this.subscriptionService.assertActiveSubscription(shopId, 'update dealer accounts');

    const dealer = await this.prisma.dealer.findFirst({
      where: { id: dealerId, shop_id: shopId },
    });
    if (!dealer) throw new NotFoundException('Dealer not found');

    return this.prisma.dealer.update({
      where: { id: dealerId },
      data: {
        ...(dto.name && { name: dto.name.trim() }),
        ...(dto.shop_name && { shop_name: dto.shop_name.trim() }),
        ...(dto.phone && { phone: dto.phone.trim() }),
        ...(dto.address !== undefined && { address: dto.address?.trim() || null }),
        ...(dto.city !== undefined && { city: dto.city?.trim() || null }),
        ...(dto.opening_pure_balance !== undefined && { opening_pure_balance: Number(dto.opening_pure_balance) || 0 }),
        ...(dto.notes !== undefined && { notes: dto.notes?.trim() || null }),
      },
    });
  }

  // 5. Delete / Deactivate Dealer
  async deleteDealer(shopId: string, dealerId: string) {
    const dealer = await this.prisma.dealer.findFirst({
      where: { id: dealerId, shop_id: shopId },
    });
    if (!dealer) throw new NotFoundException('Dealer not found');

    return this.prisma.dealer.update({
      where: { id: dealerId },
      data: { is_active: false },
    });
  }

  // 6. Record Pure Gold / Cash Settlement
  async createSettlement(shopId: string, userId: string, dto: CreateSettlementDto) {
    if (!shopId) throw new BadRequestException('Shop ID is required');
    await this.subscriptionService.assertActiveSubscription(shopId, 'record dealer pure gold settlements');

    const dealer = await this.prisma.dealer.findFirst({
      where: { id: dto.dealer_id, shop_id: shopId },
    });
    if (!dealer) throw new NotFoundException('Dealer not found');

    // Calculate pure weight credited
    let pureGrams = Number(dto.pure_weight_received) || 0;

    if (!pureGrams && dto.payment_mode === 'CASH' && dto.cash_amount && dto.pure_gold_rate) {
      pureGrams = Number((Number(dto.cash_amount) / Number(dto.pure_gold_rate)).toFixed(3));
    } else if (!pureGrams && dto.payment_mode === 'SCRAP_GOLD' && dto.gross_weight && dto.touch) {
      pureGrams = Number(((Number(dto.gross_weight) * Number(dto.touch)) / 100).toFixed(3));
    }

    if (pureGrams <= 0) {
      throw new BadRequestException('Valid pure gold received weight (in grams) is required');
    }

    const count = await this.prisma.dealerSettlement.count({ where: { shop_id: shopId } });
    const settlement_number = `STL-${String(count + 1).padStart(3, '0')}`;

    const settlementDate = dto.date ? new Date(dto.date) : new Date();

    return this.prisma.dealerSettlement.create({
      data: {
        shop_id: shopId,
        dealer_id: dto.dealer_id,
        settlement_number,
        payment_mode: dto.payment_mode,
        pure_weight_received: Number(pureGrams.toFixed(3)),
        gross_weight: dto.gross_weight ? Number(dto.gross_weight) : null,
        touch: dto.touch ? Number(dto.touch) : null,
        cash_amount: dto.cash_amount ? Number(dto.cash_amount) : null,
        pure_gold_rate: dto.pure_gold_rate ? Number(dto.pure_gold_rate) : null,
        date: settlementDate,
        notes: dto.notes?.trim() || null,
        created_by_user_id: userId || null,
      },
      include: {
        dealer: true,
      },
    });
  }

  // 7. Get Settlements for a dealer
  async getSettlements(shopId: string, dealerId?: string) {
    const validDealerId = dealerId && dealerId !== 'ALL' ? dealerId : undefined;
    return this.prisma.dealerSettlement.findMany({
      where: {
        shop_id: shopId,
        ...(validDealerId && { dealer_id: validDealerId }),
      },
      include: {
        dealer: true,
        created_by: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  // 8. Generate Dealer Weekly / Custom Period Statement (வாரக் கணக்கு பில்)
  async getWeeklyStatement(shopId: string, dealerId: string, fromDateStr?: string, toDateStr?: string) {
    if (!shopId) throw new BadRequestException('Shop ID is required');

    const dealer = await this.prisma.dealer.findFirst({
      where: { id: dealerId, shop_id: shopId },
    });
    if (!dealer) throw new NotFoundException('Dealer not found');

    const shopProfile = await this.prisma.shopSetting.findUnique({
      where: { shop_id: shopId },
    });

    // Determine statement date range (default to current week if omitted)
    const now = new Date();
    let fromDate: Date;
    let toDate: Date;

    if (fromDateStr && toDateStr) {
      fromDate = new Date(fromDateStr);
      fromDate.setHours(0, 0, 0, 0);
      toDate = new Date(toDateStr);
      toDate.setHours(23, 59, 59, 999);
    } else {
      // Default: Last 7 days / Current running week
      toDate = new Date(now);
      toDate.setHours(23, 59, 59, 999);
      fromDate = new Date(now);
      fromDate.setDate(fromDate.getDate() - 7);
      fromDate.setHours(0, 0, 0, 0);
    }

    // Step 1: Compute Prior Period Balances (before fromDate)
    const priorApprovalItems = await this.prisma.approvalItem.findMany({
      where: {
        approval: {
          shop_id: shopId,
          dealer_id: dealerId,
          date: { lt: fromDate },
        },
      },
    });

    const priorSoldPureGrams = priorApprovalItems.reduce(
      (sum, item) => sum + Number(item.pure_weight || 0),
      0,
    );

    const priorSettlements = await this.prisma.dealerSettlement.findMany({
      where: {
        shop_id: shopId,
        dealer_id: dealerId,
        date: { lt: fromDate },
      },
    });

    const priorSettledPureGrams = priorSettlements.reduce(
      (sum, s) => sum + Number(s.pure_weight_received || 0),
      0,
    );

    const previousPendingPureGold = Number(
      (
        Number(dealer.opening_pure_balance || 0) +
        priorSoldPureGrams -
        priorSettledPureGrams
      ).toFixed(3),
    );

    // Step 2: Period Approval Transactions (between fromDate and toDate)
    const periodApprovalMemos = await this.prisma.approvalMemo.findMany({
      where: {
        shop_id: shopId,
        dealer_id: dealerId,
        date: { gte: fromDate, lte: toDate },
      },
      include: {
        items: {
          include: { category: true },
        },
      },
      orderBy: { date: 'asc' },
    });

    const transactionRows: any[] = [];
    let periodTotalGrossOut = 0;
    let periodTotalNetOut = 0;
    let periodTotalNetIn = 0;
    let periodTotalSoldNet = 0;
    let periodTotalSoldPure = 0;

    periodApprovalMemos.forEach((memo) => {
      memo.items.forEach((item) => {
        const grossOut = Number(item.gross_weight_out || 0);
        const netOut = Number(item.net_weight_out || 0);
        const netIn = Number(item.net_weight_in || 0);
        const soldNet = Number(item.sold_net_weight || 0);
        const pureWeight = Number(item.pure_weight || 0);

        periodTotalGrossOut += grossOut;
        periodTotalNetOut += netOut;
        periodTotalNetIn += netIn;
        periodTotalSoldNet += soldNet;
        periodTotalSoldPure += pureWeight;

        transactionRows.push({
          memo_id: memo.id,
          voucher_number: memo.voucher_number,
          date: memo.date,
          item_name: item.item_name,
          category_name: item.category?.name || 'Jewellery',
          metal: item.metal,
          purity: item.purity,
          touch: item.touch,
          pieces_out: item.pieces_out,
          gross_weight_out: grossOut,
          net_weight_out: netOut,
          pieces_in: item.pieces_in,
          net_weight_in: netIn,
          sold_pieces: item.sold_pieces,
          sold_net_weight: soldNet,
          hallmark_charge: Number(item.hallmark_charge || 0),
          pure_weight: pureWeight,
          status: item.status,
        });
      });
    });

    // Step 3: Period Settlements (Receipts)
    const periodSettlements = await this.prisma.dealerSettlement.findMany({
      where: {
        shop_id: shopId,
        dealer_id: dealerId,
        date: { gte: fromDate, lte: toDate },
      },
      orderBy: { date: 'asc' },
    });

    const periodTotalPureReceived = periodSettlements.reduce(
      (sum, s) => sum + Number(s.pure_weight_received || 0),
      0,
    );

    // Step 4: Gross & Net Closing Balance
    const grossTotalPureDue = Number((previousPendingPureGold + periodTotalSoldPure).toFixed(3));
    const netClosingPendingPureGold = Number(
      (grossTotalPureDue - periodTotalPureReceived).toFixed(3),
    );

    return {
      dealer: {
        id: dealer.id,
        name: dealer.name,
        shop_name: dealer.shop_name,
        phone: dealer.phone,
        address: dealer.address,
        city: dealer.city,
      },
      shop_profile: shopProfile,
      period: {
        from: fromDate,
        to: toDate,
      },
      summary: {
        previous_pending_pure_gold: previousPendingPureGold,
        period_total_gross_out: Number(periodTotalGrossOut.toFixed(3)),
        period_total_net_out: Number(periodTotalNetOut.toFixed(3)),
        period_total_net_in: Number(periodTotalNetIn.toFixed(3)),
        period_total_sold_net: Number(periodTotalSoldNet.toFixed(3)),
        period_total_sold_pure: Number(periodTotalSoldPure.toFixed(3)),
        gross_total_pure_due: grossTotalPureDue,
        period_total_pure_received: Number(periodTotalPureReceived.toFixed(3)),
        net_closing_pending_pure_gold: netClosingPendingPureGold,
      },
      transactions: transactionRows,
      settlements: periodSettlements,
    };
  }
}
