/**
 * OrchardDoctor.tsx  — RBAC-aware Orchard Hospital dashboard
 *
 * RBAC rules implemented here:
 *
 *  DOCTOR (role === 'Doctor'):
 *    - Lands DIRECTLY in the doctor portal (no portal toggle shown)
 *    - NO field selector shown (doctors don't own fields)
 *    - Sees: Patient Queue · Issued Prescriptions
 *    - On first entry, if no doctor profile exists, shows DoctorRegistrationForm
 *      (but since Signup now creates the doctors row, this is a fallback only)
 *
 *  GROWER (role === 'Grower' or unknown):
 *    - Sees FULL grower portal (field selector, request consult, prescriptions, doctors list)
 *    - No doctor portal tab / toggle
 *    - Map viewer field context comes from the grower's own fields
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Stethoscope, Video, Phone, MessageSquare, MapPin, Plus, Trash2,
  CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, Send, FileText,
  Activity, User, Calendar, Leaf, Wrench, Bell, ArrowRight, X,
  RefreshCw, Smartphone, Building2, BadgeCheck, FlaskConical,
  ClipboardList, Zap, Loader2, UserPlus, ToggleLeft, ToggleRight,
  TreePine, Sprout, LayoutGrid, Map,
} from 'lucide-react';
import type { GrowerFieldSummary } from '../lib/orchardDb';

import { useOrchardDoctor } from '../hooks/useOrchardDoctor';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import type {
  ConsultType, ConsultStatus, PrescriptionStatus, ActionCategory,
  DigitalPrescription, ConsultationRequest, ActionItem, DoctorProfile,
} from '../lib/database.types';

/* ═══════════════════════════════════════════════════════════════════════════
   STATIC REFERENCE DATA
═══════════════════════════════════════════════════════════════════════════ */

const ACTION_CATEGORIES: { key: ActionCategory; label: string; color: string; icon: React.ElementType }[] = [
  { key: 'FUNGICIDE',   label: 'Fungicide',   color: 'text-purple-700 bg-purple-50 border-purple-200', icon: FlaskConical },
  { key: 'INSECTICIDE', label: 'Insecticide', color: 'text-red-700 bg-red-50 border-red-200',          icon: Activity    },
  { key: 'FERTILIZER',  label: 'Fertilizer',  color: 'text-green-700 bg-green-50 border-green-200',    icon: Leaf        },
  { key: 'LABOR',       label: 'Labor',       color: 'text-blue-700 bg-blue-50 border-blue-200',       icon: Wrench      },
  { key: 'IRRIGATION',  label: 'Irrigation',  color: 'text-cyan-700 bg-cyan-50 border-cyan-200',       icon: Activity    },
  { key: 'OTHER',       label: 'Other',       color: 'text-gray-700 bg-gray-50 border-gray-200',       icon: ClipboardList },
];

const CONSULT_TYPES: { key: ConsultType; label: string; icon: React.ElementType; color: string; desc: string }[] = [
  { key: 'CHAT',         label: 'Chat',         icon: MessageSquare, color: 'from-sky-500 to-sky-600',       desc: 'Text consultation'    },
  { key: 'CALL',         label: 'Voice Call',   icon: Phone,         color: 'from-green-500 to-green-600',   desc: 'Audio consultation'   },
  { key: 'VIDEO',        label: 'Video Call',   icon: Video,         color: 'from-violet-500 to-violet-600', desc: 'Live video session'   },
  { key: 'ONSITE_VISIT', label: 'Onsite Visit', icon: MapPin,        color: 'from-orange-500 to-orange-600', desc: 'Doctor visits orchard' },
];

const STATUS_META: Record<ConsultStatus, { label: string; color: string; dot: string }> = {
  REQUESTED:   { label: 'Requested',   color: 'text-amber-700 bg-amber-50 border-amber-300', dot: 'bg-amber-500'  },
  IN_PROGRESS: { label: 'In Progress', color: 'text-blue-700 bg-blue-50 border-blue-300',    dot: 'bg-blue-500'   },
  COMPLETED:   { label: 'Completed',   color: 'text-green-700 bg-green-50 border-green-300', dot: 'bg-green-500'  },
};

const RX_STATUS_META: Record<PrescriptionStatus, { label: string; color: string; icon: React.ElementType }> = {
  PENDING:          { label: 'Pending Execution', color: 'text-red-700 bg-red-50 border-red-300',       icon: AlertTriangle },
  APPLIED:          { label: 'Executed',          color: 'text-green-700 bg-green-50 border-green-300', icon: CheckCircle2  },
  NEEDS_CORRECTION: { label: 'Needs Review',      color: 'text-amber-700 bg-amber-50 border-amber-300', icon: RefreshCw     },
};

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════════════ */

const uid = () => crypto.randomUUID();
const fmt = (n: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
const nowISO = () => new Date().toISOString().slice(0, 16);

function buildWhatsAppMessage(rx: DigitalPrescription, growerName: string, growerPhone: string): string {
  const items = rx.actionItems
    .map((a, i) => `  ${i + 1}. [${a.category}] ${a.productName} — ${a.dosage} (Est. ₹${fmt(a.estimatedCost)})`)
    .join('\n');
  const total = rx.actionItems.reduce((s, a) => s + a.estimatedCost, 0);
  return (
    `🏥 *${rx.hospitalName}* — Official Prescription\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `👨‍⚕️ *${rx.doctorName}*\n` +
    `📋 Rx ID: ${rx.id.slice(0, 8).toUpperCase()}\n` +
    `📅 Issued: ${rx.issuedAt}\n\n` +
    `🌿 *Grower:* ${growerName} (${growerPhone})\n\n` +
    `🔬 *Diagnosis:* ${rx.issueDiagnosed}${rx.eppoCode ? ` (EPPO: ${rx.eppoCode})` : ''}\n\n` +
    `💊 *Remedy:* ${rx.recommendation}\n\n` +
    `📝 *Action Items:*\n${items}\n\n` +
    `💰 *Total Est. Cost:* ₹${fmt(total)}\n\n` +
    `📆 *Follow-up:* ${rx.followUpDate}\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `_This is an official prescription from ${rx.hospitalName}. Please execute promptly._`
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SHARED UI PRIMITIVES
═══════════════════════════════════════════════════════════════════════════ */

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${className}`}>
      {children}
    </span>
  );
}

function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function ActionItemBadge({ category }: { category: ActionCategory }) {
  const meta = ACTION_CATEGORIES.find(c => c.key === category)!;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold border ${meta.color}`}>
      <Icon className="w-3 h-3" />{meta.label}
    </span>
  );
}

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="flex items-center gap-3 bg-red-50 border border-red-300 rounded-xl px-4 py-3 text-sm text-red-800">
      <AlertTriangle className="w-4 h-4 shrink-0" />
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss}><X className="w-4 h-4" /></button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   GROWER ORCHARD PANEL  (shown to doctors in the Patient Queue)
═══════════════════════════════════════════════════════════════════════════ */

