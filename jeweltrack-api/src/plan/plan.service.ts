import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class PlanService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreatePlanDto) {
    return this.prisma.plan.create({ data: dto });
  }

  findAll(activeOnly = false) {
    return this.prisma.plan.findMany({
      where: activeOnly ? { is_active: true } : undefined,
      orderBy: { price: 'asc' },
    });
  }

  async findOne(id: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async update(id: string, dto: UpdatePlanDto) {
    await this.findOne(id);
    return this.prisma.plan.update({ where: { id }, data: dto });
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.plan.update({ where: { id }, data: { is_active: false } });
  }
}