import { Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
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

    @Get('inventory-total')
    inventoryTotal( @Request() req){
        return this.invenToryService.inventoryStatus(req.user.id)
    }

  

    @Get('inventory-ledger')
    getLedger(@Query('page') page , @Request() req){
        return this.invenToryService.getLedger(page ,req.user.id)
    }
    
}
