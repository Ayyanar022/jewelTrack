import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';

export const DURATION_DISCOUNTS: Record<number, number> = {
  1: 0,    // 0% discount
  3: 5,    // 5% discount
  6: 10,   // 10% discount
  12: 20,  // 20% discount
};

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  // 1. Subscribe / Upgrade Plan (Direct activation for now until payment gateway is connected)
  async subscribe(dto: CreateSubscriptionDto, shopId: string) {
    if (!shopId) throw new BadRequestException('Shop ID required for subscription');

    const plan = await this.prisma.plan.findUnique({ where: { id: dto.plan_id } });
    if (!plan || !plan.is_active) throw new BadRequestException('Invalid or inactive plan');

    const duration = Number(dto.duration_months) || 1;
    const discount = DURATION_DISCOUNTS[duration] ?? 0;
    const total = plan.price * duration;
    const amount_paid = Math.round(total - (total * discount) / 100);

    const periodStart = new Date();
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + duration);

    // Create new active subscription record
    const subscription = await this.prisma.subscription.create({
      data: {
        shop_id: shopId,
        plan_id: plan.id,
        duration_months: duration,
        amount_paid,
        discount_percent: discount,
        status: 'ACTIVE',
        current_period_start: periodStart,
        current_period_end: periodEnd,
      },
      include: { plan: true },
    });

    // Sync cached fields on Shop model
    await this.prisma.shop.update({
      where: { id: shopId },
      data: {
        subscription_plan: plan.name,
        subscription_status: 'ACTIVE',
      },
    });

    return subscription;
  }

  // 2. Get Current Subscription with live usage stats (Staff count, Monthly Bills count, Days Left)
  async getCurrent(shopId: string) {
    if (!shopId) {
      return null;
    }

    let sub = await this.prisma.subscription.findFirst({
      where: { shop_id: shopId },
      orderBy: { created_at: 'desc' },
      include: { plan: true },
    });

    // If no subscription record found, create a fallback trial linked to configured trial plan
    if (!sub) {
      const trialPlanName = await this.getTrialPlan();
      const trialPlan = (await this.prisma.plan.findUnique({ where: { name: trialPlanName } }))
        || (await this.prisma.plan.findFirst({ where: { is_active: true } }));

      if (trialPlan) {
        const trialDays = await this.getTrialDays();
        const start = new Date();
        const end = new Date();
        end.setDate(end.getDate() + trialDays);

        sub = await this.prisma.subscription.create({
          data: {
            shop_id: shopId,
            plan_id: trialPlan.id,
            duration_months: 1,
            amount_paid: 0,
            discount_percent: 0,
            status: 'TRIAL',
            current_period_start: start,
            current_period_end: end,
          },
          include: { plan: true },
        });

        // update shop cache
        await this.prisma.shop.update({
          where: { id: shopId },
          data: {
            subscription_plan: trialPlan.name,
            subscription_status: 'TRIAL',
          },
        });
      }
    }

    if (!sub) return null;

    // Calculate days remaining
    const now = new Date();
    const endDate = sub.current_period_end ? new Date(sub.current_period_end) : new Date();
    const diffMs = endDate.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const isExpired = diffMs <= 0;

    // Fetch live usage stats for this shop
    const currentUsers = await this.prisma.user.count({
      where: { shop_id: shopId, is_active: true },
    });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const currentMonthlyBills = await this.prisma.bill.count({
      where: { shop_id: shopId, created_at: { gte: startOfMonth } },
    });

    return {
      ...sub,
      days_remaining: daysRemaining,
      is_expired: isExpired,
      usage: {
        users_count: currentUsers,
        max_users: sub.plan.max_users,
        monthly_bills_count: currentMonthlyBills,
        max_invoices_per_month: sub.plan.max_invoices_per_month,
        max_branches: sub.plan.max_branches,
      },
    };
  }

  // 3. Pricing Table with calculated durations & discounts
  async getPricingTable() {
    const plans = await this.prisma.plan.findMany({
      where: { is_active: true },
      orderBy: { price: 'asc' },
    });

    return plans.map((plan) => {
      // Calculate prices for 1, 3, 6, 12 months
      const pricingOptions = Object.entries(DURATION_DISCOUNTS).map(([durationStr, discount]) => {
        const duration = Number(durationStr);
        const originalPrice = plan.price * duration;
        const offerPrice = Math.round(originalPrice - (originalPrice * discount) / 100);
        const monthlyEquivalent = Math.round(offerPrice / duration);
        const savings = originalPrice - offerPrice;

        return {
          duration_months: duration,
          discount_percent: discount,
          original_price_paise: originalPrice,
          offer_price_paise: offerPrice,
          monthly_equivalent_paise: monthlyEquivalent,
          savings_paise: savings,
          original_price_inr: originalPrice / 100,
          offer_price_inr: offerPrice / 100,
          monthly_equivalent_inr: monthlyEquivalent / 100,
          savings_inr: savings / 100,
        };
      });

      return {
        ...plan,
        base_price_inr: plan.price / 100,
        pricing_options: pricingOptions,
      };
    });
  }

  // 4. Platform Trial Days configuration (Super Admin managed)
  async getTrialDays(): Promise<number> {
    const config = await this.prisma.platformConfig.findUnique({
      where: { key: 'DEFAULT_TRIAL_DAYS' },
    });
    return config ? parseInt(config.value, 10) || 14 : 14;
  }

  async updateTrialDays(days: number) {
    if (days < 1) throw new BadRequestException('Trial days must be at least 1');
    return this.prisma.platformConfig.upsert({
      where: { key: 'DEFAULT_TRIAL_DAYS' },
      update: { value: days.toString() },
      create: {
        key: 'DEFAULT_TRIAL_DAYS',
        value: days.toString(),
        description: 'Default free trial duration in days for newly registered shops',
      },
    });
  }

  // 5. Platform Trial Plan configuration (Super Admin managed: e.g. "BASIC", "PRO", "ENTERPRISE")
  async getTrialPlan(): Promise<string> {
    const config = await this.prisma.platformConfig.findUnique({
      where: { key: 'DEFAULT_TRIAL_PLAN' },
    });
    return config?.value || 'PRO';
  }

  async updateTrialPlan(planName: string) {
    const plan = await this.prisma.plan.findUnique({ where: { name: planName } });
    if (!plan) throw new BadRequestException(`Plan "${planName}" does not exist`);

    return this.prisma.platformConfig.upsert({
      where: { key: 'DEFAULT_TRIAL_PLAN' },
      update: { value: planName },
      create: {
        key: 'DEFAULT_TRIAL_PLAN',
        value: planName,
        description: 'Default subscription plan assigned during free trial',
      },
    });
  }

  // 6. Check limit helper for guards and controllers
  async checkLimit(shopId: string, key: 'max_users' | 'max_invoices_per_month' | 'max_branches') {
    if (!shopId) return null;
    const sub = await this.getCurrent(shopId);
    if (!sub) return null;
    const limit = (sub.plan as any)[key];
    return limit; // null = unlimited
  }

  // 7. Check feature flag helper
  async hasFeature(shopId: string, featureKey: string): Promise<boolean> {
    if (!shopId) return true; // Super admin / unrestricted
    const sub = await this.getCurrent(shopId);
    if (!sub) return true;
    const features = sub.plan.features as Record<string, boolean> | null;
    return !!features?.[featureKey];
  }
}