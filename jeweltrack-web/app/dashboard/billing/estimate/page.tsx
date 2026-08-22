

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Printer, RotateCcw, History, X, ReceiptText } from 'lucide-react';
import { toast } from 'sonner';

interface EstimateItem {
  item_name: string;
  metal: 'GOLD' | 'SILVER';
  purity: 'K22' | 'K18' | 'K24';
  rate: number;
  weight: number;
  wastage_pct: number;
  wastage_weight: number;
  making_charge: number;
  amount: number;
}

interface HistoryEntry {
  id: string;
  item: EstimateItem;
  total: number;
  time: string;
}

const calcAmount = (item: EstimateItem): number =>
  parseFloat(Number(item.rate * (item.weight + item.wastage_weight) + item.making_charge).toFixed(2));

const defaultItem = (rate22k = 0): EstimateItem => ({
  item_name: '',
  metal: 'GOLD',
  purity: 'K22',
  rate: rate22k,
  weight: 0,
  wastage_pct: 0,
  wastage_weight: 0,
  making_charge: 0,
  amount: 0,
});

export default function EstimatePage() {
  const { user } = useAuthStore();
  const [item, setItem] = useState<EstimateItem>(defaultItem());
  const [initialized, setInitialized] = useState(false);
  const [printError, setPrintError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const fmt = (n: number) => n.toLocaleString('en-IN', { maximumFractionDigits: 2 });

  // Store history specific to the logged-in user / shop
  const userKey = user?.id || user?.shop_id || 'default_user';
  const HISTORY_KEY = 'jeweltrack_estimate_history_' + userKey;

  const getHistory = (): HistoryEntry[] => {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    } catch {
      return [];
    }
  };

  const saveToHistory = (e: HistoryEntry) => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify([e, ...getHistory()].slice(0, 15)));
  };

  // Reset Clears the Local Storage History for this user
  const handleResetHistory = () => {
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
    toast.success('Recent estimate history cleared');
  };

  const { data: rate } = useQuery({
    queryKey: ['recent-rate'],
    queryFn: () => api.get('/rate/recent-rate').then((r) => r.data),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/jewellery-category').then((r) => r.data),
  });

  useEffect(() => {
    if (rate && !initialized) {
      setItem(defaultItem(rate.rate_22k ?? 0));
      setInitialized(true);
    }
  }, [rate, initialized]);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const total = Math.max(item.amount, 0);
  const finalAmount = Math.round(total);
  const billableWeight = parseFloat((Number(item.weight || 0) + Number(item.wastage_weight || 0)).toFixed(3));

  const updateItem = (field: keyof EstimateItem, value: any) => {
    const u = { ...item, [field]: value };
    if (field === 'purity') {
      u.rate =
        value === 'K22'
          ? (rate?.rate_22k ?? 0)
          : value === 'K18'
          ? (rate?.rate_18k ?? 0)
          : (rate?.rate_999 ?? 0);
    }
    if (field === 'metal') {
      u.rate = value === 'SILVER' ? (rate?.rate_silver ?? 0) : (rate?.rate_22k ?? 0);
      u.purity = 'K22';
      u.wastage_pct = 0;
      u.wastage_weight = 0;
    }
    if (field === 'wastage_pct') {
      u.wastage_weight = u.weight > 0 ? parseFloat(((value / 100) * u.weight).toFixed(3)) : 0;
    }
    if (field === 'wastage_weight') {
      u.wastage_pct = u.weight > 0 ? parseFloat(((value / u.weight) * 100).toFixed(2)) : 0;
    }
    if (field === 'weight' && u.wastage_pct > 0) {
      u.wastage_weight = parseFloat(((u.wastage_pct / 100) * Number(value)).toFixed(3));
    }
    u.amount = calcAmount(u);
    setItem(u);
    setPrintError('');
  };

  // Clear Form Inputs
  const handleClearForm = () => {
    setItem(defaultItem(rate?.rate_22k ?? 0));
    setPrintError('');
  };

  const handlePrint = useCallback(() => {
    if (!item.item_name.trim()) return setPrintError('Enter item name');
    if (item.weight <= 0) return setPrintError('Enter item weight');
    if (!item.rate || item.rate <= 0) return setPrintError('Invalid rate');
    if (finalAmount <= 0) return setPrintError('Total amount is ₹0');

    const entry: HistoryEntry = {
      id: Date.now().toString(),
      item,
      total: finalAmount,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };
    saveToHistory(entry);
    setHistory(getHistory());
    window.print();
  }, [item, finalAmount]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'SELECT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        handlePrint();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handlePrint]);

  const inputClass =
    'h-11 text-base font-black text-slate-900 border-slate-300 focus-visible:border-slate-800 focus-visible:ring-2 focus-visible:ring-slate-200 transition-all';

  return (
    <>
      <style>{`
        #print-bill {
          position: absolute;
          left: -9999px;
        }
        @media print {
          body * {
            visibility: hidden;
          }
          #print-bill, #print-bill * {
            visibility: visible;
          }
          #print-bill {
            position: fixed;
            top: 0;
            left: 0;
            width: 48mm;
            max-width: 50mm;
            font-size: 12px;
            padding: 2px 4px;
            background: #fff;
            color: #000;
            font-family: monospace;
          }
        }
      `}</style>

      {/* 100% Single-Screen Viewport without Scroll */}
      <div className="h-[calc(100vh-108px)] flex flex-col max-w-7xl mx-auto px-10 overflow-hidden gap-2.5">
        {/* Compact Header Bar */}
        <div className="flex items-center justify-between bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-xs flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-sm font-black text-slate-900">Quotation Desk (மதிப்பீடு)</span>
            {rate && (
              <div className="hidden sm:flex items-center gap-3 text-xs font-semibold pl-3 border-l border-slate-200">
                <span className="text-amber-950 font-bold">22K: ₹{rate.rate_22k}/g</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-800 font-bold">Silver: ₹{rate.rate_silver}/g</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setHistory(getHistory());
                setShowHistory(true);
              }}
              className="h-8 px-3 text-xs font-bold text-slate-700 border-slate-300 hover:bg-slate-50 cursor-pointer"
            >
              <History className="w-3.5 h-3.5 mr-1 text-slate-600" />
              <span>History ({history.length})</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetHistory}
              title="Reset recent history stored for your account"
              className="h-8 px-2.5 text-xs font-semibold text-slate-600 hover:text-rose-600 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              <span>Reset History</span>
            </Button>
          </div>
        </div>

        {/* 2-Column POS Layout Filling 100% Height */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 flex-1 min-h-0">
          {/* Left Form: 7 Cols */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 px-7 shadow-xs flex flex-col justify-between overflow-hidden">
            <div className="space-y-3.5">
              {/* Row 1: Category + Item Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categories.length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-800">Category Preset</Label>
                    <select
                      value=""
                      onChange={(e) => {
                        const cat = categories.find((c: any) => c.id === e.target.value);
                        if (!cat) return;
                        const ww = cat.default_wastage ?? 0;
                        const u: EstimateItem = {
                          ...item,
                          metal: cat.metal || 'GOLD',
                          item_name: cat.name,
                          wastage_pct: ww,
                          wastage_weight: item.weight > 0 ? parseFloat(((ww / 100) * item.weight).toFixed(3)) : 0,
                          making_charge: cat.default_making_charge ?? 0,
                        };
                        u.amount = calcAmount(u);
                        setItem(u);
                      }}
                      className="w-full h-11 px-3 rounded-lg border border-slate-300 bg-slate-50 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-200 transition-all cursor-pointer"
                    >
                      <option value="">Quick select category...</option>
                      {categories.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.metal})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-800">Item Name</Label>
                  <Input
                    placeholder="e.g. Gold Ring, Necklace"
                    value={item.item_name}
                    onChange={(e) => updateItem('item_name', e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Row 2: Metal + Purity + Rate */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-800">Metal</Label>
                  <select
                    value={item.metal}
                    onChange={(e) => updateItem('metal', e.target.value)}
                    className="w-full h-11 px-2.5 rounded-lg border border-slate-300 bg-white text-sm font-black text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-200 transition-all cursor-pointer"
                  >
                    <option value="GOLD">Gold</option>
                    <option value="SILVER">Silver</option>
                  </select>
                </div>

                {item.metal === 'GOLD' ? (
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-800">Purity</Label>
                    <select
                      value={item.purity}
                      onChange={(e) => updateItem('purity', e.target.value)}
                      className="w-full h-11 px-2.5 rounded-lg border border-slate-300 bg-white text-sm font-black text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-200 transition-all cursor-pointer"
                    >
                      <option value="K22">22K (916)</option>
                      <option value="K18">18K (750)</option>
                      <option value="K24">24K (999)</option>
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-800">Purity</Label>
                    <div className="h-11 px-2.5 flex items-center rounded-lg bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
                      Silver
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-800">Rate (₹/g)</Label>
                  <Input
                    type="number"
                    value={item.rate || ''}
                    onChange={(e) => updateItem('rate', Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Row 3: Weight + Wastage % + Wastage g */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-800">Weight (g) *</Label>
                  <Input
                    type="number"
                    step="0.001"
                    placeholder="0.000"
                    value={item.weight || ''}
                    onChange={(e) => updateItem('weight', Number(e.target.value))}
                    className={inputClass}
                    autoFocus
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-800">Wastage %</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={item.wastage_pct || ''}
                    onChange={(e) => updateItem('wastage_pct', Number(e.target.value))}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-800">Wastage (g)</Label>
                  <Input
                    type="number"
                    step="0.001"
                    placeholder="0.000"
                    value={item.wastage_weight || ''}
                    onChange={(e) => updateItem('wastage_weight', Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Row 4: Making Charge */}
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-800">Making Charge (செய்கூலி ₹)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={item.making_charge || ''}
                    onChange={(e) => updateItem('making_charge', Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Error Banner */}
            {printError && (
              <div className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg my-1">
                ⚠️ {printError}
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={handlePrint}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-black h-11 text-base shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-5 h-5" />
                <span>Print Estimate Slip (Enter ↵)</span>
              </Button>

              <Button
                variant="outline"
                onClick={handleClearForm}
                title="Clear current form fields"
                className="h-11 px-6 text-sm font-bold text-slate-700 hover:text-rose-600 border-slate-300 cursor-pointer"
              >
                Clear Form
              </Button>
            </div>
          </div>

          {/* Right Panel: Clean, Simple Estimate Summary (5 Cols) */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-7 pb-10 shadow-xs flex flex-col justify-between overflow-hidden">
            <div className="space-y-1">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-sm font-black text-slate-900">Estimate Calculation</span>
                <span className="text-xs font-bold text-slate-600">
                  {item.metal === 'GOLD' ? `Gold · ${item.purity}` : 'Silver'}
                </span>
              </div>

              <div className="divide-y divide-slate-100 text-sm">
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-600 font-medium">Item</span>
                  <span className="font-bold text-slate-900">{item.item_name || '—'}</span>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-600 font-medium">Rate</span>
                  <span className="font-bold text-slate-900 font-mono">₹{fmt(item.rate)}/g</span>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-600 font-medium">Weight</span>
                  <span className="font-bold text-slate-900 font-mono">{item.weight || 0} g</span>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-600 font-medium">Wastage</span>
                  <span className="font-bold text-slate-900 font-mono">+{item.wastage_weight || 0} g ({item.wastage_pct || 0}%)</span>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-600 font-medium">Making Charge</span>
                  <span className="font-bold text-slate-900 font-mono">₹{fmt(item.making_charge || 0)}</span>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-600 font-medium">GST</span>
                  <span className="font-bold text-slate-900 font-mono">₹0</span>
                </div>
              </div>
            </div>

            {/* Simple, Clean Total Row */}
            <div className="border-t-2 border-slate-900 pt-3 flex items-center justify-between mt-auto">
              <span className="text-lg font-black text-slate-900">Total</span>
              <span className="text-3xl font-black text-slate-900 font-mono">₹{fmt(finalAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Smooth History Slide-over Drawer */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 backdrop-blur-xs transition-opacity duration-300 ${
          showHistory ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setShowHistory(false)}
      />
      <div
        className={`fixed right-0 top-0 h-full w-80 bg-white border-l border-slate-200 z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          showHistory ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
      >
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <span className="text-sm font-black text-slate-900">Recent Estimates</span>
          <button
            onClick={() => setShowHistory(false)}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {history.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-slate-400">No recent estimates yet</div>
          ) : (
            history.map((entry) => (
              <div
                key={entry.id}
                onClick={() => {
                  setItem(entry.item);
                  setShowHistory(false);
                  setPrintError('');
                }}
                className="p-4 hover:bg-slate-50 cursor-pointer transition-colors space-y-1"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 text-sm">{entry.item.item_name || 'Ornament'}</span>
                  <span className="font-black text-emerald-900 text-sm">₹{fmt(entry.total)}</span>
                </div>
                <div className="text-xs text-slate-600 font-medium flex items-center justify-between">
                  <span>{entry.item.weight}g · {entry.item.metal === 'GOLD' ? entry.item.purity : 'Silver'}</span>
                  <span>{entry.time}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {history.length > 0 && (
          <div className="p-4 border-t border-slate-200">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetHistory}
              className="w-full text-xs text-rose-600 hover:bg-rose-50 border-rose-200 font-bold cursor-pointer"
            >
              Clear All History
            </Button>
          </div>
        )}
      </div>

      {/* Super-Compact Thermal Print Slip (48mm / 50mm) - No Date, No Shop Info */}
      <div id="print-bill">
        <div style={{ textAlign: 'center', paddingBottom: '2px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '13px', letterSpacing: '1px' }}>ESTIMATE</div>
        </div>

        <div style={{ borderTop: '1px dashed #000', margin: '2px 0 4px 0' }} />

        <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', lineHeight: '1.35' }}>
          <tbody>
            <tr>
              <td>Item</td>
              <td>:</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{item.item_name || 'Ornament'}</td>
            </tr>
            <tr>
              <td>Weight</td>
              <td>:</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{item.weight} g</td>
            </tr>
            <tr>
              <td>Wastage</td>
              <td>:</td>
              <td style={{ textAlign: 'right' }}>+{item.wastage_weight} g ({item.wastage_pct}%)</td>
            </tr>
            <tr>
              <td>Rate</td>
              <td>:</td>
              <td style={{ textAlign: 'right' }}>₹{fmt(item.rate)}</td>
            </tr>
            {item.making_charge > 0 && (
              <tr>
                <td>MC</td>
                <td>:</td>
                <td style={{ textAlign: 'right' }}>₹{fmt(item.making_charge)}</td>
              </tr>
            )}
            <tr>
              <td>GST</td>
              <td>:</td>
              <td style={{ textAlign: 'right' }}>₹0</td>
            </tr>
            <tr style={{ borderTop: '1px solid #000', fontSize: '13px' }}>
              <td style={{ fontWeight: 'bold', paddingTop: '3px' }}>Total</td>
              <td style={{ paddingTop: '3px' }}>:</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold', paddingTop: '3px' }}>₹{fmt(finalAmount)}</td>
            </tr>
          </tbody>
        </table>

        <div style={{ borderTop: '1px dashed #000', margin: '4px 0 1px 0' }} />
      </div>
    </>
  );
}
