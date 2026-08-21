import { ForbiddenException, Injectable } from '@nestjs/common';
import { CreateBillDto, OldGoldEntryDto } from './dto/craete-bill.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { SubscriptionService } from 'src/subscription/subscription.service';

@Injectable()
export class BillService {
    constructor (
        private prisma:PrismaService ,
        private subscriptionService:SubscriptionService
    ){}

  
    async create(dto:CreateBillDto,shopId:string){

          // ---- plan limit check (before transaction, keeps txn light) ----
        const limit = await this.subscriptionService.checkLimit(shopId, 'max_invoices_per_month');

        if (limit !== null) {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const monthlyCount = await this.prisma.bill.count({
                where: { shop_id: shopId, created_at: { gte: startOfMonth } },
            });

            if (monthlyCount >= limit) {
                throw new ForbiddenException(
                    `Monthly bill limit (${limit}) reached. Please upgrade your plan.`,
                );
            }
        }

        //-------------------------------------

       return await this.prisma.$transaction(async (tx)=>{

               // existing bill count 
        const count =await tx.bill.count({
            where:{shop_id:shopId}
            })
            
        const bill_number = `BILL-${String(count+1).padStart(3,'0')}`        
    
        const bill = await tx.bill.create({
            data:{
                shop_id:shopId,
                customer_id:dto.customer_id,
                bill_number,
                is_gst_bill:dto.is_gst_bill ?? false ,
                total_amount: dto.totalAmount,
                discount:dto.discount??0,
                notes:dto.notes,
                totalGST:dto.totalGST??0,
                payableAmount:dto.payableAmount,
                billItem:{
                    create:dto.billItem.map(item=>({
                       purity: item.purity,
                        gross_weight: item.gross_weight,
                        net_weight: item.net_weight,
                        stone: item.stone,
                        metal: item.metal,
                        wastage: item.wastage,
                        rate: item.rate,
                        making_charge: item.making_charge,
                        amount: item.amount,
                        category: {
                            connect: { id: item.category_id }
                        }
                                            }))
                },
                ...(dto.oldJewelItem?.length>0 && {
                    oldGoldEntry : {
                        create : dto.oldJewelItem.map(item=>({
                            shop_id : shopId ,
                            item_name : item.item_name,
                            purity :item.purity ,
                            weight :item.weight ,
                            rate  :item.rate,
                            amount :item.amount
                        }))
                    }
                })
                
            },
            include:{
                billItem:true,
                customer:true
            }
        })

       
        
        // ledger out entry 
         await tx.inventoryStockEntry.createMany({
            data:dto.billItem.filter(i=>i.metal!=="SILVER").map((out:any)=>({
                    shop_id : shopId ,
                    category_id :out.category_id,
                    type  : "OUT",
                    weight : out.net_weight,
                    purity :out.purity || null,
                    stockType : "OWN" ,
                    reference :"BILL" ,
                    reference_id : bill_number ,
            }))

        })

        // Entry Payment 
        await tx.billPaymentsEntry.create({
            data: {
                shop_id : shopId ,
                bill_id : bill.id,
                paid_amount :dto.paid_amount ,

            }
        })

        // Entry old Stock 
        // await tx.oldGoldEntry.create({
        //     data:{
        //          shop_id : shopId ,
        //         bill_id : bill.id,

        //     }

        // })

// console.log("bill")
        return {id:bill.id}
        })

    }



    async findOne(billId:string, shopId:string ){

        const bill = await this.prisma.bill.findFirst({
            where:{id:billId , shop_id:shopId},
            include:{billItem:{include:{category:{select:{name:true}}}},customer:true}
        })
    //    console.dir(bill, { depth: null });
        return bill
    }
    
    async findBillDetaile(billId:string, shopId:string ){

        const bill = await this.prisma.bill.findFirst({
            where:{id:billId , shop_id:shopId},
            include:{billItem:{include:{category:{select:{name:true}}}},
            customer:{select:{
                id:true,
                name:true,
                village:true,
                address:true,
                phone:true

            }} ,
            billPaymentsEntry:{select:{
                id:true , paid_amount:true , created_at:true
            }},
            oldGoldEntry:{select:{
                id:true,
                amount:true ,
                item_name:true ,
                purity:true,
                rate:true ,
                 weight:true
            }}
        },

            
        })

        // console.log(billId)
        // console.log(bill)
    //    console.dir(bill, { depth: null });
        return bill
    }


    async findAll(search:string , shopId:string ,page:string , limit:string){
        const pageNumber = Number(page) || 1 ;
        const dataLimit = Number(limit) || 10 ; 

        const skip = (pageNumber-1) * dataLimit ;
        const take = dataLimit ;
        const bill = await this.prisma.bill.findMany({
            where:{
                shop_id:shopId, 
                ...(search && {
                    OR:[
                        {
                            customer:{name:{contains:search , mode:'insensitive'}}
                        },
                        {
                            customer : {phone:{contains:search,mode:'insensitive'}}
                        },
                        {
                            customer:{village :{contains:search , mode:'insensitive'}}
                        },
                        {
                            bill_number:{contains:search}
                        }
                    ]
                }
                    
                ),
                
            },
            include:{billItem:true ,customer:true},
            skip,
            take,
            orderBy:{created_at:'desc'}
        })

        return bill
    }


    async AddPayment(billId:string , dto:any , shopId:string){
        // console.log("amount",dto ,shopId , billId)
        return this.prisma.billPaymentsEntry.create({
            data:{
                shop_id:shopId,
                bill_id:billId,
               paid_amount: Number(dto.addPayment)
            }
        })
    }



}
