import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { InventoryService } from './inventory.service';
import { In_out_adj_dto } from './dto/inventoryIn.dto';

@ApiBearerAuth('JWT-auth')
@ApiTags('Inventory')
@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
    constructor(private invenToryService:InventoryService ){}

    @Post('in')
    stockIn(@Body() dto:In_out_adj_dto , @Request() req){
        console.log("hello---------")
        return this.invenToryService.stockIn(dto,req.user.id)
    }

    // @Post('out')
    // stockOut(@Body() dto:In_out_adj_dto , @Request() req){
    //     return 
    // }

    // @Post('Adjustment')
    // adjustment(@Body() dto:In_out_adj_dto , @Request() req){
    //     return 
    // }

    @Get('inventory-ledger')
    getLedger(@Request() req){
        return this.invenToryService.getLedger(req.user.id)
    }
    
}
