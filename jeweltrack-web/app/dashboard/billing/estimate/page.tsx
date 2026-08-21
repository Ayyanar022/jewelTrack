
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';

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
  discount: number;
  total: number;
  date: string;
}

const calcAmount = (item: EstimateItem): number =>
  parseFloat(Number(item.rate * (item.weight + item.wastage_weight) + item.making_charge).toFixed(2)); 

const defaultItem = (rate22k = 0): EstimateItem => ({
  item_name: '', metal: 'GOLD', purity: 'K22',
  rate: rate22k, weight: 0, wastage_pct: 0,
  wastage_weight: 0, making_charge: 0, amount: 0,
});

// const user = use



export default function EstimatePage() {
  const [item, setItem] = useState<EstimateItem>(defaultItem());
  const [discount, setDiscount] = useState(0);
  const [initialized, setInitialized] = useState(false);
  const [printError, setPrintError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
   const { shop } = useAuthStore();
  //  console.log("shop",shop)


  const fmt = (n: number) => n.toLocaleString('en-IN', { maximumFractionDigits: 2 });

const HISTORY_KEY = 'estimate_history'+shop?.id;
const getHistory = (): HistoryEntry[] => {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
};
const saveToHistory = (e: HistoryEntry) => {
  localStorage.setItem(HISTORY_KEY, JSON.stringify([e, ...getHistory()].slice(0, 10)));
};

const handleRest = ()=> {localStorage.removeItem(HISTORY_KEY) ;setHistory(getHistory());}

  const { data: rate } = useQuery({
    queryKey: ['recent-rate'],
    queryFn: () => api.get('/rate/recent-rate').then(r => r.data)
  });

  useEffect(()=>{
    setItem(defaultItem(rate?.rate_22k ?? 0));
    setInitialized(true)
  },[rate,initialized])

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/jewellery-category').then(r => r.data),
  });



  const total = Math.max(item.amount - discount, 0);
  const gst = total * 0.03 ;
  const finalAmount = gst+total ;

  const updateItem = (field: keyof EstimateItem, value: any) => {
    let u = { ...item, [field]: value };
    if (field === 'purity') {
      u.rate = value === 'K22' ? (rate?.rate_22k ?? 0) : value === 'K18' ? (rate?.rate_18k ?? 0) : (rate?.rate_999 ?? 0);
    }
    if (field === 'metal') {
      u.rate = value === 'SILVER' ? (rate?.rate_silver ?? 0   ) : (rate?.rate_22k ?? 0);
      u.purity = 'K22';
      
    }
    if (field === 'wastage_pct') {
      u.wastage_weight = u.weight > 0 ? parseFloat(((value / 100) * u.weight).toFixed(3)) : 0;
    }
    if (field === 'wastage_weight') {
      u.wastage_pct = u.weight > 0 ? parseFloat(((value / u.weight) * 100).toFixed(2)) : 0;
    }
    if (field === 'weight' && u.wastage_pct > 0) {
      u.wastage_weight = parseFloat(((u.wastage_pct / 100) * value).toFixed(3));
    }
    u.amount = calcAmount(u);
    setItem(u);
    setPrintError('');
  };

  const handleClear = () => { setItem(defaultItem(rate?.rate_22k ?? 0)); setDiscount(0); setPrintError(''); };


  const handlePrint = useCallback(() => {
    if(!item.item_name) return  setPrintError(`Enter item name`);
    if (item.weight <= 0)return setPrintError('Enter weight first'); 
    if(!item.rate) return setPrintError('Invalid rate');
    if(total<0) return setPrintError("Invalid total") ;

    if (total <= 0) { setPrintError('Total is ₹0 — check values'); return; }
    const entry: HistoryEntry = { id: Date.now().toString(), item, discount, total, date: new Date().toLocaleString('en-IN') };
    saveToHistory(entry);
    setHistory(getHistory());
    window.print();
    handleClear()
  }, [item, discount, total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'SELECT') handlePrint();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handlePrint]);

  useEffect(() => { setHistory(getHistory()); }, []);


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
        width: 58mm;
        font-size: 12px;
        padding: 5px;
      }
    }

      
        .ef {
          width: 100%;
          border: 0.5px solid rgba(180,140,60,0.25);
          border: 1.5px solid #EDA35A;
          border-radius: 8px;
          padding: 5px 12px;
          font-size: 17px;
          background: transparent;
          color: var(--foreground);
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .ef:focus {
          outline: none;
          border-color: var(--gold, #b48c3c);
          box-shadow: 0 0 0 2px rgba(180,140,60,0.12);
        }
        .ef::placeholder { opacity: 0.8; font-size:15px; }
        .drawer-enter { animation: slideIn 0.22s ease; }
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .backdrop-enter { animation: fadeIn 0.2s ease; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      {/* Full viewport, no scroll */}
      <div className="h-[calc(100vh-100px)] flex flex-col px-4 pb-3 max-w-5xl mx-auto overflow-hidden ">

        {/* ── TOP BAR (minimal) ── */}
        <div className="flex items-center justify-end mb-3 flex-shrink-0">
       
          <div className="flex items-center  gap-3">
            <button
              onClick={() => { setHistory(getHistory()); setShowHistory(true); }}
              className="text-xs cursor-pointer text-gold-dark border border-gold/25 px-3 py-1.5 rounded-lg hover:border-gold hover:text-foreground transition-colors"
            >
              History ({history.length})
            </button>
            <button onClick={handleRest} className="text-xs cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
              Reset
            </button>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="flex gap-10 flex-1 min-h-0">

          {/* ── FORM (left, 3/5) ── */}
          <div className="flex-[2.5] bg-white border border-gold/25 rounded-xl flex flex-col overflow-hidden">

            {/* Thin gold top accent */}
            <div className="h-0.5 bg-gradient-to-r from-gold/60 via-gold to-gold/60 flex-shrink-0" />

            <div className="flex-1 px-7 py-4 flex flex-col gap-3 overflow-hidden">

              {/* Category + Item name */}
              <div className="grid grid-cols-2 gap-6">
                {categories?.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-sidebar-dark">Category</label>
                    <select
                      value=""
                      onChange={(e) => {
                        const cat = categories.find((c: any) => c.id === e.target.value);
                        if (!cat) return;
                        const ww = cat.default_wastage ?? 0;
                        // const u = { ...item, item_name: cat.name, wastage_weight: ww, wastage_pct: item.weight > 0 ? parseFloat(((ww / item.weight) * 100).toFixed(3)) : 0, making_charge: cat.default_making_charge ?? 0 };
                        const u = { ...item,metal:cat.metal , item_name: cat.name, wastage_pct: ww, wastage_weight: item.weight > 0 ? parseFloat(((ww / 100) * item.weight).toFixed(3)) : 0, making_charge: cat.default_making_charge ?? 0 };
                        u.amount = calcAmount(u); 
                        setItem(u);
                      }}
                      className="ef h-10"
                    >
                      <option value="" >Quick fill...</option>
                      {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-sidebar-dark tracking-wide">Item name</label>
                  <input type="text" value={item.item_name} onChange={(e) => updateItem('item_name', e.target.value)}
                    placeholder="e.g. Necklace, Ring" className="ef" />
                </div>
              </div>

              {/* Metal + Purity + Rate */}
              <div className="grid grid-cols-3 gap-6">
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-sidebar-dark tracking-wide">Metal</label>
                  <select value={item.metal} onChange={(e) => {updateItem('metal', e.target.value) ; setItem((prev)=>({...prev , wastage_pct:0 ,wastage_weight:0}))}} className="ef h-10 ">
                    <option  value="GOLD">Gold</option>
                    <option value="SILVER">Silver</option>
                  </select>
                </div>
                {item.metal === 'GOLD' && (
                  <div className="flex flex-col gap-1  ">
                    <label className="text-sm text-sidebar-dark tracking-wide">Purity</label>
                    <select value={item.purity} onChange={(e) => updateItem('purity', e.target.value)} className="ef h-10">
                      <option value="K22">22K</option>
                      <option value="K18">18K</option>
                      <option value="K24">24K</option>
                    </select>
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-sidebar-dark tracking-wide">Rate (₹/g)</label>
                  <input type="number" value={item.rate || ''} onChange={(e) => updateItem('rate', Number(e.target.value))}
                    placeholder="0" className="ef" />
                </div>
              </div>

              {/* Weight + Wastage % + Wastage g */}
              <div className="grid grid-cols-3 gap-6">
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-sidebar-dark tracking-wide">Weight (g)</label>
                  <input type="number" value={item.weight || ''} onChange={(e) => updateItem('weight', Number(e.target.value))}
                    placeholder="0.000" className="ef" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-sidebar-dark tracking-wide">Wastage %</label>
                  <div className="relative">
                    <input type="number" value={item.wastage_pct || ''} onChange={(e) => updateItem('wastage_pct', Number(e.target.value))}
                      placeholder="0.00" className="ef pr-6" />
                    <span className="absolute right-8 top-1/2 -translate-y-1/2 text-sm text-sidebar-dark tracking-wide pointer-events-none">%</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-sidebar-dark tracking-wide">Wastage (g)</label>
                  <div className="relative">
                    <input type="number" value={item.wastage_weight || ''} onChange={(e) => updateItem('wastage_weight', Number(e.target.value))}
                      placeholder="0.000" className="ef pr-5" />
                    <span className="absolute right-8 top-1/2 -translate-y-1/2 text-sm text-sidebar-dark tracking-wide pointer-events-none">g</span>
                  </div>
                </div>
              </div>

              {/* Making charge + Discount */}
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-sidebar-dark tracking-wide">Making charge (₹)</label>
                  <input type="number" value={item.making_charge || ''} onChange={(e) => updateItem('making_charge', Number(e.target.value))}
                    placeholder="0" className="ef" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-sidebar-dark tracking-wide">Discount (₹)</label>
                  <input type="number" value={discount || ''} onChange={(e) => { setDiscount(Number(e.target.value)); setPrintError(''); }}
                    placeholder="0" className="ef" />
                </div>
              </div>

              {/* Error */}
              {printError && (
                // <p className="text-xs text-red-500 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">⚠ {printError}</p>
                <p className="text-sm text-red-500 bg-red-50 border border-red-200 px-5 py-0.5 rounded-lg">⚠ {printError}</p>
              )}

            <div className='  mt-auto flex   gap-5'>

              <button  onClick={handlePrint}
                className="w-full flex-3 bg-gold text-white py-2 rounded-lg text-base font-medium hover:bg-gold/90 transition-colors">
                Print
              </button>

              <button onClick={handleClear}
                className="w-full flex-1 bg-white  text-red-600 border border-red-600  py-2 rounded-lg text-base font-medium     duration-200 cursor-pointer  hover:shadow-red-300 transition-colors">
                Clear
              </button>
            </div>

              {/* Hint */}
              <p className="text-sm text-muted-foreground mt-auto">
                Press <kbd className="bg-gold/10 text-gold px-1.5 py-0.5 rounded text-xs font-mono">Enter</kbd> to print
              </p>

            </div>
          </div>

          {/* ── BILL PREVIEW (right, 2/5) ── */}
          <div className="flex-[1.35] bg-white border border-gold/25 rounded-xl flex flex-col overflow-hidden">

            <div className="h-0.5 bg-gradient-to-r from-gold/60 via-gold to-gold/60 flex-shrink-0" />

            {/* Bill rows */}
            <div className="flex-1 px-8 py-4 flex flex-col gap-0 overflow-hidden shadow">
              <p className="text-sm font-semibold uppercase tracking-widest text-gold mb-1">Bill</p>

              {[
                { label: 'Item', value: item.item_name || '—' },
                { label: 'Metal', value: item.metal === 'GOLD' ? `Gold · ${item.purity}` : 'Silver' },
                { label: 'Rate', value: `₹ ${fmt(item.rate)}` },
                { label: 'Weight', value: `${item.weight} g` },
                { label: 'Wastage', value: `${item.wastage_weight} g ` },
                { label: 'MC', value: `₹${fmt(item.making_charge)}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-1.5 border-b border-dashed border-gold/20 last:border-0">
                  <span className="text-sm text-slate-600">{label}</span>
                  <span className="text-[16px] text-foreground font-medium">{value}</span>
                </div>
              ))}

              {/* Totals */}
              <div className="mt-1  border-gold/20 flex flex-col gap-1.5">
               
               <section className=' border-b space-y-1 py-1'>             
                <div className="flex justify-between text-[17px] text-green-700 font-[600]">
                  <span>Subtotal</span><span  className='text-green-700 text-lg '>₹{fmt(item.amount)}</span>
                </div>               
               
                </section>
            
             <section>      
                <div className="flex justify-between text-sm text-slate-600 ">
                    <span>Discount</span><span>− ₹{fmt(discount)}</span>
                  </div>
                   <div className="flex justify-between items-center ">
                    <span className=" text-sm text-slate-600">Gst</span>
                  <span className="text-sm text-slate-600 ">₹{fmt(gst)}</span>
                </div>
            </section>

                <div className="flex justify-between items-center border-t pt-2 ">
                  <span className="text-[20px]  font-semibold text-foreground">Total</span>
                  <span className="text-xl font-bold text-red-600 ">₹{fmt(finalAmount)}</span>
                </div>
              </div>             
        
            </div>

        

          </div>
        </div>
      </div>

      {/* ── HISTORY DRAWER ── */}
      {showHistory && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40 backdrop-enter" onClick={() => setShowHistory(false)} />
          <div className="fixed right-0 top-0 h-full w-72 bg-white border-l border-gold/30 z-50 flex flex-col shadow-xl drawer-enter">
            <div className="px-4 py-3 border-b border-gold/20 bg-gold/5 flex items-center justify-between flex-shrink-0">
              <span className="text-sm font-semibold text-foreground">Recent Estimates</span> 
              <span className="text-sm font-semibold text-foreground">Today-7</span> 
              <button onClick={() => setShowHistory(false)} className="text-muted-foreground hover:text-foreground text-xl leading-none">×</button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {history.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">No history yet</div>
              ) : history.map((entry) => (
                <button key={entry.id}
                  onClick={() => { setItem(entry.item); setDiscount(entry.discount); setShowHistory(false); setPrintError(''); }}
                  className="w-full text-left px-4 py-3 border-b border-gold/10 hover:bg-gold/5 transition-colors">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-foreground">{entry.item.item_name || 'Unnamed'}</span>
                    <span className="text-sm font-semibold text-gold">₹{fmt(entry.total)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {entry.item.weight}g · {entry.item.metal === 'GOLD' ? entry.item.purity : 'Silver'} · {entry.date}
                  </div>
                </button>
              ))}
            </div>
            <div className="px-4 py-2.5 border-t border-gold/20 text-center flex-shrink-0">
              <p className="text-xs text-muted-foreground">Click any entry to load it</p>
            </div>
          </div>
        </>
      )}

      {/* ── PRINT BILL ── */}
      <div id='print-bill' style={{ fontSize: 12, width: '58mm' ,backgroundColor:'#E5EEE4',padding:'14px 18px' }}>
          <p style={{ textAlign: 'center', fontWeight: 'bold' ,paddingBottom:"5px"}}>
            Estimate bill
          </p>
          <hr />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>

              <tr>
                <td>Item</td>
                <td style={{ textAlign: 'center' }}>:</td>
                <td style={{ textAlign: 'right' }}>{item.item_name}</td>
              </tr>

              <tr>
                <td>Wt</td>
                <td style={{ textAlign: 'center' }}>:</td>
                <td style={{ textAlign: 'right' }}>{item.weight} g</td>
              </tr>

              <tr>
                <td>Vt</td>
                <td style={{ textAlign: 'center' }}>:</td>
                <td style={{ textAlign: 'right' }}>{item.wastage_weight} g</td>
              </tr>

              <tr>
                <td>Rate</td>
                <td style={{ textAlign: 'center' }}>:</td>
                <td style={{ textAlign: 'right' }}>₹{fmt(item.rate)}</td>
              </tr>

              <tr>
                <td>MC</td>
                <td style={{ textAlign: 'center' }}>:</td>
                <td style={{ textAlign: 'right' }}>₹{fmt(item.making_charge)}</td>
              </tr>

              <tr><td colSpan={3}><hr /></td></tr>

              <tr>
                <td>Subtotal</td>
                <td style={{ textAlign: 'center' }}>:</td>
                <td style={{ textAlign: 'right' }}>₹{fmt(item.amount)}</td>
              </tr>

              <tr>
                <td>Discount</td>
                <td style={{ textAlign: 'center' }}>:</td>
                <td style={{ textAlign: 'right' }}>₹{fmt(discount)}</td>
              </tr>

              <tr>
                <td>GST</td>
                <td style={{ textAlign: 'center' }}>:</td>
                <td style={{ textAlign: 'right' }}>₹{fmt(gst)}</td>
              </tr>

              <tr><td colSpan={2}><hr /></td></tr>

              <tr style={{paddingTop:"15px",fontSize:"14px"}}>
                <td style={{ fontWeight: 'bold' }}>Total</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  ₹{fmt(finalAmount)}
                </td>
              </tr>

            </tbody>
          </table>
      </div>

      

    
    </>
  );
}
