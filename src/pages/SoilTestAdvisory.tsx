import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, CreditCard as Edit, Trash2, Save, X, FileText,
  CircleCheck as CheckCircle, Droplets, FlaskConical,
  ArrowDown, ArrowUp, Minus, Beaker, Waves, Leaf,
  TrendingUp, TrendingDown, AlertCircle, ChevronRight,
  Calendar, Building2, MapPin, Activity,
} from 'lucide-react';
import Button from '../components/UI/Button';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

/* ══════════════════════════════════════════════════════════════════════════
   GLOBAL CSS
══════════════════════════════════════════════════════════════════════════ */
const STYLES = `
@keyframes fadeUp   { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
@keyframes fadeDown { from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }
@keyframes scaleIn  { from{opacity:0;transform:scale(0.91)} to{opacity:1;transform:scale(1)} }
@keyframes slideR   { from{opacity:0;transform:translateX(-22px)} to{opacity:1;transform:translateX(0)} }
@keyframes slideL   { from{opacity:0;transform:translateX(22px)} to{opacity:1;transform:translateX(0)} }
@keyframes floatUp  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
@keyframes spin360  { to{transform:rotate(360deg)} }
@keyframes pulse2   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.55;transform:scale(1.18)} }
@keyframes shimmer  { 0%{background-position:-700px 0} 100%{background-position:700px 0} }
@keyframes defGrow  { from{width:0%} to{width:var(--dw)} }
@keyframes excGrow  { from{width:0%} to{width:var(--ew)} }
@keyframes okGrow   { from{width:0%} to{width:var(--ow)} }
@keyframes gradShift{ 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
@keyframes borderGlow{ 0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,.0)} 50%{box-shadow:0 0 0 4px rgba(16,185,129,.18)} }
@keyframes waterRipple{ 0%{transform:scale(1);opacity:.7} 100%{transform:scale(2.2);opacity:0} }
@keyframes countUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

.a-fade-up  { animation: fadeUp   0.55s cubic-bezier(.22,1,.36,1) both }
.a-fade-dn  { animation: fadeDown 0.45s cubic-bezier(.22,1,.36,1) both }
.a-scale-in { animation: scaleIn  0.42s cubic-bezier(.22,1,.36,1) both }
.a-slide-r  { animation: slideR   0.44s cubic-bezier(.22,1,.36,1) both }
.a-slide-l  { animation: slideL   0.44s cubic-bezier(.22,1,.36,1) both }

.d0{animation-delay:.00s} .d1{animation-delay:.06s} .d2{animation-delay:.12s}
.d3{animation-delay:.18s} .d4{animation-delay:.24s} .d5{animation-delay:.30s}
.d6{animation-delay:.36s} .d7{animation-delay:.42s} .d8{animation-delay:.48s}

/* Gauge bars */
.gauge-def{ animation:defGrow 1.2s cubic-bezier(.22,1,.36,1) both; width:var(--dw) }
.gauge-exc{ animation:excGrow 1.2s cubic-bezier(.22,1,.36,1) both; width:var(--ew) }
.gauge-ok { animation:okGrow  1.2s cubic-bezier(.22,1,.36,1) both; width:var(--ow) }

/* Alert pulse */
.alert-dot { animation: pulse2 1.9s ease-in-out infinite }

/* Test list row */
.test-row { transition: all .2s cubic-bezier(.22,1,.36,1) }
.test-row:hover { transform: translateX(3px) }

/* Toggle pill */
.toggle-pill { transition: all .25s cubic-bezier(.34,1.56,.64,1) }

/* Skeleton shimmer */
.skeleton {
  background: linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);
  background-size:700px 100%;
  animation: shimmer 1.5s infinite;
  border-radius:10px;
}

/* Gradient header */
.hero-soil {
  background: linear-gradient(135deg, #064e3b 0%, #065f46 40%, #047857 70%, #059669 100%);
  background-size: 300% 300%;
  animation: gradShift 8s ease infinite;
}
.hero-water {
  background: linear-gradient(135deg, #1e3a5f 0%, #1e40af 40%, #1d4ed8 70%, #2563eb 100%);
  background-size: 300% 300%;
  animation: gradShift 8s ease infinite;
}

/* Glassmorphism panel */
.glass-card {
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.7);
}

/* Floating icon */
.float-icon { animation: floatUp 3s ease-in-out infinite }

/* Hover lift on param cards */
.param-card { transition: transform .2s ease, box-shadow .2s ease }
.param-card:hover { transform:translateY(-4px) scale(1.02); box-shadow:0 14px 36px rgba(0,0,0,.10) }

/* Ripple for water */
.ripple {
  position:absolute; border-radius:50%;
  border: 2px solid rgba(59,130,246,.4);
  animation: waterRipple 2s ease-out infinite;
  pointer-events:none;
}

/* Count badge animate */
.count-badge { animation: countUp .4s cubic-bezier(.22,1,.36,1) both }

/* Scrollbar */
.thin-scroll::-webkit-scrollbar { width:4px }
.thin-scroll::-webkit-scrollbar-track { background:transparent }
.thin-scroll::-webkit-scrollbar-thumb { background:#d1d5db; border-radius:4px }
`;

/* ══════════════════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════════════════ */
type TestMode = 'soil' | 'water';
interface Field { id: string; name: string }

interface SoilTest {
  id: string; fieldId: string; fieldName: string; testDate: string;
  soilPh: number|null; nitrogen: number|null; phosphorus: number|null;
  potassium: number|null; organicMatter: number|null; ec: number|null;
  calcium: number|null; magnesium: number|null; sulfur: number|null;
  iron: number|null; manganese: number|null; zinc: number|null;
  copper: number|null; boron: number|null;
  labName: string; recommendations: string; notes: string;
}

interface WaterTest {
  id: string; fieldId: string; fieldName: string; testDate: string;
  waterPh: number|null; ec: number|null; tds: number|null;
  co3: number|null; hco3: number|null; cl: number|null;
  na: number|null; ca: number|null; mg: number|null;
  sar: number|null; rsc: number|null; boron: number|null;
  no3n: number|null; so4: number|null;
  sampleSource: string; suitability: string; waterClass: string;
  labName: string; recommendations: string; notes: string;
}

interface Range { low: number; high: number; unit: string; label: string }

const SOIL_PARAMS: Record<string, Range> = {
  soilPh:        { low:6.0,  high:7.5,   unit:'',      label:'pH'             },
  ec:            { low:0.2,  high:0.8,   unit:'dS/m',  label:'EC'             },
  organicMatter: { low:2.0,  high:4.0,   unit:'%',     label:'Organic Matter' },
  nitrogen:      { low:20,   high:40,    unit:'kg/ha', label:'Nitrogen (N)'   },
  phosphorus:    { low:15,   high:30,    unit:'kg/ha', label:'Phosphorus (P)' },
  potassium:     { low:150,  high:300,   unit:'kg/ha', label:'Potassium (K)'  },
  calcium:       { low:500,  high:2000,  unit:'mg/kg', label:'Calcium (Ca)'   },
  magnesium:     { low:60,   high:300,   unit:'mg/kg', label:'Magnesium (Mg)' },
  sulfur:        { low:10,   high:50,    unit:'mg/kg', label:'Sulfur (S)'     },
  iron:          { low:4,    high:20,    unit:'mg/kg', label:'Iron (Fe)'      },
  manganese:     { low:2,    high:10,    unit:'mg/kg', label:'Manganese (Mn)' },
  zinc:          { low:1,    high:5,     unit:'mg/kg', label:'Zinc (Zn)'      },
  copper:        { low:0.5,  high:3,     unit:'mg/kg', label:'Copper (Cu)'    },
  boron:         { low:0.5,  high:2,     unit:'mg/kg', label:'Boron (B)'      },
};

