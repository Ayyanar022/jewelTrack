import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { ApprovalService } from './approval.service';
import { CreateApprovalMemoDto } from './dto/create-approval.dto';
import { ReturnApprovalMemoDto } from './dto/return-approval.dto';

@ApiBearerAuth('JWT-auth')
@ApiTags('B2B Jewellery Approvals (ஜாங்கட்)')
@Controller('approval')
@UseGuards(JwtAuthGuard)
export class ApprovalController {
  constructor(private approvalService: ApprovalService) {}

  @Post('outward')
  @ApiOperation({ summary: 'Create new Approval Outward Voucher (ஜாங்கட் அவுட்)' })
  createOutward(@Body() dto: CreateApprovalMemoDto, @Request() req: any) {
    return this.approvalService.createOutward(req.user.shop_id, req.user.id, dto);
  }

  @Post('return/:id')
  @ApiOperation({ summary: 'Process Approval Return (IN) and auto-calculate sold Pure Gold' })
  processReturn(@Param('id') id: string, @Body() dto: ReturnApprovalMemoDto, @Request() req: any) {
    return this.approvalService.processReturn(req.user.shop_id, id, dto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get summary statistics of active approvals and pending pure gold' })
  getStats(@Request() req: any) {
    return this.approvalService.getApprovalStats(req.user.shop_id);
  }

  @Get('all')
  @ApiOperation({ summary: 'List all approval vouchers with filters and pagination' })
  findAll(
    @Query('search') search: string,
    @Query('dealer_id') dealerId: string,
    @Query('status') status: string,
    @Query('period') period: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Request() req: any,
  ) {
    return this.approvalService.getAllApprovals(
      req.user.shop_id,
      search,
      dealerId,
      status,
      Number(page) || 1,
      Number(limit) || 10,
      period,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single approval voucher by ID' })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.approvalService.getApprovalById(req.user.shop_id, id);
  }
}
