import { Injectable } from '@nestjs/common';
import { CreateBillDto } from './dto/craete-bill.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class BillService {
    constructor (private prisma:PrismaService){}

  
    async create(dto:CreateBillDto,shopId:string){

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
                }
            },
            include:{
                billItem:true,
                customer:true
            }
        })

        
        // ledger out entry 
         await tx.inventoryStockEntry.createMany({
            data:dto.billItem.map((out:any)=>({
                    shop_id : shopId ,
                    category_id :out.category_id,
                    type  : "OUT",
                    weight : out.net_weight,
                    purity :out.purity,
                    stockType : "OWN" ,
                    reference :"BILL" ,
                    reference_id : bill_number ,
            }))

        })

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



// payload 

//     {
//   "customer_id": "your-customer-id-here",
//   "is_gst_bill": false,
//   "discount": 0,
//   "notes": "paid by cash",
//   "billItem": [
//     {
//       "item_name": "Chain",
//       "metal": "GOLD",
//       "purity": "K22",
//       "rate": 6200,
//       "weight": 8.5,
//       "wastage": 0.5,
//       "making_charge": 500,
//       "amount": 55800
//     },
//     {
//       "item_name": "Ring",
//       "metal": "GOLD",
//       "purity": "K18",
//       "rate": 5100,
//       "weight": 3,
//       "wastage": 0.2,
//       "making_charge": 200,
//       "amount": 16420
//     }
//   ]
// }








}
