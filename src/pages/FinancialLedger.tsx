
/**
 * FinancialLedger.tsx  — Supabase-connected version
 *
 * Changes:
 *  1. Spray operations: each chemical can have a product image (camera/upload).
 *  2. Labour Registry: phone number is the unique identity.
 *     - If same phone exists → new entry adds days to existing total.
 *     - All totals auto-recalculate.
 *     - Individual work entries are editable inline.
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Plus, Droplets, ChevronDown, ChevronUp, Trash2, Users,
  TrendingUp, TrendingDown, DollarSign, Leaf, Wrench,
  ShoppingBag, BarChart2, CheckCircle2, Scissors, Shovel,
  Sprout, Package, Truck, Settings, X, ArrowRight, Activity,
  FlaskConical, Calendar, Hash, Loader2, AlertTriangle,
  Camera, Image, Pencil, Save, XCircle,
} from 'lucide-react';
import { useFinancialLedger } from '../hooks/useFinancialLedger';
import { useAuth } from '../contexts/AuthContext';
import type { ActivityExpense, LabourWorker, IncomeEntry, Spray } from '../hooks/useFinancialLedger';

/* ================= MASTER DATA (unchanged) ================= */

const SPRAY_STAGES = [
  'Dormant','Green Tip','Pink Bud','Petal Fall',
  'Fruit Set','Cover Spray 1','Cover Spray 2','Cover Spray 3',
];

const CHEMICAL_LIBRARY = [
  { name: 'Mancozeb',     brand: 'Dithane M-45', unit: 'kg', recommended: '2–2.5 g/L',  pricePerUnit: 450 },
  { name: 'Imidacloprid', brand: 'Confidor',      unit: 'ml', recommended: '0.3 ml/L',  pricePerUnit: 1.2 },
  { name: 'HM Oil',       brand: 'Orchex 796',   unit: 'l',  recommended: '1.5–2%',     pricePerUnit: 280 },
  { name: 'Carbendazim',  brand: 'Bavistin',      unit: 'kg', recommended: '1 g/L',     pricePerUnit: 520 },
  { name: 'Chlorpyrifos', brand: 'Durmet',        unit: 'ml', recommended: '2 ml/L',    pricePerUnit: 0.8 },
  { name: 'Captan',       brand: 'Captaf',        unit: 'kg', recommended: '2.5 g/L',   pricePerUnit: 380 },
  { name: 'Thiamethoxam', brand: 'Actara',        unit: 'g',  recommended: '0.25 g/L',  pricePerUnit: 2.5 },
  { name: 'Hexaconazole', brand: 'Contaf Plus',   unit: 'ml', recommended: '1 ml/L',    pricePerUnit: 1.8 },
  { name: 'Abamectin',    brand: 'Vertimec',      unit: 'ml', recommended: '0.5 ml/L',  pricePerUnit: 3.2 },
  { name: 'Sulphur 80%WP',brand: 'Sulfex',        unit: 'kg', recommended: '3 g/L',     pricePerUnit: 120 },
];

const PREVIOUS_SEASON_WATER: Record<string, number> = {
  Dormant: 800, 'Pink Bud': 1000, 'Petal Fall': 1200,
};

const ACTIVITY_CATEGORIES = [
  { key: 'PRUNING',    label: 'Pruning',              icon: '✂️' },
  { key: 'DIGGING',    label: 'Digging / Basin Prep', icon: '⛏️' },
  { key: 'IRRIGATION', label: 'Irrigation',            icon: '💧' },
  { key: 'GENERAL',   label: 'General Labor',         icon: '👷' },
  { key: 'PICKING',   label: 'Picking / Harvesting',  icon: '🍎' },
  { key: 'GRADING',   label: 'Grading',               icon: '📦' },
  { key: 'PACKAGING', label: 'Packaging',              icon: '🗃️' },
  { key: 'FORWARDING',label: 'Forwarding / Transport', icon: '🚚' },
  { key: 'SERVICES',  label: 'Services & Misc',       icon: '🔧' },
  { key: 'FERTILIZER',label: 'Fertilizer Application',icon: '🌱' },
  { key: 'OTHER',     label: 'Other',                 icon: '📝' },
] as const;

type ActivityCategory = typeof ACTIVITY_CATEGORIES[number]['key'];

const APPLE_VARIETIES = [
  'Royal Delicious','Red Delicious','Golden Delicious','Gala',
  'Fuji','Granny Smith','Ambri','Other',
];

/* ================= EXPENSE CATEGORY CONFIG (unchanged) ================= */

type ExpenseCategoryKey = 'spray'|'pruning'|'digging'|'irrigation'|'labour'|'grading'|'services';

interface ExpenseCategoryConfig {
  key: ExpenseCategoryKey;
  label: string; sublabel: string; Icon: any;
  gradient: string; glow: string; border: string; iconBg: string;
  activityCodes: string[]; dataSource: 'spray' | 'activity';
}

const EXPENSE_CATEGORY_CONFIG: ExpenseCategoryConfig[] = [
  { key:'spray',     label:'Spray',     sublabel:'Operations',       Icon:FlaskConical, gradient:'linear-gradient(135deg,#0ea5e9 0%,#0369a1 100%)',  glow:'0 8px 32px rgba(14,165,233,0.45)',  border:'#38bdf8', iconBg:'rgba(255,255,255,0.2)', activityCodes:[], dataSource:'spray'    },
  { key:'pruning',   label:'Pruning',   sublabel:'Tree Care',        Icon:Scissors,     gradient:'linear-gradient(135deg,#8b5cf6 0%,#6d28d9 100%)',  glow:'0 8px 32px rgba(139,92,246,0.45)', border:'#a78bfa', iconBg:'rgba(255,255,255,0.2)', activityCodes:['PRUNING'],    dataSource:'activity' },
  { key:'digging',   label:'Digging',   sublabel:'Basin Prep',       Icon:Shovel,       gradient:'linear-gradient(135deg,#f59e0b 0%,#b45309 100%)',  glow:'0 8px 32px rgba(245,158,11,0.45)', border:'#fbbf24', iconBg:'rgba(255,255,255,0.2)', activityCodes:['DIGGING'],    dataSource:'activity' },
  { key:'irrigation',label:'Irrigation',sublabel:'Water Mgmt',       Icon:Droplets,     gradient:'linear-gradient(135deg,#06b6d4 0%,#0e7490 100%)',  glow:'0 8px 32px rgba(6,182,212,0.45)',  border:'#22d3ee', iconBg:'rgba(255,255,255,0.2)', activityCodes:['IRRIGATION'], dataSource:'activity' },
  { key:'labour',    label:'Labour',    sublabel:'General & Harvest', Icon:Users,        gradient:'linear-gradient(135deg,#ef4444 0%,#b91c1c 100%)',  glow:'0 8px 32px rgba(239,68,68,0.45)',  border:'#f87171', iconBg:'rgba(255,255,255,0.2)', activityCodes:['GENERAL','PICKING','FORWARDING','FERTILIZER'], dataSource:'activity' },
  { key:'grading',   label:'Grading',   sublabel:'Packaging',        Icon:Package,      gradient:'linear-gradient(135deg,#10b981 0%,#047857 100%)',  glow:'0 8px 32px rgba(16,185,129,0.45)', border:'#34d399', iconBg:'rgba(255,255,255,0.2)', activityCodes:['GRADING','PACKAGING'], dataSource:'activity' },
  { key:'services',  label:'Services',  sublabel:'Misc & Other',     Icon:Settings,     gradient:'linear-gradient(135deg,#64748b 0%,#334155 100%)',  glow:'0 8px 32px rgba(100,116,139,0.45)',border:'#94a3b8', iconBg:'rgba(255,255,255,0.2)', activityCodes:['SERVICES','OTHER'],   dataSource:'activity' },
];

/* ================= TYPES ================= */

type Chemical = {
  name: string; brand: string; qty: number; unit: string; rate: number;
  recommended: string;
  imageUrl?: string;   // NEW: product image (base64 data URL or object URL)
};

/* Worker entry with phone as unique identity */
interface WorkerEntry {
  id: string;
  name: string;
  phone: string;          // unique identity
  activity: string;
  startDate: string;
  endDate: string;
  days: number;
  ratePerDay: number;
  advance: number;
  paid: boolean;
  entries: WorkEntry[];   // individual work entries
}

interface WorkEntry {
  id: string;
  activity: string;
  startDate: string;
  endDate: string;
  days: number;
  ratePerDay: number;
  advance: number;
}

/* ================= HELPERS ================= */

const daysBetween = (start: string, end: string) => {
  if (!start) return 1;
  const s = new Date(start), e = new Date(end || start);
  return Math.max(1, Math.ceil((+e - +s) / 86400000) + 1);
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n);

/* ================= SUB-COMPONENTS ================= */

