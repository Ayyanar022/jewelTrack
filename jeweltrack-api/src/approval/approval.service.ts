import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { SubscriptionService } from 'src/subscription/subscription.service';
import { CreateApprovalMemoDto } from './dto/create-approval.dto';
import { ReturnApprovalMemoDto } from './dto/return-approval.dto';
import { ApprovalItemStatus, ApprovalStatus } from '@prisma/client';

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
export class ApprovalService {
  constructor(
    private prisma: PrismaService,
    private subscriptionService: SubscriptionService,
  ) {}

  // 1. Create Approval Outward Memo (ஜாங்கட் அவுட்)
  async createOutward(shopId: string, userId: string, dto: CreateApprovalMemoDto) {
    if (!shopId) throw new BadRequestException('Shop ID is required');
    await this.subscriptionService.assertActiveSubscription(shopId, 'issue approval outward memos');
    await this.subscriptionService.assertFeature(shopId, 'dealer_approval', 'Dealer Approvals & Jangat Memos');

    const dealer = await this.prisma.dealer.findFirst({
      where: { id: dto.dealer_id, shop_id: shopId },
    });
    if (!dealer) throw new NotFoundException('Dealer / Partner not found');

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('At least one item is required in the approval memo');
    }

    // Validate weights
    for (const item of dto.items) {
      if (Number(item.net_weight_out) > Number(item.gross_weight_out)) {
        throw new BadRequestException(
          `Item "${item.item_name}" Net Weight (${item.net_weight_out}g) cannot exceed Gross Weight (${item.gross_weight_out}g)`,
        );
      }
      if (Number(item.pieces_out) <= 0 || Number(item.net_weight_out) <= 0) {
        throw new BadRequestException(`Valid pieces and weight are required for "${item.item_name}"`);
      }
    }

    // Generate unique sequential voucher number (e.g. JNG-001, JNG-002)
    const count = await this.prisma.approvalMemo.count({ where: { shop_id: shopId } });
    const voucher_number = `JNG-${String(count + 1).padStart(3, '0')}`;

    const memoDate = dto.date ? new Date(dto.date) : new Date();

