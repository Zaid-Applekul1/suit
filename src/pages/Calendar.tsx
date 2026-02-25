/**
 * Calendar.tsx — Orchard Activity Calendar
 *
 * Features:
 *  • Full monthly grid calendar with day navigation
 *  • Add/Edit/Delete activities per day (Tree Scouting, Soil Test, Orchard Doctor, etc.)
 *  • Color-coded activity types
 *  • "Open SKUAST Advisory" button per month — launches SkuastAdvisory modal
 *  • Activity dots on calendar days
 *  • Activity drawer panel on day click
 *  • Responsive, SKUAST-style premium UI (glassmorphism, animated gradients)
 *  • Persisted to Supabase `calendar_activities` table (RLS-secured per user)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, X, Leaf, TreePine, FlaskConical,
  Stethoscope, Calendar as CalendarIcon, Clock, Edit2, Trash2,
  Bug, Droplets, BookOpen, CheckCircle2, AlertTriangle, Save,
  ExternalLink, Loader2,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

/* ─────────────────────────────────────────────────────────────
   STYLES
───────────────────────────────────────────────────────────── */
const CAL_STYLES = `
@keyframes calFadeUp {
  from { opacity:0; transform:translateY(24px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes calFadeDown {
  from { opacity:0; transform:translateY(-18px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes calScaleIn {
  from { opacity:0; transform:scale(0.90); }
  to   { opacity:1; transform:scale(1); }
}
@keyframes calSlideRight {
  from { opacity:0; transform:translateX(-20px); }
  to   { opacity:1; transform:translateX(0); }
}
@keyframes calHeaderGradient {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes calPulseRing {
  0%   { transform:scale(1);   opacity:0.8; }
  100% { transform:scale(1.6); opacity:0; }
}
@keyframes calLeafSway {
  0%, 100% { transform: rotate(-4deg); }
  50%       { transform: rotate(4deg); }
}
@keyframes calGlow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.25); }
  50%       { box-shadow: 0 0 0 10px rgba(34,197,94,0); }
}
@keyframes modalSlideIn {
  from { opacity:0; transform:translateY(40px) scale(0.95); }
  to   { opacity:1; transform:translateY(0) scale(1); }
}

.cal-fade-up    { animation: calFadeUp     0.6s cubic-bezier(.22,1,.36,1) both; }
.cal-fade-down  { animation: calFadeDown   0.55s cubic-bezier(.22,1,.36,1) both; }
.cal-scale-in   { animation: calScaleIn    0.5s  cubic-bezier(.22,1,.36,1) both; }
.cal-slide-r    { animation: calSlideRight 0.5s  cubic-bezier(.22,1,.36,1) both; }
.cal-glow       { animation: calGlow 2.8s ease-in-out infinite; }
.cal-leaf       { display:inline-block; animation: calLeafSway 3s ease-in-out infinite; transform-origin: bottom center; }
.modal-slide-in { animation: modalSlideIn 0.35s cubic-bezier(.22,1,.36,1) both; }

.cal-d0 { animation-delay:0s;   }
.cal-d1 { animation-delay:.08s; }
.cal-d2 { animation-delay:.16s; }
.cal-d3 { animation-delay:.24s; }

.cal-header-banner {
  background: linear-gradient(135deg, #052e16, #064e3b, #047857, #059669, #10b981, #34d399, #10b981, #047857);
  background-size: 300% 300%;
  animation: calHeaderGradient 8s ease infinite;
}

.cal-pulse::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(34,197,94,0.5);
  animation: calPulseRing 1.6s cubic-bezier(.215,.61,.355,1) infinite;
}

.day-cell {
  transition: background .15s ease, box-shadow .15s ease, transform .15s ease;
  cursor: pointer;
  min-height: 80px;
}
.day-cell:hover {
  background: linear-gradient(135deg, #f0fdf4, #dcfce7) !important;
  box-shadow: 0 4px 16px rgba(34,197,94,0.12);
  transform: scale(1.02);
}
.day-cell.today {
  background: linear-gradient(135deg, #dcfce7, #bbf7d0) !important;
  box-shadow: 0 2px 10px rgba(34,197,94,0.20);
}
.day-cell.selected {
  background: linear-gradient(135deg, #a7f3d0, #6ee7b7) !important;
  box-shadow: 0 4px 20px rgba(16,185,129,0.30);
}
.day-cell.other-month {
  opacity: 0.35;
}

.activity-chip {
  transition: transform .15s ease, box-shadow .15s ease;
}
.activity-chip:hover {
  transform: translateX(3px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.10);
}

.act-type-btn {
  transition: all .18s ease;
  cursor: pointer;
}
.act-type-btn:hover {
  transform: translateY(-2px) scale(1.04);
}
.act-type-btn.selected {
  box-shadow: 0 4px 16px rgba(16,185,129,0.30);
}

/* Thin scrollbar */
.thin-scroll::-webkit-scrollbar { width: 4px; }
.thin-scroll::-webkit-scrollbar-track { background: transparent; }
.thin-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
`;

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */

