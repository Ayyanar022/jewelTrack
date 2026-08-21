import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';

const DISCOUNTS: Record<number, number> = { 1: 0, 3: 5, 6: 10, 12: 20 };

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  async subscribe(dto: CreateSubscriptionDto, shopId: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id: dto.plan_id } });
    if (!plan || !plan.is_active) throw new BadRequestException('Invalid or inactive plan');

    const discount = DISCOUNTS[dto.duration_months] ?? 0;
    const total = plan.price * dto.duration_months;
    const amount_paid = Math.round(total - (total * discount) / 100);

    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + dto.duration_months);

    // TODO: create Razorpay subscription here, store razorpay_subscription_id

    const subscription = await this.prisma.subscription.create({
      data: {
        shop_id: shopId,
        plan_id: plan.id,
        duration_months: dto.duration_months,
        amount_paid,
        discount_percent: discount,
        status: 'ACTIVE',
        current_period_start: new Date(),
        current_period_end: periodEnd,
      },
    });

    // sync cache fields on Shop
    await this.prisma.shop.update({
      where: { id: shopId },
      data: {
        subscription_plan: plan.name,
        subscription_status: 'ACTIVE',
      },
    });

    return subscription;
  }

  async getCurrent(shopId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { shop_id: shopId },
      orderBy: { created_at: 'desc' },
      include: { plan: true },
    });
    if (!sub) throw new NotFoundException('No subscription found');
    return sub;
  }

  async checkLimit(shopId: string, key: 'max_users' | 'max_invoices_per_month' | 'max_branches') {
    const sub = await this.getCurrent(shopId);
    const limit = (sub.plan as any)[key];
    return limit; // null = unlimited
  }

  async hasFeature(shopId: string, featureKey: string): Promise<boolean> {
    const sub = await this.getCurrent(shopId);
    const features = sub.plan.features as Record<string, boolean> | null;
    return !!features?.[featureKey];
  }
}