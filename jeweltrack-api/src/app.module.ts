import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { RateModule } from './rate/rate.module';
import { CustomerModule } from './customer/customer.module';

@Module({
  imports: [AuthModule,PrismaModule, RateModule, CustomerModule],
  controllers: [AppController],
  providers: [AppService],

})
export class AppModule {}
