import {
    BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CreateShopSettingDto } from './dto/CreateShopSetting.Dto ';
import { UpdateShopSettingDto } from './dto/UpdateShopSetting.Dto';
import { SettingService } from './settings.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { UpdateShopTaxDto } from './dto/UpdateShopTax.dto';
import { UpdateShopInvoiceDto } from './dto/UpdateShopInvoice.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from "multer";
import { extname } from "path";
import type { Express } from "express";
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('settings')
@ApiBearerAuth('JWT-auth')
@ApiTags('Settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingController {
  constructor(private readonly settingService: SettingService) {}

  @Get('shop-profile')
  getShopProfile(@Request() req: any) {
    return this.settingService.getShopProfile(req.user.shop_id);
  }

  @Roles(Role.SHOP_OWNER, Role.SUPER_ADMIN)
  @Post('shop-profile')
  createShopProfile(
    @Body() dto: CreateShopSettingDto,    @Request() req: any,
  ) {
    return this.settingService.createShopProfile(dto, req.user.shop_id);
  }

  @Roles(Role.SHOP_OWNER, Role.SUPER_ADMIN)
  @Patch('shop-profile')
  updateShopProfile(
    @Body() dto: UpdateShopSettingDto,
    @Request() req: any,
  ) {
    return this.settingService.updateShopProfile(dto, req.user.shop_id);
  }

  // tax    
  @Roles(Role.SHOP_OWNER, Role.SUPER_ADMIN)
  @Patch("/shop-profile/tax")
    updateTax(
    @Body() dto: UpdateShopTaxDto,
    @Request() req: any,
    ) {
    return this.settingService.updateTax(dto, req.user.shop_id);
    }

    // invoice 
    @Roles(Role.SHOP_OWNER, Role.SUPER_ADMIN)
    @Patch("/shop-profile/invoice")
    updateInvoice(
    @Body() dto: UpdateShopInvoiceDto,
    @Request() req: any,
    ) {
    return this.settingService.updateInvoice(dto, req.user.shop_id);
    }

    @Roles(Role.SHOP_OWNER, Role.SUPER_ADMIN)
    @Post("/shop-profile/logo")
    @UseInterceptors(
    FileInterceptor("logo", {
        storage: diskStorage({
        destination: "./uploads/logo",
        filename: (req: any, file, cb) => {
        const ext = extname(file.originalname);

        cb(null, `shop_${req.user?.shop_id}${ext}`);
        },
        }),

        limits: {
        fileSize: 2 * 1024 * 1024,
        },

        fileFilter(req, file, cb) {
        if (
            !file.mimetype.match(
            /image\/(jpeg|jpg|png|webp)/
            )
        ) {
            return cb(
            new BadRequestException(
                "Only JPG, PNG and WEBP are allowed."
            ),
            false
            );
        }

        cb(null, true);
        },
    })
    )
    uploadLogo(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
    ) {
    return this.settingService.uploadLogo(
        file,
        req.user.shop_id,
    );
    }
}