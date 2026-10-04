import { Module } from '@nestjs/common';
import { JewelleryCategoryController } from './jewellery-category.controller';
import { JewelleryCategoryService } from './jewellery-category.service';
import { SubscriptionModule } from 'src/subscription/subscription.module';

@Module({
  imports: [SubscriptionModule],
  controllers: [JewelleryCategoryController],
  providers: [JewelleryCategoryService],
})
export class JewelleryCategoryModule {}
