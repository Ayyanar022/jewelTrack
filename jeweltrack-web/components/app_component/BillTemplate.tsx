


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
  created_at: string;
};

type ShopProfile = {
  shop_name: string;
  address: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  gstin?: string;
  logo_url?: string;
  terms_conditions?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function BillTemplate({
  data,
  shop,
}: {
  data: BillData;
  shop: ShopProfile;
}) {
  const logoSrc = shop.logo_url ? `${API_BASE}${shop.logo_url}` : null;

  return (
    <div className="w-[210mm] h-[148mm] p-4 text-[12px] font-sans text-gray-800">

      {/* HEADER */}
      <div className="flex items-center justify-between border-b-2 border-gray-800 pb-2">
        <div className="flex items-center gap-3">
          {logoSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoSrc}
              alt={shop.shop_name}
              className="w-14 h-14 object-cover rounded border"
            />
          )}
          <div>
            <h2 className="text-lg font-bold uppercase tracking-wide">
              {shop.shop_name}
            </h2>
            <p className="text-[11px] text-gray-600">{shop.address}</p>
            <p className="text-[11px] text-gray-600">
              Ph: {shop.phone}
              {shop.whatsapp && shop.whatsapp !== shop.phone ? ` | WhatsApp: ${shop.whatsapp}` : ""}
              {shop.email ? ` | ${shop.email}` : ""}
            </p>
          </div>
        </div>

        {shop.gstin && (
          <div className="text-right text-[11px]">
            <p><b>GSTIN:</b> {shop.gstin}</p>
          </div>
        )}
      </div>

      {/* BILL INFO */}
      <div className="flex justify-between mt-2 text-xs">
        <div>
          <p><b>Customer:</b> {data.customer.name}</p>
          <p><b>Phone:</b> {data.customer.phone}</p>
          {data.customer.village && <p><b>Place:</b> {data.customer.village}</p>}
        </div>

        <div className="text-right">
          <p><b>Bill No:</b> {data.bill_number}</p>
          <p><b>Date:</b> {new Date(data.created_at).toLocaleDateString("en-IN")}</p>
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
              <td className="border px-1">{item.category?.name}</td>
              <td className="border px-1">{item.metal}</td>
              <td className="border px-1">{item.purity}</td>
              <td className="border px-1">{item.rate}</td>
              <td className="border px-1 text-right">{item.gross_weight}</td>
              <td className="border px-1 text-right">{item.stone}</td>
              <td className="border px-1 text-right">{item.net_weight}</td>
              <td className="border px-1 text-right">{item.wastage}</td>
              <td className="border px-1 text-right">
                ₹ {Number(item.making_charge || 0).toLocaleString("en-IN")}
              </td>
              <td className="border px-1 text-right font-medium">
                ₹ {Number(item.amount || 0).toLocaleString("en-IN")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* TOTAL SECTION */}
      <div className="mt-2 text-xs w-fit ml-auto flex justify-end p-2 border">
        <div className="w-[180px]">
          <div className="flex justify-between">
            <span className="text-slate-600">SubTotal</span>
            <span>₹ {Math.round(data.total_amount).toLocaleString("en-IN")}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-600">Discount</span>
            <span>₹ {Math.round(data.discount).toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Discounted Total</span>
            <span>₹ {Math.round(data.total_amount - (data.discount || 0)).toLocaleString("en-IN")}</span>
          </div>

          {data.is_gst_bill && (
            <div className="border-t mt-1">
              <div className="flex justify-between text-xs">
                <span className="text-[11px] text-slate-600">CGST (1.5%)</span>
                <span>₹ {Math.round(data.totalGST / 2).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[11px] text-slate-600">SGST (1.5%)</span>
                <span>₹ {Math.round(data.totalGST / 2).toLocaleString("en-IN")}</span>
              </div>
            </div>
          )}

          <div className="border-t mt-1 pt-1 flex justify-between font-bold text-sm">
            <span>Total</span>
            <span>₹ {Math.round(data.payableAmount).toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="w-full text-center text-[10px] border mt-2 p-2">
        {shop.terms_conditions && (
          <p className="mb-1 text-gray-600">{shop.terms_conditions}</p>
        )}
        <p>Thank you! Visit Again 🙏</p>
      </div>
    </div>
  );
}