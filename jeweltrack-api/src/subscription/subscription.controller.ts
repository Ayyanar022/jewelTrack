import { Body, Controller, Get, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

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

  // 3. Upgrade / Subscribe to Plan
  @UseGuards(JwtAuthGuard)
  @Post()
  subscribe(@Body() dto: CreateSubscriptionDto, @Request() req: any) {
    return this.subscriptionService.subscribe(dto, req.user.shop_id);
  }

  // 4. Super Admin: Get Default Trial Duration in Days
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Get('config/trial-days')
  getTrialDays() {
    return this.subscriptionService.getTrialDays();
  }

  // 5. Super Admin: Update Default Trial Duration in Days
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Patch('config/trial-days')
  updateTrialDays(@Body('days') days: number) {
    return this.subscriptionService.updateTrialDays(Number(days));
  }

  // 6. Super Admin: Get Default Trial Plan Tier (e.g. "PRO")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Get('config/trial-plan')
  getTrialPlan() {
    return this.subscriptionService.getTrialPlan();
  }

  // 7. Super Admin: Update Default Trial Plan Tier
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Patch('config/trial-plan')
  updateTrialPlan(@Body('plan_name') planName: string) {
    return this.subscriptionService.updateTrialPlan(planName);
  }
}