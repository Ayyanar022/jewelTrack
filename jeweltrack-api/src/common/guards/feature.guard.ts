import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionService } from 'src/subscription/subscription.service';

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(private reflector: Reflector, private subscriptionService: SubscriptionService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const feature = this.reflector.get<string>('feature', ctx.getHandler());
    if (!feature) return true;

    const req = ctx.switchToHttp().getRequest();
    const has = await this.subscriptionService.hasFeature(req.user.id, feature);
    if (!has) throw new ForbiddenException(`Upgrade required for "${feature}"`);
    return true;
  }
}