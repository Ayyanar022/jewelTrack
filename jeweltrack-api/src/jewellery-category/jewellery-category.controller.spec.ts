import { Test, TestingModule } from '@nestjs/testing';
import { JewelleryCategoryController } from './jewellery-category.controller';

describe('JewelleryCategoryController', () => {
  let controller: JewelleryCategoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JewelleryCategoryController],
    }).compile();

    controller = module.get<JewelleryCategoryController>(JewelleryCategoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
