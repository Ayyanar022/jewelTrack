import { Test, TestingModule } from '@nestjs/testing';
import { JewelleryCategoryService } from './jewellery-category.service';

describe('JewelleryCategoryService', () => {
  let service: JewelleryCategoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JewelleryCategoryService],
    }).compile();

    service = module.get<JewelleryCategoryService>(JewelleryCategoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
