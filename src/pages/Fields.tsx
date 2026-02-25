
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { kml as kmlToGeoJSON } from '@tmcw/togeojson';
import { Plus, Search, ListFilter as Filter, X } from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import type { Field } from '../types';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

/* ─── SkuastAdvisory-style Glass + Animation CSS ─── */
const FIELDS_STYLES = `
@keyframes fldFadeUp {
  from { opacity:0; transform:translateY(24px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes fldFadeDown {
  from { opacity:0; transform:translateY(-18px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes fldScaleIn {
  from { opacity:0; transform:scale(0.90); }
  to   { opacity:1; transform:scale(1); }
}
@keyframes fldSlideRight {
  from { opacity:0; transform:translateX(-20px); }
  to   { opacity:1; transform:translateX(0); }
}
@keyframes fldGlow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.25); }
  50%       { box-shadow: 0 0 0 12px rgba(34,197,94,0); }
}
@keyframes fldPulseRing {
  0%   { transform:scale(1);   opacity:0.8; }
  100% { transform:scale(1.7); opacity:0; }
}
@keyframes fldShimmer {
  0%   { background-position: -400px 0; }
  100% { background-position:  400px 0; }
}
@keyframes fldLeafSway {
  0%, 100% { transform: rotate(-4deg); }
  50%       { transform: rotate(4deg); }
}
@keyframes fldHeaderGradient {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes fldFloat {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-8px); }
}

.fld-fade-up   { animation: fldFadeUp     0.6s cubic-bezier(.22,1,.36,1) both; }
.fld-fade-down { animation: fldFadeDown   0.55s cubic-bezier(.22,1,.36,1) both; }
.fld-scale-in  { animation: fldScaleIn    0.5s  cubic-bezier(.22,1,.36,1) both; }
.fld-slide-r   { animation: fldSlideRight 0.5s  cubic-bezier(.22,1,.36,1) both; }
.fld-glow      { animation: fldGlow 2.8s ease-in-out infinite; }
.fld-float     { animation: fldFloat 3.5s ease-in-out infinite; }

.fld-d0  { animation-delay:0s;    }
.fld-d1  { animation-delay:.08s;  }
.fld-d2  { animation-delay:.16s;  }
.fld-d3  { animation-delay:.24s;  }
.fld-d4  { animation-delay:.32s;  }
.fld-d5  { animation-delay:.40s;  }
.fld-d6  { animation-delay:.48s;  }
.fld-d7  { animation-delay:.56s;  }

/* Animated gradient header banner — identical to SkuastAdvisory */
.fld-header-banner {
  background: linear-gradient(135deg, #064e3b, #065f46, #047857, #059669, #10b981, #34d399, #6ee7b7, #10b981, #047857);
  background-size: 300% 300%;
  animation: fldHeaderGradient 8s ease infinite;
}

/* Glass card — signature SkuastAdvisory treatment */
.fld-glass-card {
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.6);
  box-shadow: 0 4px 24px rgba(34,197,94,0.07), 0 1px 3px rgba(0,0,0,0.04);
  transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease;
}
.fld-glass-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 16px 40px rgba(34,197,94,0.16);
  border-color: #86efac;
}

/* Field card premium */
.fld-field-card {
  background: white;
  border: 1.5px solid #e5e7eb;
  transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease;
  position: relative;
  overflow: hidden;
}
.fld-field-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, #10b981, #059669, #34d399);
  opacity: 0;
  transition: opacity .22s ease;
}
.fld-field-card:hover::before { opacity: 1; }
.fld-field-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 16px 40px rgba(34,197,94,0.14);
  border-color: #6ee7b7;
}

/* Pulse indicator like SkuastAdvisory */
.fld-pulse::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(34,197,94,0.5);
  animation: fldPulseRing 1.6s cubic-bezier(.215,.61,.355,1) infinite;
}

/* Leaf icon sway */
.fld-leaf {
  display: inline-block;
  animation: fldLeafSway 3s ease-in-out infinite;
  transform-origin: bottom center;
}

/* Shimmer loader */
.fld-shimmer {
  background: linear-gradient(90deg, #f0fdf4 25%, #dcfce7 50%, #f0fdf4 75%);
  background-size: 400px 100%;
  animation: fldShimmer 1.4s ease-in-out infinite;
}

/* Input focus */
.fld-input {
  transition: border-color .18s ease, box-shadow .18s ease, background .18s ease;
}
.fld-input:focus {
  border-color: #16a34a !important;
  box-shadow: 0 0 0 3px rgba(22,163,74,0.15);
  background: #f0fdf4;
  outline: none;
}

/* Step button */
.fld-step-btn {
  transition: background .18s ease, color .18s ease, box-shadow .18s ease;
}
.fld-step-btn.active {
  background: linear-gradient(135deg, #15803d, #16a34a);
  color: white;
  box-shadow: 0 4px 14px rgba(22,163,74,0.35);
}

/* Soil image button */
.fld-soil-btn {
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
}
.fld-soil-btn:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 10px 28px rgba(34,197,94,0.18);
}

/* Row card */
.fld-row-card {
  transition: box-shadow .2s ease, border-color .2s ease;
}
.fld-row-card:hover {
  box-shadow: 0 4px 18px rgba(34,197,94,0.10);
  border-color: #86efac;
}

/* Variety pill */
.fld-variety-pill {
  transition: transform .15s ease, box-shadow .15s ease;
}
.fld-variety-pill:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(0,0,0,0.10);
}

/* Search bar */
.fld-search-wrap { position: relative; }
.fld-search-wrap:focus-within .fld-search-icon { color: #16a34a; }

/* Stat mini card */
.fld-stat {
  background: white;
  border: 1px solid #f3f4f6;
  transition: transform .2s ease, box-shadow .2s ease;
}
.fld-stat:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(34,197,94,0.12);
}
`;

