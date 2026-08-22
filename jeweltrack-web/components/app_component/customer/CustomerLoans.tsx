'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, Eye, Printer, CreditCard, Loader2 } from 'lucide-react';

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Active Pledges</div>
          <div className="text-xl font-black font-mono text-slate-900 mt-1">{activeLoans.length} Loans</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Outstanding Principal</div>
          <div className="text-xl font-black font-mono text-emerald-800 mt-1">
            ₹{totalPrincipal.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Pending Interest</div>
          <div className="text-xl font-black font-mono text-rose-700 mt-1">
            ₹{totalPendingInterest.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Pledged Weight</div>
          <div className="text-sm font-bold font-mono text-slate-900 mt-1 flex justify-between">
            <span className="text-amber-950">🪙 Gold: {totalGoldWeight.toFixed(2)}g</span>
            <span className="text-slate-700">⚪ Silver: {totalSilverWeight.toFixed(2)}g</span>
          </div>
        </div>
      </div>

      {/* Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Coins className="w-4 h-4 text-amber-700" />
          <span>Customer Gold & Silver Pledges ({loans.length})</span>
        </div>

        <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200 text-sm font-bold">
          {(['ALL', 'ACTIVE', 'CLOSED'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-md transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st === 'ALL' ? 'All Loans' : st === 'ACTIVE' ? 'Active' : 'Closed'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-slate-800" />
            <span className="text-sm font-medium text-slate-500">Loading customer pledges...</span>
          </div>
        ) : loans.length === 0 ? (
          <div className="text-center py-14 text-slate-400 space-y-2">
            <Coins className="w-10 h-10 mx-auto opacity-30 text-amber-700" />
            <p className="text-base font-bold text-slate-800">No pledges found for this customer</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-100 uppercase tracking-wider text-slate-700 font-bold text-xs border-b border-slate-200">
                <tr>
                  <th className="px-3.5 py-3 w-12 text-center border border-slate-200">#</th>
                  <th className="px-4 py-3 border border-slate-200">Loan No</th>
                  <th className="px-4 py-3 border border-slate-200">Pledged Ornaments</th>
                  <th className="px-4 py-3 text-right border border-slate-200">Net Wt</th>
                  <th className="px-4 py-3 text-right border border-slate-200">Principal</th>
                  <th className="px-4 py-3 text-right border border-slate-200">Rate / Mo</th>
                  <th className="px-4 py-3 text-right border border-slate-200">Pending Interest</th>
                  <th className="px-4 py-3 text-center border border-slate-200 w-24">Status</th>
                  <th className="px-4 py-3 text-center border border-slate-200 w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loans.map((loan, i) => {
                  const isActive = loan.status === 'ACTIVE';

                  return (
                    <tr key={loan.id} className="hover:bg-slate-50 transition-colors">
                      {/* Index */}
                      <td className="px-3.5 py-3.5 text-center text-sm font-medium text-slate-500 font-mono border border-slate-200">
                        {i + 1}
                      </td>

                      {/* Loan # & Date */}
                      <td className="px-4 py-3.5 border border-slate-200">
                        <span className="font-mono text-gold-dark font-black text-base bg-amber-50/80 px-2.5 py-0.5 rounded border border-amber-200 block w-fit">
                          {loan.loan_number}
                        </span>
                        <div className="text-xs text-slate-500 font-medium mt-1">
                          {new Date(loan.loan_date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      </td>

                      {/* Pledged Ornaments (Single Item with Coin + Count badge) */}
                      <td className="px-4 py-3.5 border border-slate-200 w-[190px]">
                        {loan.loanCollateralItem?.[0] ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border ${
                                loan.loanCollateralItem[0].metal === 'SILVER'
                                  ? 'bg-slate-100 text-slate-800 border-slate-200'
                                  : 'bg-amber-50 text-amber-950 border-amber-300'
                              }`}
                            >
                              <span>{loan.loanCollateralItem[0].metal === 'SILVER' ? '⚪' : '🪙'}</span>
                              <span className="font-bold">
                                {loan.loanCollateralItem[0].pieces > 1 ? `${loan.loanCollateralItem[0].pieces}x ` : ''}
                                {loan.loanCollateralItem[0].description}
                              </span>
                            </span>
                            {loan.loanCollateralItem.length > 1 && (
                              <span
                                className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-300 cursor-pointer"
                                title={loan.loanCollateralItem.map((it: any) => `${it.metal} ${it.description} (${it.net_weight}g)`).join(', ')}
                              >
                                +{loan.loanCollateralItem.length - 1}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Net Wt */}
                      <td className="px-4 py-3.5 text-right font-bold text-slate-900 text-base border border-slate-200 font-mono">
                        {loan.net_weight} g
                      </td>

                      {/* Principal */}
                      <td className="px-4 py-3.5 text-right font-bold text-slate-900 text-base border border-slate-200 font-mono">
                        <div>₹{loan.loan_amount.toLocaleString('en-IN')}</div>
                        {loan.current_principal_balance < loan.loan_amount && (
                          <div className="text-xs text-emerald-800 font-bold">
                            Bal: ₹{loan.current_principal_balance.toLocaleString('en-IN')}
                          </div>
                        )}
                      </td>

                      {/* Rate / Mo */}
                      <td className="px-4 py-3.5 text-right border border-slate-200 text-base w-[130px] font-mono">
                        <div className=" font-bold text-slate-900">
                          {loan.interest_rate}% <span className=" text-slate-800 font-normal"> - ₹{loan.monthly_interest_amount?.toLocaleString('en-IN')}</span>
                        </div>
                        {/* <div className="text-xs text-slate-600">
                          ₹{loan.monthly_interest_amount?.toLocaleString('en-IN')}
                        </div> */}
                      </td>

                      {/* Pending Interest */}
                      <td className="px-4 py-3.5 text-right border border-slate-200 font-mono">
                        {isActive ? (
                          <div>
                            <div className="text-base font-black text-rose-700">
                              ₹{loan.pending_interest?.toLocaleString('en-IN')}
                            </div>
                            <div className="text-xs text-slate-600 font-sans font-bold">
                              {loan.months_elapsed} {loan.months_elapsed === 1 ? 'Mo' : 'Mo'} ({loan.days_elapsed}d)
                            </div>
                          </div>
                        ) : (
                          <span className="text-emerald-800 font-bold text-xs bg-emerald-50 px-2.5 py-1 rounded border border-emerald-300">
                            Settled
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center border border-slate-200">
                        <Badge
                          variant="outline"
                          className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                            isActive
                              ? 'bg-amber-50 text-amber-900 border-amber-300'
                              : 'bg-slate-100 text-slate-800 border-slate-300'
                          }`}
                        >
                          {isActive ? 'Active' : 'Closed'}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 border border-slate-200">
                        <div className="flex items-center justify-center gap-2">
                          {isActive && (
                            <Button
                              size="sm"
                              onClick={() => setSelectedLoanForRepay(loan)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 px-3 text-xs rounded-lg shadow-xs flex items-center gap-1 cursor-pointer"
                              title="Repay / Settle Loan"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Pay</span>
                            </Button>
                          )}

                          <button
                            onClick={() => setSelectedLoanForView(loan)}
                            className="h-8 w-8 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                            title="View Loan Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setSelectedLoanForPrint(loan)}
                            className="h-8 w-8 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                            title="Print Pawn Slip"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
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
