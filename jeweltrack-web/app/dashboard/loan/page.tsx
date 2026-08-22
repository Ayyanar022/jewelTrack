'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Customer } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Coins,
  Plus,
  Search,
  Receipt,
  Scale,
  Calendar,
  CheckCircle,
  Eye,
  Printer,
  Trash2,
  Lock,
  ArrowRight,
  Loader2,
  CreditCard,
  Building,
} from 'lucide-react';

interface CollateralItem {
  description: string;
  purity: 'K22' | 'K18' | 'K24';
  pieces: number;
  gross_weight: number;
  net_weight: number;
}

const emptyCollateralItem = (): CollateralItem => ({
  description: '',
  purity: 'K22',
  pieces: 1,
  gross_weight: 0,
  net_weight: 0,
});

export default function GoldLoanPage() {
  const queryClient = useQueryClient();

  // Filters & State
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'CLOSED'>('ACTIVE');
  const [search, setSearch] = useState('');
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [selectedLoanForRepay, setSelectedLoanForRepay] = useState<any>(null);
  const [selectedLoanForView, setSelectedLoanForView] = useState<any>(null);
  const [selectedLoanForPrint, setSelectedLoanForPrint] = useState<any>(null);

  // New Loan Form State
  const [customerId, setCustomerId] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [interestRate, setInterestRate] = useState('1.5');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<CollateralItem[]>([emptyCollateralItem()]);

  // Repayment Form State
  const [interestPaid, setInterestPaid] = useState('');
  const [principalPaid, setPrincipalPaid] = useState('');
  const [repayNotes, setRepayNotes] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  // 1. Fetch Dashboard Stats
  const { data: stats } = useQuery({
    queryKey: ['loan-stats'],
    queryFn: async () => {
      const res = await api.get('/loan/stats');
      return res.data;
    },
  });

  // 2. Fetch Loans List
  const { data: loans = [], isLoading } = useQuery<any[]>({
    queryKey: ['loans', statusFilter, search],
    queryFn: async () => {
      const statusParam = statusFilter === 'ALL' ? '' : `status=${statusFilter}`;
      const searchParam = search ? `search=${encodeURIComponent(search)}` : '';
      const query = [statusParam, searchParam].filter(Boolean).join('&');
      const res = await api.get(`/loan${query ? `?${query}` : ''}`);
      return res.data;
    },
  });

  // 3. Fetch Customers for Quick Picker
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await api.get('/customer');
      return res.data;
    },
  });

  // 4. Fetch Shop Profile for Print Header
  const { data: shopProfile } = useQuery({
    queryKey: ['shop-profile'],
    queryFn: async () => {
      const res = await api.get('/settings/shop-profile');
      return res.data;
    },
  });

  // Calculate Form Totals
  const totalGrossWeight = items.reduce((sum, item) => sum + (Number(item.gross_weight) || 0), 0);
  const totalNetWeight = items.reduce((sum, item) => sum + (Number(item.net_weight) || 0), 0);

  // Create Loan Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/loan', payload);
    },
    onSuccess: (res) => {
      toast.success(`Gold Loan ${res.data?.loan_number || ''} created successfully!`);
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loan-stats'] });
      setIsNewOpen(false);
      resetNewForm();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to create gold loan');
    },
  });

  // Repay Mutation
  const repayMutation = useMutation({
    mutationFn: async ({ loanId, payload }: { loanId: string; payload: any }) => {
      return api.post(`/loan/${loanId}/repay`, payload);
    },
    onSuccess: (res) => {
      toast.success(
        res.data?.status === 'CLOSED'
          ? '🎉 Loan fully settled & closed! Return pledged gold.'
          : 'Payment recorded successfully!',
      );
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loan-stats'] });
      setSelectedLoanForRepay(null);
      resetRepayForm();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to record repayment');
    },
  });

  const resetNewForm = () => {
    setCustomerId('');
    setLoanAmount('');
    setInterestRate('1.5');
    setNotes('');
    setItems([emptyCollateralItem()]);
  };

  const resetRepayForm = () => {
    setInterestPaid('');
    setPrincipalPaid('');
    setRepayNotes('');
    setIsClosing(false);
  };

  const handleAddItem = () => {
    setItems([...items, emptyCollateralItem()]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof CollateralItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      toast.error('Please select a customer');
      return;
    }
    if (!loanAmount || Number(loanAmount) <= 0) {
      toast.error('Enter a valid loan amount');
      return;
    }
    if (totalNetWeight <= 0) {
      toast.error('Enter weight for pledged ornaments');
      return;
    }

    const payload = {
      customer_id: customerId,
      loan_amount: Number(loanAmount),
      interest_rate: Number(interestRate),
      gross_weight: totalGrossWeight,
      net_weight: totalNetWeight,
      notes,
      items: items.map((i) => ({
        description: i.description || 'Gold Ornament',
        purity: i.purity,
        pieces: Number(i.pieces) || 1,
        gross_weight: Number(i.gross_weight) || 0,
        net_weight: Number(i.net_weight) || 0,
      })),
    };

    createMutation.mutate(payload);
  };

  const handleRepaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanForRepay) return;

    const payload = {
      interest_paid: Number(interestPaid) || 0,
      principal_paid: Number(principalPaid) || 0,
      notes: repayNotes,
      is_closing: isClosing,
    };

    if (payload.interest_paid === 0 && payload.principal_paid === 0 && !isClosing) {
      toast.error('Enter interest or principal amount to record payment');
      return;
    }

    repayMutation.mutate({ loanId: selectedLoanForRepay.id, payload });
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* 1. Top Metrics Bar (Compact single row) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-gold flex items-center justify-center font-black">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold">Active Pledges</div>
            <div className="text-xl font-black text-slate-900">{stats?.active_loans_count ?? 0} Loans</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black">
            ₹
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold">Principal Lent (அசல்)</div>
            <div className="text-xl font-black text-emerald-800">
              ₹{(stats?.total_principal_lent ?? 0).toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-black">
            %
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold">Monthly Accruing Interest</div>
            <div className="text-xl font-black text-blue-800">
              ₹{(stats?.monthly_accruing_interest ?? 0).toLocaleString('en-IN')}/mo
            </div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/15 text-gold flex items-center justify-center font-black">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold">Safe Gold Weight</div>
            <div className="text-xl font-black text-slate-900">
              {(stats?.total_gold_weight_grams ?? 0).toFixed(2)} g
            </div>
          </div>
        </div>
      </div>

      {/* 2. Control Header (Search, Status Filter & Action) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2.5 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <Input
              placeholder="Search by Loan No, Customer Name, Phone, Village..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Switcher */}
          <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs font-semibold">
            {(['ACTIVE', 'CLOSED', 'ALL'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-md transition-all ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {st === 'ALL' ? 'All Loans' : st === 'ACTIVE' ? 'Active' : 'Closed'}
              </button>
            ))}
          </div>

          <Button
            onClick={() => setIsNewOpen(true)}
            className="bg-gold hover:bg-gold/90 text-white font-bold text-xs h-9 px-4 shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Gold Loan</span>
          </Button>
        </div>
      </div>

      {/* 3. High-Density Loans Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : loans.length === 0 ? (
          <div className="text-center py-16 text-slate-400 space-y-2">
            <Coins className="w-10 h-10 mx-auto opacity-30 text-gold" />
            <p className="text-sm font-semibold text-slate-600">No Gold Loans found</p>
            <p className="text-xs text-slate-400">Click "+ New Gold Loan" to record your first jewellery pledge.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 uppercase tracking-wider text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Loan #</th>
                  <th className="px-4 py-3">Customer & Contact</th>
                  <th className="px-4 py-3">Pledged Ornaments</th>
                  <th className="px-4 py-3 text-right">Net Wt</th>
                  <th className="px-4 py-3 text-right">Principal Lent</th>
                  <th className="px-4 py-3 text-right">Interest Rate</th>
                  <th className="px-4 py-3 text-right">Accrued Interest</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loans.map((loan) => {
                  const isActive = loan.status === 'ACTIVE';

                  return (
                    <tr key={loan.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Loan # & Date */}
                      <td className="px-4 py-3 font-bold text-slate-900">
                        <div className="font-mono text-gold font-extrabold">{loan.loan_number}</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          {new Date(loan.loan_date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 text-sm">{loan.customer?.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {loan.customer?.phone} • {loan.customer?.village || 'Local'}
                        </div>
                      </td>

                      {/* Pledged Items */}
                      <td className="px-4 py-3">
                        <div className="text-slate-800 font-medium max-w-[200px] truncate">
                          {loan.loanCollateralItem?.map((i: any) => `${i.pieces}x ${i.description}`).join(', ') ||
                            'Gold Ornaments'}
                        </div>
                        {loan.notes && (
                          <div className="text-[10px] text-amber-700 font-medium truncate">
                            📍 {loan.notes}
                          </div>
                        )}
                      </td>

                      {/* Weight */}
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        <div>{loan.net_weight} g</div>
                        <div className="text-[10px] text-slate-400 font-normal">Gross: {loan.gross_weight}g</div>
                      </td>

                      {/* Principal */}
                      <td className="px-4 py-3 text-right font-extrabold text-slate-900 text-sm">
                        <div>₹{loan.loan_amount.toLocaleString('en-IN')}</div>
                        {loan.current_principal_balance < loan.loan_amount && (
                          <div className="text-[10px] text-emerald-700 font-bold">
                            Bal: ₹{loan.current_principal_balance.toLocaleString('en-IN')}
                          </div>
                        )}
                      </td>

                      {/* Interest Rate */}
                      <td className="px-4 py-3 text-right text-slate-700 font-medium">
                        <span className="font-bold text-slate-900">{loan.interest_rate}%</span> / mo
                        <div className="text-[10px] text-slate-500">₹{loan.monthly_interest_amount}/mo</div>
                      </td>

                      {/* Accrued Interest */}
                      <td className="px-4 py-3 text-right font-semibold">
                        {isActive ? (
                          <>
                            <span className="text-rose-700 font-bold">
                              ₹{loan.pending_interest?.toLocaleString('en-IN')}
                            </span>
                            <div className="text-[10px] text-slate-400 font-normal">{loan.days_elapsed} days</div>
                          </>
                        ) : (
                          <span className="text-emerald-700 font-bold">Settled</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold px-2 py-0.5 uppercase ${
                            isActive
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          }`}
                        >
                          {isActive ? 'Active' : 'Closed'}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right space-x-1">
                        {isActive && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedLoanForRepay(loan);
                              setInterestPaid(String(loan.monthly_interest_amount || ''));
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-7 px-2 text-[11px] rounded-md shadow-xs"
                          >
                            <CreditCard className="w-3 h-3 mr-1" />
                            Pay
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedLoanForView(loan)}
                          className="h-7 w-7 p-0 rounded-md text-slate-600"
                          title="View History"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedLoanForPrint(loan)}
                          className="h-7 w-7 p-0 rounded-md text-gold hover:text-gold/90"
                          title="Print Pawn Slip"
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

      {/* 4. Create New Gold Loan Modal */}
      <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
        <DialogContent className="max-w-2xl p-5 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Coins className="w-5 h-5 text-gold" />
              New Gold Loan Pledge (புதிய அடகு)
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-1 text-xs">
            {/* Customer Picker */}
            <div className="space-y-1">
              <Label className="font-semibold text-slate-700">Select Customer (வாடிக்கையாளர்)</Label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-input text-xs bg-white font-medium"
                required
              >
                <option value="">-- Choose Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} • {c.phone} ({c.village || 'Local'})
                  </option>
                ))}
              </select>
            </div>

            {/* Pledged Ornaments Table */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Pledged Ornaments (அடகு நகைகள்)
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                  className="h-7 text-xs font-bold text-gold"
                >
                  + Add Item
                </Button>
              </div>

              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 items-center">
                    <div className="col-span-4">
                      <Input
                        placeholder="Item (e.g. Ring, Chain)"
                        value={item.description}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                        className="h-8 text-xs bg-white"
                        required
                      />
                    </div>

                    <div className="col-span-2">
                      <select
                        value={item.purity}
                        onChange={(e) => handleItemChange(idx, 'purity', e.target.value)}
                        className="w-full h-8 px-1.5 rounded-md border border-input text-xs bg-white font-medium"
                      >
                        <option value="K22">22K (916)</option>
                        <option value="K18">18K (750)</option>
                        <option value="K24">24K</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="Pcs"
                        value={item.pieces}
                        min={1}
                        onChange={(e) => handleItemChange(idx, 'pieces', Number(e.target.value))}
                        className="h-8 text-xs bg-white text-center"
                        required
                      />
                    </div>

                    <div className="col-span-3 flex gap-1">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Gross g"
                        value={item.gross_weight || ''}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          handleItemChange(idx, 'gross_weight', val);
                          if (!item.net_weight) handleItemChange(idx, 'net_weight', val);
                        }}
                        className="h-8 text-xs bg-white"
                        required
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Net g"
                        value={item.net_weight || ''}
                        onChange={(e) => handleItemChange(idx, 'net_weight', Number(e.target.value))}
                        className="h-8 text-xs bg-white font-bold"
                        required
                      />
                    </div>

                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={items.length === 1}
                        className="text-rose-500 hover:text-rose-700 disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4 mx-auto" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Weight Totals Bar */}
              <div className="flex justify-between items-center text-xs font-bold px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-200">
                <span>Total Ornaments: {items.reduce((s, i) => s + (Number(i.pieces) || 1), 0)} pcs</span>
                <span>
                  Gross: {totalGrossWeight.toFixed(2)}g | <strong className="text-gold">Net Pure Wt: {totalNetWeight.toFixed(2)}g</strong>
                </span>
              </div>
            </div>

            {/* Financial Details */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
              <div className="space-y-1">
                <Label className="font-semibold text-slate-700">Loan Amount (அசல் ₹)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 50000"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  className="h-9 text-xs font-extrabold text-slate-900"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="font-semibold text-slate-700">Monthly Interest (% / மாதம்)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 1.5"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  className="h-9 text-xs font-bold"
                  required
                />
              </div>

              <div className="space-y-1 col-span-2 sm:col-span-1">
                <Label className="font-semibold text-slate-700">Locker Packet No / Note</Label>
                <Input
                  placeholder="e.g. Safe Packet #104"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Monthly Calculation Banner */}
            {loanAmount && (
              <div className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex justify-between font-bold text-slate-700">
                <span>Monthly Interest Accrual:</span>
                <span className="text-blue-700">
                  ₹{Math.round((Number(loanAmount) * Number(interestRate)) / 100).toLocaleString('en-IN')} / month
                </span>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsNewOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createMutation.isPending}
                className="bg-gold hover:bg-gold/90 text-white font-bold px-5"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Loan Pledge'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 5. Repayment & Settlement Modal */}
      <Dialog open={!!selectedLoanForRepay} onOpenChange={(open) => !open && setSelectedLoanForRepay(null)}>
        <DialogContent className="max-w-md p-5 text-xs">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              Record Repayment ({selectedLoanForRepay?.loan_number})
            </DialogTitle>
          </DialogHeader>

          {selectedLoanForRepay && (
            <form onSubmit={handleRepaySubmit} className="space-y-3 pt-2">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-bold text-slate-900">{selectedLoanForRepay.customer?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Outstanding Principal (அசல்):</span>
                  <span className="font-extrabold text-slate-900">
                    ₹{selectedLoanForRepay.current_principal_balance.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Accrued Interest ({selectedLoanForRepay.days_elapsed} days):</span>
                  <span className="font-extrabold text-rose-700">
                    ₹{selectedLoanForRepay.pending_interest?.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="font-semibold text-slate-700">Interest Paid (வட்டி ₹)</Label>
                  <Input
                    type="number"
                    value={interestPaid}
                    onChange={(e) => setInterestPaid(e.target.value)}
                    placeholder="e.g. 1500"
                    className="h-9 text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="font-semibold text-slate-700">Principal Repaid (அசல் ₹)</Label>
                  <Input
                    type="number"
                    value={principalPaid}
                    onChange={(e) => setPrincipalPaid(e.target.value)}
                    placeholder="0"
                    className="h-9 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="font-semibold text-slate-700">Payment Note / Mode</Label>
                <Input
                  value={repayNotes}
                  onChange={(e) => setRepayNotes(e.target.value)}
                  placeholder="e.g. Cash / GPay"
                  className="h-9 text-xs"
                />
              </div>

              {/* Settle & Close Checkbox */}
              <label className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={isClosing}
                  onChange={(e) => {
                    setIsClosing(e.target.checked);
                    if (e.target.checked) {
                      setPrincipalPaid(String(selectedLoanForRepay.current_principal_balance));
                      setInterestPaid(String(selectedLoanForRepay.pending_interest));
                    }
                  }}
                  className="rounded text-emerald-600 w-4 h-4"
                />
                <span className="font-bold text-emerald-900 text-xs">
                  Full Settlement & Return Gold (அடகு திருப்புதல்)
                </span>
              </label>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setSelectedLoanForRepay(null)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={repayMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5"
                >
                  {repayMutation.isPending ? 'Saving...' : 'Save Payment'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* 6. View Loan History & Details Modal */}
      <Dialog open={!!selectedLoanForView} onOpenChange={(open) => !open && setSelectedLoanForView(null)}>
        <DialogContent className="max-w-xl p-5 text-xs max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
              <span>Loan Pledge Details: {selectedLoanForView?.loan_number}</span>
              <Badge
                variant="outline"
                className={
                  selectedLoanForView?.status === 'ACTIVE'
                    ? 'bg-amber-50 text-amber-800'
                    : 'bg-emerald-50 text-emerald-800'
                }
              >
                {selectedLoanForView?.status}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {selectedLoanForView && (
            <div className="space-y-4 pt-2">
              {/* Customer & Pledge info */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <div className="text-slate-500">Customer</div>
                  <div className="font-bold text-slate-900 text-sm">{selectedLoanForView.customer?.name}</div>
                  <div className="font-mono text-slate-600">{selectedLoanForView.customer?.phone}</div>
                  <div className="text-slate-500">{selectedLoanForView.customer?.village || 'Local'}</div>
                </div>

                <div className="text-right">
                  <div className="text-slate-500">Principal Amount</div>
                  <div className="font-extrabold text-slate-900 text-base">
                    ₹{selectedLoanForView.loan_amount.toLocaleString('en-IN')}
                  </div>
                  <div className="text-slate-600 font-medium">Interest: {selectedLoanForView.interest_rate}% / mo</div>
                  <div className="text-slate-500">
                    Pledged:{' '}
                    {new Date(selectedLoanForView.loan_date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>

              {/* Ornaments List */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-900 uppercase text-[10px]">Collateral Ornaments:</span>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600">
                      <tr>
                        <th className="p-2">Item</th>
                        <th className="p-2">Purity</th>
                        <th className="p-2 text-center">Qty</th>
                        <th className="p-2 text-right">Gross</th>
                        <th className="p-2 text-right">Net</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedLoanForView.loanCollateralItem?.map((item: any) => (
                        <tr key={item.id}>
                          <td className="p-2 font-medium text-slate-800">{item.description}</td>
                          <td className="p-2">{item.purity || 'K22'}</td>
                          <td className="p-2 text-center">{item.pieces}</td>
                          <td className="p-2 text-right">{item.gross_weight}g</td>
                          <td className="p-2 text-right font-bold">{item.net_weight}g</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Repayments History */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-900 uppercase text-[10px]">Payment History:</span>
                {selectedLoanForView.loanRepayment?.length === 0 ? (
                  <div className="text-slate-400 text-center py-4 bg-slate-50 rounded-lg">No payments recorded yet.</div>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600">
                        <tr>
                          <th className="p-2">Date</th>
                          <th className="p-2 text-right">Interest Paid</th>
                          <th className="p-2 text-right">Principal Paid</th>
                          <th className="p-2">Note</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedLoanForView.loanRepayment?.map((r: any) => (
                          <tr key={r.id}>
                            <td className="p-2 text-slate-600">
                              {new Date(r.payment_date || r.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="p-2 text-right font-bold text-emerald-700">₹{r.interest_paid}</td>
                            <td className="p-2 text-right font-bold text-blue-700">₹{r.principal_paid}</td>
                            <td className="p-2 text-slate-500">{r.notes || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 7. Printable Gold Loan Pledge Voucher (Thermal / A4) */}
      <Dialog open={!!selectedLoanForPrint} onOpenChange={(open) => !open && setSelectedLoanForPrint(null)}>
        <DialogContent className="max-w-md p-6 text-slate-900">
          <div id="printable-pawn-slip" className="space-y-4 font-mono text-xs border border-slate-300 p-4 rounded-xl bg-white">
            {/* Header */}
            <div className="text-center border-b border-dashed border-slate-400 pb-3 space-y-1">
              <h2 className="text-base font-black uppercase tracking-wider">{shopProfile?.shop_name || 'JEWELLERY SHOWROOM'}</h2>
              <div className="text-[11px] text-slate-600">{shopProfile?.address || 'Gold Merchant & Pawnbroker'}</div>
              <div className="text-[11px] font-bold">Ph: {shopProfile?.phone || ''}</div>
              <div className="text-xs font-black uppercase pt-1 tracking-widest text-gold">GOLD LOAN PLEDGE RECEIPT (அடகு ரசீது)</div>
            </div>

            {/* Loan & Customer info */}
            {selectedLoanForPrint && (
              <>
                <div className="flex justify-between border-b border-dashed border-slate-300 pb-2">
                  <div>
                    <div><strong>Loan No:</strong> {selectedLoanForPrint.loan_number}</div>
                    <div><strong>Date:</strong> {new Date(selectedLoanForPrint.loan_date).toLocaleDateString('en-IN')}</div>
                  </div>
                  <div className="text-right">
                    <div><strong>Packet:</strong> {selectedLoanForPrint.notes || '—'}</div>
                  </div>
                </div>

                <div className="border-b border-dashed border-slate-300 pb-2 space-y-0.5">
                  <div><strong>Customer:</strong> {selectedLoanForPrint.customer?.name}</div>
                  <div><strong>Mobile:</strong> {selectedLoanForPrint.customer?.phone}</div>
                  <div><strong>Address:</strong> {selectedLoanForPrint.customer?.village || ''}</div>
                </div>

                {/* Items */}
                <div className="border-b border-dashed border-slate-300 pb-2 space-y-1">
                  <div className="font-bold uppercase text-[10px]">Pledged Items (அடகு விவரம்):</div>
                  {selectedLoanForPrint.loanCollateralItem?.map((i: any, idx: number) => (
                    <div key={idx} className="flex justify-between">
                      <span>{i.pieces}x {i.description} ({i.purity})</span>
                      <span>Net: {i.net_weight}g</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold pt-1 text-slate-900 border-t border-slate-200">
                    <span>Total Net Weight:</span>
                    <span>{selectedLoanForPrint.net_weight} g</span>
                  </div>
                </div>

                {/* Financials */}
                <div className="border-b border-dashed border-slate-300 pb-2 space-y-1">
                  <div className="flex justify-between text-sm font-black">
                    <span>Loan Principal (அசல்):</span>
                    <span>₹{selectedLoanForPrint.loan_amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Interest Rate:</span>
                    <span>{selectedLoanForPrint.interest_rate}% / month</span>
                  </div>
                </div>

                {/* Signatures */}
                <div className="pt-6 flex justify-between text-[10px] text-center font-bold">
                  <div className="border-t border-slate-400 pt-1 w-28">Customer Signature</div>
                  <div className="border-t border-slate-400 pt-1 w-28">Authorized Signatory</div>
                </div>
              </>
            )}
          </div>

          <DialogFooter className="pt-3 flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedLoanForPrint(null)}>
              Close
            </Button>
            <Button
              size="sm"
              onClick={() => window.print()}
              className="bg-gold hover:bg-gold/90 text-white font-bold px-5"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Print Slip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
