import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { UpdateShopTaxDto } from './dto/UpdateShopTax.dto';
import { UpdateShopInvoiceDto } from './dto/UpdateShopInvoice.dto';

@Injectable()
export class SettingService {
  constructor(private prisma: PrismaService) {}

  async getShopProfile(shopId: string) {
    if (!shopId) return null;
    return this.prisma.shopSetting.findUnique({
      where: {
        shop_id: shopId,
      },
    });
  }

  async createShopProfile(dto: any, shopId: string) {
    if (!shopId) throw new BadRequestException('Shop ID is required');
    const existing = await this.prisma.shopSetting.findUnique({
      where: {
        shop_id: shopId,
      },
    });

    if (existing) {
      return {
        message: 'Shop profile already exists.',
      };
    }

    return this.prisma.shopSetting.create({
      data: {
        ...dto,
        shop_id: shopId,
      },
    });
  }

  async updateShopProfile(dto: any, shopId: string) {
    if (!shopId) throw new BadRequestException('Shop ID is required');
    const existing = await this.prisma.shopSetting.findUnique({
      where: {
        shop_id: shopId,
      },
    });

    if (!existing) {
      throw new NotFoundException('Shop profile not found');
    }

    return this.prisma.shopSetting.update({
      where: {
        shop_id: shopId,
      },
      data: dto,
    });
  }

  // tax
  async updateTax(dto: UpdateShopTaxDto, shopId: string) {
    if (!shopId) throw new BadRequestException('Shop ID is required');
    return this.prisma.shopSetting.update({
      where: {
        shop_id: shopId,
      },
      data: dto,
    });
  }

  // invoice
  async updateInvoice(dto: UpdateShopInvoiceDto, shopId: string) {
    if (!shopId) throw new BadRequestException('Shop ID is required');
    return this.prisma.shopSetting.update({
      where: {
        shop_id: shopId,
      },
      data: dto,
    });
  }

  // logo upload
  async uploadLogo(file: Express.Multer.File, shopId: string) {
    if (!shopId) throw new BadRequestException('Shop ID is required');
    const image = `/uploads/logo/${file.filename}`;

    await this.prisma.shopSetting.update({
      where: {
        shop_id: shopId,
      },
      data: {
        logo_url: image,
      },
    });

    return {
      message: 'Logo uploaded successfully',
      logo_url: image,
    };
  }
}