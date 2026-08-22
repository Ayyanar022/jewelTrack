import { Body, Controller, Get, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';

@ApiBearerAuth('JWT-auth')
@ApiTags('Subscriptions')
@Controller('subscription')
export class SubscriptionController {
  constructor(private subscriptionService: SubscriptionService) {}

  // 1. Pricing table with all duration options & discount calculations
  @Get('pricing-table')
  getPricingTable() {
    return this.subscriptionService.getPricingTable();
  }

  // 2. Current Shop Subscription with usage meters & days left
  @UseGuards(JwtAuthGuard)
  @Get('current')
  getCurrent(@Request() req: any) {
    if (!req.user?.shop_id) {
      return null;
    }
    return this.subscriptionService.getCurrent(req.user.shop_id);
  }

  // 3. Create Razorpay Order
  @UseGuards(JwtAuthGuard)
  @Post('create-order')
  createOrder(@Body() dto: CreateSubscriptionDto, @Request() req: any) {
    return this.subscriptionService.createRazorpayOrder(dto, req.user.shop_id);
  }

  // 4. Verify Razorpay Payment Signature & Activate Subscription
  @UseGuards(JwtAuthGuard)
  @Post('verify-payment')
  verifyPayment(@Body() dto: VerifyPaymentDto, @Request() req: any) {
    return this.subscriptionService.verifyRazorpayPayment(dto, req.user.shop_id);
  }

  // 5. Fallback / Direct Activation (for testing)
  @UseGuards(JwtAuthGuard)
  @Post()
  subscribe(@Body() dto: CreateSubscriptionDto, @Request() req: any) {
    return this.subscriptionService.subscribe(dto, req.user.shop_id);
  }

  // 6. Super Admin: Get Default Trial Duration in Days
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Get('config/trial-days')
  getTrialDays() {
    return this.subscriptionService.getTrialDays();
  }

  // 7. Super Admin: Update Default Trial Duration in Days
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Patch('config/trial-days')
  updateTrialDays(@Body('days') days: number) {
    return this.subscriptionService.updateTrialDays(Number(days));
  }

  // 8. Super Admin: Get Default Trial Plan Tier
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Get('config/trial-plan')
  getTrialPlan() {
    return this.subscriptionService.getTrialPlan();
  }

  // 9. Super Admin: Update Default Trial Plan Tier
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Patch('config/trial-plan')
  updateTrialPlan(@Body('plan_name') planName: string) {
    return this.subscriptionService.updateTrialPlan(planName);
  }
}