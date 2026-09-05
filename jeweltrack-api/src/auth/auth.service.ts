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
    ) { }

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

        // 3. Get trial duration from PlatformConfig (default 14 days)
        const trialConfig = await this.prisma.platformConfig.findUnique({
            where: { key: 'DEFAULT_TRIAL_DAYS' }
        });
        const trialDays = trialConfig ? parseInt(trialConfig.value, 10) || 14 : 14;

        // 4. Find default trial plan (read from PlatformConfig, default to PRO)
        const trialPlanConfig = await this.prisma.platformConfig.findUnique({
            where: { key: 'DEFAULT_TRIAL_PLAN' }
        });
        const configuredPlanName = trialPlanConfig?.value || 'PRO';

        const trialPlan = (await this.prisma.plan.findUnique({ where: { name: configuredPlanName } }))
            || (await this.prisma.plan.findUnique({ where: { name: 'PRO' } }))
            || (await this.prisma.plan.findFirst({ where: { is_active: true } }));

        if (!trialPlan) {
            throw new ConflictException('System setup incomplete: Default subscription plan not found');
        }

        const trialStart = new Date();
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + trialDays);

        // 5. Create Shop + User + Trial Subscription + initial ShopSetting in a transaction
        const result = await this.prisma.$transaction(async (tx) => {
            const shop = await tx.shop.create({
                data: {
                    name: dto.name,
                    subscription_plan: trialPlan.name,
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

            // Create 14-day trial subscription record
            await tx.subscription.create({
                data: {
                    shop_id: shop.id,
                    plan_id: trialPlan.id,
                    duration_months: Math.ceil(trialDays / 30) || 1,
                    amount_paid: 0,
                    discount_percent: 0,
                    status: 'TRIAL',
                    current_period_start: trialStart,
                    current_period_end: trialEnd,
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

