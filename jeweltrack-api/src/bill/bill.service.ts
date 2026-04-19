import { Injectable } from '@nestjs/common';
import { CreateBillDto } from './dto/craete-bill.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class BillService {
    constructor (private prisma:PrismaService){}

    async create(dto:CreateBillDto,shopId:string){
        // existing bill count 
        const count =await this.prisma.bill.count({
            where:{shop_id:shopId}
        })


        const bill_number = `BILL-${String(count+1).padStart(3,'0')}`
        
    
        const bill = await this.prisma.bill.create({
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
                    create:dto.billItem
                }
            },
            include:{
                billItem:true,
                customer:true
            }
        })

        return bill
    }



    async findOne(billId:string, shopId:string ){

        const bill = await this.prisma.bill.findFirst({
            where:{id:billId , shop_id:shopId},
            include:{billItem:true,customer:true}
        })
        return bill
    }


    async findAll(customerId:string , shopId:string){
        const bill = await this.prisma.bill.findMany({
            where:{
                shop_id:shopId, 
                ...(customerId && {customer_id:customerId})
            },
            include:{billItem:true ,customer:true}
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
