import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService
    ) {}

    async register(dto: RegisterDto) {
        // 1. Check if phone is already registered as a user
        const existing = await this.prisma.user.findFirst({
            where: { phone: dto.phone }
        });

        if (existing) {
            throw new ConflictException('Phone number already registered');
        }

        // 2. Hash password
        const hashPassword = await bcrypt.hash(dto.password, 10);

        // 3. Create Shop + User + initial ShopSetting in a transaction
        const result = await this.prisma.$transaction(async (tx) => {
            const shop = await tx.shop.create({
                data: {
                    name: dto.name,
                    subscription_plan: 'TRIAL',
                    subscription_status: 'TRIAL',
                }
            });

            const user = await tx.user.create({
                data: {
                    shop_id: shop.id,
                    name: dto.owner_name,
                    phone: dto.phone,
                    password: hashPassword,
                    role: Role.SHOP_OWNER,
                }
            });

            await tx.shopSetting.create({
                data: {
                    shop_id: shop.id,
                    shop_name: dto.name,
                    owner_name: dto.owner_name,
                    phone: dto.phone,
                }
            });

            return { shop, user };
        });

        return { message: "Shop registered successfully", shopId: result.shop.id, userId: result.user.id };
    }

    async login(dto: LoginDto) {
        // 1. Check user by phone
        const user = await this.prisma.user.findFirst({
            where: { phone: dto.phone },
            include: { shop: true }
        });

        if (!user) {
            throw new UnauthorizedException("Invalid Password or Phone");
        }

        if (!user.is_active) {
            throw new UnauthorizedException("Your account has been deactivated. Please contact your shop administrator.");
        }

        // 2. Compare password
        const passwordMatch = await bcrypt.compare(dto.password, user.password);

        if (!passwordMatch) {
            throw new UnauthorizedException("Invalid Password or Phone");
        }

        // 3. Generate token
        const payload = {
            sub: user.id,
            shopId: user.shop_id,
            role: user.role,
            phone: user.phone
        };
        const token = await this.jwtService.signAsync(payload);

        return {
            access_token: token,
            user: {
                id: user.id,
                name: user.name,
                phone: user.phone,
                email: user.email,
                role: user.role,
                shop_id: user.shop_id,
                shop: user.shop,
            },
            // Backwards compatibility for existing frontend calls reading res.data.shop
            shop: user.shop ? {
                ...user.shop,
                owner_name: user.name,
                phone: user.phone,
            } : null,
        };
    }
}

