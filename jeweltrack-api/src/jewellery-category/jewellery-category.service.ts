import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateJewelleryCatdto } from './dto/create_jewell_category.dto';
import { SubscriptionService } from 'src/subscription/subscription.service';

@Injectable()
export class JewelleryCategoryService {
    constructor(
        private prisma: PrismaService,
        private subscriptionService: SubscriptionService,
    ) {}

    private formatName(name?: string) {
        if (!name) return name;
        return name
            .trim()
            .split(/\s+/)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(' ');
    }

    async create(dto: CreateJewelleryCatdto, shopId: string) {
        await this.subscriptionService.assertActiveSubscription(shopId, 'create jewellery categories');
        const formattedDto = {
            ...dto,
            ...(dto.name && { name: this.formatName(dto.name) }),
        };
        return this.prisma.jewelleryCategory.create({
            data: { ...formattedDto, shop_id: shopId },
        });
    }

    async getAll(shopId: string) {
        return this.prisma.jewelleryCategory.findMany({
            where: { shop_id: shopId },
        });
    }

    async update(dto: CreateJewelleryCatdto, catID: string, shopID: string) {
        await this.subscriptionService.assertActiveSubscription(shopID, 'modify jewellery categories');
        const formattedDto = {
            ...dto,
            ...(dto.name && { name: this.formatName(dto.name) }),
        };
        return this.prisma.jewelleryCategory.updateMany({
            where: { shop_id: shopID, id: catID },
            data: formattedDto,
        });
    }

    async delete(catID: string, shopID: string) {
        await this.subscriptionService.assertActiveSubscription(shopID, 'delete jewellery categories');
        return this.prisma.jewelleryCategory.deleteMany({
            where: { shop_id: shopID, id: catID },
        });
    }
}
