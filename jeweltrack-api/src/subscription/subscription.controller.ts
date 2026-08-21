import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@ApiBearerAuth('JWT-auth')
@ApiTags('Subscriptions')
@Controller('subscription')
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  constructor(private subscriptionService: SubscriptionService) {}

  @Post()
  subscribe(@Body() dto: CreateSubscriptionDto, @Request() req: any) {
    return this.subscriptionService.subscribe(dto, req.user.id);
  }

  @Get('current')
  getCurrent(@Request() req: any) {
    return this.subscriptionService.getCurrent(req.user.id);
  }
}