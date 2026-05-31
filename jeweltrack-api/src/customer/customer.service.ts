import { Injectable } from '@nestjs/common';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/create-customer.dto';
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

    async updateCustomer(dto:UpdateCustomerDto , customerId:string , shopId:string){
       await this.prisma.customer.update({
            where : {
                id:customerId ,
                shop_id:shopId
            },
            data:  {
                        name: dto.name,
                        phone: dto.phone,
                        village: dto.village,
                        address: dto.address,
                        }
        })

        return {success:true , message:"Customer update successfully"}

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
