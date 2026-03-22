import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateRateDto } from './dto/create-rate.dto';

@Injectable()
export class RateService {
    constructor (private prisma:PrismaService 
        // ,private rate:RateService
    ){}

  async  createNewRate(dto:CreateRateDto,shopId:string){
        const newRate =await this.prisma.rate.create({
            data: {...dto,shop_id:shopId}
        })

        return newRate
    }

    async getHistory(shopId:string){
        const rateHistory = await this.prisma.rate.findMany({
            where:{shop_id:shopId},
            orderBy:{created_at:"desc"}
        })
        return rateHistory
    }

    // recent rate
    async getRecentRate(shopId:string){
        const recentRate = await this.prisma.rate.findFirst({
                where:{shop_id:shopId},
                orderBy:{created_at:'desc'}
        })

        return recentRate
    }

}