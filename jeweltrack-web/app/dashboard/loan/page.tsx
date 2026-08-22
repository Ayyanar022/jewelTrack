'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Customer } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Coins,
  Plus,
  Search,
  Scale,
  Eye,
  Printer,
  Trash2,
  Loader2,
  CreditCard,
  X,
  UserPlus,
  Clock,
} from 'lucide-react';

interface CollateralItem {
  metal: 'GOLD' | 'SILVER';
  description: string;
  purity: 'K22' | 'K18' | 'K24';
  pieces: number;
  gross_weight: number;
  net_weight: number;
}

const emptyCollateralItem = (): CollateralItem => ({
  metal: 'GOLD',
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

  // Customer Search & Selection State
  const [customerSearchInput, setCustomerSearchInput] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [isQuickAddCustomerOpen, setIsQuickAddCustomerOpen] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', phone: '', village: '', address: '' });
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // New Loan Form State
  const [loanAmount, setLoanAmount] = useState('');
  const [interestRate, setInterestRate] = useState('1.5');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<CollateralItem[]>([emptyCollateralItem()]);

  // Repayment Form State
  const [interestPaid, setInterestPaid] = useState('');
  const [principalPaid, setPrincipalPaid] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
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

  // 3. Fetch Customers (using correct endpoints)
  const { data: searchCustomers = [] } = useQuery<Customer[]>({
    queryKey: ['customers-search', customerSearchInput],
    queryFn: async () => {
      if (!customerSearchInput.trim()) {
        const res = await api.get('/customer/all');
        return res.data;
      }
      const res = await api.get(`/customer/search?q=${encodeURIComponent(customerSearchInput.trim())}`);
      return res.data;
    },
    enabled: isNewOpen,
  });

  // 4. Fetch Shop Profile for Print Header
  const { data: shopProfile } = useQuery({
    queryKey: ['shop-profile'],
    queryFn: async () => {
      const res = await api.get('/settings/shop-profile');
      return res.data;
    },
  });

  // Close customer dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsCustomerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Quick Add Customer Mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (payload: typeof newCustomerForm) => {
      return api.post('/customer', payload);
    },
    onSuccess: (res) => {
      toast.success(`Customer ${res.data?.name} created & selected!`);
      queryClient.invalidateQueries({ queryKey: ['customers-search'] });
      setSelectedCustomer(res.data);
      setCustomerSearchInput('');
      setIsQuickAddCustomerOpen(false);
      setIsCustomerDropdownOpen(false);
      setNewCustomerForm({ name: '', phone: '', village: '', address: '' });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to create customer');
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
      toast.success(`🎉 Gold Loan ${res.data?.loan_number || ''} created successfully!`);
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
          ? '🎉 Loan fully settled & closed! Return pledged items.'
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
    setSelectedCustomer(null);
    setCustomerSearchInput('');
    setLoanAmount('');
    setInterestRate('1.5');
    setNotes('');
    setItems([emptyCollateralItem()]);
    setIsQuickAddCustomerOpen(false);
  };

  const resetRepayForm = () => {
    setInterestPaid('');
    setPrincipalPaid('');
    setDiscountAmount('');
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
    const current = { ...updated[index], [field]: value };

    // When Gross weight is entered, auto-sync Net weight if net was 0 or equal to old gross
    if (field === 'gross_weight') {
      const grossVal = Number(value) || 0;
      if (!current.net_weight || current.net_weight === updated[index].gross_weight) {
        current.net_weight = grossVal;
      } else if (current.net_weight > grossVal) {
        current.net_weight = grossVal;
      }
    }

    // Strict validation: Net weight cannot exceed Gross weight
    if (field === 'net_weight') {
      const netVal = Number(value) || 0;
      const grossVal = Number(current.gross_weight) || 0;
      if (netVal > grossVal && grossVal > 0) {
        toast.error(`Net weight cannot exceed Gross weight (${grossVal}g)`);
        current.net_weight = grossVal;
      }
    }

    updated[index] = current;
    setItems(updated);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      toast.error('Please search and select a customer');
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
    if (totalNetWeight > totalGrossWeight) {
      toast.error('Total Net weight cannot be greater than Total Gross weight');
      return;
    }

    const payload = {
      customer_id: selectedCustomer.id,
      loan_amount: Number(loanAmount),
      interest_rate: Number(interestRate),
      gross_weight: totalGrossWeight,
      net_weight: totalNetWeight,
      notes,
      items: items.map((i) => ({
        metal: i.metal || 'GOLD',
        description: i.description || (i.metal === 'SILVER' ? 'Silver Ornament' : 'Gold Ornament'),
        purity: i.metal === 'SILVER' ? undefined : i.purity,
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

    const principalNum = Number(principalPaid) || 0;
    const interestNum = Number(interestPaid) || 0;
    const discountNum = Number(discountAmount) || 0;

    // Strict validation: Principal cannot exceed outstanding balance
    if (principalNum > selectedLoanForRepay.current_principal_balance) {
      toast.error(
        `Principal payment (₹${principalNum.toLocaleString('en-IN')}) cannot exceed remaining balance (₹${selectedLoanForRepay.current_principal_balance.toLocaleString('en-IN')})`,
      );
      return;
    }

    if (interestNum === 0 && principalNum === 0 && !isClosing) {
      toast.error('Enter interest or principal amount to record payment');
      return;
    }

    const payload = {
      interest_paid: interestNum,
      principal_paid: principalNum,
      discount_amount: discountNum,
      notes: repayNotes,
      is_closing: isClosing,
    };

    repayMutation.mutate({ loanId: selectedLoanForRepay.id, payload });
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* 1. Top Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-gold flex items-center justify-center font-black">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Active Pledges</div>
            <div className="text-xl font-black text-slate-900">{stats?.active_loans_count ?? 0} Loans</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-lg">
            ₹
          </div>
          <div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Principal Lent (அசல்)</div>
            <div className="text-xl font-black text-emerald-800">
              ₹{(stats?.total_principal_lent ?? 0).toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-black text-lg">
            %
          </div>
          <div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Monthly Accruing Interest</div>
            <div className="text-xl font-black text-blue-800">
              ₹{(stats?.monthly_accruing_interest ?? 0).toLocaleString('en-IN')}/mo
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gold/15 text-gold flex items-center justify-center font-black">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Safe Pledged Weight</div>
            <div className="text-xl font-black text-slate-900">
              {(stats?.total_gold_weight_grams ?? 0).toFixed(2)} g
            </div>
          </div>
        </div>
      </div>

      {/* 2. Control Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3 flex-1 max-w-lg">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <Input
              placeholder="Search by Loan No, Customer Name, Phone, Village..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 text-sm font-medium"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Status Switcher */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
            {(['ACTIVE', 'CLOSED', 'ALL'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-4 py-1.5 rounded-lg transition-all ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {st === 'ALL' ? 'All Loans' : st === 'ACTIVE' ? 'Active' : 'Closed'}
              </button>
            ))}
          </div>

          <Button
            onClick={() => {
              resetNewForm();
              setIsNewOpen(true);
            }}
            className="bg-gold hover:bg-gold/90 text-white font-black text-sm h-10 px-5 shadow-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ New Gold / Silver Loan</span>
          </Button>
        </div>
      </div>

      {/* 3. Spacious Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : loans.length === 0 ? (
          <div className="text-center py-20 text-slate-400 space-y-2">
            <Coins className="w-12 h-12 mx-auto opacity-30 text-gold" />
            <p className="text-base font-bold text-slate-700">No Gold Loans found</p>
            <p className="text-xs text-slate-400">Click &quot;+ New Gold / Silver Loan&quot; to create your first jewellery pledge.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 uppercase tracking-wider text-slate-700 font-bold text-xs border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Loan #</th>
                  <th className="px-5 py-3.5">Customer & Village</th>
                  <th className="px-5 py-3.5">Pledged Ornaments</th>
                  <th className="px-5 py-3.5 text-right">Net Wt</th>
                  <th className="px-5 py-3.5 text-right">Principal (அசல்)</th>
                  <th className="px-5 py-3.5 text-right">Rate / mo</th>
                  <th className="px-5 py-3.5 text-right">Pending Interest</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loans.map((loan) => {
                  const isActive = loan.status === 'ACTIVE';

                  return (
                    <tr key={loan.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Loan # & Date */}
                      <td className="px-5 py-3.5">
                        <div className="font-mono text-gold font-black text-sm">{loan.loan_number}</div>
                        <div className="text-xs text-slate-500 font-medium">
                          {new Date(loan.loan_date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900 text-sm">{loan.customer?.name}</div>
                        <div className="text-xs text-slate-500 font-mono">
                          {loan.customer?.phone} {loan.customer?.village ? `• ${loan.customer?.village}` : ''}
                        </div>
                      </td>

                      {/* Pledged Items with Gold / Silver tag */}
                      <td className="px-5 py-3.5">
                        <div className="text-slate-800 font-medium max-w-[240px] truncate space-x-1">
                          {loan.loanCollateralItem?.map((i: any, idx: number) => (
                            <span key={idx} className="inline-block">
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded mr-1 ${i.metal === 'SILVER' ? 'bg-slate-200 text-slate-800' : 'bg-amber-100 text-amber-900'}`}>
                                {i.metal === 'SILVER' ? 'Silver' : 'Gold'}
                              </span>
                              {i.pieces > 1 ? `${i.pieces}x ` : ''}{i.description}
                              {idx < loan.loanCollateralItem.length - 1 ? ', ' : ''}
                            </span>
                          )) || 'Jewellery Ornaments'}
                        </div>
                        {loan.notes && (
                          <div className="text-xs text-amber-700 font-medium truncate mt-0.5">
                            📍 {loan.notes}
                          </div>
                        )}
                      </td>

                      {/* Weight */}
                      <td className="px-5 py-3.5 text-right font-black text-slate-900">
                        <div>{loan.net_weight} g</div>
                        <div className="text-xs text-slate-400 font-normal">Gross: {loan.gross_weight}g</div>
                      </td>

                      {/* Principal */}
                      <td className="px-5 py-3.5 text-right font-black text-slate-900">
                        <div className="text-sm">₹{loan.loan_amount.toLocaleString('en-IN')}</div>
                        {loan.current_principal_balance < loan.loan_amount && (
                          <div className="text-xs text-emerald-700 font-bold">
                            Bal: ₹{loan.current_principal_balance.toLocaleString('en-IN')}
                          </div>
                        )}
                      </td>

                      {/* Interest Rate */}
                      <td className="px-5 py-3.5 text-right text-slate-800 font-medium">
                        <span className="font-bold text-slate-900">{loan.interest_rate}%</span> / mo
                        <div className="text-xs text-slate-500 font-normal">₹{loan.monthly_interest_amount}/mo</div>
                      </td>

                      {/* Accrued Interest */}
                      <td className="px-5 py-3.5 text-right">
                        {isActive ? (
                          <>
                            <div className="text-sm font-black text-rose-700">
                              ₹{loan.pending_interest?.toLocaleString('en-IN')}
                            </div>
                            <div className="text-xs text-slate-500 font-semibold flex items-center justify-end gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{loan.months_elapsed} Mo ({loan.days_elapsed}d)</span>
                            </div>
                          </>
                        ) : (
                          <span className="text-emerald-700 font-bold text-xs">Settled</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5 text-center">
                        <Badge
                          variant="outline"
                          className={`text-xs font-bold px-3 py-1 uppercase ${
                            isActive
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          }`}
                        >
                          {isActive ? 'Active' : 'Closed'}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right space-x-1.5">
                        {isActive && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedLoanForRepay(loan);
                              setInterestPaid(String(loan.pending_interest || loan.monthly_interest_amount || ''));
                              setPrincipalPaid('');
                              setDiscountAmount('');
                              setIsClosing(false);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 px-3 text-xs rounded-lg shadow-xs"
                          >
                            <CreditCard className="w-3.5 h-3.5 mr-1" />
                            Pay / Settle
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedLoanForView(loan)}
                          className="h-8 w-8 p-0 rounded-lg text-slate-700 hover:text-slate-900"
                          title="View History"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedLoanForPrint(loan)}
                          className="h-8 w-8 p-0 rounded-lg text-gold hover:text-gold/90"
                          title="Print Pawn Slip"
                        >
                          <Printer className="w-4 h-4" />
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

      {/* 4. Create New Gold / Silver Loan Modal */}
      <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
        <DialogContent className="max-w-4xl p-7 max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2.5">
              <Coins className="w-6 h-6 text-gold" />
              New Gold / Silver Loan Pledge (புதிய அடகு பதிவு)
            </DialogTitle>
            <DialogDescription className="sr-only">
              Create a new gold or silver loan with pledged ornaments and customer details
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-5 pt-2">
            {/* Section 1: Customer Selection */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3" ref={searchContainerRef}>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-bold text-slate-800">1. Customer Information (வாடிக்கையாளர்)</Label>
                <button
                  type="button"
                  onClick={() => setIsQuickAddCustomerOpen(!isQuickAddCustomerOpen)}
                  className="text-gold hover:text-gold/80 font-bold text-xs flex items-center gap-1"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isQuickAddCustomerOpen ? 'Hide Quick Form' : '+ Quick Add New Customer'}</span>
                </button>
              </div>

              {selectedCustomer ? (
                <div className="flex items-center justify-between bg-amber-50/80 border border-amber-300 p-3 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gold/20 text-gold font-bold flex items-center justify-center text-sm">
                      {selectedCustomer.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 text-sm">{selectedCustomer.name}</div>
                      <div className="text-xs text-slate-600 font-mono">
                        {selectedCustomer.phone} {selectedCustomer.village ? `• ${selectedCustomer.village}` : ''}
                        {selectedCustomer.address ? ` • ${selectedCustomer.address}` : ''}
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCustomer(null);
                      setCustomerSearchInput('');
                    }}
                    className="h-8 w-8 p-0 text-slate-500 hover:text-rose-600 rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <Input
                    placeholder="Search customer by Name, Mobile Number, Village..."
                    value={customerSearchInput}
                    onChange={(e) => {
                      setCustomerSearchInput(e.target.value);
                      setIsCustomerDropdownOpen(true);
                    }}
                    onFocus={() => setIsCustomerDropdownOpen(true)}
                    className="pl-10 h-10 text-sm bg-white"
                    autoComplete="off"
                  />

                  {/* Floating Customer Search Results */}
                  {isCustomerDropdownOpen && (
                    <div className="absolute z-50 left-0 right-0 top-11 bg-white rounded-xl border border-slate-200 shadow-2xl max-h-56 overflow-y-auto divide-y divide-slate-100">
                      {searchCustomers.length === 0 ? (
                        <div className="p-4 text-center text-slate-500 space-y-1.5">
                          <p className="text-sm font-medium">No matching customer found.</p>
                          <button
                            type="button"
                            onClick={() => {
                              setNewCustomerForm({
                                ...newCustomerForm,
                                name: customerSearchInput,
                                phone: /^\d+$/.test(customerSearchInput) ? customerSearchInput : '',
                              });
                              setIsQuickAddCustomerOpen(true);
                              setIsCustomerDropdownOpen(false);
                            }}
                            className="text-xs font-bold text-gold underline"
                          >
                            + Quick Add &quot;{customerSearchInput || 'New Customer'}&quot;
                          </button>
                        </div>
                      ) : (
                        searchCustomers.map((cust) => (
                          <div
                            key={cust.id}
                            onClick={() => {
                              setSelectedCustomer(cust);
                              setIsCustomerDropdownOpen(false);
                              setCustomerSearchInput('');
                            }}
                            className="p-3 hover:bg-amber-50/60 cursor-pointer transition-colors flex items-center justify-between"
                          >
                            <div>
                              <div className="font-bold text-slate-900 text-sm">{cust.name}</div>
                              <div className="text-xs text-slate-500 font-mono">
                                {cust.phone} {cust.village ? `• ${cust.village}` : ''}
                                {cust.address ? ` • ${cust.address}` : ''}
                              </div>
                            </div>
                            <span className="text-xs text-gold font-bold bg-gold/10 px-2.5 py-1 rounded-md">
                              Select
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Quick Add Customer Form with Address */}
              {isQuickAddCustomerOpen && (
                <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-xs space-y-3">
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-gold" />
                    <span>Quick Add New Customer</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    <Input
                      placeholder="Full Name *"
                      value={newCustomerForm.name}
                      onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                      className="h-9 text-xs"
                    />
                    <Input
                      placeholder="10-Digit Mobile *"
                      maxLength={10}
                      value={newCustomerForm.phone}
                      onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                      className="h-9 text-xs font-mono"
                    />
                    <Input
                      placeholder="Village / Town *"
                      value={newCustomerForm.village}
                      onChange={(e) => setNewCustomerForm({ ...newCustomerForm, village: e.target.value })}
                      className="h-9 text-xs"
                    />
                    <Input
                      placeholder="Street Address (Optional)"
                      value={newCustomerForm.address}
                      onChange={(e) => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsQuickAddCustomerOpen(false)}
                      className="h-8 text-xs font-semibold"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={createCustomerMutation.isPending}
                      onClick={() => {
                        if (!newCustomerForm.name.trim()) {
                          toast.error('Customer name is required');
                          return;
                        }
                        if (!/^\d{10}$/.test(newCustomerForm.phone)) {
                          toast.error('Valid 10 digit phone number is required');
                          return;
                        }
                        createCustomerMutation.mutate(newCustomerForm);
                      }}
                      className="h-8 bg-gold hover:bg-gold/90 text-white font-bold text-xs px-4 shadow-xs"
                    >
                      {createCustomerMutation.isPending ? 'Saving...' : 'Save & Select Customer'}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Pledged Collateral Items (Gold & Silver supported) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 uppercase tracking-wider text-xs">
                  2. Pledged Ornaments (அடகு நகைகள்)
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                  className="h-8 text-xs font-bold text-gold border-gold/40 hover:bg-gold/10"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Ornament
                </Button>
              </div>

              <div className="space-y-2.5">
                {items.map((item, idx) => {
                  const isSilver = item.metal === 'SILVER';

                  return (
                    <div key={idx} className="grid grid-cols-12 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200 items-center">
                      {/* Metal Selector (Gold / Silver) */}
                      <div className="col-span-6 sm:col-span-2">
                        <Label className="text-[11px] text-slate-500 font-semibold block mb-1">Metal</Label>
                        <select
                          value={item.metal}
                          onChange={(e) => handleItemChange(idx, 'metal', e.target.value as 'GOLD' | 'SILVER')}
                          className={`w-full h-9 px-2 rounded-lg border text-xs font-extrabold ${
                            isSilver ? 'bg-slate-100 text-slate-800 border-slate-300' : 'bg-amber-50 text-amber-900 border-amber-300'
                          }`}
                        >
                          <option value="GOLD">🪙 Gold</option>
                          <option value="SILVER">⚪ Silver</option>
                        </select>
                      </div>

                      {/* Description */}
                      <div className="col-span-6 sm:col-span-3">
                        <Label className="text-[11px] text-slate-500 font-semibold block mb-1">Item Description</Label>
                        <Input
                          placeholder={isSilver ? 'e.g. Silver Anklet, Plate' : 'e.g. Gold Necklace, Ring'}
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          className="h-9 text-xs bg-white font-medium"
                          required
                        />
                      </div>

                      {/* Purity (Only for Gold) */}
                      <div className="col-span-4 sm:col-span-2">
                        <Label className="text-[11px] text-slate-500 font-semibold block mb-1">Purity</Label>
                        {isSilver ? (
                          <div className="h-9 px-2 flex items-center rounded-lg bg-slate-100 border border-slate-200 text-slate-500 text-xs font-semibold">
                            Silver
                          </div>
                        ) : (
                          <select
                            value={item.purity}
                            onChange={(e) => handleItemChange(idx, 'purity', e.target.value)}
                            className="w-full h-9 px-2 rounded-lg border border-input text-xs bg-white font-bold"
                          >
                            <option value="K22">22K (916)</option>
                            <option value="K18">18K (750)</option>
                            <option value="K24">24K</option>
                          </select>
                        )}
                      </div>

                      {/* Quantity / Pieces (Optional for silver, defaults to 1) */}
                      <div className="col-span-4 sm:col-span-1">
                        <Label className="text-[11px] text-slate-500 font-semibold block mb-1">Pcs</Label>
                        <Input
                          type="number"
                          placeholder="1"
                          value={item.pieces}
                          min={1}
                          onChange={(e) => handleItemChange(idx, 'pieces', Number(e.target.value) || 1)}
                          className="h-9 text-xs bg-white text-center font-bold"
                        />
                      </div>

                      {/* Gross & Net Weights (Net is always <= Gross) */}
                      <div className="col-span-4 sm:col-span-3 grid grid-cols-2 gap-1.5">
                        <div>
                          <Label className="text-[11px] text-slate-500 font-semibold block mb-1">Gross (g)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={item.gross_weight || ''}
                            onChange={(e) => handleItemChange(idx, 'gross_weight', Number(e.target.value))}
                            className="h-9 text-xs bg-white"
                            required
                          />
                        </div>
                        <div>
                          <Label className="text-[11px] text-slate-500 font-semibold block mb-1">Net Wt (g)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={item.net_weight || ''}
                            onChange={(e) => handleItemChange(idx, 'net_weight', Number(e.target.value))}
                            className="h-9 text-xs bg-white font-extrabold text-slate-900"
                            required
                          />
                        </div>
                      </div>

                      {/* Delete */}
                      <div className="col-span-12 sm:col-span-1 text-center pt-2 sm:pt-5">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={items.length === 1}
                          className="text-rose-500 hover:text-rose-700 disabled:opacity-25"
                        >
                          <Trash2 className="w-4 h-4 mx-auto" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Weight Totals Banner */}
              <div className="flex justify-between items-center text-xs font-extrabold px-4 py-2 bg-amber-50 rounded-xl border border-amber-200 text-slate-900">
                <span>Total Items: {items.reduce((s, i) => s + (Number(i.pieces) || 1), 0)} pcs</span>
                <span>
                  Gross Wt: {totalGrossWeight.toFixed(2)}g | <strong className="text-gold text-sm font-black">Net Pure Wt: {totalNetWeight.toFixed(2)}g</strong>
                </span>
              </div>
            </div>

            {/* Section 3: Financial & Safe Packet Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-200">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-800">3. Loan Amount (அசல் ₹)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 50000"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  className="h-10 text-sm font-black text-slate-900"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-800">Monthly Interest Rate (% / மாதம்)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 1.5"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  className="h-10 text-sm font-bold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-800">Safe Packet # / Notes</Label>
                <Input
                  placeholder="e.g. Locker Box #42"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-10 text-sm"
                />
              </div>
            </div>

            {/* Live Calculation Banner */}
            {loanAmount && (
              <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between font-bold text-slate-800">
                <span>Monthly Interest Accrual (வட்டி தொகை):</span>
                <span className="text-blue-700 font-extrabold text-sm">
                  ₹{Math.round((Number(loanAmount) * Number(interestRate)) / 100).toLocaleString('en-IN')} / month
                </span>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsNewOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="bg-gold hover:bg-gold/90 text-white font-black px-6 h-10 shadow-md"
              >
                {createMutation.isPending ? 'Creating Pledge...' : 'Create Loan Pledge'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 5. Repayment & Settlement Modal with Running Month Calculation & Discount */}
      <Dialog open={!!selectedLoanForRepay} onOpenChange={(open) => !open && setSelectedLoanForRepay(null)}>
        <DialogContent className="max-w-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              Record Repayment ({selectedLoanForRepay?.loan_number})
            </DialogTitle>
            <DialogDescription className="sr-only">
              Record monthly interest or principal settlement for gold loan
            </DialogDescription>
          </DialogHeader>

          {selectedLoanForRepay && (
            <form onSubmit={handleRepaySubmit} className="space-y-4 pt-2">
              {/* Summary Card */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-bold text-slate-900">{selectedLoanForRepay.customer?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Outstanding Principal (அசல்):</span>
                  <span className="font-black text-slate-900 text-base">
                    ₹{selectedLoanForRepay.current_principal_balance.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">
                    Accrued Interest ({selectedLoanForRepay.months_elapsed} Months / {selectedLoanForRepay.days_elapsed}d):
                  </span>
                  <span className="font-black text-rose-700 text-base">
                    ₹{selectedLoanForRepay.pending_interest?.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Interest Paid (வட்டி ₹)</Label>
                  <Input
                    type="number"
                    value={interestPaid}
                    onChange={(e) => setInterestPaid(e.target.value)}
                    placeholder="e.g. 1500"
                    className="h-10 text-sm font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Principal Repaid (அசல் ₹)</Label>
                  <Input
                    type="number"
                    value={principalPaid}
                    max={selectedLoanForRepay.current_principal_balance}
                    onChange={(e) => setPrincipalPaid(e.target.value)}
                    placeholder="0"
                    className="h-10 text-sm font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Discount / Waiver (₹)</Label>
                  <Input
                    type="number"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    placeholder="0"
                    className="h-10 text-sm font-bold text-amber-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Payment Note / Mode</Label>
                <Input
                  value={repayNotes}
                  onChange={(e) => setRepayNotes(e.target.value)}
                  placeholder="e.g. Cash / GPay / NetBanking"
                  className="h-10 text-sm"
                />
              </div>

              {/* Settle & Close Checkbox */}
              <label className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl cursor-pointer">
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
                  className="rounded text-emerald-600 w-5 h-5"
                />
                <div>
                  <div className="font-extrabold text-emerald-950 text-sm">
                    Full Settlement & Return Pledged Items (அடகு திருப்புதல்)
                  </div>
                  <div className="text-xs text-emerald-700">
                    Auto-fills remaining principal and accrued interest to close the pledge.
                  </div>
                </div>
              </label>

              <DialogFooter className="pt-2 flex gap-2">
                <Button type="button" variant="outline" onClick={() => setSelectedLoanForRepay(null)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={repayMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 shadow-md"
                >
                  {repayMutation.isPending ? 'Saving Payment...' : 'Save Payment'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* 6. View Loan History Modal */}
      <Dialog open={!!selectedLoanForView} onOpenChange={(open) => !open && setSelectedLoanForView(null)}>
        <DialogContent className="max-w-3xl p-6 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center justify-between">
              <span>Loan Pledge Details: {selectedLoanForView?.loan_number}</span>
              <Badge
                variant="outline"
                className={`text-xs font-bold uppercase px-3 py-1 ${
                  selectedLoanForView?.status === 'ACTIVE'
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                }`}
              >
                {selectedLoanForView?.status}
              </Badge>
            </DialogTitle>
            <DialogDescription className="sr-only">
              View pledge history, collateral items, and repayment vouchers
            </DialogDescription>
          </DialogHeader>

          {selectedLoanForView && (
            <div className="space-y-5 pt-2">
              {/* Customer & Pledge info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="space-y-1">
                  <div className="text-xs text-slate-500 font-bold uppercase">Customer Details</div>
                  <div className="font-extrabold text-slate-900 text-base">{selectedLoanForView.customer?.name}</div>
                  <div className="font-mono text-slate-700 text-sm">{selectedLoanForView.customer?.phone}</div>
                  <div className="text-xs text-slate-600">
                    {selectedLoanForView.customer?.village} {selectedLoanForView.customer?.address ? `• ${selectedLoanForView.customer?.address}` : ''}
                  </div>
                </div>

                <div className="space-y-1 text-left sm:text-right">
                  <div className="text-xs text-slate-500 font-bold uppercase">Financial Terms</div>
                  <div className="font-black text-slate-900 text-lg">
                    Principal: ₹{selectedLoanForView.loan_amount.toLocaleString('en-IN')}
                  </div>
                  <div className="text-sm text-slate-700 font-bold">Interest: {selectedLoanForView.interest_rate}% / month</div>
                  <div className="text-xs text-slate-500">
                    Pledged on{' '}
                    {new Date(selectedLoanForView.loan_date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>

              {/* Ornaments List */}
              <div className="space-y-2">
                <span className="font-bold text-slate-900 uppercase text-xs tracking-wider">Collateral Ornaments:</span>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 uppercase font-bold text-slate-700">
                      <tr>
                        <th className="p-3">Metal</th>
                        <th className="p-3">Item Description</th>
                        <th className="p-3">Purity</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Gross Wt</th>
                        <th className="p-3 text-right">Net Wt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedLoanForView.loanCollateralItem?.map((item: any) => (
                        <tr key={item.id}>
                          <td className="p-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.metal === 'SILVER' ? 'bg-slate-200 text-slate-800' : 'bg-amber-100 text-amber-900'}`}>
                              {item.metal === 'SILVER' ? 'Silver' : 'Gold'}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-slate-900">{item.description}</td>
                          <td className="p-3 font-bold">{item.metal === 'SILVER' ? '—' : (item.purity || 'K22')}</td>
                          <td className="p-3 text-center font-bold">{item.pieces}</td>
                          <td className="p-3 text-right font-medium">{item.gross_weight}g</td>
                          <td className="p-3 text-right font-extrabold text-slate-900">{item.net_weight}g</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Repayments History */}
              <div className="space-y-2">
                <span className="font-bold text-slate-900 uppercase text-xs tracking-wider">Repayment History:</span>
                {selectedLoanForView.loanRepayment?.length === 0 ? (
                  <div className="text-slate-400 text-center py-6 bg-slate-50 rounded-xl text-sm">
                    No payments recorded yet.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 uppercase font-bold text-slate-700">
                        <tr>
                          <th className="p-3">Payment Date</th>
                          <th className="p-3 text-right">Interest Paid</th>
                          <th className="p-3 text-right">Principal Paid</th>
                          <th className="p-3 text-right">Discount</th>
                          <th className="p-3">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedLoanForView.loanRepayment?.map((r: any) => (
                          <tr key={r.id}>
                            <td className="p-3 text-slate-700 font-medium">
                              {new Date(r.payment_date || r.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="p-3 text-right font-bold text-emerald-700">₹{r.interest_paid}</td>
                            <td className="p-3 text-right font-bold text-blue-700">₹{r.principal_paid}</td>
                            <td className="p-3 text-right font-bold text-amber-800">
                              {r.discount_amount ? `₹${r.discount_amount}` : '—'}
                            </td>
                            <td className="p-3 text-slate-600">{r.notes || '—'}</td>
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

      {/* 7. Printable Gold / Silver Loan Pledge Voucher Modal */}
      <Dialog open={!!selectedLoanForPrint} onOpenChange={(open) => !open && setSelectedLoanForPrint(null)}>
        <DialogContent className="max-w-md p-6 text-slate-900">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Printer className="w-5 h-5 text-gold" />
              Print Pledge Voucher
            </DialogTitle>
            <DialogDescription className="sr-only">
              Printable gold and silver loan pledge slip and pawn receipt
            </DialogDescription>
          </DialogHeader>

          <div id="printable-pawn-slip" className="space-y-4 font-mono text-xs border border-slate-300 p-5 rounded-2xl bg-white">
            {/* Header */}
            <div className="text-center border-b border-dashed border-slate-400 pb-3 space-y-1">
              <h2 className="text-base font-black uppercase tracking-wider">{shopProfile?.shop_name || 'JEWELLERY SHOWROOM'}</h2>
              <div className="text-xs text-slate-600">{shopProfile?.address || 'Gold & Silver Merchant & Pawnbroker'}</div>
              <div className="text-xs font-bold">Ph: {shopProfile?.phone || ''}</div>
              <div className="text-xs font-black uppercase pt-1 tracking-widest text-gold">JEWEL LOAN PLEDGE RECEIPT (அடகு ரசீது)</div>
            </div>

            {/* Loan & Customer info */}
            {selectedLoanForPrint && (
              <>
                <div className="flex justify-between border-b border-dashed border-slate-300 pb-2.5">
                  <div>
                    <div><strong>Loan No:</strong> {selectedLoanForPrint.loan_number}</div>
                    <div><strong>Date:</strong> {new Date(selectedLoanForPrint.loan_date).toLocaleDateString('en-IN')}</div>
                  </div>
                  <div className="text-right">
                    <div><strong>Packet:</strong> {selectedLoanForPrint.notes || '—'}</div>
                  </div>
                </div>

                <div className="border-b border-dashed border-slate-300 pb-2.5 space-y-0.5">
                  <div><strong>Customer:</strong> {selectedLoanForPrint.customer?.name}</div>
                  <div><strong>Mobile:</strong> {selectedLoanForPrint.customer?.phone}</div>
                  <div><strong>Address:</strong> {selectedLoanForPrint.customer?.village || ''} {selectedLoanForPrint.customer?.address || ''}</div>
                </div>

                {/* Items */}
                <div className="border-b border-dashed border-slate-300 pb-2.5 space-y-1">
                  <div className="font-bold uppercase text-[11px]">Pledged Items (அடகு விவரம்):</div>
                  {selectedLoanForPrint.loanCollateralItem?.map((i: any, idx: number) => (
                    <div key={idx} className="flex justify-between">
                      <span>[{i.metal === 'SILVER' ? 'Silver' : 'Gold'}] {i.pieces > 1 ? `${i.pieces}x ` : ''}{i.description} {i.purity ? `(${i.purity})` : ''}</span>
                      <span>Net: {i.net_weight}g</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold pt-1.5 text-slate-900 border-t border-slate-200">
                    <span>Total Net Weight:</span>
                    <span>{selectedLoanForPrint.net_weight} g</span>
                  </div>
                </div>

                {/* Financials */}
                <div className="border-b border-dashed border-slate-300 pb-2.5 space-y-1">
                  <div className="flex justify-between text-sm font-black">
                    <span>Loan Principal (அசல்):</span>
                    <span>₹{selectedLoanForPrint.loan_amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Interest Rate:</span>
                    <span>{selectedLoanForPrint.interest_rate}% / month</span>
                  </div>
                </div>

                {/* Signatures */}
                <div className="pt-6 flex justify-between text-[11px] text-center font-bold">
                  <div className="border-t border-slate-400 pt-1 w-28">Customer Signature</div>
                  <div className="border-t border-slate-400 pt-1 w-28">Authorized Signatory</div>
                </div>
              </>
            )}
          </div>

          <DialogFooter className="pt-2 flex gap-2">
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