type ActivityType =
  | 'tree_scouting'
  | 'soil_test'
  | 'water_test'
  | 'orchard_doctor'
  | 'spray'
  | 'irrigation'
  | 'pruning'
  | 'harvesting'
  | 'fertilizer'
  | 'other';

interface Activity {
  id: string;
  date: string;           // 'YYYY-MM-DD'
  type: ActivityType;
  title: string;
  notes: string;
  completed: boolean;
  linkedModule?: string;
}

interface ActivityTypeMeta {
  label: string;
  icon: React.ElementType;
  color: string;
  textColor: string;
  borderColor: string;
  dotColor: string;
}

/* ─────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────── */

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const ACTIVITY_TYPES: Record<ActivityType, ActivityTypeMeta> = {
  tree_scouting:  { label:'Tree Scouting',    icon:TreePine,     color:'bg-emerald-100',  textColor:'text-emerald-800',  borderColor:'border-emerald-300', dotColor:'bg-emerald-500' },
  soil_test:      { label:'Soil Test',         icon:FlaskConical, color:'bg-amber-100',    textColor:'text-amber-800',    borderColor:'border-amber-300',   dotColor:'bg-amber-500'   },
  water_test:     { label:'Water Test',        icon:Droplets,     color:'bg-blue-100',     textColor:'text-blue-800',     borderColor:'border-blue-300',    dotColor:'bg-blue-500'    },
  orchard_doctor: { label:'Orchard Doctor',   icon:Stethoscope,  color:'bg-purple-100',   textColor:'text-purple-800',   borderColor:'border-purple-300',  dotColor:'bg-purple-500'  },
  spray:          { label:'Spray Treatment',  icon:Bug,          color:'bg-red-100',      textColor:'text-red-800',      borderColor:'border-red-300',     dotColor:'bg-red-500'     },
  irrigation:     { label:'Irrigation',       icon:Droplets,     color:'bg-cyan-100',     textColor:'text-cyan-800',     borderColor:'border-cyan-300',    dotColor:'bg-cyan-500'    },
  pruning:        { label:'Pruning',          icon:Leaf,         color:'bg-lime-100',     textColor:'text-lime-800',     borderColor:'border-lime-300',    dotColor:'bg-lime-500'    },
  harvesting:     { label:'Harvesting',       icon:CheckCircle2, color:'bg-orange-100',   textColor:'text-orange-800',   borderColor:'border-orange-300',  dotColor:'bg-orange-500'  },
  fertilizer:     { label:'Fertilizer',       icon:Leaf,         color:'bg-green-100',    textColor:'text-green-800',    borderColor:'border-green-300',   dotColor:'bg-green-600'   },
  other:          { label:'Other',            icon:CalendarIcon, color:'bg-gray-100',     textColor:'text-gray-800',     borderColor:'border-gray-300',    dotColor:'bg-gray-500'    },
};

const MODULE_LINKS: Partial<Record<ActivityType, { label: string; module: string }>> = {
  tree_scouting:  { label: 'Open Tree Scouting',   module: 'TreeScouting'   },
  soil_test:      { label: 'Open Soil Advisory',   module: 'SoilTestAdvisory' },
  water_test:     { label: 'Open Water Advisory',  module: 'SoilTestAdvisory' },
  orchard_doctor: { label: 'Open Orchard Doctor',  module: 'OrchardDoctor'  },
  spray:          { label: 'Open SKUAST Advisory', module: 'SkuastAdvisory' },
};

