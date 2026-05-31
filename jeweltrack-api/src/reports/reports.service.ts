import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class ReportsService {
    constructor(private prisma:PrismaService){}

     async saleStats(shopId:string){

        // stats 
        const [
            totalSalesAmount,
            totalGramSaleGoldAndSilver ,
            totalGSTAmount,

            totalBillCount , 
            totalGstBillCount,
            totalNonGstBillCount,

        ] = await Promise.all([
            // 1. total sales amount
            this.prisma.bill.aggregate({
                where:{shop_id:shopId},
                _sum:{
                    payableAmount:true
                }
            }),

            // 2. total gram Sale gold and silver 
            this.prisma.billItem.groupBy({
                 where:{
                    bill:{shop_id:shopId}
                 },
                by:['metal' , 'purity'],
                _sum:{
                    net_weight:true
                }
                
            }),

            //3.total gst
            this.prisma.bill.aggregate({
                where:{
                    is_gst_bill :true , shop_id:shopId

                },
                _sum:{
                    totalGST:true
                }
            }),

            // 4. total bill count 
            this.prisma.bill.count({
                 where:{shop_id:shopId},               
            }),

            //5. total gst bill count 
            this.prisma.bill.count({
                 where:{shop_id:shopId,is_gst_bill:true},
               
            }),
            //6. total non gst bill count 
           this.prisma.bill.count({
            where: {
                shop_id: shopId,
                is_gst_bill: false,
            },
            })

        ])

        // for table
        const tableData = await this.prisma.bill.groupBy({
            by:['created_at'],
            _count:{id:true},
            _sum :{payableAmount:true},
            // _sum: {totalGST:true} ,
        })

        return {
            totalSalesAmount,
            totalGramSaleGoldAndSilver ,
            totalGSTAmount,

            totalBillCount , 
            totalGstBillCount,
            totalNonGstBillCount,

        }

     }

    //  async repots()
}
