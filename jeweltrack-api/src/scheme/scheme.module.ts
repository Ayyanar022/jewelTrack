import { Module } from '@nestjs/common';
import { SchemeService } from './scheme.service';
import { SchemeController } from './scheme.controller';
import { SubscriptionModule } from 'src/subscription/subscription.module';

@Module({
  imports: [SubscriptionModule],
  controllers: [SchemeController],
  providers: [SchemeService],
  exports: [SchemeService],
})
export class SchemeModule {}