function SummaryCard({ label, value, color, icon: Icon, sub }: { label:string; value:number; color:string; icon:any; sub?:string }) {
  return (
    <div className={`rounded-2xl p-5 shadow-lg text-white bg-gradient-to-br ${color}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold opacity-80">{label}</span>
        <Icon className="w-5 h-5 opacity-70" />
      </div>
      <p className="text-3xl font-extrabold tracking-tight">₹{fmt(value)}</p>
      {sub && <p className="text-xs opacity-70 mt-1">{sub}</p>}
    </div>
  );
}

function SectionHeader({ title, icon: Icon, color }: { title:string; icon:any; color:string }) {
  return (
    <div className={`flex items-center gap-3 pb-3 border-b-2 ${color}`}>
      <div className={`p-2 rounded-lg bg-opacity-10 ${color.replace('border-','bg-')}`}>
        <Icon className="w-5 h-5" />
      </div>
      <h2 className="text-lg font-bold text-gray-800">{title}</h2>
    </div>
  );
}

function ExpenseCategoryCard({ config, totalCost, count, isSelected, onClick }: { config:ExpenseCategoryConfig; totalCost:number; count:number; isSelected:boolean; onClick:()=>void }) {
  const { Icon } = config;
  return (
    <button onClick={onClick}
      style={{ background:config.gradient, boxShadow:isSelected ? `${config.glow}, 0 0 0 3px white, 0 0 0 5px ${config.border}` : config.glow, transform:isSelected ? 'translateY(-6px) scale(1.04)' : 'translateY(0) scale(1)', transition:'all 0.28s cubic-bezier(0.34,1.56,0.64,1)', outline:'none' }}
      className="relative flex flex-col items-start text-left rounded-2xl p-4 w-full overflow-hidden"
    >
      <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full" style={{ background:'rgba(255,255,255,0.12)' }} />
      <div className="absolute top-2 right-2 w-8 h-8 rounded-full" style={{ background:'rgba(255,255,255,0.12)' }} />
      <div className="mb-3 p-2.5 rounded-xl" style={{ background:config.iconBg }}><Icon className="w-5 h-5 text-white" /></div>
      <p className="text-white text-xs font-semibold opacity-80 leading-tight">{config.sublabel}</p>
      <p className="text-white text-sm font-extrabold leading-tight">{config.label}</p>
      <p className="text-white text-lg font-extrabold mt-2 leading-tight tracking-tight">₹{fmt(totalCost)}</p>
      <div className="mt-1.5 flex items-center gap-1">
        <span className="text-white text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background:'rgba(255,255,255,0.22)' }}>
          {count} {count === 1 ? 'record' : 'records'}
        </span>
      </div>
      {isSelected && <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl" style={{ background:'rgba(255,255,255,0.7)' }} />}
    </button>
  );
}

/* ── Chemical Image Picker ── */
function ChemicalImagePicker({
  imageUrl, onChange, onViewFull,
}: {
  imageUrl?: string;
  onChange: (url: string) => void;
  onViewFull?: (src: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      if (ev.target?.result) onChange(ev.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex items-center gap-2">
      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
      {imageUrl ? (
        <div className="relative group">
          <button
            type="button"
            onClick={() => onViewFull?.(imageUrl)}
            title="Click to view full image"
            className="block focus:outline-none"
          >
            <img
              src={imageUrl}
              alt="Product"
              className="w-10 h-10 rounded-lg object-cover border border-gray-200 shadow-sm group-hover:scale-110 transition-transform duration-200 cursor-zoom-in"
            />
          </button>
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute -top-1.5 -right-1.5 hidden group-hover:flex w-4 h-4 bg-red-500 rounded-full text-white items-center justify-center z-10"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          title="Add product photo"
          className="w-10 h-10 rounded-lg border-2 border-dashed border-sky-300 flex items-center justify-center text-sky-400 hover:border-sky-500 hover:text-sky-600 hover:bg-sky-50 transition"
        >
          <Camera className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

/* ── Full-screen Image Modal ── */
function ImageModal({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div className="relative max-w-full max-h-full" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg text-gray-700 hover:text-red-600 transition"
        >
          <X className="w-4 h-4" />
        </button>
        <img
          src={src}
          alt={alt}
          className="fld-modal-img max-w-[90vw] max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-white/20"
        />
        <p className="text-white/70 text-xs text-center mt-2">{alt}</p>
      </div>
    </div>
  );
}

function SprayDetailPanel({ sprays, openSprayId, setOpenSprayId, onDelete, sprayCost, chemicalCost, totalSprayCost, mutating }: any) {
  const [modalImage, setModalImage] = useState<{ src: string; alt: string } | null>(null);
  return (
    <>
    {modalImage && (
      <ImageModal src={modalImage.src} alt={modalImage.alt} onClose={() => setModalImage(null)} />
    )}
    <div className="space-y-3">
      {sprays.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <FlaskConical className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No spray operations recorded yet</p>
        </div>
      ) : sprays.map((s: Spray) => (
        <div key={s.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-3 sm:px-4 py-3 cursor-pointer hover:bg-sky-50 transition"
               onClick={() => setOpenSprayId(openSprayId === s.id ? null : s.id)}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-sky-100 flex items-center justify-center">
                <span className="text-sky-700 font-bold text-sm">#{s.sprayNo}</span>
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm">{s.stage}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />{s.date}
                  <span className="mx-1">·</span>
                  <Hash className="w-3 h-3" />{s.chemicals.length} chemicals
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-extrabold text-sky-700">₹{fmt(sprayCost(s))}</span>
              <button onClick={e => { e.stopPropagation(); onDelete(s.id); }} disabled={mutating}
                className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-40">
                <Trash2 className="w-4 h-4" />
              </button>
              {openSprayId === s.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </div>
          </div>
          {openSprayId === s.id && (
            <div className="px-3 sm:px-4 pb-4 pt-3 bg-gray-50 border-t space-y-2">
              {/* Desktop header */}
              <div className="hidden sm:grid sm:grid-cols-6 text-xs font-bold text-gray-400 uppercase mb-2 tracking-wide">
                <span className="col-span-1">Photo</span>
                <span className="col-span-2">Chemical</span>
                <span>Qty</span><span>Rate</span><span className="text-right col-span-1">Cost</span>
              </div>
              {s.chemicals.map((c: Chemical, i: number) => (
                <div key={i} className="py-2 border-b border-gray-200">
                  {/* Desktop row */}
                  <div className="hidden sm:grid sm:grid-cols-6 text-sm items-center gap-2">
                    <div className="col-span-1 flex items-center">
                      {c.imageUrl ? (
                        <button type="button" onClick={() => setModalImage({ src: c.imageUrl!, alt: c.brand || c.name })} className="focus:outline-none group" title="Click to view full image">
                          <img src={c.imageUrl} alt={c.brand} className="w-10 h-10 rounded-lg object-cover border border-gray-200 shadow-sm group-hover:scale-110 group-hover:shadow-md transition-transform duration-200 cursor-zoom-in" />
                        </button>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Image className="w-4 h-4 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="col-span-2">
                      <p className="font-semibold text-gray-800 text-xs">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.brand}</p>
                    </div>
                    <span className="text-gray-700">{c.qty} {c.unit}</span>
                    <span className="text-gray-700">₹{c.rate}/{c.unit}</span>
                    <span className="text-right font-bold text-sky-700">₹{fmt(chemicalCost(c))}</span>
                  </div>
                  {/* Mobile row */}
                  <div className="flex sm:hidden items-center gap-3">
                    <div className="flex-shrink-0">
                      {c.imageUrl ? (
                        <button type="button" onClick={() => setModalImage({ src: c.imageUrl!, alt: c.brand || c.name })} className="focus:outline-none" title="Click to view full image">
                          <img src={c.imageUrl} alt={c.brand} className="w-12 h-12 rounded-lg object-cover border border-gray-200 shadow-sm cursor-zoom-in" />
                        </button>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Image className="w-5 h-5 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">{c.name} <span className="text-gray-400 font-normal text-xs">({c.brand})</span></p>
                      <p className="text-xs text-gray-500">{c.qty} {c.unit} × ₹{c.rate}/{c.unit}</p>
                    </div>
                    <span className="font-bold text-sky-700 text-sm flex-shrink-0">₹{fmt(chemicalCost(c))}</span>
                  </div>
                </div>
              ))}
              <div className="flex justify-between text-sm pt-1">
                <span className="text-gray-500">Labour ({s.labourCount} × ₹{s.labourRate})</span>
                <span className="font-semibold">₹{fmt(s.labourCount * s.labourRate)}</span>
              </div>
              {s.water > 0 && <p className="text-xs text-gray-400">Water used: {s.water} L</p>}
              <div className="flex justify-between font-extrabold text-base pt-2 border-t border-gray-200">
                <span>Spray Total</span>
                <span className="text-sky-700">₹{fmt(sprayCost(s))}</span>
              </div>
            </div>
          )}
        </div>
      ))}
      {sprays.length > 0 && (
        <div className="flex justify-between items-center bg-sky-50 rounded-xl px-4 py-3 border border-sky-200">
          <span className="font-bold text-sky-800">Total Spray Cost</span>
          <span className="font-extrabold text-sky-700 text-lg">₹{fmt(totalSprayCost)}</span>
        </div>
      )}
    </div>
    </>
  );
}

function ActivityDetailPanel({ config, activities, onDelete, mutating }: { config:ExpenseCategoryConfig; activities:ActivityExpense[]; onDelete:(id:string)=>void; mutating:boolean }) {
  const filtered = activities.filter(a => config.activityCodes.includes(a.category));
  const total    = filtered.reduce((s, a) => s + a.amount, 0);
  const getLabel = (cat: string) => ACTIVITY_CATEGORIES.find(c => c.key === cat)?.label || cat;
  const getIcon  = (cat: string) => ACTIVITY_CATEGORIES.find(c => c.key === cat)?.icon || '📝';
  return (
    <div className="space-y-3">
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <config.Icon className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No {config.label.toLowerCase()} expenses recorded yet</p>
        </div>
      ) : filtered.map(a => (
        <div key={a.id} className="flex items-start justify-between border border-gray-200 rounded-xl px-4 py-3 hover:bg-gray-50 transition shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">{getIcon(a.category)}</div>
            <div>
              <p className="font-bold text-gray-800 text-sm">{a.description || getLabel(a.category)}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                <span className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> {a.date}</span>
                <span className="text-xs text-gray-500">{a.days} day{a.days > 1 ? 's' : ''}</span>
                <span className="text-xs text-gray-500">{a.labourCount} labour{a.labourCount > 1 ? 's' : ''} @ ₹{a.ratePerDay}/day</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="font-extrabold text-gray-800">₹{fmt(a.amount)}</span>
            <button onClick={() => onDelete(a.id)} disabled={mutating}
              className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-40">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
      {filtered.length > 0 && (
        <div className="flex justify-between items-center rounded-xl px-4 py-3 border bg-gray-50">
          <span className="font-bold text-gray-700">Total {config.label} Cost</span>
          <span className="font-extrabold text-gray-800 text-lg">₹{fmt(total)}</span>
        </div>
      )}
    </div>
  );
}

/* ================= SKUAST-STYLE ANIMATION STYLES ================= */

const FL_STYLES = `
@keyframes fldFadeUp   { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
@keyframes fldFadeDown { from{opacity:0;transform:translateY(-18px)} to{opacity:1;transform:translateY(0)} }
@keyframes fldScaleIn  { from{opacity:0;transform:scale(0.90)} to{opacity:1;transform:scale(1)} }
@keyframes fldSlideR   { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }
@keyframes fldGradientShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
@keyframes fldLeafSway { 0%,100%{transform:rotate(-4deg)} 50%{transform:rotate(4deg)} }
@keyframes fldPulseRing{ 0%{transform:scale(1);opacity:.8} 100%{transform:scale(1.6);opacity:0} }
@keyframes fldGlow     { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.25)} 50%{box-shadow:0 0 0 10px rgba(34,197,94,0)} }
@keyframes fldShimmer  { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
@keyframes slideDown   { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }

.fld-fade-up  { animation:fldFadeUp   0.6s cubic-bezier(.22,1,.36,1) both; }
.fld-fade-dn  { animation:fldFadeDown 0.55s cubic-bezier(.22,1,.36,1) both; }
.fld-scale-in { animation:fldScaleIn  0.5s cubic-bezier(.22,1,.36,1) both; }
.fld-slide-r  { animation:fldSlideR   0.5s cubic-bezier(.22,1,.36,1) both; }

.fld-d0{animation-delay:0s} .fld-d1{animation-delay:.08s} .fld-d2{animation-delay:.16s}
.fld-d3{animation-delay:.24s} .fld-d4{animation-delay:.32s}

/* Animated gradient banner */
.fld-hero-banner {
  background: linear-gradient(135deg, #064e3b, #065f46, #047857, #059669, #10b981, #34d399, #10b981, #047857);
  background-size: 300% 300%;
  animation: fldGradientShift 8s ease infinite;
}

/* Leaf sway */
.fld-leaf { display:inline-block; animation:fldLeafSway 3s ease-in-out infinite; transform-origin:bottom center; }

/* Pulse indicator */
.fld-pulse::before { content:''; position:absolute; inset:0; border-radius:50%; background:rgba(167,243,208,0.5); animation:fldPulseRing 1.6s cubic-bezier(.215,.61,.355,1) infinite; }

/* Shimmer bar */
.fld-shimmer { background:linear-gradient(90deg,rgba(167,243,208,0.2) 25%,rgba(167,243,208,0.55) 50%,rgba(167,243,208,0.2) 75%); background-size:400px 100%; animation:fldShimmer 2s ease-in-out infinite; }

/* Summary card hover */
.fld-summary-card { transition:transform .2s ease, box-shadow .2s ease; }
.fld-summary-card:hover { transform:translateY(-4px); box-shadow:0 16px 40px rgba(0,0,0,0.18); }

/* Tab button transition */
.fld-tab { transition:all .2s cubic-bezier(.22,1,.36,1); }

/* Responsive helpers */
@media (max-width:640px) {
  .fld-hero-actions { flex-direction:column; align-items:flex-start; }
}

/* Image modal entrance animation */
@keyframes fldModalIn { from{opacity:0;transform:scale(0.88)} to{opacity:1;transform:scale(1)} }
.fld-modal-img { animation: fldModalIn 0.22s cubic-bezier(0.34,1.56,0.64,1) both; }

/* Cursor zoom */
.cursor-zoom-in { cursor: zoom-in; }
`;

/* ================= LOCAL WORKER STATE MANAGEMENT ================= */

/**
 * Manages worker entries locally with phone as unique identity.
 * When the same phone is submitted again, days are added to existing total.
 * All totals auto-recalculate.
 */
function useLocalWorkers(dbWorkers: LabourWorker[], dbAddWorker: any, dbRemoveWorker: any, dbMarkPaid: any) {
  // Local state for worker entries (keyed by phone)
  const [localEntries, setLocalEntries] = useState<WorkEntry[]>([]);
  // editingEntry: { workerId, entryId } — which entry is being edited inline
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<WorkEntry>>({});

  /**
   * Group db workers by phone. For each phone, aggregate total days,
   * keep all individual entries accessible.
   */
  const workersByPhone = useMemo(() => {
    const map = new Map<string, {
      phone: string; name: string; paid: boolean; id: string;
      entries: (LabourWorker & { entryId: string })[];
    }>();
    dbWorkers.forEach(w => {
      const key = w.phone || w.id; // phone as unique key, fallback to id if no phone
      if (!map.has(key)) {
        map.set(key, { phone: w.phone || '', name: w.name, paid: w.paid, id: w.id, entries: [] });
      }
      map.get(key)!.entries.push({ ...w, entryId: w.id });
      // If any entry is not paid, mark the worker as not fully paid
      if (!w.paid) map.get(key)!.paid = false;
    });
    return Array.from(map.values());
  }, [dbWorkers]);

  const startEdit = (entryId: string, entry: LabourWorker) => {
    setEditingEntryId(entryId);
    setEditDraft({
      id: entry.id,
      activity: entry.activity,
      startDate: entry.startDate,
      endDate: entry.endDate,
      days: entry.days,
      ratePerDay: entry.ratePerDay,
      advance: entry.advance,
    });
  };

  const cancelEdit = () => {
    setEditingEntryId(null);
    setEditDraft({});
  };

  const saveEdit = async (originalWorker: LabourWorker) => {
    if (!editingEntryId) return;
    const newDays = editDraft.startDate && editDraft.endDate
      ? daysBetween(editDraft.startDate, editDraft.endDate)
      : (editDraft.days ?? originalWorker.days);
    // Remove old and re-add with updated data
    await dbRemoveWorker(originalWorker.id);
    await dbAddWorker({
      name: originalWorker.name,
      phone: originalWorker.phone,
      activity: (editDraft.activity || originalWorker.activity) as any,
      startDate: editDraft.startDate || originalWorker.startDate,
      endDate: editDraft.endDate || originalWorker.endDate,
      days: newDays,
      ratePerDay: editDraft.ratePerDay ?? originalWorker.ratePerDay,
      advance: editDraft.advance ?? originalWorker.advance,
      paid: originalWorker.paid,
    });
    setEditingEntryId(null);
    setEditDraft({});
  };

  return { workersByPhone, editingEntryId, editDraft, setEditDraft, startEdit, cancelEdit, saveEdit };
}

/* ================= MAIN COMPONENT ================= */

export default function FinancialLedger() {
  // Get user_id from AuthContext
  const { user } = useAuth();
  const userId = user?.id;
  if (!userId) {
    return <div className="p-8 text-center text-red-600">User not authenticated or user ID missing.</div>;
  }
  const db = useFinancialLedger(userId as string);

  /* ---- Active Tab ---- */
  const [tab, setTab] = useState<'expenses'|'income'|'labour'|'summary'>('expenses');
  const [selectedExpenseCategory, setSelectedExpenseCategory] = useState<ExpenseCategoryKey | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  /* ---- Spray form state ---- */
  const [stage, setStage]               = useState('');
  const [sprayDate, setSprayDate]       = useState('');
  const [water, setWater]               = useState('');
  const [chemicals, setChemicals]       = useState<Chemical[]>([]);
  const [sprayLabours, setSprayLabours] = useState('');
  const [sprayLabourRate, setSprayLabourRate] = useState('');
  const [openSprayId, setOpenSprayId]   = useState<string | null>(null);

  /* ---- Activity form state ---- */
  const [actCat, setActCat]           = useState<ActivityCategory>('PRUNING');
  const [actDesc, setActDesc]         = useState('');
  const [actStartDate, setActStartDate] = useState('');
  const [actEndDate, setActEndDate]   = useState('');
  const [actLabours, setActLabours]   = useState('');
  const [actRate, setActRate]         = useState('');

  /* ---- Worker form state ---- */
  const [wName, setWName]       = useState('');
  const [wPhone, setWPhone]     = useState('');
  const [wActivity, setWActivity] = useState<ActivityCategory | 'SPRAY'>('GENERAL');
  const [wStart, setWStart]     = useState('');
  const [wEnd, setWEnd]         = useState('');
  const [wRate, setWRate]       = useState('');
  const [wAdvance, setWAdvance] = useState('');
  const [workerMsg, setWorkerMsg] = useState<{ type: 'info' | 'success'; text: string } | null>(null);

  /* ---- Expanded worker rows ---- */
  const [expandedWorkerPhone, setExpandedWorkerPhone] = useState<string | null>(null);

  /* ---- Image modal (for spray form thumbnails) ---- */
  const [formModalImage, setFormModalImage] = useState<{ src: string; alt: string } | null>(null);

  /* ---- Income form state ---- */
  const [incVariety, setIncVariety]     = useState('');
  const [incCrates, setIncCrates]       = useState('');
  const [incKgPerCrate, setIncKgPerCrate] = useState('');
  const [incPrice, setIncPrice]         = useState('');
  const [incDate, setIncDate]           = useState('');
  const [incBuyer, setIncBuyer]         = useState('');

  /* ---- Worker local management ---- */
  const { workersByPhone, editingEntryId, editDraft, setEditDraft, startEdit, cancelEdit, saveEdit }
    = useLocalWorkers(db.workers, db.addWorker, db.removeWorker, db.markPaid);

  /* ================= PURE CALCULATIONS ================= */

  const chemicalCost = (c: Chemical) => c.qty * c.rate;
  const sprayCost    = (s: Spray) =>
    s.chemicals.reduce((sum, c) => sum + chemicalCost(c), 0) + s.labourCount * s.labourRate;

  const roi        = db.totalExpenses > 0 ? (db.netProfit / db.totalExpenses) * 100 : 0;
  const totalYieldKg = useMemo(() => db.income.reduce((sum, i) => sum + i.crates * i.kgPerCrate, 0), [db.income]);
  const costPerKg    = totalYieldKg > 0 ? db.totalExpenses / totalYieldKg : 0;
  const totalLabourDue = db.totalLabourCost - db.totalAdvancePaid;

  const categorySummaries = useMemo(() => EXPENSE_CATEGORY_CONFIG.map(cfg => {
    if (cfg.dataSource === 'spray') return { key: cfg.key, total: db.totalSprayCost, count: db.sprays.length };
    const filtered = db.activities.filter(a => cfg.activityCodes.includes(a.category));
    return { key: cfg.key, total: filtered.reduce((s, a) => s + a.amount, 0), count: filtered.length };
  }), [db.sprays, db.activities, db.totalSprayCost]);

  /* ================= SPRAY ACTIONS ================= */

  const addChemical    = () => setChemicals([...chemicals, { name:'', brand:'', qty:0, unit:'kg', rate:0, recommended:'', imageUrl:'' }]);
  const removeChemical = (i: number) => setChemicals(chemicals.filter((_, idx) => idx !== i));
  const updateChemical = (i: number, key: keyof Chemical, value: any) => {
    const copy = [...chemicals]; (copy[i] as any)[key] = value; setChemicals(copy);
  };
  const selectChemical = (i: number, name: string) => {
    const chem = CHEMICAL_LIBRARY.find(c => c.name === name); if (!chem) return;
    updateChemical(i, 'name', chem.name); updateChemical(i, 'brand', chem.brand);
    updateChemical(i, 'unit', chem.unit); updateChemical(i, 'recommended', chem.recommended);
    updateChemical(i, 'rate', chem.pricePerUnit);
  };

  const saveSpray = async () => {
    if (!stage || !sprayDate || chemicals.length === 0) return;
    await db.addSpray({
      sprayNo: db.sprays.length + 1, stage, date: sprayDate,
      water: Number(water), chemicals,
      labourCount: Number(sprayLabours || 0), labourRate: Number(sprayLabourRate || 0),
    });
    setStage(''); setSprayDate(''); setWater(''); setChemicals([]);
    setSprayLabours(''); setSprayLabourRate(''); setShowAddForm(false);
  };

  /* ================= ACTIVITY ACTIONS ================= */

  const saveActivity = async () => {
    if (!actCat || !actStartDate || !actLabours || !actRate) return;
    const days   = daysBetween(actStartDate, actEndDate);
    const amount = days * Number(actLabours) * Number(actRate);
    await db.addActivity({
      category: actCat, date: actStartDate, description: actDesc,
      amount, days, labourCount: Number(actLabours), ratePerDay: Number(actRate),
    });
    setActCat('PRUNING'); setActDesc(''); setActStartDate(''); setActEndDate('');
    setActLabours(''); setActRate(''); setShowAddForm(false);
  };

  /* ================= WORKER ACTIONS ================= */

  const saveWorker = async () => {
    if (!wName || !wStart || !wRate) return;

    const phone = wPhone.trim();
    const days  = daysBetween(wStart, wEnd);

    // Check if worker with same phone already exists
    const existing = phone ? db.workers.find(w => w.phone === phone) : null;

    if (existing) {
      // Same worker → add new work entry (days accumulate)
      setWorkerMsg({ type: 'info', text: `Adding new work entry for ${existing.name}. Days will be added to existing total.` });
    } else {
      setWorkerMsg({ type: 'success', text: `New worker "${wName}" registered.` });
    }

    await db.addWorker({
      name: existing?.name || wName,   // keep original name if existing
      phone,
      activity: wActivity,
      startDate: wStart,
      endDate: wEnd || wStart,
      days,
      ratePerDay: Number(wRate),
      advance: Number(wAdvance || 0),
      paid: false,
    });

    setWName(''); setWPhone(''); setWActivity('GENERAL');
    setWStart(''); setWEnd(''); setWRate(''); setWAdvance('');
    setTimeout(() => setWorkerMsg(null), 3500);
  };

  /* ================= INCOME ACTIONS ================= */

  const saveIncome = async () => {
    if (!incVariety || !incCrates || !incPrice || !incDate) return;
    await db.addIncome({
      variety: incVariety, crates: Number(incCrates),
      kgPerCrate: Number(incKgPerCrate || 20), pricePerCrate: Number(incPrice),
      date: incDate, buyer: incBuyer,
    });
    setIncVariety(''); setIncCrates(''); setIncKgPerCrate('');
    setIncPrice(''); setIncDate(''); setIncBuyer('');
  };

  /* ================= RENDER ================= */

  const TABS = [
    { key: 'expenses', label: 'Expenses',         icon: TrendingDown },
    { key: 'income',   label: 'Income',            icon: TrendingUp   },
    { key: 'labour',   label: 'Labour Registry',   icon: Users        },
    { key: 'summary',  label: 'Summary',           icon: BarChart2    },
  ] as const;

  const selectedCategoryConfig = EXPENSE_CATEGORY_CONFIG.find(c => c.key === selectedExpenseCategory);

  const handleCategoryCardClick = (key: ExpenseCategoryKey) => {
    if (selectedExpenseCategory === key) {
      setSelectedExpenseCategory(null); setShowAddForm(false);
    } else {
      setSelectedExpenseCategory(key); setShowAddForm(false);
      const cfg = EXPENSE_CATEGORY_CONFIG.find(c => c.key === key);
      if (cfg?.dataSource === 'activity' && cfg.activityCodes.length > 0)
        setActCat(cfg.activityCodes[0] as ActivityCategory);
    }
  };

  return (
    <>
    <style>{FL_STYLES}</style>
    {formModalImage && (
      <ImageModal src={formModalImage.src} alt={formModalImage.alt} onClose={() => setFormModalImage(null)} />
    )}
    <div className="min-h-screen bg-gray-50">

      {/* ── SKUAST-STYLE HERO HEADER ── */}
      <div className="fld-fade-dn fld-d0 relative overflow-hidden rounded-b-3xl fld-hero-banner shadow-2xl">
        <div className="h-1 w-full fld-shimmer"/>
        <div className="absolute -top-10 -left-10 w-52 h-52 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute top-6 right-28 w-20 h-20 rounded-full bg-white/8 pointer-events-none" />
        <div className="relative px-6 py-9 sm:py-11 flex flex-col items-center text-center gap-4">
          <div className="fld-scale-in fld-d1 inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full text-xs font-bold text-white/90 tracking-widest uppercase">
            <span className="relative inline-block w-2 h-2 rounded-full bg-emerald-300 fld-pulse" />
            Season 2025–2026 · Live
          </div>
          <h1 className="fld-fade-up fld-d2 text-3xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-xl leading-tight">
            <span className="fld-leaf"></span> Financial Ledger
          </h1>
          <p className="fld-fade-up fld-d3 text-emerald-100/90 text-sm sm:text-base font-medium max-w-sm">
            Apple Orchard · Real-time profit &amp; expense tracking
          </p>
        </div>
        {db.loading && (
          <div className="absolute right-5 top-5">
            <Loader2 className="w-5 h-5 animate-spin text-white/70" />
          </div>
        )}
      </div>

      {/* ── ERROR BANNER ── */}
      {db.error && (
        <div className="mx-6 mt-4 flex items-center gap-3 bg-red-50 border border-red-300 rounded-xl px-4 py-3 text-sm text-red-800">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{db.error}</span>
        </div>
      )}

      {/* ── SUMMARY CARDS ── */}
      <div className="px-4 sm:px-6 py-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="fld-slide-r fld-d1 fld-summary-card">
          <SummaryCard label="Total Expenses" value={db.totalExpenses} color="from-red-600 to-red-700" icon={TrendingDown}
            sub={`Sprays ₹${fmt(db.totalSprayCost)} + Activities ₹${fmt(db.totalActivityCost)}`} />
        </div>
        <div className="fld-slide-r fld-d2 fld-summary-card">
          <SummaryCard label="Total Income"   value={db.totalIncome}   color="from-green-600 to-green-700" icon={TrendingUp}
            sub={`${db.income.reduce((s,i)=>s+i.crates,0)} crates · ${fmt(totalYieldKg)} kg`} />
        </div>
        <div className="fld-slide-r fld-d3 fld-summary-card">
          <SummaryCard label="Net Profit"     value={db.netProfit}
            color={db.netProfit >= 0 ? 'from-blue-600 to-blue-700' : 'from-orange-600 to-orange-700'}
            icon={TrendingUp } sub={`ROI ${roi.toFixed(1)}% · Cost/kg ₹${fmt(costPerKg)}`} />
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="px-4 sm:px-6">
        <div className="fld-scale-in fld-d2 flex gap-1 sm:gap-1.5 bg-white border border-gray-100 rounded-2xl p-1.5 shadow-sm overflow-x-auto">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={tab === t.key ? {background:'linear-gradient(135deg,#15803d,#16a34a)',boxShadow:'0 4px 14px rgba(22,163,74,0.35)'} : {}}
              className={`fld-tab flex-1 min-w-fit flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap ${
                tab === t.key ? 'text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-green-700'}`}>
              <t.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /><span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-3 sm:px-6 py-4 sm:py-6 space-y-6">

        {/* ════ EXPENSES ════════════════════════════════════════════ */}
        {tab === 'expenses' && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-extrabold text-gray-800">Expense Categories</h2>
                  <p className="text-sm text-gray-500">Select a category to view or add records</p>
                </div>
                <div className="bg-white border rounded-xl px-3 py-2 shadow-sm text-sm font-bold text-gray-700">
                  Total: <span className="text-red-600">₹{fmt(db.totalExpenses)}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
                {EXPENSE_CATEGORY_CONFIG.map(cfg => {
                  const summary = categorySummaries.find(s => s.key === cfg.key)!;
                  return (
                    <ExpenseCategoryCard key={cfg.key} config={cfg} totalCost={summary.total} count={summary.count}
                      isSelected={selectedExpenseCategory === cfg.key} onClick={() => handleCategoryCardClick(cfg.key)} />
                  );
                })}
              </div>
            </div>

            {selectedCategoryConfig && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
                   style={{ animation:'slideDown 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}>
                <style>{`@keyframes slideDown{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}`}</style>

                {/* Panel Header */}
                <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 gap-2" style={{ background:selectedCategoryConfig.gradient }}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl" style={{ background:'rgba(255,255,255,0.2)' }}>
                      <selectedCategoryConfig.Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-extrabold text-base">{selectedCategoryConfig.label}</p>
                      <p className="text-white text-xs opacity-75">{selectedCategoryConfig.sublabel}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setShowAddForm(!showAddForm)}
                      className="flex items-center gap-2 bg-black bg-opacity-20 hover:bg-opacity-30 text-white text-sm font-semibold px-4 py-2 rounded-xl transition">
                      <Plus className="w-4 h-4" />{showAddForm ? 'Cancel' : 'Add New'}
                    </button>
                    <button onClick={() => { setSelectedExpenseCategory(null); setShowAddForm(false); }}
                      className="p-2 rounded-xl bg-red-500 bg-opacity-20 hover:bg-opacity-30 text-white transition">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Add Form */}
                {showAddForm && (
                  <div className="px-3 sm:px-6 py-4 sm:py-5 border-b border-gray-100 bg-gray-50">
                    {selectedCategoryConfig.dataSource === 'spray' ? (
                      /* ---- SPRAY FORM ---- */
                      <div className="space-y-4">
                        <p className="font-bold text-gray-700 text-sm">New Spray Operation</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <select className="border rounded-lg px-3 py-2 bg-white text-sm" value={stage} onChange={e => setStage(e.target.value)}>
                            <option value="">Select Stage</option>
                            {SPRAY_STAGES.map(s => <option key={s}>{s}</option>)}
                          </select>
                          <input type="date" className="border rounded-lg px-3 py-2 bg-white text-sm" value={sprayDate} onChange={e => setSprayDate(e.target.value)} />
                          <div className="relative">
                            <input placeholder="Water (Litres)" type="number" className="border rounded-lg px-3 py-2 bg-white text-sm w-full" value={water} onChange={e => setWater(e.target.value)} />
                            {stage && PREVIOUS_SEASON_WATER[stage] && (
                              <span className="absolute -bottom-5 left-0 text-xs text-gray-500">Prev: ~{PREVIOUS_SEASON_WATER[stage]} L</span>
                            )}
                          </div>
                        </div>

                        {/* Chemicals with Image Upload */}
                        <div className="space-y-2 mt-2">
                          {chemicals.map((c, i) => (
                            <div key={i} className="bg-white rounded-xl border border-gray-200 p-3 space-y-2 shadow-sm">
                              <div className="flex items-center gap-2">
                                {/* Product image picker */}
                                <ChemicalImagePicker
                                  imageUrl={c.imageUrl}
                                  onChange={url => updateChemical(i, 'imageUrl', url)}
                                  onViewFull={src => setFormModalImage({ src, alt: c.brand || c.name || 'Product' })}
                                />
                                <select className="flex-1 border rounded px-2 py-1.5 text-sm" value={c.name} onChange={e => selectChemical(i, e.target.value)}>
                                  <option value="">Chemical Name</option>
                                  {CHEMICAL_LIBRARY.map(ch => <option key={ch.name}>{ch.name}</option>)}
                                </select>
                                <input placeholder="Brand" className="flex-1 border rounded px-2 py-1.5 text-sm bg-gray-50" value={c.brand} onChange={e => updateChemical(i,'brand',e.target.value)} />
                                <button onClick={() => removeChemical(i)} className="text-red-400 hover:text-red-600 p-1">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <input type="number" placeholder="Qty" className="border rounded px-2 py-1.5 text-sm" value={c.qty||''} onChange={e => updateChemical(i,'qty',+e.target.value)} />
                                <select className="border rounded px-2 py-1.5 text-sm bg-white" value={c.unit} onChange={e => updateChemical(i,'unit',e.target.value)}>
                                  <option value="">Unit</option>
                                  <option value="kg">kg</option>
                                  <option value="grams">grams</option>
                                  <option value="ml">ml</option>
                                  <option value="l">l</option>
                                  <option value="g">g</option>
                                </select>
                                <div className="flex items-center gap-2">
                                  <input type="number" placeholder="Rate ₹" className="border rounded px-2 py-1.5 text-sm flex-1" value={c.rate||''} onChange={e => updateChemical(i,'rate',+e.target.value)} />
                                  <span className="text-sm font-bold text-sky-700 whitespace-nowrap">₹{fmt(chemicalCost(c))}</span>
                                </div>
                              </div>
                              {c.recommended && <p className="text-xs text-gray-500 px-1">Recommended: {c.recommended}</p>}
                              {/* Image preview label */}
                              {!c.imageUrl && (
                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                  <Camera className="w-3 h-3" /> Tap the camera icon to add a product photo
                                </p>
                              )}
                            </div>
                          ))}
                        </div>

                        <button onClick={addChemical} className="border border-sky-400 text-sky-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-sky-50">
                          <Plus className="w-4 h-4" /> Add Chemical
                        </button>
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200">
                          <input type="number" placeholder="No. of Labours" className="border rounded-lg px-3 py-2 text-sm" value={sprayLabours} onChange={e => setSprayLabours(e.target.value)} />
                          <input type="number" placeholder="Rate per Labour (₹)" className="border rounded-lg px-3 py-2 text-sm" value={sprayLabourRate} onChange={e => setSprayLabourRate(e.target.value)} />
                        </div>
                        <button onClick={saveSpray} disabled={!stage || !sprayDate || chemicals.length === 0 || db.mutating}
                          className="text-white px-6 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 transition flex items-center gap-2"
                          style={{ background:selectedCategoryConfig.gradient }}>
                          {db.mutating && <Loader2 className="w-4 h-4 animate-spin" />}
                          Save Spray Operation
                        </button>
                      </div>
                    ) : (
                      /* ---- ACTIVITY FORM ---- */
                      <div className="space-y-4">
                        <p className="font-bold text-gray-700 text-sm">Add {selectedCategoryConfig.label} Expense</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <select className="border rounded-lg px-3 py-2 bg-white text-sm" value={actCat} onChange={e => setActCat(e.target.value as ActivityCategory)}>
                            {ACTIVITY_CATEGORIES.filter(c => selectedCategoryConfig.activityCodes.includes(c.key)).map(c => (
                              <option key={c.key} value={c.key}>{c.icon} {c.label}</option>
                            ))}
                          </select>
                          <input type="text" placeholder="Description (optional)" className="border rounded-lg px-3 py-2 text-sm" value={actDesc} onChange={e => setActDesc(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="text-xs text-gray-600 block mb-1">Start Date</label>
                            <input type="date" className="border rounded-lg px-3 py-2 text-sm w-full" value={actStartDate} onChange={e => setActStartDate(e.target.value)} />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600 block mb-1">End Date</label>
                            <input type="date" className="border rounded-lg px-3 py-2 text-sm w-full" value={actEndDate} onChange={e => setActEndDate(e.target.value)} />
                          </div>
                          <input type="number" placeholder="No. of Labours" className="border rounded-lg px-3 py-2 text-sm" value={actLabours} onChange={e => setActLabours(e.target.value)} />
                          <input type="number" placeholder="Rate/day (₹)" className="border rounded-lg px-3 py-2 text-sm" value={actRate} onChange={e => setActRate(e.target.value)} />
                        </div>
                        {actStartDate && actLabours && actRate && (
                          <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm">
                            <div className="flex justify-between"><span className="text-gray-600">Days</span><span className="font-semibold">{daysBetween(actStartDate, actEndDate)}</span></div>
                            <div className="flex justify-between"><span className="text-gray-600">Labours × Rate</span><span>{actLabours} × ₹{actRate}</span></div>
                            <div className="flex justify-between font-bold border-t pt-1 mt-1">
                              <span>Estimated Cost</span>
                              <span style={{ color:selectedCategoryConfig.border }}>₹{fmt(daysBetween(actStartDate,actEndDate)*Number(actLabours)*Number(actRate))}</span>
                            </div>
                          </div>
                        )}
                        <button onClick={saveActivity} disabled={!actCat||!actStartDate||!actLabours||!actRate||db.mutating}
                          className="text-white px-6 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 flex items-center gap-2"
                          style={{ background:selectedCategoryConfig.gradient }}>
                          {db.mutating && <Loader2 className="w-4 h-4 animate-spin" />}
                          Save {selectedCategoryConfig.label} Expense
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Records */}
                <div className="px-3 sm:px-6 py-4 sm:py-5">
                  {selectedCategoryConfig.dataSource === 'spray' ? (
                    <SprayDetailPanel sprays={db.sprays} openSprayId={openSprayId} setOpenSprayId={setOpenSprayId}
                      onDelete={db.removeSpray} sprayCost={sprayCost} chemicalCost={chemicalCost}
                      totalSprayCost={db.totalSprayCost} mutating={db.mutating} />
                  ) : (
                    <ActivityDetailPanel config={selectedCategoryConfig} activities={db.activities}
                      onDelete={db.removeActivity} mutating={db.mutating} />
                  )}
                </div>
              </div>
            )}

            {!selectedExpenseCategory && (
              <div className="text-center py-8 text-gray-400">
                <Activity className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">Click any category card above to view or add expense records</p>
              </div>
            )}
          </div>
        )}

        {/* ════ INCOME ═══════════════════════════════════════════════ */}
        {tab === 'income' && (
          <div className="bg-white rounded-2xl shadow-md p-3 sm:p-6 space-y-6">
            <SectionHeader title="Harvest Income — Crate Sales" icon={ShoppingBag} color="border-green-600" />
            <div className="bg-green-50 rounded-xl p-4 space-y-4">
              <p className="font-semibold text-green-800">Record Sale</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select className="border rounded-lg px-3 py-2 bg-white text-sm" value={incVariety} onChange={e => setIncVariety(e.target.value)}>
                  <option value="">Select Variety</option>
                  {APPLE_VARIETIES.map(v => <option key={v}>{v}</option>)}
                </select>
                <input type="date" className="border rounded-lg px-3 py-2 text-sm" value={incDate} onChange={e => setIncDate(e.target.value)} />
                <input type="text" placeholder="Buyer Name (optional)" className="border rounded-lg px-3 py-2 text-sm" value={incBuyer} onChange={e => setIncBuyer(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input type="number" placeholder="No. of Crates" className="border rounded-lg px-3 py-2 text-sm" value={incCrates} onChange={e => setIncCrates(e.target.value)} />
                <input type="number" placeholder="Kg per Crate (default 20)" className="border rounded-lg px-3 py-2 text-sm" value={incKgPerCrate} onChange={e => setIncKgPerCrate(e.target.value)} />
                <input type="number" placeholder="Price per Crate (₹)" className="border rounded-lg px-3 py-2 text-sm" value={incPrice} onChange={e => setIncPrice(e.target.value)} />
              </div>
              {incCrates && incPrice && (
                <div className="bg-white border border-green-200 rounded-lg p-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">Total Weight</span><span>{Number(incCrates)*Number(incKgPerCrate||20)} kg</span></div>
                  <div className="flex justify-between font-bold border-t pt-1 mt-1"><span>Gross Revenue</span><span className="text-green-700">₹{fmt(Number(incCrates)*Number(incPrice))}</span></div>
                </div>
              )}
              <button onClick={saveIncome} disabled={!incVariety||!incCrates||!incPrice||!incDate||db.mutating}
                className="bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2">
                {db.mutating && <Loader2 className="w-4 h-4 animate-spin" />}
                Record Income
              </button>
            </div>

            {db.income.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Sales Records</p>
                {/* Mobile cards */}
                <div className="sm:hidden space-y-3">
                  {db.income.map((entry) => (
                    <div key={entry.id} className="border rounded-xl p-3 bg-white">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-gray-800">{entry.variety}</p>
                          <p className="text-xs text-gray-500">{entry.date}{entry.buyer ? ` · ${entry.buyer}` : ''}</p>
                          <p className="text-xs text-gray-600 mt-1">{entry.crates} crates · {entry.crates * entry.kgPerCrate} kg · ₹{entry.pricePerCrate}/crate</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-green-700">₹{fmt(entry.crates * entry.pricePerCrate)}</span>
                          <button onClick={() => db.removeIncome(entry.id)} disabled={db.mutating} className="text-red-400 hover:text-red-600 disabled:opacity-40 p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between bg-green-50 rounded-xl px-4 py-3 font-bold border border-green-200">
                    <span>{db.income.reduce((s,i)=>s+i.crates,0)} crates · {fmt(totalYieldKg)} kg</span>
                    <span className="text-green-700">₹{fmt(db.totalIncome)}</span>
                  </div>
                </div>
                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto rounded-xl border">
                  <table className="w-full text-sm">
                    <thead className="bg-green-50 text-gray-600 text-xs uppercase">
                      <tr>
                        <th className="px-4 py-3 text-left">Date</th>
                        <th className="px-4 py-3 text-left">Variety</th>
                        <th className="px-4 py-3 text-left">Buyer</th>
                        <th className="px-4 py-3 text-right">Crates</th>
                        <th className="px-4 py-3 text-right">Kg</th>
                        <th className="px-4 py-3 text-right">Price/Crate</th>
                        <th className="px-4 py-3 text-right">Total</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {db.income.map((entry, i) => (
                        <tr key={entry.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3">{entry.date}</td>
                          <td className="px-4 py-3 font-semibold">{entry.variety}</td>
                          <td className="px-4 py-3 text-gray-500">{entry.buyer || '—'}</td>
                          <td className="px-4 py-3 text-right">{entry.crates}</td>
                          <td className="px-4 py-3 text-right">{entry.crates * entry.kgPerCrate}</td>
                          <td className="px-4 py-3 text-right">₹{entry.pricePerCrate}</td>
                          <td className="px-4 py-3 text-right font-bold text-green-700">₹{fmt(entry.crates*entry.pricePerCrate)}</td>
                          <td className="px-4 py-3 text-center">
                            <button onClick={() => db.removeIncome(entry.id)} disabled={db.mutating} className="text-red-400 hover:text-red-600 disabled:opacity-40">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-green-50 font-bold">
                      <tr>
                        <td colSpan={3} className="px-4 py-3">Total</td>
                        <td className="px-4 py-3 text-right">{db.income.reduce((s,i)=>s+i.crates,0)}</td>
                        <td className="px-4 py-3 text-right">{fmt(totalYieldKg)} kg</td>
                        <td></td>
                        <td className="px-4 py-3 text-right text-green-700">₹{fmt(db.totalIncome)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════ LABOUR REGISTRY ══════════════════════════════════════ */}
        {tab === 'labour' && (
          <div className="bg-white rounded-2xl shadow-md p-3 sm:p-6 space-y-6">
            <SectionHeader title="Labour Registry" icon={Users} color="border-purple-600" />

            {/* Worker registration form */}
            <div className="bg-purple-50 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-purple-800">Register Worker</p>
                <p className="text-xs text-purple-500 bg-purple-100 px-2 py-1 rounded-full">Phone = unique identity</p>
              </div>

              {/* Status message */}
              {workerMsg && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                  workerMsg.type === 'info' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-green-50 text-green-700 border border-green-200'
                }`}>
                  <span>{workerMsg.text}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input placeholder="Worker Name *" className="border rounded-lg px-3 py-2 text-sm" value={wName} onChange={e => setWName(e.target.value)} />
                <div className="relative">
                  <input
                    placeholder="Phone Number (unique ID)"
                    type="tel"
                    className="border rounded-lg px-3 py-2 text-sm w-full"
                    value={wPhone}
                    onChange={e => setWPhone(e.target.value)}
                  />
                  {wPhone && db.workers.some(w => w.phone === wPhone.trim()) && (
                    <div className="absolute -bottom-5 left-0 text-xs text-blue-600 flex items-center gap-1">
                      <span>Existing worker — days will be added</span>
                    </div>
                  )}
                </div>
                <select className="border rounded-lg px-3 py-2 bg-white text-sm" value={wActivity} onChange={e => setWActivity(e.target.value as any)}>
                  <option value="SPRAY">Spray Operation</option>
                  {ACTIVITY_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Start Date *</label>
                  <input type="date" className="border rounded-lg px-3 py-2 text-sm w-full" value={wStart} onChange={e => setWStart(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">End Date</label>
                  <input type="date" className="border rounded-lg px-3 py-2 text-sm w-full" value={wEnd} onChange={e => setWEnd(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Rate/Day (₹) *</label>
                  <input type="number" placeholder="500" className="border rounded-lg px-3 py-2 text-sm w-full" value={wRate} onChange={e => setWRate(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Advance Paid (₹)</label>
                  <input type="number" placeholder="0" className="border rounded-lg px-3 py-2 text-sm w-full" value={wAdvance} onChange={e => setWAdvance(e.target.value)} />
                </div>
              </div>
              <button onClick={saveWorker} disabled={!wName||!wStart||!wRate||db.mutating}
                className="bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2">
                {db.mutating && <Loader2 className="w-4 h-4 animate-spin" />}
                {wPhone && db.workers.some(w => w.phone === wPhone.trim()) ? 'Add Work Entry' : 'Register Worker'}
              </button>
            </div>

            {db.workers.length > 0 && (
              <>
                {/* Summary stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-purple-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">Total Workers</p>
                    <p className="text-2xl font-extrabold text-purple-700">{workersByPhone.length}</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">Total Wages</p>
                    <p className="text-2xl font-extrabold text-purple-700">₹{fmt(db.totalLabourCost)}</p>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">Advance Paid</p>
                    <p className="text-2xl font-extrabold text-orange-600">₹{fmt(db.totalAdvancePaid)}</p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">Balance Due</p>
                    <p className="text-2xl font-extrabold text-red-600">₹{fmt(totalLabourDue)}</p>
                  </div>
                </div>

                {/* Workers grouped by phone — mobile cards */}
                <div className="sm:hidden space-y-3">
                  {workersByPhone.map((group, gi) => {
                    const totalDays  = group.entries.reduce((s, e) => s + e.days, 0);
                    const totalGross = group.entries.reduce((s, e) => s + e.days * e.ratePerDay, 0);
                    const totalAdv   = group.entries.reduce((s, e) => s + e.advance, 0);
                    const totalBal   = totalGross - totalAdv;
                    const isExpanded = expandedWorkerPhone === group.phone;
                    const hasMultiple= group.entries.length > 1;
                    return (
                      <div key={`mob-${group.phone || gi}`} className={`border rounded-xl overflow-hidden ${group.paid ? 'opacity-60' : ''}`}>
                        <div className="flex items-center justify-between px-3 py-2.5 bg-purple-50" onClick={() => hasMultiple && setExpandedWorkerPhone(isExpanded ? null : group.phone)}>
                          <div>
                            <p className="font-bold text-gray-800 text-sm">{group.name} {hasMultiple && <span className="text-xs bg-purple-200 text-purple-700 px-1.5 py-0.5 rounded-full">{group.entries.length}</span>}</p>
                            <p className="text-xs text-gray-500">{group.phone || '—'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <p className="text-xs text-gray-500">{totalDays} days · ₹{fmt(totalGross)}</p>
                              <p className="text-xs text-purple-700 font-bold">Bal: ₹{fmt(totalBal)}</p>
                            </div>
                            <button onClick={e => { e.stopPropagation(); db.markPaid(group.id, !group.paid); }} disabled={db.mutating} className="p-1">
                              {group.paid ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <div className="w-5 h-5 rounded-full border-2 border-gray-400" />}
                            </button>
                            {!hasMultiple && (
                              <button onClick={e => { e.stopPropagation(); db.removeWorker(group.id); }} disabled={db.mutating} className="text-red-400 hover:text-red-600 p-1">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                            {hasMultiple && (isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />)}
                          </div>
                        </div>
                        {isExpanded && group.entries.map((entry, ei) => (
                          <div key={`mob-entry-${entry.entryId}`} className="px-3 py-2 border-t border-purple-100 bg-white flex items-center justify-between">
                            <div>
                              <p className="text-xs font-semibold text-gray-700">Entry {ei+1}: {ACTIVITY_CATEGORIES.find(c=>c.key===entry.activity)?.label||entry.activity}</p>
                              <p className="text-xs text-gray-500">{entry.startDate}{entry.endDate!==entry.startDate?` → ${entry.endDate}`:''} · {entry.days}d × ₹{entry.ratePerDay}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <p className="text-xs font-bold">₹{fmt(entry.days*entry.ratePerDay)}</p>
                                <p className="text-xs text-orange-600">Adv: ₹{fmt(entry.advance)}</p>
                              </div>
                              <button onClick={() => db.removeWorker(entry.entryId)} disabled={db.mutating} className="text-red-400 hover:text-red-600 p-1">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>

                {/* Workers grouped by phone — desktop table */}
                <div className="hidden sm:block overflow-x-auto rounded-xl border">
                  <table className="w-full text-sm">
                    <thead className="bg-purple-50 text-gray-600 text-xs uppercase">
                      <tr>
                        <th className="px-4 py-3 text-left">Name</th>
                        <th className="px-4 py-3 text-left">Phone</th>
                        <th className="px-4 py-3 text-left">Activity</th>
                        <th className="px-4 py-3 text-center">Days</th>
                        <th className="px-4 py-3 text-right">Rate/Day</th>
                        <th className="px-4 py-3 text-right">Gross</th>
                        <th className="px-4 py-3 text-right">Advance</th>
                        <th className="px-4 py-3 text-right">Balance</th>
                        <th className="px-4 py-3 text-center">Paid</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {workersByPhone.map((group, gi) => {
                        // Aggregate totals for this phone
                        const totalDays    = group.entries.reduce((s, e) => s + e.days, 0);
                        const totalGross   = group.entries.reduce((s, e) => s + e.days * e.ratePerDay, 0);
                        const totalAdv     = group.entries.reduce((s, e) => s + e.advance, 0);
                        const totalBal     = totalGross - totalAdv;
                        const isExpanded   = expandedWorkerPhone === group.phone;
                        const hasMultiple  = group.entries.length > 1;

                        return (
                          <>
                            {/* Summary row per worker */}
                            <tr
                              key={`grp-${group.phone || gi}`}
                              className={`${gi % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${group.paid ? 'opacity-60' : ''} cursor-pointer hover:bg-purple-50 transition`}
                              onClick={() => hasMultiple && setExpandedWorkerPhone(isExpanded ? null : group.phone)}
                            >
                              <td className="px-4 py-3 font-semibold flex items-center gap-2">
                                {group.name}
                                {hasMultiple && (
                                  <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-bold">
                                    {group.entries.length} entries
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-gray-500">{group.phone || '—'}</td>
                              <td className="px-4 py-3 text-gray-600">
                                {group.entries.length === 1
                                  ? ACTIVITY_CATEGORIES.find(c => c.key === group.entries[0].activity)?.label || group.entries[0].activity
                                  : <span className="text-purple-500 text-xs">Multiple</span>}
                              </td>
                              <td className="px-4 py-3 text-center font-semibold">{totalDays}</td>
                              <td className="px-4 py-3 text-right">
                                {group.entries.length === 1 ? `₹${group.entries[0].ratePerDay}` : '—'}
                              </td>
                              <td className="px-4 py-3 text-right font-semibold">₹{fmt(totalGross)}</td>
                              <td className="px-4 py-3 text-right text-orange-600">₹{fmt(totalAdv)}</td>
                              <td className="px-4 py-3 text-right font-bold text-purple-700">₹{fmt(totalBal)}</td>
                              <td className="px-4 py-3 text-center">
                                <button onClick={e => { e.stopPropagation(); db.markPaid(group.id, !group.paid); }} disabled={db.mutating}>
                                  {group.paid
                                    ? <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                                    : <div className="w-5 h-5 rounded-full border-2 border-gray-400 mx-auto" />}
                                </button>
                              </td>
                              <td className="px-4 py-3 text-center">
                                {hasMultiple
                                  ? (isExpanded
                                      ? <ChevronUp className="w-4 h-4 text-gray-400 mx-auto" />
                                      : <ChevronDown className="w-4 h-4 text-gray-400 mx-auto" />)
                                  : <button onClick={e => { e.stopPropagation(); db.removeWorker(group.id); }} disabled={db.mutating} className="text-red-400 hover:text-red-600 disabled:opacity-40">
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                }
                              </td>
                            </tr>

                            {/* Expanded individual work entries */}
                            {isExpanded && group.entries.map((entry, ei) => {
                              const eGross   = entry.days * entry.ratePerDay;
                              const eBal     = eGross - entry.advance;
                              const isEdit   = editingEntryId === entry.entryId;
                              const eDays    = isEdit && editDraft.startDate && editDraft.endDate
                                ? daysBetween(editDraft.startDate, editDraft.endDate)
                                : entry.days;

                              return (
                                <tr key={`entry-${entry.entryId}`} className="bg-purple-50/60 border-t border-purple-100">
                                  <td className="pl-8 pr-4 py-2.5 text-xs text-gray-500 italic">
                                    {isEdit ? (
                                      <select className="border rounded px-1.5 py-1 text-xs bg-white" value={editDraft.activity || entry.activity}
                                        onChange={e => setEditDraft(d => ({ ...d, activity: e.target.value }))}>
                                        <option value="SPRAY">Spray Operation</option>
                                        {ACTIVITY_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                                      </select>
                                    ) : (
                                      `Entry ${ei + 1}`
                                    )}
                                  </td>
                                  <td className="px-4 py-2.5 text-xs text-gray-400">
                                    {isEdit ? '' : `${entry.startDate}${entry.endDate !== entry.startDate ? ` → ${entry.endDate}` : ''}`}
                                  </td>
                                  <td className="px-4 py-2.5 text-xs">
                                    {isEdit ? (
                                      <div className="flex gap-1">
                                        <input type="date" className="border rounded px-1.5 py-1 text-xs" value={editDraft.startDate || entry.startDate}
                                          onChange={e => setEditDraft(d => ({ ...d, startDate: e.target.value }))} />
                                        <input type="date" className="border rounded px-1.5 py-1 text-xs" value={editDraft.endDate || entry.endDate}
                                          onChange={e => setEditDraft(d => ({ ...d, endDate: e.target.value }))} />
                                      </div>
                                    ) : (
                                      ACTIVITY_CATEGORIES.find(c => c.key === entry.activity)?.label || entry.activity
                                    )}
                                  </td>
                                  <td className="px-4 py-2.5 text-center text-xs font-semibold">
                                    {isEdit ? eDays : entry.days}
                                  </td>
                                  <td className="px-4 py-2.5 text-right text-xs">
                                    {isEdit ? (
                                      <input type="number" className="border rounded px-1.5 py-1 text-xs w-20 text-right"
                                        value={editDraft.ratePerDay ?? entry.ratePerDay}
                                        onChange={e => setEditDraft(d => ({ ...d, ratePerDay: +e.target.value }))} />
                                    ) : `₹${entry.ratePerDay}`}
                                  </td>
                                  <td className="px-4 py-2.5 text-right text-xs font-semibold">
                                    ₹{fmt(isEdit ? eDays * (editDraft.ratePerDay ?? entry.ratePerDay) : eGross)}
                                  </td>
                                  <td className="px-4 py-2.5 text-right text-xs text-orange-600">
                                    {isEdit ? (
                                      <input type="number" className="border rounded px-1.5 py-1 text-xs w-20 text-right"
                                        value={editDraft.advance ?? entry.advance}
                                        onChange={e => setEditDraft(d => ({ ...d, advance: +e.target.value }))} />
                                    ) : `₹${fmt(entry.advance)}`}
                                  </td>
                                  <td className="px-4 py-2.5 text-right text-xs font-bold text-purple-700">
                                    ₹{fmt(isEdit ? eDays * (editDraft.ratePerDay ?? entry.ratePerDay) - (editDraft.advance ?? entry.advance) : eBal)}
                                  </td>
                                  <td className="px-4 py-2.5 text-center"></td>
                                  <td className="px-4 py-2.5 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      {isEdit ? (
                                        <>
                                          <button onClick={() => saveEdit(entry)} disabled={db.mutating}
                                            className="p-1 rounded text-green-600 hover:bg-green-50" title="Save">
                                            <Save className="w-3.5 h-3.5" />
                                          </button>
                                          <button onClick={cancelEdit} className="p-1 rounded text-gray-400 hover:bg-gray-100" title="Cancel">
                                            <XCircle className="w-3.5 h-3.5" />
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <button onClick={e => { e.stopPropagation(); startEdit(entry.entryId, entry); }}
                                            className="p-1 rounded text-blue-400 hover:text-blue-600 hover:bg-blue-50" title="Edit entry">
                                            <Pencil className="w-3.5 h-3.5" />
                                          </button>
                                          <button onClick={e => { e.stopPropagation(); db.removeWorker(entry.entryId); }} disabled={db.mutating}
                                            className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-40" title="Delete entry">
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}

                            {/* If single entry, show inline edit option */}
                            {!hasMultiple && group.entries.length === 1 && (() => {
                              const entry = group.entries[0];
                              const isEdit = editingEntryId === entry.entryId;
                              if (!isEdit) return null;
                              const eDays = editDraft.startDate && editDraft.endDate
                                ? daysBetween(editDraft.startDate, editDraft.endDate)
                                : entry.days;
                              return (
                                <tr key={`edit-${entry.entryId}`} className="bg-blue-50 border-t border-blue-100">
                                  <td colSpan={10} className="px-4 py-3">
                                    <div className="flex flex-wrap items-end gap-3">
                                      <div>
                                        <label className="text-xs text-gray-500 block mb-1">Activity</label>
                                        <select className="border rounded px-2 py-1.5 text-sm bg-white" value={editDraft.activity || entry.activity}
                                          onChange={e => setEditDraft(d => ({ ...d, activity: e.target.value }))}>
                                          <option value="SPRAY">Spray Operation</option>
                                          {ACTIVITY_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                                        </select>
                                      </div>
                                      <div>
                                        <label className="text-xs text-gray-500 block mb-1">Start Date</label>
                                        <input type="date" className="border rounded px-2 py-1.5 text-sm" value={editDraft.startDate || entry.startDate}
                                          onChange={e => setEditDraft(d => ({ ...d, startDate: e.target.value }))} />
                                      </div>
                                      <div>
                                        <label className="text-xs text-gray-500 block mb-1">End Date</label>
                                        <input type="date" className="border rounded px-2 py-1.5 text-sm" value={editDraft.endDate || entry.endDate}
                                          onChange={e => setEditDraft(d => ({ ...d, endDate: e.target.value }))} />
                                      </div>
                                      <div>
                                        <label className="text-xs text-gray-500 block mb-1">Rate/Day ₹</label>
                                        <input type="number" className="border rounded px-2 py-1.5 text-sm w-24"
                                          value={editDraft.ratePerDay ?? entry.ratePerDay}
                                          onChange={e => setEditDraft(d => ({ ...d, ratePerDay: +e.target.value }))} />
                                      </div>
                                      <div>
                                        <label className="text-xs text-gray-500 block mb-1">Advance ₹</label>
                                        <input type="number" className="border rounded px-2 py-1.5 text-sm w-24"
                                          value={editDraft.advance ?? entry.advance}
                                          onChange={e => setEditDraft(d => ({ ...d, advance: +e.target.value }))} />
                                      </div>
                                      <div className="text-sm font-bold text-purple-700">
                                        Days: {eDays} · Gross: ₹{fmt(eDays * (editDraft.ratePerDay ?? entry.ratePerDay))}
                                      </div>
                                      <button onClick={() => saveEdit(entry)} disabled={db.mutating}
                                        className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold">
                                        <Save className="w-3.5 h-3.5" /> Save
                                      </button>
                                      <button onClick={cancelEdit} className="flex items-center gap-1.5 border text-gray-600 px-3 py-1.5 rounded-lg text-sm">
                                        <XCircle className="w-3.5 h-3.5" /> Cancel
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })()}
                          </>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-purple-50 font-bold text-sm">
                      <tr>
                        <td colSpan={5} className="px-4 py-3">Totals</td>
                        <td className="px-4 py-3 text-right">₹{fmt(db.totalLabourCost)}</td>
                        <td className="px-4 py-3 text-right text-orange-600">₹{fmt(db.totalAdvancePaid)}</td>
                        <td className="px-4 py-3 text-right text-purple-700">₹{fmt(totalLabourDue)}</td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Hint bar */}
                <p className="text-xs text-gray-400 text-center">
                  Click a row with multiple entries to expand · Click <Pencil className="inline w-3 h-3" /> to edit any work entry
                </p>
              </>
            )}
          </div>
        )}

        {/* ════ SUMMARY ══════════════════════════════════════════════ */}
        {tab === 'summary' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-md p-6">
              <SectionHeader title="Profit & Loss Statement" icon={BarChart2} color="border-gray-700" />
              <div className="mt-4 space-y-1">
                <div className="bg-green-50 rounded-lg px-4 py-3">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Income</p>
                  {db.income.length === 0
                    ? <p className="text-sm text-gray-400">No income recorded</p>
                    : APPLE_VARIETIES.filter(v => db.income.some(e => e.variety === v)).map(v => {
                        const total = db.income.filter(e=>e.variety===v).reduce((s,e)=>s+e.crates*e.pricePerCrate,0);
                        return <div key={v} className="flex justify-between text-sm py-0.5"><span className="text-gray-600">{v}</span><span>₹{fmt(total)}</span></div>;
                      })}
                  <div className="flex justify-between font-bold border-t border-green-200 pt-2 mt-2">
                    <span>Total Income</span><span className="text-green-700">₹{fmt(db.totalIncome)}</span>
                  </div>
                </div>
                <div className="bg-red-50 rounded-lg px-4 py-3">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Expenses</p>
                  {EXPENSE_CATEGORY_CONFIG.map(cfg => {
                    const summary = categorySummaries.find(s=>s.key===cfg.key)!;
                    if (summary.total === 0) return null;
                    return <div key={cfg.key} className="flex justify-between text-sm py-0.5"><span className="text-gray-600">{cfg.label}</span><span>₹{fmt(summary.total)}</span></div>;
                  })}
                  <div className="flex justify-between font-bold border-t border-red-200 pt-2 mt-2">
                    <span>Total Expenses</span><span className="text-red-700">₹{fmt(db.totalExpenses)}</span>
                  </div>
                </div>
                <div className={`rounded-lg px-4 py-4 ${db.netProfit>=0?'bg-blue-600':'bg-orange-600'} text-white`}>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">Net Profit / Loss</span>
                    <span className="text-2xl font-extrabold">₹{fmt(db.netProfit)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label:'ROI',              value:`${roi.toFixed(1)}%`,          color: roi>=0?'text-green-700':'text-red-700' },
                { label:'Cost per Kg',      value:`₹${fmt(costPerKg)}`,          color:'text-gray-800' },
                { label:'Total Yield (Kg)', value:`${fmt(totalYieldKg)}`,         color:'text-gray-800' },
                { label:'Spray Cost %',     value:db.totalExpenses>0?`${((db.totalSprayCost/db.totalExpenses)*100).toFixed(1)}%`:'0%', color:'text-blue-700' },
                { label:'Labour Balance',   value:`₹${fmt(totalLabourDue)}`,      color:'text-purple-700' },
                { label:'Total Crates',     value:`${db.income.reduce((s,i)=>s+i.crates,0)}`, color:'text-gray-800' },
              ].map(m => (
                <div key={m.label} className="bg-white rounded-2xl shadow p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">{m.label}</p>
                  <p className={`text-xl font-extrabold ${m.color}`}>{m.value}</p>
                </div>
              ))}
            </div>

            {db.totalExpenses > 0 && (
              <div className="bg-white rounded-2xl shadow-md p-6">
                <p className="font-bold text-gray-700 mb-4">Expense Distribution</p>
                <div className="space-y-3">
                  {EXPENSE_CATEGORY_CONFIG.map(cfg => {
                    const summary = categorySummaries.find(s=>s.key===cfg.key)!;
                    if (summary.total === 0) return null;
                    return (
                      <div key={cfg.key}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="flex items-center gap-2"><cfg.Icon className="w-4 h-4" />{cfg.label}</span>
                          <span className="font-semibold">₹{fmt(summary.total)} ({((summary.total/db.totalExpenses)*100).toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-3">
                          <div className="h-3 rounded-full transition-all" style={{ width:`${(summary.total/db.totalExpenses)*100}%`, background:cfg.gradient }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
