'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Badge } from '@/components/ui/badge';
import { Eye, Printer, ShoppingBag, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function Purchase({ id }: { id: string }) {
  const { data: bills = [], isLoading } = useQuery({
    queryKey: ['CustomerBill', id],
    queryFn: async () => api.get(`/customer/purchase/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (bills.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center text-slate-400 space-y-2 shadow-xs">
        <ShoppingBag className="w-10 h-10 mx-auto opacity-30 text-gold" />
        <p className="text-sm font-bold text-slate-700">No purchase bills found for this customer</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="text-base font-bold text-slate-800">
          Purchase History: <span className="font-black text-slate-900">{bills.length} Bills</span>
        </div>
        <span className="text-xs text-slate-500 font-medium">Billed Tax Invoices</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 uppercase tracking-wider text-slate-700 font-bold text-xs border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">#</th>
              <th className="px-6 py-4">Bill Number</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4 text-right">Taxable Amount</th>
              <th className="px-6 py-4 text-right">GST (3%)</th>
              <th className="px-6 py-4 text-right">Payable Amount</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bills.map((b: any, i: number) => (
              <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm font-bold text-slate-500">{i + 1}</td>
                <td className="px-6 py-4 font-black text-amber-900 text-sm">
                  {b.bill_number}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-slate-600">
                  {new Date(b.created_at).toLocaleDateString('en-IN')}
                </td>
                <td className="px-6 py-4">
                  <Badge
                    variant="outline"
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${
                      b.is_gst_bill
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {b.is_gst_bill ? 'GST Bill' : 'Non-GST'}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-right font-bold text-slate-800 text-sm">
                  ₹{Number(b.total_amount || 0).toLocaleString('en-IN')}
                </td>
                <td className="px-6 py-4 text-right font-bold text-slate-700 text-sm">
                  {b.is_gst_bill ? `₹${Number(b.totalGST || 0).toLocaleString('en-IN')}` : '—'}
                </td>
                <td className="px-6 py-4 text-right font-black text-slate-900 text-base">
                  ₹{Number(b.payableAmount || 0).toLocaleString('en-IN')}
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Link
                      href={`/dashboard/billing/${b.id}?from=customer&customerId=${id}`}
                      className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                      title="View Bill Details"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => window.open(`/print/${b.id}`, '_blank')}
                      className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Print Tax Invoice"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