    return this.prisma.approvalMemo.create({
      data: {
        shop_id: shopId,
        dealer_id: dto.dealer_id,
        voucher_number,
        status: ApprovalStatus.OUTWARD,
        date: memoDate,
        notes: dto.notes?.trim() || null,
        created_by_user_id: userId || null,
        items: {
          create: dto.items.map((item) => {
            const touchVal = Number(item.touch) || 0;
            const netOut = Number(item.net_weight_out);

            return {
              category_id: item.category_id || null,
              item_name: item.item_name.trim(),
              metal: item.metal || 'GOLD',
              purity: item.purity || 'K22',
              touch: touchVal,
              pieces_out: Number(item.pieces_out),
              gross_weight_out: Number(item.gross_weight_out),
              net_weight_out: netOut,
              pieces_in: 0,
              gross_weight_in: 0,
              net_weight_in: 0,
              sold_pieces: 0,
              sold_net_weight: 0,
              pure_weight: 0,
              hallmark_charge: Number(item.hallmark_charge) || 0,
              status: ApprovalItemStatus.PENDING,
            };
          }),
        },
      },
      include: {
        dealer: true,
        items: {
          include: { category: true },
        },
      },
    });
  }

  // 2. Process Approval Return (Inward) & Compute Sold Pure Gold (ஜாங்கட் இன்)
  async processReturn(shopId: string, approvalId: string, dto: ReturnApprovalMemoDto) {
    if (!shopId) throw new BadRequestException('Shop ID is required');
    await this.subscriptionService.assertActiveSubscription(shopId, 'process approval returns');
    await this.subscriptionService.assertFeature(shopId, 'dealer_approval', 'Dealer Approvals & Jangat Memos');

    const memo = await this.prisma.approvalMemo.findFirst({
      where: { id: approvalId, shop_id: shopId },
      include: { items: true, dealer: true },
    });
    if (!memo) throw new NotFoundException('Approval memo not found');

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('No return items provided');
    }

    const now = new Date();

    // Process each return item
    for (const ret of dto.items) {
      const existingItem = memo.items.find((i) => i.id === ret.item_id);
      if (!existingItem) {
        throw new BadRequestException(`Item with ID ${ret.item_id} not found in this approval memo`);
      }

      const newPiecesIn = Number(ret.pieces_in || 0);
      const newGrossIn = Number(ret.gross_weight_in || 0);
      const newNetIn = Number(ret.net_weight_in || 0);

      if (newNetIn > Number(existingItem.net_weight_out)) {
        throw new BadRequestException(
          `Returned Net Weight (${newNetIn}g) cannot exceed Issued Weight (${existingItem.net_weight_out}g) for "${existingItem.item_name}"`,
        );
      }

      const soldPieces = Math.max(0, existingItem.pieces_out - newPiecesIn);
      const soldNetWeight = Math.max(0, Number((Number(existingItem.net_weight_out) - newNetIn).toFixed(3)));
      const updatedHallmark =
        ret.hallmark_charge !== undefined
          ? Number(ret.hallmark_charge) || 0
          : Number(existingItem.hallmark_charge) || 0;
      const rawPure = (soldNetWeight * (Number(existingItem.touch) || 0)) / 100;
      const pureWeight = Number((rawPure + (soldNetWeight > 0 ? updatedHallmark : 0)).toFixed(3));

      let itemStatus: ApprovalItemStatus = ApprovalItemStatus.PENDING;
      if (newPiecesIn >= existingItem.pieces_out && newNetIn >= Number(existingItem.net_weight_out)) {
        itemStatus = ApprovalItemStatus.RETURNED;
      } else if (newPiecesIn === 0 && newNetIn === 0) {
        itemStatus = ApprovalItemStatus.SOLD;
      } else if (soldNetWeight > 0) {
        itemStatus = ApprovalItemStatus.PARTIAL;
      }

      await this.prisma.approvalItem.update({
        where: { id: existingItem.id },
        data: {
          pieces_in: newPiecesIn,
          gross_weight_in: newGrossIn,
          net_weight_in: newNetIn,
          sold_pieces: soldPieces,
          sold_net_weight: soldNetWeight,
          pure_weight: pureWeight,
          hallmark_charge: updatedHallmark,
          status: itemStatus,
          returned_at: now,
        },
      });
    }

    // Refresh memo items to determine overall memo status
    const updatedItems = await this.prisma.approvalItem.findMany({
      where: { approval_id: approvalId },
    });

    const isAllResolved = updatedItems.every(
      (item) => item.status === ApprovalItemStatus.RETURNED || item.status === ApprovalItemStatus.SOLD || item.status === ApprovalItemStatus.PARTIAL,
    );

    const overallStatus: ApprovalStatus = isAllResolved ? ApprovalStatus.COMPLETED : ApprovalStatus.PARTIAL_RETURN;

    return this.prisma.approvalMemo.update({
      where: { id: approvalId },
      data: {
        status: overallStatus,
        notes: dto.notes ? `${memo.notes ? memo.notes + ' | ' : ''}${dto.notes}` : memo.notes,
      },
      include: {
        dealer: true,
        items: {
          include: { category: true },
        },
      },
    });
  }

  // 3. List All Approval Memos with Filters & Pagination
  async getAllApprovals(
    shopId: string,
    search?: string,
    dealerId?: string,
    status?: string,
    page = 1,
    limit = 10,
    period?: string,
  ) {
    if (!shopId) return { items: [], total: 0, page: 1, totalPages: 1 };

    const pageNum = Math.max(1, Number(page) || 1);
    const take = Math.max(1, Number(limit) || 10);
    const skip = (pageNum - 1) * take;

    const dateFilter = getDateFilter(period);

    const where: any = {
      shop_id: shopId,
      ...(dealerId && dealerId !== 'ALL' && { dealer_id: dealerId }),
      ...(status && status !== 'ALL' && { status: status as ApprovalStatus }),
      ...(dateFilter && { date: dateFilter }),
      ...(search?.trim() && {
        OR: [
          { voucher_number: { contains: search.trim(), mode: 'insensitive' } },
          { dealer: { name: { contains: search.trim(), mode: 'insensitive' } } },
          { dealer: { shop_name: { contains: search.trim(), mode: 'insensitive' } } },
          { dealer: { phone: { contains: search.trim(), mode: 'insensitive' } } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.approvalMemo.findMany({
        where,
        include: {
          dealer: true,
          items: {
            include: { category: true },
          },
          created_by: { select: { id: true, name: true } },
        },
        orderBy: { date: 'desc' },
        skip,
        take,
      }),
      this.prisma.approvalMemo.count({ where }),
    ]);

    // Enriched with summary totals for UI display
    const enriched = items.map((memo) => {
      let totalPiecesOut = 0;
      let totalNetWeightOut = 0;
      let totalPiecesIn = 0;
      let totalNetWeightIn = 0;
      let totalSoldNetWeight = 0;
      let totalPureWeight = 0;

      memo.items.forEach((it) => {
        totalPiecesOut += Number(it.pieces_out || 0);
        totalNetWeightOut += Number(it.net_weight_out || 0);
        totalPiecesIn += Number(it.pieces_in || 0);
        totalNetWeightIn += Number(it.net_weight_in || 0);
        totalSoldNetWeight += Number(it.sold_net_weight || 0);
        totalPureWeight += Number(it.pure_weight || 0);
      });

      return {
        ...memo,
        summary: {
          total_pieces_out: totalPiecesOut,
          total_net_weight_out: Number(totalNetWeightOut.toFixed(3)),
          total_pieces_in: totalPiecesIn,
          total_net_weight_in: Number(totalNetWeightIn.toFixed(3)),
          total_sold_net_weight: Number(totalSoldNetWeight.toFixed(3)),
          total_pure_weight: Number(totalPureWeight.toFixed(3)),
        },
      };
    });

    return {
      items: enriched,
      total,
      page: pageNum,
      limit: take,
      totalPages: Math.ceil(total / take) || 1,
    };
  }

  // 4. Get Approval Memo Details by ID
  async getApprovalById(shopId: string, id: string) {
    if (!shopId) throw new BadRequestException('Shop ID is required');

    const memo = await this.prisma.approvalMemo.findFirst({
      where: { id, shop_id: shopId },
      include: {
        dealer: true,
        items: {
          include: { category: true },
        },
        created_by: { select: { id: true, name: true } },
      },
    });

    if (!memo) throw new NotFoundException('Approval memo not found');

    const shopProfile = await this.prisma.shopSetting.findUnique({
      where: { shop_id: shopId },
    });

    return {
      ...memo,
      shop_profile: shopProfile,
    };
  }

  // 5. Overall Approval Dashboard Stats
  async getApprovalStats(shopId: string) {
    if (!shopId) return null;

    const activeMemos = await this.prisma.approvalMemo.findMany({
      where: {
        shop_id: shopId,
        status: { in: [ApprovalStatus.OUTWARD, ApprovalStatus.PARTIAL_RETURN] },
      },
      include: { items: true },
    });

    let pendingOutwardPieces = 0;
    let pendingOutwardNetWeight = 0;

    activeMemos.forEach((memo) => {
      memo.items.forEach((it) => {
        if (it.status === ApprovalItemStatus.PENDING || it.status === ApprovalItemStatus.PARTIAL) {
          pendingOutwardPieces += Math.max(0, it.pieces_out - it.pieces_in);
          pendingOutwardNetWeight += Math.max(0, Number(it.net_weight_out) - Number(it.net_weight_in));
        }
      });
    });

    const allItems = await this.prisma.approvalItem.findMany({
      where: {
        approval: { shop_id: shopId },
      },
    });

    const allSettlements = await this.prisma.dealerSettlement.findMany({
      where: { shop_id: shopId },
    });

    const totalPureSold = allItems.reduce((sum, it) => sum + Number(it.pure_weight || 0), 0);
    const totalPureReceived = allSettlements.reduce((sum, s) => sum + Number(s.pure_weight_received || 0), 0);

    const totalDealers = await this.prisma.dealer.count({
      where: { shop_id: shopId, is_active: true },
    });

    return {
      total_dealers: totalDealers,
      active_approval_memos_count: activeMemos.length,
      pending_outward_pieces: pendingOutwardPieces,
      pending_outward_net_weight: Number(pendingOutwardNetWeight.toFixed(3)),
      total_pure_sold_all_time: Number(totalPureSold.toFixed(3)),
      total_pure_received_all_time: Number(totalPureReceived.toFixed(3)),
      net_pending_pure_gold_overall: Number((totalPureSold - totalPureReceived).toFixed(3)),
    };
  }
}
