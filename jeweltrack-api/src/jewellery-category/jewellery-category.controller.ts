import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Request, UseGuards } from '@nestjs/common';
import { JewelleryCategoryService } from './jewellery-category.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { CreateJewelleryCatdto } from './dto/create_jewell_category.dto';

@ApiBearerAuth('JWT-auth')
@ApiTags('Category')
@UseGuards(JwtAuthGuard)
@Controller('jewellery-category')
export class JewelleryCategoryController {
    constructor (private jwellerycategoryService :JewelleryCategoryService){}

    @Post()
    craete(@Body() dto:CreateJewelleryCatdto , @Request() req:any ){
        return this.jwellerycategoryService.create(dto, req.user.shop_id)
    }

    @Get()
    fetchAll(@Request() req:any){
        return this.jwellerycategoryService.getAll(req.user.shop_id);
    }

    @Patch(':id')
    update(@Body() dto:CreateJewelleryCatdto , @Param('id') catId:string,   @Request() req:any){
        return this.jwellerycategoryService.update(dto,catId, req.user.shop_id)
    }

    @Delete(':id')
    delete(@Param('id') catId:string , @Request() req:any){
        return this.jwellerycategoryService.delete(catId, req.user.shop_id)
    }
}
