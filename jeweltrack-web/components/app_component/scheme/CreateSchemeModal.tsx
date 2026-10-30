'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Customer } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Sparkles, Search, UserPlus, Phone, MapPin, X, ArrowRight, Loader2 } from 'lucide-react';

interface CreateSchemeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  todayRate22k?: number;
}

export default function CreateSchemeModal({
  open,
  onOpenChange,
  todayRate22k = 0,
}: CreateSchemeModalProps) {
  const queryClient = useQueryClient();

  // Customer Picker State
  const [customerSearchInput, setCustomerSearchInput] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [isQuickAddCustomerOpen, setIsQuickAddCustomerOpen] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', phone: '', village: '', address: '' });
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Scheme Details State
  const [title, setTitle] = useState('Flexi 916 Gold Scheme');
  const [targetGrams, setTargetGrams] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [notes, setNotes] = useState('');

  // Initial Deposit State
  const [hasInitialDeposit, setHasInitialDeposit] = useState(false);
  const [initialAmount, setInitialAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER'>('CASH');
  const [customRate, setCustomRate] = useState(todayRate22k > 0 ? String(todayRate22k) : '');
  const [transactionRef, setTransactionRef] = useState('');

  // Synchronize customRate when todayRate22k updates
  useEffect(() => {
    if (todayRate22k > 0 && !customRate) {
      setCustomRate(String(todayRate22k));
    }
  }, [todayRate22k, customRate]);

  // Handle outside click for customer search dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsCustomerDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Customer search query
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
    enabled: open,
  });

  // Calculate live grams credited for initial deposit
  const effectiveRate = Number(customRate) > 0 ? Number(customRate) : todayRate22k;
  const initialGramsCredited =
    hasInitialDeposit && Number(initialAmount) > 0 && effectiveRate > 0
      ? Math.round((Number(initialAmount) / effectiveRate) * 1000) / 1000
      : 0;

  // Quick Add Customer Mutation
  const addCustomerMutation = useMutation({
    mutationFn: async (data: typeof newCustomerForm) => {
      const res = await api.post('/customer', data);
      return res.data;
    },
    onSuccess: (newCust) => {
      setSelectedCustomer(newCust);
      setIsQuickAddCustomerOpen(false);
      setIsCustomerDropdownOpen(false);
      setNewCustomerForm({ name: '', phone: '', village: '', address: '' });
      toast.success(`Customer "${newCust.name}" created successfully`);
      queryClient.invalidateQueries({ queryKey: ['customers-search'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create customer');
    },
  });

  // Create Scheme Mutation
  const createSchemeMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/scheme', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Gold Savings Account created successfully! ✨');
      queryClient.invalidateQueries({ queryKey: ['schemes'] });
      queryClient.invalidateQueries({ queryKey: ['scheme-stats'] });
      handleClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create gold scheme');
    },
  });

  const handleClose = () => {
    setSelectedCustomer(null);
    setCustomerSearchInput('');
    setTitle('Flexi 916 Gold Scheme');
    setTargetGrams('');
    setTargetAmount('');
    setNotes('');
    setHasInitialDeposit(false);
    setInitialAmount('');
    setTransactionRef('');
    setIsQuickAddCustomerOpen(false);
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      toast.error('Please select or add a customer');
      return;
    }

    if (hasInitialDeposit) {
      if (!Number(initialAmount) || Number(initialAmount) <= 0) {
        toast.error('Please enter a valid initial deposit amount');
        return;
      }
      if (!effectiveRate || effectiveRate <= 0) {
        toast.error("Please enter today's 22K gold rate");
        return;
      }
    }

    const payload: any = {
      customer_id: selectedCustomer.id,
      title: title.trim() || 'Flexi 916 Gold Scheme',
      target_grams: targetGrams ? Number(targetGrams) : 0,
      target_amount: targetAmount ? Number(targetAmount) : 0,
      notes: notes.trim() || undefined,
    };

    if (hasInitialDeposit && Number(initialAmount) > 0) {
      payload.initial_deposit = {
        amount: Number(initialAmount),
        payment_mode: paymentMode,
        custom_rate: Number(customRate) > 0 ? Number(customRate) : undefined,
        transaction_ref: transactionRef.trim() || undefined,
        notes: 'Initial account opening deposit',
      };
    }

    createSchemeMutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl lg:max-w-3xl w-[calc(100vw-2rem)] max-h-[85dvh] flex flex-col p-0 gap-0 overflow-hidden shadow-2xl border-slate-200">
        {/* Pinned Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 bg-white shrink-0">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black text-slate-900">
                  Open New Gold Scheme (தங்க சேமிப்பு திட்டம்)
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  Customer deposits cash anytime, instantly converted into 916 Gold grams.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Scrollable Form Body with min-h-0 */}
        <form id="create-scheme-form" onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5">
          {/* 1. Customer Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              1. Customer Information <span className="text-rose-500">*</span>
            </Label>

            {selectedCustomer ? (
              <div className="flex items-center justify-between p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl">
                <div>
                  <div className="text-sm font-black text-slate-900">{selectedCustomer.name}</div>
                  <div className="text-xs text-slate-600 flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 font-semibold">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> {selectedCustomer.phone}
                    </span>
                    {selectedCustomer.village && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> {selectedCustomer.village}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCustomer(null)}
                  className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                >
                  <X className="w-4 h-4 mr-1" /> Change
                </Button>
              </div>
            ) : (
              <div className="relative" ref={searchContainerRef}>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <Input
                    placeholder="Search customer by name or mobile number..."
                    value={customerSearchInput}
                    onChange={(e) => {
                      setCustomerSearchInput(e.target.value);
                      setIsCustomerDropdownOpen(true);
                    }}
                    onFocus={() => setIsCustomerDropdownOpen(true)}
                    className="pl-10 text-sm h-10 border-slate-300"
                  />
                </div>

                {isCustomerDropdownOpen && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
                    <div className="p-2 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                      <span className="text-xs font-bold text-slate-600">Select Customer</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsQuickAddCustomerOpen(true);
                          setIsCustomerDropdownOpen(false);
                        }}
                        className="h-7 text-xs text-amber-700 font-bold hover:bg-amber-100"
                      >
                        <UserPlus className="w-3.5 h-3.5 mr-1" /> + Add New Customer
                      </Button>
                    </div>

                    {searchCustomers.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        No customer found matching &quot;{customerSearchInput}&quot;. Click &quot;Add New Customer&quot; above.
                      </div>
                    ) : (
                      searchCustomers.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setSelectedCustomer(c);
                            setIsCustomerDropdownOpen(false);
                          }}
                          className="p-2.5 hover:bg-amber-50 cursor-pointer border-b border-slate-100 last:border-b-0 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900">{c.name}</span>
                            <span className="text-slate-500 ml-2">({c.phone})</span>
                          </div>
                          {c.village && <span className="text-slate-400 text-[11px]">{c.village}</span>}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Quick Add Customer Dialog Inline */}
            {isQuickAddCustomerOpen && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 mt-2">
                <div className="text-xs font-black text-slate-900 flex items-center justify-between">
                  <span>Quick Add New Customer</span>
                  <button
                    type="button"
                    onClick={() => setIsQuickAddCustomerOpen(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    Cancel
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[11px] text-slate-600 font-bold">Name *</Label>
                    <Input
                      placeholder="e.g. Meena S"
                      value={newCustomerForm.name}
                      onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-slate-600 font-bold">Phone *</Label>
                    <Input
                      placeholder="e.g. 9876543210"
                      value={newCustomerForm.phone}
                      onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-[11px] text-slate-600 font-bold">Village / City</Label>
                    <Input
                      placeholder="e.g. Madurai"
                      value={newCustomerForm.village}
                      onChange={(e) => setNewCustomerForm({ ...newCustomerForm, village: e.target.value })}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={!newCustomerForm.name || !newCustomerForm.phone || addCustomerMutation.isPending}
                  onClick={() => addCustomerMutation.mutate(newCustomerForm)}
                  className="w-full h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  {addCustomerMutation.isPending ? 'Saving...' : 'Save & Select Customer'}
                </Button>
              </div>
            )}
          </div>

          {/* 2. Scheme Details */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              2. Scheme Plan & Targets (Optional)
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <Label className="text-xs text-slate-600">Scheme Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Flexi Gold Scheme"
                  className="h-9 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-600">Target Gold (Grams)</Label>
                <Input
                  type="number"
                  step="0.001"
                  placeholder="e.g. 8.000"
                  value={targetGrams}
                  onChange={(e) => setTargetGrams(e.target.value)}
                  className="h-9 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-600">Target Amount (₹)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 50000"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="h-9 text-xs mt-1"
                />
              </div>
            </div>
          </div>

          {/* 3. Initial Opening Deposit Toggle */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-black text-slate-900">Initial Opening Deposit</div>
                <div className="text-[11px] text-slate-500">
                  Does the customer wish to pay an opening deposit today?
                </div>
              </div>
              <input
                type="checkbox"
                id="initialDepCheck"
                checked={hasInitialDeposit}
                onChange={(e) => setHasInitialDeposit(e.target.checked)}
                className="w-4 h-4 accent-amber-600 cursor-pointer rounded"
              />
            </div>

            {hasInitialDeposit && (
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Amount Paid (₹) *</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 5000"
                      value={initialAmount}
                      onChange={(e) => setInitialAmount(e.target.value)}
                      className="h-9 text-xs font-black text-slate-900 mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-700">22K Gold Rate (₹/g) *</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 6850"
                      value={customRate}
                      onChange={(e) => setCustomRate(e.target.value)}
                      className="h-9 text-xs font-black text-amber-800 mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Payment Mode</Label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value as any)}
                      className="w-full h-9 rounded-md border border-slate-300 text-xs px-2.5 font-semibold bg-white mt-1"
                    >
                      <option value="CASH">Cash</option>
                      <option value="UPI">UPI (GPay / PhonePe)</option>
                      <option value="CARD">Debit / Credit Card</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                    </select>
                  </div>
                </div>

                {/* Live Grams Credited Calculation Box */}
                {initialGramsCredited > 0 && (
                  <div className="p-3 bg-amber-500/10 border border-amber-300 rounded-lg flex items-center justify-between text-xs">
                    <span className="font-semibold text-amber-900">
                      Credited 916 Gold Grams:
                    </span>
                    <span className="text-sm font-black text-amber-900 flex items-center gap-1">
                      {initialGramsCredited.toFixed(3)} g
                      <ArrowRight className="w-3.5 h-3.5" /> (₹{initialAmount} ÷ ₹{effectiveRate}/g)
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label className="text-xs text-slate-600">Notes / Remarks</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Referred by Murugan / For Daughter Marriage"
              className="h-9 text-xs mt-1"
            />
          </div>

        </form>

        {/* Pinned Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-3.5 border-t border-slate-200 bg-slate-50 shrink-0 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-2.5">
          <Button type="button" variant="outline" onClick={handleClose} className="h-9 text-xs font-semibold w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-scheme-form"
            disabled={createSchemeMutation.isPending || !selectedCustomer}
            className="h-9 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs px-5 w-full sm:w-auto justify-center"
          >
            {createSchemeMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Creating Account...
              </>
            ) : (
              'Create Gold Scheme Account ✨'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
