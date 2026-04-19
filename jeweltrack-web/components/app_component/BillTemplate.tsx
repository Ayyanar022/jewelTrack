type BillData = {
  bill_number: string;
  customer: {
    name: string;
    phone: string;
    village?: string;
  };
  billItem: any[];
  total_amount: number;
  totalGST: number;
  payableAmount: number;
  discount: number;
  is_gst_bill: boolean;
  created_at:string;
};

export default function BillTemplate({ data }: { data: BillData }) {


  console.log("data to print",data)

  return (
    <div className="w-[210mm] h-[148mm] p-3 text-[12px] font-sans">

      {/* HEADER */}
      <div className="text-center border-b pb-1">
        <h2 className="text-lg font-bold">YOUR JEWELLERY SHOP</h2>
        <p>Village, Phone Number</p>
      </div>

      {/* BILL INFO */}
      <div className="flex justify-between mt-2 text-xs">
        <div>
          <p><b>Customer:</b> {data.customer.name}</p>
          <p><b>Phone:</b> {data.customer.phone}</p>
          <p><b>Place:</b> {data.customer.village}</p>
        </div>

        <div className="text-right">
          <p><b>Bill No:</b> {data.bill_number}</p>
          <p><b>Date:</b> {new Date(data.created_at).toLocaleDateString('en-IN')}</p>
        </div>
      </div>

      {/* ITEMS TABLE */}
      <table className="w-full mt-2 border text-[11px]">
        <thead>
          <tr className="border-b bg-gray-100">
            <th className="border px-1">#</th>
            <th className="border px-1">Item</th>
            <th className="border px-1">Metal</th>
            <th className="border px-1">Purity</th>
            <th className="border px-1">Rate</th>
            <th className="border px-1">G.Wt(g)</th>
            <th className="border px-1">Stone(g)</th>
            <th className="border px-1">Net.Wt(g)</th>
            <th className="border px-1">Wst(g)</th>
            <th className="border px-1">MC</th>
            <th className="border px-1">Amt</th>
          </tr>
        </thead>

        <tbody>
          {data.billItem.map((item, i) => (
            <tr key={i}>
              <td className="border px-1 text-center">{i + 1}</td>
              <td className="border px-1">{item.item_name}</td>
              <td className="border px-1">{item.metal}</td>
              <td className="border px-1">{item.purity}</td>
              <td className="border px-1">{item.rate}</td>
              <td className="border px-1 text-right">{item.gross_weight}</td>
              <td className="border px-1 text-right">{item.stone}</td>
              <td className="border px-1 text-right">{item.net_weight}</td>
              <td className="border px-1 text-right">{item.wastage}</td>
              <td className="border px-1 text-right">
                ₹ {Number(item.making_charge || 0).toLocaleString('en-IN')}
              </td>
              <td className="border px-1 text-right font-medium">
                ₹ {Number(item.amount || 0).toLocaleString('en-IN')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* TOTAL SECTION */}
      <div className="mt-2 text-xs w-fit ml-auto flex justify-end p-2 border ">
        <div className="w-[180px]">
          <div className="flex justify-between">
            <span className="text-slate-600">SubTotal</span>
            <span>₹ {Math.round(data.total_amount).toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-600">Discount</span>
            <span>₹ {Math.round(data.discount).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Discounted Total </span>
            <span>₹ {Math.round(data.total_amount-(data.discount||0)).toLocaleString('en-IN')}</span>
          </div>

          {data.is_gst_bill && (
            <div className="border-t  mt-1">
            
              <div className="flex justify-between text-xs">
                <span className="text-[11px] text-slate-600">CGST (1.5%)</span>
                <span>₹ {Math.round(data.totalGST / 2).toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-[11px] text-slate-600">SGST (1.5%)</span>
                <span>₹ {Math.round(data.totalGST / 2).toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}

          <div className="border-t mt-1 pt-1 flex justify-between font-bold text-sm">
            <span>Total</span>
            <span>₹ {Math.round(data.payableAmount).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="  w-full text-center text-[10px] border mt-2 p-2">
        <p>Thank you! Visit Again 🙏</p>
      </div>
    </div>
  );
}