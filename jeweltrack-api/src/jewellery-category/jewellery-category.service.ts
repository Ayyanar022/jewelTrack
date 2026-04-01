import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateJewelleryCatdto } from './dto/create_jewell_category.dto';

@Injectable()
export class JewelleryCategoryService {
    constructor(private prisma:PrismaService){}

    async create(dto:CreateJewelleryCatdto , shopId:string){
       return    this.prisma.jewelleryCategory.create({
            data : {...dto , shop_id:shopId}
           })

            
    }

    async getAll(shopId:string){
        return this.prisma.jewelleryCategory.findMany({
            where:{shop_id:shopId}
        })
    }

    async update(dto:CreateJewelleryCatdto,catID:string, shopID:string){
        return this.prisma.jewelleryCategory.update({
            where:{shop_id:shopID, id:catID},
            data:dto,
        })
    }

    async delete(catID:string , shopID:string){
        return this.prisma.jewelleryCategory.delete({
            where:{shop_id:shopID , id:catID}
        })
    }
}
