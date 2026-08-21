import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PlanService } from './plan.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
// TODO: swap to SuperAdminGuard once super admin auth is built
// import { UseGuards } from '@nestjs/common';
// import { JwtAuthGuard } from 'src/common/guards/jwt.guard';

@ApiBearerAuth('JWT-auth')
@ApiTags('Plans')
@Controller('plans')
export class PlanController {
  constructor(private planService: PlanService) {}

  @Post()
  create(@Body() dto: CreatePlanDto) {
    return this.planService.create(dto);
  }

  @Get()
  findAll() {
    return this.planService.findAll(true); // active plans only — public/shop-facing
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.planService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.planService.update(id, dto);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.planService.deactivate(id);
  }
}