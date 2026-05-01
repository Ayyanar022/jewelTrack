import { Injectable } from '@nestjs/common';
import { In_out_adj_dto } from './dto/inventoryIn.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class InventoryService {
    constructor(private prisma:PrismaService){}

    async stockIn(dto:In_out_adj_dto,shopId:string){
      return  this.prisma.inventoryStockEntry.create({
            // where :shopId,
            data:{
                shop_id :shopId ,
                category_id :dto.category_id,
                type :dto.type,
                weight :dto.weight ,
                purity :dto.purity ,
                // stockType :dto.stockType ,
                reference :dto.reference,
                 stockType: "OWN" // or "BORROW",
                // ...(dto.reference_id && {reference_id:dto.reference_id})  ,
            }
        })
    }

    // async stockOut(dto:In_out_adj_dto,shopId:string){


    // }

    // async adjustment(dto:In_out_adj_dto,shopId:string){

    // }

    async getLedger(shopId:string){
        return this.prisma.inventoryStockEntry.findMany({
            where:{shop_id:shopId},
            include : {category:{
                select:{name:true}
            }}
        
        })
    }
}