/* ─────────────────────────────────────────────────────────────
   UTILS
───────────────────────────────────────────────────────────── */

function toDateStr(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/* ─────────────────────────────────────────────────────────────
   SKUAST ADVISORY MODAL
───────────────────────────────────────────────────────────── */

interface SkuastModalProps {
  monthIdx: number;
  onClose: () => void;
}

const SKUAST_MONTH_ADVISORIES: Record<number, string[]> = {
  0:  ['Apply dormant spray (DNOC/lime sulfur) during dormancy', 'Prune dead/diseased/crossing branches', 'Apply copper-based fungicide before bud swell', 'Clean orchard floor, remove mummified fruits'],
  1:  ['Apply lime sulfur at green tip stage', 'Monitor for Wooly Apple Aphid emergence', 'Begin bud break monitoring', 'Apply nitrogen fertilizer if not done in Jan'],
  2:  ['Apply fungicide at pink bud stage (Scab prevention)', 'Thin blossoms to 1 per cluster if heavy bloom', 'Spray for Fire Blight prevention at petal fall', 'Install codling moth traps'],
  3:  ['Post-bloom fungicide spray (Captan + Mancozeb)', 'Fruit thinning — remove excess fruitlets', 'First cover spray for Codling Moth', 'Apply calcium sprays to developing fruitlets'],
  4:  ['Continue cover sprays every 10–14 days', 'Scout for aphids, mites, leaf miners', 'Apply second calcium spray', 'Monitor fire blight on shoots'],
  5:  ['Summer pruning — remove water sprouts', 'Continue spray program as per SKUAST schedule', 'Irrigation — critical at cell division stage', 'Monitor Wooly Apple Aphid colonies'],
  6:  ['Mid-summer spray for Apple Scab & Powdery Mildew', 'Irrigation management — avoid water stress', 'Scout for San Jose Scale', 'Remove infected fruits to reduce inoculum'],
  7:  ['Pre-harvest calcium spray (last 4–6 weeks)', 'Reduce irrigation frequency', 'Monitor fruit maturity indices', 'Continue IPM scouting'],
  8:  ['Harvest early varieties', 'Apply post-harvest fungicide on wounds', 'Begin ground preparation for next season', 'Remove dropped infected fruits daily'],
  9:  ['Complete harvest of mid/late season varieties', 'Apply urea spray for leaf senescence (N recovery)', 'Fall soil sampling for nutrient analysis', 'Deep tillage after leaf fall'],
  10: ['Apply fall fertilizer (potassium, phosphorus)', 'Collect and destroy fallen leaves', 'Whitewash tree trunks (sunscald prevention)', 'Orchard sanitation before dormancy'],
  11: ['Dormant pruning begins after leaf fall', 'Apply copper spray before hard freeze', 'Record-keeping and planning for next season', 'Order inputs for next year based on soil test results'],
};

const SkuastAdvisoryModal: React.FC<SkuastModalProps> = ({ monthIdx, onClose }) => {
  const monthName = MONTH_NAMES[monthIdx];
  const advisories = SKUAST_MONTH_ADVISORIES[monthIdx] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="modal-slide-in bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-green-700 to-emerald-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-200 uppercase tracking-widest">SKUAST Advisory</p>
                <h2 className="text-lg font-extrabold text-white">{monthName} Recommendations</h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto thin-scroll">
          <p className="text-xs text-gray-400 mb-4 font-medium">
            Recommended orchard management activities for <span className="font-bold text-green-600">{monthName}</span> based on SKUAST-K schedule.
          </p>
          <ul className="space-y-3">
            {advisories.map((act, i) => (
              <li
                key={i}
                className="cal-slide-r flex items-start gap-3 p-3.5 rounded-xl bg-gradient-to-r from-gray-50 to-green-50/30 border border-gray-100 hover:border-green-200 transition-colors"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <span className="w-2 h-2 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 mt-1.5 shrink-0 shadow shadow-green-200" />
                <span className="text-sm text-gray-700 leading-relaxed">{act}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <p className="text-xs text-emerald-800 leading-relaxed">
                These are general SKUAST-K guidelines. Actual timings may vary based on weather, altitude, and crop load. Always confirm with your local agriculture officer.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-5">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-bold text-sm hover:from-green-700 hover:to-emerald-700 transition-all active:scale-95 shadow-lg shadow-green-200"
          >
            Close Advisory
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   ACTIVITY FORM MODAL
───────────────────────────────────────────────────────────── */

interface ActivityFormProps {
  initialDate: string;
  initial?: Activity;
  saving: boolean;
  onSave: (a: Omit<Activity, 'id'> & { id?: string }) => void;
  onClose: () => void;
}

const ActivityForm: React.FC<ActivityFormProps> = ({ initialDate, initial, saving, onSave, onClose }) => {
  const [type, setType] = useState<ActivityType>(initial?.type || 'tree_scouting');
  const [title, setTitle] = useState(initial?.title || '');
  const [notes, setNotes] = useState(initial?.notes || '');
  const [date, setDate] = useState(initial?.date || initialDate);
  const [completed, setCompleted] = useState(initial?.completed || false);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      id: initial?.id,
      date,
      type,
      title: title.trim(),
      notes: notes.trim(),
      completed,
      linkedModule: MODULE_LINKS[type]?.module,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="modal-slide-in bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-green-700 to-emerald-600 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-base font-extrabold text-white">
              {initial ? 'Edit Activity' : 'Add Activity'}
            </h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto thin-scroll">
          {/* Date */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white/90"
            />
          </div>

          {/* Activity Type */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Activity Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.entries(ACTIVITY_TYPES) as [ActivityType, ActivityTypeMeta][]).map(([key, meta]) => {
                const Icon = meta.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setType(key)}
                    className={`act-type-btn flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      type === key
                        ? `${meta.color} ${meta.textColor} ${meta.borderColor} selected`
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={`e.g. ${ACTIVITY_TYPES[type].label} — Field A`}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white/90 placeholder-gray-300"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Additional observations or reminders…"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white/90 placeholder-gray-300 resize-none"
            />
          </div>

          {/* Completed toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`w-4 h-4 ${completed ? 'text-green-500' : 'text-gray-300'}`} />
              <span className="text-sm font-semibold text-gray-700">Mark as Completed</span>
            </div>
            <button
              onClick={() => setCompleted(!completed)}
              className={`w-10 h-6 rounded-full transition-all ${completed ? 'bg-green-500' : 'bg-gray-200'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow transition-all mx-1 ${completed ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-2xl font-bold text-sm hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-bold text-sm hover:from-green-700 hover:to-emerald-700 transition-all active:scale-95 shadow-lg shadow-green-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {initial ? 'Save Changes' : 'Add Activity'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   DAY DETAIL PANEL
───────────────────────────────────────────────────────────── */

interface DayPanelProps {
  date: string;
  activities: Activity[];
  onAdd: () => void;
  onEdit: (a: Activity) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onClose: () => void;
  onOpenModule: (module: string) => void;
}

const DayPanel: React.FC<DayPanelProps> = ({
  date, activities, onAdd, onEdit, onDelete, onToggleComplete, onClose, onOpenModule,
}) => {
  const d = new Date(date + 'T00:00:00');
  const label = d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="cal-scale-in bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-green-700 to-emerald-600">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <CalendarIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest">Day Activities</p>
            <h3 className="text-sm font-extrabold text-white leading-snug">{label}</h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-green-700 rounded-xl text-xs font-bold hover:bg-green-50 transition-all hover:scale-105 active:scale-95 shadow"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
          <button onClick={onClose} className="w-7 h-7 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
            <X className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-2.5 max-h-96 overflow-y-auto thin-scroll">
        {activities.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-3">
              <CalendarIcon className="w-6 h-6 text-green-200" />
            </div>
            <p className="text-sm text-gray-400 mb-3">No activities for this day</p>
            <button
              onClick={onAdd}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl text-xs font-bold shadow hover:from-green-700 hover:to-emerald-700 transition-all hover:scale-105"
            >
              <Plus className="w-3.5 h-3.5" /> Add First Activity
            </button>
          </div>
        ) : (
          activities.map((act, i) => {
            const meta = ACTIVITY_TYPES[act.type];
            const Icon = meta.icon;
            const link = MODULE_LINKS[act.type];
            return (
              <div
                key={act.id}
                className={`activity-chip cal-slide-r group rounded-xl border p-3.5 ${
                  act.completed
                    ? 'bg-gray-50 border-gray-200 opacity-70'
                    : `${meta.color} ${meta.borderColor}`
                }`}
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => onToggleComplete(act.id)}
                    className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      act.completed ? 'bg-green-500 border-green-500' : `border-current ${meta.textColor}`
                    }`}
                  >
                    {act.completed && <div className="w-2 h-2 bg-white rounded-full" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${meta.textColor}`} />
                      <span className={`text-[10px] font-bold uppercase tracking-wide ${meta.textColor}`}>{meta.label}</span>
                    </div>
                    <p className={`text-sm font-bold mt-0.5 ${act.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {act.title}
                    </p>
                    {act.notes && (
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{act.notes}</p>
                    )}

                    {link && !act.completed && (
                      <button
                        onClick={() => onOpenModule(link.module)}
                        className={`mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold ${meta.textColor} hover:underline`}
                      >
                        <ExternalLink className="w-3 h-3" />
                        {link.label}
                      </button>
                    )}
                  </div>

                  <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(act)} className={`p-1.5 rounded-lg hover:bg-black/5 transition-colors ${meta.textColor}`}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onDelete(act.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   MAIN CALENDAR COMPONENT
───────────────────────────────────────────────────────────── */

interface CalendarProps {
  onNavigate?: (module: string) => void;
}

const Calendar: React.FC<CalendarProps> = ({ onNavigate }) => {
  const { session } = useAuth();
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const [selectedDate, setSelectedDate]       = useState<string | null>(null);
  const [showForm, setShowForm]               = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | undefined>(undefined);
  const [showSkuast, setShowSkuast]           = useState(false);

  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  /* ─── Load activities for current month from Supabase ─── */
  const loadActivities = useCallback(async () => {
    if (!session?.user) { setActivities([]); return; }
    setLoading(true);
    setError(null);

    // Load a window: prev month, current month, next month for smooth navigation
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate   = new Date(year, month + 2, 0).toISOString().split('T')[0];

    const { data, error: err } = await supabase
      .from('calendar_activities')
      .select('id, date, type, title, notes, completed, linked_module')
      .eq('user_id', session.user.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (err) { setError(err.message); setLoading(false); return; }

    setActivities((data ?? []).map((row: any) => ({
      id: row.id,
      date: row.date,
      type: row.type as ActivityType,
      title: row.title,
      notes: row.notes ?? '',
      completed: row.completed ?? false,
      linkedModule: row.linked_module ?? undefined,
    })));
    setLoading(false);
  }, [session?.user, year, month]);

  useEffect(() => { loadActivities(); }, [loadActivities]);

  /* ─── Calendar grid helpers ─── */
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIdx = getFirstDayOfMonth(year, month);
  const totalCells  = Math.ceil((firstDayIdx + daysInMonth) / 7) * 7;

  /* ─── Activity helpers ─── */
  const activitiesOnDate = (dateStr: string) =>
    activities.filter(a => a.date === dateStr);

  /* ─── Save (insert or update) ─── */
  const handleSaveActivity = async (a: Omit<Activity, 'id'> & { id?: string }) => {
    if (!session?.user) return;
    setSaving(true);
    setError(null);

    const payload = {
      user_id:       session.user.id,
      date:          a.date,
      type:          a.type,
      title:         a.title,
      notes:         a.notes,
      completed:     a.completed,
      linked_module: a.linkedModule ?? null,
    };

    if (a.id) {
      // Update existing
      const { error: err } = await supabase
        .from('calendar_activities')
        .update(payload)
        .eq('id', a.id)
        .eq('user_id', session.user.id);
      if (err) { setError(err.message); setSaving(false); return; }
      setActivities(prev => prev.map(x =>
        x.id === a.id ? { ...x, ...a, id: a.id! } : x
      ));
    } else {
      // Insert new
      const { data, error: err } = await supabase
        .from('calendar_activities')
        .insert(payload)
        .select('id')
        .single();
      if (err) { setError(err.message); setSaving(false); return; }
      setActivities(prev => [...prev, { ...a, id: data.id }]);
    }

    setSaving(false);
    setShowForm(false);
    setEditingActivity(undefined);
    if (!selectedDate || a.date !== selectedDate) setSelectedDate(a.date);
  };

  /* ─── Delete ─── */
  const handleDelete = async (id: string) => {
    if (!session?.user) return;
    if (!confirm('Delete this activity?')) return;
    const { error: err } = await supabase
      .from('calendar_activities')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);
    if (err) { setError(err.message); return; }
    setActivities(prev => prev.filter(a => a.id !== id));
  };

  /* ─── Toggle complete ─── */
  const handleToggleComplete = async (id: string) => {
    if (!session?.user) return;
    const act = activities.find(a => a.id === id);
    if (!act) return;
    const newCompleted = !act.completed;
    const { error: err } = await supabase
      .from('calendar_activities')
      .update({ completed: newCompleted })
      .eq('id', id)
      .eq('user_id', session.user.id);
    if (err) { setError(err.message); return; }
    setActivities(prev => prev.map(a => a.id === id ? { ...a, completed: newCompleted } : a));
  };

  const handleOpenModule = (module: string) => {
    if (onNavigate) onNavigate(module);
  };

  /* ─── Month navigation ─── */
  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setSelectedDate(null);
  };

  /* ─── Stats for header ─── */
  const monthActivities = activities.filter(a => {
    const [ay, am] = a.date.split('-').map(Number);
    return ay === year && am === month + 1;
  });
  const pendingCount   = monthActivities.filter(a => !a.completed).length;
  const completedCount = monthActivities.filter(a => a.completed).length;

  const selectedActivities = selectedDate ? activitiesOnDate(selectedDate) : [];

  return (
    <>
      <style>{CAL_STYLES}</style>

      {showSkuast && (
        <SkuastAdvisoryModal monthIdx={month} onClose={() => setShowSkuast(false)} />
      )}
      {showForm && (
        <ActivityForm
          initialDate={selectedDate || todayStr}
          initial={editingActivity}
          saving={saving}
          onSave={handleSaveActivity}
          onClose={() => { setShowForm(false); setEditingActivity(undefined); }}
        />
      )}

      <div className="w-full max-w-screen-xl mx-auto space-y-5 pb-14 px-0">

        {/* ── Hero header ── */}
        <div className="cal-fade-down cal-d0 relative overflow-hidden rounded-2xl sm:rounded-3xl cal-header-banner shadow-2xl">
          <div className="hidden sm:block absolute -top-10 -left-10 w-52 h-52 rounded-full bg-white/5 pointer-events-none" />
          <div className="hidden sm:block absolute -bottom-12 -right-12 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />

          <div className="relative px-5 sm:px-8 lg:px-12 py-7 sm:py-10">
            <div className="cal-scale-in cal-d1 inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full text-[11px] sm:text-xs font-bold text-white/90 tracking-widest uppercase mb-4">
              <span className="relative inline-block w-2 h-2 rounded-full bg-emerald-300 cal-pulse" />
              Orchard Planner · {year}
            </div>

            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight drop-shadow-xl leading-tight">
                  <span className="cal-leaf">🌿</span>{' '}Activity Calendar
                </h1>
                <p className="text-white/80 text-sm font-medium mt-1">Plan and track all orchard activities</p>

                <div className="flex flex-wrap gap-3 mt-4">
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/25 rounded-xl px-3 py-2">
                    <Clock className="w-3.5 h-3.5 text-amber-300" />
                    <span className="text-white text-xs font-bold">{pendingCount} Pending</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/25 rounded-xl px-3 py-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                    <span className="text-white text-xs font-bold">{completedCount} Done</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/25 rounded-xl px-3 py-2">
                    <CalendarIcon className="w-3.5 h-3.5 text-sky-300" />
                    <span className="text-white text-xs font-bold">{monthActivities.length} This Month</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 items-center">
                <button
                  onClick={() => setShowSkuast(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white text-green-700 rounded-xl text-xs sm:text-sm font-bold shadow hover:bg-green-50 transition-all hover:scale-105 active:scale-95"
                >
                  <BookOpen className="w-4 h-4" /> SKUAST Advisory
                </button>
                <button
                  onClick={() => { setShowForm(true); setEditingActivity(undefined); }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/20 border border-white/30 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-white/30 transition-all hover:scale-105 active:scale-95"
                >
                  <Plus className="w-4 h-4" /> Add Activity
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* ── Not logged in warning ── */}
        {!session?.user && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Sign in to save and sync your calendar activities.
          </div>
        )}

        {/* ── Month navigator ── */}
        <div className="cal-fade-up cal-d1 bg-white border border-gray-100 rounded-2xl shadow-sm p-4 sm:p-5 flex items-center justify-between gap-4">
          <button
            onClick={prevMonth}
            className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-green-50 hover:border-green-300 text-gray-600 hover:text-green-700 transition-all hover:scale-110"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center flex-1">
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">{MONTH_NAMES[month]}</h2>
            <p className="text-sm text-gray-400 font-medium">{year}</p>
          </div>

          <button
            onClick={() => setShowSkuast(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl text-xs font-bold hover:from-green-700 hover:to-emerald-700 transition-all shadow shadow-green-200 hover:scale-105"
          >
            <BookOpen className="w-3.5 h-3.5" />
            {MONTH_NAMES[month].slice(0, 3)} Advisory
          </button>

          <button
            onClick={nextMonth}
            className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-green-50 hover:border-green-300 text-gray-600 hover:text-green-700 transition-all hover:scale-110"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="flex items-center justify-center gap-3 py-8">
            <Loader2 className="w-6 h-6 animate-spin text-green-500" />
            <p className="text-sm text-gray-400">Loading activities…</p>
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* ── Calendar grid ── */}
            <div className="lg:col-span-2 cal-scale-in cal-d2">
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                {/* Day headers */}
                <div className="grid grid-cols-7 bg-gradient-to-r from-green-600 to-emerald-600">
                  {DAY_NAMES.map(d => (
                    <div key={d} className="py-3 text-center text-[11px] font-bold text-white/90 uppercase tracking-widest">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 gap-px bg-gray-100">
                  {Array.from({ length: totalCells }, (_, idx) => {
                    const dayNum = idx - firstDayIdx + 1;
                    const isCurrentMonth = dayNum >= 1 && dayNum <= daysInMonth;
                    const dateStr = isCurrentMonth ? toDateStr(year, month, dayNum) : '';
                    const isToday    = dateStr === todayStr;
                    const isSelected = dateStr === selectedDate;
                    const dayActs    = dateStr ? activitiesOnDate(dateStr) : [];

                    let displayNum = dayNum;
                    if (dayNum < 1) {
                      const prevMonthDays = getDaysInMonth(year, month === 0 ? 11 : month - 1);
                      displayNum = prevMonthDays + dayNum;
                    } else if (dayNum > daysInMonth) {
                      displayNum = dayNum - daysInMonth;
                    }

                    return (
                      <div
                        key={idx}
                        className={`day-cell bg-white p-1.5 sm:p-2 flex flex-col gap-1 ${
                          !isCurrentMonth ? 'other-month' : ''
                        } ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          if (isCurrentMonth) {
                            setSelectedDate(prev => prev === dateStr ? null : dateStr);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                            isToday
                              ? 'bg-green-600 text-white'
                              : isSelected
                                ? 'bg-emerald-700 text-white'
                                : 'text-gray-700'
                          }`}>
                            {displayNum}
                          </span>
                          {isCurrentMonth && dayActs.length > 0 && (
                            <span className="text-[9px] font-bold text-gray-400">{dayActs.length}</span>
                          )}
                        </div>

                        {isCurrentMonth && (
                          <div className="flex flex-wrap gap-0.5 mt-auto">
                            {dayActs.slice(0, 3).map(act => {
                              const m = ACTIVITY_TYPES[act.type];
                              return (
                                <span
                                  key={act.id}
                                  className={`w-1.5 h-1.5 rounded-full ${act.completed ? 'bg-gray-300' : m.dotColor}`}
                                  title={act.title}
                                />
                              );
                            })}
                            {dayActs.length > 3 && (
                              <span className="text-[8px] font-bold text-gray-400">+{dayActs.length - 3}</span>
                            )}
                          </div>
                        )}

                        {isCurrentMonth && dayActs[0] && (
                          <div className={`hidden sm:block text-[9px] font-semibold truncate px-1.5 py-0.5 rounded-md ${ACTIVITY_TYPES[dayActs[0].type].color} ${ACTIVITY_TYPES[dayActs[0].type].textColor}`}>
                            {dayActs[0].title}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <div className="mt-3 flex flex-wrap gap-2 px-1">
                {(Object.entries(ACTIVITY_TYPES) as [ActivityType, ActivityTypeMeta][]).map(([key, meta]) => (
                  <div key={key} className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium">
                    <span className={`w-2 h-2 rounded-full ${meta.dotColor}`} />
                    {meta.label}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right panel ── */}
            <div className="lg:col-span-1 space-y-4 cal-fade-up cal-d3">

              {selectedDate ? (
                <DayPanel
                  date={selectedDate}
                  activities={selectedActivities}
                  onAdd={() => { setEditingActivity(undefined); setShowForm(true); }}
                  onEdit={a => { setEditingActivity(a); setShowForm(true); }}
                  onDelete={handleDelete}
                  onToggleComplete={handleToggleComplete}
                  onClose={() => setSelectedDate(null)}
                  onOpenModule={handleOpenModule}
                />
              ) : (
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-3">
                    <CalendarIcon className="w-7 h-7 text-green-300" />
                  </div>
                  <p className="text-sm text-gray-400 font-medium">Click any day to view or add activities</p>
                </div>
              )}

              {/* SKUAST Monthly Advisory Card */}
              <div className="bg-gradient-to-br from-green-700 to-emerald-600 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest">SKUAST-K</p>
                    <h3 className="text-sm font-extrabold text-white">{MONTH_NAMES[month]} Advisory</h3>
                  </div>
                </div>
                <p className="text-xs text-white/80 mb-4 leading-relaxed">
                  View recommended spray programs and orchard management activities specific to {MONTH_NAMES[month]}.
                </p>
                <button
                  onClick={() => setShowSkuast(true)}
                  className="w-full py-2.5 bg-white text-green-700 rounded-xl text-xs font-bold hover:bg-green-50 transition-all hover:scale-105 active:scale-95 shadow flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Open {MONTH_NAMES[month]} Advisory
                </button>
              </div>

              {/* Upcoming activities */}
              {(() => {
                const upcoming = activities
                  .filter(a => {
                    if (a.completed) return false;
                    const d = new Date(a.date + 'T00:00:00');
                    const t = new Date(todayStr + 'T00:00:00');
                    return d >= t;
                  })
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .slice(0, 5);
                if (upcoming.length === 0) return null;
                return (
                  <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-50 bg-gradient-to-r from-amber-50 to-orange-50 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <p className="text-xs font-bold text-gray-700 uppercase tracking-widest">Upcoming</p>
                    </div>
                    <div className="p-3 space-y-2">
                      {upcoming.map((act, i) => {
                        const meta = ACTIVITY_TYPES[act.type];
                        const Icon = meta.icon;
                        const d = new Date(act.date + 'T00:00:00');
                        const dayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        return (
                          <div
                            key={act.id}
                            className={`cal-slide-r flex items-center gap-3 p-2.5 rounded-xl border ${meta.color} ${meta.borderColor} cursor-pointer`}
                            style={{ animationDelay: `${i * 0.06}s` }}
                            onClick={() => setSelectedDate(act.date)}
                          >
                            <Icon className={`w-3.5 h-3.5 shrink-0 ${meta.textColor}`} />
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-bold truncate ${meta.textColor}`}>{act.title}</p>
                              <p className="text-[10px] text-gray-400">{meta.label}</p>
                            </div>
                            <span className="text-[10px] font-bold text-gray-400 shrink-0">{dayLabel}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Calendar;
