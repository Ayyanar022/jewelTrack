import { Injectable } from '@nestjs/common';
import { In_out_adj_dto } from './dto/inventoryIn.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class InventoryService {
    constructor(private prisma:PrismaService){}

    async stockIn(dto:In_out_adj_dto, shopId:string, userId?: string){
      return  this.prisma.inventoryStockEntry.create({
            data:{
                shop_id :shopId ,
                category_id :dto.category_id,
                type :dto.type,
                weight :dto.weight ,
                purity :dto.purity ,
                reference :dto.reference,
                stockType: "OWN",
                created_by_user_id: userId || null,
            }
        })
    }

    async inventoryStatus(shopId:string){
        const data =await  this.prisma.$queryRaw `
        select 
            c.id as category_id,
            c.name as category_name,
            i.purity,
            sum(case when i.type='IN' then i.weight else 0 end ) as total_in ,
            sum(case when i.type='OUT' then i.weight else 0 end ) as total_out ,
            sum(case when i."stockType"='BORROW' then i.weight else 0 end )as total_borrowed,
            ( 
            sum(case when i.type='IN' then i.weight else 0 end ) -
             sum(case when i.type='OUT' then i.weight else 0 end )
            ) as balance

            from "InventoryStockEntry" i 
            join "JewelleryCategory" c 
            on c.id = i.category_id

            where i.shop_id= ${shopId}

            group by c.id, c.name, i.purity
            order by c.name , i.purity desc
            
            `
        // console.log(data)
            return data

    }

    // async adjustment(dto:In_out_adj_dto,shopId:string){

    // }

    async getLedger(page: number = 1, shopId: string, limitNum: number = 10) {
        const pageNum = Math.max(1, Number(page) || 1);
        const limit = Math.max(1, Number(limitNum) || 10);
        const skip = (pageNum - 1) * limit;

        const [items, total] = await Promise.all([
            this.prisma.inventoryStockEntry.findMany({
                where: { shop_id: shopId },
                include: {
                    category: {
                        select: { name: true },
                    },
                },
                orderBy: { created_at: "desc" },
                skip,
                take: limit,
            }),
            this.prisma.inventoryStockEntry.count({
                where: { shop_id: shopId },
            }),
        ]);

        return {
            items,
            total,
            page: pageNum,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
        };
    }
}