const soilOptions = [
  { name: 'Sandy',      image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=60' },
  { name: 'Sandy Clay', image: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=600&q=60' },
  { name: 'Sandy Loam', image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=600&q=60' },
  { name: 'Silt Loam',  image: 'https://images.unsplash.com/photo-1476041800959-2f6bb412c8ce?auto=format&fit=crop&w=600&q=60' },
  { name: 'Heavy Clay', image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=600&q=60' },
  { name: 'Silt Clay',  image: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&w=600&q=60' },
];

const orchardTypes = ['High Density', 'Medium Density', 'Traditional', 'All'];
const KANAL_SQM = 505.857;

type AppleVariety = { name: string; role: 'pollinator' | 'main' | 'both'; description: string; };

const traditionalVarieties: AppleVariety[] = [
  { name: 'Red Delicious / Delicious',          role: 'both',      description: '🌸 Pollinator + Main variety' },
  { name: 'American Apple',                     role: 'main',      description: '🌳 Main (needs pollinator)' },
  { name: 'Maharaji',                           role: 'main',      description: '🌳 Main (needs pollinator)' },
  { name: 'Ambri',                              role: 'both',      description: '🌸 Pollinator + Main variety' },
  { name: 'Kashmir Golden / Golden Delicious',  role: 'pollinator',description: '🌸 Excellent Pollinator' },
  { name: 'Hazratbali',                         role: 'main',      description: '🌳 Main (needs pollinator)' },
  { name: 'Razakwari / Chemora',                role: 'main',      description: '🌳 Main (needs pollinator)' },
  { name: 'Kullu Delicious',                    role: 'main',      description: '🌳 Main (needs pollinator)' },
  { name: 'Kinnaur',                            role: 'main',      description: '🌳 Main (needs pollinator)' },
];

const highDensityVarieties: AppleVariety[] = [
  { name: 'Jeromine',                   role: 'main',      description: '🌳 Main (needs pollinator)' },
  { name: 'King Roat',                  role: 'main',      description: '🌳 Main (needs pollinator)' },
  { name: 'Gala Scarlet / Redlum Gala', role: 'both',      description: '🌸 Pollinator + Main variety' },
  { name: 'Red Velox',                  role: 'main',      description: '🌳 Main (needs pollinator)' },
  { name: 'Scarlet Spur-II',            role: 'pollinator',description: '🌸 Good Pollinator' },
  { name: 'Super Chief',                role: 'both',      description: '🌸 Pollinator + Main variety' },
  { name: 'Auvi Fuji',                  role: 'main',      description: '🌳 Main (needs pollinator)' },
  { name: 'Pink Lady',                  role: 'main',      description: '🌳 Main (needs pollinator)' },
];

type VarietyTreeRow = { variety: string; totalTrees: string; orchardType?: string; };
type TreeTag = { id: string; name: string; variety: string; rowNumber: string; latitude: number; longitude: number; };
type OrchardForm = {
  name: string; orchardType: string; areaKanal: string; totalTrees: string;
  numberOfRows: string; treesPerRow: string; ageYears: string; pollinatorType: string;
  varietyTrees: VarietyTreeRow[];
  rows: Array<{ rowId: string; varieties: Array<{ variety: string; trees: string }> }>;
  soilType: string; unknownSoil: boolean; pincode: string; district: string;
  tehsil: string; state: string; region: string; country: string; zone: string;
  fullAddress: string; latitude?: number; longitude?: number;
  boundaryPath: Array<{ lat: number; lng: number }>; mapAreaKanal?: number; treeTags: TreeTag[];
};

const createInitialForm = (): OrchardForm => ({
  name: '', orchardType: '', areaKanal: '', totalTrees: '', numberOfRows: '', treesPerRow: '',
  ageYears: '', pollinatorType: '', varietyTrees: [{ variety: '', totalTrees: '' }], rows: [],
  soilType: '', unknownSoil: false, pincode: '', district: '', tehsil: '', state: '',
  region: '', country: '', zone: '', fullAddress: '', latitude: undefined, longitude: undefined,
  boundaryPath: [], mapAreaKanal: undefined, treeTags: [],
});

const varietyPalette = ['#22c55e', '#f97316', '#3b82f6', '#e11d48', '#a855f7', '#14b8a6'];
const getVarietyColor = (variety: string) => {
  if (!variety) return '#6b7280';
  const hash = variety.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return varietyPalette[hash % varietyPalette.length];
};

const Fields = () => {
  /* ── Row/variety handlers ── */
  const handleAddRow = () => {
    setFormData((prev) => ({
      ...prev,
      rows: [...(prev.rows || []), { rowId: String((prev.rows?.length || 0) + 1), varieties: [{ variety: '', trees: '' }] }],
    }));
  };
  const handleRemoveRow = (rowIndex: number) => {
    setFormData((prev) => ({ ...prev, rows: (prev.rows || []).filter((_: any, idx: number) => idx !== rowIndex) }));
  };
  const handleAddVarietyToRow = (rowIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      rows: (prev.rows || []).map((row: any, idx: number) =>
        idx === rowIndex ? { ...row, varieties: [...row.varieties, { variety: '', trees: '' }] } : row
      ),
    }));
  };
  const handleRemoveVarietyFromRow = (rowIndex: number, varietyIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      rows: (prev.rows || []).map((row: any, idx: number) =>
        idx === rowIndex ? { ...row, varieties: row.varieties.filter((_: any, vIdx: number) => vIdx !== varietyIndex) } : row
      ),
    }));
  };
  const handleRowVarietyChange = (rowIndex: number, varietyIndex: number, field: 'variety' | 'trees', value: string) => {
    setFormData((prev) => ({
      ...prev,
      rows: (prev.rows || []).map((row: any, rIdx: number) =>
        rIdx === rowIndex
          ? { ...row, varieties: row.varieties.map((v: any, vIdx: number) => vIdx === varietyIndex ? { ...v, [field]: value } : v) }
          : row
      ),
    }));
  };

  /* ── Edit logic ── */
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const populateFormForEdit = (field: Field) => {
    const details = (field as any).details ?? null;
    if (details) {
      setFormData((prev) => ({
        ...prev, ...details,
        name: details.name || field.name || prev.name,
        orchardType: details.orchardType || prev.orchardType,
        areaKanal: details.areaKanal || field.area?.toString() || prev.areaKanal,
        ageYears: details.ageYears || prev.ageYears,
        pollinatorType: details.pollinatorType || prev.pollinatorType || '',
        varietyTrees: (details.varietyTrees && details.varietyTrees.length > 0) ? details.varietyTrees : (prev.varietyTrees && prev.varietyTrees.length > 0 ? prev.varietyTrees : [{ variety: '', totalTrees: '' }]),
        rows: (details.rows && details.rows.length > 0) ? details.rows : (prev.rows && prev.rows.length > 0 ? prev.rows : []),
        soilType: details.soilType || field.soilType || prev.soilType,
        unknownSoil: details.unknownSoil ?? prev.unknownSoil,
        pincode: details.pincode || prev.pincode,
        district: details.district || field.location || prev.district || '',
        tehsil: details.tehsil || prev.tehsil || '',
        state: details.state || prev.state || '',
        region: details.region || prev.region || '',
        country: details.country || prev.country || '',
        zone: details.zone || prev.zone || '',
        fullAddress: details.fullAddress || prev.fullAddress || '',
        latitude: details.latitude ?? field.latitude ?? prev.latitude,
        longitude: details.longitude ?? field.longitude ?? prev.longitude,
        boundaryPath: details.boundaryPath?.length ? details.boundaryPath : (field.boundaryPath ?? prev.boundaryPath),
        mapAreaKanal: details.mapAreaKanal ?? prev.mapAreaKanal,
        treeTags: (details.treeTags && details.treeTags.length > 0) ? details.treeTags : (prev.treeTags && prev.treeTags.length > 0 ? prev.treeTags : []),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        name: field.name || prev.name,
        orchardType: prev.orchardType,
        areaKanal: field.area?.toString() ?? prev.areaKanal,
        soilType: field.soilType || prev.soilType,
        unknownSoil: prev.unknownSoil,
        district: field.location || prev.district || '',
        latitude: field.latitude ?? prev.latitude,
        longitude: field.longitude ?? prev.longitude,
        boundaryPath: field.boundaryPath ?? prev.boundaryPath,
      }));
    }
  };
  const openWizardForEdit = (field: Field) => {
    setEditingFieldId(field.id); populateFormForEdit(field); setWizardOpen(true); setWizardStep(1);
  };
  const handleUpdateField = async () => {
    if (!session?.user || !editingFieldId) return;
    setFieldsError(null);
    let fieldLat = formData.latitude ?? 33.7782;
    let fieldLng = formData.longitude ?? 76.5762;
    if (formData.boundaryPath && formData.boundaryPath.length > 0) {
      let lat = 0, lng = 0;
      formData.boundaryPath.forEach(p => { lat += p.lat; lng += p.lng; });
      fieldLat = lat / formData.boundaryPath.length; fieldLng = lng / formData.boundaryPath.length;
    }
    const payload = {
      name: formData.name || 'Orchard', area: Number(formData.areaKanal) || 0,
      soil_type: formData.soilType || 'Unknown', crop_stage: 'Growing', health_status: 'Good',
      location: formData.district || formData.zone || 'Unknown',
      planted_date: new Date().toISOString().slice(0, 10),
      latitude: fieldLat, longitude: fieldLng,
      boundary_path: formData.boundaryPath.length > 0 ? formData.boundaryPath : null,
      details: formData,
    };
    const { data, error } = await supabase.from('fields').update(payload).eq('id', editingFieldId)
      .select('id, name, area, soil_type, crop_stage, health_status, location, planted_date, latitude, longitude, boundary_path, details').single();
    if (error) { setFieldsError(error.message); return; }
    if (data) {
      const updated: Field = {
        id: data.id, name: data.name, area: data.area ?? 0, soilType: data.soil_type ?? 'Unknown',
        cropStage: data.crop_stage ?? 'Growing', healthStatus: data.health_status ?? 'Good',
        location: data.location ?? 'Unknown', plantedDate: data.planted_date ?? '',
        latitude: data.latitude ?? undefined, longitude: data.longitude ?? undefined,
        boundaryPath: data.boundary_path ?? undefined, details: formData,
      };
      setFields((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    }
    resetWizard();
  };

  useEffect(() => {
    if (!(window as any).toGeoJSON) {
      const script = document.createElement('script');
      script.src = '/toGeoJSON.js'; script.async = true; document.body.appendChild(script);
    }
  }, []);

  const handleDeleteField = async (field: Field) => {
    if (!window.confirm(`Are you sure you want to delete "${field.name}"?`)) return;
    const { error } = await supabase.from('fields').delete().eq('id', field.id);
    if (!error) setFields((prev) => prev.filter((f) => f.id !== field.id));
    else alert('Failed to delete field.');
  };

  const navigate = useNavigate();
  const { session } = useAuth();
  const [searchTerm, setSearchTerm]           = useState('');
  const [fields, setFields]                   = useState<Field[]>([]);
  const [fieldsLoading, setFieldsLoading]     = useState(false);
  const [fieldsError, setFieldsError]         = useState<string | null>(null);
  const [wizardOpen, setWizardOpen]           = useState(false);
  const [wizardStep, setWizardStep]           = useState(1);
  const [soilGuideOpen, setSoilGuideOpen]     = useState(false);
  const [formData, setFormData]               = useState<OrchardForm>(createInitialForm());
  const [pincodeLoading, setPincodeLoading]   = useState(false);
  const [pincodeError, setPincodeError]       = useState<string | null>(null);
  const [mapsLoaded, setMapsLoaded]           = useState(false);
  const [mapsError, setMapsError]             = useState<string | null>(null);
  const [taggingMode, setTaggingMode]         = useState(false);
  const [tagFormOpen, setTagFormOpen]         = useState(false);
  const [pendingTagLocation, setPendingTagLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedTreeId, setSelectedTreeId]   = useState<string | null>(null);
  const [tagFormData, setTagFormData]         = useState({ name: '', variety: '', rowNumber: '' });

  // All tree_tags from Supabase (keyed by field_id → list of tags)
  const [fieldTreeTags, setFieldTreeTags] = useState<Record<string, Array<{
    id: string; name: string | null; variety: string | null; rowNumber: number | null; latitude: number; longitude: number;
  }>>>({});

  // Scouting snapshots for all tree_tags
  const [treeHealthSnapshots, setTreeHealthSnapshots] = useState<Record<string, {
    healthStatus: string; lastScoutedAt: string | null; lastPestName: string | null;
    lastSeverityScore: number; totalObservations: number; etlAction: string; riskScore: number;
  }>>({});
  const [scoutingModal, setScoutingModal] = useState<null | {
    tag: TreeTag;
    snapshot: { healthStatus: string; lastScoutedAt: string | null; lastPestName: string | null;
      lastSeverityScore: number; totalObservations: number; etlAction: string; riskScore: number; } | null;
    recentObs: Array<{ pestName: string; severityScore: number; notes: string; scoutedAt: string; affectedPart: string; }>;
    loading: boolean;
  }>(null);

  const getScoutingHealthMeta = (status: string) => {
    const s = (status ?? '').toUpperCase();
    if (s === 'HEALTHY')  return { label: 'Healthy',  dot: '#22c55e', badge: 'bg-emerald-100 text-emerald-700', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' };
    if (s === 'STRESSED') return { label: 'Stressed', dot: '#f59e0b', badge: 'bg-amber-100 text-amber-700',    text: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200' };
    if (s === 'INFECTED') return { label: 'Infected', dot: '#f97316', badge: 'bg-orange-100 text-orange-700', text: 'text-orange-700',  bg: 'bg-orange-50',  border: 'border-orange-200' };
    if (s === 'CRITICAL') return { label: 'Critical', dot: '#ef4444', badge: 'bg-red-100 text-red-700',       text: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200' };
    return { label: 'Unknown', dot: '#9ca3af', badge: 'bg-gray-100 text-gray-600', text: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' };
  };

  const handleOpenScoutingModal = async (tag: TreeTag) => {
    const snapshot = treeHealthSnapshots[tag.id] ?? null;
    setScoutingModal({ tag, snapshot, recentObs: [], loading: true });
    const { data } = await supabase
      .from('tree_scouting_observations')
      .select('pest_name, severity_score, notes, scouted_at, affected_part')
      .eq('tree_tag_id', tag.id)
      .order('scouted_at', { ascending: false })
      .limit(5);
    setScoutingModal(prev => prev ? {
      ...prev,
      recentObs: (data ?? []).map((r: any) => ({
        pestName: r.pest_name ?? 'Unknown', severityScore: r.severity_score ?? 0,
        notes: r.notes ?? '', scoutedAt: r.scouted_at, affectedPart: r.affected_part ?? '',
      })),
      loading: false,
    } : null);
  };

  const mapContainerRef   = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef    = useRef<any>(null);
  const polygonRef        = useRef<any>(null);
  const drawingManagerRef = useRef<any>(null);
  const kmlLayerRef       = useRef<any>(null);
  const kmlObjectUrlRef   = useRef<string | null>(null);
  const treeMarkersRef    = useRef<any[]>([]);
  const taggingModeRef    = useRef(false);

  const apiKey = (import.meta.env.VITE_GOOGLE_API_KEY as string | undefined) || '';

  const getAvailableVarieties = (): AppleVariety[] => {
    if (!formData.orchardType) return [...traditionalVarieties, ...highDensityVarieties];
    if (formData.orchardType === 'Traditional') return traditionalVarieties;
    if (formData.orchardType === 'High Density') return highDensityVarieties;
    return [...traditionalVarieties, ...highDensityVarieties];
  };
  const getPollinatorsForOrchard = () => getAvailableVarieties().filter((v) => v.role === 'pollinator' || v.role === 'both');

  const getHealthStatusBadge = (status: string) => {
    switch (status) {
      case 'Excellent': return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'Good':      return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'Fair':      return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'Poor':      return 'bg-red-100 text-red-800 border border-red-200';
      default:          return 'bg-gray-100 text-gray-600 border border-gray-200';
    }
  };
  const getHealthDotColor = (status: string) => {
    switch (status) {
      case 'Excellent': return '#10b981';
      case 'Good':      return '#3b82f6';
      case 'Fair':      return '#f59e0b';
      case 'Poor':      return '#ef4444';
      default:          return '#9ca3af';
    }
  };

  const filteredFields = useMemo(() =>
    fields.filter((f) =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.location.toLowerCase().includes(searchTerm.toLowerCase())
    ), [fields, searchTerm]);

  useEffect(() => {
    if (formData.unknownSoil) setFormData((prev) => ({ ...prev, soilType: 'Unknown' }));
  }, [formData.unknownSoil]);

  useEffect(() => { taggingModeRef.current = taggingMode; }, [taggingMode]);

  useEffect(() => {
    const load = async () => {
      if (!session?.user) { setFields([]); setFieldsLoading(false); return; }
      setFieldsLoading(true); setFieldsError(null);
      const { data, error } = await supabase.from('fields')
        .select('id, name, area, soil_type, crop_stage, health_status, location, planted_date, latitude, longitude, boundary_path, details')
        .eq('user_id', session.user.id);
      if (error) { setFieldsError(error.message); setFieldsLoading(false); return; }
      setFields((data ?? []).map((row: any) => ({
        id: row.id, name: row.name, area: row.area ?? 0, soilType: row.soil_type ?? 'Unknown',
        cropStage: row.crop_stage ?? 'Growing', healthStatus: row.health_status ?? 'Good',
        location: row.location ?? 'Unknown', plantedDate: row.planted_date ?? '',
        latitude: row.latitude ?? undefined, longitude: row.longitude ?? undefined,
        boundaryPath: row.boundary_path ?? undefined, details: row.details ?? undefined,
      })));
      setFieldsLoading(false);
    };
    load();
  }, [session?.user]);

  // Fetch tree_tags + scouting health snapshots for all tagged trees of this user
  useEffect(() => {
    if (!session?.user) return;
    const fetchData = async () => {
      const [tagsRes, snapRes] = await Promise.all([
        supabase.from('tree_tags').select('id, field_id, name, variety, row_number, latitude, longitude').eq('user_id', session.user.id),
        supabase.from('tree_health_snapshots').select('tree_tag_id, health_status, last_scouted_at, last_pest_eppo, last_severity_score, total_observations, etl_action, risk_score').eq('user_id', session.user.id),
      ]);

      // Group tree_tags by field_id
      const tagsMap: Record<string, any[]> = {};
      (tagsRes.data ?? []).forEach((r: any) => {
        const fid = r.field_id;
        if (!tagsMap[fid]) tagsMap[fid] = [];
        tagsMap[fid].push({ id: r.id, name: r.name, variety: r.variety, rowNumber: r.row_number, latitude: r.latitude, longitude: r.longitude });
      });
      setFieldTreeTags(tagsMap);

      // Index snapshots by tree_tag_id
      const snapMap: Record<string, any> = {};
      (snapRes.data ?? []).forEach((r: any) => {
        snapMap[r.tree_tag_id] = {
          healthStatus: r.health_status ?? 'HEALTHY', lastScoutedAt: r.last_scouted_at ?? null,
          lastPestName: r.last_pest_eppo ?? null, lastSeverityScore: r.last_severity_score ?? 0,
          totalObservations: r.total_observations ?? 0, etlAction: r.etl_action ?? 'NO_ACTION', riskScore: r.risk_score ?? 0,
        };
      });
      setTreeHealthSnapshots(snapMap);
    };
    fetchData();
  }, [session?.user]);

  useEffect(() => {
    if (formData.pincode.trim().length !== 6) { setPincodeError(null); return; }
    const controller = new AbortController();
    const go = async () => {
      setPincodeLoading(true); setPincodeError(null);
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${formData.pincode}`, { signal: controller.signal });
        const data = await res.json();
        const po = data?.[0]?.PostOffice?.[0];
        if (po?.District) {
          setFormData((prev) => ({
            ...prev,
            district: po.District ?? prev.district, state: po.State ?? prev.state,
            country: po.Country ?? prev.country, region: po.Region ?? po.Division ?? prev.region,
            tehsil: po.Taluk ?? po.Block ?? prev.tehsil, zone: po.Circle ?? prev.zone,
          }));
        } else setPincodeError('No district found for this pincode.');
      } catch { if (!controller.signal.aborted) setPincodeError('Unable to fetch district.'); }
      finally { if (!controller.signal.aborted) setPincodeLoading(false); }
    };
    go(); return () => controller.abort();
  }, [formData.pincode]);

  useEffect(() => {
    if (!wizardOpen || wizardStep !== 4 || mapsLoaded || mapsError) return;
    if (!apiKey) { setMapsError('Missing Google Maps API key.'); return; }
    const existing = document.querySelector('script[data-google-maps]');
    if (existing) {
      if ((window as any).google?.maps) { setMapsLoaded(true); return; }
      // Script tag exists but hasn't finished loading yet — wait for it
      existing.addEventListener('load', () => setMapsLoaded(true));
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=drawing,geometry`;
    script.async = true; script.defer = true; script.dataset.googleMaps = 'true';
    script.onload = () => setMapsLoaded(true);
    script.onerror = () => setMapsError('Failed to load Google Maps.');
    document.head.appendChild(script);
  }, [apiKey, mapsError, mapsLoaded, wizardOpen, wizardStep]);

  useEffect(() => {
    if (!wizardOpen || wizardStep !== 4 || !mapsLoaded || !mapContainerRef.current || mapInstanceRef.current) return;
    const googleMaps = (window as any).google;
    if (!googleMaps?.maps) return;
    const center = formData.boundaryPath[0]
      ? { lat: formData.boundaryPath[0].lat, lng: formData.boundaryPath[0].lng }
      : (formData.latitude && formData.longitude
        ? { lat: formData.latitude, lng: formData.longitude }
        : { lat: 33.7782, lng: 76.5762 });
    const map = new googleMaps.maps.Map(mapContainerRef.current, { center, zoom: 13, mapTypeId: 'satellite', mapTypeControl: true, mapTypeControlOptions: { position: googleMaps.maps.ControlPosition.TOP_LEFT, mapTypeIds: ['roadmap', 'satellite'] }, streetViewControl: false });
    mapInstanceRef.current = map;
    // Fit map to saved field boundary on load
    if (formData.boundaryPath && formData.boundaryPath.length > 1) {
      const bounds = new googleMaps.maps.LatLngBounds();
      formData.boundaryPath.forEach((p: { lat: number; lng: number }) => bounds.extend({ lat: p.lat, lng: p.lng }));
      map.fitBounds(bounds);
    }
    map.addListener('click', (event: any) => {
      const position = event?.latLng; if (!position) return;
      new googleMaps.maps.Marker({ position: { lat: position.lat(), lng: position.lng() }, map: mapInstanceRef.current, icon: { path: googleMaps.maps.SymbolPath.CIRCLE, scale: 6, fillColor: '#f00', fillOpacity: 0.7, strokeWeight: 1, strokeColor: '#fff' } });
    });
    const drawingManager = new googleMaps.maps.drawing.DrawingManager({ drawingMode: null, drawingControl: true, drawingControlOptions: { position: googleMaps.maps.ControlPosition.TOP_CENTER, drawingModes: ['polygon'] }, polygonOptions: { fillColor: '#059669', fillOpacity: 0.45, strokeColor: '#047857', strokeWeight: 3, editable: true } });
    drawingManager.setMap(map); drawingManagerRef.current = drawingManager;
    const autoDetectBtn = document.createElement('button');
    autoDetectBtn.textContent = 'Auto Detect';
    autoDetectBtn.className = 'bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg shadow-md border border-gray-300 cursor-pointer m-2.5';
    autoDetectBtn.onclick = () => { if (!navigator.geolocation) return; navigator.geolocation.getCurrentPosition((p) => { map.panTo({ lat: p.coords.latitude, lng: p.coords.longitude }); map.setZoom(16); }); };
    map.controls[googleMaps.maps.ControlPosition.TOP_RIGHT].push(autoDetectBtn);
    let lineControlPanel: HTMLDivElement | null = document.getElementById('tree-line-panel') as HTMLDivElement;
    if (!lineControlPanel) {
      lineControlPanel = document.createElement('div');
      lineControlPanel.id = 'tree-line-panel';
      Object.assign(lineControlPanel.style, { display:'flex', alignItems:'center', gap:'0.5rem', background:'rgba(255,255,255,0.97)', border:'1px solid #d1fae5', borderRadius:'0.5rem', boxShadow:'0 2px 8px rgba(16,185,129,0.10)', padding:'0.35rem 0.7rem', margin:'0.7rem', zIndex:'1000' });
      const lineRowSelect = document.createElement('select');
      lineRowSelect.id = 'line-row-select';
      lineRowSelect.className = 'border border-green-300 rounded px-1.5 py-1 text-[15px]';
      lineRowSelect.style.cssText = 'min-width:100px;height:32px;';
      const defOpt = document.createElement('option'); defOpt.value = ''; defOpt.text = 'Select Row'; lineRowSelect.appendChild(defOpt);
      (formData.rows || []).forEach((row) => {
        const nTrees = row.varieties.reduce((sum, v) => sum + (parseInt(v.trees) || 0), 0);
        const tagged = (formData.treeTags || []).filter((t) => t.rowNumber === row.rowId).length;
        const opt = document.createElement('option'); opt.value = row.rowId; opt.text = `Row ${row.rowId}` + (tagged >= nTrees && nTrees > 0 ? ' (Tagged)' : '');
        if (tagged >= nTrees && nTrees > 0) opt.disabled = true;
        lineRowSelect.appendChild(opt);
      });
      const lineDrawBtn = document.createElement('button');
      lineDrawBtn.id = 'draw-line-btn';
      lineDrawBtn.innerHTML = '<svg style="display:inline;vertical-align:middle;margin-right:0.4em;" width="18" height="18" fill="none" stroke="#059669" stroke-width="2" viewBox="0 0 24 24"><path d="M4 20L20 4M4 4h16v16"/></svg>Draw Tree Line';
      lineDrawBtn.className = 'bg-green-600 hover:bg-green-700 text-white text-[15px] font-semibold px-3 py-1.5 rounded-md shadow border border-green-700';
      lineDrawBtn.style.cssText = 'display:flex;align-items:center;gap:0.4em;height:34px;';
      lineDrawBtn.onclick = () => {
        // Only allow draw if selected row is not already fully tagged
        const selRowId = (document.getElementById('line-row-select') as HTMLSelectElement)?.value;
        if (!selRowId) { alert('Please select a row first.'); return; }
        const selRow = (formData.rows || []).find((r) => r.rowId === selRowId);
        if (selRow) {
          const nT = selRow.varieties.reduce((s, v) => s + (parseInt(v.trees) || 0), 0);
          const tagged = (formData.treeTags || []).filter((t) => t.rowNumber === selRow.rowId).length;
          if (tagged >= nT && nT > 0) { alert(`Row ${selRow.rowId} is already fully tagged (${tagged}/${nT} trees). Cannot draw again.`); return; }
        }
        drawingManager.setDrawingMode('polyline');
      };
      lineControlPanel.appendChild(lineRowSelect); lineControlPanel.appendChild(lineDrawBtn);
      map.controls[googleMaps.maps.ControlPosition.TOP_RIGHT].push(lineControlPanel);
    }
    googleMaps.maps.event.addListener(drawingManager, 'overlaycomplete', (event: any) => {
      if (event.type === 'polygon') {
        if (polygonRef.current) polygonRef.current.setMap(null);
        polygonRef.current = event.overlay;
        const path = event.overlay.getPath();
        const points: { lat: number; lng: number }[] = path.getArray().map((p: any) => ({ lat: p.lat(), lng: p.lng() }));
        const areaSqm = googleMaps.maps.geometry.spherical.computeArea(path);
        setFormData((prev) => ({ ...prev, boundaryPath: points, mapAreaKanal: Number((areaSqm / KANAL_SQM).toFixed(2)) }));
        googleMaps.maps.event.addListener(event.overlay, 'click', (ce: any) => {
          const pos = ce?.latLng; if (!pos) return;
          if (taggingModeRef.current) { setPendingTagLocation({ lat: pos.lat(), lng: pos.lng() }); setTagFormOpen(true); }
        });
      }
      if (event.type === 'polyline') {
        const lineRowSelect = document.getElementById('line-row-select') as HTMLSelectElement;
        const selectedRowId = lineRowSelect?.value;
        if (!selectedRowId) { alert('Please select a row before drawing the line.'); event.overlay.setMap(null); return; }
        const row = (formData.rows || []).find((r) => r.rowId === selectedRowId);
        if (!row) { alert('Selected row not found.'); event.overlay.setMap(null); return; }
        const nTrees = row.varieties.reduce((sum, v) => sum + (parseInt(v.trees) || 0), 0);
        const alreadyTagged = (formData.treeTags || []).filter((t) => t.rowNumber === row.rowId).length;
        if (nTrees === 0) { alert('No trees specified for this row.'); event.overlay.setMap(null); return; }
        if (alreadyTagged >= nTrees) { alert('All trees for this row are already tagged.'); event.overlay.setMap(null); return; }
        const path = event.overlay.getPath();
        const linePoints: { lat: number; lng: number }[] = path.getArray().map((p: any) => ({ lat: p.lat(), lng: p.lng() }));
        const interpolate = (p1: { lat: number; lng: number }, p2: { lat: number; lng: number }, t: number) => ({ lat: p1.lat + (p2.lat - p1.lat) * t, lng: p1.lng + (p2.lng - p1.lng) * t });
        let totalLength = 0;
        for (let i = 1; i < linePoints.length; i++) { const dx = linePoints[i].lat - linePoints[i-1].lat; const dy = linePoints[i].lng - linePoints[i-1].lng; totalLength += Math.sqrt(dx*dx + dy*dy); }
        let treeTags: any[] = []; let treeIdx = 0; let varietyIdx = 0; let varietyTreeCount = parseInt(row.varieties[0]?.trees || '0') || 0;
        const treesToAdd = Math.max(0, nTrees - alreadyTagged);
        for (let t = 0; t < treesToAdd; t++) {
          const frac = treesToAdd === 1 ? 0.5 : t / (treesToAdd - 1);
          let dist = frac * totalLength; let acc = 0; let segIdx = 0;
          for (let i = 1; i < linePoints.length; i++) { const dx = linePoints[i].lat - linePoints[i-1].lat; const dy = linePoints[i].lng - linePoints[i-1].lng; const segLen = Math.sqrt(dx*dx + dy*dy); if (acc + segLen >= dist) { segIdx = i - 1; break; } acc += segLen; }
          const segStart = linePoints[segIdx]; const segEnd = linePoints[segIdx+1] || segStart;
          const segLen = Math.sqrt(Math.pow(segEnd.lat - segStart.lat, 2) + Math.pow(segEnd.lng - segStart.lng, 2));
          const segFrac = segLen ? (dist - acc) / segLen : 0;
          const pt = interpolate(segStart, segEnd, segFrac);
          while (varietyIdx < row.varieties.length && treeIdx >= varietyTreeCount) { varietyIdx++; varietyTreeCount += parseInt(row.varieties[varietyIdx]?.trees || '0') || 0; }
          const variety = row.varieties[varietyIdx]?.variety || '';
          treeTags.push({ id: `${Date.now()}-${Math.random()}`, name: '', variety, rowNumber: row.rowId, latitude: pt.lat, longitude: pt.lng });
          treeIdx++;
        }
        setFormData((prev) => ({ ...prev, treeTags: [...prev.treeTags, ...treeTags] }));
        event.overlay.setMap(null);
        // Always reset drawing mode to null after a row is drawn — user must click button again
        drawingManager.setDrawingMode(null);
        // Mark the row as tagged in the dropdown if fully filled
        const lineRowSelectEl = document.getElementById('line-row-select') as HTMLSelectElement;
        if (lineRowSelectEl) {
          const totalAfter = alreadyTagged + treesToAdd;
          if (totalAfter >= nTrees) {
            for (let i = 0; i < lineRowSelectEl.options.length; i++) {
              if (lineRowSelectEl.options[i].value === selectedRowId) {
                lineRowSelectEl.options[i].text = `Row ${selectedRowId} (Tagged)`;
                lineRowSelectEl.options[i].disabled = true;
                break;
              }
            }
            lineRowSelectEl.value = '';
          }
        }
      }
    });
    if (kmlObjectUrlRef.current) {
      if (kmlLayerRef.current) kmlLayerRef.current.setMap(null);
      kmlLayerRef.current = new googleMaps.maps.KmlLayer({ url: kmlObjectUrlRef.current, map, preserveViewport: false });
    }
  }, [mapsLoaded, wizardOpen, wizardStep]);

  useEffect(() => {
    const googleMaps = (window as any).google;
    if (!googleMaps?.maps || !mapInstanceRef.current) return;
    if (kmlLayerRef.current) { kmlLayerRef.current.setMap(null); kmlLayerRef.current = null; }
    if (kmlObjectUrlRef.current) kmlLayerRef.current = new googleMaps.maps.KmlLayer({ url: kmlObjectUrlRef.current, map: mapInstanceRef.current, preserveViewport: false });
  }, [mapsLoaded, wizardOpen, wizardStep, kmlObjectUrlRef.current]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const googleMaps = (window as any).google;
    if (!googleMaps?.maps) return;
    if (polygonRef.current) { polygonRef.current.setMap(null); polygonRef.current = null; }
    if (formData.boundaryPath && formData.boundaryPath.length > 2) {
      polygonRef.current = new googleMaps.maps.Polygon({ paths: formData.boundaryPath, fillColor: '#059669', fillOpacity: 0.45, strokeColor: '#047857', strokeWeight: 3, editable: false, map: mapInstanceRef.current });
    }
    treeMarkersRef.current.forEach((m) => m.setMap(null));
    let infoWindow: any = null;
    treeMarkersRef.current = formData.treeTags.map((tag) => {
      const color = getVarietyColor(tag.variety); const isSelected = selectedTreeId === tag.id;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${isSelected ? '<circle cx="32" cy="32" r="30" fill="#fbbf24" opacity="0.5"/>' : ''}<circle cx="32" cy="24" r="18" fill="${color}" ${isSelected ? 'stroke="#fbbf24" stroke-width="3"' : ''}/><rect x="28" y="36" width="8" height="18" fill="#8b5a2b"/></svg>`;
      const marker = new googleMaps.maps.Marker({ position: { lat: tag.latitude, lng: tag.longitude }, map: mapInstanceRef.current, title: tag.name || 'Tree', icon: { url: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`, scaledSize: new googleMaps.maps.Size(48, 48), anchor: new googleMaps.maps.Point(24, 48) } });
      marker.addListener('click', () => {
        mapInstanceRef.current?.panTo({ lat: tag.latitude, lng: tag.longitude }); mapInstanceRef.current?.setZoom(18); setSelectedTreeId(tag.id);
        if (infoWindow) infoWindow.close();
        const snap = treeHealthSnapshots[tag.id];
        const healthLabel = snap ? (snap.healthStatus.charAt(0) + snap.healthStatus.slice(1).toLowerCase()) : 'Not scouted';
        const healthColor = snap ? ({ HEALTHY: '#22c55e', STRESSED: '#f59e0b', INFECTED: '#f97316', CRITICAL: '#ef4444' }[snap.healthStatus] || '#9ca3af') : '#9ca3af';
        const scoutedDate = snap?.lastScoutedAt ? new Date(snap.lastScoutedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;
        const lastPest = snap?.lastPestName || null;
        infoWindow = new googleMaps.maps.InfoWindow({ content: `<div style='min-width:180px;font-family:sans-serif;padding:4px'><div style='font-weight:700;font-size:14px;margin-bottom:4px'>🌳 ${tag.name || 'Tree'}</div><div style='font-size:11px;color:#666;margin-bottom:2px'>Row: ${tag.rowNumber || '-'} &nbsp;|&nbsp; Variety: ${tag.variety || '-'}</div><div style='margin-top:6px;padding:6px 8px;border-radius:8px;background:#f9fafb;border:1px solid #e5e7eb'><span style='font-size:11px;font-weight:700;color:${healthColor}'>● ${healthLabel}</span>${scoutedDate ? `<div style='font-size:10px;color:#888;margin-top:2px'>Last scouted: ${scoutedDate}</div>` : ''}${lastPest ? `<div style='font-size:10px;color:#888;margin-top:1px'>Pest: ${lastPest}</div>` : ''}${snap ? `<div style='font-size:10px;color:#888;margin-top:1px'>Risk: ${snap.riskScore}/100 &nbsp;|&nbsp; Obs: ${snap.totalObservations}</div>` : ''}</div></div>` });
        infoWindow.open(mapInstanceRef.current, marker);
        handleOpenScoutingModal(tag as any);
      });
      return marker;
    });
  }, [formData.boundaryPath, formData.treeTags, selectedTreeId, mapsLoaded, wizardOpen, wizardStep]);

  const resetWizard = () => {
    setWizardOpen(false); setWizardStep(1); setSoilGuideOpen(false); setFormData(createInitialForm()); setEditingFieldId(null);
    setPincodeError(null); setMapsError(null); setMapsLoaded(false); setTaggingMode(false); setTagFormOpen(false);
    setPendingTagLocation(null); setSelectedTreeId(null); setTagFormData({ name: '', variety: '', rowNumber: '' });
    mapInstanceRef.current = null; polygonRef.current = null; drawingManagerRef.current = null;
    if (kmlLayerRef.current) { kmlLayerRef.current.setMap(null); kmlLayerRef.current = null; }
    if (kmlObjectUrlRef.current) { URL.revokeObjectURL(kmlObjectUrlRef.current); kmlObjectUrlRef.current = null; }
    treeMarkersRef.current.forEach((m) => m.setMap(null)); treeMarkersRef.current = [];
  };

  const openWizard = () => { setWizardOpen(true); setWizardStep(1); };
  const updateFormValue = <K extends keyof OrchardForm>(key: K, value: OrchardForm[K]) => setFormData((prev) => ({ ...prev, [key]: value }));
  const handleClearBoundary = () => { if (polygonRef.current) { polygonRef.current.setMap(null); polygonRef.current = null; } setFormData((prev) => ({ ...prev, boundaryPath: [], mapAreaKanal: undefined })); };
  const handleMapAreaSave = () => { if (!formData.mapAreaKanal) return; setFormData((prev) => ({ ...prev, areaKanal: prev.mapAreaKanal?.toString() ?? prev.areaKanal })); };

  const handleCreateField = async () => {
    if (!session?.user) return;
    setFieldsError(null);
    const payload = {
      user_id: session.user.id, name: formData.name || 'New Orchard', area: Number(formData.areaKanal) || 0,
      soil_type: formData.soilType || 'Unknown', crop_stage: 'Growing', health_status: 'Good',
      location: formData.district || formData.zone || 'Unknown', planted_date: new Date().toISOString().slice(0, 10),
      latitude: null, longitude: null, boundary_path: formData.boundaryPath.length > 0 ? formData.boundaryPath : null, details: formData,
    };
    const { data, error } = await supabase.from('fields').insert(payload).select('id, name, area, soil_type, crop_stage, health_status, location, planted_date, latitude, longitude, boundary_path').single();
    if (error) { setFieldsError(error.message); return; }
    if (data) {
      if (formData.treeTags.length > 0) {
        const tagPayload = formData.treeTags.map((tag) => ({ user_id: session.user.id, field_id: data.id, name: tag.name || null, variety: tag.variety || null, row_number: tag.rowNumber ? parseInt(tag.rowNumber, 10) || null : null, latitude: tag.latitude, longitude: tag.longitude, health_status: 'Good' }));
        const { error: tagError } = await supabase.from('tree_tags').insert(tagPayload);
        if (tagError) setFieldsError(`Tree tags not saved: ${tagError.message}`);
      }
      const newField: Field = { id: data.id, name: data.name, area: data.area ?? 0, soilType: data.soil_type ?? 'Unknown', cropStage: data.crop_stage ?? 'Growing', healthStatus: data.health_status ?? 'Good', location: data.location ?? 'Unknown', plantedDate: data.planted_date ?? '', latitude: data.latitude ?? undefined, longitude: data.longitude ?? undefined, boundaryPath: data.boundary_path ?? undefined, details: formData };
      setFields((prev) => [newField, ...prev]);
    }
    resetWizard();
  };

  const handleViewOnMap = (field: Field) => {
    if (field.id) navigate(`/dashboard?fieldId=${field.id}`);
    else if (field.latitude && field.longitude) navigate(`/dashboard?lat=${field.latitude}&lng=${field.longitude}`);
    else navigate('/dashboard');
  };
  const handleGoToTree = (tag: TreeTag) => {
    if (mapInstanceRef.current) { mapInstanceRef.current.panTo({ lat: tag.latitude, lng: tag.longitude }); mapInstanceRef.current.setZoom(18); setSelectedTreeId(tag.id); }
  };
  const handleAddVarietyRow = () => setFormData((prev) => ({ ...prev, varietyTrees: [...prev.varietyTrees, { variety: '', totalTrees: '' }] }));
  const handleRemoveVarietyRow = (index: number) => setFormData((prev) => ({ ...prev, varietyTrees: prev.varietyTrees.filter((_, i) => i !== index) }));
  const handleVarietyRowChange = (index: number, key: keyof VarietyTreeRow, value: string) => setFormData((prev) => ({ ...prev, varietyTrees: prev.varietyTrees.map((row, i) => i === index ? { ...row, [key]: value } : row) }));
  const handleTagFormSubmit = () => {
    if (!pendingTagLocation) return;
    const newTag: TreeTag = { id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, name: tagFormData.name.trim(), variety: tagFormData.variety.trim(), rowNumber: tagFormData.rowNumber.trim(), latitude: pendingTagLocation.lat, longitude: pendingTagLocation.lng };
    setFormData((prev) => ({ ...prev, treeTags: [...prev.treeTags, newTag] }));
    setTagFormOpen(false); setPendingTagLocation(null); setTagFormData({ name: '', variety: '', rowNumber: '' });
  };
  const handleRemoveTreeTag = (tagId: string) => setFormData((prev) => ({ ...prev, treeTags: prev.treeTags.filter((t) => t.id !== tagId) }));
  const handleKmlUpload = (file?: File | null) => {
    if (!file) return;
    if (kmlObjectUrlRef.current) URL.revokeObjectURL(kmlObjectUrlRef.current);
    const objectUrl = URL.createObjectURL(file); kmlObjectUrlRef.current = objectUrl;
    const googleMaps = (window as any).google;
    if (!googleMaps?.maps || !mapInstanceRef.current) return;
    if (kmlLayerRef.current) kmlLayerRef.current.setMap(null);
    kmlLayerRef.current = new googleMaps.maps.KmlLayer({ url: objectUrl, map: mapInstanceRef.current, preserveViewport: false });
  };

  const getRowSummary = () => {
    const varietyTotals = new Map<string, number>(); let totalTrees = 0;
    (formData.rows || []).forEach((row: any) => { (row.varieties || []).forEach((v: any) => { if (v.variety) { const count = Number(v.trees) || 0; varietyTotals.set(v.variety, (varietyTotals.get(v.variety) || 0) + count); totalTrees += count; } }); });
    return { varietyTotals, totalTrees };
  };

  /* ── Totals for stat strip ── */
  const totalFieldsArea = fields.reduce((sum, f) => sum + ((f as any).mapAreaKanal ?? (f as any).areaKanal ?? f.area ?? 0), 0);
  const totalFieldTrees = fields.reduce((sum, f) => {
    const d = (f as any).details; if (!d) return sum;
    // Prefer row-based count (most accurate), then varietyTrees, then nothing
    if (Array.isArray(d.rows) && d.rows.length > 0) {
      const fromRows = d.rows.reduce((rs: number, row: any) =>
        rs + (Array.isArray(row.varieties) ? row.varieties.reduce((s: number, v: any) => s + (parseInt(v.trees) || 0), 0) : 0), 0);
      if (fromRows > 0) return sum + fromRows;
    }
    if (Array.isArray(d.varietyTrees)) return sum + d.varietyTrees.reduce((s: number, v: any) => s + (parseInt(v.totalTrees) || 0), 0);
    return sum;
  }, 0);

  return (
    <>
      <style>{FIELDS_STYLES}</style>
      <div className="space-y-7 pb-12">

        {/* ══════════ HERO HEADER (SkuastAdvisory-style) ══════════ */}
        <div className="fld-fade-down fld-d0 relative overflow-hidden rounded-3xl fld-header-banner shadow-2xl">
          <div className="absolute -top-10 -left-10 w-52 h-52 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute top-6 right-24 w-20 h-20 rounded-full bg-white/8 pointer-events-none" />
          <div className="absolute bottom-4 left-24 w-14 h-14 rounded-full bg-white/6 pointer-events-none" />

          <div className="relative px-8 py-10 flex flex-col items-center text-center gap-4">
            {/* Live badge */}
            <div className="fld-scale-in fld-d1 inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full text-xs font-bold text-white/90 tracking-widest uppercase">
              <span className="relative inline-block w-2 h-2 rounded-full bg-emerald-300 fld-pulse" />
              Field Management · Live
            </div>

            {/* Title */}
            <h1 className="fld-fade-up fld-d2 text-4xl sm:text-5xl font-extrabold tracking-tight text-white drop-shadow-xl leading-tight">
              <span className="fld-leaf">🌳</span>{' '}Orchards
            </h1>

            {/* Subtitle */}
            <p className="fld-fade-up fld-d3 text-base sm:text-lg text-emerald-100/90 font-medium max-w-md">
              Manage and view all your orchard fields with ease
            </p>

            {/* CTA */}
            <button
              onClick={openWizard}
              className="fld-scale-in fld-d4 group flex items-center gap-2 px-7 py-3.5 bg-white text-green-700 font-bold rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-200"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
              Create Field
            </button>
          </div>
        </div>

        {/* ══════════ SEARCH BAR ══════════ */}
        <div className="fld-fade-up fld-d1">
          <div className="fld-glass-card rounded-2xl p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="fld-search-wrap flex-1 relative">
                <Search className="fld-search-icon absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 transition-colors duration-150" />
                <input
                  type="text"
                  placeholder="Search orchards by name or location…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="fld-input w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/80"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:border-green-300 hover:text-green-700 hover:bg-green-50/50 transition-all">
                <Filter className="w-4 h-4" /><span>Filter</span>
              </button>
            </div>
          </div>
        </div>

        {/* ══════════ STAT STRIP ══════════ */}
        {fields.length > 0 && (
          <div className="fld-fade-up fld-d2 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Fields',   value: fields.length,                         icon: '🗺️',  color: 'from-emerald-500 to-green-600' },
              { label: 'Total Trees',    value: totalFieldTrees || '—',                icon: '🌳',  color: 'from-green-500 to-teal-500' },
              { label: 'Total Area',     value: `${Number(totalFieldsArea).toFixed(1)} kanal`, icon: '📐', color: 'from-teal-500 to-cyan-500' },
              { label: 'Filtered',       value: filteredFields.length,                 icon: '🔍',  color: 'from-sky-500 to-indigo-500' },
            ].map((s, i) => (
              <div key={i} className="fld-stat rounded-2xl p-4 shadow-sm flex items-center gap-3" style={{ animationDelay: `${i * 0.06}s` }}>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-lg shadow-sm`}>
                  {s.icon}
                </div>
                <div>
                  <p className="text-lg font-extrabold text-gray-900 leading-none">{s.value}</p>
                  <p className="text-xs font-semibold text-gray-400 mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══════════ ERROR ══════════ */}
        {fieldsError && (
          <div className="fld-slide-r px-4 py-3 rounded-2xl border border-red-200 bg-red-50/80 text-sm text-red-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
            {fieldsError}
          </div>
        )}

        {/* ══════════ FIELDS GRID ══════════ */}
        {fieldsLoading ? (
          <div className="fld-glass-card rounded-2xl p-14 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-green-200 border-t-green-600 animate-spin" />
              <div className="space-y-2">
                <div className="fld-shimmer h-3 w-32 rounded-full mx-auto" />
                <div className="fld-shimmer h-2 w-20 rounded-full mx-auto" />
              </div>
              <p className="text-sm text-gray-400 font-medium">Loading your orchards…</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredFields.map((field, fi) => {
              const details = (field as any).details ?? {};
              const orchardType   = details.orchardType || '';
              const varietyTrees  = Array.isArray(details.varietyTrees) ? details.varietyTrees.filter((v: any) => v.variety) : [];
              // Sum trees from rows.varieties (most accurate) → fallback to varietyTrees top-level → fallback to details.totalTrees
              const totalTrees = (() => {
                if (Array.isArray(details.rows) && details.rows.length > 0) {
                  const fromRows = details.rows.reduce((rowSum: number, row: any) =>
                    rowSum + (Array.isArray(row.varieties) ? row.varieties.reduce((s: number, v: any) => s + (parseInt(v.trees) || 0), 0) : 0), 0);
                  if (fromRows > 0) return fromRows;
                }
                const fromVarietyTrees = varietyTrees.reduce((s: number, v: any) => s + (parseInt(v.totalTrees) || 0), 0);
                if (fromVarietyTrees > 0) return fromVarietyTrees;
                return parseInt(details.totalTrees) || 0;
              })();
              const totalRows     = Array.isArray(details.rows) ? details.rows.length : 0;
              const displayArea   = details.mapAreaKanal ?? details.areaKanal ?? field.area ?? '—';

              return (
                <div
                  key={field.id}
                  className="fld-field-card fld-fade-up rounded-2xl"
                  style={{ animationDelay: `${fi * 0.06}s` }}
                >
                  {/* Card top accent line by health */}
                  <div className="h-1 rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${getHealthDotColor(field.healthStatus)}, ${getHealthDotColor(field.healthStatus)}88)` }} />

                  <div className="p-5">
                    {/* Header row */}
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-extrabold text-gray-900 truncate">{field.name}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                          <span className="text-xs text-gray-400 truncate">{field.location}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${getHealthStatusBadge(field.healthStatus)}`}>
                          <span className="inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle" style={{ background: getHealthDotColor(field.healthStatus) }} />
                          {field.healthStatus}
                        </span>
                        {orchardType && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200">
                            {orchardType}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metric chips */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                        📐 {displayArea} kanal
                      </span>
                      {totalTrees > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-green-50 text-green-700 border border-green-100">
                          🌳 {totalTrees} trees
                        </span>
                      )}
                      {totalRows > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 border border-teal-100">
                          📋 {totalRows} rows
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
                        🪨 {field.soilType}
                      </span>
                    </div>

                    {/* Variety pills */}
                    {varietyTrees.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {varietyTrees.slice(0, 3).map((v: any, vi: number) => (
                          <span
                            key={vi}
                            className="fld-variety-pill inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full text-white shadow-sm"
                            style={{ background: getVarietyColor(v.variety) }}
                          >
                            {v.variety.split(' ')[0]}
                            {v.totalTrees ? <span className="opacity-80">({v.totalTrees})</span> : null}
                          </span>
                        ))}
                        {varietyTrees.length > 3 && (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                            +{varietyTrees.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Extra info */}
                    <div className="space-y-1 mb-3">
                      {field.latitude && field.longitude && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                          {field.latitude.toFixed(4)}, {field.longitude.toFixed(4)}
                        </div>
                      )}
                      {(field as any).pincode && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                          PIN {(field as any).pincode}
                        </div>
                      )}
                    </div>

                    {/* Scouted Trees */}
                    {(() => {
                      const tags = fieldTreeTags[field.id] ?? [];
                      if (tags.length === 0) return null;
                      const scoutedCount = tags.filter(t => treeHealthSnapshots[t.id]).length;
                      return (
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                              Scouted Trees ({scoutedCount}/{tags.length})
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {tags.slice(0, 8).map((tag) => {
                              const snap = treeHealthSnapshots[tag.id];
                              const meta = snap ? getScoutingHealthMeta(snap.healthStatus) : null;
                              return (
                                <button
                                  key={tag.id}
                                  type="button"
                                  onClick={() => handleOpenScoutingModal(tag as any)}
                                  className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-full border transition-all hover:scale-105 hover:shadow-sm ${meta ? `${meta.badge} ${meta.border}` : 'bg-gray-100 text-gray-500 border-gray-200'}`}
                                  title={`${tag.name || 'Tree'} — ${meta ? meta.label : 'Not scouted'}`}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: meta ? meta.dot : '#9ca3af' }} />
                                  {tag.name || `Tree`}
                                  {meta && <span className="opacity-70">· {meta.label}</span>}
                                </button>
                              );
                            })}
                            {tags.length > 8 && (
                              <span className="text-[9px] font-bold px-2 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                                +{tags.length - 8} more
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewOnMap(field)}
                        className="flex-1 py-2 text-xs font-bold rounded-xl border-2 border-green-200 text-green-700 hover:bg-green-50 hover:border-green-400 transition-all"
                      >
                        🗺️ Map
                      </button>
                      <button
                        onClick={() => openWizardForEdit(field)}
                        className="flex-1 py-2 text-xs font-bold rounded-xl text-white shadow-sm hover:shadow-md hover:scale-105 transition-all"
                        style={{ background: 'linear-gradient(135deg, #15803d, #16a34a)' }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteField(field)}
                        className="flex-1 py-2 text-xs font-bold rounded-xl border-2 border-red-100 text-red-500 hover:bg-red-50 hover:border-red-300 transition-all"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══════════ EMPTY STATE ══════════ */}
        {!fieldsLoading && filteredFields.length === 0 && (
          <div className="fld-scale-in fld-glass-card rounded-3xl p-14 text-center border-2 border-dashed border-green-200">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center shadow-inner fld-float">
                <span className="text-5xl">🌳</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                <Plus className="w-4 h-4 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-extrabold text-gray-900 mb-2">
              {searchTerm ? 'No matching orchards' : 'No orchards yet'}
            </h3>
            <p className="text-gray-400 mb-7 text-sm max-w-xs mx-auto">
              {searchTerm ? 'Try different search terms.' : 'Get started by adding your first orchard field — it only takes a minute.'}
            </p>
            {!searchTerm && (
              <button
                onClick={openWizard}
                className="inline-flex items-center gap-2 px-7 py-3.5 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                style={{ background: 'linear-gradient(135deg, #15803d, #16a34a)' }}
              >
                <Plus className="w-5 h-5" />
                Create Your First Orchard
              </button>
            )}
          </div>
        )}

        {/* ══════════ WIZARD MODAL ══════════ */}
        {wizardOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={resetWizard} />
            <div className="fld-scale-in relative bg-white w-full max-w-5xl mx-4 rounded-3xl shadow-2xl overflow-hidden">

              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-5 fld-header-banner">
                <div className="flex items-center gap-3">
                  <div className="fld-glow w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg">
                    <span className="text-xl">🌳</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-white">{editingFieldId ? 'Edit Field' : 'Create Field'}</h2>
                    <p className="text-xs text-emerald-200 font-medium">Step {wizardStep} of 4</p>
                  </div>
                </div>
                <button type="button" onClick={resetWizard} className="p-2 rounded-xl bg-white/15 hover:bg-white/25 transition-colors" aria-label="Close">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Step tabs */}
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { label: 'Orchard Details', icon: '🌳' },
                    { label: 'Soil Type',        icon: '🪨' },
                    { label: 'Location',         icon: '📍' },
                    { label: 'Orchard Map',      icon: '🗺️' },
                  ].map(({ label, icon }, index) => (
                    <div
                      key={label}
                      className={`fld-step-btn rounded-xl px-3 py-2.5 text-xs font-bold flex items-center gap-2 ${
                        wizardStep === index + 1 ? 'active' :
                        wizardStep > index + 1  ? 'bg-green-50 text-green-700 border border-green-200' :
                        'bg-white text-gray-500 border border-gray-200'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 ${
                        wizardStep === index + 1 ? 'bg-white/25 text-white' :
                        wizardStep > index + 1  ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {wizardStep > index + 1 ? '✓' : icon}
                      </span>
                      <span className="hidden sm:inline">{label}</span>
                      <span className="sm:hidden">{label.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step Content */}
              <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">

                {/* ── Step 1: Orchard Details ── */}
                {wizardStep === 1 && (
                  <div className="space-y-6 fld-fade-up">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1 h-6 rounded-full bg-gradient-to-b from-green-500 to-emerald-600" />
                      <h3 className="text-base font-extrabold text-gray-900">Basic Orchard Information</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {[
                        { label: 'Orchard Name',          key: 'name',        type: 'text',   placeholder: 'e.g. Apple Valley Orchard' },
                        { label: 'Area (kanal)',           key: 'areaKanal',   type: 'number', placeholder: '0.00' },
                        { label: 'Age of Orchard (years)',key: 'ageYears',    type: 'number', placeholder: '0' },
                      ].map(({ label, key, type, placeholder }) => (
                        <div key={key} className="space-y-1">
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</label>
                          <input type={type} value={(formData as any)[key]} onChange={(e) => updateFormValue(key as any, e.target.value)} placeholder={placeholder}
                            className="fld-input w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-gray-50/80" />
                        </div>
                      ))}
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Orchard Type</label>
                        <select value={formData.orchardType} onChange={(e) => updateFormValue('orchardType', e.target.value)}
                          className="fld-input w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-gray-50/80">
                          <option value="">Select type…</option>
                          {orchardTypes.map((t) => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Pollinator Variety</label>
                        <select value={formData.pollinatorType} onChange={(e) => updateFormValue('pollinatorType', e.target.value)}
                          className="fld-input w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-gray-50/80">
                          <option value="">Select pollinator variety…</option>
                          {getPollinatorsForOrchard().map((v) => <option key={v.name} value={v.name}>{v.name} — {v.description}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Row config */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-6 rounded-full bg-gradient-to-b from-emerald-500 to-green-600" />
                          <h3 className="text-base font-extrabold text-gray-900">Row Configuration</h3>
                        </div>
                        <button onClick={handleAddRow} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-bold rounded-xl hover:bg-green-100 transition-colors">
                          <Plus className="w-3.5 h-3.5" />Add Row
                        </button>
                      </div>
                      <div className="space-y-4">
                        {formData.rows && formData.rows.map((row, rowIndex) => (
                          <div key={`row-${rowIndex}`} className="fld-row-card rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-green-50/20 p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-xs font-extrabold text-white shadow-sm">{row.rowId}</span>
                                <h4 className="text-sm font-bold text-gray-900">Row {row.rowId}</h4>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => handleAddVarietyToRow(rowIndex)} className="flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:border-green-300 hover:text-green-700 transition-colors">
                                  <Plus className="w-3 h-3" />Variety
                                </button>
                                <button onClick={() => handleRemoveRow(rowIndex)} disabled={formData.rows.length === 1} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {row.varieties.map((v, vi) => (
                                <div key={`row-${rowIndex}-v-${vi}`} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                  <div className="space-y-1">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide">Variety</label>
                                    <select value={v.variety} onChange={(e) => handleRowVarietyChange(rowIndex, vi, 'variety', e.target.value)} className="fld-input w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-gray-50/80">
                                      <option value="">Select…</option>
                                      {getAvailableVarieties().map((av) => <option key={av.name} value={av.name}>{av.name}</option>)}
                                    </select>
                                  </div>
                                  <div className="space-y-1">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide">Trees</label>
                                    <input type="number" min="0" placeholder="Count" value={v.trees} onChange={(e) => handleRowVarietyChange(rowIndex, vi, 'trees', e.target.value)} className="fld-input w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-gray-50/80" />
                                  </div>
                                  <button onClick={() => handleRemoveVarietyFromRow(rowIndex, vi)} disabled={row.varieties.length === 1} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-30 mb-0.5">
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Orchard Summary */}
                    <div className="rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50/50 p-4">
                      <h3 className="text-base font-extrabold text-green-900 mb-4 flex items-center gap-2 justify-center">
                        <span>🍏</span>Orchard Summary
                      </h3>
                      <div className="overflow-x-auto rounded-xl border border-green-200 bg-white">
                        <table className="w-full text-sm border-separate border-spacing-0">
                          <thead>
                            <tr className="bg-gradient-to-r from-green-600 to-emerald-600">
                              <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-widest rounded-tl-xl">Variety</th>
                              <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-widest">Color</th>
                              <th className="px-4 py-3 text-right text-xs font-bold text-white uppercase tracking-widest rounded-tr-xl">Trees</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...getRowSummary().varietyTotals.entries()].map(([variety, count]) => (
                              <tr key={variety} className="hover:bg-green-50/60 transition-colors border-b border-gray-100">
                                <td className="px-4 py-3 font-semibold text-gray-800">{variety}</td>
                                <td className="px-4 py-3 text-center">
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full shadow-sm" style={{ background: getVarietyColor(variety) }}>
                                    <span className="text-white text-[8px] font-bold">{variety.charAt(0)}</span>
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right font-extrabold text-green-700">{count}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-green-50">
                              <td colSpan={2} className="px-4 py-3 font-extrabold text-green-900 text-sm">Total Trees</td>
                              <td className="px-4 py-3 text-right font-extrabold text-green-700 text-base">{getRowSummary().totalTrees}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Step 2: Soil Type ── */}
                {wizardStep === 2 && (
                  <div className="space-y-6 fld-fade-up">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-6 rounded-full bg-gradient-to-b from-amber-500 to-orange-500" />
                        <h3 className="text-base font-extrabold text-gray-900">Select Soil Type</h3>
                      </div>
                      <button type="button" onClick={() => setSoilGuideOpen(true)}
                        className="text-xs font-bold text-amber-700 hover:text-amber-800 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors">
                        🌍 Soil Guide →
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {soilOptions.map((soil) => (
                        <button key={soil.name} type="button"
                          onClick={() => { if (!formData.unknownSoil) updateFormValue('soilType', soil.name); }}
                          className={`fld-soil-btn relative rounded-2xl border-2 overflow-hidden text-left ${
                            formData.soilType === soil.name ? 'border-green-500 ring-2 ring-green-200 shadow-xl shadow-green-100' : 'border-gray-200 hover:border-green-300'
                          } ${formData.unknownSoil ? 'opacity-40 cursor-not-allowed' : ''}`}
                        >
                          <div className="relative h-32 overflow-hidden">
                            <img src={soil.image} alt={soil.name} className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />
                            {/* Glass overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            {/* Name on image */}
                            <div className="absolute bottom-0 left-0 right-0 px-3 pb-2">
                              <p className="text-white font-extrabold text-sm drop-shadow-md">{soil.name}</p>
                            </div>
                            {/* Selected checkmark */}
                            {formData.soilType === soil.name && (
                              <div className="absolute top-2 right-2 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </div>
                          {formData.soilType === soil.name && (
                            <div className="h-1 bg-gradient-to-r from-green-400 to-emerald-500" />
                          )}
                        </button>
                      ))}
                    </div>
                    <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer p-3.5 rounded-xl border border-dashed border-gray-200 hover:border-green-300 hover:bg-green-50/30 transition-colors">
                      <input type="checkbox" checked={formData.unknownSoil}
                        onChange={(e) => setFormData((prev) => ({ ...prev, unknownSoil: e.target.checked, soilType: e.target.checked ? 'Unknown' : '' }))}
                        className="h-4 w-4 text-green-600 border-gray-300 rounded accent-green-600" />
                      <span className="font-medium">I can't determine the soil type right now</span>
                    </label>
                  </div>
                )}

                {/* ── Step 3: Location ── */}
                {wizardStep === 3 && (
                  <div className="space-y-5 fld-fade-up">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1 h-6 rounded-full bg-gradient-to-b from-blue-500 to-indigo-500" />
                      <h3 className="text-base font-extrabold text-gray-900">Location Details</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Pincode</label>
                        <div className="relative">
                          <input type="text" value={formData.pincode} onChange={(e) => updateFormValue('pincode', e.target.value)} placeholder="6-digit pincode"
                            className="fld-input w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-gray-50/80" />
                          {pincodeLoading && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />}
                        </div>
                        {pincodeLoading && <p className="text-xs text-gray-400 mt-1">Auto-filling location…</p>}
                        {pincodeError && <p className="text-xs text-red-500 mt-1">{pincodeError}</p>}
                      </div>
                      {[
                        { label: 'District', key: 'district', placeholder: 'e.g. Shopian' },
                        { label: 'Tehsil',   key: 'tehsil',   placeholder: '' },
                        { label: 'Region',   key: 'region',   placeholder: '' },
                        { label: 'State',    key: 'state',    placeholder: '' },
                        { label: 'Zone',     key: 'zone',     placeholder: '' },
                        { label: 'Country',  key: 'country',  placeholder: '' },
                      ].map(({ label, key, placeholder }) => (
                        <div key={key} className="space-y-1">
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</label>
                          <input type="text" value={(formData as any)[key]} onChange={(e) => updateFormValue(key as any, e.target.value)} placeholder={placeholder}
                            className="fld-input w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-gray-50/80" />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Full Address</label>
                      <textarea rows={3} value={formData.fullAddress} onChange={(e) => updateFormValue('fullAddress', e.target.value)} placeholder="Village, Tehsil, District…"
                        className="fld-input w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-gray-50/80 resize-none" />
                    </div>
                  </div>
                )}

                {/* ── Step 4: Map ── */}
                {wizardStep === 4 && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-extrabold text-gray-900">Orchard Map</h3>
                        <p className="text-sm text-gray-400">Pin location and draw your orchard boundary.</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setTaggingMode((prev) => !prev)}
                          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all ${taggingMode ? 'text-white shadow-lg' : 'border border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-700'}`}
                          style={taggingMode ? { background: 'linear-gradient(135deg, #15803d, #16a34a)' } : {}}
                        >
                          🌲 {taggingMode ? 'Tagging On' : 'Tag Trees'}
                        </button>
                        <button onClick={handleClearBoundary} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold border border-red-200 text-red-500 rounded-xl hover:bg-red-50 transition-all">
                          <X className="w-4 h-4" />Clear
                        </button>
                      </div>
                    </div>

                    {formData.treeTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-green-50 border border-green-200">
                        <span className="text-xs font-bold text-green-700 mr-1">🌲 {formData.treeTags.length} Tagged:</span>
                        {[...new Set(formData.treeTags.map((t) => t.variety).filter(Boolean))].map((variety) => (
                          <span key={variety} className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: getVarietyColor(variety) }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-white/50" />{variety}
                          </span>
                        ))}
                      </div>
                    )}

                    {mapsError ? (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {mapsError} — Add VITE_GOOGLE_API_KEY to your environment.
                      </div>
                    ) : (
                      <>
                        <div ref={mapContainerRef} className="h-96 w-full rounded-2xl border-2 border-green-300 bg-gray-50 shadow-lg" />
                        <div className="flex flex-col items-center">
                          <button className="flex items-center gap-2 px-5 py-2.5 border-2 border-green-200 text-green-700 text-sm font-bold rounded-xl hover:bg-green-50 hover:border-green-400 transition-all"
                            onClick={async () => {
                              const input = document.createElement('input'); input.type = 'file'; input.accept = '.kml,application/vnd.google-earth.kml+xml';
                              input.onchange = async (e: any) => {
                                const file = e.target.files?.[0]; if (!file) return;
                                const text = await file.text();
                                if (kmlObjectUrlRef.current) URL.revokeObjectURL(kmlObjectUrlRef.current);
                                const blob = new Blob([text], { type: 'application/vnd.google-earth.kml+xml' });
                                const objectUrl = URL.createObjectURL(blob); kmlObjectUrlRef.current = objectUrl;
                                const googleMaps = (window as any).google;
                                if (googleMaps?.maps && mapInstanceRef.current) {
                                  if (kmlLayerRef.current) kmlLayerRef.current.setMap(null);
                                  kmlLayerRef.current = new googleMaps.maps.KmlLayer({ url: objectUrl, map: mapInstanceRef.current, preserveViewport: false });
                                }
                                try {
                                  const dom = new window.DOMParser().parseFromString(text, 'text/xml');
                                  const geojson = kmlToGeoJSON(dom);
                                  let coords = geojson.features?.find((f: any) => f.geometry?.type === 'Polygon')?.geometry?.coordinates?.[0];
                                  let type = 'Polygon';
                                  if (!coords) { coords = geojson.features?.find((f: any) => f.geometry?.type === 'LineString')?.geometry?.coordinates; type = 'LineString'; }
                                  if (coords && Array.isArray(coords)) {
                                    const boundaryPath = coords.map(([lng, lat]: [number, number]) => ({ lat, lng }));
                                    let mapAreaKanal = undefined;
                                    if (type === 'Polygon' && googleMaps?.maps?.geometry) {
                                      const path = boundaryPath.map(({ lat, lng }) => new googleMaps.maps.LatLng(lat, lng));
                                      mapAreaKanal = Number((googleMaps.maps.geometry.spherical.computeArea(path) / KANAL_SQM).toFixed(2));
                                    }
                                    setFormData((prev) => ({ ...prev, boundaryPath, mapAreaKanal }));
                                    setTimeout(() => { if (googleMaps?.maps && mapInstanceRef.current && boundaryPath.length > 0) { const b = new googleMaps.maps.LatLngBounds(); boundaryPath.forEach(({ lat, lng }) => b.extend(new googleMaps.maps.LatLng(lat, lng))); mapInstanceRef.current.fitBounds(b); } }, 200);
                                    setMapsError(null);
                                  } else setMapsError('No Polygon or LineString found in KML.');
                                } catch (err) { setMapsError('Failed to parse KML: ' + (err instanceof Error ? err.message : 'Unknown')); }
                              };
                              input.click();
                            }}>
                            📁 Update Map from KML
                          </button>
                          <p className="text-xs text-gray-400 mt-1.5 text-center">Upload a KML file to set your boundary automatically.</p>
                        </div>
                      </>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div className="fld-glass-card rounded-xl p-3">
                        <p className="text-xs font-semibold text-gray-400 mb-1">Boundary Points</p>
                        <p className="text-sm font-bold text-gray-800">{formData.boundaryPath.length ? `${formData.boundaryPath.length} points` : 'Not drawn yet'}</p>
                      </div>
                      <div className="fld-glass-card rounded-xl p-3">
                        <p className="text-xs font-semibold text-gray-400 mb-1">Map Area (kanal)</p>
                        <p className="text-sm font-bold text-gray-800">{formData.mapAreaKanal ?? 'Draw boundary to calculate'}</p>
                      </div>
                    </div>

                    {formData.boundaryPath.length > 0 && (
                      <div className="rounded-2xl bg-green-50 border border-green-200 p-4 flex items-start gap-3">
                        <span className="text-green-600 text-lg">✅</span>
                        <div>
                          <p className="text-sm font-bold text-green-900">Boundary Saved</p>
                          <p className="text-xs text-green-700 mt-0.5">{formData.boundaryPath.length} boundary points will be saved with the field.</p>
                        </div>
                      </div>
                    )}

                    {formData.treeTags.length > 0 && (
                      <div className="rounded-2xl border border-gray-200 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-extrabold text-gray-900">Tagged Trees ({formData.treeTags.length})</h4>
                          <p className="text-xs text-gray-400">{selectedTreeId ? '✨ Selected on map' : 'Click to highlight'}</p>
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {formData.treeTags.map((tag) => (
                            <div key={tag.id}
                              className={`flex items-center justify-between text-sm text-gray-700 p-2.5 rounded-xl cursor-pointer transition-all ${selectedTreeId === tag.id ? 'bg-amber-50 border-2 border-amber-300' : 'hover:bg-gray-50 border-2 border-transparent'}`}
                              onClick={() => handleGoToTree(tag)}>
                              <div className="flex items-center gap-2">
                                <span className="inline-block h-3 w-3 rounded-full shadow-sm" style={{ backgroundColor: getVarietyColor(tag.variety) }} />
                                <span className="font-semibold">{tag.name || 'Unnamed Tree'}</span>
                                {tag.variety && <span className="text-xs text-gray-400">({tag.variety})</span>}
                                {tag.rowNumber && <span className="text-xs text-gray-400">Row {tag.rowNumber}</span>}
                              </div>
                              <button type="button" onClick={(e) => { e.stopPropagation(); handleRemoveTreeTag(tag.id); }} className="text-xs text-red-400 hover:text-red-600 font-semibold">Remove</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer nav */}
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/60 flex items-center justify-between">
                <button onClick={() => setWizardStep((p) => Math.max(1, p - 1))} disabled={wizardStep === 1}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  ← Back
                </button>
                <div className="flex items-center gap-2">
                  {[1,2,3,4].map(s => (
                    <span key={s} className={`transition-all duration-300 rounded-full ${s === wizardStep ? 'w-6 h-2.5 bg-green-600' : s < wizardStep ? 'w-2.5 h-2.5 bg-green-300' : 'w-2.5 h-2.5 bg-gray-200'}`} />
                  ))}
                </div>
                {wizardStep < 4 ? (
                  <button onClick={() => setWizardStep((p) => Math.min(4, p + 1))}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm shadow-lg shadow-green-200 hover:shadow-xl hover:scale-105 transition-all duration-200"
                    style={{ background: 'linear-gradient(135deg, #15803d, #16a34a)' }}>
                    Next →
                  </button>
                ) : editingFieldId ? (
                  <button onClick={handleUpdateField}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm shadow-lg shadow-green-200 hover:shadow-xl hover:scale-105 transition-all duration-200"
                    style={{ background: 'linear-gradient(135deg, #15803d, #16a34a)' }}>
                    ✓ Update Field
                  </button>
                ) : (
                  <button onClick={handleCreateField}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm shadow-lg shadow-green-200 hover:shadow-xl hover:scale-105 transition-all duration-200"
                    style={{ background: 'linear-gradient(135deg, #15803d, #16a34a)' }}>
                    ✓ Create Field
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════ SOIL GUIDE MODAL ══════════ */}
        {soilGuideOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSoilGuideOpen(false)} />
            <div className="fld-scale-in relative bg-white w-full max-w-lg mx-4 rounded-3xl shadow-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
                    <span className="text-xl">🌍</span>
                  </div>
                  <h3 className="text-lg font-extrabold text-gray-900">Soil Guide</h3>
                </div>
                <button type="button" onClick={() => setSoilGuideOpen(false)} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-100">
                Use texture and moisture to identify soil type. Sandy soils feel gritty; clay soils feel sticky.
              </p>
              <ul className="space-y-3">
                {[
                  { name: 'Sandy',     desc: 'Loose, fast-draining, low moisture retention.', icon: '🏜️' },
                  { name: 'Sandy Loam',desc: 'Balanced texture, good drainage and nutrients.', icon: '🌾' },
                  { name: 'Silt Loam', desc: 'Smooth, holds moisture, fertile.',               icon: '🌿' },
                  { name: 'Clay',      desc: 'Dense, holds water, slow drainage.',             icon: '🟫' },
                ].map(s => (
                  <li key={s.name} className="flex items-start gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-100 hover:border-amber-200 hover:bg-amber-50/30 transition-colors">
                    <span className="text-xl shrink-0">{s.icon}</span>
                    <div><span className="text-sm font-bold text-gray-900">{s.name}: </span><span className="text-sm text-gray-600">{s.desc}</span></div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ══════════ SCOUTING DETAILS MODAL ══════════ */}
        {scoutingModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setScoutingModal(null)} />
            <div className="fld-scale-in relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden" style={{ maxHeight: '90vh' }}>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 fld-header-banner">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-lg shadow">
                    🌳
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-white">{scoutingModal.tag.name || 'Tree'}</h2>
                    <p className="text-xs text-emerald-200">{scoutingModal.tag.variety || 'Unknown variety'} · Scouting Details</p>
                  </div>
                </div>
                <button onClick={() => setScoutingModal(null)} className="p-2 rounded-xl bg-white/15 hover:bg-white/25 transition-colors">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              <div className="px-5 py-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
                {/* Health snapshot */}
                {scoutingModal.snapshot ? (() => {
                  const snap = scoutingModal.snapshot!;
                  const meta = getScoutingHealthMeta(snap.healthStatus);
                  const etlLabels: Record<string, string> = {
                    NO_ACTION: 'No Action', MONITOR: 'Monitor Closely',
                    TREAT_TREE: 'Treat This Tree', TREAT_BLOCK: 'Treat Entire Block', TREAT_ORCHARD: 'Full Orchard Spray',
                  };
                  return (
                    <div className={`rounded-2xl border p-4 mb-4 ${meta.bg} ${meta.border}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center border-2" style={{ background: `${meta.dot}20`, borderColor: meta.dot }}>
                          <span className="text-lg">🌿</span>
                        </div>
                        <div>
                          <span className={`text-sm font-extrabold ${meta.text}`}>{meta.label}</span>
                          <p className="text-xs text-gray-400">{snap.totalObservations} total observation{snap.totalObservations !== 1 ? 's' : ''}</p>
                        </div>
                        <span className={`ml-auto text-[10px] font-bold px-2.5 py-1 rounded-full ${meta.badge}`}>{meta.label}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-white/60 rounded-xl p-2.5">
                          <p className="text-gray-400 font-semibold mb-0.5">Risk Score</p>
                          <p className="font-extrabold text-gray-900">{snap.riskScore}/100</p>
                        </div>
                        <div className="bg-white/60 rounded-xl p-2.5">
                          <p className="text-gray-400 font-semibold mb-0.5">Recommended Action</p>
                          <p className={`font-bold text-xs ${meta.text}`}>{etlLabels[snap.etlAction] ?? snap.etlAction}</p>
                        </div>
                        {snap.lastScoutedAt && (
                          <div className="bg-white/60 rounded-xl p-2.5">
                            <p className="text-gray-400 font-semibold mb-0.5">Last Scouted</p>
                            <p className="font-bold text-gray-900">{new Date(snap.lastScoutedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                          </div>
                        )}
                        {snap.lastPestName && (
                          <div className="bg-white/60 rounded-xl p-2.5">
                            <p className="text-gray-400 font-semibold mb-0.5">Last Pest</p>
                            <p className="font-bold text-gray-900 truncate">{snap.lastPestName}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })() : (
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 mb-4 text-center">
                    <span className="text-2xl mb-1 block">🌿</span>
                    <p className="text-sm font-semibold text-gray-700">Not yet scouted</p>
                    <p className="text-xs text-gray-400 mt-0.5">No health snapshot available for this tree</p>
                  </div>
                )}

                {/* Recent observations */}
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Recent Observations</h4>
                  {scoutingModal.loading ? (
                    <div className="flex items-center justify-center py-6 gap-2">
                      <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs text-gray-400">Loading…</p>
                    </div>
                  ) : scoutingModal.recentObs.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-5 text-center">
                      <p className="text-xs text-gray-400">No observations recorded yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {scoutingModal.recentObs.map((obs, oi) => {
                        const sevLabel = ['None','Trace','Low','Moderate','High','Severe'][obs.severityScore] ?? String(obs.severityScore);
                        const sevColor = ['text-gray-400','text-emerald-600','text-yellow-600','text-orange-600','text-red-600','text-red-800'][obs.severityScore] ?? 'text-gray-600';
                        return (
                          <div key={oi} className="rounded-xl border border-gray-100 bg-white p-3">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <span className="text-xs font-bold text-gray-900">{obs.pestName}</span>
                              <span className={`text-[10px] font-bold ${sevColor}`}>{sevLabel}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 text-[10px] text-gray-400 mb-1">
                              {obs.affectedPart && <span>🌿 {obs.affectedPart.replace(/_/g, ' ')}</span>}
                              {obs.scoutedAt && <span>🕒 {new Date(obs.scoutedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                            </div>
                            {obs.notes && <p className="text-[10px] text-gray-500 leading-relaxed line-clamp-2">{obs.notes}</p>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const params = new URLSearchParams();
                      if (scoutingModal.tag.id) params.set('treeTagId', scoutingModal.tag.id);
                      if ((scoutingModal.tag as any).fieldId) params.set('fieldId', (scoutingModal.tag as any).fieldId);
                      setScoutingModal(null);
                      navigate(`/tree-scouting?${params.toString()}`);
                    }}
                    className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all"
                    style={{ background: 'linear-gradient(135deg, #0f766e, #059669)' }}
                  >
                    View Full Scouting →
                  </button>
                  <button
                    onClick={() => setScoutingModal(null)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════ TAG TREE MODAL ══════════ */}
        {tagFormOpen && pendingTagLocation && (
          <div className="fixed inset-0 z-70 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setTagFormOpen(false)} />
            <div className="fld-scale-in relative bg-white w-full max-w-lg mx-4 rounded-3xl shadow-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="fld-glow w-10 h-10 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-sm">
                    <span className="text-xl">🌲</span>
                  </div>
                  <h3 className="text-lg font-extrabold text-gray-900">Tag Tree</h3>
                </div>
                <button type="button" onClick={() => setTagFormOpen(false)} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Tree Name', key: 'name',      type: 'input',  placeholder: 'e.g. Tree A1' },
                ].map(({ label, key, type, placeholder }) => (
                  <div key={key} className="space-y-1">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</label>
                    <input type="text" value={(tagFormData as any)[key]} onChange={(e) => setTagFormData((prev) => ({ ...prev, [key]: e.target.value }))} placeholder={placeholder}
                      className="fld-input w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-gray-50/80" />
                  </div>
                ))}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Row Number</label>
                  <select value={tagFormData.rowNumber} onChange={(e) => setTagFormData((prev) => ({ ...prev, rowNumber: e.target.value }))}
                    className="fld-input w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-gray-50/80">
                    <option value="">Select row…</option>
                    {formData.rows && formData.rows.map((row) => <option key={row.rowId} value={row.rowId}>Row {row.rowId}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Variety</label>
                  <select value={tagFormData.variety} onChange={(e) => setTagFormData((prev) => ({ ...prev, variety: e.target.value }))}
                    className="fld-input w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-gray-50/80" disabled={!tagFormData.rowNumber}>
                    <option value="">Select variety</option>
                    {(() => {
                      const selRow = (formData.rows || []).find((r) => r.rowId === tagFormData.rowNumber);
                      return [...new Set((selRow?.varieties || []).map((v) => v.variety).filter((v) => v.trim()))].map((v) => <option key={v} value={v}>{v}</option>);
                    })()}
                  </select>
                  {tagFormData.variety && (() => {
                    const sel = getAvailableVarieties().find((v) => v.name === tagFormData.variety);
                    return sel ? <p className="text-xs text-gray-500 mt-1">{sel.description}</p> : null;
                  })()}
                </div>
              </div>
              <div className="mt-6 flex items-center justify-end gap-3">
                <button onClick={() => setTagFormOpen(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-100 transition-colors">Cancel</button>
                <button onClick={handleTagFormSubmit}
                  className="px-5 py-2.5 rounded-xl text-white font-bold text-sm shadow-lg shadow-green-200 hover:shadow-xl hover:scale-105 transition-all duration-200"
                  style={{ background: 'linear-gradient(135deg, #15803d, #16a34a)' }}>
                  Save Tag
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Fields;
