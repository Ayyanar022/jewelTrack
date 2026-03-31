import { Module } from '@nestjs/common';
import { JewelleryCategoryController } from './jewellery-category.controller';
import { JewelleryCategoryService } from './jewellery-category.service';

@Module({
  controllers: [JewelleryCategoryController],
  providers: [JewelleryCategoryService]
})
export class JewelleryCategoryModule {}
