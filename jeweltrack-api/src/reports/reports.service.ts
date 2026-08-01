import { Injectable } from '@nestjs/common';
import { Purity } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class ReportsService {
    constructor(private prisma:PrismaService){}

     async saleStats(fromDate:string , toDate:string ,shopId:string ){

     let from: Date;
        let to: Date;

        const today = new Date();

        if (!fromDate && !toDate) {
        // Default: previous month + current month
        from = new Date(today.getFullYear(), today.getMonth() - 3, 1);
        to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        to.setHours(23, 59, 59, 999);

        } else if (fromDate && !toDate) {
        // From selected date until today
        from = new Date(fromDate);
        to = today;

        } else if (!fromDate && toDate) {
        // Everything up to the selected date
        // Choose a sensible earliest date for your business
        from = new Date("2000-01-01");
        to = new Date(toDate);
        to.setHours(23, 59, 59, 999);

        } else {
        // Both dates selected
        from = new Date(fromDate);
        to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        }

        const where = {shop_id:shopId ,  created_at :{gte:from ,lte:to}}

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
                // where:{shop_id:shopId},
                where,
                _sum:{
                    payableAmount:true
                }
            }),

            // 2. total gram Sale gold and silver 
            this.prisma.billItem.groupBy({
                 where:{
                    bill:{shop_id:shopId , created_at: {
                                                gte: from,
                                                lte: to,
                                                },}
                 },
                by:['metal' , 'purity'],
                _sum:{
                    net_weight:true
                }
                
            }),

            //3.total gst
            this.prisma.bill.aggregate({
                where:{
                    is_gst_bill :true , shop_id:shopId ,created_at :{gte:from ,lte:to}

                },
                _sum:{
                    totalGST:true
                }
            }),

            // 4. total bill count 
            this.prisma.bill.count({
                //  where:{shop_id:shopId},      
                where         
            }),

            //5. total gst bill count 
            this.prisma.bill.count({
                 where:{is_gst_bill:true , ...where},
               
            }),
            //6. total non gst bill count 
           this.prisma.bill.count({
            where: {
                is_gst_bill: false,
               ...where
            },
            })

        ])

     

        const tableData  =  await this.prisma.$queryRaw`
        
        select 
         DATE(created_at) as Date ,
         count(*)::int as billCount , 
         sum("payableAmount") as totalSaleAmount ,
         sum("totalGST") as totalGST 
         from "Bill" 
         where shop_id = ${shopId} and created_at between ${from} and ${to}
         group by 
         Date(created_at) 
         order by date(created_at) desc 
        `

        return {
            totalSalesAmount,
            totalGramSaleGoldAndSilver ,
            totalGSTAmount,
            totalBillCount , 
            totalGstBillCount,
            totalNonGstBillCount,
            tableData

        }

     }


    //  gst report 
       async gstReport(fromDate:string , toDate:string ,shopId:string ){

     let from: Date;
        let to: Date;

        const today = new Date();

        if (!fromDate && !toDate) {
        // Default: previous month + current month
        from = new Date(today.getFullYear(), today.getMonth() - 3, 1);
        to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        to.setHours(23, 59, 59, 999);

        } else if (fromDate && !toDate) {
        // From selected date until today
        from = new Date(fromDate);
        to = today;

        } else if (!fromDate && toDate) {
        // Everything up to the selected date
        // Choose a sensible earliest date for your business
        from = new Date("2000-01-01");
        to = new Date(toDate);
        to.setHours(23, 59, 59, 999);

        } else {
        // Both dates selected
        from = new Date(fromDate);
        to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        }

        const where = {shop_id:shopId , is_gst_bill :true , created_at :{gte:from ,lte:to}}

        // stats 
        const [
          
            totalGSTAmount,
            totalGstBillCount,

        ] = await Promise.all([ 

            //1.total gst
            this.prisma.bill.aggregate({
                where,
                _sum:{
                    totalGST:true
                }
            }),

            // 2. total gst bill count 
            this.prisma.bill.count({
                where         
            }),   

        ])

     

        const tableData  =  await this.prisma.$queryRaw`
        
        select 
         DATE(created_at) as Date ,
         count(*)::int as gstBillCount , 
         sum("total_amount") as taxableAmount ,
         sum("totalGST") as totalGST 
         from "Bill" 
         where shop_id = ${shopId}  and is_gst_bill = true and created_at between ${from} and ${to} 
         group by 
         Date(created_at) 
         order by date(created_at) desc 
        `

        return {           
            totalGSTAmount,
            totalGstBillCount,
            tableData,
        }

     }


    async itemWisesalesReport(fromDate:string , toDate:string ,shopId:string ){

        let from: Date;
        let to: Date;

        const today = new Date();

        if (!fromDate && !toDate) {
        // Default: previous month + current month
        from = new Date(today.getFullYear(), today.getMonth() - 3, 1);
        to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        to.setHours(23, 59, 59, 999);

        } else if (fromDate && !toDate) {
        // From selected date until today
        from = new Date(fromDate);
        to = today;

        } else if (!fromDate && toDate) {
        // Everything up to the selected date
        // Choose a sensible earliest date for your business
        from = new Date("2000-01-01");
        to = new Date(toDate);
        to.setHours(23, 59, 59, 999);

        } else {
        // Both dates selected
        from = new Date(fromDate);
        to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        }

        const where = {shop_id:shopId ,  created_at :{gte:from ,lte:to}}

        // stats 
        const [
            totalGoldAndSilverSale_gm,
            totalGoldPurityWiseSale_gm,
            tableData,
        ] = await Promise.all([
            // 1. total sales amount
            this.prisma.billItem.groupBy({
                by:['metal'],
                where:{
                    bill:{
                        ...where
                    }
                },
                _sum:{
                    net_weight:true ,gross_weight:true
                }
            }),

            // 2. total gram Sale gold and silver 
            this.prisma.billItem.groupBy({
                by:['metal','purity'],
                 where:{
                    bill:{...where}
                 },                
                _sum:{
                    net_weight:true,
                    gross_weight:true
                }
                
            }),

              this.prisma.$queryRaw`
                select 
                    c.name,
                    bi.purity,
                    SUM(bi.net_weight) AS total_net_weight,
                    SUM(bi.gross_weight) AS total_gross_weight,
                    SUM(bi.amount) AS total_amount
                    from "BillItem" bi 
                    join "JewelleryCategory" c on c.id = bi.category_id
                    join "Bill" b on b.id = bi.bill_id
                    where b.shop_id=${shopId} and b.created_at between ${from} and ${to}
                    group by c.name , bi.purity       
            `
        ])

     


        return {
             totalGoldAndSilverSale_gm,
            totalGoldPurityWiseSale_gm,
            tableData

        }

     }




}
