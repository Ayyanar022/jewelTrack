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
import { Coins, Plus, Search, Trash2, X, UserPlus, Phone, MapPin } from 'lucide-react';

export interface CollateralItem {
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

interface CreateLoanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateLoanModal({ open, onOpenChange }: CreateLoanModalProps) {
  const queryClient = useQueryClient();

  // Customer State
  const [customerSearchInput, setCustomerSearchInput] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [isQuickAddCustomerOpen, setIsQuickAddCustomerOpen] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', phone: '', village: '', address: '' });
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Financial & Item Form State
  const [loanAmount, setLoanAmount] = useState('');
  const [interestRate, setInterestRate] = useState('1.5');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<CollateralItem[]>([emptyCollateralItem()]);

  // Fetch Customers for Search
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

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsCustomerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatName = (text: string) => {
    if (!text) return '';
    return text
      .trim()
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };

  // Quick Add Customer Mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (payload: typeof newCustomerForm) => {
      return api.post('/customer', {
        ...payload,
        name: formatName(payload.name),
        phone: payload.phone.trim(),
        village: payload.village.trim(),
        address: payload.address.trim(),
      });
    },
    onSuccess: (res) => {
      toast.success(`Customer ${res.data?.name} created & selected!`);
      queryClient.invalidateQueries({ queryKey: ['customers-search'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
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

  // Create Loan Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/loan', payload);
    },
    onSuccess: (res) => {
      toast.success(`Pledge ${res.data?.loan_number || ''} created successfully!`);
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loan-stats'] });
      onOpenChange(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to create gold loan');
    },
  });

  const resetForm = () => {
    setSelectedCustomer(null);
    setCustomerSearchInput('');
    setLoanAmount('');
    setInterestRate('1.5');
    setNotes('');
    setItems([emptyCollateralItem()]);
    setIsQuickAddCustomerOpen(false);
  };

  const totalGrossWeight = items.reduce((sum, item) => sum + (Number(item.gross_weight) || 0), 0);
  const totalNetWeight = items.reduce((sum, item) => sum + (Number(item.net_weight) || 0), 0);

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

    if (field === 'gross_weight') {
      const grossVal = Number(value) || 0;
      if (!current.net_weight || current.net_weight === updated[index].gross_weight) {
        current.net_weight = grossVal;
      } else if (current.net_weight > grossVal) {
        current.net_weight = grossVal;
      }
    }

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

  const handleSubmit = (e: React.FormEvent) => {
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
      notes: notes.trim(),
      items: items.map((i) => ({
        metal: i.metal || 'GOLD',
        description: i.description.trim() || (i.metal === 'SILVER' ? 'Silver Ornament' : 'Gold Ornament'),
        purity: i.metal === 'SILVER' ? undefined : i.purity,
        pieces: Number(i.pieces) || 1,
        gross_weight: Number(i.gross_weight) || 0,
        net_weight: Number(i.net_weight) || 0,
      })),
    };

    createMutation.mutate(payload);
  };

  const monthlyInterestVal = Math.round((Number(loanAmount || 0) * Number(interestRate || 0)) / 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-w-4xl w-[95vw] p-6 max-h-[92vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="border-b border-slate-200 pb-3">
          <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Coins className="w-6 h-6 text-amber-700" />
            <span>New Jewellery Loan Pledge</span>
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 ">
            Record customer pledge, ornament weights, interest rate, and loan amount.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-0">
          {/* Section 1: Customer Selection */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3" ref={searchContainerRef}>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                1. Customer Details *
              </Label>
              <button
                type="button"
                onClick={() => setIsQuickAddCustomerOpen(!isQuickAddCustomerOpen)}
                className="text-slate-800 hover:text-slate-950 font-bold text-sm flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isQuickAddCustomerOpen ? 'Hide Form' : '+ Quick Add Customer'}</span>
              </button>
            </div>

            {selectedCustomer ? (
              <div className="flex items-center justify-between bg-white border border-slate-300 p-3.5 rounded-xl shadow-2xs">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-black flex items-center justify-center text-base flex-shrink-0">
                    {selectedCustomer.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-black text-slate-900 text-base">{selectedCustomer.name}</div>
                    <div className="text-sm text-slate-600 font-medium flex items-center gap-3 mt-0.5">
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-800">
                        <Phone className="w-3.5 h-3.5 text-emerald-700" />
                        {selectedCustomer.phone}
                      </span>
                      {selectedCustomer.village && (
                        <span className="inline-flex items-center gap-1 text-slate-700 font-semibold">
                          <MapPin className="w-3.5 h-3.5 text-rose-600" />
                          {selectedCustomer.village}
                        </span>
                      )}
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
                  className="h-9 w-9 p-0 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                  title="Change customer"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Search customer by name, mobile number, village..."
                  value={customerSearchInput}
                  onChange={(e) => {
                    setCustomerSearchInput(e.target.value);
                    setIsCustomerDropdownOpen(true);
                  }}
                  onFocus={() => setIsCustomerDropdownOpen(true)}
                  className="pl-10 h-11 text-base bg-white font-medium border-slate-300 rounded-xl"
                  autoComplete="off"
                />

                {isCustomerDropdownOpen && (
                  <div className="absolute z-50 left-0 right-0 top-12 bg-white rounded-xl border border-slate-200 shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100">
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
                          className="text-sm font-bold text-slate-900 underline cursor-pointer"
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
                          className="p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between"
                        >
                          <div>
                            <div className="font-bold text-slate-900 text-base">{cust.name}</div>
                            <div className="text-sm text-slate-500 font-mono">
                              {cust.phone} {cust.village ? `• ${cust.village}` : ''}
                            </div>
                          </div>
                          <span className="text-sm text-slate-900 font-bold bg-slate-100 border border-slate-200 px-3 py-1 rounded-md">
                            Select
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Quick Add Customer Form */}
            {isQuickAddCustomerOpen && (
              <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-2xs space-y-3">
                <div className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-slate-700" />
                  <span>Quick Add New Customer</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-sm font-bold text-slate-800 block mb-1">Customer Name *</Label>
                    <Input
                      placeholder="e.g. Ramesh Kumar"
                      value={newCustomerForm.name}
                      onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                      className="h-10 text-sm font-bold border-slate-300"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-bold text-slate-800 block mb-1">Mobile (10 digits) *</Label>
                    <Input
                      placeholder="9876543210"
                      maxLength={10}
                      value={newCustomerForm.phone}
                      onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value.replace(/\D/g, '') })}
                      className="h-10 text-sm font-bold font-mono border-slate-300"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-bold text-slate-800 block mb-1">Village / Town</Label>
                    <Input
                      placeholder="e.g. Salem"
                      value={newCustomerForm.village}
                      onChange={(e) => setNewCustomerForm({ ...newCustomerForm, village: e.target.value })}
                      className="h-10 text-sm font-medium border-slate-300"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-bold text-slate-800 block mb-1">Address (Optional)</Label>
                    <Input
                      placeholder="Door / Street No"
                      value={newCustomerForm.address}
                      onChange={(e) => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
                      className="h-10 text-sm font-medium border-slate-300"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsQuickAddCustomerOpen(false)}
                    className="h-9 text-sm font-bold px-4 border-slate-300"
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
                        toast.error('Valid 10-digit mobile number is required');
                        return;
                      }
                      createCustomerMutation.mutate(newCustomerForm);
                    }}
                    className="h-9 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm px-5"
                  >
                    {createCustomerMutation.isPending ? 'Saving...' : 'Save & Select'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Pledged Ornaments */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 uppercase tracking-wider text-sm">
                2. Pledged Ornaments *
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="h-9 text-sm font-bold text-slate-800 border-slate-300 hover:bg-slate-100 px-4 cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-1" />
                <span>Add Ornament</span>
              </Button>
            </div>

            <div className="space-y-2.5">
              {items.map((item, idx) => {
                const isSilver = item.metal === 'SILVER';

                return (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 items-center"
                  >
                    {/* Metal */}
                    <div className="col-span-6 sm:col-span-2">
                      <Label className="text-sm text-slate-700 font-bold block mb-1">Metal</Label>
                      <select
                        value={item.metal}
                        onChange={(e) => handleItemChange(idx, 'metal', e.target.value as 'GOLD' | 'SILVER')}
                        className="w-full h-10 px-2.5 rounded-lg border border-slate-300 text-sm font-bold bg-white text-slate-900 cursor-pointer"
                      >
                        <option value="GOLD">🪙 Gold</option>
                        <option value="SILVER">⚪ Silver</option>
                      </select>
                    </div>

                    {/* Description */}
                    <div className="col-span-6 sm:col-span-3">
                      <Label className="text-sm text-slate-700 font-bold block mb-1">Ornament Name *</Label>
                      <Input
                        placeholder={isSilver ? 'e.g. Silver Anklet' : 'e.g. Gold Ring / Chain'}
                        value={item.description}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                        className="h-10 text-sm bg-white font-bold text-slate-900 border-slate-300"
                        required
                      />
                    </div>

                    {/* Purity */}
                    <div className="col-span-4 sm:col-span-2">
                      <Label className="text-sm text-slate-700 font-bold block mb-1">Purity</Label>
                      {isSilver ? (
                        <div className="h-10 px-3 flex items-center rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-sm font-bold">
                          Silver
                        </div>
                      ) : (
                        <select
                          value={item.purity}
                          onChange={(e) => handleItemChange(idx, 'purity', e.target.value)}
                          className="w-full h-10 px-2.5 rounded-lg border border-slate-300 text-sm bg-white font-bold text-slate-900 cursor-pointer"
                        >
                          <option value="K22">22K (916)</option>
                          <option value="K18">18K (750)</option>
                          <option value="K24">24K</option>
                        </select>
                      )}
                    </div>

                    {/* Pieces */}
                    <div className="col-span-4 sm:col-span-1">
                      <Label className="text-sm text-slate-700 font-bold block mb-1">Pcs</Label>
                      <Input
                        type="number"
                        placeholder="1"
                        value={item.pieces}
                        min={1}
                        onChange={(e) => handleItemChange(idx, 'pieces', Number(e.target.value) || 1)}
                        className="h-10 text-sm bg-white text-center font-bold border-slate-300"
                      />
                    </div>

                    {/* Gross & Net Weights */}
                    <div className="col-span-4 sm:col-span-3 grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-sm text-slate-700 font-bold block mb-1">Gross (g) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={item.gross_weight || ''}
                          onChange={(e) => handleItemChange(idx, 'gross_weight', Number(e.target.value))}
                          className="h-10 text-sm bg-white font-bold text-slate-900 border-slate-300"
                          required
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-slate-700 font-bold block mb-1">Net Wt (g) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={item.net_weight || ''}
                          onChange={(e) => handleItemChange(idx, 'net_weight', Number(e.target.value))}
                          className="h-10 text-sm bg-white font-black text-slate-900 border-slate-300"
                          required
                        />
                      </div>
                    </div>

                    {/* Delete */}
                    <div className="col-span-12 sm:col-span-1 text-center pt-1 sm:pt-6">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={items.length === 1}
                        className="text-slate-400 hover:text-rose-600 disabled:opacity-20 p-1.5 cursor-pointer transition-colors"
                        title="Remove ornament"
                      >
                        <Trash2 className="w-4 h-4 mx-auto" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Weight Bar */}
            <div className="flex justify-between items-center text-sm font-bold px-4 py-2.5 bg-slate-100 rounded-xl border border-slate-200 text-slate-800">
              <span>Total Items: <strong className="text-slate-900 font-black text-base">{items.reduce((s, i) => s + (Number(i.pieces) || 1), 0)} pcs</strong></span>
              <span>
                Gross: <strong className="text-slate-900 font-black text-base">{totalGrossWeight.toFixed(2)}g</strong> · Net Pure Weight: <strong className="text-slate-900 font-black text-lg">{totalNetWeight.toFixed(2)}g</strong>
              </span>
            </div>
          </div>

          {/* Section 3: Loan Amount & Interest Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 border-t border-slate-200">
            <div className="space-y-1.5">
              <Label className="text-sm font-bold text-slate-900">3. Principal Loan Amount (₹) *</Label>
              <Input
                type="number"
                placeholder="e.g. 50000"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                className="h-11 text-lg font-black text-slate-900 border-slate-300 rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-bold text-slate-900">Monthly Interest Rate (% / month) *</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="e.g. 1.5"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="h-11 text-base font-black text-slate-900 border-slate-300 rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-bold text-slate-900">Safe Packet / Locker Ref (Optional)</Label>
              <Input
                placeholder="e.g. Packet #42, Box B"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-11 text-sm font-medium border-slate-300 rounded-xl"
              />
            </div>
          </div>

          {/* Monthly Interest Accrual Banner */}
          {loanAmount && Number(loanAmount) > 0 && (
            <div className="text-sm bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 flex justify-between items-center font-bold text-slate-700">
              <span>Estimated Monthly Interest Accrual:</span>
              <span className="text-slate-900 font-black text-base">
                ₹{monthlyInterestVal.toLocaleString('en-IN')} / month
              </span>
            </div>
          )}

          <DialogFooter className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-11 px-5 text-sm font-bold text-slate-700 border-slate-300 cursor-pointer"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-7 h-11 text-sm rounded-xl shadow-xs cursor-pointer"
            >
              {createMutation.isPending ? 'Creating Pledge...' : 'Create Loan Pledge'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
