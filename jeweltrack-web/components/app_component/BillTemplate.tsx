type BillData = {
  billNo: string;
  customer: {
    name: string;
    phone: string;
    village?: string;
  };
  items: any[];
  total: number;
  gstAmount: number;
  payableAmount: number;
  discount: number;
  isGst: boolean;
};

export default function BillTemplate({ data }: { data: BillData }) {
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
          <p><b>Bill No:</b> {data.billNo}</p>
          <p><b>Date:</b> {new Date().toLocaleDateString('en-IN')}</p>
        </div>
      </div>

      {/* ITEMS TABLE */}
      <table className="w-full mt-2 border text-[11px]">
        <thead>
          <tr className="border-b bg-gray-100">
            <th className="border px-1">#</th>
            <th className="border px-1">Item</th>
            <th className="border px-1">G.Wt</th>
            <th className="border px-1">Net.Wt</th>
            <th className="border px-1">Wst</th>
            <th className="border px-1">MC</th>
            <th className="border px-1">Amt</th>
          </tr>
        </thead>

        <tbody>
          {data.items.map((item, i) => (
            <tr key={i}>
              <td className="border px-1 text-center">{i + 1}</td>
              <td className="border px-1">{item.item_name}</td>
              <td className="border px-1 text-right">{item.gross_weight}</td>
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
      <div className="mt-2 text-xs w-full flex justify-end">
        <div className="w-[180px]">
          <div className="flex justify-between">
            <span>SubTotal</span>
            <span>₹ {Math.round(data.total).toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between">
            <span>Discount</span>
            <span>₹ {Math.round(data.discount).toLocaleString('en-IN')}</span>
          </div>

          {data.isGst && (
            <>
              <div className="flex justify-between">
                <span>CGST (1.5%)</span>
                <span>₹ {Math.round(data.gstAmount / 2).toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between">
                <span>SGST (1.5%)</span>
                <span>₹ {Math.round(data.gstAmount / 2).toLocaleString('en-IN')}</span>
              </div>
            </>
          )}

          <div className="border-t mt-1 pt-1 flex justify-between font-bold text-sm">
            <span>Total</span>
            <span>₹ {Math.round(data.payableAmount).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="absolute bottom-2 w-full text-center text-[10px]">
        <p>Thank you! Visit Again 🙏</p>
      </div>
    </div>
  );
}