'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Users, Plus, Search, Eye, Pencil, X, Loader2, Phone, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

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

  // Pagination states
  const [pageSize, setPageSize] = useState<number>(7);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ['customers', search],
    queryFn: () =>
      search.trim()
        ? api.get(`/customer/search?q=${search.trim()}`).then((r) => r.data)
        : api.get(`/customer/all`).then((r) => r.data),
    gcTime: 5 * 60 * 1000,
  });

  // Reset page to 1 when search or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, pageSize]);

  // Derived Paginated Data
  const totalItems = customers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCustomers = useMemo(() => {
    return customers.slice(startIndex, startIndex + pageSize);
  }, [customers, startIndex, pageSize]);

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
    'h-9.5 sm:h-10 text-xs sm:text-sm font-bold text-slate-900 border-slate-300 focus-visible:border-slate-800 focus-visible:ring-2 focus-visible:ring-slate-200 transition-all';

  return (
    <div className="flex flex-col gap-3 sm:gap-4 max-w-7xl mx-auto w-full pb-6">
      {/* Header Bar — Compact on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 bg-white px-3 py-2 sm:px-5 sm:py-3.5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between gap-2 w-full sm:w-auto">
          <div>
            <h1 className="text-xs sm:text-base font-bold text-slate-900 flex items-center gap-1.5 sm:gap-2">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 shrink-0" />
              <span>Customer Directory</span>
            </h1>
            <p className="hidden sm:block text-xs text-slate-500 mt-0.5">
              Registered showroom clients with purchase history & loan records.
            </p>
          </div>

          {!showForm && (
            <Button
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm());
                setShowForm(true);
              }}
              className="sm:hidden bg-amber-600 hover:bg-amber-700 text-white font-bold h-7.5 px-2.5 text-[11px] flex items-center justify-center gap-1 shadow-xs cursor-pointer shrink-0 rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Customer</span>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-72">
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search name, phone, village..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 sm:pl-9 h-8 sm:h-9.5 text-xs sm:text-sm font-medium border-slate-300 w-full rounded-lg sm:rounded-xl"
            />
          </div>

          {!showForm && (
            <Button
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm());
                setShowForm(true);
              }}
              className="hidden sm:flex bg-amber-600 hover:bg-amber-700 text-white font-bold h-9 px-3.5 text-xs items-center justify-center gap-1.5 shadow-xs cursor-pointer shrink-0 rounded-xl"
            >
              <Plus className="w-4 h-4" />
              <span>Add Customer</span>
            </Button>
          )}
        </div>
      </div>

      {/* Create / Edit Customer Form Card */}
      {showForm && (
        <div className="bg-white border border-slate-200 shadow-xs rounded-xl sm:rounded-2xl p-3.5 sm:p-5 space-y-3.5 sm:space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 sm:pb-3">
            <h2 className="text-sm sm:text-lg font-black text-slate-900">
              {editingId ? 'Edit Customer Details' : 'New Customer Registration'}
            </h2>
            <button
              onClick={resetForm}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="space-y-1 sm:space-y-1.5">
                <Label className="text-xs sm:text-sm font-bold text-slate-800">Customer Name *</Label>
                <Input
                  placeholder="e.g. Ramesh Kumar"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass}
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-1 sm:space-y-1.5">
                <Label className="text-xs sm:text-sm font-bold text-slate-800">Mobile Number *</Label>
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

              <div className="space-y-1 sm:space-y-1.5">
                <Label className="text-xs sm:text-sm font-bold text-slate-800">Village / Town</Label>
                <Input
                  placeholder="e.g. Salem, Erode"
                  value={form.village}
                  onChange={(e) => setForm({ ...form, village: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div className="space-y-1 sm:space-y-1.5">
                <Label className="text-xs sm:text-sm font-bold text-slate-800">Address (Optional)</Label>
                <Input
                  placeholder="Street / Door No"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex flex-row items-center justify-end gap-2 sm:gap-3 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                className="h-9 sm:h-10 px-3.5 sm:px-4 text-xs sm:text-sm font-bold text-slate-700 border-slate-300 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creating || updating}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold h-9 sm:h-10 px-4 sm:px-5 text-xs sm:text-sm shadow-xs cursor-pointer justify-center"
              >
                {creating || updating ? 'Saving...' : editingId ? 'Update Customer' : 'Save Customer'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Customer Master Card with Mobile Card View + Desktop Table */}
      <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl shadow-xs overflow-hidden">
        <div className="px-3.5 sm:px-5 py-2.5 sm:py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="text-xs sm:text-sm font-bold text-slate-800">
            Total Customers: <span className="font-black text-slate-900">{totalItems}</span>
          </div>
          <span className="text-[10px] sm:text-xs text-slate-500 font-medium">Registered Showroom Clients</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-amber-600" />
          </div>
        ) : totalItems === 0 ? (
          <div className="text-center py-14 text-slate-400 space-y-2">
            <Users className="w-9 h-9 mx-auto opacity-30 text-amber-600" />
            <p className="text-xs sm:text-sm font-bold text-slate-700">
              {search ? 'No customers match your search.' : 'No customers registered yet.'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile View: Dedicated cards instead of horizontal table scroll */}
            <div className="block md:hidden divide-y divide-slate-100">
              {paginatedCustomers.map((c: Customer, i: number) => (
                <div key={c.id} className="p-3 hover:bg-slate-50/70 transition-colors space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div
                      onClick={() => router.push(`/dashboard/customers/customerView?id=${c.id}`)}
                      className="cursor-pointer group flex-1 min-w-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          #{startIndex + i + 1}
                        </span>
                        <span className="text-sm font-black text-slate-900 group-hover:text-amber-800 transition-colors truncate">
                          {c.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-1">
                        {c.village ? (
                          <span className="flex items-center gap-1 font-medium text-slate-600 truncate">
                            <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                            {c.village}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Village not added</span>
                        )}
                        {c.address && (
                          <>
                            <span>•</span>
                            <span className="text-slate-400 truncate max-w-[130px]">{c.address}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => router.push(`/dashboard/customers/customerView?id=${c.id}`)}
                        className="h-7 w-7 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                        title="View Profile"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleEdit(c)}
                        className="h-7 w-7 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                        title="Edit Customer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100/70">
                    <a
                      href={`tel:${c.phone}`}
                      className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md hover:bg-emerald-100 transition-colors"
                    >
                      <Phone className="w-3 h-3 text-emerald-600" />
                      <span>{c.phone}</span>
                    </a>

                    <button
                      onClick={() => router.push(`/dashboard/customers/customerView?id=${c.id}`)}
                      className="text-[11px] font-bold text-amber-800 hover:text-amber-900 flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>History & Loans</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Full Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left min-w-[640px]">
                <thead className="bg-slate-50 uppercase tracking-wider text-slate-700 font-bold text-xs border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-2.5 w-12 text-center">#</th>
                    <th className="px-5 py-2.5">Customer Name</th>
                    <th className="px-5 py-2.5">Mobile Number</th>
                    <th className="px-5 py-2.5">Village / Town</th>
                    <th className="px-5 py-2.5">Address</th>
                    <th className="px-5 py-2.5 text-center w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedCustomers.map((c: Customer, i: number) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-2.5 text-sm font-bold text-slate-500 text-center">
                        {startIndex + i + 1}
                      </td>
                      <td className="px-5 py-2.5">
                        <div
                          onClick={() => router.push(`/dashboard/customers/customerView?id=${c.id}`)}
                          className="text-sm font-black text-slate-900 hover:text-amber-800 cursor-pointer transition-colors"
                        >
                          {c.name}
                        </div>
                      </td>
                      <td className="px-5 py-2.5 text-sm font-bold text-slate-800">
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-emerald-700" />
                          <span>{c.phone}</span>
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-sm font-bold text-slate-700">
                        {c.village ? (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-rose-600" />
                            <span>{c.village}</span>
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-sm text-slate-600 max-w-[240px] truncate">
                        {c.address || '—'}
                      </td>
                      <td className="px-5 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => router.push(`/dashboard/customers/customerView?id=${c.id}`)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="View Customer Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleEdit(c)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Edit Customer Details"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-3.5 sm:px-5 py-2.5 sm:py-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-slate-600 bg-slate-50/50">
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <span>
                  Showing <strong className="text-slate-900 font-bold">{totalItems > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + pageSize, totalItems)}</strong> of <strong className="text-slate-900 font-bold">{totalItems}</strong>
                </span>

                {/* Mobile Rows Selector */}
                <div className="sm:hidden flex items-center gap-1">
                  <span className="text-[11px] text-slate-400">Rows:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="h-7 px-1.5 rounded-md border border-slate-300 bg-white font-bold text-slate-900 text-[11px]"
                  >
                    <option value={5}>5</option>
                    <option value={7}>7</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3">
                {/* Desktop Page Size Selector */}
                <div className="hidden sm:flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">Rows:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="h-8 px-2 rounded-lg border border-slate-300 bg-white font-bold text-slate-900 focus:outline-none focus:border-slate-800 cursor-pointer"
                  >
                    <option value={5}>5</option>
                    <option value={7}>7</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                {/* Page Navigation Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="h-7 sm:h-8 px-2 sm:px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-bold flex items-center gap-1 transition-all text-xs"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Prev</span>
                  </button>

                  <span className="px-2 py-1 text-slate-800 font-bold text-xs">
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="h-7 sm:h-8 px-2 sm:px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-bold flex items-center gap-1 transition-all text-xs"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}