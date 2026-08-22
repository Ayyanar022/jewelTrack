'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Users, Plus, Search, Eye, Pencil, X, Loader2, Phone, MapPin } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  phone: string;
  village: string;
  address?: string;
  created_at: string;
}

const emptyForm = () => ({
  name: '',
  phone: '',
  village: '',
  address: '',
});

export default function CustomersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm());
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ['customers', search],
    queryFn: () =>
      search.trim()
        ? api.get(`/customer/search?q=${search.trim()}`).then((r) => r.data)
        : api.get(`/customer/all`).then((r) => r.data),
    gcTime: 5 * 60 * 1000,
  });

  const { mutate: createCustomer, isPending: creating } = useMutation({
    mutationFn: (data: any) => api.post('/customer', data),
    onSuccess: () => {
      toast.success('Customer added successfully!');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to add customer');
    },
  });

  const { mutate: updateCustomer, isPending: updating } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/customer/${id}`, data),
    onSuccess: () => {
      toast.success('Customer updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update customer');
    },
  });

  const formatName = (text: string) => {
    if (!text) return '';
    return text
      .trim()
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedName = formatName(form.name);
    if (!formattedName) {
      toast.error('Customer name is required');
      return;
    }
    if (!form.phone.trim() || form.phone.trim().length < 10) {
      toast.error('Enter valid 10-digit mobile number');
      return;
    }

    const payload = {
      ...form,
      name: formattedName,
      phone: form.phone.trim(),
      village: form.village.trim(),
      address: form.address?.trim() || '',
    };

    if (editingId) {
      updateCustomer({ id: editingId, data: payload });
    } else {
      createCustomer(payload);
    }
  };

  const handleEdit = (c: Customer) => {
    setForm({
      name: c.name,
      phone: c.phone,
      village: c.village || '',
      address: c.address || '',
    });
    setEditingId(c.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const inputClass =
    'h-11 text-base font-bold text-slate-900 border-slate-300 focus-visible:border-slate-800 focus-visible:ring-2 focus-visible:ring-slate-200 transition-all';

  return (
    <div className="flex flex-col gap-5 max-w-7xl mx-auto px-8 pb-20">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-700" />
            <span>Customer Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Customer directory with purchase history, billing records, and gold loan pledges.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Search Box */}
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search name, phone, village..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 text-sm font-medium border-slate-300"
            />
          </div>

          {!showForm && (
            <Button
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm());
                setShowForm(true);
              }}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-10 px-4 text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Customer</span>
            </Button>
          )}
        </div>
      </div>

      {/* Create / Edit Customer Form Card */}
      {showForm && (
        <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-lg font-black text-slate-900">
              {editingId ? 'Edit Customer Details' : 'New Customer Registration'}
            </h2>
            <button
              onClick={resetForm}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-bold text-slate-800">Customer Name *</Label>
                <Input
                  placeholder="e.g. Ramesh Kumar"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass}
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-bold text-slate-800">Mobile Number *</Label>
                <Input
                  type="tel"
                  maxLength={10}
                  placeholder="10-digit number"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
                  className={inputClass}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-bold text-slate-800">Village / Town</Label>
                <Input
                  placeholder="e.g. Salem, Erode"
                  value={form.village}
                  onChange={(e) => setForm({ ...form, village: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-bold text-slate-800">Address (Optional)</Label>
                <Input
                  placeholder="Street / Door No"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <Button
                type="submit"
                disabled={creating || updating}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-11 px-6 text-sm shadow-xs cursor-pointer"
              >
                {creating || updating ? 'Saving...' : editingId ? 'Update Customer' : 'Save Customer'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                className="h-11 px-5 text-sm font-bold text-slate-700 border-slate-300 cursor-pointer"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Customer Master Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="text-base font-bold text-slate-800">
            Total Customers: <span className="font-black text-slate-900">{customers.length}</span>
          </div>
          <span className="text-xs text-slate-500 font-medium">Registered Showroom Clients</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-20 text-slate-400 space-y-2">
            <Users className="w-10 h-10 mx-auto opacity-30 text-gold" />
            <p className="text-sm font-bold text-slate-700">
              {search ? 'No customers match your search.' : 'No customers registered yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 uppercase tracking-wider text-slate-700 font-bold text-xs border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">#</th>
                  <th className="px-6 py-4">Customer Name</th>
                  <th className="px-6 py-4">Mobile Number</th>
                  <th className="px-6 py-4">Village / Town</th>
                  <th className="px-6 py-4">Address</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c: Customer, i: number) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-slate-500">{i + 1}</td>
                    <td className="px-6 py-4">
                      <div
                        onClick={() => router.push(`/dashboard/customers/customerView?id=${c.id}`)}
                        className="text-base font-black text-slate-900 hover:text-amber-800 cursor-pointer transition-colors"
                      >
                        {c.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-800">
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{c.phone}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-700">
                      {c.village ? (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-rose-600" />
                          <span>{c.village}</span>
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-[260px] truncate">
                      {c.address || '—'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => router.push(`/dashboard/customers/customerView?id=${c.id}`)}
                          className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="View Customer Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(c)}
                          className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Edit Customer Details"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}