function GrowerOrchardPanel({ field }: { field: GrowerFieldSummary }) {
  const orchardType =
    typeof field.details?.orchardType === 'string' ? field.details.orchardType : null;

  const healthColor =
    field.healthStatus === 'Excellent' ? 'text-green-700 bg-green-50 border-green-200'
    : field.healthStatus === 'Good'    ? 'text-blue-700 bg-blue-50 border-blue-200'
    : field.healthStatus === 'Fair'    ? 'text-yellow-700 bg-yellow-50 border-yellow-200'
    : field.healthStatus === 'Poor'    ? 'text-red-700 bg-red-50 border-red-200'
    : 'text-gray-600 bg-gray-50 border-gray-200';

  return (
    <div className="mt-3 border border-emerald-200 bg-emerald-50 rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-emerald-100 rounded-lg">
          <Leaf className="w-4 h-4 text-emerald-700" />
        </div>
        <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Farm Orchard Details</p>
      </div>

      {/* Primary info grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
        <div className="bg-white rounded-lg px-3 py-2 border border-emerald-100">
          <p className="text-gray-400 font-semibold mb-0.5 uppercase" style={{ fontSize: '10px' }}>Field Name</p>
          <p className="font-bold text-gray-800 truncate">{field.name}</p>
        </div>

        {field.location && (
          <div className="bg-white rounded-lg px-3 py-2 border border-emerald-100 flex items-start gap-1.5">
            <MapPin className="w-3 h-3 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-gray-400 font-semibold mb-0.5 uppercase" style={{ fontSize: '10px' }}>Location</p>
              <p className="font-semibold text-gray-700 truncate">{field.location}</p>
            </div>
          </div>
        )}

        {field.area != null && (
          <div className="bg-white rounded-lg px-3 py-2 border border-emerald-100">
            <p className="text-gray-400 font-semibold mb-0.5 uppercase" style={{ fontSize: '10px' }}>Area</p>
            <p className="font-bold text-gray-800">{field.area} kanal</p>
          </div>
        )}

        {orchardType && (
          <div className="bg-white rounded-lg px-3 py-2 border border-emerald-100">
            <p className="text-gray-400 font-semibold mb-0.5 uppercase" style={{ fontSize: '10px' }}>Orchard Type</p>
            <p className="font-semibold text-gray-700">{orchardType}</p>
          </div>
        )}

        {field.soilType && (
          <div className="bg-white rounded-lg px-3 py-2 border border-emerald-100">
            <p className="text-gray-400 font-semibold mb-0.5 uppercase" style={{ fontSize: '10px' }}>Soil Type</p>
            <p className="font-semibold text-gray-700">{field.soilType}</p>
          </div>
        )}

        {field.cropStage && (
          <div className="bg-white rounded-lg px-3 py-2 border border-emerald-100 flex items-start gap-1.5">
            <Sprout className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-gray-400 font-semibold mb-0.5 uppercase" style={{ fontSize: '10px' }}>Crop Stage</p>
              <p className="font-semibold text-gray-700">{field.cropStage}</p>
            </div>
          </div>
        )}
      </div>

      {/* Health + Tree count row */}
      <div className="flex flex-wrap items-center gap-2">
        {field.healthStatus && (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${healthColor}`}>
            <CheckCircle2 className="w-3 h-3" />
            Health: {field.healthStatus}
          </span>
        )}
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border text-emerald-700 bg-emerald-50 border-emerald-200">
          <TreePine className="w-3 h-3" />
          {field.treeCount} Tagged Tree{field.treeCount !== 1 ? 's' : ''}
        </span>
        {field.boundaryPath && field.boundaryPath.length > 0 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border text-blue-700 bg-blue-50 border-blue-200">
            <LayoutGrid className="w-3 h-3" />
            {field.boundaryPath.length}-pt boundary mapped
          </span>
        )}
      </div>

      {/* Varieties */}
      {field.varieties.length > 0 && (
        <div>
          <p className="text-xs font-bold text-emerald-700 mb-1.5">Apple Varieties</p>
          <div className="flex flex-wrap gap-1.5">
            {field.varieties.map((v, i) => (
              <span key={i} className="inline-flex items-center gap-1 bg-white border border-emerald-200 rounded-lg px-2 py-1 text-xs">
                <span className="font-semibold text-gray-800">{v.varietyName}</span>
                <span className="text-gray-400">· {v.totalTrees} trees</span>
                {v.role !== 'main' && (
                  <span className="text-emerald-600 font-medium">({v.role})</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {field.plantedDate && (
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <Calendar className="w-3 h-3" /> Planted: {field.plantedDate}
        </p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ORCHARD MAP MODAL  (doctor clicks "View Map" on a patient's field)
═══════════════════════════════════════════════════════════════════════════ */

function OrchardMapModal({
  field,
  growerName,
  onClose,
}: {
  field: GrowerFieldSummary;
  growerName: string;
  onClose: () => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapsReady, setMapsReady] = useState(() => !!(window as any).google?.maps);
  const [mapError, setMapError] = useState<string | null>(null);

  // Load Google Maps SDK if not already present
  useEffect(() => {
    if ((window as any).google?.maps) { setMapsReady(true); return; }
    const apiKey = (import.meta.env.VITE_GOOGLE_API_KEY as string | undefined) || '';
    if (!apiKey) { setMapError('Google Maps API key not configured.'); return; }
    const existing = document.querySelector('script[data-gm]');
    if (existing) { existing.addEventListener('load', () => setMapsReady(true)); return; }
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
    s.async = true; s.defer = true; s.dataset.gm = '1';
    s.onload = () => setMapsReady(true);
    s.onerror = () => setMapError('Failed to load Google Maps.');
    document.head.appendChild(s);
  }, []);

  // Initialise map once SDK is ready and modal div is mounted
  useEffect(() => {
    if (!mapsReady || !mapRef.current) return;
    const G = (window as any).google.maps;

    // Variety → colour (same palette as grower Dashboard)
    const varietyPalette = ['#22c55e', '#f97316', '#3b82f6', '#e11d48', '#a855f7', '#14b8a6'];
    const getVarietyColor = (variety: string) => {
      if (!variety) return '#16a34a';
      const hash = variety.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
      return varietyPalette[hash % varietyPalette.length];
    };

    // Determine center from boundary or coords
    let center = { lat: 34.0837, lng: 74.7973 };
    let zoom = 15;
    if (field.boundaryPath && field.boundaryPath.length > 0) {
      const lats = field.boundaryPath.map(p => p.lat);
      const lngs = field.boundaryPath.map(p => p.lng);
      center = {
        lat: (Math.min(...lats) + Math.max(...lats)) / 2,
        lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
      };
      zoom = 16;
    } else if (field.latitude && field.longitude) {
      center = { lat: field.latitude, lng: field.longitude };
      zoom = 16;
    }

    const map = new G.Map(mapRef.current, {
      center, zoom,
      mapTypeId: 'satellite',
      disableDefaultUI: false,
      zoomControl: true,
      fullscreenControl: true,
    });

    // Draw orchard boundary polygon
    if (field.boundaryPath && field.boundaryPath.length > 2) {
      const polygon = new G.Polygon({
        paths: field.boundaryPath.map(p => ({ lat: p.lat, lng: p.lng })),
        strokeColor: '#22c55e',
        strokeOpacity: 0.95,
        strokeWeight: 3,
        fillColor: '#22c55e',
        fillOpacity: 0.18,
        map,
      });
      const bounds = new G.LatLngBounds();
      field.boundaryPath.forEach(p => bounds.extend({ lat: p.lat, lng: p.lng }));
      map.fitBounds(bounds);

      // Info window on polygon click
      const iw = new G.InfoWindow({
        content: `<div style="padding:6px 8px;font-family:sans-serif">
          <strong style="font-size:13px">${field.name}</strong><br/>
          <span style="font-size:11px;color:#555">${field.location ?? ''}</span><br/>
          <span style="font-size:11px;color:#555">Area: ${field.area ?? '—'} kanal · ${field.treeCount} trees</span>
        </div>`,
      });
      polygon.addListener('click', (e: any) => {
        iw.setPosition(e.latLng);
        iw.open(map);
      });
    } else if (field.latitude && field.longitude) {
      // Fallback: simple pin
      new G.Marker({
        position: { lat: field.latitude, lng: field.longitude },
        map,
        title: field.name,
      });
    }

    // ── Tree tag markers ──────────────────────────────────────────────────
    let activeTreeIw: any = null;
    (field.treeTags ?? []).forEach(tag => {
      const color = getVarietyColor(tag.variety);
      // Same SVG tree icon as grower Dashboard
      const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">` +
        `<circle cx="32" cy="24" r="18" fill="${color}"/>` +
        `<rect x="28" y="36" width="8" height="18" fill="#8b5a2b"/>` +
        `</svg>`;

      const marker = new G.Marker({
        position: { lat: tag.latitude, lng: tag.longitude },
        map,
        title: tag.name || 'Tree',
        icon: {
          url: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
          scaledSize: new G.Size(28, 28),
          anchor: new G.Point(14, 28),
        },
      });

      marker.addListener('click', () => {
        if (activeTreeIw) activeTreeIw.close();
        activeTreeIw = new G.InfoWindow({
          content: `<div style="min-width:130px;font-family:sans-serif;padding:4px">
            <strong style="font-size:13px">${tag.name || 'Tree'}</strong><br/>
            <span style="font-size:11px;color:#555">Variety: ${tag.variety || '—'}</span>
          </div>`,
        });
        activeTreeIw.open(map, marker);
      });
    });
  }, [mapsReady, field]);

  const orchardType = typeof field.details?.orchardType === 'string' ? field.details.orchardType : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Map className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-extrabold text-sm leading-tight">{field.name}</p>
              <p className="text-slate-400 text-xs mt-0.5">{growerName}'s Orchard · {field.location ?? ''}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick info strip */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-2.5 bg-emerald-50 border-b border-emerald-100 shrink-0 text-xs">
          {orchardType && (
            <span className="flex items-center gap-1 font-semibold text-emerald-800">
              <Leaf className="w-3 h-3" />{orchardType}
            </span>
          )}
          {field.soilType && (
            <span className="text-gray-600">Soil: <strong>{field.soilType}</strong></span>
          )}
          {field.cropStage && (
            <span className="flex items-center gap-1 text-gray-600">
              <Sprout className="w-3 h-3 text-green-500" />{field.cropStage}
            </span>
          )}
          <span className="flex items-center gap-1 text-emerald-700 font-semibold">
            <TreePine className="w-3 h-3" />{field.treeCount} trees
          </span>
          {field.area != null && (
            <span className="text-gray-600">{field.area} kanal</span>
          )}
          {field.boundaryPath && field.boundaryPath.length > 0 && (
            <span className="flex items-center gap-1 text-blue-700">
              <LayoutGrid className="w-3 h-3" />{field.boundaryPath.length}-pt boundary
            </span>
          )}
        </div>

        {/* Map */}
        <div className="relative flex-1 min-h-0" style={{ minHeight: 340 }}>
          {mapError ? (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-red-600 bg-red-50">
              <AlertTriangle className="w-4 h-4 mr-2" />{mapError}
            </div>
          ) : !mapsReady ? (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading map…</span>
            </div>
          ) : (
            <div ref={mapRef} className="w-full h-full" style={{ minHeight: 340 }} />
          )}
        </div>

        {/* Varieties footer */}
        {field.varieties.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 shrink-0">
            <p className="text-xs font-bold text-gray-500 uppercase mb-1.5">Varieties</p>
            <div className="flex flex-wrap gap-1.5">
              {field.varieties.map((v, i) => (
                <span key={i} className="inline-flex items-center gap-1 bg-white border border-emerald-200 rounded-lg px-2 py-1 text-xs">
                  <span className="font-semibold text-gray-800">{v.varietyName}</span>
                  <span className="text-gray-400">· {v.totalTrees} trees</span>
                  {v.role !== 'main' && <span className="text-emerald-600 font-medium">({v.role})</span>}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DOCTOR REGISTRATION FORM  (fallback if profile wasn't created at signup)
═══════════════════════════════════════════════════════════════════════════ */

function DoctorRegistrationForm({
  mutating,
  onRegister,
}: {
  mutating: boolean;
  onRegister: (payload: {
    name: string;
    specialization: string;
    hospitalName: string;
    phone?: string;
    email?: string;
    bio?: string;
  }) => void;
}) {
  const [name, setName]         = useState('');
  const [spec, setSpec]         = useState('');
  const [hospital, setHospital] = useState('');
  const [phone, setPhone]       = useState('');
  const [email, setEmail]       = useState('');
  const [bio, setBio]           = useState('');

  const canSubmit = name.trim() && spec.trim() && hospital.trim() && !mutating;

  return (
    <div className="max-w-lg mx-auto">
      <SectionCard>
        <div className="bg-gradient-to-br from-slate-800 to-slate-700 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white font-extrabold text-lg">Complete Doctor Profile</p>
              <p className="text-slate-300 text-xs mt-0.5">Fill in your details to start receiving consultation requests</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Full Name *</label>
              <input className="border rounded-xl px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-slate-400"
                placeholder="Dr. Full Name" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Specialization *</label>
              <input className="border rounded-xl px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-slate-400"
                placeholder="e.g. Plant Pathology" value={spec} onChange={e => setSpec(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Hospital / Clinic Name *</label>
            <input className="border rounded-xl px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="e.g. Orchard Hospital Kashmir" value={hospital} onChange={e => setHospital(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Phone</label>
              <input className="border rounded-xl px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-slate-400"
                placeholder="+91 XXXXX XXXXX" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Email</label>
              <input type="email" className="border rounded-xl px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-slate-400"
                placeholder="doctor@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Bio / About</label>
            <textarea rows={2} className="border rounded-xl px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="Brief description of your expertise..." value={bio} onChange={e => setBio(e.target.value)} />
          </div>
          <button
            onClick={() => canSubmit && onRegister({ name, specialization: spec, hospitalName: hospital, phone: phone || undefined, email: email || undefined, bio: bio || undefined })}
            disabled={!canSubmit}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white py-3 rounded-xl font-extrabold text-sm transition shadow-lg"
          >
            {mutating ? <Loader2 className="w-4 h-4 animate-spin" /> : <BadgeCheck className="w-4 h-4" />}
            Save Doctor Profile
          </button>
        </div>
      </SectionCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DOCTOR PROFILE CARD
═══════════════════════════════════════════════════════════════════════════ */

function DoctorProfileCard({
  profile, mutating, onToggleAvailable,
}: {
  profile: DoctorProfile;
  mutating: boolean;
  onToggleAvailable: () => void;
}) {
  return (
    <SectionCard>
      <div className="px-5 py-4 flex items-center gap-4 flex-wrap">
        <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
          <Stethoscope className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-gray-800 text-base truncate">{profile.name}</p>
          <p className="text-sm text-gray-500 truncate">{profile.specialization} · {profile.hospitalName}</p>
          {profile.phone && <p className="text-xs text-gray-400">{profile.phone}</p>}
        </div>
        <button
          onClick={onToggleAvailable} disabled={mutating}
          title={profile.available ? 'Mark as Unavailable' : 'Mark as Available'}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm border transition disabled:opacity-50 ${
            profile.available
              ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'
              : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
          }`}
        >
          {profile.available
            ? <><ToggleRight className="w-4 h-4" />Available</>
            : <><ToggleLeft className="w-4 h-4" />Unavailable</>}
        </button>
      </div>
    </SectionCard>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PRESCRIPTION CARD
═══════════════════════════════════════════════════════════════════════════ */

function PrescriptionCard({
  rx, mutating, onExecute, onFlagCorrection, showWhatsApp,
}: {
  rx: DigitalPrescription;
  mutating: boolean;
  onExecute: () => void;
  onFlagCorrection: () => void;
  showWhatsApp: () => void;
}) {
  const [open, setOpen] = useState(true);
  const total = rx.actionItems.reduce((s, a) => s + a.estimatedCost, 0);
  const meta = RX_STATUS_META[rx.status];
  const MetaIcon = meta.icon;

  const borderColor = rx.status === 'PENDING' ? 'border-red-400' : rx.status === 'NEEDS_CORRECTION' ? 'border-amber-400' : 'border-green-400';
  const headerBg   = rx.status === 'PENDING' ? 'bg-red-50'    : rx.status === 'NEEDS_CORRECTION' ? 'bg-amber-50'    : 'bg-green-50';
  const iconBg     = rx.status === 'PENDING' ? 'bg-red-100'   : rx.status === 'APPLIED'           ? 'bg-green-100'  : 'bg-amber-100';
  const iconColor  = rx.status === 'PENDING' ? 'text-red-600' : rx.status === 'APPLIED'           ? 'text-green-600': 'text-amber-600';

  return (
    <div className={`rounded-2xl border-2 overflow-hidden shadow-lg ${borderColor}`}>
      <div className={`px-5 py-4 flex items-start justify-between cursor-pointer ${headerBg}`} onClick={() => setOpen(!open)}>
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl ${iconBg}`}>
            <FileText className={`w-5 h-5 ${iconColor}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-extrabold text-gray-800 text-sm">Rx #{rx.id.slice(0, 8).toUpperCase()}</p>
              <Badge className={meta.color}><MetaIcon className="w-3 h-3" />{meta.label}</Badge>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{rx.doctorName} · {rx.hospitalName}</p>
            <p className="text-xs font-semibold text-gray-700 mt-1">{rx.issueDiagnosed}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-extrabold text-gray-800 text-sm">₹{fmt(total)}</span>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {open && (
        <div className="px-5 pb-5 pt-4 space-y-4 bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-bold text-gray-400 uppercase mb-1">Diagnosis</p>
              <p className="text-sm font-semibold text-gray-800">{rx.issueDiagnosed}</p>
              {rx.eppoCode && <p className="text-xs text-gray-500 mt-0.5">EPPO Code: {rx.eppoCode}</p>}
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-bold text-gray-400 uppercase mb-1">Remedy</p>
              <p className="text-sm text-gray-700">{rx.recommendation}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase mb-2">Prescription Action Items</p>
            <div className="space-y-2">
              {rx.actionItems.map(item => (
                <div key={item.id} className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <ActionItemBadge category={item.category} />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{item.productName}</p>
                      <p className="text-xs text-gray-500">{item.dosage}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-700">₹{fmt(item.estimatedCost)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 px-1">
              <span className="text-xs text-gray-500">Total Estimated Cost</span>
              <span className="text-sm font-extrabold text-gray-800">₹{fmt(total)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-gray-500 border-t pt-3">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Issued: {rx.issuedAt}</span>
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Follow-up: {rx.followUpDate}</span>
          </div>

          {rx.status === 'PENDING' && (
            <div className="flex flex-wrap gap-2 pt-1">
              <button onClick={onExecute} disabled={mutating}
                className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-green-200 transition">
                {mutating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Execute Prescription
              </button>
              <button onClick={showWhatsApp}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition">
                <Smartphone className="w-4 h-4" />View WhatsApp
              </button>
              <button onClick={onFlagCorrection} disabled={mutating}
                className="flex items-center gap-2 border border-amber-400 text-amber-700 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-amber-50 disabled:opacity-50 transition">
                <RefreshCw className="w-4 h-4" />Request Correction
              </button>
            </div>
          )}
          {rx.status === 'APPLIED' && (
            <div className="flex items-center gap-2 text-green-700 font-semibold text-sm bg-green-50 rounded-xl px-4 py-2.5 border border-green-200">
              <CheckCircle2 className="w-4 h-4" />Executed — Costs logged to Expense Tracker
            </div>
          )}
          {rx.status === 'NEEDS_CORRECTION' && (
            <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm bg-amber-50 rounded-xl px-4 py-2.5 border border-amber-200">
              <RefreshCw className="w-4 h-4" />Correction requested — Doctor will review
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   WHATSAPP PREVIEW MODAL
═══════════════════════════════════════════════════════════════════════════ */

function WhatsAppModal({ message, hospitalName, onClose }: { message: string; hospitalName: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-teal-600 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-white" />
            <span className="font-bold text-white">WhatsApp Preview</span>
          </div>
          <button onClick={onClose} className="text-white opacity-75 hover:opacity-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 bg-gray-100">
          <div className="bg-white rounded-xl shadow-inner border border-gray-200 overflow-hidden">
            <div className="bg-teal-700 px-4 py-3 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">{hospitalName}</p>
                <p className="text-teal-200 text-xs">Official Prescription</p>
              </div>
            </div>
            <div className="bg-[#ECE5DD] p-3 min-h-32 max-h-72 overflow-y-auto">
              <div className="bg-white rounded-lg rounded-tl-none shadow-sm px-3 py-2 max-w-xs">
                <pre className="text-xs text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">{message}</pre>
                <p className="text-right text-xs text-gray-400 mt-1">✓✓ Now</p>
              </div>
            </div>
          </div>
        </div>
        <div className="px-5 pb-5 pt-2">
          <p className="text-xs text-gray-500 mb-3">This message will be sent to the grower's registered WhatsApp when the prescription is issued.</p>
          <button onClick={onClose} className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-bold text-sm">
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PRESCRIPTION BUILDER MODAL
═══════════════════════════════════════════════════════════════════════════ */

function PrescriptionBuilder({
  consultation, doctor, mutating, onIssue, onCancel,
}: {
  consultation: ConsultationRequest;
  doctor: DoctorProfile;
  mutating: boolean;
  onIssue: (payload: {
    consultationId: string;
    doctorName: string;
    hospitalName: string;
    issueDiagnosed: string;
    eppoCode: string;
    recommendation: string;
    followUpDate: string;
    actionItems: Array<{ category: ActionItem['category']; productName: string; dosage: string; estimatedCost: number }>;
  }) => void;
  onCancel: () => void;
}) {
  const [issue, setIssue]               = useState('');
  const [eppo, setEppo]                 = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [followUp, setFollowUp]         = useState('');
  const [items, setItems]               = useState<Array<{ id: string; category: ActionCategory; productName: string; dosage: string; estimatedCost: number }>>([]);

  const addItem = () => setItems(prev => [...prev, { id: uid(), category: 'FUNGICIDE', productName: '', dosage: '', estimatedCost: 0 }]);
  const updateItem = (id: string, key: string, value: unknown) => setItems(prev => prev.map(it => it.id === id ? { ...it, [key]: value } : it));
  const removeItem = (id: string) => setItems(prev => prev.filter(it => it.id !== id));

  const totalCost = items.reduce((s, a) => s + a.estimatedCost, 0);
  const canIssue = issue.trim() && recommendation.trim() && items.length > 0 && followUp && !mutating;

  const handleIssue = () => {
    if (!canIssue) return;
    onIssue({
      consultationId: consultation.id,
      doctorName: doctor.name,
      hospitalName: doctor.hospitalName,
      issueDiagnosed: issue,
      eppoCode: eppo,
      recommendation,
      followUpDate: followUp,
      actionItems: items.map(({ category, productName, dosage, estimatedCost }) => ({
        category, productName, dosage, estimatedCost,
      })),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60">
      <div className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-screen overflow-y-auto">
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-5 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl"><Stethoscope className="w-5 h-5 text-white" /></div>
            <div>
              <p className="text-white font-extrabold">Prescription Builder</p>
              <p className="text-slate-300 text-xs">{doctor.name} · {doctor.hospitalName}</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Grower context */}
          <div className="bg-blue-50 rounded-xl px-4 py-3 flex items-center gap-3 border border-blue-200">
            <User className="w-4 h-4 text-blue-600" />
            <div className="text-sm">
              <span className="font-bold text-blue-800">Grower:</span>
              <span className="ml-2 text-blue-700">{consultation.growerName}</span>
              <span className="ml-3 text-blue-500">Request #{consultation.id.slice(0, 8).toUpperCase()} · {consultation.type}</span>
            </div>
          </div>

          {/* Step 1 — Diagnosis */}
          <div className="space-y-3">
            <p className="font-bold text-gray-700 text-sm uppercase tracking-wide">Step 1 — Diagnosis</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-500 block mb-1">Issue / Disease Diagnosed *</label>
                <input className="border rounded-xl px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-slate-400"
                  placeholder="e.g. Apple Scab (Venturia inaequalis)" value={issue} onChange={e => setIssue(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">EPPO Code (optional)</label>
                <input className="border rounded-xl px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-slate-400"
                  placeholder="VENTIN" value={eppo} onChange={e => setEppo(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Recommendation / Remedy *</label>
              <textarea rows={2} className="border rounded-xl px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-slate-400"
                placeholder="Describe the corrective action and rationale..." value={recommendation} onChange={e => setRecommendation(e.target.value)} />
            </div>
          </div>

          {/* Step 2 — Action Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-bold text-gray-700 text-sm uppercase tracking-wide">Step 2 — Action Items</p>
              <button onClick={addItem}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition">
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>
            {items.length === 0 && (
              <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
                Click "Add Item" to add chemicals, fertilizers or labor instructions
              </div>
            )}
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.id} className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-start bg-gray-50 border rounded-xl p-3">
                  <select className="border rounded-lg px-2 py-2 text-xs bg-white" value={item.category}
                    onChange={e => updateItem(item.id, 'category', e.target.value)}>
                    {ACTION_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                  <input className="border rounded-lg px-2 py-2 text-xs sm:col-span-2" placeholder="Product / Action Name"
                    value={item.productName} onChange={e => updateItem(item.id, 'productName', e.target.value)} />
                  <input className="border rounded-lg px-2 py-2 text-xs" placeholder="Dosage (e.g. 500g/200L)"
                    value={item.dosage} onChange={e => updateItem(item.id, 'dosage', e.target.value)} />
                  <div className="flex items-center gap-1">
                    <input type="number" className="border rounded-lg px-2 py-2 text-xs flex-1" placeholder="Est. Cost ₹"
                      value={item.estimatedCost || ''} onChange={e => updateItem(item.id, 'estimatedCost', +e.target.value)} />
                    <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 shrink-0 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {items.length > 0 && (
              <div className="flex justify-between text-sm font-bold text-gray-700 bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-200">
                <span>Total Estimated Cost</span>
                <span>₹{fmt(totalCost)}</span>
              </div>
            )}
          </div>

          {/* Step 3 — Follow-up */}
          <div className="space-y-2">
            <p className="font-bold text-gray-700 text-sm uppercase tracking-wide">Step 3 — Follow-up</p>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Follow-up Date *</label>
              <input type="date" className="border rounded-xl px-3 py-2.5 text-sm w-full"
                value={followUp} onChange={e => setFollowUp(e.target.value)} />
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t">
            <button onClick={handleIssue} disabled={!canIssue}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-900 hover:to-slate-800 disabled:opacity-40 text-white py-3 rounded-xl font-extrabold text-sm transition shadow-lg">
              {mutating ? <Loader2 className="w-4 h-4 animate-spin" /> : <BadgeCheck className="w-4 h-4" />}
              Issue Digital Prescription
            </button>
            <button onClick={onCancel} className="px-5 py-3 border border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PROPS
═══════════════════════════════════════════════════════════════════════════ */

interface OrchardDoctorProps {
  growerName?: string;
  growerPhone?: string;
  fieldId?: string;
  orchardName?: string;
  onExpenseLog?: (items: Array<{
    category: ActionCategory;
    productName: string;
    dosage: string;
    estimatedCost: number;
    prescriptionId: string;
    doctorName: string;
    issuedAt: string;
  }>) => void;
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */

export default function OrchardDoctor({
  growerName,
  growerPhone,
  fieldId: propFieldId,
  orchardName: propOrchardName,
  onExpenseLog,
}: OrchardDoctorProps) {
  /* ── Auth + RBAC ── */
  const { user, userRole } = useAuth();
  const userId = user?.id ?? '';
  const isDoctor = userRole === 'Doctor';

  const resolvedGrowerName  = growerName  || (user as any)?.name  || '';
  const resolvedGrowerPhone = growerPhone || (user as any)?.phone || '';

  /* ── Field selector state (Growers only) ── */
  const [userFields, setUserFields]           = useState<Array<{ id: string; name: string }>>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string>(propFieldId ?? '');
  const [selectedFieldName, setSelectedFieldName] = useState<string>(propOrchardName ?? '');
  const [fieldsLoading, setFieldsLoading]     = useState(!isDoctor && !propFieldId);

  // Load the grower's own fields from the orchard map (skipped for doctors)
  useEffect(() => {
    if (isDoctor || propFieldId || !userId) return;
    setFieldsLoading(true);
    supabase
      .from('fields')
      .select('id, name')
      .eq('user_id', userId)
      .then(({ data }) => {
        const rows = (data ?? []) as Array<{ id: string; name: string }>;
        setUserFields(rows);
        if (rows.length > 0) {
          setSelectedFieldId(rows[0].id);
          setSelectedFieldName(rows[0].name);
        }
        setFieldsLoading(false);
      });
  }, [userId, propFieldId, isDoctor]);

  const fieldId     = isDoctor ? '' : (propFieldId ?? selectedFieldId);
  const orchardName = isDoctor ? '' : (propOrchardName ?? selectedFieldName);

  /* ── Hook ── */
  const db = useOrchardDoctor(fieldId, userId, resolvedGrowerName, resolvedGrowerPhone, userRole);

  /* ── Local UI state ── */
  // For doctors: portal is always 'doctor'. For growers: always 'grower'. No toggle.
  const portalMode = isDoctor ? 'doctor' : 'grower';
  const [tab, setTab]                 = useState<'consult' | 'prescriptions' | 'doctors'>('consult');
  const [newType, setNewType]         = useState<ConsultType>('VIDEO');
  const [newDateTime, setNewDateTime] = useState(nowISO());
  const [newNotes, setNewNotes]       = useState('');
  const [newDoctorId, setNewDoctorId] = useState('');
  const [showNewConsult, setShowNewConsult] = useState(false);
  const [builderConsult, setBuilderConsult] = useState<ConsultationRequest | null>(null);
  const [mapModalConsult, setMapModalConsult] = useState<ConsultationRequest | null>(null);
  const [whatsAppRx, setWhatsAppRx]   = useState<DigitalPrescription | null>(null);
  const [localError, setLocalError]   = useState<string | null>(null);

  // Default to first available doctor
  useEffect(() => {
    if (!newDoctorId && db.doctors.length > 0) {
      const first = db.doctors.find(d => d.available) ?? db.doctors[0];
      setNewDoctorId(first.id);
    }
  }, [db.doctors, newDoctorId]);

  const errorMsg    = db.error || localError;
  const dismissError = () => setLocalError(null);

  /* ── Submit new consultation (growers only) ── */
  const handleRequestConsultation = async () => {
    if (!newDateTime || !newDoctorId) return;
    await db.requestConsultation({
      doctorId: newDoctorId,
      type: newType,
      targetDateTime: new Date(newDateTime).toISOString(),
      notes: newNotes,
      fieldId,
      orchardName,
    });
    setNewNotes('');
    setShowNewConsult(false);
  };

  /* ── Issue prescription ── */
  const handleIssueRx = async (payload: Parameters<typeof db.issueRx>[0]) => {
    await db.issueRx(payload);
    setBuilderConsult(null);
    setTab('prescriptions');
    const fresh = db.allPrescriptions.find(rx => rx.consultationId === payload.consultationId);
    if (fresh) setWhatsAppRx(fresh);
  };

  /* ── Execute prescription ── */
  const handleExecuteRx = async (rx: DigitalPrescription) => {
    await db.executeRx(rx.id);
    if (onExpenseLog) {
      onExpenseLog(
        rx.actionItems.map(item => ({
          category: item.category,
          productName: item.productName,
          dosage: item.dosage,
          estimatedCost: item.estimatedCost,
          prescriptionId: rx.id,
          doctorName: rx.doctorName,
          issuedAt: rx.issuedAt,
        }))
      );
    }
  };

  const availableDoctors = useMemo(() => db.doctors.filter(d => d.available), [db.doctors]);

  /* ═══ RENDER ════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Modals */}
      {whatsAppRx && (
        <WhatsAppModal
          message={buildWhatsAppMessage(whatsAppRx, resolvedGrowerName, resolvedGrowerPhone)}
          hospitalName={whatsAppRx.hospitalName}
          onClose={() => setWhatsAppRx(null)}
        />
      )}
      {builderConsult && db.myDoctorProfile && (
        <PrescriptionBuilder
          consultation={builderConsult}
          doctor={db.myDoctorProfile}
          mutating={db.mutating}
          onIssue={handleIssueRx}
          onCancel={() => setBuilderConsult(null)}
        />
      )}
      {mapModalConsult && db.growerFields[mapModalConsult.fieldId ?? ''] && (
        <OrchardMapModal
          field={db.growerFields[mapModalConsult.fieldId!]}
          growerName={mapModalConsult.growerName}
          onClose={() => setMapModalConsult(null)}
        />
      )}

      {/* ═══ SKUAST-STYLE HERO HEADER ════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-b-3xl shadow-2xl" style={{
        background: isDoctor
          ? 'linear-gradient(135deg,#1e3a5f,#1e40af,#1d4ed8,#2563eb,#3b82f6,#60a5fa,#3b82f6,#1d4ed8,#1e40af)'
          : 'linear-gradient(135deg,#064e3b,#065f46,#047857,#059669,#10b981,#34d399,#6ee7b7,#10b981,#047857)',
        backgroundSize: '300% 300%',
        animation: 'odGradShift 8s ease infinite',
      }}>
        <style>{`
          @keyframes odGradShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
          @keyframes odFadeUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
          @keyframes odFadeDown { from{opacity:0;transform:translateY(-18px)} to{opacity:1;transform:translateY(0)} }
          @keyframes odScaleIn { from{opacity:0;transform:scale(0.88)} to{opacity:1;transform:scale(1)} }
          @keyframes odLeafSway { 0%,100%{transform:rotate(-4deg)} 50%{transform:rotate(4deg)} }
          @keyframes odPulseRing { 0%{transform:scale(1);opacity:0.8} 100%{transform:scale(1.6);opacity:0} }
          @keyframes odShimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
          .od-fade-up  { animation: odFadeUp  0.6s cubic-bezier(.22,1,.36,1) both; }
          .od-fade-dn  { animation: odFadeDown 0.55s cubic-bezier(.22,1,.36,1) both; }
          .od-scale-in { animation: odScaleIn 0.5s cubic-bezier(.22,1,.36,1) both; }
          .od-leaf     { display:inline-block; animation:odLeafSway 3s ease-in-out infinite; transform-origin:bottom center; }
          .od-d0{animation-delay:0s} .od-d1{animation-delay:.08s} .od-d2{animation-delay:.16s}
          .od-d3{animation-delay:.24s} .od-d4{animation-delay:.32s}
          .od-pulse::before { content:''; position:absolute; inset:0; border-radius:50%;
            background:rgba(167,243,208,0.5); animation:odPulseRing 1.6s cubic-bezier(.215,.61,.355,1) infinite; }
          .od-shimmer-bar { background:linear-gradient(90deg,rgba(167,243,208,0.2) 25%,rgba(167,243,208,0.55) 50%,rgba(167,243,208,0.2) 75%); background-size:400px 100%; animation:odShimmer 2s ease-in-out infinite; }
          .od-blue-shimmer { background:linear-gradient(90deg,rgba(147,197,253,0.2) 25%,rgba(147,197,253,0.55) 50%,rgba(147,197,253,0.2) 75%); background-size:400px 100%; animation:odShimmer 2s ease-in-out infinite; }
        `}</style>

        {/* Shimmer top accent bar */}
        <div className={`h-1 w-full ${isDoctor ? 'od-blue-shimmer' : 'od-shimmer-bar'}`}/>
        {/* Decorative circles */}
        <div className="absolute -top-10 -left-10 w-52 h-52 rounded-full bg-white/5 pointer-events-none"/>
        <div className="absolute -bottom-12 -right-12 w-64 h-64 rounded-full bg-white/5 pointer-events-none"/>
        <div className="absolute top-6 right-24 w-20 h-20 rounded-full bg-white/8 pointer-events-none"/>
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ backgroundImage:'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize:'60px 60px' }} />

        <div className="relative px-6 py-9 sm:py-11 flex flex-col items-center text-center gap-4">
          {/* Live badge */}
          <div className="od-scale-in od-d0 inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full text-xs font-bold text-white/90 tracking-widest uppercase">
            <span className="relative inline-block w-2 h-2 rounded-full bg-white od-pulse" />
            {isDoctor ? 'Doctor Portal · Live' : 'Grower Portal · Live'}
          </div>

          {/* Title */}
          <h1 className="od-fade-up od-d2 text-3xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-xl leading-tight">
            <span className="od-leaf">🏥</span> Orchard Hospital
          </h1>

          {/* Subtitle */}
          <p className="od-fade-up od-d3 text-sm sm:text-base text-white/80 font-medium max-w-lg">
            {isDoctor
              ? `Dr. ${resolvedGrowerName} — Telehealth & Diagnosis Portal · Kashmir`
              : `Telehealth & Agronomist Dispatch · Grower: ${resolvedGrowerName}`}
          </p>

          {/* Field selector (Growers only) + Refresh */}
          <div className="od-fade-up od-d4 flex flex-wrap items-center gap-3 justify-center">
            {!isDoctor && !propFieldId && (
              <>
                {fieldsLoading ? (
                  <span className="text-white/70 text-xs flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Loading orchards…
                  </span>
                ) : userFields.length === 0 ? (
                  <span className="text-red-300 text-xs">No orchards found. Please create a field first.</span>
                ) : (
                  <select
                    value={selectedFieldId}
                    onChange={e => {
                      const chosen = userFields.find(f => f.id === e.target.value);
                      setSelectedFieldId(e.target.value);
                      setSelectedFieldName(chosen?.name ?? '');
                    }}
                    className="bg-white/15 border border-white/30 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm"
                  >
                    {userFields.map(f => (
                      <option key={f.id} value={f.id} className="text-slate-900 bg-white">{f.name}</option>
                    ))}
                  </select>
                )}
              </>
            )}
            {!isDoctor && (
              <button onClick={db.reload} disabled={db.loading} title="Refresh data"
                className="p-2 bg-white/15 hover:bg-white/25 border border-white/25 rounded-xl text-white transition disabled:opacity-40 backdrop-blur-sm">
                <RefreshCw className={`w-4 h-4 ${db.loading ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Pending Rx alert (growers only) */}
        {db.pendingRxCount > 0 && !isDoctor && (
          <div className="mx-6 mb-4 flex items-center gap-2 bg-red-500/90 rounded-xl px-4 py-2.5 border border-red-400/60 backdrop-blur-sm">
            <Bell className="w-4 h-4 text-white shrink-0" />
            <p className="text-white text-sm font-bold flex-1">
              {db.pendingRxCount} prescription{db.pendingRxCount > 1 ? 's' : ''} awaiting execution
            </p>
            <button onClick={() => setTab('prescriptions')} className="text-white text-xs underline flex items-center gap-1">
              View <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* ═══ TABS ════════════════════════════════════════════════════════ */}
      <div className="px-4 sm:px-6 pt-5">
        <div className="od-scale-in od-d2 flex gap-1 bg-white border border-gray-100 rounded-2xl p-1.5 shadow-sm overflow-x-auto">
          {/* Doctor tabs */}
          {isDoctor && (
            <>
              {([
                { key: 'consult',       label: 'Patient Queue',        icon: ClipboardList },
                { key: 'prescriptions', label: 'Issued Prescriptions', icon: FileText      },
              ] as const).map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  style={tab === t.key ? {background:'linear-gradient(135deg,#1e3a5f,#1d4ed8)',boxShadow:'0 4px 14px rgba(29,78,216,0.35)'} : {}}
                  className={`flex-1 min-w-fit flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                    tab === t.key ? 'text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-700'
                  }`}>
                  <t.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /><span>{t.label}</span>
                </button>
              ))}
            </>
          )}

          {/* Grower tabs */}
          {!isDoctor && (
            <>
              {([
                { key: 'consult',       label: 'Request Consult',  icon: MessageSquare },
                { key: 'prescriptions', label: 'My Prescriptions', icon: FileText      },
                { key: 'doctors',       label: 'Our Doctors',      icon: User          },
              ] as const).map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  style={tab === t.key ? {background:'linear-gradient(135deg,#15803d,#16a34a)',boxShadow:'0 4px 14px rgba(22,163,74,0.35)'} : {}}
                  className={`flex-1 min-w-fit flex items-center justify-center gap-1.5 py-2.5 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 relative ${
                    tab === t.key ? 'text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-green-700'
                  }`}>
                  <t.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span>{t.label}</span>
                  {t.key === 'prescriptions' && db.pendingRxCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                      {db.pendingRxCount}
                    </span>
                  )}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      <div className="px-4 sm:px-6 py-6 space-y-5">

        {/* Error banner */}
        {errorMsg && <ErrorBanner message={errorMsg} onDismiss={dismissError} />}

        {/* ══════════════════════════════════════════════════════════════
            DOCTOR PORTAL
        ══════════════════════════════════════════════════════════════ */}
        {portalMode === 'doctor' && (
          <>
            {db.myDoctorProfileLoading && (
              <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Checking doctor profile…</span>
              </div>
            )}

            {/* Fallback registration (if signup didn't create doctors row) */}
            {!db.myDoctorProfileLoading && !db.myDoctorProfile && (
              <DoctorRegistrationForm mutating={db.mutating} onRegister={db.registerAsDoctor} />
            )}

            {!db.myDoctorProfileLoading && db.myDoctorProfile && (
              <div className="space-y-5">
                <DoctorProfileCard
                  profile={db.myDoctorProfile}
                  mutating={db.mutating}
                  onToggleAvailable={() => db.updateMyDoctorProfile({ available: !db.myDoctorProfile!.available })}
                />

                {/* Patient Queue */}
                {tab === 'consult' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="font-extrabold text-gray-800 text-base">Patient Queue</h2>
                      <div className="flex items-center gap-2">
                        <Badge className="text-slate-700 bg-slate-100 border-slate-300">
                          {db.doctorConsultations.length} Request{db.doctorConsultations.length !== 1 ? 's' : ''}
                        </Badge>
                        <button onClick={() => db.reloadDoctorConsultations(db.myDoctorProfile!.id)}
                          disabled={db.doctorConsultationsLoading}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition">
                          <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${db.doctorConsultationsLoading ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {db.doctorConsultationsLoading ? (
                      <div className="flex items-center justify-center py-8 text-gray-400 gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </div>
                    ) : db.doctorConsultations.length === 0 ? (
                      <div className="text-center py-16 text-gray-400">
                        <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-medium">No requests assigned to you yet.</p>
                        <p className="text-xs mt-1 text-gray-300">Make sure your profile is set to Available.</p>
                      </div>
                    ) : (
                      db.doctorConsultations.map(c => {
                        const typeInfo   = CONSULT_TYPES.find(t => t.key === c.type)!;
                        const statusMeta = STATUS_META[c.status];
                        const TypeIcon   = typeInfo.icon;
                        const growerField = c.fieldId ? db.growerFields[c.fieldId] : undefined;
                        return (
                          <SectionCard key={c.id}>
                            <div className="px-5 py-4">
                              <div className="flex items-start justify-between gap-4 flex-wrap">
                                <div className="flex items-start gap-3">
                                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${typeInfo.color}`}>
                                    <TypeIcon className="w-4 h-4 text-white" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="font-bold text-gray-800">{c.growerName}</p>
                                      <Badge className={statusMeta.color}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                                        {statusMeta.label}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      {typeInfo.label} · {new Date(c.targetDateTime).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">Orchard: {c.orchardName}</p>
                                    {c.growerPhone && (
                                      <p className="text-xs text-gray-400 mt-0.5">Phone: {c.growerPhone}</p>
                                    )}
                                    {c.notes && (
                                      <p className="text-xs text-gray-700 bg-gray-100 rounded-lg px-2 py-1 mt-2 max-w-sm">{c.notes}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {c.status === 'REQUESTED' && (
                                    <button onClick={() => db.acceptRequest(c.id, db.myDoctorProfile!.id)} disabled={db.mutating}
                                      className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-bold transition">
                                      {db.mutating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                      Accept
                                    </button>
                                  )}
                                  {c.status === 'IN_PROGRESS' && !c.prescription && (
                                    <button onClick={() => setBuilderConsult(c)}
                                      className="flex items-center gap-1.5 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-900 hover:to-slate-800 text-white px-4 py-2 rounded-xl text-sm font-bold transition shadow">
                                      <FileText className="w-4 h-4" /> Write Prescription
                                    </button>
                                  )}
                                  {c.prescription && (
                                    <div className="flex items-center gap-2">
                                      <Badge className={RX_STATUS_META[c.prescription.status].color}>Rx Issued</Badge>
                                      <button onClick={() => setWhatsAppRx(c.prescription!)}
                                        className="flex items-center gap-1.5 border border-teal-500 text-teal-700 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-teal-50 transition">
                                        <Smartphone className="w-3.5 h-3.5" /> WhatsApp
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* ── View Orchard Map button ── */}
                              {c.fieldId && (
                                <div className="mt-3">
                                  {growerField ? (
                                    <button
                                      onClick={() => setMapModalConsult(c)}
                                      className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-4 py-2 rounded-xl text-sm font-bold transition shadow-sm shadow-emerald-200"
                                    >
                                      <Map className="w-4 h-4" />
                                      View Orchard Map
                                    </button>
                                  ) : (
                                    <div className="flex items-center gap-2 text-xs text-gray-400 border border-dashed border-gray-200 rounded-xl px-3 py-2 w-fit">
                                      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                                      <span>Loading orchard…</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </SectionCard>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Issued Prescriptions (doctor view) */}
                {tab === 'prescriptions' && (
                  <div className="space-y-4">
                    <h2 className="font-extrabold text-gray-800 text-base">Issued Prescriptions</h2>
                    {(() => {
                      const doctorRxs = db.doctorConsultations
                        .flatMap(c => c.prescription ? [c.prescription] : [])
                        .filter(rx => rx.doctorName === db.myDoctorProfile!.name);
                      return doctorRxs.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">
                          <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                          <p className="text-sm font-medium">No prescriptions issued yet.</p>
                        </div>
                      ) : (
                        doctorRxs.map(rx => (
                          <PrescriptionCard key={rx.id} rx={rx} mutating={db.mutating}
                            onExecute={() => handleExecuteRx(rx)}
                            onFlagCorrection={() => db.flagCorrection(rx.id)}
                            showWhatsApp={() => setWhatsAppRx(rx)}
                          />
                        ))
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════
            GROWER PORTAL
        ══════════════════════════════════════════════════════════════ */}
        {portalMode === 'grower' && (
          <>
            {/* Field loading skeleton */}
            {fieldsLoading && (
              <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading your orchards…</span>
              </div>
            )}

            {!fieldsLoading && !fieldId && (
              <div className="text-center py-16 text-gray-500">
                <Stethoscope className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No orchard found. Please create an orchard in the Fields page first.</p>
              </div>
            )}

            {!fieldsLoading && fieldId && (
              <>
                {db.loading && (
                  <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Loading from Supabase...</span>
                  </div>
                )}

                {!db.loading && (
                  <>
                    {/* ═══ GROWER — REQUEST CONSULTATION ═══════════════════════ */}
                    {tab === 'consult' && (
                      <div className="space-y-5">
                        <SectionCard>
                          <div className="px-6 py-5">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h2 className="font-extrabold text-gray-800 text-base">Request a Consultation</h2>
                                <p className="text-xs text-gray-500 mt-0.5">Connect with a certified Agronomist instantly</p>
                              </div>
                              {!showNewConsult && (
                                <button onClick={() => setShowNewConsult(true)} disabled={availableDoctors.length === 0}
                                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition shadow disabled:opacity-40">
                                  <Plus className="w-4 h-4" /> New Request
                                </button>
                              )}
                            </div>

                            {!db.doctorsLoading && db.doctors.length === 0 && (
                              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
                                <Stethoscope className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">No doctors have registered yet.</p>
                              </div>
                            )}

                            {db.doctors.length > 0 && (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                {CONSULT_TYPES.map(t => {
                                  const Icon = t.icon;
                                  const selected = newType === t.key;
                                  return (
                                    <button key={t.key}
                                      onClick={() => { setNewType(t.key); setShowNewConsult(true); }}
                                      className={`flex flex-col items-center gap-2 py-4 rounded-2xl border-2 font-semibold text-sm transition ${
                                        selected
                                          ? `bg-gradient-to-br ${t.color} text-white border-transparent shadow-lg -translate-y-1`
                                          : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                      }`}
                                    >
                                      <Icon className={`w-6 h-6 ${selected ? 'text-white' : 'text-gray-500'}`} />
                                      <span>{t.label}</span>
                                      <span className={`text-xs ${selected ? 'text-white/75' : 'text-gray-400'}`}>{t.desc}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {showNewConsult && (
                              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4 mt-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-xs text-gray-500 block mb-1">Preferred Date & Time</label>
                                    <input type="datetime-local" className="border rounded-xl px-3 py-2.5 text-sm w-full"
                                      value={newDateTime} onChange={e => setNewDateTime(e.target.value)} />
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-500 block mb-1">Select Doctor</label>
                                    {db.doctorsLoading ? (
                                      <div className="flex items-center gap-2 text-gray-400 text-sm py-2.5">
                                        <Loader2 className="w-4 h-4 animate-spin" /> Loading doctors…
                                      </div>
                                    ) : availableDoctors.length === 0 ? (
                                      <p className="text-red-500 text-xs py-2.5">No doctors available right now.</p>
                                    ) : (
                                      <select className="border rounded-xl px-3 py-2.5 text-sm w-full bg-white"
                                        value={newDoctorId} onChange={e => setNewDoctorId(e.target.value)}>
                                        {availableDoctors.map(d => (
                                          <option key={d.id} value={d.id}>{d.name} — {d.specialization}</option>
                                        ))}
                                      </select>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500 block mb-1">Describe the Issue</label>
                                  <textarea rows={2} className="border rounded-xl px-3 py-2.5 text-sm w-full"
                                    placeholder="Describe symptoms, affected area, urgency..."
                                    value={newNotes} onChange={e => setNewNotes(e.target.value)} />
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={handleRequestConsultation} disabled={db.mutating || !newDoctorId}
                                    className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-900 disabled:opacity-50 transition">
                                    {db.mutating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    Submit Request
                                  </button>
                                  <button onClick={() => setShowNewConsult(false)}
                                    className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </SectionCard>

                        {db.consultations.length > 0 && (
                          <SectionCard>
                            <div className="px-6 py-5">
                              <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide mb-4">My Consultation Requests</h3>
                              <div className="space-y-3">
                                {db.consultations.map(c => {
                                  const doctor     = db.doctors.find(d => d.id === c.doctorId);
                                  const typeInfo   = CONSULT_TYPES.find(t => t.key === c.type)!;
                                  const statusMeta = STATUS_META[c.status];
                                  const TypeIcon   = typeInfo.icon;
                                  return (
                                    <div key={c.id} className="flex items-start justify-between border border-gray-200 rounded-xl px-4 py-3 hover:bg-gray-50 transition">
                                      <div className="flex items-start gap-3">
                                        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${typeInfo.color}`}>
                                          <TypeIcon className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                          <p className="font-bold text-sm text-gray-800">{typeInfo.label}</p>
                                          <p className="text-xs text-gray-500">
                                            {new Date(c.targetDateTime).toLocaleString()} · {doctor?.name || 'Unassigned'}
                                          </p>
                                          {c.notes && <p className="text-xs text-gray-600 mt-0.5 max-w-xs truncate">{c.notes}</p>}
                                          {c.prescription && (
                                            <button onClick={() => setTab('prescriptions')}
                                              className="mt-1 text-xs font-bold text-slate-700 underline flex items-center gap-1">
                                              <FileText className="w-3 h-3" /> View Prescription
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                      <Badge className={statusMeta.color}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                                        {statusMeta.label}
                                      </Badge>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </SectionCard>
                        )}

                        {db.consultations.length === 0 && db.doctors.length > 0 && (
                          <div className="text-center py-16 text-gray-400">
                            <Stethoscope className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p className="text-sm font-medium">No consultations yet. Request your first one above.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ═══ GROWER — MY PRESCRIPTIONS ═══════════════════════ */}
                    {tab === 'prescriptions' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h2 className="font-extrabold text-gray-800 text-base">My Digital Prescriptions</h2>
                          <Badge className="text-gray-600 bg-gray-100 border-gray-200">{db.allPrescriptions.length} Total</Badge>
                        </div>
                        {db.allPrescriptions.length === 0 ? (
                          <div className="text-center py-16 text-gray-400">
                            <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p className="text-sm font-medium">No prescriptions issued yet. Request a consultation first.</p>
                          </div>
                        ) : (
                          db.allPrescriptions.map(rx => (
                            <PrescriptionCard key={rx.id} rx={rx} mutating={db.mutating}
                              onExecute={() => handleExecuteRx(rx)}
                              onFlagCorrection={() => db.flagCorrection(rx.id)}
                              showWhatsApp={() => setWhatsAppRx(rx)}
                            />
                          ))
                        )}
                      </div>
                    )}

                    {/* ═══ GROWER — OUR DOCTORS ════════════════════════════ */}
                    {tab === 'doctors' && (
                      <div className="space-y-4">
                        <h2 className="font-extrabold text-gray-800 text-base">Certified Agronomists</h2>
                        {db.doctorsLoading && (
                          <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="text-sm">Loading doctors…</span>
                          </div>
                        )}
                        {!db.doctorsLoading && db.doctors.length === 0 && (
                          <div className="text-center py-16 text-gray-400">
                            <Stethoscope className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p className="text-sm font-medium">No doctors registered yet.</p>
                          </div>
                        )}
                        {!db.doctorsLoading && db.doctors.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {db.doctors.map(doctor => (
                              <div key={doctor.id} className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden">
                                <div className="bg-gradient-to-br from-slate-700 to-slate-900 px-5 py-6 text-center">
                                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                                    <Stethoscope className="w-8 h-8 text-white" />
                                  </div>
                                  <p className="text-white font-extrabold">{doctor.name}</p>
                                  <p className="text-slate-300 text-xs mt-1">{doctor.specialization}</p>
                                </div>
                                <div className="px-5 py-4 space-y-3">
                                  <div className="flex items-center text-sm text-gray-500 gap-1">
                                    <Building2 className="w-3.5 h-3.5" />{doctor.hospitalName}
                                  </div>
                                  {doctor.bio && <p className="text-xs text-gray-500 line-clamp-2">{doctor.bio}</p>}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1 text-amber-500 text-sm font-bold">
                                      {'★'.repeat(Math.min(5, Math.round(doctor.rating)))}
                                      <span className="text-gray-600 font-normal ml-1">{doctor.rating.toFixed(1)}</span>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${doctor.available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                      {doctor.available ? '● Available' : '○ Unavailable'}
                                    </span>
                                  </div>
                                  {doctor.available && (
                                    <button onClick={() => { setNewDoctorId(doctor.id); setTab('consult'); setShowNewConsult(true); }}
                                      className="w-full bg-slate-800 text-white py-2 rounded-xl text-sm font-bold hover:bg-slate-900 transition">
                                      Request Consultation
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* ═══ STATS FOOTER ════════════════════════════════════════════════ */}
      <div className="mx-6 mb-6 mt-2 bg-slate-800 rounded-2xl px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        {(isDoctor ? [
          { label: 'My Patients',   value: db.doctorConsultations.length,                                                 color: 'text-sky-400'    },
          { label: 'In Progress',   value: db.doctorConsultations.filter(c => c.status === 'IN_PROGRESS').length,         color: 'text-blue-400'   },
          { label: 'Completed',     value: db.doctorConsultations.filter(c => c.status === 'COMPLETED').length,           color: 'text-green-400'  },
          { label: 'Doctors Online',value: db.doctors.filter(d => d.available).length,                                    color: 'text-purple-400' },
        ] : [
          { label: 'Total Requests', value: db.consultations.length,                                             color: 'text-sky-400'    },
          { label: 'In Progress',    value: db.consultations.filter(c => c.status === 'IN_PROGRESS').length,     color: 'text-blue-400'   },
          { label: 'Prescriptions',  value: db.allPrescriptions.length,                                          color: 'text-purple-400' },
          { label: 'Doctors Online', value: db.doctors.filter(d => d.available).length,                          color: 'text-green-400'  },
        ]).map(stat => (
          <div key={stat.label}>
            <p className={`text-xl font-extrabold ${stat.color}`}>{stat.value}</p>
            <p className="text-slate-400 text-xs mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
