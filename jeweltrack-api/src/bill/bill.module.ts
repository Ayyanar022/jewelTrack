import { Module } from '@nestjs/common';
import { BillController } from './bill.controller';
import { BillService } from './bill.service';
import { SubscriptionModule } from 'src/subscription/subscription.module';

@Module({
  imports:[SubscriptionModule] , 
  controllers: [BillController],
  providers: [BillService]
})
export class BillModule {}
