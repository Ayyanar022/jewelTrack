import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

export const DURATION_DISCOUNTS: Record<number, number> = {
  1: 0,    // 0% discount
  3: 5,    // 5% discount
  6: 10,   // 10% discount
  12: 20,  // 20% discount
};

@Injectable()
export class SubscriptionService {
  private razorpay: Razorpay | null = null;

  constructor(private prisma: PrismaService) {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (key_id && key_secret) {
      this.razorpay = new Razorpay({
        key_id,
        key_secret,
      });
    }
  }

  // Helper to ensure Razorpay is configured
  private getRazorpayClient(): Razorpay {
    if (!this.razorpay) {
      const key_id = process.env.RAZORPAY_KEY_ID;
      const key_secret = process.env.RAZORPAY_KEY_SECRET;
      if (!key_id || !key_secret) {
        throw new BadRequestException('Razorpay credentials are not configured on the server');
      }
      this.razorpay = new Razorpay({ key_id, key_secret });
    }
    return this.razorpay;
  }

  // 1. Create Razorpay Order for Subscription Upgrade
  async createRazorpayOrder(dto: CreateSubscriptionDto, shopId: string) {
    if (!shopId) throw new BadRequestException('Shop ID required for subscription');

    const plan = await this.prisma.plan.findUnique({ where: { id: dto.plan_id } });
    if (!plan || !plan.is_active) throw new BadRequestException('Invalid or inactive plan');

    const duration = Number(dto.duration_months) || 1;
    const discount = DURATION_DISCOUNTS[duration] ?? 0;
    const total = plan.price * duration;
    const amount_paid = Math.round(total - (total * discount) / 100);

    const razorpay = this.getRazorpayClient();

    // Create Razorpay Order
    const options = {
      amount: amount_paid, // in paise (e.g. 1919000 paise = Rs. 19,190)
      currency: 'INR',
      receipt: `sub_${shopId.slice(0, 8)}_${Date.now().toString().slice(-8)}`,
      notes: {
        shop_id: shopId,
        plan_id: plan.id,
        plan_name: plan.name,
        duration_months: duration.toString(),
      },
    };

    const order = await razorpay.orders.create(options);

    return {
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
      plan_name: plan.name,
      duration_months: duration,
      discount_percent: discount,
      amount_inr: (order.amount as number) / 100,
    };
  }

  // 2. Verify Razorpay Payment Signature & Activate Plan
  async verifyRazorpayPayment(dto: VerifyPaymentDto, shopId: string) {
    if (!shopId) throw new BadRequestException('Shop ID required for subscription');

    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) throw new BadRequestException('Razorpay secret is not configured on the server');

    // Cryptographic Signature Verification
    const body = `${dto.razorpay_order_id}|${dto.razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', key_secret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== dto.razorpay_signature) {
      throw new BadRequestException('Invalid payment signature. Transaction verification failed.');
    }

    const plan = await this.prisma.plan.findUnique({ where: { id: dto.plan_id } });
    if (!plan || !plan.is_active) throw new BadRequestException('Invalid or inactive plan');

    const duration = Number(dto.duration_months) || 1;
    const discount = DURATION_DISCOUNTS[duration] ?? 0;
    const total = plan.price * duration;
    const amount_paid = Math.round(total - (total * discount) / 100);

    const periodStart = new Date();
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + duration);

    // Create Active Subscription Record
    const subscription = await this.prisma.subscription.create({
      data: {
        shop_id: shopId,
        plan_id: plan.id,
        duration_months: duration,
        amount_paid,
        discount_percent: discount,
        razorpay_subscription_id: dto.razorpay_payment_id,
        status: 'ACTIVE',
        current_period_start: periodStart,
        current_period_end: periodEnd,
      },
      include: { plan: true },
    });

    // Update cached fields on Shop model
    await this.prisma.shop.update({
      where: { id: shopId },
      data: {
        subscription_plan: plan.name,
        subscription_status: 'ACTIVE',
      },
    });

    return subscription;
  }

  // 3. Fallback / Direct Activation (for development / testing without gateway)
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

    await this.prisma.shop.update({
      where: { id: shopId },
      data: {
        subscription_plan: plan.name,
        subscription_status: 'ACTIVE',
      },
    });

    return subscription;
  }

  // 4. Get Current Subscription with live usage stats
  async getCurrent(shopId: string) {
    if (!shopId) {
      return null;
    }

    let sub = await this.prisma.subscription.findFirst({
      where: { shop_id: shopId },
      orderBy: { created_at: 'desc' },
      include: { plan: true },
    });

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

    const now = new Date();
    const endDate = sub.current_period_end ? new Date(sub.current_period_end) : new Date();
    const diffMs = endDate.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const isExpired = diffMs <= 0;

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

  // 5. Pricing Table with calculated durations & discounts
  async getPricingTable() {
    const plans = await this.prisma.plan.findMany({
      where: { is_active: true },
      orderBy: { price: 'asc' },
    });

    return plans.map((plan) => {
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

  // 6. Platform Trial Days configuration (Super Admin managed)
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

  // 7. Platform Trial Plan configuration (Super Admin managed)
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

  // 8. Limit and Feature checks
  async checkLimit(shopId: string, key: 'max_users' | 'max_invoices_per_month' | 'max_branches') {
    if (!shopId) return null;
    const sub = await this.getCurrent(shopId);
    if (!sub) return null;
    return (sub.plan as any)[key];
  }

  async hasFeature(shopId: string, featureKey: string): Promise<boolean> {
    if (!shopId) return true;
    const sub = await this.getCurrent(shopId);
    if (!sub) return true;
    const features = sub.plan.features as Record<string, boolean> | null;
    return !!features?.[featureKey];
  }
}