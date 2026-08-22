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
       await this.prisma.customer.updateMany({
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

    async findById(customerId: string, shopId: string) {
        return this.prisma.customer.findFirst({
            where: { id: customerId, shop_id: shopId },
        });
    }

    async purchaseBills(cusId:string, shopId:string){
        
        return await this.prisma.bill.findMany({
            where:{customer_id:cusId , shop_id:shopId},           
        })
    }


    async stats(cusId:string , shopId:string){

        const [billStats , billItemStats] = await Promise.all([
         this.prisma.bill.aggregate({
            where :{customer_id:cusId , shop_id:shopId},
            _count:{id:true},
            _sum:{payableAmount:true}
        }) ,

          this.prisma.billItem.groupBy({
            by:['metal' , 'purity'],
            where :{
                 bill:{
                    customer_id:cusId , shop_id:shopId
                    }
        },
        _sum:{gross_weight:true , net_weight:true , amount:true}
           
        }) 

        ])

        return {billStats , billItemStats}
  
    }



}
