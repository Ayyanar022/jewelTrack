'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Package, Plus, SlidersHorizontal, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import LockedFeatureView from "@/components/app_component/common/LockedFeatureView";

interface EntryRows {
  category: string;
  purity: "K22" | "K18";
  weight: string;
  type: "IN" | "OUT";
  adjustment: boolean;
  reference: string;
}

const defaultEntry = (): EntryRows => ({
  category: '',
  purity: "K22",
  weight: "",
  type: "IN",
  adjustment: false,
  reference: 'ADD'
});

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [formHeader, setFormHeader] = useState('Add Stock');
  const [entryForm, setEntryForm] = useState<EntryRows>(defaultEntry());
  const [error, setError] = useState('');

  // Inventory Table Pagination
  const [invPage, setInvPage] = useState(1);
  const [invPageSize, setInvPageSize] = useState(7);

  // Ledger Table Pagination
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerPageSize, setLedgerPageSize] = useState(10);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/jewellery-category').then(r => r.data),
    staleTime: 1000 * 60 * 20,
  });

  const { data: ledgerData, isLoading: isLedgerLoading } = useQuery({
    queryKey: ['inventory_ledger', ledgerPage, ledgerPageSize],
    queryFn: () =>
      api.get(`/inventory/inventory-ledger?page=${ledgerPage}&limit=${ledgerPageSize}`).then(r => r.data),
    staleTime: 1000 * 60 * 5,
  });

  const { data: inventoryTotal = [], isLoading: isInvLoading } = useQuery({
    queryKey: ['inventoryTotal'],
    queryFn: async () => api.get('/inventory/inventory-total').then(r => r.data),
    staleTime: 1000 * 60 * 5,
  });

  const { data: subscription } = useQuery({
    queryKey: ['shop-current-subscription'],
    queryFn: () => api.get('/subscription/current').then(r => r.data),
    staleTime: 60 * 1000,
  });

  const isExpired = subscription?.is_expired;

  // Aggregate summary
  const summary = useMemo(() => {
    if (!inventoryTotal?.length) return null;
    return inventoryTotal.reduce((acc: any, r: any) => ({
      totalIn: acc.totalIn + (r.total_in || 0),
      totalOut: acc.totalOut + (r.total_out || 0),
      totalBorrowed: acc.totalBorrowed + (r.total_borrowed || 0),
      totalBalance: acc.totalBalance + (r.balance || 0),
    }), { totalIn: 0, totalOut: 0, totalBorrowed: 0, totalBalance: 0 });
  }, [inventoryTotal]);

  // Derived Paginated Inventory
  const totalInvItems = inventoryTotal.length;
  const totalInvPages = Math.max(1, Math.ceil(totalInvItems / invPageSize));
  const invStartIndex = (invPage - 1) * invPageSize;
  const paginatedInventory = useMemo(() => {
    return inventoryTotal.slice(invStartIndex, invStartIndex + invPageSize);
  }, [inventoryTotal, invStartIndex, invPageSize]);

  // Ledger Derived Data
  const ledgerItems = useMemo(() => {
    if (Array.isArray(ledgerData)) return ledgerData;
    return ledgerData?.items ?? [];
  }, [ledgerData]);

  const totalLedgerItems = ledgerData?.total ?? ledgerItems.length ?? 0;
  const totalLedgerPages = ledgerData?.totalPages ?? Math.max(1, Math.ceil(totalLedgerItems / ledgerPageSize));
  const ledgerStartIndex = (ledgerPage - 1) * ledgerPageSize;

  const { mutate, isPending } = useMutation({
    mutationFn: (data: any) => api.post('/inventory/in', data),
    onSuccess: () => {
      toast.success(entryForm.adjustment ? 'Stock adjustment recorded!' : 'Stock added successfully!');
      queryClient.invalidateQueries({ queryKey: ['inventory_ledger'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryTotal'] });
      setEntryForm(defaultEntry());
      setOpen(false);
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || "Failed to update stock");
      toast.error(err?.response?.data?.message || "Failed to update stock");
    }
  });

  const handleSubmitStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (isExpired) {
      toast.error('Subscription expired. Renew your plan to add or adjust stock.');
      setError('Subscription expired. Renew your plan to add or adjust stock.');
      return;
    }
    setError('');
    if (!entryForm.category || !entryForm.purity || !entryForm.weight) {
      setError("Please fill all required fields");
      return;
    }
    mutate({
      category_id: entryForm.category,
      purity: entryForm.purity,
      weight: Number(entryForm.weight),
      type: entryForm.type,
      reference: entryForm.reference
    });
  };

  if (subscription?.plan?.features && subscription.plan.features.inventory === false) {
    return (
      <LockedFeatureView
        title="Inventory & Safe Vault Stock"
        badge="Stock Ledger Module"
        requiredPlan="PRO"
        description="Categorize showroom pieces by gold/silver categories, track gross vs net weight, safe vault stock vs borrowed stock with zero discrepancies."
        benefits={[
          'Category-wise inventory stock management (Chains, Rings, Bangles, etc.)',
          'Own showroom stock vs Dealer borrowed stock tracking',
          'In/Out stock movement adjustments with running balance',
          'Purity touch and total gram balance audit',
        ]}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3.5 max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 pb-6">
      {/* Subscription Expired Warning Banner */}
      {isExpired && (
        <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-rose-950 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center font-black shrink-0 shadow-xs">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-rose-800">
                Stock Modification Locked · Plan Expired
              </div>
              <p className="text-sm font-medium text-rose-900 mt-0.5">
                Your subscription has expired. Stock inward entries and adjustments are locked. You can still view current stock balances and movement ledgers.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/settings?tab=subscription"
            className="bg-gradient-to-r from-gold via-amber-400 to-amber-500 text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl shadow-xs hover:brightness-105 transition-all self-start sm:self-auto shrink-0"
          >
            ⚡ Renew Plan to Add Stock
          </Link>
        </div>
      )}

      <Tabs defaultValue="inventory" className="w-full space-y-3.5">
        {/* Unified Compact Toolbar Header (Title + Tabs + Action Buttons) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 bg-white px-3 py-2 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-4 w-full sm:w-auto">
            <h1 className="text-xs sm:text-base font-bold text-slate-900 flex items-center gap-1.5 sm:gap-2 shrink-0">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700" />
              <span>Inventory</span>
            </h1>

            {/* Integrated Tabs */}
            <TabsList className="bg-slate-100 p-0.5 sm:p-1 rounded-xl h-7.5 sm:h-9">
              <TabsTrigger
                value="inventory"
                className="text-[10px] sm:text-xs font-bold px-2 sm:px-3.5 py-1 rounded-lg data-[state=active]:bg-white data-[state=active]:text-amber-900 data-[state=active]:shadow-xs transition-all"
              >
                📦 Balance
              </TabsTrigger>
              <TabsTrigger
                value="ledger"
                className="text-[10px] sm:text-xs font-bold px-2 sm:px-3.5 py-1 rounded-lg data-[state=active]:bg-white data-[state=active]:text-amber-900 data-[state=active]:shadow-xs transition-all"
              >
                📜 Ledger
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
            <Button
              onClick={() => {
                if (isExpired) {
                  toast.error('Subscription plan expired. Renew your plan to add stock.');
                  return;
                }
                setOpen(true);
                setEntryForm(p => ({ ...p, type: 'IN', reference: "ADD", adjustment: false }));
                setFormHeader("Add Stock Item");
                setError('');
              }}
              disabled={isExpired}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-7.5 sm:h-9 px-2.5 sm:px-3.5 text-[11px] sm:text-xs flex items-center justify-center gap-1 shadow-xs cursor-pointer disabled:opacity-50 flex-1 sm:flex-initial rounded-lg sm:rounded-xl"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isExpired ? 'Locked' : 'Add Stock'}</span>
            </Button>

            <Button
              onClick={() => {
                if (isExpired) {
                  toast.error('Subscription plan expired. Renew your plan to perform stock adjustments.');
                  return;
                }
                setOpen(true);
                setEntryForm(p => ({ ...p, adjustment: true, reference: "ADJUSTMENT" }));
                setFormHeader("Stock Adjustment");
                setError('');
              }}
              disabled={isExpired}
              variant="outline"
              className="h-7.5 sm:h-9 px-2.5 sm:px-3.5 text-[11px] sm:text-xs font-bold text-slate-700 border-slate-300 hover:bg-slate-100 flex items-center justify-center gap-1 shadow-xs cursor-pointer disabled:opacity-50 flex-1 sm:flex-initial rounded-lg sm:rounded-xl"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Adjustment</span>
            </Button>
          </div>
        </div>

        {/* Tab 1: Category Balance & Vault Summary */}
        <TabsContent value="inventory" className="space-y-3.5 mt-0">
          <section className="grid grid-cols-1 lg:grid-cols-7 gap-3 sm:gap-4">
            {/* Quick Vault Summary Card (order-first on mobile for quick overview) */}
            <div className="order-first lg:order-last lg:col-span-2">
              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-5 shadow-xs flex flex-col justify-between h-full space-y-3 sm:space-y-4">
                <h3 className="text-xs sm:text-sm font-black text-slate-900 border-b border-slate-100 pb-2">
                  Vault Summary (கையிருப்பு)
                </h3>
                {summary ? (
                  <div className="grid grid-cols-2 lg:flex lg:flex-col gap-2 sm:gap-2.5 flex-1 justify-center">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl bg-emerald-50 border border-emerald-100 p-2 sm:px-3.5 sm:py-2.5">
                      <span className="text-[10px] sm:text-xs font-bold text-emerald-900">Total IN</span>
                      <span className="font-black text-emerald-950 text-xs sm:text-sm font-mono">+{summary.totalIn.toFixed(2)} g</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl bg-rose-50 border border-rose-100 p-2 sm:px-3.5 sm:py-2.5">
                      <span className="text-[10px] sm:text-xs font-bold text-rose-900">Total OUT</span>
                      <span className="font-black text-rose-950 text-xs sm:text-sm font-mono">-{summary.totalOut.toFixed(2)} g</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl bg-amber-50 border border-amber-100 p-2 sm:px-3.5 sm:py-2.5">
                      <span className="text-[10px] sm:text-xs font-bold text-amber-900">Borrowed</span>
                      <span className="font-black text-amber-950 text-xs sm:text-sm font-mono">{summary.totalBorrowed.toFixed(2)} g</span>
                    </div>
                    <div className="col-span-2 lg:col-span-1 flex items-center justify-between rounded-xl bg-slate-900 p-2.5 sm:px-4 sm:py-3.5 shadow-xs">
                      <span className="text-[10px] sm:text-xs font-bold text-slate-300 uppercase tracking-wider">Vault Balance</span>
                      <span className="font-black text-white text-xs sm:text-base font-mono">{summary.totalBalance.toFixed(2)} g</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No stock data yet</p>
                )}
              </div>
            </div>

            {/* Inventory Master Table & Mobile Cards */}
            <div className="lg:col-span-5">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                <div className="px-3.5 sm:px-5 py-2.5 sm:py-3 border-b border-slate-200 flex items-center justify-between">
                  <div className="text-xs sm:text-sm font-bold text-slate-800">
                    Stock by Category: <span className="font-black text-slate-900">{totalInvItems}</span>
                  </div>
                  <span className="text-[11px] sm:text-xs text-slate-500 font-medium">Net Available Weight</span>
                </div>

                {isInvLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-gold" />
                  </div>
                ) : totalInvItems === 0 ? (
                  <div className="text-center py-16 text-slate-400 space-y-2">
                    <Package className="w-10 h-10 mx-auto opacity-30 text-gold" />
                    <p className="text-xs sm:text-sm font-bold text-slate-700">No inventory data yet — add your first stock</p>
                  </div>
                ) : (
                  <>
                    {/* Mobile Card View (md:hidden) */}
                    <div className="divide-y divide-slate-100 md:hidden">
                      {paginatedInventory.map((r: any, i: number) => (
                        <div key={r.category_id + i + "inv_mob"} className="p-3 space-y-2 bg-white">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                                {invStartIndex + i + 1}
                              </span>
                              <span className="text-xs sm:text-sm font-black text-slate-900">
                                {r?.category_name}
                              </span>
                            </div>
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                r?.purity === "K22"
                                  ? "bg-amber-50 text-amber-900 border-amber-200"
                                  : "bg-slate-100 text-slate-700 border-slate-200"
                              }`}
                            >
                              {r?.purity === "K22" ? "22K (916)" : "18K (750)"}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-3 gap-1.5 text-center">
                            <div className="bg-emerald-50/70 border border-emerald-100 rounded-lg p-1.5">
                              <div className="text-[10px] font-bold text-emerald-800 uppercase">Total IN</div>
                              <div className="text-xs font-black font-mono text-emerald-700">
                                +{(r?.total_in || 0).toFixed(2)}g
                              </div>
                            </div>
                            <div className="bg-rose-50/70 border border-rose-100 rounded-lg p-1.5">
                              <div className="text-[10px] font-bold text-rose-800 uppercase">Total OUT</div>
                              <div className="text-xs font-black font-mono text-rose-700">
                                -{(r?.total_out || 0).toFixed(2)}g
                              </div>
                            </div>
                            <div className="bg-amber-50/70 border border-amber-100 rounded-lg p-1.5">
                              <div className="text-[10px] font-bold text-amber-800 uppercase">Borrowed</div>
                              <div className="text-xs font-bold font-mono text-amber-800">
                                {(r?.total_borrowed || 0).toFixed(2)}g
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                            <span className="text-slate-500 font-semibold text-[11px]">Vault Balance:</span>
                            <span className="font-black font-mono text-slate-900 text-xs sm:text-sm">
                              {(r?.balance || 0).toFixed(2)} g
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table View (hidden md:block) */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left min-w-[680px]">
                        <thead className="bg-slate-50 uppercase tracking-wider text-slate-700 font-bold text-[11px] border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-2.5 w-12 text-center">#</th>
                            <th className="px-4 py-2.5">Category</th>
                            <th className="px-4 py-2.5 text-center">Purity</th>
                            <th className="px-4 py-2.5 text-right text-emerald-800">Total IN (g)</th>
                            <th className="px-4 py-2.5 text-right text-rose-800">Total OUT (g)</th>
                            <th className="px-4 py-2.5 text-right text-amber-800">Borrowed (g)</th>
                            <th className="px-4 py-2.5 text-right">Net Balance (g)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {paginatedInventory.map((r: any, i: number) => (
                            <tr key={r.category_id + i + "inv"} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-2.5 text-xs font-bold text-slate-500 text-center">
                                {invStartIndex + i + 1}
                              </td>
                              <td className="px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-900">
                                {r?.category_name}
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                    r?.purity === "K22"
                                      ? "bg-amber-50 text-amber-900 border-amber-200"
                                      : "bg-slate-100 text-slate-700 border-slate-200"
                                  }`}
                                >
                                  {r?.purity === "K22" ? "22K (916)" : "18K (750)"}
                                </Badge>
                              </td>
                              <td className="px-4 py-2.5 text-right font-bold font-mono text-emerald-700 text-xs sm:text-sm">
                                +{(r?.total_in || 0).toFixed(2)}
                              </td>
                              <td className="px-4 py-2.5 text-right font-bold font-mono text-rose-700 text-xs sm:text-sm">
                                -{(r?.total_out || 0).toFixed(2)}
                              </td>
                              <td className="px-4 py-2.5 text-right font-medium font-mono text-amber-700 text-xs sm:text-sm">
                                {(r?.total_borrowed || 0).toFixed(2)}
                              </td>
                              <td className="px-4 py-2.5 text-right font-black font-mono text-slate-900 text-xs sm:text-sm">
                                {(r?.balance || 0).toFixed(2)} g
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Inventory Pagination Footer */}
                    <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 text-[11px] sm:text-xs text-slate-600 bg-slate-50/50">
                      <div className="flex items-center gap-1.5">
                        <span>Showing</span>
                        <strong className="text-slate-900 font-bold">
                          {totalInvItems > 0 ? invStartIndex + 1 : 0} - {Math.min(invStartIndex + invPageSize, totalInvItems)}
                        </strong>
                        <span>of</span>
                        <strong className="text-slate-900 font-bold">{totalInvItems}</strong>
                        <span>items</span>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 font-medium">Rows:</span>
                          <select
                            value={invPageSize}
                            onChange={(e) => {
                              setInvPageSize(Number(e.target.value));
                              setInvPage(1);
                            }}
                            className="h-7 sm:h-8 px-1.5 sm:px-2 rounded-lg border border-slate-300 bg-white font-bold text-slate-900 text-xs focus:outline-none cursor-pointer"
                          >
                            <option value={5}>5</option>
                            <option value={7}>7</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            disabled={invPage <= 1}
                            onClick={() => setInvPage((p) => Math.max(1, p - 1))}
                            className="h-7 sm:h-8 px-2 sm:px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-bold flex items-center gap-0.5 transition-all text-xs"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            <span>Prev</span>
                          </button>

                          <span className="px-2 text-slate-800 font-bold">
                            {invPage} / {totalInvPages}
                          </span>

                          <button
                            disabled={invPage >= totalInvPages}
                            onClick={() => setInvPage((p) => Math.min(totalInvPages, p + 1))}
                            className="h-7 sm:h-8 px-2 sm:px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-bold flex items-center gap-0.5 transition-all text-xs"
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
          </section>
        </TabsContent>

        {/* Tab 2: Movement Ledger */}
        <TabsContent value="ledger" className="space-y-3.5 mt-0">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-3.5 sm:px-5 py-2.5 sm:py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="text-xs sm:text-sm font-bold text-slate-800">
                Ledger Entries: <span className="font-black text-slate-900">{totalLedgerItems}</span>
              </div>
              <span className="text-[11px] sm:text-xs text-slate-500 font-medium">Audit Trail of Stock Movements</span>
            </div>

            {isLedgerLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-gold" />
              </div>
            ) : ledgerItems.length === 0 ? (
              <div className="text-center py-16 text-slate-400 space-y-2">
                <Package className="w-10 h-10 mx-auto opacity-30 text-gold" />
                <p className="text-xs sm:text-sm font-bold text-slate-700">No movement records found</p>
              </div>
            ) : (
              <>
                {/* Mobile Card View (md:hidden) */}
                <div className="divide-y divide-slate-100 md:hidden">
                  {ledgerItems.map((r: any, i: number) => (
                    <div key={i + "his_mob"} className="p-3 space-y-2 bg-white">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <Badge
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              r?.type === 'IN'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                          >
                            {r?.type}
                          </Badge>
                          <span className="text-xs sm:text-sm font-black text-slate-900">
                            {r?.category?.name || '—'}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">
                            ({r?.purity === "K22" ? "22K" : "18K"})
                          </span>
                        </div>
                        <span className={`font-black font-mono text-xs sm:text-sm ${
                          r?.type === 'IN' ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {r?.type === 'IN' ? '+' : '-'}{(r?.weight || 0).toFixed(2)} g
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-50">
                        <div className="flex items-center gap-2">
                          <span>{new Date(r?.created_at).toLocaleDateString('en-IN')}</span>
                          <span>•</span>
                          <span className="font-medium text-slate-600">{r?.stockType || 'OWN'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono">
                          <span>{r?.reference || '—'}</span>
                          {r?.reference_id && (
                            <span className="text-slate-400">#{r.reference_id.slice(-6)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View (hidden md:block) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left min-w-[760px]">
                    <thead className="bg-slate-50 uppercase tracking-wider text-slate-700 font-bold text-[11px] border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2.5 w-12 text-center">#</th>
                        <th className="px-4 py-2.5">Date</th>
                        <th className="px-4 py-2.5 text-center">Type</th>
                        <th className="px-4 py-2.5">Category</th>
                        <th className="px-4 py-2.5 text-center">Purity</th>
                        <th className="px-4 py-2.5 text-right">Weight (g)</th>
                        <th className="px-4 py-2.5 text-center">Stock Type</th>
                        <th className="px-4 py-2.5 text-center">Reference</th>
                        <th className="px-4 py-2.5 text-center">Ref ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ledgerItems.map((r: any, i: number) => (
                        <tr key={i + "his"} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-2.5 text-xs font-bold text-slate-500 text-center">
                            {ledgerStartIndex + i + 1}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-slate-700 font-medium">
                            {new Date(r?.created_at).toLocaleDateString('en-IN')}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <Badge
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                r?.type === 'IN'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-rose-50 text-rose-800 border-rose-200'
                              }`}
                            >
                              {r?.type}
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-900">
                            {r?.category?.name || '—'}
                          </td>
                          <td className="px-4 py-2.5 text-center text-xs font-bold text-slate-700">
                            {r?.purity === "K22" ? "22K" : "18K"}
                          </td>
                          <td className="px-4 py-2.5 text-right font-black font-mono text-slate-900 text-xs sm:text-sm">
                            {(r?.weight || 0).toFixed(2)} g
                          </td>
                          <td className="px-4 py-2.5 text-center text-xs font-medium text-slate-700">
                            {r?.stockType || 'OWN'}
                          </td>
                          <td className="px-4 py-2.5 text-center text-xs font-medium text-slate-700">
                            {r?.reference || '—'}
                          </td>
                          <td className="px-4 py-2.5 text-center text-xs font-mono text-slate-600">
                            {r.reference_id || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Ledger Pagination Footer */}
                <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 text-[11px] sm:text-xs text-slate-600 bg-slate-50/50">
                  <div className="flex items-center gap-1.5">
                    <span>Showing</span>
                    <strong className="text-slate-900 font-bold">
                      {totalLedgerItems > 0 ? ledgerStartIndex + 1 : 0} - {Math.min(ledgerStartIndex + ledgerPageSize, totalLedgerItems)}
                    </strong>
                    <span>of</span>
                    <strong className="text-slate-900 font-bold">{totalLedgerItems}</strong>
                    <span>entries</span>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 font-medium">Rows:</span>
                      <select
                        value={ledgerPageSize}
                        onChange={(e) => {
                          setLedgerPageSize(Number(e.target.value));
                          setLedgerPage(1);
                        }}
                        className="h-7 sm:h-8 px-1.5 sm:px-2 rounded-lg border border-slate-300 bg-white font-bold text-slate-900 text-xs focus:outline-none cursor-pointer"
                      >
                        <option value={5}>5</option>
                        <option value={7}>7</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        disabled={ledgerPage <= 1}
                        onClick={() => setLedgerPage((p) => Math.max(1, p - 1))}
                        className="h-7 sm:h-8 px-2 sm:px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-bold flex items-center gap-0.5 transition-all text-xs"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Prev</span>
                      </button>

                      <span className="px-2 text-slate-800 font-bold">
                        {ledgerPage} / {totalLedgerPages}
                      </span>

                      <button
                        disabled={ledgerPage >= totalLedgerPages}
                        onClick={() => setLedgerPage((p) => Math.min(totalLedgerPages, p + 1))}
                        className="h-7 sm:h-8 px-2 sm:px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-bold flex items-center gap-0.5 transition-all text-xs"
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
        </TabsContent>
      </Tabs>

      {/* Stock Entry Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[92vw] sm:max-w-[420px] rounded-2xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-sm sm:text-base font-black text-slate-900">{formHeader}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitStock} className="flex flex-col gap-3 sm:gap-4 pt-1 sm:pt-2">
            <div className="flex flex-col gap-1 sm:gap-1.5">
              <Label className="text-[11px] sm:text-xs font-bold text-slate-800">Category *</Label>
              <select
                value={entryForm.category}
                onChange={(e) => setEntryForm(p => ({ ...p, category: e.target.value }))}
                className="h-8.5 sm:h-10 text-xs sm:text-sm border border-slate-300 rounded-xl px-2.5 sm:px-3 font-bold text-slate-900 focus:outline-none focus:border-slate-800 cursor-pointer"
                required
              >
                <option value=''>Select category</option>
                {categories?.map((c: any) => (
                  <option value={c.id} key={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2.5 sm:gap-4">
              <div className="flex flex-col gap-1 sm:gap-1.5 w-1/2">
                <Label className="text-[11px] sm:text-xs font-bold text-slate-800">Purity</Label>
                <select
                  value={entryForm.purity}
                  className="h-8.5 sm:h-10 text-xs sm:text-sm border border-slate-300 rounded-xl px-2.5 sm:px-3 font-bold text-slate-900 focus:outline-none focus:border-slate-800 cursor-pointer"
                  onChange={(e) => setEntryForm(p => ({ ...p, purity: e.target.value as "K22" | "K18" }))}
                >
                  <option value="K22">22K (916)</option>
                  <option value="K18">18K (750)</option>
                </select>
              </div>

              {entryForm.adjustment && (
                <div className="flex flex-col gap-1 sm:gap-1.5 w-1/2">
                  <Label className="text-[11px] sm:text-xs font-bold text-slate-800">Movement Type</Label>
                  <select
                    value={entryForm.type}
                    className="h-8.5 sm:h-10 text-xs sm:text-sm border border-slate-300 rounded-xl px-2.5 sm:px-3 font-bold text-slate-900 focus:outline-none focus:border-slate-800 cursor-pointer"
                    onChange={(e) => setEntryForm(p => ({ ...p, type: e.target.value as "IN" | "OUT" }))}
                  >
                    <option value="IN">IN (+ Stock)</option>
                    <option value="OUT">OUT (- Stock)</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1 sm:gap-1.5">
              <Label className="text-[11px] sm:text-xs font-bold text-slate-800">Weight (g) *</Label>
              <input
                step="any"
                value={entryForm.weight}
                min={0}
                placeholder="0.00"
                className="h-8.5 sm:h-10 text-xs sm:text-sm font-mono border border-slate-300 rounded-xl px-2.5 sm:px-3 font-bold text-slate-900 focus:outline-none focus:border-slate-800"
                type="number"
                onChange={(e) => setEntryForm(p => ({ ...p, weight: e.target.value }))}
                required
              />
            </div>

            {error && <span className="text-xs font-bold text-rose-600">{error}</span>}

            <div className="flex gap-2.5 sm:gap-3 w-full pt-1.5 sm:pt-2">
              <Button type="submit" className="w-1/2 bg-slate-900 hover:bg-slate-800 font-bold h-8.5 sm:h-10 text-xs sm:text-sm rounded-xl" disabled={isPending}>
                {isPending ? "Saving..." : "Save Stock"}
              </Button>
              <Button
                type="button"
                className="w-1/2 font-bold h-8.5 sm:h-10 text-xs sm:text-sm rounded-xl"
                variant="outline"
                onClick={() => { setEntryForm(defaultEntry()); setOpen(false); setError(''); }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
