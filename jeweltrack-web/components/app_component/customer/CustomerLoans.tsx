'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, Eye, Printer, CreditCard, Clock, Loader2 } from 'lucide-react';

import RepayLoanModal from '@/components/app_component/loan/RepayLoanModal';
import ViewLoanModal from '@/components/app_component/loan/ViewLoanModal';
import PrintLoanSlipModal from '@/components/app_component/loan/PrintLoanSlipModal';

interface CustomerLoansProps {
  customerId: string;
}

export default function CustomerLoans({ customerId }: CustomerLoansProps) {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'CLOSED'>('ALL');
  const [selectedLoanForRepay, setSelectedLoanForRepay] = useState<any>(null);
  const [selectedLoanForView, setSelectedLoanForView] = useState<any>(null);
  const [selectedLoanForPrint, setSelectedLoanForPrint] = useState<any>(null);

  // Fetch loans for this customer
  const { data: loanData, isLoading } = useQuery<{
    items: any[];
    total: number;
  }>({
    queryKey: ['customer-loans', customerId, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('customer_id', customerId);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      params.append('limit', '50');

      const res = await api.get(`/loan?${params.toString()}`);
      return res.data;
    },
    enabled: !!customerId,
  });

  // Fetch shop profile for print header
  const { data: shopProfile } = useQuery({
    queryKey: ['shop-profile'],
    queryFn: async () => {
      const res = await api.get('/settings/shop-profile');
      return res.data;
    },
  });

  const loans = loanData?.items || [];

  // Summary figures for this customer
  const activeLoans = loans.filter((l) => l.status === 'ACTIVE');
  const totalPrincipal = activeLoans.reduce((sum, l) => sum + (l.current_principal_balance || l.loan_amount || 0), 0);
  const totalPendingInterest = activeLoans.reduce((sum, l) => sum + (l.pending_interest || 0), 0);
  const totalGoldWeight = activeLoans.reduce((sum, l) => {
    const goldWt = (l.loanCollateralItem || [])
      .filter((i: any) => i.metal !== 'SILVER')
      .reduce((s: number, i: any) => s + (i.net_weight || 0), 0);
    return sum + goldWt;
  }, 0);
  const totalSilverWeight = activeLoans.reduce((sum, l) => {
    const silverWt = (l.loanCollateralItem || [])
      .filter((i: any) => i.metal === 'SILVER')
      .reduce((s: number, i: any) => s + (i.net_weight || 0), 0);
    return sum + silverWt;
  }, 0);

  return (
    <div className="space-y-4">
      {/* Customer Loan Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Active Pledges</div>
          <div className="text-lg font-black text-slate-900 mt-1">{activeLoans.length} Loans</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Outstanding Principal</div>
          <div className="text-lg font-black text-emerald-800 mt-1">
            ₹{totalPrincipal.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Pending Interest</div>
          <div className="text-lg font-black text-rose-700 mt-1">
            ₹{totalPendingInterest.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-center">
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Pledged Weight</div>
          <div className="text-xs font-black text-slate-900 mt-1 flex justify-between">
            <span className="text-amber-900">🪙 Gold: {totalGoldWeight.toFixed(2)}g</span>
            <span className="text-slate-600">⚪ Silver: {totalSilverWeight.toFixed(2)}g</span>
          </div>
        </div>
      </div>

      {/* Filter Header */}
      <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Coins className="w-4 h-4 text-gold" />
          <span>Customer Gold & Silver Pledges</span>
        </div>

        <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs font-bold">
          {(['ALL', 'ACTIVE', 'CLOSED'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-md transition-all ${
                statusFilter === st
                  ? 'bg-white text-slate-900 shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {st === 'ALL' ? 'All Loans' : st === 'ACTIVE' ? 'Active' : 'Closed'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gold" />
          </div>
        ) : loans.length === 0 ? (
          <div className="text-center py-14 text-slate-400 space-y-1.5">
            <Coins className="w-10 h-10 mx-auto opacity-30 text-gold" />
            <p className="text-sm font-bold text-slate-700">No pledges found for this customer</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 uppercase tracking-wider text-slate-700 font-bold text-xs border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Loan #</th>
                  <th className="px-4 py-3">Pledged Ornaments</th>
                  <th className="px-4 py-3 text-right">Net Wt</th>
                  <th className="px-4 py-3 text-right">Principal</th>
                  <th className="px-4 py-3 text-right">Rate</th>
                  <th className="px-4 py-3 text-right">Pending Interest</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loans.map((loan) => {
                  const isActive = loan.status === 'ACTIVE';

                  return (
                    <tr key={loan.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-mono text-gold font-black text-sm">{loan.loan_number}</div>
                        <div className="text-xs text-slate-500">
                          {new Date(loan.loan_date).toLocaleDateString('en-IN')}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="text-slate-900 font-semibold text-sm max-w-[200px] truncate space-x-1">
                          {loan.loanCollateralItem?.map((i: any, idx: number) => (
                            <span key={idx} className="inline-block">
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded mr-1 ${i.metal === 'SILVER' ? 'bg-slate-200 text-slate-800' : 'bg-amber-100 text-amber-900'}`}>
                                {i.metal === 'SILVER' ? 'Silver' : 'Gold'}
                              </span>
                              {i.pieces > 1 ? `${i.pieces}x ` : ''}{i.description}
                              {idx < loan.loanCollateralItem.length - 1 ? ', ' : ''}
                            </span>
                          )) || 'Jewellery'}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right font-black text-slate-900">
                        {loan.net_weight} g
                      </td>

                      <td className="px-4 py-3.5 text-right font-black text-slate-900">
                        ₹{loan.loan_amount.toLocaleString('en-IN')}
                        {loan.current_principal_balance < loan.loan_amount && (
                          <div className="text-xs text-emerald-700 font-bold">
                            Bal: ₹{loan.current_principal_balance.toLocaleString('en-IN')}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right text-slate-800 font-medium">
                        <span className="font-bold text-slate-900">{loan.interest_rate}%</span> / mo
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        {isActive ? (
                          <>
                            <div className="font-black text-rose-700">
                              ₹{loan.pending_interest?.toLocaleString('en-IN')}
                            </div>
                            <div className="text-xs text-slate-500 font-medium flex items-center justify-end gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{loan.months_elapsed} Mo ({loan.days_elapsed}d)</span>
                            </div>
                          </>
                        ) : (
                          <span className="text-emerald-700 font-bold text-xs">Settled</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <Badge
                          variant="outline"
                          className={`text-xs font-bold px-2.5 py-0.5 uppercase ${
                            isActive
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          }`}
                        >
                          {isActive ? 'Active' : 'Closed'}
                        </Badge>
                      </td>

                      <td className="px-4 py-3.5 text-right space-x-1">
                        {isActive && (
                          <Button
                            size="sm"
                            onClick={() => setSelectedLoanForRepay(loan)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-7 px-2.5 text-xs rounded-lg"
                          >
                            <CreditCard className="w-3 h-3 mr-1" />
                            Pay
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedLoanForView(loan)}
                          className="h-7 w-7 p-0 rounded-lg text-slate-700 hover:text-slate-900"
                          title="View"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedLoanForPrint(loan)}
                          className="h-7 w-7 p-0 rounded-lg text-gold hover:text-gold/90"
                          title="Print"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <RepayLoanModal
        loan={selectedLoanForRepay}
        open={!!selectedLoanForRepay}
        onOpenChange={(open) => !open && setSelectedLoanForRepay(null)}
      />

      <ViewLoanModal
        loan={selectedLoanForView}
        open={!!selectedLoanForView}
        onOpenChange={(open) => !open && setSelectedLoanForView(null)}
      />

      <PrintLoanSlipModal
        loan={selectedLoanForPrint}
        shopProfile={shopProfile}
        open={!!selectedLoanForPrint}
        onOpenChange={(open) => !open && setSelectedLoanForPrint(null)}
      />
    </div>
  );
}
