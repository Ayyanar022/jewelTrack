import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiBearerAuth('JWT-auth')
@ApiTags('Users & Staff')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Roles(Role.SHOP_OWNER, Role.MANAGER, Role.SUPER_ADMIN)
  @Get('staff')
  getStaff(@Request() req: any) {
    return this.userService.getStaff(req.user.shop_id);
  }

  @Roles(Role.SHOP_OWNER, Role.SUPER_ADMIN)
  @Post('staff')
  createStaff(@Request() req: any, @Body() dto: CreateStaffDto) {
    return this.userService.createStaff(req.user.shop_id, dto);
  }

  @Roles(Role.SHOP_OWNER, Role.SUPER_ADMIN)
  @Patch('staff/:id/toggle-status')
  toggleStatus(@Request() req: any, @Param('id') id: string) {
    return this.userService.toggleStaffStatus(req.user.shop_id, id);
  }

  // Super Admin: List all shops
  @Roles(Role.SUPER_ADMIN)
  @Get('admin/shops')
  getAllShops() {
    return this.userService.getAllShops();
  }
}
