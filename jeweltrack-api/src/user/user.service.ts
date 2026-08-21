import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { SubscriptionService } from 'src/subscription/subscription.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private subscriptionService: SubscriptionService,
  ) {}

  async getStaff(shopId: string) {
    return this.prisma.user.findMany({
      where: { shop_id: shopId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        is_active: true,
        created_at: true,
        _count: {
          select: {
            createdBills: true,
            createdPayments: true,
          },
        },
      },
      orderBy: { created_at: 'asc' },
    });
  }

  async createStaff(shopId: string, dto: CreateStaffDto) {
    // 1. Check max_users plan limit
    const maxUsers = await this.subscriptionService.checkLimit(shopId, 'max_users');
    if (maxUsers !== null) {
      const currentCount = await this.prisma.user.count({
        where: { shop_id: shopId, is_active: true },
      });

      if (currentCount >= maxUsers) {
        throw new ForbiddenException(
          `Staff limit (${maxUsers} users) reached for your current plan. Please upgrade to add more staff.`,
        );
      }
    }

    // 2. Check if phone is already registered
    const existing = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (existing) {
      throw new ConflictException('Phone number already registered to a user');
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 4. Create staff user
    return this.prisma.user.create({
      data: {
        shop_id: shopId,
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        password: hashedPassword,
        role: dto.role,
        is_active: true,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        is_active: true,
        created_at: true,
      },
    });
  }

  async toggleStaffStatus(shopId: string, staffUserId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: staffUserId, shop_id: shopId },
    });

    if (!user) {
      throw new NotFoundException('Staff member not found');
    }

    if (user.role === Role.SHOP_OWNER) {
      throw new ForbiddenException('Cannot deactivate the shop owner account');
    }

    return this.prisma.user.update({
      where: { id: staffUserId },
      data: { is_active: !user.is_active },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        is_active: true,
      },
    });
  }

  // Super Admin: List all shops and their owner / staff metrics
  async getAllShops() {
    return this.prisma.shop.findMany({
      include: {
        users: {
          select: {
            id: true,
            name: true,
            phone: true,
            role: true,
            is_active: true,
          },
        },
        _count: {
          select: {
            bill: true,
            customer: true,
            users: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }
}
