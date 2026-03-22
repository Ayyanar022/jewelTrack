import { Injectable } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class CustomerService {
    constructor(private prisma:PrismaService){}

    async create(dto:CreateCustomerDto,shopId:string){
        const customer = await this.prisma.customer.create({
           
            data:{...dto,shop_id:shopId}
        })
        return customer
    }

    async search(query:string,shopId:string){
        const customer = await this.prisma.customer.findMany({
            where:{
                shop_id:shopId,
                OR:[
                    {name:{contains:query ,mode :"insensitive"}},
                    {phone:{contains:query}},
                    {village:{contains:query,mode:'insensitive'}}
                ]
            }
        })
        return customer
    }

    async fetchAll(shopId:string){
        const customers = await this.prisma.customer.findMany({where:{shop_id:shopId }});
        return customers
    }
}