const WATER_PARAMS: Record<string, Range> = {
  waterPh: { low:6.5,  high:8.5,   unit:'',       label:'pH'        },
  ec:      { low:0,    high:0.75,  unit:'dS/m',   label:'EC'        },
  tds:     { low:0,    high:500,   unit:'mg/L',   label:'TDS'       },
  co3:     { low:0,    high:5,     unit:'meq/L',  label:'CO₃'       },
  hco3:    { low:1,    high:5,     unit:'meq/L',  label:'HCO₃'      },
  cl:      { low:0,    high:4,     unit:'meq/L',  label:'Cl⁻'       },
  na:      { low:0,    high:3,     unit:'meq/L',  label:'Na⁺'       },
  ca:      { low:1,    high:8,     unit:'meq/L',  label:'Ca²⁺'      },
  mg:      { low:0.5,  high:5,     unit:'meq/L',  label:'Mg²⁺'      },
  sar:     { low:0,    high:10,    unit:'',        label:'SAR'       },
  rsc:     { low:0,    high:2.5,   unit:'meq/L',  label:'RSC'       },
  boron:   { low:0,    high:0.7,   unit:'mg/L',   label:'Boron (B)' },
  no3n:    { low:0,    high:10,    unit:'mg/L',   label:'NO₃-N'     },
  so4:     { low:0,    high:200,   unit:'mg/L',   label:'SO₄²⁻'     },
};

type ParamStatus = 'optimal'|'deficient'|'excess'|'unknown';

function getStatus(v: number|null, r: Range): ParamStatus {
  if (v === null || v === undefined) return 'unknown';
  if (v < r.low)  return 'deficient';
  if (v > r.high) return 'excess';
  return 'optimal';
}
function okPct(v:number, r:Range)  { const s=r.high-r.low; if(s<=0) return 100; return ((Math.max(r.low,Math.min(r.high,v))-r.low)/s)*100 }
function defPct(v:number, r:Range) { if(v>=r.low) return 0; return Math.min(100,((r.low-v)/(r.low||1))*100) }
function excPct(v:number, r:Range) { if(v<=r.high) return 0; return Math.min(100,((v-r.high)/(r.high||1))*100) }

/* ══════════════════════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════════════════════ */
const EMPTY_SOIL: Record<string,string> = {
  fieldId:'', testDate:'',
  soilPh:'', nitrogen:'', phosphorus:'', potassium:'',
  organicMatter:'', ec:'', calcium:'', magnesium:'', sulfur:'',
  iron:'', manganese:'', zinc:'', copper:'', boron:'',
  labName:'', recommendations:'', notes:'',
};
const EMPTY_WATER: Record<string,string> = {
  fieldId:'', testDate:'',
  waterPh:'', ec:'', tds:'', co3:'', hco3:'', cl:'',
  na:'', ca:'', mg:'', sar:'', rsc:'', boron:'', no3n:'', so4:'',
  sampleSource:'', suitability:'', waterClass:'',
  labName:'', recommendations:'', notes:'',
};

const SUITABILITY   = ['Excellent','Good','Marginal','Unsuitable'];
const SAMPLE_SOURCE = ['Tubewell','Canal','Rain','Pond','Spring','Tap','Other'];

const inputCls = 'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-white/90 transition-all duration-200 placeholder-gray-300';
const inputClsBlue = 'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white/90 transition-all duration-200 placeholder-gray-300';
const fmt = (d:string) => new Date(d).toLocaleDateString('en-US',{dateStyle:'medium'});
const n   = (v:string) => v ? parseFloat(v) : null;

/* ══════════════════════════════════════════════════════════════════════════
   GAUGE ROW — animated
══════════════════════════════════════════════════════════════════════════ */
const GaugeRow: React.FC<{label:string; value:number|null; unit:string; range:Range; delay:number; accent?:'green'|'blue'}> = ({label,value,unit,range,delay,accent='green'}) => {
  const status = getStatus(value, range);
  const [vis, setVis] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e])=>{ if(e.isIntersecting) setVis(true); },{threshold:0.1});
    if(ref.current) obs.observe(ref.current);
    return ()=>obs.disconnect();
  },[]);

  const dw = value!==null ? `${defPct(value,range).toFixed(1)}%` : '0%';
  const ew = value!==null ? `${excPct(value,range).toFixed(1)}%` : '0%';
  const ow = value!==null ? `${okPct(value,range).toFixed(1)}%`  : '0%';

  const meta = {
    optimal:   { bg:'bg-gradient-to-r from-emerald-50 to-green-50',   border:'border-emerald-200', badge:'bg-emerald-100 text-emerald-700', val:'text-emerald-600', icon:<Minus className="w-3 h-3"/>,    txt:'Optimal'   },
    deficient: { bg:'bg-gradient-to-r from-red-50 to-rose-50',         border:'border-red-200',     badge:'bg-red-100 text-red-700',         val:'text-red-600',     icon:<ArrowDown className="w-3 h-3"/>, txt:'Deficient' },
    excess:    { bg:'bg-gradient-to-r from-orange-50 to-amber-50',     border:'border-orange-200',  badge:'bg-orange-100 text-orange-700',   val:'text-orange-600',  icon:<ArrowUp className="w-3 h-3"/>,   txt:'Excess'    },
    unknown:   { bg:'bg-gray-50',                                        border:'border-gray-200',    badge:'bg-gray-100 text-gray-400',       val:'text-gray-400',    icon:null,                             txt:'No data'   },
  }[status];

  const okColor = accent==='blue' ? 'bg-gradient-to-r from-blue-400 to-blue-600' : 'bg-gradient-to-r from-emerald-400 to-emerald-600';

  return (
    <div ref={ref} className={`param-card a-fade-up rounded-2xl border ${meta.border} ${meta.bg} p-4 shadow-sm`} style={{animationDelay:`${delay*0.055}s`}}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {(status==='deficient'||status==='excess') && <span className="alert-dot w-2 h-2 rounded-full" style={{background:status==='deficient'?'#ef4444':'#f97316'}}/>}
          <span className="text-sm font-semibold text-gray-800">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {value!==null
            ? <span className={`text-sm font-bold ${meta.val}`}>{value}<span className="text-[10px] font-normal text-gray-400 ml-0.5">{unit}</span></span>
            : <span className="text-xs text-gray-300 italic">—</span>}
          <span className={`flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.badge}`}>
            {meta.icon}{meta.txt}
          </span>
        </div>
      </div>
      {value!==null ? (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1 h-5">
            <div className="flex-1 flex justify-end h-3 bg-gray-100 rounded-l-full overflow-hidden">
              {vis && status==='deficient' && <div className="gauge-def h-full rounded-full bg-gradient-to-l from-red-500 to-red-300" style={{'--dw':dw} as React.CSSProperties}/>}
            </div>
            <div className="w-24 h-3 bg-gray-100 rounded-sm overflow-hidden mx-0.5 relative shrink-0">
              {vis && <div className={`gauge-ok h-full rounded-full ${okColor}`} style={{'--ow':status==='optimal'?ow:(status==='deficient'?'0%':'100%')} as React.CSSProperties}/>}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[8px] font-bold text-white drop-shadow">OPTIMAL</span>
              </div>
            </div>
            <div className="flex-1 flex justify-start h-3 bg-gray-100 rounded-r-full overflow-hidden">
              {vis && status==='excess' && <div className="gauge-exc h-full rounded-full bg-gradient-to-r from-orange-300 to-orange-500" style={{'--ew':ew} as React.CSSProperties}/>}
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 px-1">
            <span>↓ &lt;{range.low}{unit}</span>
            <span>{range.high}{unit}&gt; ↑</span>
          </div>
        </div>
      ) : (
        <div className="skeleton h-3 w-full opacity-50"/>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   NUTRIENT PANEL
══════════════════════════════════════════════════════════════════════════ */
const NutrientPanel: React.FC<{tests:Record<string,number|null>; params:Record<string,Range>; accent?:'green'|'blue'}> = ({tests,params,accent='green'}) => {
  const entries = Object.entries(params).filter(([k])=>tests[k]!==undefined);
  const def = entries.filter(([k])=>getStatus(tests[k],params[k])==='deficient');
  const exc = entries.filter(([k])=>getStatus(tests[k],params[k])==='excess');
  const opt = entries.filter(([k])=>getStatus(tests[k],params[k])==='optimal');
  const unk = entries.filter(([k])=>tests[k]===null||tests[k]===undefined);

  const summaryItems = [
    { count:opt.length, label:'Optimal',   bg:'bg-emerald-50',  border:'border-emerald-200', text:'text-emerald-700', dot:'bg-emerald-500' },
    { count:def.length, label:'Deficient', bg:'bg-red-50',      border:'border-red-200',     text:'text-red-700',     dot:'bg-red-500',    pulse:def.length>0 },
    { count:exc.length, label:'Excess',    bg:'bg-orange-50',   border:'border-orange-200',  text:'text-orange-700',  dot:'bg-orange-500', pulse:exc.length>0 },
    { count:unk.length, label:'No Data',   bg:'bg-gray-50',     border:'border-gray-200',    text:'text-gray-500',    dot:'bg-gray-300'    },
  ];

  return (
    <div className="space-y-5">
      {/* Summary strip */}
      <div className="a-scale-in grid grid-cols-4 gap-3">
        {summaryItems.map(({count,label,bg,border,text,dot,pulse})=>(
          <div key={label} className={`rounded-2xl border ${border} ${bg} p-4 text-center shadow-sm`}>
            <div className="flex justify-center mb-1.5">
              <span className={`w-2 h-2 rounded-full ${dot} ${pulse?'alert-dot':''}`}/>
            </div>
            <p className={`text-2xl font-extrabold count-badge ${text}`}>{count}</p>
            <p className="text-[11px] text-gray-500 mt-0.5 font-medium">{label}</p>
          </div>
        ))}
      </div>
      {/* Grouped gauges */}
      {[
        {list:def, title:'Deficient — Below Optimal Range', color:'text-red-600'},
        {list:exc, title:'Excess — Above Optimal Range',    color:'text-orange-600'},
        {list:opt, title:'Optimal Range',                   color:'text-emerald-600'},
        {list:unk, title:'No Data Entered',                 color:'text-gray-400'},
      ].map(({list,title,color})=>list.length>0&&(
        <div key={title}>
          <p className={`text-[11px] font-bold uppercase tracking-widest mb-3 ${color}`}>{title}</p>
          <div className="space-y-2">
            {list.map(([key,range],i)=>(
              <GaugeRow key={key} label={range.label} value={tests[key]??null} unit={range.unit} range={range} delay={i} accent={accent}/>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   SHARED SUB-COMPONENTS
══════════════════════════════════════════════════════════════════════════ */
const SectionLabel: React.FC<{children:React.ReactNode; accent?:'green'|'blue'}> = ({children,accent='green'})=>(
  <div className="flex items-center gap-2 mt-1 mb-3">
    <div className={`h-px flex-1 ${accent==='blue'?'bg-blue-100':'bg-emerald-100'}`}/>
    <p className={`text-[11px] font-bold uppercase tracking-widest ${accent==='blue'?'text-blue-400':'text-emerald-500'} whitespace-nowrap`}>{children}</p>
    <div className={`h-px flex-1 ${accent==='blue'?'bg-blue-100':'bg-emerald-100'}`}/>
  </div>
);

const NumInput: React.FC<{label:string; value:string; step?:string; placeholder?:string; accent?:'green'|'blue'; onChange:(v:string)=>void}> = ({label,value,step='0.01',placeholder='',accent='green',onChange})=>(
  <div className="group">
    <label className="block text-[11px] font-semibold text-gray-500 mb-1.5 group-focus-within:text-emerald-600 transition-colors">{label}</label>
    <input type="number" step={step} min="0" placeholder={placeholder} value={value}
      onChange={e=>onChange(e.target.value)}
      className={accent==='blue'?inputClsBlue:inputCls}/>
  </div>
);

const FieldSelect: React.FC<{fields:Field[]; value:string; accent?:'green'|'blue'; onChange:(v:string)=>void}> = ({fields,value,accent='green',onChange})=>(
  <div>
    <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
      <MapPin className="w-3 h-3"/> Field / Orchard
    </label>
    <select className={accent==='blue'?inputClsBlue:inputCls} value={value} onChange={e=>onChange(e.target.value)}>
      <option value="">Select a field (optional)</option>
      {fields.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}
    </select>
  </div>
);

const EmptyDetail: React.FC<{label?:string; accent?:'green'|'blue'}> = ({label='Select a test to view details',accent='green'})=>(
  <div className="a-fade-up flex flex-col items-center justify-center py-20 text-center bg-white border-2 border-dashed border-gray-200 rounded-2xl">
    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${accent==='blue'?'bg-blue-50':'bg-emerald-50'}`}>
      <FileText className={`w-8 h-8 ${accent==='blue'?'text-blue-200':'text-emerald-200'}`}/>
    </div>
    <p className="text-sm text-gray-400 font-medium">{label}</p>
    <p className="text-xs text-gray-300 mt-1">Click a test on the left to begin</p>
  </div>
);

const EmptyList: React.FC<{label:string; onAdd:()=>void; accent?:'green'|'blue'}> = ({label,onAdd,accent='green'})=>(
  <div className="text-center py-10">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 ${accent==='blue'?'bg-blue-50':'bg-emerald-50'}`}>
      <FileText className={`w-7 h-7 ${accent==='blue'?'text-blue-200':'text-emerald-200'}`}/>
    </div>
    <p className="text-sm text-gray-400 mb-4">{label}</p>
    <button
      onClick={onAdd}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-105 active:scale-95 shadow-md ${accent==='blue'?'bg-blue-500 hover:bg-blue-600 shadow-blue-200':'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200'}`}
    >
      <Plus className="w-4 h-4"/>Add First Test
    </button>
  </div>
);

const RowActions: React.FC<{onEdit:()=>void; onDelete:()=>void; accent?:'green'|'blue'}> = ({onEdit,onDelete,accent='green'})=>(
  <div className="flex gap-1 ml-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
    <button onClick={e=>{e.stopPropagation();onEdit();}} className={`p-1.5 rounded-lg transition-all hover:scale-110 ${accent==='blue'?'text-blue-500 hover:bg-blue-50':'text-emerald-600 hover:bg-emerald-50'}`}><Edit className="w-3.5 h-3.5"/></button>
    <button onClick={e=>{e.stopPropagation();onDelete();}} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-all hover:scale-110"><Trash2 className="w-3.5 h-3.5"/></button>
  </div>
);

const suitBadge=(s:string)=>{
  if(s==='Excellent') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if(s==='Good')      return 'bg-blue-100    text-blue-700    border-blue-200';
  if(s==='Marginal')  return 'bg-amber-100   text-amber-700   border-amber-200';
  if(s==='Unsuitable')return 'bg-red-100     text-red-700     border-red-200';
  return 'bg-gray-100 text-gray-400 border-gray-200';
};

const RecsBlock: React.FC<{recs:string[]; accent?:'green'|'blue'}> = ({recs,accent='green'})=>(
  <div className={`rounded-2xl p-4 mb-4 border ${accent==='blue'?'bg-blue-50 border-blue-100':'bg-emerald-50 border-emerald-100'}`}>
    <p className={`text-[11px] font-bold uppercase tracking-widest mb-3 ${accent==='blue'?'text-blue-600':'text-emerald-600'}`}>AI Recommendations</p>
    <ul className="space-y-2.5">
      {recs.map((r,i)=>(
        <li key={i} className="a-slide-r flex items-start gap-2.5" style={{animationDelay:`${i*0.07}s`}}>
          <CheckCircle className={`w-4 h-4 mt-0.5 shrink-0 ${accent==='blue'?'text-blue-500':'text-emerald-500'}`}/>
          <span className={`text-sm ${accent==='blue'?'text-blue-900':'text-emerald-900'}`}>{r}</span>
        </li>
      ))}
    </ul>
  </div>
);

const TextAreas: React.FC<{rec:string; notes:string; accent?:'green'|'blue'; onRec:(v:string)=>void; onNotes:(v:string)=>void}> = ({rec,notes,accent='green',onRec,onNotes})=>(
  <div className="grid gap-4">
    <div>
      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Lab Recommendations</label>
      <textarea rows={3} className={accent==='blue'?inputClsBlue:inputCls} placeholder="Lab recommendations…" value={rec} onChange={e=>onRec(e.target.value)}/>
    </div>
    <div>
      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Notes</label>
      <textarea rows={2} className={accent==='blue'?inputClsBlue:inputCls} placeholder="Additional observations…" value={notes} onChange={e=>onNotes(e.target.value)}/>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════════════════
   ANIMATED STAT HERO — shown in detail card header
══════════════════════════════════════════════════════════════════════════ */
const StatPill: React.FC<{label:string; value:string|null; accent?:'green'|'blue'}> = ({label,value,accent='green'})=>(
  <div className={`rounded-xl px-3 py-2 text-center border ${accent==='blue'?'bg-blue-50 border-blue-100':'bg-emerald-50 border-emerald-100'}`}>
    <p className={`text-xs font-bold ${accent==='blue'?'text-blue-600':'text-emerald-600'}`}>{value??'—'}</p>
    <p className="text-[10px] text-gray-400 font-medium mt-0.5">{label}</p>
  </div>
);

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════ */
const SoilTestAdvisory: React.FC = () => {
  const { session } = useAuth();

  const [mode,    setMode]    = useState<TestMode>('soil');
  const [fields,  setFields]  = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string|null>(null);

  /* ── Soil state ── */
  const [soilTests,  setSoilTests]  = useState<SoilTest[]>([]);
  const [selSoil,    setSelSoil]    = useState<SoilTest|null>(null);
  const [soilMode,   setSoilMode]   = useState<'view'|'create'|'edit'>('view');
  const [soilForm,   setSoilForm]   = useState(EMPTY_SOIL);
  const [soilView,   setSoilView]   = useState<'gauges'|'detail'>('gauges');

  /* ── Water state ── */
  const [waterTests, setWaterTests] = useState<WaterTest[]>([]);
  const [selWater,   setSelWater]   = useState<WaterTest|null>(null);
  const [waterMode,  setWaterMode]  = useState<'view'|'create'|'edit'>('view');
  const [waterForm,  setWaterForm]  = useState(EMPTY_WATER);
  const [waterView,  setWaterView]  = useState<'gauges'|'detail'>('gauges');

  useEffect(()=>{ if(session?.user) loadData(); },[session?.user]);

  const loadData = async () => {
    if(!session?.user) return;
    setLoading(true); setError(null);
    try {
      const [{data:fData,error:fErr},{data:sData,error:sErr},{data:wData,error:wErr}] = await Promise.all([
        supabase.from('fields').select('id,name').eq('user_id',session.user.id).order('name'),
        supabase.from('soil_test_results').select('*,fields!inner(name)').eq('user_id',session.user.id).order('test_date',{ascending:false}),
        supabase.from('water_test_results').select('*,fields(name)').eq('user_id',session.user.id).order('test_date',{ascending:false}),
      ]);
      if(fErr) throw fErr;
      if(sErr) throw sErr;
      if(wErr && !(wErr.code==='42P01'||wErr.message?.includes('does not exist'))) throw wErr;

      setFields(fData||[]);
      setSoilTests((sData||[]).map((r:any)=>({
        id:r.id, fieldId:r.field_id, fieldName:r.fields?.name??'—', testDate:r.test_date,
        soilPh:r.soil_ph, nitrogen:r.nitrogen, phosphorus:r.phosphorus, potassium:r.potassium,
        organicMatter:r.organic_matter, ec:r.ec, calcium:r.calcium, magnesium:r.magnesium,
        sulfur:r.sulfur, iron:r.iron, manganese:r.manganese, zinc:r.zinc, copper:r.copper,
        boron:r.boron, labName:r.lab_name||'', recommendations:r.recommendations||'', notes:r.notes||'',
      })));
      setWaterTests((wData||[]).map((r:any)=>({
        id:r.id, fieldId:r.field_id, fieldName:r.fields?.name??'—', testDate:r.test_date,
        waterPh:r.water_ph, ec:r.ec, tds:r.tds, co3:r.co3, hco3:r.hco3, cl:r.cl,
        na:r.na, ca:r.ca, mg:r.mg, sar:r.sar, rsc:r.rsc, boron:r.boron, no3n:r.no3n, so4:r.so4,
        sampleSource:r.sample_source||'', suitability:r.suitability||'', waterClass:r.water_class||'',
        labName:r.lab_name||'', recommendations:r.recommendations||'', notes:r.notes||'',
      })));
    } catch(err){ setError(err instanceof Error?err.message:'Failed to load data'); }
    finally{ setLoading(false); }
  };

  /* ── Soil CRUD ── */
  const soilToForm = (t:SoilTest) => ({
    fieldId:t.fieldId, testDate:t.testDate,
    soilPh:t.soilPh?.toString()||'', nitrogen:t.nitrogen?.toString()||'',
    phosphorus:t.phosphorus?.toString()||'', potassium:t.potassium?.toString()||'',
    organicMatter:t.organicMatter?.toString()||'', ec:t.ec?.toString()||'',
    calcium:t.calcium?.toString()||'', magnesium:t.magnesium?.toString()||'',
    sulfur:t.sulfur?.toString()||'', iron:t.iron?.toString()||'',
    manganese:t.manganese?.toString()||'', zinc:t.zinc?.toString()||'',
    copper:t.copper?.toString()||'', boron:t.boron?.toString()||'',
    labName:t.labName, recommendations:t.recommendations, notes:t.notes,
  });

  const saveSoil = async () => {
    if(!session?.user) return;
    if(!soilForm.testDate){ setError('Test Date is required.'); return; }
    setSaving(true); setError(null);
    try {
      const p = {
        user_id:session.user.id, test_date:soilForm.testDate, field_id:soilForm.fieldId||null,
        soil_ph:n(soilForm.soilPh), nitrogen:n(soilForm.nitrogen), phosphorus:n(soilForm.phosphorus),
        potassium:n(soilForm.potassium), organic_matter:n(soilForm.organicMatter), ec:n(soilForm.ec),
        calcium:n(soilForm.calcium), magnesium:n(soilForm.magnesium), sulfur:n(soilForm.sulfur),
        iron:n(soilForm.iron), manganese:n(soilForm.manganese), zinc:n(soilForm.zinc),
        copper:n(soilForm.copper), boron:n(soilForm.boron),
        lab_name:soilForm.labName, recommendations:soilForm.recommendations, notes:soilForm.notes,
      };
      if(soilMode==='create'){ const {error}=await supabase.from('soil_test_results').insert([p]); if(error) throw error; }
      else if(selSoil){ const {error}=await supabase.from('soil_test_results').update(p).eq('id',selSoil.id).eq('user_id',session.user.id); if(error) throw error; }
      await loadData(); setSoilMode('view'); setSelSoil(null); setSoilForm(EMPTY_SOIL);
    } catch(err){ setError(err instanceof Error?err.message:'Failed to save'); }
    finally{ setSaving(false); }
  };

  const deleteSoil = async (t:SoilTest) => {
    if(!session?.user||!confirm('Delete this soil test?')) return;
    const {error}=await supabase.from('soil_test_results').delete().eq('id',t.id).eq('user_id',session.user.id);
    if(error){ setError(error.message); return; }
    await loadData();
    if(selSoil?.id===t.id){ setSelSoil(null); setSoilMode('view'); }
  };

  /* ── Water CRUD ── */
  const waterToForm = (t:WaterTest) => ({
    fieldId:t.fieldId, testDate:t.testDate,
    waterPh:t.waterPh?.toString()||'', ec:t.ec?.toString()||'', tds:t.tds?.toString()||'',
    co3:t.co3?.toString()||'', hco3:t.hco3?.toString()||'', cl:t.cl?.toString()||'',
    na:t.na?.toString()||'', ca:t.ca?.toString()||'', mg:t.mg?.toString()||'',
    sar:t.sar?.toString()||'', rsc:t.rsc?.toString()||'', boron:t.boron?.toString()||'',
    no3n:t.no3n?.toString()||'', so4:t.so4?.toString()||'',
    sampleSource:t.sampleSource, suitability:t.suitability, waterClass:t.waterClass,
    labName:t.labName, recommendations:t.recommendations, notes:t.notes,
  });

  const saveWater = async () => {
    if(!session?.user) return;
    if(!waterForm.testDate){ setError('Test Date is required.'); return; }
    setSaving(true); setError(null);
    try {
      const p = {
        user_id:session.user.id, test_date:waterForm.testDate, field_id:waterForm.fieldId||null,
        water_ph:n(waterForm.waterPh), ec:n(waterForm.ec), tds:n(waterForm.tds),
        co3:n(waterForm.co3), hco3:n(waterForm.hco3), cl:n(waterForm.cl),
        na:n(waterForm.na), ca:n(waterForm.ca), mg:n(waterForm.mg),
        sar:n(waterForm.sar), rsc:n(waterForm.rsc), boron:n(waterForm.boron),
        no3n:n(waterForm.no3n), so4:n(waterForm.so4),
        sample_source:waterForm.sampleSource||null, suitability:waterForm.suitability||null,
        water_class:waterForm.waterClass||null,
        lab_name:waterForm.labName, recommendations:waterForm.recommendations, notes:waterForm.notes,
      };
      if(waterMode==='create'){ const {error}=await supabase.from('water_test_results').insert([p]); if(error) throw error; }
      else if(selWater){ const {error}=await supabase.from('water_test_results').update(p).eq('id',selWater.id).eq('user_id',session.user.id); if(error) throw error; }
      await loadData(); setWaterMode('view'); setSelWater(null); setWaterForm(EMPTY_WATER);
    } catch(err){ setError(err instanceof Error?err.message:'Failed to save'); }
    finally{ setSaving(false); }
  };

  const deleteWater = async (t:WaterTest) => {
    if(!session?.user||!confirm('Delete this water test?')) return;
    const {error}=await supabase.from('water_test_results').delete().eq('id',t.id).eq('user_id',session.user.id);
    if(error){ setError(error.message); return; }
    await loadData();
    if(selWater?.id===t.id){ setSelWater(null); setWaterMode('view'); }
  };

  /* ── Auto-recs ── */
  const soilRecs = (t:SoilTest) => {
    const r:string[]=[];
    if(t.soilPh!==null){ if(t.soilPh<6) r.push('Soil is acidic — apply lime to raise pH to 6.5–7.0.'); else if(t.soilPh>7.5) r.push('Soil is alkaline — apply sulfur or organic matter to lower pH.'); }
    if(t.nitrogen!==null&&t.nitrogen<20)   r.push('Nitrogen is low — apply urea or compost.');
    if(t.phosphorus!==null&&t.phosphorus<15) r.push('Phosphorus is low — apply DAP or superphosphate.');
    if(t.potassium!==null&&t.potassium<150)  r.push('Potassium is low — apply MOP or SOP.');
    if(t.organicMatter!==null&&t.organicMatter<2) r.push('Organic matter is low — add FYM or green manure.');
    if(r.length===0) r.push('All parameters within acceptable ranges. Continue current practices.');
    return r;
  };

  const waterRecs = (t:WaterTest) => {
    const r:string[]=[];
    if(t.waterPh!==null){ if(t.waterPh<6.5) r.push('Water is acidic (pH<6.5) — may harm root systems.'); else if(t.waterPh>8.5) r.push('Water is alkaline (pH>8.5) — consider acidification.'); }
    if(t.ec!==null&&t.ec>0.75) r.push(`EC ${t.ec} dS/m — elevated salinity. Restrict use on salt-sensitive crops.`);
    if(t.ec!==null&&t.ec>3)    r.push('Severe salinity (EC>3) — not suitable without treatment.');
    if(t.sar!==null&&t.sar>10) r.push('SAR>10 — high sodium hazard, may degrade soil structure.');
    if(t.rsc!==null&&t.rsc>2.5) r.push('RSC>2.5 meq/L — unsuitable without gypsum amendment.');
    if(t.boron!==null&&t.boron>0.7) r.push('Boron>0.7 mg/L — toxic for apple/cherry trees.');
    if(t.no3n!==null&&t.no3n>10)   r.push('NO₃-N>10 mg/L — excess nitrogen, monitor vegetative growth.');
    if(r.length===0) r.push('Water quality is within safe limits for orchard irrigation.');
    return r;
  };

  const soilParamMap = (t:SoilTest): Record<string,number|null> => ({
    soilPh:t.soilPh, ec:t.ec, organicMatter:t.organicMatter,
    nitrogen:t.nitrogen, phosphorus:t.phosphorus, potassium:t.potassium,
    calcium:t.calcium, magnesium:t.magnesium, sulfur:t.sulfur,
    iron:t.iron, manganese:t.manganese, zinc:t.zinc, copper:t.copper, boron:t.boron,
  });

  const waterParamMap = (t:WaterTest): Record<string,number|null> => ({
    waterPh:t.waterPh, ec:t.ec, tds:t.tds, co3:t.co3, hco3:t.hco3, cl:t.cl,
    na:t.na, ca:t.ca, mg:t.mg, sar:t.sar, rsc:t.rsc, boron:t.boron, no3n:t.no3n, so4:t.so4,
  });

  /* ── Loading state ── */
  if(loading) return (
    <div className="flex items-center justify-center min-h-96">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="w-16 h-16 border-4 border-emerald-100 rounded-full"/>
          <div className="absolute inset-0 w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full" style={{animation:'spin360 0.9s linear infinite'}}/>
          <Leaf className="absolute inset-0 m-auto w-6 h-6 text-emerald-500 float-icon"/>
        </div>
        <p className="text-sm font-medium text-gray-500">Loading advisory data…</p>
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════ */
  return (
    <>
      <style>{STYLES}</style>
      <div className="space-y-6 pb-12">

        {/* ══ HERO HEADER ══ */}
        <div className={`a-fade-up d0 relative overflow-hidden rounded-3xl p-6 md:p-8 ${mode==='soil'?'hero-soil':'hero-water'}`}>
          {/* Decorative blobs */}
          <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full bg-white/5"/>
          <div className="absolute bottom-0 left-1/3 w-72 h-36 rounded-full bg-white/5"/>

          {/* Floating icon cluster */}
          <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-3 opacity-20">
            {mode==='soil'
              ? <><FlaskConical className="w-20 h-20 float-icon text-white" style={{animationDelay:'.3s'}}/><Leaf className="w-10 h-10 float-icon text-white" style={{animationDelay:'.7s'}}/></>
              : <><Droplets className="w-20 h-20 float-icon text-white" style={{animationDelay:'.3s'}}/><Waves className="w-10 h-10 float-icon text-white" style={{animationDelay:'.7s'}}/></>
            }
          </div>

          <div className="relative flex flex-wrap items-center justify-between gap-5">
            {/* Left: title + mode info */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white/60 text-xs font-semibold uppercase tracking-widest">
                  {mode==='soil'?'Soil Analysis':'Water Analysis'}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-1">Soil Test Advisory</h1>
              <p className="text-white/70 text-sm">Monitor nutrients · Detect deficiencies &amp; excesses</p>

              {/* Quick stats */}
              <div className="flex items-center gap-3 mt-4">
                <div className="flex items-center gap-1.5 bg-white/15 rounded-xl px-3 py-1.5">
                  <FlaskConical className="w-3.5 h-3.5 text-white/80"/>
                  <span className="text-white text-xs font-bold">{soilTests.length} Soil</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/15 rounded-xl px-3 py-1.5">
                  <Droplets className="w-3.5 h-3.5 text-white/80"/>
                  <span className="text-white text-xs font-bold">{waterTests.length} Water</span>
                </div>
              </div>
            </div>

            {/* Right: toggle + add button */}
            <div className="flex items-center gap-3">
              {/* Tab toggle */}
              <div className="flex items-center bg-white/15 backdrop-blur-sm rounded-2xl p-1.5 gap-1 border border-white/20">
                {([
                  {id:'soil'  as TestMode, Icon:FlaskConical, label:'Soil'},
                  {id:'water' as TestMode, Icon:Droplets,     label:'Water'},
                ]).map(({id,Icon,label})=>(
                  <button
                    key={id}
                    onClick={()=>{
                      setMode(id);
                      if(id==='soil') setWaterMode('view');
                      else setSoilMode('view');
                    }}
                    className={`toggle-pill flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold select-none ${
                      mode===id ? 'bg-white text-gray-800 shadow-lg' : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4"/>{label}
                  </button>
                ))}
              </div>

              {/* Add button — DEDICATED per mode, no closure ambiguity */}
              {mode==='soil' && (
                <button
                  onClick={()=>{ setSoilMode('create'); setSelSoil(null); setSoilForm(EMPTY_SOIL); }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white text-emerald-700 rounded-xl text-sm font-bold shadow-lg hover:bg-emerald-50 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <Plus className="w-4 h-4"/>Add Soil Test
                </button>
              )}
              {mode==='water' && (
                <button
                  onClick={()=>{ setWaterMode('create'); setSelWater(null); setWaterForm(EMPTY_WATER); }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white text-blue-700 rounded-xl text-sm font-bold shadow-lg hover:bg-blue-50 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <Plus className="w-4 h-4"/>Add Water Test
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="a-fade-dn flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0"/>
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={()=>setError(null)} className="ml-auto text-red-400 hover:text-red-600"><X className="w-4 h-4"/></button>
          </div>
        )}

        {/* ═══════════════════ SOIL PANEL ═══════════════════ */}
        {mode==='soil' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Left list ── */}
            <div className="lg:col-span-1 a-scale-in d1">
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                {/* Panel header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 bg-gradient-to-r from-emerald-50 to-green-50">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <FlaskConical className="w-3.5 h-3.5 text-emerald-600"/>
                    </div>
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-widest">Soil Tests</p>
                  </div>
                  {soilTests.length>0 && (
                    <button
                      onClick={()=>{ setSoilMode('create'); setSelSoil(null); setSoilForm(EMPTY_SOIL); }}
                      className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-white border border-emerald-200 rounded-lg px-2.5 py-1 transition-all hover:scale-105"
                    >
                      <Plus className="w-3 h-3"/>Add
                    </button>
                  )}
                </div>

                <div className="p-4">
                  {soilTests.length===0
                    ? <EmptyList label="No soil tests recorded yet" onAdd={()=>{ setSoilMode('create'); setSelSoil(null); setSoilForm(EMPTY_SOIL); }} accent="green"/>
                    : (
                      <div className="space-y-2 max-h-[calc(100vh-340px)] overflow-y-auto thin-scroll">
                        {soilTests.map((t,i)=>{
                          const ph=t.soilPh;
                          const phOk=ph!==null&&ph>=6&&ph<=7.5;
                          return (
                            <div
                              key={t.id}
                              className={`group test-row cursor-pointer rounded-xl border-2 p-3.5 ${
                                selSoil?.id===t.id
                                  ? 'border-emerald-400 bg-emerald-50 shadow-md shadow-emerald-100'
                                  : 'border-gray-100 bg-white hover:border-emerald-200 hover:shadow-sm'
                              } a-scale-in`}
                              style={{animationDelay:`${i*0.055}s`}}
                              onClick={()=>{ setSelSoil(t); setSoilMode('view'); }}
                            >
                              <div className="flex items-start justify-between">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-gray-900 text-sm truncate">{t.fieldName}</h3>
                                    {selSoil?.id===t.id && <ChevronRight className="w-3.5 h-3.5 text-emerald-500 shrink-0"/>}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                                    <Calendar className="w-3 h-3"/>
                                    <span>{fmt(t.testDate)}</span>
                                    {t.labName && <><span>·</span><Building2 className="w-3 h-3"/><span className="truncate">{t.labName}</span></>}
                                  </div>
                                  {ph!==null && (
                                    <div className="flex items-center gap-1.5 mt-2">
                                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${phOk?'bg-emerald-100 text-emerald-700 border-emerald-200':'bg-red-100 text-red-700 border-red-200'}`}>
                                        pH {ph}
                                      </span>
                                      {!phOk && <span className="alert-dot w-1.5 h-1.5 rounded-full bg-red-500"/>}
                                    </div>
                                  )}
                                </div>
                                <RowActions
                                  onEdit={()=>{ setSoilMode('edit'); setSelSoil(t); setSoilForm(soilToForm(t)); }}
                                  onDelete={()=>deleteSoil(t)}
                                  accent="green"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )
                  }
                </div>
              </div>
            </div>

            {/* ── Right panel ── */}
            <div className="lg:col-span-2 space-y-5">

              {/* ── SOIL FORM ── */}
              {(soilMode==='create'||soilMode==='edit') && (
                <div className="a-scale-in bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                  {/* Form header */}
                  <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-600 to-green-600">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                        <FlaskConical className="w-4 h-4 text-white"/>
                      </div>
                      <h2 className="text-sm font-bold text-white">{soilMode==='create'?'Add New Soil Test':'Edit Soil Test'}</h2>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={()=>{ setSoilMode('view'); setSelSoil(null); setSoilForm(EMPTY_SOIL); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg text-sm font-medium transition-all"
                      >
                        <X className="w-3.5 h-3.5"/>Cancel
                      </button>
                      <button
                        onClick={saveSoil}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-white text-emerald-700 rounded-lg text-sm font-bold shadow hover:bg-emerald-50 transition-all disabled:opacity-60"
                      >
                        <Save className="w-3.5 h-3.5"/>{saving?'Saving…':'Save Test'}
                      </button>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Basic info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FieldSelect fields={fields} value={soilForm.fieldId} onChange={v=>setSoilForm(f=>({...f,fieldId:v}))} accent="green"/>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3"/>Test Date *
                        </label>
                        <input type="date" required className={inputCls} value={soilForm.testDate} onChange={e=>setSoilForm(f=>({...f,testDate:e.target.value}))}/>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                          <Building2 className="w-3 h-3"/>Lab Name
                        </label>
                        <input type="text" className={inputCls} placeholder="Testing laboratory" value={soilForm.labName} onChange={e=>setSoilForm(f=>({...f,labName:e.target.value}))}/>
                      </div>
                    </div>

                    <SectionLabel accent="green">Macronutrients &amp; Basics</SectionLabel>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        {k:'soilPh',       l:'pH',                p:'6.5'},
                        {k:'ec',           l:'EC (dS/m)',         p:'0.5'},
                        {k:'organicMatter',l:'Organic Matter (%)',p:'3.0'},
                        {k:'nitrogen',     l:'Nitrogen (kg/ha)', p:'30'},
                        {k:'phosphorus',   l:'Phosphorus (kg/ha)',p:'20'},
                        {k:'potassium',    l:'Potassium (kg/ha)', p:'200'},
                      ].map(f=>(
                        <NumInput key={f.k} label={f.l} value={soilForm[f.k]} placeholder={f.p} accent="green" onChange={v=>setSoilForm(p=>({...p,[f.k]:v}))}/>
                      ))}
                    </div>

                    <SectionLabel accent="green">Micronutrients (mg/kg)</SectionLabel>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {['calcium','magnesium','sulfur','iron','manganese','zinc','copper','boron'].map(k=>(
                        <NumInput key={k} label={k.charAt(0).toUpperCase()+k.slice(1)} value={soilForm[k]} accent="green" onChange={v=>setSoilForm(p=>({...p,[k]:v}))}/>
                      ))}
                    </div>

                    <SectionLabel accent="green">Lab Notes &amp; Recommendations</SectionLabel>
                    <TextAreas rec={soilForm.recommendations} notes={soilForm.notes} accent="green"
                      onRec={v=>setSoilForm(f=>({...f,recommendations:v}))}
                      onNotes={v=>setSoilForm(f=>({...f,notes:v}))}
                    />
                  </div>
                </div>
              )}

              {/* ── SOIL DETAIL ── */}
              {selSoil && soilMode==='view' && (
                <div className="a-scale-in space-y-5">
                  <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                    {/* Detail header */}
                    <div className="bg-gradient-to-r from-emerald-600 to-green-600 p-5">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <h2 className="text-lg font-extrabold text-white">{selSoil.fieldName}</h2>
                          <div className="flex items-center gap-2 mt-1 text-white/70 text-xs">
                            <Calendar className="w-3 h-3"/>{fmt(selSoil.testDate)}
                            {selSoil.labName && <><span>·</span><Building2 className="w-3 h-3"/>{selSoil.labName}</>}
                          </div>
                          {/* Quick stat pills */}
                          <div className="flex flex-wrap gap-2 mt-3">
                            {selSoil.soilPh!==null && <StatPill label="Soil pH" value={String(selSoil.soilPh)} accent="green"/>}
                            {selSoil.ec!==null && <StatPill label="EC dS/m" value={String(selSoil.ec)} accent="green"/>}
                            {selSoil.organicMatter!==null && <StatPill label="OM %" value={String(selSoil.organicMatter)} accent="green"/>}
                            {selSoil.nitrogen!==null && <StatPill label="N kg/ha" value={String(selSoil.nitrogen)} accent="green"/>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* View toggle */}
                          <div className="flex bg-white/20 rounded-xl p-1 gap-1 text-xs font-bold">
                            {(['gauges','detail'] as const).map(v=>(
                              <button key={v} onClick={()=>setSoilView(v)}
                                className={`px-3 py-1.5 rounded-lg transition-all ${soilView===v?'bg-white text-gray-900 shadow':'text-white/80 hover:text-white'}`}>
                                {v==='gauges'?'Nutrient Status':'Details'}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={()=>{ setSoilMode('edit'); setSoilForm(soilToForm(selSoil)); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition-all border border-white/20"
                          >
                            <Edit className="w-3.5 h-3.5"/>Edit
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-5">
                      {soilView==='gauges' && <NutrientPanel tests={soilParamMap(selSoil)} params={SOIL_PARAMS} accent="green"/>}
                      {soilView==='detail' && (
                        <>
                          <RecsBlock recs={soilRecs(selSoil)} accent="green"/>
                          {selSoil.recommendations && (
                            <div className="mb-4">
                              <SectionLabel accent="green">Lab Recommendations</SectionLabel>
                              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                                <p className="text-sm text-emerald-900 whitespace-pre-wrap">{selSoil.recommendations}</p>
                              </div>
                            </div>
                          )}
                          {selSoil.notes && (
                            <div>
                              <SectionLabel accent="green">Notes</SectionLabel>
                              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selSoil.notes}</p>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!selSoil && soilMode==='view' && <EmptyDetail accent="green"/>}
            </div>
          </div>
        )}

        {/* ═══════════════════ WATER PANEL ═══════════════════ */}
        {mode==='water' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Left list ── */}
            <div className="lg:col-span-1 a-scale-in d1">
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 bg-gradient-to-r from-blue-50 to-sky-50">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Droplets className="w-3.5 h-3.5 text-blue-600"/>
                    </div>
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-widest">Water Tests</p>
                  </div>
                  {waterTests.length>0 && (
                    <button
                      onClick={()=>{ setWaterMode('create'); setSelWater(null); setWaterForm(EMPTY_WATER); }}
                      className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-white border border-blue-200 rounded-lg px-2.5 py-1 transition-all hover:scale-105"
                    >
                      <Plus className="w-3 h-3"/>Add
                    </button>
                  )}
                </div>

                <div className="p-4">
                  {waterTests.length===0
                    ? <EmptyList label="No water tests recorded yet" onAdd={()=>{ setWaterMode('create'); setSelWater(null); setWaterForm(EMPTY_WATER); }} accent="blue"/>
                    : (
                      <div className="space-y-2 max-h-[calc(100vh-340px)] overflow-y-auto thin-scroll">
                        {waterTests.map((t,i)=>(
                          <div
                            key={t.id}
                            className={`group test-row cursor-pointer rounded-xl border-2 p-3.5 ${
                              selWater?.id===t.id
                                ? 'border-blue-400 bg-blue-50 shadow-md shadow-blue-100'
                                : 'border-gray-100 bg-white hover:border-blue-200 hover:shadow-sm'
                            } a-scale-in`}
                            style={{animationDelay:`${i*0.055}s`}}
                            onClick={()=>{ setSelWater(t); setWaterMode('view'); }}
                          >
                            <div className="flex items-start justify-between">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-gray-900 text-sm truncate">{t.fieldName}</h3>
                                  {selWater?.id===t.id && <ChevronRight className="w-3.5 h-3.5 text-blue-500 shrink-0"/>}
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                                  <Calendar className="w-3 h-3"/>
                                  <span>{fmt(t.testDate)}</span>
                                  {t.sampleSource && <><span>·</span><Waves className="w-3 h-3"/><span>{t.sampleSource}</span></>}
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                  {t.suitability && (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${suitBadge(t.suitability)}`}>{t.suitability}</span>
                                  )}
                                  {t.ec!==null && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-gray-100 text-gray-500 border border-gray-200">EC {t.ec}</span>
                                  )}
                                </div>
                              </div>
                              <RowActions
                                onEdit={()=>{ setWaterMode('edit'); setSelWater(t); setWaterForm(waterToForm(t)); }}
                                onDelete={()=>deleteWater(t)}
                                accent="blue"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  }
                </div>
              </div>
            </div>

            {/* ── Right panel ── */}
            <div className="lg:col-span-2 space-y-5">

              {/* ── WATER FORM ── */}
              {(waterMode==='create'||waterMode==='edit') && (
                <div className="a-scale-in bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                  {/* Form header */}
                  <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                        <Droplets className="w-4 h-4 text-white"/>
                      </div>
                      <h2 className="text-sm font-bold text-white">{waterMode==='create'?'Add New Water Test':'Edit Water Test'}</h2>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={()=>{ setWaterMode('view'); setSelWater(null); setWaterForm(EMPTY_WATER); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg text-sm font-medium transition-all"
                      >
                        <X className="w-3.5 h-3.5"/>Cancel
                      </button>
                      <button
                        onClick={saveWater}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-white text-blue-700 rounded-lg text-sm font-bold shadow hover:bg-blue-50 transition-all disabled:opacity-60"
                      >
                        <Save className="w-3.5 h-3.5"/>{saving?'Saving…':'Save Test'}
                      </button>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Basic info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FieldSelect fields={fields} value={waterForm.fieldId} onChange={v=>setWaterForm(f=>({...f,fieldId:v}))} accent="blue"/>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3"/>Test Date *
                        </label>
                        <input type="date" required className={inputClsBlue} value={waterForm.testDate} onChange={e=>setWaterForm(f=>({...f,testDate:e.target.value}))}/>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                          <Waves className="w-3 h-3"/>Sample Source
                        </label>
                        <select className={inputClsBlue} value={waterForm.sampleSource} onChange={e=>setWaterForm(f=>({...f,sampleSource:e.target.value}))}>
                          <option value="">Select source</option>
                          {SAMPLE_SOURCE.map(s=><option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Suitability</label>
                        <select className={inputClsBlue} value={waterForm.suitability} onChange={e=>setWaterForm(f=>({...f,suitability:e.target.value}))}>
                          <option value="">Select suitability</option>
                          {SUITABILITY.map(s=><option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Water Class</label>
                        <input type="text" className={inputClsBlue} placeholder="e.g. C2-S1" value={waterForm.waterClass} onChange={e=>setWaterForm(f=>({...f,waterClass:e.target.value}))}/>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                          <Building2 className="w-3 h-3"/>Lab Name
                        </label>
                        <input type="text" className={inputClsBlue} placeholder="Testing laboratory" value={waterForm.labName} onChange={e=>setWaterForm(f=>({...f,labName:e.target.value}))}/>
                      </div>
                    </div>

                    <SectionLabel accent="blue">Water Quality Parameters</SectionLabel>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        {k:'waterPh', l:'pH',            p:'7.2'},
                        {k:'ec',      l:'EC (dS/m)',     p:'0.4'},
                        {k:'tds',     l:'TDS (mg/L)',    p:'350'},
                        {k:'co3',     l:'CO₃ (meq/L)',  p:'0'},
                        {k:'hco3',    l:'HCO₃ (meq/L)', p:'3'},
                        {k:'cl',      l:'Cl⁻ (meq/L)',  p:'2'},
                        {k:'na',      l:'Na⁺ (meq/L)',  p:'1.5'},
                        {k:'ca',      l:'Ca²⁺ (meq/L)', p:'3'},
                        {k:'mg',      l:'Mg²⁺ (meq/L)', p:'2'},
                        {k:'sar',     l:'SAR',           p:'5'},
                        {k:'rsc',     l:'RSC (meq/L)',   p:'1'},
                        {k:'boron',   l:'Boron (mg/L)',  p:'0.3'},
                        {k:'no3n',    l:'NO₃-N (mg/L)',  p:'5'},
                        {k:'so4',     l:'SO₄²⁻ (mg/L)', p:'80'},
                      ].map(f=>(
                        <NumInput key={f.k} label={f.l} value={waterForm[f.k]} placeholder={f.p} accent="blue" onChange={v=>setWaterForm(p=>({...p,[f.k]:v}))}/>
                      ))}
                    </div>

                    <SectionLabel accent="blue">Lab Notes &amp; Recommendations</SectionLabel>
                    <TextAreas rec={waterForm.recommendations} notes={waterForm.notes} accent="blue"
                      onRec={v=>setWaterForm(f=>({...f,recommendations:v}))}
                      onNotes={v=>setWaterForm(f=>({...f,notes:v}))}
                    />
                  </div>
                </div>
              )}

              {/* ── WATER DETAIL ── */}
              {selWater && waterMode==='view' && (
                <div className="a-scale-in space-y-5">
                  <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h2 className="text-lg font-extrabold text-white">{selWater.fieldName}</h2>
                            {selWater.suitability && (
                              <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${suitBadge(selWater.suitability)}`}>{selWater.suitability}</span>
                            )}
                            {selWater.waterClass && (
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/20 font-bold">{selWater.waterClass}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-white/70 text-xs">
                            <Calendar className="w-3 h-3"/>{fmt(selWater.testDate)}
                            {selWater.sampleSource && <><span>·</span><Waves className="w-3 h-3"/>{selWater.sampleSource}</>}
                            {selWater.labName && <><span>·</span><Building2 className="w-3 h-3"/>{selWater.labName}</>}
                          </div>
                          {/* Quick stat pills */}
                          <div className="flex flex-wrap gap-2 mt-3">
                            {selWater.waterPh!==null && <StatPill label="pH" value={String(selWater.waterPh)} accent="blue"/>}
                            {selWater.ec!==null && <StatPill label="EC dS/m" value={String(selWater.ec)} accent="blue"/>}
                            {selWater.tds!==null && <StatPill label="TDS mg/L" value={String(selWater.tds)} accent="blue"/>}
                            {selWater.sar!==null && <StatPill label="SAR" value={String(selWater.sar)} accent="blue"/>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex bg-white/20 rounded-xl p-1 gap-1 text-xs font-bold">
                            {(['gauges','detail'] as const).map(v=>(
                              <button key={v} onClick={()=>setWaterView(v)}
                                className={`px-3 py-1.5 rounded-lg transition-all ${waterView===v?'bg-white text-gray-900 shadow':'text-white/80 hover:text-white'}`}>
                                {v==='gauges'?'Water Quality':'Details'}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={()=>{ setWaterMode('edit'); setWaterForm(waterToForm(selWater)); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition-all border border-white/20"
                          >
                            <Edit className="w-3.5 h-3.5"/>Edit
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-5">
                      {waterView==='gauges' && <NutrientPanel tests={waterParamMap(selWater)} params={WATER_PARAMS} accent="blue"/>}
                      {waterView==='detail' && (
                        <>
                          <RecsBlock recs={waterRecs(selWater)} accent="blue"/>
                          {selWater.recommendations && (
                            <div className="mb-4">
                              <SectionLabel accent="blue">Lab Recommendations</SectionLabel>
                              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                <p className="text-sm text-blue-900 whitespace-pre-wrap">{selWater.recommendations}</p>
                              </div>
                            </div>
                          )}
                          {selWater.notes && (
                            <div>
                              <SectionLabel accent="blue">Notes</SectionLabel>
                              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selWater.notes}</p>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!selWater && waterMode==='view' && <EmptyDetail label="Select a water test to view results" accent="blue"/>}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SoilTestAdvisory;
