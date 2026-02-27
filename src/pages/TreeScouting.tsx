/**
 * TreeScouting.tsx — Premium Edition v2
 * AppleKul™ One | Precision IPM
 *
 * NEW in this version:
 *  • GPS-based nearest-tree auto-detection (Haversine distance)
 *  • AI Condition Prediction Engine (rule-based scoring + confidence %)
 *  • Optional tree photo (camera capture or file pick → base64 offline, Supabase Storage on sync)
 *  • Premium UI: glassmorphism header, animated health rings, gradient cards
 *  • GPS lock status indicator with accuracy meter
 *  • Prediction panel: shows predicted disease risk before saving
 *  • [v2] Precise GPS tagging per tree — save device location as exact tree coordinates
 *  • [v2] Editable tree name inline
 *  • [v2] Editable lat/lng fields with"Use My GPS" button per tree
 *  • [v2] GPS accuracy shown before saving; coordinates persist to tree_tags
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Bug, AlertTriangle, CheckCircle2, Plus, X, Camera, MapPin,
  Clock, ChevronDown, ChevronUp, Upload, Wifi, WifiOff, Filter,
  Search, TreePine, Shield, Zap, Activity, BarChart2, Eye,
  ChevronRight, Info, Loader2, Crosshair, Brain, TrendingUp,
  TrendingDown, Minus, Image as ImageIcon, RefreshCw, Thermometer,
  Wind, Droplets, Navigation, Radio, Target, Sparkles,
  Edit2, Save, LocateFixed, Pencil, Stethoscope, UserCheck,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { saveActivitiesToCalendar } from '../utils/TreeScoutingCalendarIntegration';

/* ═══════════════════════════════════════════════════════════════
   SKUAST-STYLE ANIMATION & STYLE DEFINITIONS
═══════════════════════════════════════════════════════════════ */
const TS_STYLES = `

/* Professional gradient header */
.ts-header-banner {
  background: linear-gradient(135deg, #064e3b, #065f46, #047857, #059669, #10b981);
}

/* Card hover lift */
.ts-card {

}
.ts-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 36px rgba(16,185,129,0.14);
  border-color: #6ee7b7;
}

/* Pulse indicator */
. ::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(16,185,129,0.5);

}

/* Tab hover */
.ts-tab {

}

/* Shimmer */
`;

/* ═══════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════ */

type HealthStatus  = 'HEALTHY' | 'STRESSED' | 'INFECTED' | 'CRITICAL';
type ETLAction     = 'NO_ACTION' | 'MONITOR' | 'TREAT_TREE' | 'TREAT_BLOCK' | 'TREAT_ORCHARD';
type AlertLevel    = 'TREE' | 'BLOCK' | 'ORCHARD';
type AlertStatus   = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
type PlantPart     = 'LEAF' | 'FRUIT' | 'SHOOT' | 'ROOT' | 'TRUNK' | 'WHOLE_TREE';
type SyncStatus    = 'PENDING_SYNC' | 'SYNCED' | 'CONFLICT';
type PestCategory  = 'PEST' | 'DISEASE' | 'PHYSIOLOGICAL' | 'NONE';
type GpsState      = 'idle' | 'acquiring' | 'locked' | 'error';

interface TreeTag {
  id: string;
  name: string;
  variety: string;
  rowNumber: number | null;
  latitude: number;
  longitude: number;
  healthStatus: string;
  fieldId: string;
  cardPhotoUrl: string | null;   // background photo for the card (stored in scouting-photos bucket)
}

interface Field { id: string; name: string; }

interface GpsReading {
  lat: number;
  lng: number;
  accuracy: number;  // metres
  timestamp: number;
}

interface NearestTreeResult {
  tree: TreeTag;
  distanceM: number;
  confidence: number; // 0–100
}

/* Activity & Production entry types — defined early so ScoutingObservation can reference them */
interface ActivityEntry {
  date: string;
  type: string;
  product: string;
  quantity: string;
  notes: string;
}

interface ProductionEntry {
  date: string;
  fruitSize: string;
  colorPct: string;
  estimatedYieldKg: string;
  numberOfCrates: string;
  qualityGrade: string;
  notes: string;
}

/* AI prediction output */
interface AIPrediction {
  predictedHealth: HealthStatus;
  confidence: number;         // 0–100
  riskScore: number;          // 0–100
  topRisks: string[];         // e.g. ["Apple Scab likely","High humidity window"]
  recommendation: ETLAction;
  reasoning: string;          // 1-2 sentence explanation
  spreadRisk: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface ScoutingObservation {
  id: string;
  clientUuid: string;
  syncStatus: SyncStatus;
  treeTagId: string;
  fieldId: string;
  treeVariety: string;
  treeRowNumber: number | null;
  scoutedBy: string;
  scoutedAt: string;
  bbchStage: number;
  bbchLabel: string;
  pestEppoCode: string;
  pestName: string;
  pestCategory: PestCategory;
  pestCount: number;
  severityScore: number;
  affectedPart: PlantPart;
  notes: string;
  photoBase64: string | null;   // offline photo
  photoUrl: string | null;      // synced Supabase URL
  gpsLat: number | null;
  gpsLng: number | null;
  gpsAccuracyM: number | null;
  treeHealthStatus: HealthStatus;
  etlActionRecommended: ETLAction;
  aiPrediction: AIPrediction | null;
  activities: ActivityEntry[];        // from Activities tab
  production: ProductionEntry[];      // from Production tab
}

interface TreeHealthSnapshot {
  treeTagId: string;
  fieldId: string;
  healthStatus: HealthStatus;
  lastScoutedAt: string | null;
  lastPestEppo: string | null;
  lastSeverityScore: number;
  totalObservations: number;
  etlAction: ETLAction;
  riskScore: number;
  infectedCount: number;
  criticalCount: number;
}

interface ScoutingAlert {
  id: string;
  fieldId: string;
  treeTagId: string | null;
  alertLevel: AlertLevel;
  alertStatus: AlertStatus;
  severity: HealthStatus;
  pestName: string;
  etlAction: ETLAction;
  message: string;
  blockInfectedPct: number | null;
  affectedTreeCount: number;
  createdAt: string;
}

/* ═══════════════════════════════════════════════════════════════
   STATIC REFERENCE DATA
═══════════════════════════════════════════════════════════════ */

const BBCH_STAGES = [
  { value: 0,  label: 'Dormancy (BBCH 0)'        },
  { value: 51, label: 'Green Tip (BBCH 51)'       },
  { value: 53, label: 'Mouse Ear (BBCH 53)'       },
  { value: 55, label: 'Green Cluster (BBCH 55)'   },
  { value: 57, label: 'Pink Bud (BBCH 57)'        },
  { value: 60, label: 'First Petal (BBCH 60)'     },
  { value: 65, label: 'Full Bloom (BBCH 65)'      },
  { value: 67, label: 'Petal Fall (BBCH 67)'      },
  { value: 71, label: 'Fruit Set (BBCH 71)'       },
  { value: 75, label: 'Fruitlet 10mm (BBCH 75)'   },
  { value: 81, label: 'Ripening (BBCH 81)'        },
  { value: 87, label: 'Pre-Harvest (BBCH 87)'     },
  { value: 92, label: 'Harvest (BBCH 92)'         },
];

const COMMON_PESTS = [
  { eppo: 'VENTIN', name: 'Apple Scab',           category: 'DISEASE'       as PestCategory, icon: '🍃', highRiskBBCH: [51,53,55,57,60,65,67] },
  { eppo: 'PODOCA', name: 'Powdery Mildew',       category: 'DISEASE'       as PestCategory, icon: '🌫️', highRiskBBCH: [51,53,55,57,60] },
  { eppo: 'ERWIAM', name: 'Fire Blight',           category: 'DISEASE'       as PestCategory, icon: '🔥', highRiskBBCH: [60,65,67] },
  { eppo: 'COLLGL', name: 'Bitter Rot',            category: 'DISEASE'       as PestCategory, icon: '🟤', highRiskBBCH: [75,81,87] },
  { eppo: 'LASPNI', name: 'Codling Moth',          category: 'PEST'          as PestCategory, icon: '🐛', highRiskBBCH: [71,75,81] },
  { eppo: 'APHIID', name: 'Aphids',                category: 'PEST'          as PestCategory, icon: '🦟', highRiskBBCH: [51,53,55,57] },
  { eppo: 'QUADPE', name: 'San Jose Scale',        category: 'PEST'          as PestCategory, icon: '🔵', highRiskBBCH: [0,51,81,87,92] },
  { eppo: 'PANOUK', name: 'European Red Mite',    category: 'PEST'          as PestCategory, icon: '🔴', highRiskBBCH: [55,57,60,65,67,71,75] },
  { eppo: 'TETRUR', name: 'Two-Spotted Mite',     category: 'PEST'          as PestCategory, icon: '🟠', highRiskBBCH: [65,67,71,75,81] },
  { eppo: 'ANARLI', name: 'Leaf Roller',           category: 'PEST'          as PestCategory, icon: '🌀', highRiskBBCH: [51,53,55,57] },
  { eppo: 'PHYSIO', name: 'Physiological Stress',  category: 'PHYSIOLOGICAL' as PestCategory, icon: '💧', highRiskBBCH: [] },
  { eppo: 'NONE',   name: 'No Issue Found',        category: 'NONE'          as PestCategory, icon: '✅', highRiskBBCH: [] },
];

const PLANT_PARTS: { key: PlantPart; label: string; icon: string }[] = [
  { key: 'LEAF',       label: 'Leaf',       icon: '🍃' },
  { key: 'FRUIT',      label: 'Fruit',      icon: '🍎' },
  { key: 'SHOOT',      label: 'Shoot',      icon: '🌿' },
  { key: 'ROOT',       label: 'Root',       icon: '🌱' },
  { key: 'TRUNK',      label: 'Trunk',      icon: '🪵' },
  { key: 'WHOLE_TREE', label: 'Whole Tree', icon: '🌳' },
];

const SEVERITY_LABELS = ['None', 'Trace', 'Low', 'Moderate', 'High', 'Severe'];
const SEVERITY_COLORS = ['bg-gray-200', 'bg-emerald-400', 'bg-yellow-400', 'bg-orange-400', 'bg-red-500', 'bg-red-700'];

/* ═══════════════════════════════════════════════════════════════
   HEALTH VISUAL META
═══════════════════════════════════════════════════════════════ */

const HEALTH_META: Record<HealthStatus, {
  label: string; dot: string; ring: string; bg: string; gradient: string;
  text: string; border: string; icon: string;
}> = {
  HEALTHY:  { label: 'Healthy',  dot: 'bg-emerald-500', ring: 'ring-emerald-400', bg: 'bg-emerald-50',  gradient: 'from-emerald-500 to-green-600',  text: 'text-emerald-700', border: 'border-emerald-300', icon: '🟢' },
  STRESSED: { label: 'Stressed', dot: 'bg-yellow-400',  ring: 'ring-yellow-400',  bg: 'bg-yellow-50',   gradient: 'from-yellow-400 to-amber-500',    text: 'text-yellow-700',  border: 'border-yellow-300',  icon: '🟡' },
  INFECTED: { label: 'Infected', dot: 'bg-red-500',     ring: 'ring-red-400',     bg: 'bg-red-50',      gradient: 'from-red-500 to-rose-600',        text: 'text-red-700',     border: 'border-red-300',     icon: '🔴' },
  CRITICAL: { label: 'Critical', dot: 'bg-gray-900',    ring: 'ring-gray-700',    bg: 'bg-gray-100',    gradient: 'from-gray-800 to-gray-900',       text: 'text-gray-900',    border: 'border-gray-700',    icon: '⚫' },
};

const ETL_META: Record<ETLAction, { label: string; color: string; bg: string }> = {
  NO_ACTION:     { label: 'No Action',          color: 'text-gray-500',   bg: 'bg-gray-100'   },
  MONITOR:       { label: 'Monitor Closely',    color: 'text-blue-600',   bg: 'bg-blue-50'    },
  TREAT_TREE:    { label: 'Treat This Tree',    color: 'text-orange-600', bg: 'bg-orange-50'  },
  TREAT_BLOCK:   { label: 'Treat Entire Block', color: 'text-red-600',    bg: 'bg-red-50'     },
  TREAT_ORCHARD: { label: 'Full Orchard Spray', color: 'text-red-900',    bg: 'bg-red-100'    },
};

/* ═══════════════════════════════════════════════════════════════
   GPS UTILITIES
═══════════════════════════════════════════════════════════════ */

/** Haversine distance in metres between two lat/lng points */
function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R  = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a  = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Find nearest tree and compute GPS confidence score */
function findNearestTree(gps: GpsReading, trees: TreeTag[]): NearestTreeResult | null {
  if (!trees.length) return null;
  let best: TreeTag = trees[0];
  let bestDist      = haversineM(gps.lat, gps.lng, trees[0].latitude, trees[0].longitude);
  for (const t of trees.slice(1)) {
    const d = haversineM(gps.lat, gps.lng, t.latitude, t.longitude);
    if (d < bestDist) { best = t; bestDist = d; }
  }
  // Confidence: 100% if within 3m, degrades to 0% at 20m
  const confidence = Math.max(0, Math.round(100 - ((bestDist - 3) / 17) * 100));
  return { tree: best, distanceM: Math.round(bestDist * 10) / 10, confidence };
}

/* ═══════════════════════════════════════════════════════════════
   AI PREDICTION ENGINE
   Rule-based scoring — no external API required.
   Inputs: pest, severity, BBCH, variety, historical counts
   Output: AIPrediction
═══════════════════════════════════════════════════════════════ */

function runAIPrediction(params: {
  pestEppo: string;
  pestCategory: PestCategory;
  severity: number;
  pestCount: number;
  bbchStage: number;
  variety: string;
  affectedPart: PlantPart;
  historicalInfectedCount: number;
  historicalCriticalCount: number;
}): AIPrediction {
  const {
    pestEppo, pestCategory, severity, pestCount,
    bbchStage, variety, affectedPart,
    historicalInfectedCount, historicalCriticalCount,
  } = params;

  let riskScore = 0;
  const risks: string[] = [];
  let spreadRisk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';

  // ── Severity contribution (0–40 pts) ──
  riskScore += severity * 8;

  // ── Pest-specific risk amplification ──
  const pestMeta = COMMON_PESTS.find(p => p.eppo === pestEppo);
  const isHighRiskBBCH = pestMeta?.highRiskBBCH.includes(bbchStage) ?? false;

  if (pestCategory === 'DISEASE') {
    riskScore += 10;
    if (isHighRiskBBCH) { riskScore += 15; risks.push(`${pestMeta?.name ?? 'Disease'} is at peak infection window for BBCH ${bbchStage}`); }
    spreadRisk = severity >= 3 ? 'HIGH' : severity >= 2 ? 'MEDIUM' : 'LOW';
  } else if (pestCategory === 'PEST') {
    riskScore += 6;
    if (pestCount > 10) { riskScore += 10; risks.push(`High pest density (${pestCount} counted) above economic threshold`); }
    spreadRisk = pestCount > 15 ? 'HIGH' : pestCount > 5 ? 'MEDIUM' : 'LOW';
  }

  // ── BBCH stage vulnerability ──
  if ([60, 65, 67].includes(bbchStage)) {
    riskScore += 8;
    risks.push('Bloom/petal-fall stage — highest vulnerability to fungal infection');
  } else if ([71, 75].includes(bbchStage)) {
    riskScore += 5;
    risks.push('Early fruit development — susceptible to Codling Moth and Bitter Rot');
  }

  // ── Historical recurrence penalty ──
  if (historicalInfectedCount >= 3) {
    riskScore += 12;
    risks.push(`Chronic issue: this tree was infected ${historicalInfectedCount}× this season`);
  } else if (historicalInfectedCount >= 1) {
    riskScore += 6;
    risks.push(`Prior infection recorded on this tree (${historicalInfectedCount}×)`);
  }
  if (historicalCriticalCount >= 1) {
    riskScore += 8;
    risks.push('Critical state previously recorded — heightened monitoring required');
  }

  // ── Variety-specific modifiers (high-density varieties more susceptible to scab) ──
  const highSusceptible = ['Jeromine', 'King Roat', 'Red Velox', 'Auvi Fuji', 'Red Delicious / Delicious'];
  if (highSusceptible.some(v => variety.includes(v))) {
    if (pestEppo === 'VENTIN' || pestEppo === 'PODOCA') {
      riskScore += 8;
      risks.push(`${variety} is highly susceptible to this pathogen`);
    }
  }

  // ── Affected part modifier ──
  if (affectedPart === 'FRUIT' && severity >= 2) {
    riskScore += 10;
    risks.push('Fruit infection detected — direct yield impact likely');
  }
  if (affectedPart === 'SHOOT' && pestEppo === 'ERWIAM') {
    riskScore += 12;
    risks.push('Shoot infection with Fire Blight — rapid systemic spread risk');
    spreadRisk = 'HIGH';
  }

  // ── Cap at 100 ──
  riskScore = Math.min(100, Math.round(riskScore));

  // ── Derive predicted health ──
  let predictedHealth: HealthStatus;
  if (severity === 0 && riskScore < 15)      predictedHealth = 'HEALTHY';
  else if (riskScore < 30)                   predictedHealth = 'STRESSED';
  else if (riskScore < 65)                   predictedHealth = 'INFECTED';
  else                                        predictedHealth = 'CRITICAL';

  // ── Derive recommendation ──
  let recommendation: ETLAction;
  if (riskScore < 15)       recommendation = 'NO_ACTION';
  else if (riskScore < 30)  recommendation = 'MONITOR';
  else if (riskScore < 55)  recommendation = 'TREAT_TREE';
  else if (riskScore < 80)  recommendation = 'TREAT_BLOCK';
  else                      recommendation = 'TREAT_ORCHARD';

  // ── Confidence (higher when more signals align) ──
  const confidence = Math.min(98, 60 + (risks.length * 8) + (isHighRiskBBCH ? 10 : 0));

  // ── Reasoning ──
  const reasoning =
    severity === 0
      ? `No active pest pressure detected. ${isHighRiskBBCH ? 'However, current growth stage has elevated background risk — maintain preventive schedule.' : 'Continue routine monitoring.'}`
      : `${pestMeta?.name ?? 'Issue'} at severity ${severity}/5 during ${bbchStage} BBCH stage gives a risk score of ${riskScore}/100. ${spreadRisk === 'HIGH' ? 'Immediate intervention required to prevent block-wide spread.' : spreadRisk === 'MEDIUM' ? 'Targeted treatment recommended before next rain window.' : 'Monitor and re-scout in 5–7 days.'}`;

  if (risks.length === 0) risks.push('No significant risk factors — tree within safe parameters');

  return { predictedHealth, confidence, riskScore, topRisks: risks, recommendation, reasoning, spreadRisk };
}

/* ═══════════════════════════════════════════════════════════════
   OFFLINE STORAGE
═══════════════════════════════════════════════════════════════ */

const LS_KEY = (uid: string) => `treeScout_v2_${uid}`;

function loadOfflineObs(uid: string): ScoutingObservation[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY(uid)) ?? '[]'); }
  catch { return []; }
}

function saveOfflineObs(uid: string, obs: ScoutingObservation[]) {
  localStorage.setItem(LS_KEY(uid), JSON.stringify(obs));
}

/* ═══════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════ */

const newUUID = () => crypto.randomUUID();
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
  ' ' +
  new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

/* ═══════════════════════════════════════════════════════════════
   PHOTO CAPTURE HOOK
═══════════════════════════════════════════════════════════════ */

function usePhotoCapture() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoName, setPhotoName]     = useState<string | null>(null);

  const openPicker = () => fileRef.current?.click();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoName(file.name);
    const reader = new FileReader();
    reader.onload = ev => setPhotoBase64(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const clear = () => { setPhotoBase64(null); setPhotoName(null); };

  const inputEl = (
    <input
      ref={fileRef}
      type="file"
      accept="image/*"
      capture="environment"
      className="hidden"
      onChange={handleFile}
    />
  );

  return { photoBase64, photoName, openPicker, clear, inputEl };
}

/* ═══════════════════════════════════════════════════════════════
   GPS LOCK HOOK
═══════════════════════════════════════════════════════════════ */

function useGpsLock() {
  const [gps, setGps]       = useState<GpsReading | null>(null);
  const [state, setState]   = useState<GpsState>('idle');
  const [error, setError]   = useState<string | null>(null);
  const watchIdRef          = useRef<number | null>(null);

  const startWatch = useCallback(() => {
    if (!navigator.geolocation) { setError('Geolocation not supported'); setState('error'); return; }
    setState('acquiring');
    setError(null);
    watchIdRef.current = navigator.geolocation.watchPosition(
      pos => {
        setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy, timestamp: pos.timestamp });
        setState('locked');
      },
      err => { setError(err.message); setState('error'); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 3000 }
    );
  }, []);

  const stopWatch = useCallback(() => {
    if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    setState('idle');
  }, []);

  useEffect(() => () => { if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current); }, []);

  return { gps, state, error, startWatch, stopWatch };
}

/* ═══════════════════════════════════════════════════════════════
   TREE LOCATION / NAME UPDATE HOOK
   Saves device GPS coordinates (or manual entry) and name back
   to tree_tags in Supabase so future GPS auto-detect is accurate.
═══════════════════════════════════════════════════════════════ */

function useTreeUpdate() {
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const updateTreeLocation = useCallback(async (
    treeId: string,
    lat: number,
    lng: number,
    onSuccess?: (lat: number, lng: number) => void,
  ) => {
    setSaving(true);
    setSavedMsg(null);
    const { error } = await supabase
      .from('tree_tags')
      .update({ latitude: lat, longitude: lng, updated_at: new Date().toISOString() })
      .eq('id', treeId);
    setSaving(false);
    if (error) {
      setSavedMsg('Error saving location: ' + error.message);
    } else {
      setSavedMsg('Tree location saved!');
      onSuccess?.(lat, lng);
      setTimeout(() => setSavedMsg(null), 3000);
    }
  }, []);

  const updateTreeName = useCallback(async (
    treeId: string,
    name: string,
    onSuccess?: (name: string) => void,
  ) => {
    setSaving(true);
    setSavedMsg(null);
    const { error } = await supabase
      .from('tree_tags')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', treeId);
    setSaving(false);
    if (error) {
      setSavedMsg('Error saving name: ' + error.message);
    } else {
      setSavedMsg('Tree name saved!');
      onSuccess?.(name);
      setTimeout(() => setSavedMsg(null), 3000);
    }
  }, []);

  return { saving, savedMsg, updateTreeLocation, updateTreeName };
}

/* ═══════════════════════════════════════════════════════════════
   TREE CARD PHOTO HOOK
   Handles uploading a photo to Supabase Storage (scouting-photos bucket)
   and persisting the public URL in tree_tags.card_photo_url.
   Also checks whether a photo already exists in storage for the tree.
═══════════════════════════════════════════════════════════════ */

function useTreeCardPhoto(userId: string) {
  const [uploading, setUploading]     = useState(false);
  const [photoMsg,  setPhotoMsg]      = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const showMsg = (ok: boolean, text: string) => {
    setPhotoMsg({ ok, text });
    setTimeout(() => setPhotoMsg(null), 4000);
  };

  /** Upload a File to scouting-photos/{userId}/tree-card/{treeId}.jpg
   *  and save the resulting public URL into tree_tags.card_photo_url */
  const uploadCardPhoto = useCallback(async (
    treeId: string,
    file: File,
    onSuccess: (url: string) => void,
  ) => {
    setUploading(true);
    setPhotoMsg(null);
    try {
      const ext      = file.name.split('.').pop() ?? 'jpg';
      const storagePath = `${userId}/tree-card/${treeId}.${ext}`;

      // Upsert to storage (overwrite if exists)
      const { error: storageErr } = await supabase.storage
        .from('scouting-photos')
        .upload(storagePath, file, { upsert: true, contentType: file.type });

      if (storageErr) throw new Error('Storage upload failed: ' + storageErr.message);

      // Get signed URL (valid 10 years — effectively permanent for our use)
      const { data: signedData, error: signErr } = await supabase.storage
        .from('scouting-photos')
        .createSignedUrl(storagePath, 60 * 60 * 24 * 365 * 10);

      if (signErr || !signedData?.signedUrl) throw new Error('Could not get photo URL: ' + (signErr?.message ?? ''));

      const photoUrl = signedData.signedUrl;

      // Persist URL to tree_tags
      const { error: dbErr } = await supabase
        .from('tree_tags')
        .update({ card_photo_url: photoUrl, updated_at: new Date().toISOString() })
        .eq('id', treeId);

      if (dbErr) throw new Error('DB update failed: ' + dbErr.message);

      onSuccess(photoUrl);
      showMsg(true, 'Card photo uploaded and applied!');
    } catch (e: any) {
      showMsg(false, e.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [userId]);

  /** Check if a photo already exists in storage for this tree */
  const checkExistingPhoto = useCallback(async (treeId: string): Promise<string | null> => {
    // List files under {userId}/tree-card/ that start with treeId
    const { data, error } = await supabase.storage
      .from('scouting-photos')
      .list(`${userId}/tree-card`, { search: treeId });

    if (error || !data || data.length === 0) return null;

    const found = data.find(f => f.name.startsWith(treeId));
    if (!found) return null;

    const storagePath = `${userId}/tree-card/${found.name}`;
    const { data: signedData, error: signErr } = await supabase.storage
      .from('scouting-photos')
      .createSignedUrl(storagePath, 60 * 60 * 24 * 365 * 10);

    return signErr || !signedData?.signedUrl ? null : signedData.signedUrl;
  }, [userId]);

  const inputEl = (onFile: (f: File) => void) => (
    <input
      ref={fileRef}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={e => {
        const f = e.target.files?.[0];
        if (f) onFile(f);
        e.target.value = '';
      }}
    />
  );

  const openPicker = () => fileRef.current?.click();

  return { uploading, photoMsg, uploadCardPhoto, checkExistingPhoto, inputEl, openPicker };
}

/* ═══════════════════════════════════════════════════════════════
   UI PRIMITIVES
═══════════════════════════════════════════════════════════════ */

function Badge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${className}`}>
      {children}
    </span>
  );
}

function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function HealthRing({ status, size = 56 }: { status: HealthStatus; size?: number }) {
  const meta   = HEALTH_META[status];
  const radius = (size - 8) / 2;
  const circ   = 2 * Math.PI * radius;
  const pct    = status === 'HEALTHY' ? 1 : status === 'STRESSED' ? 0.55 : status === 'INFECTED' ? 0.78 : 0.95;
  const stroke = status === 'HEALTHY' ? '#10b981' : status === 'STRESSED' ? '#facc15' : status === 'INFECTED' ? '#ef4444' : '#111827';

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={5} />
      <circle
        cx={size/2} cy={size/2} r={radius}
        fill="none" stroke={stroke} strokeWidth={5}
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x={size/2} y={size/2 + 4} textAnchor="middle" fontSize={10} fontWeight={700} fill={stroke}>
        {meta.icon}
      </text>
    </svg>
  );
}

function RiskMeter({ score }: { score: number }) {
  const color = score < 30 ? '#10b981' : score < 55 ? '#facc15' : score < 80 ? '#f97316' : '#dc2626';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-bold">
        <span className="text-gray-500">Risk Score</span>
        <span style={{ color }} className="font-extrabold">{score}/100</span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function GpsStatusBadge({ state, accuracy }: { state: GpsState; accuracy?: number }) {
  const config = {
    idle:      { color: 'bg-gray-100 text-gray-500 border-gray-200',    icon: <Navigation className="w-3 h-3" />, label: 'GPS Off'    },
    acquiring: { color: 'bg-blue-50 text-blue-600 border-blue-200',      icon: <Loader2 className="w-3 h-3 animate-spin" />, label: 'Acquiring…' },
    locked:    { color: 'bg-emerald-50 text-emerald-700 border-emerald-300', icon: <Target className="w-3 h-3" />, label: accuracy != null ? `±${Math.round(accuracy)}m` : 'Locked' },
    error:     { color: 'bg-red-50 text-red-600 border-red-200',         icon: <AlertTriangle className="w-3 h-3" />, label: 'GPS Error' },
  }[state];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${config.color}`}>
      {config.icon} {config.label}
    </span>
  );
}

function EmptyState({ icon: Icon, title, sub }: { icon: any; title: string; sub?: string }) {
  return (
    <div className="text-center py-16">
      <Icon className="w-12 h-12 mx-auto mb-3 text-gray-200" />
      <p className="text-sm font-semibold text-gray-500">{title}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   AI PREDICTION PANEL
═══════════════════════════════════════════════════════════════ */

function AIPredictionPanel({ prediction }: { prediction: AIPrediction }) {
  const meta = HEALTH_META[prediction.predictedHealth];
  const etl  = ETL_META[prediction.recommendation];
  const spreadColor = prediction.spreadRisk === 'HIGH' ? 'text-red-600 bg-red-50 border-red-200' : prediction.spreadRisk === 'MEDIUM' ? 'text-orange-600 bg-orange-50 border-orange-200' : 'text-green-700 bg-green-50 border-green-200';

  return (
    <div className="rounded-2xl border-2 border-dashed border-indigo-300 bg-gradient-to-br from-indigo-50 to-white overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-indigo-700 to-violet-700 flex items-center gap-2">
        <Brain className="w-4 h-4 text-white" />
        <span className="text-white font-extrabold text-sm">AI Condition Prediction</span>
        <span className="ml-auto text-indigo-200 text-xs font-semibold">{prediction.confidence}% confidence</span>
      </div>

      <div className="p-4 space-y-3">
        {/* Predicted state + risk */}
        <div className="flex items-center gap-4">
          <HealthRing status={prediction.predictedHealth} size={60} />
          <div className="flex-1">
            <p className={`text-lg font-extrabold ${meta.text}`}>{meta.label}</p>
            <p className={`text-xs font-bold mt-0.5 ${etl.color}`}>{etl.label}</p>
            <RiskMeter score={prediction.riskScore} />
          </div>
        </div>

        {/* Spread risk */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold ${spreadColor}`}>
          {prediction.spreadRisk === 'HIGH' ? <Radio className="w-3.5 h-3.5" /> : prediction.spreadRisk === 'MEDIUM' ? <Activity className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
          Spread Risk: {prediction.spreadRisk}
        </div>

        {/* Risk factors */}
        {prediction.topRisks.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Risk Factors</p>
            {prediction.topRisks.map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-gray-700">
                <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                {r}
              </div>
            ))}
          </div>
        )}

        {/* Reasoning */}
        <div className="bg-white rounded-xl border border-indigo-100 px-3 py-2.5 text-xs text-gray-600 leading-relaxed">
          <span className="font-bold text-indigo-700">AI Reasoning: </span>
          {prediction.reasoning}
        </div>

        {/* Confidence bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Prediction Confidence</span>
            <span className="font-bold text-indigo-700">{prediction.confidence}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" style={{ width: `${prediction.confidence}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   GPS TREE FINDER PANEL
═══════════════════════════════════════════════════════════════ */

function GpsTreeFinder({
  gps, state, error, trees, onSelect, onStart, onStop,
}: {
  gps: GpsReading | null;
  state: GpsState;
  error: string | null;
  trees: TreeTag[];
  onSelect: (tree: TreeTag) => void;
  onStart: () => void;
  onStop: () => void;
}) {
  const nearest = useMemo<NearestTreeResult | null>(() => {
    if (!gps || state !== 'locked') return null;
    return findNearestTree(gps, trees);
  }, [gps, state, trees]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-emerald-800 to-teal-700 flex items-center gap-3">
        <div className="p-2 bg-white/15 rounded-xl">
          <Crosshair className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-white font-extrabold text-sm">GPS Tree Finder</p>
          <p className="text-emerald-200 text-xs">Auto-detect nearest tree from your location</p>
        </div>
        <div className="ml-auto">
          <GpsStatusBadge state={state} accuracy={gps?.accuracy} />
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* GPS controls */}
        <div className="flex gap-3">
          {state === 'idle' || state === 'error' ? (
            <button
              onClick={onStart}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white py-3 rounded-xl font-bold text-sm transition shadow"
            >
              <Navigation className="w-4 h-4" /> Start GPS Lock
            </button>
          ) : (
            <button
              onClick={onStop}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-xl font-bold text-sm transition"
            >
              <X className="w-4 h-4" /> Stop GPS
            </button>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            {error}. Enable location permissions and try again.
          </p>
        )}

        {state === 'acquiring' && (
          <div className="flex items-center gap-2 text-sm text-blue-600 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin" /> Acquiring GPS signal…
          </div>
        )}

        {/* Live GPS coords */}
        {gps && state === 'locked' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs font-mono text-emerald-800">
            <div className="flex justify-between">
              <span>Lat: {gps.lat.toFixed(6)}°</span>
              <span>Lng: {gps.lng.toFixed(6)}°</span>
            </div>
            <div className="mt-1 text-emerald-600">Accuracy: ±{Math.round(gps.accuracy)} m</div>
          </div>
        )}

        {/* Nearest tree result */}
        {nearest && (
          <div className={`rounded-2xl border-2 p-4 transition-all ${nearest.confidence >= 70 ? 'border-emerald-400 bg-emerald-50' : nearest.confidence >= 40 ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300 bg-gray-50'}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className={`w-4 h-4 ${nearest.confidence >= 70 ? 'text-emerald-600' : 'text-yellow-600'}`} />
                  <span className="font-extrabold text-gray-800 text-sm">Nearest Tree Detected</span>
                </div>
                <p className="text-base font-extrabold text-gray-900">{nearest.tree.name || `Tree #${nearest.tree.id.slice(0,6).toUpperCase()}`}</p>
                <p className="text-sm text-gray-600">{nearest.tree.variety || 'Unknown variety'}{nearest.tree.rowNumber ? ` · Row ${nearest.tree.rowNumber}` : ''}</p>
                <div className="flex items-center gap-3 mt-2 text-xs">
                  <span className={`font-bold ${nearest.distanceM <= 5 ? 'text-emerald-600' : nearest.distanceM <= 10 ? 'text-yellow-600' : 'text-red-500'}`}>
                    {nearest.distanceM} m away
                  </span>
                  <span className="text-gray-400">·</span>
                  <span className={`font-bold ${nearest.confidence >= 70 ? 'text-emerald-600' : 'text-yellow-600'}`}>
                    {nearest.confidence}% match confidence
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className={`text-2xl font-extrabold ${nearest.confidence >= 70 ? 'text-emerald-600' : 'text-yellow-600'}`}>
                  {nearest.confidence}%
                </div>
                <div className="text-xs text-gray-500">confidence</div>
              </div>
            </div>

            {/* Confidence bar */}
            <div className="mt-3">
              <div className="h-2 bg-white rounded-full overflow-hidden border">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${nearest.confidence >= 70 ? 'bg-emerald-500' : nearest.confidence >= 40 ? 'bg-yellow-400' : 'bg-red-400'}`}
                  style={{ width: `${nearest.confidence}%` }}
                />
              </div>
            </div>

            {nearest.confidence < 40 && (
              <p className="text-xs text-orange-600 mt-2 font-semibold">
                Low confidence — move closer to a tagged tree or select manually below.
              </p>
            )}

            <button
              onClick={() => onSelect(nearest.tree)}
              className="mt-3 w-full flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 rounded-xl font-bold text-sm transition"
            >
              <CheckCircle2 className="w-4 h-4" /> Scout This Tree
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TREE LOCATION EDITOR
   Lets the user set or correct a tree's stored lat/lng and name.
   Shown inline in the expanded tree detail panel.
═══════════════════════════════════════════════════════════════ */

interface TreeLocationEditorProps {
  tree: TreeTag;
  gps: GpsReading | null;
  gpsState: GpsState;
  userId: string;
  onUpdated: (patch: Partial<Pick<TreeTag, 'name' | 'latitude' | 'longitude' | 'cardPhotoUrl'>>) => void;
}

function TreeLocationEditor({ tree, gps, gpsState, userId, onUpdated }: TreeLocationEditorProps) {
  const cardPhoto = useTreeCardPhoto(userId);
  const [editName, setEditName]   = useState(false);
  const [nameVal, setNameVal]     = useState(tree.name);
  const [editCoords, setEditCoords] = useState(false);
  const [latVal, setLatVal]       = useState(tree.latitude.toFixed(7));
  const [lngVal, setLngVal]       = useState(tree.longitude.toFixed(7));
  const [localMsg, setLocalMsg]   = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving]       = useState(false);

  // Sync if parent tree prop changes (e.g. after reload)
  useEffect(() => { setNameVal(tree.name); }, [tree.name]);
  useEffect(() => {
    setLatVal(tree.latitude.toFixed(7));
    setLngVal(tree.longitude.toFixed(7));
  }, [tree.latitude, tree.longitude]);

  const showMsg = (ok: boolean, text: string) => {
    setLocalMsg({ ok, text });
    setTimeout(() => setLocalMsg(null), 3500);
  };

  const saveName = async () => {
    if (!nameVal.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from('tree_tags')
      .update({ name: nameVal.trim(), updated_at: new Date().toISOString() })
      .eq('id', tree.id);
    setSaving(false);
    if (error) { showMsg(false, 'Failed: ' + error.message); return; }
    setEditName(false);
    onUpdated({ name: nameVal.trim() });
    showMsg(true, 'Tree name updated.');
  };

  const saveCoords = async (lat: number, lng: number) => {
    setSaving(true);
    const { error } = await supabase
      .from('tree_tags')
      .update({ latitude: lat, longitude: lng, updated_at: new Date().toISOString() })
      .eq('id', tree.id);
    setSaving(false);
    if (error) { showMsg(false, 'Failed: ' + error.message); return; }
    setEditCoords(false);
    setLatVal(lat.toFixed(7));
    setLngVal(lng.toFixed(7));
    onUpdated({ latitude: lat, longitude: lng });
    showMsg(true, 'Tree GPS location saved.');
  };

  const handleManualSave = () => {
    const lat = parseFloat(latVal);
    const lng = parseFloat(lngVal);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      showMsg(false, 'Invalid coordinates. Lat: -90…90, Lng: -180…180');
      return;
    }
    saveCoords(lat, lng);
  };

  const handleUseGps = () => {
    if (!gps) { showMsg(false, 'GPS not locked yet. Start GPS first.'); return; }
    setLatVal(gps.lat.toFixed(7));
    setLngVal(gps.lng.toFixed(7));
    saveCoords(gps.lat, gps.lng);
  };

  return (
    <div className="rounded-2xl border border-teal-200 bg-teal-50/60 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-teal-800 to-emerald-800 flex items-center gap-2">
        <LocateFixed className="w-4 h-4 text-white" />
        <span className="text-white font-extrabold text-sm">Tree Identity &amp; GPS Coordinates</span>
        <span className="ml-auto text-teal-200 text-xs">Edit &amp; Save Precise Location</span>
      </div>

      <div className="p-4 space-y-4">

        {/* ── Tree Name ── */}
        <div>
          <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest block mb-1.5">Tree Name / ID</label>
          {editName ? (
            <div className="flex gap-2">
              <input
                className="flex-1 border-2 border-teal-400 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-400"
                value={nameVal}
                onChange={e => setNameVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveName()}
                autoFocus
                placeholder="e.g. T-001, Row3-Tree7"
              />
              <button
                onClick={saveName}
                disabled={saving || !nameVal.trim()}
                className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-40 text-white px-3 py-2 rounded-xl text-xs font-bold transition"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save
              </button>
              <button onClick={() => { setEditName(false); setNameVal(tree.name); }} className="px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-500 hover:bg-gray-50">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-gray-800 text-sm bg-white border border-gray-200 rounded-xl px-3 py-2 flex-1">
                {tree.name || <span className="text-gray-400 italic">Tree #{tree.id.slice(0, 6).toUpperCase()}</span>}
              </span>
              <button
                onClick={() => setEditName(true)}
                className="flex items-center gap-1.5 px-3 py-2 border border-teal-300 bg-white hover:bg-teal-50 text-teal-700 rounded-xl text-xs font-bold transition"
              >
                <Pencil className="w-3 h-3" /> Edit Name
              </button>
            </div>
          )}
        </div>

        {/* ── Coordinates ── */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest">GPS Coordinates</label>
            {!editCoords && (
              <button
                onClick={() => setEditCoords(true)}
                className="flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900 transition"
              >
                <Pencil className="w-3 h-3" /> Edit Coords
              </button>
            )}
          </div>

          {/* Current stored coords (read-only display) */}
          {!editCoords && (
            <div className="font-mono text-xs bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-gray-700 flex items-center gap-3">
              <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>Lat: <strong>{tree.latitude.toFixed(7)}</strong></span>
              <span>Lng: <strong>{tree.longitude.toFixed(7)}</strong></span>
            </div>
          )}

          {/* Editable coord fields */}
          {editCoords && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 font-semibold block mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0000001"
                    min={-90} max={90}
                    className="w-full border-2 border-teal-300 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-400"
                    value={latVal}
                    onChange={e => setLatVal(e.target.value)}
                    placeholder="e.g. 34.0522"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-semibold block mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0000001"
                    min={-180} max={180}
                    className="w-full border-2 border-teal-300 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-400"
                    value={lngVal}
                    onChange={e => setLngVal(e.target.value)}
                    placeholder="e.g. 74.3436"
                  />
                </div>
              </div>

              {/* GPS capture button */}
              <button
                onClick={handleUseGps}
                disabled={saving || gpsState !== 'locked'}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition ${
                  gpsState === 'locked'
                    ? 'bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white shadow'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
                {gpsState === 'locked'
                  ? `Use My GPS — ${gps ? `±${Math.round(gps.accuracy)}m accuracy` : ''}`
                  : gpsState === 'acquiring'
                    ? 'Acquiring GPS signal…'
                    : 'Start GPS first to use device location'}
              </button>

              {/* GPS live reading preview */}
              {gps && gpsState === 'locked' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs font-mono text-emerald-800">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Target className="w-3 h-3 text-emerald-600" />
                    <span className="font-bold text-emerald-700">Device GPS (live)</span>
                    <span className="ml-auto font-semibold text-emerald-600">±{Math.round(gps.accuracy)} m</span>
                  </div>
                  <div className="flex gap-4 text-emerald-700">
                    <span>Lat: {gps.lat.toFixed(7)}</span>
                    <span>Lng: {gps.lng.toFixed(7)}</span>
                  </div>
                  {gps.accuracy <= 5 && <div className="text-emerald-600 font-semibold mt-0.5">Excellent accuracy — safe to lock</div>}
                  {gps.accuracy > 5 && gps.accuracy <= 15 && <div className="text-yellow-600 font-semibold mt-0.5">Good accuracy — usable for tree tagging</div>}
                  {gps.accuracy > 15 && <div className="text-red-500 font-semibold mt-0.5">Low accuracy — wait for better signal</div>}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleManualSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-40 text-white py-2.5 rounded-xl text-xs font-bold transition"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Manual Coordinates
                </button>
                <button
                  onClick={() => {
                    setEditCoords(false);
                    setLatVal(tree.latitude.toFixed(7));
                    setLngVal(tree.longitude.toFixed(7));
                  }}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl text-xs text-gray-500 hover:bg-gray-50 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Card Background Photo ── */}
        <div>
          <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest block mb-1.5">
            Card Background Photo
          </label>
          <p className="text-xs text-gray-400 mb-2">
            Upload a photo — it will be auto-set as this card's background image.
          </p>

          {/* Hidden file input rendered by hook */}
          {cardPhoto.inputEl(file => cardPhoto.uploadCardPhoto(tree.id, file, url => onUpdated({ cardPhotoUrl: url })))}

          {/* Current photo preview or upload button */}
          {tree.cardPhotoUrl ? (
            <div className="relative rounded-2xl overflow-hidden border border-teal-200 shadow-sm">
              <img
                src={tree.cardPhotoUrl}
                alt="Card background"
                className="w-full h-32 object-cover"
                onError={e => { (e.target as HTMLImageElement).src = ''; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2 gap-2">
                <span className="text-white text-xs font-semibold flex-1 truncate">Card photo set</span>
                <button
                  onClick={cardPhoto.openPicker}
                  disabled={cardPhoto.uploading}
                  className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white px-2 py-1 rounded-lg text-xs font-bold transition"
                >
                  {cardPhoto.uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
                  Change
                </button>
              </div>
              {/* Storage verified badge */}
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-emerald-600/90 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                <CheckCircle2 className="w-3 h-3" /> In Storage
              </div>
            </div>
          ) : (
            <button
              onClick={cardPhoto.openPicker}
              disabled={cardPhoto.uploading}
              className="w-full border-2 border-dashed border-teal-300 hover:border-teal-500 rounded-2xl p-5 text-center transition group bg-white disabled:opacity-50"
            >
              {cardPhoto.uploading ? (
                <div className="flex items-center justify-center gap-2 text-teal-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-semibold">Uploading to storage…</span>
                </div>
              ) : (
                <>
                  <Camera className="w-7 h-7 mx-auto mb-1.5 text-teal-400 group-hover:text-teal-600 transition" />
                  <p className="text-sm text-teal-600 font-bold group-hover:text-teal-800">Add Card Photo</p>
                  <p className="text-xs text-gray-400 mt-0.5">Saved to Supabase Storage · Becomes card background</p>
                </>
              )}
            </button>
          )}

          {/* Photo upload status */}
          {cardPhoto.photoMsg && (
            <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold mt-2 ${cardPhoto.photoMsg.ok ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
              {cardPhoto.photoMsg.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              {cardPhoto.photoMsg.text}
            </div>
          )}
        </div>

        {/* Status message */}
        {localMsg && (
          <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold ${localMsg.ok ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {localMsg.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            {localMsg.text}
          </div>
        )}

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SCOUTING FORM MODAL  (premium, with photo + AI prediction)
═══════════════════════════════════════════════════════════════ */

interface ScoutingFormProps {
  tree: TreeTag;
  field: Field;
  gps: GpsReading | null;
  userId: string;
  userName: string;
  historicalSnapshot: TreeHealthSnapshot | undefined;
  onSave: (obs: ScoutingObservation) => void;
  onClose: () => void;
  onUpdateTreeLocation?: (lat: number, lng: number) => void;
  serialNumber?: number;
}

/* ═══════════════════════════════════════════════════════════════
   DOCTOR PICKER MODAL
   Opens a list of Orchard Doctors (fetched from the `doctors` table).
   The user picks one and it's returned via onSelect.
═══════════════════════════════════════════════════════════════ */

interface OD_DoctorProfile {
  id: string;
  name: string;
  specialization: string;
  hospitalName: string;
  phone?: string;
  bio?: string;
  rating: number;
  available: boolean;
}

function DoctorPickerModal({
  onSelect,
  onClose,
}: {
  onSelect: (doctor: OD_DoctorProfile) => void;
  onClose: () => void;
}) {
  const [doctors, setDoctors] = useState<OD_DoctorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  useEffect(() => {
    supabase
      .from('doctors')
      .select('id, name, specialization, hospital_name, phone, bio, rating, available')
      .order('available', { ascending: false })
      .order('rating', { ascending: false })
      .then(({ data }) => {
        setDoctors(
          (data ?? []).map((r: any) => ({
            id: r.id,
            name: r.name,
            specialization: r.specialization,
            hospitalName: r.hospital_name,
            phone: r.phone,
            bio: r.bio,
            rating: r.rating ?? 4.5,
            available: r.available ?? false,
          }))
        );
        setLoading(false);
      });
  }, []);

  const filtered = doctors.filter(d =>
    (d.name + d.specialization + d.hospitalName).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">

        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/15 rounded-xl">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-extrabold text-sm">Our Doctors</p>
              <p className="text-slate-300 text-xs">Select a doctor to assign to this tree</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              className="flex-1 text-sm focus:outline-none bg-transparent placeholder:text-gray-400"
              placeholder="Search by name, specialization…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* Doctor List */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {loading && (
            <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading doctors…</span>
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Stethoscope className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm font-medium">No doctors found.</p>
            </div>
          )}

          {!loading && filtered.map(doctor => (
            <button
              key={doctor.id}
              onClick={() => onSelect(doctor)}
              className="w-full text-left bg-white border-2 border-gray-100 hover:border-emerald-400 hover:shadow-md rounded-2xl overflow-hidden transition-all group"
            >
              <div className={`h-1 w-full ${doctor.available ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-gray-300 to-gray-400'}`} />
              <div className="px-4 py-3 flex items-start gap-3">
                <div className="w-11 h-11 rounded-full bg-slate-800 flex items-center justify-center shrink-0 group-hover:bg-emerald-700 transition-colors">
                  <Stethoscope className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-extrabold text-gray-800 text-sm truncate">{doctor.name}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${doctor.available ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {doctor.available ? '● Available' : '○ Unavailable'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{doctor.specialization} · {doctor.hospitalName}</p>
                  {doctor.bio && <p className="text-xs text-gray-400 truncate mt-0.5">{doctor.bio}</p>}
                  <div className="flex items-center gap-1 mt-1 text-amber-500 text-xs font-bold">
                    {'★'.repeat(Math.min(5, Math.round(doctor.rating)))}
                    <span className="text-gray-500 font-normal ml-1">{doctor.rating.toFixed(1)}</span>
                  </div>
                </div>
                <div className="shrink-0 flex items-center self-center">
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="px-4 pb-4 pt-2 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="w-full py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

const ACTIVITY_TYPES = [
  'Pruning', 'Irrigation', 'Fertilisation', 'Spray — Fungicide',
  'Spray — Insecticide', 'Spray — Herbicide', 'Thinning', 'Training / Binding',
  'Soil Treatment', 'Other',
];

const QUALITY_GRADES = ['Grade A', 'Grade B', 'Grade C', 'Export Quality', 'Culls'];

function ActivitiesForm({ onActivitiesChange }: { onActivitiesChange: (a: ActivityEntry[]) => void }) {
  const [activities, setActivities] = useState<ActivityEntry[]>([
    { date: new Date().toISOString().split('T')[0], type: '', product: '', quantity: '', notes: '' },
  ]);

  const update = (idx: number, field: keyof ActivityEntry, val: string) => {
    setActivities(prev => {
      const updated = prev.map((a, i) => i === idx ? { ...a, [field]: val } : a);
      onActivitiesChange(updated);
      return updated;
    });
  };

  const addRow = () => {
    setActivities(prev => {
      const updated = [...prev, { date: new Date().toISOString().split('T')[0], type: '', product: '', quantity: '', notes: '' }];
      onActivitiesChange(updated);
      return updated;
    });
  };

  const removeRow = (idx: number) => {
    setActivities(prev => {
      const updated = prev.filter((_, i) => i !== idx);
      onActivitiesChange(updated);
      return updated;
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 font-medium">Record activities performed on this tree during or before this scouting visit.</p>
      {activities.map((a, idx) => (
        <div key={idx} className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-3 relative">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-wide">Activity {idx + 1}</span>
            {activities.length > 1 && (
              <button onClick={() => removeRow(idx)} className="p-1 text-red-400 hover:text-red-600 rounded-lg transition">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Date</label>
              <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                value={a.date} onChange={e => update(idx, 'date', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Activity Type</label>
              <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                value={a.type} onChange={e => update(idx, 'type', e.target.value)}>
                <option value="">Select type…</option>
                {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Product / Input</label>
              <input type="text" placeholder="e.g. Mancozeb 75 WP" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                value={a.product} onChange={e => update(idx, 'product', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Quantity / Dose</label>
              <input type="text" placeholder="e.g. 2.5 g/L" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                value={a.quantity} onChange={e => update(idx, 'quantity', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1">Notes</label>
            <input type="text" placeholder="Optional notes…" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              value={a.notes} onChange={e => update(idx, 'notes', e.target.value)} />
          </div>
        </div>
      ))}
      <button onClick={addRow}
        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-emerald-300 hover:border-emerald-500 text-emerald-700 py-3 rounded-2xl text-sm font-bold transition bg-white hover:bg-emerald-50">
        <Plus className="w-4 h-4" /> Add Activity
      </button>
    </div>
  );
}

const CRATE_KG = 17;

function calcCrates(yieldKg: string): string {
  const kg = parseFloat(yieldKg);
  if (!yieldKg || isNaN(kg) || kg <= 0) return '';
  return Math.ceil(kg / CRATE_KG).toString();
}

function ProductionForm({ onProductionChange }: { onProductionChange: (p: ProductionEntry[]) => void }) {
  const [entries, setEntries] = useState<ProductionEntry[]>([
    { date: new Date().toISOString().split('T')[0], fruitSize: '', colorPct: '', estimatedYieldKg: '', numberOfCrates: '', qualityGrade: '', notes: '' },
  ]);

  const update = (idx: number, field: keyof ProductionEntry, val: string) => {
    setEntries(prev => {
      const updated = prev.map((e, i) => {
        if (i !== idx) return e;
        const next = { ...e, [field]: val };
        if (field === 'estimatedYieldKg') {
          next.numberOfCrates = calcCrates(val);
        }
        return next;
      });
      onProductionChange(updated);
      return updated;
    });
  };

  const addRow = () => {
    setEntries(prev => {
      const updated = [...prev, { date: new Date().toISOString().split('T')[0], fruitSize: '', colorPct: '', estimatedYieldKg: '', numberOfCrates: '', qualityGrade: '', notes: '' }];
      onProductionChange(updated);
      return updated;
    });
  };

  const removeRow = (idx: number) => {
    setEntries(prev => {
      const updated = prev.filter((_, i) => i !== idx);
      onProductionChange(updated);
      return updated;
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 font-medium">Record fruit production data observed on this tree.</p>
      {entries.map((e, idx) => (
        <div key={idx} className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-3 relative">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-extrabold text-indigo-700 uppercase tracking-wide">Record {idx + 1}</span>
            {entries.length > 1 && (
              <button onClick={() => removeRow(idx)} className="p-1 text-red-400 hover:text-red-600 rounded-lg transition">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Date</label>
              <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={e.date} onChange={ev => update(idx, 'date', ev.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Quality Grade</label>
              <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                value={e.qualityGrade} onChange={ev => update(idx, 'qualityGrade', ev.target.value)}>
                <option value="">Select grade…</option>
                {QUALITY_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Fruit Size (mm)</label>
              <input type="number" min={0} placeholder="e.g. 65" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={e.fruitSize} onChange={ev => update(idx, 'fruitSize', ev.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Color (%)</label>
              <input type="number" min={0} max={100} placeholder="e.g. 70" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={e.colorPct} onChange={ev => update(idx, 'colorPct', ev.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Est. Yield (kg)</label>
              <input type="number" min={0} step={0.1} placeholder="e.g. 12.5" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={e.estimatedYieldKg} onChange={ev => update(idx, 'estimatedYieldKg', ev.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">No. of Crates <span className="text-gray-400 font-normal">(1 crate = 17 kg)</span></label>
              <div className="relative">
                <input type="text" readOnly
                  placeholder="Auto-calculated"
                  className="w-full border border-indigo-200 rounded-xl px-3 py-2 text-sm bg-indigo-50 text-indigo-800 font-bold cursor-default focus:outline-none"
                  value={e.numberOfCrates} />
                {e.numberOfCrates && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-indigo-400 font-medium">crates</span>
                )}
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1">Notes</label>
            <input type="text" placeholder="Optional notes…" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={e.notes} onChange={ev => update(idx, 'notes', ev.target.value)} />
          </div>
        </div>
      ))}
      <button onClick={addRow}
        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-indigo-300 hover:border-indigo-500 text-indigo-700 py-3 rounded-2xl text-sm font-bold transition bg-white hover:bg-indigo-50">
        <Plus className="w-4 h-4" /> Add Production Record
      </button>
    </div>
  );
}

type ScoutingFormTab = 'scouting' | 'activities' | 'production';

function ScoutingForm({ tree, field, gps, userId, userName, historicalSnapshot, onSave, onClose, onUpdateTreeLocation, serialNumber }: ScoutingFormProps) {
  const [locationSaving, setLocationSaving] = useState(false);
  const [locationMsg, setLocationMsg]       = useState<string | null>(null);
  const [activeTab, setActiveTab]           = useState<ScoutingFormTab>('scouting');
  const [bbchStage, setBbchStage]         = useState(51);
  const [bbchLabel, setBbchLabel]         = useState(BBCH_STAGES[1].label);
  const [pestIdx, setPestIdx]             = useState(0);
  const [customPest, setCustomPest]       = useState('');
  const [pestCount, setPestCount]         = useState(0);
  const [severity, setSeverity]           = useState(0);
  const [affectedPart, setAffectedPart]   = useState<PlantPart>('LEAF');
  const [notes, setNotes]                 = useState('');
  const [prediction, setPrediction]       = useState<AIPrediction | null>(null);
  const [predicting, setPredicting]       = useState(false);
  const [activities, setActivities]       = useState<ActivityEntry[]>([]);
  const [production, setProduction]       = useState<ProductionEntry[]>([]);
  const [assignedDoctor, setAssignedDoctor] = useState<OD_DoctorProfile | null>(null);
  const [showDoctorPicker, setShowDoctorPicker] = useState(false);
  const photo = usePhotoCapture();

  const selectedPest = COMMON_PESTS[pestIdx];
  const pestName     = selectedPest.eppo === 'NONE' && customPest.trim() ? customPest.trim() : selectedPest.name;

  /* Re-run AI whenever key inputs change */
  useEffect(() => {
    if (severity === 0 && selectedPest.eppo === 'NONE') { setPrediction(null); return; }
    setPredicting(true);
    const t = setTimeout(() => {
      const p = runAIPrediction({
        pestEppo: selectedPest.eppo,
        pestCategory: selectedPest.category,
        severity,
        pestCount,
        bbchStage,
        variety: tree.variety,
        affectedPart,
        historicalInfectedCount: historicalSnapshot?.infectedCount ?? 0,
        historicalCriticalCount: historicalSnapshot?.criticalCount ?? 0,
      });
      setPrediction(p);
      setPredicting(false);
    }, 400); // debounce
    return () => clearTimeout(t);
  }, [severity, pestIdx, pestCount, bbchStage, affectedPart, selectedPest.eppo, selectedPest.category, tree.variety, historicalSnapshot]);

  const handleSave = async () => {
    const obs: ScoutingObservation = {
      id:                   newUUID(),
      clientUuid:           newUUID(),
      syncStatus:           'PENDING_SYNC',
      treeTagId:            tree.id,
      fieldId:              field.id,
      treeVariety:          tree.variety,
      treeRowNumber:        tree.rowNumber,
      scoutedBy:            userName,
      scoutedAt:            new Date().toISOString(),
      bbchStage,
      bbchLabel,
      pestEppoCode:         selectedPest.eppo,
      pestName,
      pestCategory:         selectedPest.category,
      pestCount,
      severityScore:        severity,
      affectedPart,
      notes,
      photoBase64:          photo.photoBase64,
      photoUrl:             null,
      gpsLat:               gps?.lat ?? null,
      gpsLng:               gps?.lng ?? null,
      gpsAccuracyM:         gps?.accuracy ?? null,
      treeHealthStatus:     prediction?.predictedHealth ?? (severity === 0 ? 'HEALTHY' : severity <= 2 ? 'STRESSED' : severity <= 4 ? 'INFECTED' : 'CRITICAL'),
      etlActionRecommended: prediction?.recommendation ?? 'NO_ACTION',
      aiPrediction:         prediction,
      activities:           activities,
      production:           production,
    };

    // Save observation first
    onSave(obs);

    // Save activities to calendar (if any)
    if (activities.length > 0) {
      const treeContext = {
        treeId: tree.id,
        treeName: tree.name,
        treeRowNumber: tree.rowNumber,
        treeSerialNumber: serialNumber || 1,
        fieldId: field.id,
      };

      await saveActivitiesToCalendar(userId, activities, treeContext);
    }

    onClose();
  };

  const canSave = pestName.trim().length > 0;

  return (
    <>
    {showDoctorPicker && (
      <DoctorPickerModal
        onSelect={(doctor) => { setAssignedDoctor(doctor); setShowDoctorPicker(false); }}
        onClose={() => setShowDoctorPicker(false)}
      />
    )}
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm">
      {photo.inputEl}
      <div className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[96vh] flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-800 px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-2xl">
              <Bug className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {serialNumber != null && (
                  <span className="bg-white/20 text-white text-xs font-extrabold px-2 py-0.5 rounded">
                    #{serialNumber}
                  </span>
                )}
                <p className="text-white font-extrabold text-base">
                  {tree.name || `Tree #${tree.id.slice(0,6).toUpperCase()}`}
                </p>
              </div>
              <p className="text-emerald-300 text-xs">
                {tree.variety || 'Unknown variety'} · {field.name}
                {tree.rowNumber != null && ` · Row ${tree.rowNumber}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {gps && <GpsStatusBadge state="locked" accuracy={gps.accuracy} />}
            <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Slidable Tab Bar */}
        <div className="shrink-0 bg-emerald-950 px-4 py-2 flex gap-1">
          {([
            { key: 'scouting',    label: 'Scouting',    icon: Bug         },
            { key: 'activities',  label: 'Activities',  icon: Activity    },
            { key: 'production',  label: 'Production',  icon: BarChart2   },
          ] as { key: ScoutingFormTab; label: string; icon: any }[]).map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === t.key
                  ? 'bg-white text-emerald-900 shadow'
                  : 'text-emerald-300 hover:bg-white/10'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Tree GPS info strip */}
        {gps && (
          <div className="bg-teal-900/90 px-4 py-2.5 shrink-0 space-y-1.5">
            <div className="flex items-center gap-3 text-xs">
              <Target className="w-3.5 h-3.5 text-teal-300 shrink-0" />
              <span className="text-teal-200 font-mono">Scout GPS: {gps.lat.toFixed(6)}, {gps.lng.toFixed(6)}</span>
              <span className="text-teal-400">·</span>
              <span className={`font-semibold ${gps.accuracy <= 5 ? 'text-emerald-300' : gps.accuracy <= 15 ? 'text-yellow-300' : 'text-red-400'}`}>
                ±{Math.round(gps.accuracy)} m
              </span>
              <span className="text-teal-500 ml-auto text-xs">Tree stored: {tree.latitude.toFixed(5)}, {tree.longitude.toFixed(5)}</span>
            </div>
            {/* One-tap set tree location */}
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  if (!gps || !onUpdateTreeLocation) return;
                  setLocationSaving(true);
                  setLocationMsg(null);
                  const { error } = await supabase
                    .from('tree_tags')
                    .update({ latitude: gps.lat, longitude: gps.lng, updated_at: new Date().toISOString() })
                    .eq('id', tree.id);
                  setLocationSaving(false);
                  if (error) { setLocationMsg('Failed: ' + error.message); }
                  else { onUpdateTreeLocation(gps.lat, gps.lng); setLocationMsg('Tree location updated!'); setTimeout(() => setLocationMsg(null), 3000); }
                }}
                disabled={locationSaving || !onUpdateTreeLocation}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition"
              >
                {locationSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <LocateFixed className="w-3 h-3" />}
                Set This Tree's Location to My GPS
              </button>
              {locationMsg && (
                <span className={`text-xs font-semibold ${locationMsg.startsWith('Failed') ? 'text-red-300' : 'text-emerald-300'}`}>
                  {locationMsg}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="overflow-y-auto flex-1 p-5 space-y-4">

          {/* ── Activities Tab ── */}
          {activeTab === 'activities' && (
            <ActivitiesForm onActivitiesChange={setActivities} />
          )}

          {/* ── Production Tab ── */}
          {activeTab === 'production' && (
            <ProductionForm onProductionChange={setProduction} />
          )}

          {/* ── Scouting Tab ── */}
          {activeTab === 'scouting' && <>

          {/* BBCH Stage */}
          <div>
            <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest block mb-2">Growth Stage (BBCH)</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {BBCH_STAGES.map(s => (
                <button
                  key={s.value}
                  onClick={() => { setBbchStage(s.value); setBbchLabel(s.label); }}
                  className={`px-2 py-2 rounded-xl border text-xs font-bold transition text-center ${bbchStage === s.value ? 'bg-emerald-800 text-white border-emerald-800 shadow' : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pest / Disease Grid */}
          <div>
            <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest block mb-2">Pest / Disease (EPPO)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {COMMON_PESTS.map((p, i) => {
                const isHighRisk = p.highRiskBBCH.includes(bbchStage);
                return (
                  <button
                    key={p.eppo}
                    onClick={() => setPestIdx(i)}
                    className={`text-left px-3 py-2.5 rounded-xl border-2 transition relative ${pestIdx === i ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-white border-gray-200 text-gray-700 hover:border-emerald-300'}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{p.icon}</span>
                      <span className="font-bold text-xs leading-tight">{p.name}</span>
                    </div>
                    <div className={`text-xs mt-0.5 font-mono ${pestIdx === i ? 'text-emerald-200' : 'text-gray-400'}`}>{p.eppo}</div>
                    {isHighRisk && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full" title="High risk at this BBCH stage" />
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
              <span className="w-2 h-2 bg-amber-400 rounded-full inline-block" /> Amber dot = high risk at current growth stage
            </p>
            {selectedPest.eppo === 'NONE' && (
              <input
                className="mt-2 border rounded-xl px-3 py-2.5 text-sm w-full focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                placeholder="Describe the issue..."
                value={customPest}
                onChange={e => setCustomPest(e.target.value)}
              />
            )}
          </div>

          {/* Count + Affected Part */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest block mb-2">Pest Count</label>
              <div className="flex items-center border rounded-xl overflow-hidden">
                <button onClick={() => setPestCount(Math.max(0, pestCount - 1))} className="px-3 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-lg transition">−</button>
                <input
                  type="number" min={0}
                  className="flex-1 text-center text-sm font-bold focus:outline-none py-2.5"
                  value={pestCount}
                  onChange={e => setPestCount(Math.max(0, +e.target.value))}
                />
                <button onClick={() => setPestCount(pestCount + 1)} className="px-3 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-lg transition">+</button>
              </div>
            </div>
            <div>
              <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest block mb-2">Affected Part</label>
              <div className="grid grid-cols-2 gap-1.5">
                {PLANT_PARTS.map(p => (
                  <button
                    key={p.key}
                    onClick={() => setAffectedPart(p.key)}
                    className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border text-xs font-semibold transition ${affectedPart === p.key ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-white border-gray-200 text-gray-600 hover:border-emerald-300'}`}
                  >
                    <span>{p.icon}</span> {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Severity Slider */}
          <div>
            <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest block mb-2">
              Severity: <span className="text-emerald-700 normal-case">{SEVERITY_LABELS[severity]}</span> ({severity}/5)
            </label>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4, 5].map(s => (
                <button
                  key={s}
                  onClick={() => setSeverity(s)}
                  className={`flex-1 py-3 rounded-xl font-extrabold text-sm border-2 transition ${severity === s ? `${SEVERITY_COLORS[s]} text-white border-transparent shadow` : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
              <span>None</span><span>Trace</span><span>Low</span><span>Mod</span><span>High</span><span>Severe</span>
            </div>
          </div>

          {/* AI Prediction — live */}
          {predicting && (
            <div className="flex items-center gap-2 text-sm text-indigo-600 animate-pulse">
              <Brain className="w-4 h-4" /> Analysing with AI engine…
            </div>
          )}
          {!predicting && prediction && <AIPredictionPanel prediction={prediction} />}

          {/* Photo Section */}
          <div>
            <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest block mb-2">Tree Photo (Optional)</label>
            {photo.photoBase64 ? (
              <div className="relative rounded-2xl overflow-hidden border border-gray-200">
                <img src={photo.photoBase64} alt="Tree observation" className="w-full h-48 object-cover" />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button onClick={photo.openPicker} className="p-2 bg-black/60 hover:bg-black/80 rounded-xl text-white transition">
                    <Camera className="w-4 h-4" />
                  </button>
                  <button onClick={photo.clear} className="p-2 bg-red-500/80 hover:bg-red-600 rounded-xl text-white transition">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg font-semibold">
                  {photo.photoName}
                </div>
              </div>
            ) : (
              <button
                onClick={photo.openPicker}
                className="w-full border-2 border-dashed border-gray-200 hover:border-emerald-400 rounded-2xl p-6 text-center transition group"
              >
                <Camera className="w-8 h-8 mx-auto mb-2 text-gray-300 group-hover:text-emerald-500 transition" />
                <p className="text-sm text-gray-400 group-hover:text-emerald-600 font-semibold transition">Tap to capture / attach photo</p>
                <p className="text-xs text-gray-300 mt-0.5">Camera or gallery • Stored offline until sync</p>
              </button>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest block mb-2">Field Notes (Optional)</label>
            <textarea
              rows={2}
              className="border rounded-xl px-3 py-2.5 text-sm w-full focus:ring-2 focus:ring-emerald-400 focus:outline-none resize-none"
              placeholder="Additional observations, spray history, microclimate notes…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {/* Assign Doctor */}
          <div>
            <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest block mb-2">Assigned Doctor</label>
            {assignedDoctor ? (
              <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                  <Stethoscope className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-gray-800 text-sm truncate">{assignedDoctor.name}</p>
                  <p className="text-xs text-gray-500 truncate">{assignedDoctor.specialization} · {assignedDoctor.hospitalName}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setShowDoctorPicker(true)}
                    className="text-xs font-bold text-slate-600 underline hover:text-slate-900 transition"
                  >
                    Change
                  </button>
                  <button
                    onClick={() => setAssignedDoctor(null)}
                    className="p-1 text-gray-400 hover:text-red-500 rounded-lg transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowDoctorPicker(true)}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 hover:border-slate-500 text-slate-700 hover:text-slate-900 py-3.5 rounded-2xl text-sm font-bold transition bg-white hover:bg-slate-50"
              >
                <UserCheck className="w-4 h-4" />
                Assign Orchard Doctor
              </button>
            )}
          </div>

          </> /* end scouting tab */}

        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-4 border-t border-gray-100 flex gap-3 shrink-0">
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-800 to-teal-700 hover:from-emerald-900 hover:to-teal-800 disabled:opacity-40 text-white py-3.5 rounded-xl font-extrabold text-sm transition shadow-lg"
          >
            <CheckCircle2 className="w-4 h-4" /> Save Observation
          </button>
          <button onClick={onClose} className="px-5 py-3.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
            Cancel
          </button>
        </div>
      </div>
    </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TREE HEALTH CARD (premium)
═══════════════════════════════════════════════════════════════ */

function TreeHealthCard({
  tree, snapshot, obsCount, selected, onClick, serialNumber,
}: {
  tree: TreeTag; snapshot: TreeHealthSnapshot | undefined;
  obsCount: number; selected: boolean; onClick: () => void;
  serialNumber?: number;
}) {
  const status = snapshot?.healthStatus ?? 'HEALTHY';
  const meta   = HEALTH_META[status];
  const hasBg  = Boolean(tree.cardPhotoUrl);

  return (
    <button
      onClick={onClick}
      className={`text-left w-full rounded-2xl border-2 overflow-hidden transition-all ${
        selected
          ? `${meta.border} shadow-lg scale-[1.02]`
          : `border-gray-100 hover:border-gray-300 hover:shadow-md`
      }`}
    >
      {/* Color bar top */}
      <div className={`h-1.5 bg-gradient-to-r ${meta.gradient}`} />

      {/* Card body — photo background if available */}
      <div
        className={`p-3.5 relative ${hasBg ? '' : 'bg-white'}`}
        style={hasBg ? {
          backgroundImage: `url(${tree.cardPhotoUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : undefined}
      >
        {/* Dark overlay when photo is present so text stays readable */}
        {hasBg && (
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60 pointer-events-none" />
        )}

        <div className="relative z-10">
          {/* Serial number badge */}
          {serialNumber != null && (
            <div className={`absolute top-0 left-0 w-6 h-6 flex items-center justify-center rounded-br-xl text-xs font-extrabold shadow ${hasBg ? 'bg-black/60 text-white' : 'bg-red-700 text-white'}`}>
              {serialNumber}
            </div>
          )}
          <div className="flex items-start justify-between mb-2">
            <HealthRing status={status} size={44} />
            <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full border ${hasBg ? 'bg-black/50 text-white border-white/30' : `${meta.bg} ${meta.text} ${meta.border}`}`}>
              {meta.label}
            </span>
          </div>
          
          <p className={`text-xs truncate ${hasBg ? 'text-white/80' : 'text-gray-500'}`}>
            {tree.variety || 'Unknown variety'}
          </p>
          {tree.rowNumber && (
            <p className={`text-xs ${hasBg ? 'text-white/70' : 'text-gray-400'}`}>
              Row {tree.rowNumber}
            </p>
          )}
          <div className="mt-2.5 flex items-center justify-between">
            <span className={`text-xs ${hasBg ? 'text-white/70' : 'text-gray-400'}`}>{obsCount} obs</span>
            {snapshot?.riskScore != null && snapshot.riskScore > 0 && (
              <span className={`text-xs font-bold ${hasBg ? 'text-white drop-shadow' : snapshot.riskScore >= 65 ? 'text-red-600' : snapshot.riskScore >= 30 ? 'text-orange-500' : 'text-emerald-600'}`}>
                Risk {snapshot.riskScore}
              </span>
            )}
          </div>
          {snapshot?.etlAction && snapshot.etlAction !== 'NO_ACTION' && (
            <div className={`mt-2 text-xs font-bold px-2 py-1 rounded-lg ${hasBg ? 'bg-black/50 text-white' : `${ETL_META[snapshot.etlAction].bg} ${ETL_META[snapshot.etlAction].color}`}`}>
              {ETL_META[snapshot.etlAction].label}
            </div>
          )}
          {/* Small camera icon if photo is set */}
          {hasBg && (
            <div className="absolute top-0 right-0 mt-0 mr-0">
              <ImageIcon className="w-3 h-3 text-white/60" />
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   OBSERVATION CARD
═══════════════════════════════════════════════════════════════ */

function ObsCard({ obs, treeName }: { obs: ScoutingObservation; treeName: string }) {
  const [open, setOpen] = useState(false);
  const meta = HEALTH_META[obs.treeHealthStatus];

  return (
    <div className={`rounded-2xl border overflow-hidden ${meta.border}`}>
      <div className={`px-5 py-3.5 flex items-center justify-between cursor-pointer ${meta.bg}`} onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-3">
          <HealthRing status={obs.treeHealthStatus} size={40} />
          <div>
            <p className="font-bold text-sm text-gray-800">{treeName} — {obs.pestName}</p>
            <p className="text-xs text-gray-500">{obs.bbchLabel} · {fmtDate(obs.scoutedAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {obs.photoBase64 || obs.photoUrl
            ? <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
            : null}
          {obs.aiPrediction && <Brain className="w-3.5 h-3.5 text-violet-500" />}
          {obs.syncStatus === 'PENDING_SYNC' ? <WifiOff className="w-3.5 h-3.5 text-orange-500" /> : <Wifi className="w-3.5 h-3.5 text-emerald-500" />}
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {open && (
        <div className="px-5 pb-5 pt-3 bg-white space-y-3">
          {/* Photo */}
          {(obs.photoBase64 || obs.photoUrl) && (
            <img
              src={obs.photoUrl ?? obs.photoBase64 ?? ''}
              alt="Observation"
              className="w-full h-44 object-cover rounded-xl border border-gray-100"
            />
          )}

          <div className="grid grid-cols-3 gap-2 text-xs">
            {[
              { label: 'Severity', value: `${SEVERITY_LABELS[obs.severityScore]} (${obs.severityScore}/5)` },
              { label: 'Pest Count', value: obs.pestCount },
              { label: 'Affected', value: obs.affectedPart },
              { label: 'EPPO Code', value: obs.pestEppoCode },
              { label: 'Variety', value: obs.treeVariety || '—' },
              { label: 'Row', value: obs.treeRowNumber ?? '—' },
            ].map(f => (
              <div key={f.label} className="bg-gray-50 rounded-xl p-2.5">
                <p className="font-bold text-gray-400 uppercase mb-0.5 text-xs">{f.label}</p>
                <p className="font-semibold text-gray-700">{String(f.value)}</p>
              </div>
            ))}
          </div>

          {obs.gpsLat && obs.gpsLng && (
            <div className="flex items-center gap-2 text-xs bg-teal-50 border border-teal-200 rounded-xl px-3 py-2">
              <Target className="w-3 h-3 text-teal-600 shrink-0" />
              <span className="text-teal-700 font-mono">Scout GPS: {obs.gpsLat.toFixed(5)}, {obs.gpsLng.toFixed(5)}</span>
              {obs.gpsAccuracyM && <span className="ml-auto text-teal-500">±{Math.round(obs.gpsAccuracyM)} m</span>}
            </div>
          )}

          {obs.aiPrediction && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2.5 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-extrabold text-indigo-700 mb-1">
                <Brain className="w-3.5 h-3.5" /> AI Prediction at time of scouting
              </div>
              <p><span className="font-bold text-gray-600">Risk Score:</span> {obs.aiPrediction.riskScore}/100</p>
              <p><span className="font-bold text-gray-600">Spread Risk:</span> {obs.aiPrediction.spreadRisk}</p>
              <p><span className="font-bold text-gray-600">Confidence:</span> {obs.aiPrediction.confidence}%</p>
              <p className="text-gray-600 leading-relaxed">{obs.aiPrediction.reasoning}</p>
            </div>
          )}

          {obs.notes && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-xs text-blue-800">
              <span className="font-bold">Notes:</span> {obs.notes}
            </div>
          )}

          <div className="flex items-center text-xs text-gray-400 gap-2">
            <Clock className="w-3 h-3" /> Scouted by <span className="font-semibold text-gray-600">{obs.scoutedBy}</span>
            <span className={`ml-auto flex items-center gap-1 font-semibold ${obs.syncStatus === 'PENDING_SYNC' ? 'text-orange-500' : 'text-emerald-600'}`}>
              {obs.syncStatus === 'PENDING_SYNC' ? <><WifiOff className="w-3 h-3" /> Offline</> : <><Wifi className="w-3 h-3" /> Synced</>}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ALERT CARD
═══════════════════════════════════════════════════════════════ */

function AlertCard({ alert }: { alert: ScoutingAlert }) {
  const meta = HEALTH_META[alert.severity];
  const Icon = alert.severity === 'CRITICAL' ? Zap : alert.severity === 'INFECTED' ? Bug : AlertTriangle;
  return (
    <div className={`rounded-2xl border-2 overflow-hidden ${meta.border}`}>
      <div className={`px-5 py-4 flex items-start gap-4 ${meta.bg}`}>
        <div className="p-2.5 bg-white/60 rounded-xl shrink-0">
          <Icon className={`w-5 h-5 ${meta.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge className={`${meta.bg} ${meta.text} ${meta.border}`}>{meta.label}</Badge>
            <Badge className="border-gray-200 text-gray-600 bg-white">
              {alert.alertLevel === 'TREE' ? '🌳 Tree' : alert.alertLevel === 'BLOCK' ? '📦 Block' : '🌲 Orchard'}
            </Badge>
            <Badge className={alert.alertStatus === 'OPEN' ? 'border-red-300 text-red-700 bg-red-50' : 'border-green-300 text-green-700 bg-green-50'}>
              {alert.alertStatus}
            </Badge>
          </div>
          <p className="font-extrabold text-gray-800 text-sm">{alert.pestName}</p>
          <p className="text-xs text-gray-600 mt-1 leading-relaxed">{alert.message}</p>
          {alert.blockInfectedPct != null && (
            <div className="mt-2 bg-white/70 rounded-xl px-3 py-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold">Block Infection Rate</span>
                <span className={`font-extrabold ${alert.blockInfectedPct >= 25 ? 'text-red-600' : 'text-yellow-600'}`}>{alert.blockInfectedPct.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className={`h-2 rounded-full ${alert.blockInfectedPct >= 25 ? 'bg-red-500' : 'bg-yellow-400'}`} style={{ width: `${Math.min(100, alert.blockInfectedPct)}%` }} />
              </div>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {fmtDate(alert.createdAt)}
            <span className={`ml-3 font-bold ${ETL_META[alert.etlAction].color}`}>{ETL_META[alert.etlAction].label}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */

interface TreeScoutingProps {
  fieldId?: string;
  orchardName?: string;
}

export default function TreeScouting({ fieldId: propFieldId }: TreeScoutingProps) {
  const { user }   = useAuth();
  const userId     = user?.id ?? '';
  const userName   = (user as any)?.name || user?.email || 'Scout';
  const gpsHook    = useGpsLock();

  // URL params: ?fieldId=xxx&treeTagId=yyy (set by Fields"View Full Scouting" button)
  const [searchParams] = useSearchParams();
  const urlFieldId   = searchParams.get('fieldId') ?? '';
  const urlTreeTagId = searchParams.get('treeTagId') ?? '';

  const [tab, setTab]                       = useState<'scout' | 'dashboard' | 'alerts' | 'history'>('scout');
  const [fields, setFields]                 = useState<Field[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState(urlFieldId || propFieldId || '');
  const [treeTags, setTreeTags]             = useState<TreeTag[]>([]);
  const [snapshots, setSnapshots]           = useState<TreeHealthSnapshot[]>([]);
  const [alerts, setAlerts]                 = useState<ScoutingAlert[]>([]);
  const [syncedObs, setSyncedObs]           = useState<ScoutingObservation[]>([]);
  const [pendingObs, setPendingObs]         = useState<ScoutingObservation[]>([]);
  const [loading, setLoading]               = useState(false);
  const [syncing, setSyncing]               = useState(false);
  const [syncMsg, setSyncMsg]               = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [isOnline, setIsOnline]             = useState(navigator.onLine);
  const [scoutingTree, setScoutingTree]     = useState<TreeTag | null>(null);
  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null);
  const [search, setSearch]                 = useState('');
  const [filterHealth, setFilterHealth]     = useState<HealthStatus | 'ALL'>('ALL');
  // Track whether we've already done the initial URL-param tree auto-selection
  const urlTreeAutoSelected = useRef(false);

  /* Online/offline */
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  /* Load offline obs */
  useEffect(() => {
    if (!userId) return;
    const pending = loadOfflineObs(userId).filter(o => o.syncStatus === 'PENDING_SYNC');
    setPendingObs(pending);
  }, [userId]);

  /* Load fields */
  useEffect(() => {
    if (!userId) return;
    supabase.from('fields').select('id, name').eq('user_id', userId).then(({ data }) => {
      const rows = (data ?? []) as Field[];
      setFields(rows);
      // Priority: URL param fieldId > prop fieldId > first field
      if (!urlFieldId && !propFieldId && rows.length > 0 && !selectedFieldId) setSelectedFieldId(rows[0].id);
    });
  }, [userId, propFieldId, urlFieldId]);

  const currentField = useMemo(() => fields.find(f => f.id === selectedFieldId), [fields, selectedFieldId]);

  /* Load trees */
  useEffect(() => {
    if (!selectedFieldId || !userId) return;
    setLoading(true);
    supabase.from('tree_tags').select('id,name,variety,row_number,latitude,longitude,health_status,field_id,card_photo_url')
      .eq('field_id', selectedFieldId).eq('user_id', userId)
      .then(async ({ data }) => {
        const rows = (data ?? []).map((r: any) => ({
          id: r.id, name: r.name ?? '', variety: r.variety ?? '',
          rowNumber: r.row_number ?? null, latitude: r.latitude, longitude: r.longitude,
          healthStatus: r.health_status ?? 'Good', fieldId: r.field_id,
          cardPhotoUrl: r.card_photo_url ?? null,
        }));
        setTreeTags(rows);
        setLoading(false);
      });
  }, [selectedFieldId, userId]);

  /* Auto-select tree from URL param treeTagId — runs once after treeTags load */
  useEffect(() => {
    if (!urlTreeTagId || urlTreeAutoSelected.current || treeTags.length === 0) return;
    const match = treeTags.find(t => t.id === urlTreeTagId);
    if (match) {
      setSelectedTreeId(match.id);
      setScoutingTree(match);
      setTab('scout');
      urlTreeAutoSelected.current = true;
    }
  }, [treeTags, urlTreeTagId]);

  /* Verify card photos exist in Supabase Storage for trees that have a card_photo_url.
     Runs after trees are loaded — refreshes signed URLs and clears stale DB entries. */
  useEffect(() => {
    if (!userId || !treeTags.length) return;
    // Only check trees that claim to have a photo
    const treesWithPhoto = treeTags.filter(t => t.cardPhotoUrl);
    if (!treesWithPhoto.length) return;

    (async () => {
      // List all files in the user's tree-card folder once
      const { data: files } = await supabase.storage
        .from('scouting-photos')
        .list(`${userId}/tree-card`);

      const presentSet = new Set((files ?? []).map(f => f.name.split('.')[0])); // treeId part

      // For trees whose photo is NOT in storage, clear the DB url
      const stale = treesWithPhoto.filter(t => !presentSet.has(t.id));
      if (stale.length) {
        // Fire-and-forget DB cleanup
        stale.forEach(t => {
          supabase.from('tree_tags')
            .update({ card_photo_url: null, updated_at: new Date().toISOString() })
            .eq('id', t.id)
            .then(() => {});
        });
        // Clear from local state
        setTreeTags(prev => prev.map(t =>
          stale.find(s => s.id === t.id) ? { ...t, cardPhotoUrl: null } : t,
        ));
      }
    })();
  }, [userId, treeTags.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSnapshots = useCallback(async () => {
    if (!selectedFieldId || !userId) return;
    const { data } = await supabase.from('tree_health_snapshots').select('*').eq('field_id', selectedFieldId).eq('user_id', userId);
    setSnapshots((data ?? []).map((r: any) => ({
      treeTagId: r.tree_tag_id, fieldId: r.field_id, healthStatus: r.health_status ?? 'HEALTHY',
      lastScoutedAt: r.last_scouted_at, lastPestEppo: r.last_pest_eppo,
      lastSeverityScore: r.last_severity_score ?? 0, totalObservations: r.total_observations ?? 0,
      etlAction: r.etl_action ?? 'NO_ACTION', riskScore: r.risk_score ?? 0,
      infectedCount: r.infected_count ?? 0, criticalCount: r.critical_count ?? 0,
    })));
  }, [selectedFieldId, userId]);

  const loadObs = useCallback(async () => {
    if (!selectedFieldId || !userId) return;
    const { data } = await supabase.from('tree_scouting_observations').select('*')
      .eq('field_id', selectedFieldId).eq('user_id', userId).order('scouted_at', { ascending: false }).limit(200);
    setSyncedObs((data ?? []).map((r: any) => ({
      id: r.id, clientUuid: r.client_uuid, syncStatus: 'SYNCED' as SyncStatus,
      treeTagId: r.tree_tag_id, fieldId: r.field_id,
      treeVariety: r.tree_variety ?? '', treeRowNumber: r.tree_row_number,
      scoutedBy: r.scouted_by ?? '', scoutedAt: r.scouted_at,
      bbchStage: r.bbch_stage ?? 0, bbchLabel: r.bbch_label ?? '',
      pestEppoCode: r.pest_eppo_code ?? '', pestName: r.pest_name ?? '',
      pestCategory: r.pest_category ?? 'PEST', pestCount: r.pest_count ?? 0,
      severityScore: r.severity_score ?? 0, affectedPart: r.affected_part ?? 'LEAF',
      notes: r.notes ?? '', photoBase64: null, photoUrl: r.photo_url ?? null,
      gpsLat: r.gps_lat, gpsLng: r.gps_lng, gpsAccuracyM: r.gps_accuracy_m,
      treeHealthStatus: r.tree_health_status ?? 'HEALTHY',
      etlActionRecommended: r.etl_action_recommended ?? 'NO_ACTION',
      aiPrediction: r.ai_prediction ?? null,
      activities: [],   // loaded separately from tree_scouting_activities if needed
      production: [],   // loaded separately from tree_scouting_production if needed
    })));
  }, [selectedFieldId, userId]);

  const loadAlerts = useCallback(async () => {
    if (!selectedFieldId || !userId) return;
    const { data } = await supabase.from('tree_scouting_alerts').select('*')
      .eq('field_id', selectedFieldId).eq('user_id', userId).order('created_at', { ascending: false }).limit(50);
    setAlerts((data ?? []).map((r: any) => ({
      id: r.id, fieldId: r.field_id, treeTagId: r.tree_tag_id,
      alertLevel: r.alert_level ?? 'TREE', alertStatus: r.alert_status ?? 'OPEN',
      severity: r.severity ?? 'INFECTED', pestName: r.pest_name ?? '',
      etlAction: r.etl_action ?? 'NO_ACTION', message: r.message ?? '',
      blockInfectedPct: r.block_infected_pct, affectedTreeCount: r.affected_tree_count ?? 1,
      createdAt: r.created_at,
    })));
  }, [selectedFieldId, userId]);

  useEffect(() => {
    if (!selectedFieldId) return;
    loadSnapshots(); loadObs(); loadAlerts();
  }, [selectedFieldId]);

  const handleSaveObs = useCallback((obs: ScoutingObservation) => {
    setPendingObs(prev => {
      const updated = [obs, ...prev];
      saveOfflineObs(userId, updated);
      return updated;
    });
  }, [userId]);

  /** Patch a tree's name, coordinates, or cardPhotoUrl in local state after DB update */
  const handleTreeUpdated = useCallback((
    treeId: string,
    patch: Partial<Pick<TreeTag, 'name' | 'latitude' | 'longitude' | 'cardPhotoUrl'>>,
  ) => {
    setTreeTags(prev => prev.map(t => t.id === treeId ? { ...t, ...patch } : t));
  }, []);

  const handleSync = useCallback(async () => {
    if (!pendingObs.length || !isOnline) return;
    setSyncing(true); setSyncMsg(null);
    try {
      const payload = pendingObs.map(o => ({
        id: o.id, client_uuid: o.clientUuid, tree_tag_id: o.treeTagId,
        field_id: o.fieldId, orchard_id: o.fieldId,
        tree_variety: o.treeVariety, tree_row_number: o.treeRowNumber,
        scouted_by: o.scoutedBy, scouted_at: o.scoutedAt,
        bbch_stage: o.bbchStage, bbch_label: o.bbchLabel,
        pest_eppo_code: o.pestEppoCode, pest_name: o.pestName, pest_category: o.pestCategory,
        pest_count: o.pestCount, severity_score: o.severityScore, affected_part: o.affectedPart,
        notes: o.notes, gps_lat: o.gpsLat, gps_lng: o.gpsLng, gps_accuracy_m: o.gpsAccuracyM,
        ai_prediction: o.aiPrediction,
        activities: o.activities ?? [],
        production: o.production ?? [],
      }));
      const { data, error } = await supabase.rpc('batch_sync_scouting', { p_user_id: userId, p_observations: payload });
      if (error) throw error;
      const result = data as { synced: number; skipped: number; errors: any[] };
      setSyncMsg({ type: 'ok', text: `Synced ${result.synced} observation${result.synced !== 1 ? 's' : ''} successfully.` });
      const failedUuids = new Set((result.errors ?? []).map((e: any) => e.client_uuid));
      const remaining   = pendingObs.filter(o => failedUuids.has(o.clientUuid));
      setPendingObs(remaining);
      saveOfflineObs(userId, remaining);
      await Promise.all([loadSnapshots(), loadObs(), loadAlerts()]);
    } catch (e: any) {
      setSyncMsg({ type: 'err', text: e.message ?? 'Sync failed' });
    } finally {
      setSyncing(false);
    }
  }, [pendingObs, isOnline, userId, loadSnapshots, loadObs, loadAlerts]);

  /* Computed */
  const allObs = useMemo(() => [...pendingObs, ...syncedObs], [pendingObs, syncedObs]);

  const filteredTrees = useMemo(() => {
    let trees = treeTags;
    if (search) {
      const q = search.toLowerCase();
      trees = trees.filter(t => (t.name + t.variety + (t.rowNumber ?? '')).toLowerCase().includes(q));
    }
    if (filterHealth !== 'ALL') {
      trees = trees.filter(t => (snapshots.find(s => s.treeTagId === t.id)?.healthStatus ?? 'HEALTHY') === filterHealth);
    }
    return trees;
  }, [treeTags, snapshots, search, filterHealth]);

  const obsCountByTree = useMemo(() => {
    const m: Record<string, number> = {};
    allObs.forEach(o => { m[o.treeTagId] = (m[o.treeTagId] ?? 0) + 1; });
    return m;
  }, [allObs]);

  const selectedTree    = useMemo(() => treeTags.find(t => t.id === selectedTreeId) ?? null, [treeTags, selectedTreeId]);
  const selectedTreeObs = useMemo(() => allObs.filter(o => o.treeTagId === selectedTreeId).sort((a, b) => new Date(b.scoutedAt).getTime() - new Date(a.scoutedAt).getTime()), [allObs, selectedTreeId]);

  const statsCount = useMemo(() => {
    const c: Record<HealthStatus, number> = { HEALTHY: 0, STRESSED: 0, INFECTED: 0, CRITICAL: 0 };
    treeTags.forEach(t => { c[snapshots.find(s => s.treeTagId === t.id)?.healthStatus ?? 'HEALTHY']++; });
    return c;
  }, [treeTags, snapshots]);

  const openAlerts  = alerts.filter(a => a.alertStatus === 'OPEN');
  const blockAlerts = openAlerts.filter(a => a.alertLevel !== 'TREE');

  // Compute serial number per tree (position in row)
  const serialByTreeId = useMemo(() => {
    const serial: Record<string, number> = {};
    const allRowMap: Map<number | null, TreeTag[]> = new Map();
    for (const t of treeTags) {
      const rk = t.rowNumber ?? null;
      if (!allRowMap.has(rk)) allRowMap.set(rk, []);
      allRowMap.get(rk)!.push(t);
    }
    allRowMap.forEach((trees, _row) => {
      trees.forEach((t, idx) => { serial[t.id] = idx + 1; });
    });
    return serial;
  }, [treeTags]);

  /* ─── RENDER ──────────────────────────────────────────────── */
  return (
    <>
    <style>{TS_STYLES}</style>
    <div className="min-h-screen bg-gray-50">

      {scoutingTree && currentField && (
        <ScoutingForm
          tree={scoutingTree}
          field={currentField}
          gps={gpsHook.gps}
          userId={userId}
          userName={userName}
          historicalSnapshot={snapshots.find(s => s.treeTagId === scoutingTree.id)}
          serialNumber={serialByTreeId[scoutingTree.id]}
          onSave={handleSaveObs}
          onClose={() => setScoutingTree(null)}
          onUpdateTreeLocation={(lat, lng) => handleTreeUpdated(scoutingTree.id, { latitude: lat, longitude: lng })}
        />
      )}

      {/* ── ANIMATED HERO HEADER ─────────────────────────────── */}
      <div className="relative overflow-hidden ts-header-banner shadow-2xl">
        {/* Decorative circles */}
        <div className="absolute -top-10 -left-10 w-52 h-52 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute top-6 right-24 w-20 h-20 rounded-full bg-white/8 pointer-events-none" />

        <div className="relative px-6 py-8 text-white">
          {/* Centered header content */}
          <div className="flex flex-col items-center text-center gap-2 mb-5">
            

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white drop-shadow-xl leading-tight">
              Tree Scouting
            </h1>

           

            {/* Subtitle */}
            <p className="text-emerald-100/90 text-xs sm:text-sm font-medium max-w-xs sm:max-w-lg">
              Offline-First · GPS-Aware · Tree-Level Pest &amp; Disease Monitoring
            </p>

            {/* Field selector */}
            {!propFieldId && fields.length > 0 && (
              <select
                value={selectedFieldId}
                onChange={e => setSelectedFieldId(e.target.value)}
                className="mt-1 bg-white/15 backdrop-blur-sm border border-white/25 text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-white/30"
              >
                {fields.map(f => <option key={f.id} value={f.id} className="text-gray-900 bg-white">{f.name}</option>)}
              </select>
            )}

            {/* Status + sync buttons */}
            <div className="flex items-center gap-2 flex-wrap justify-center mt-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold backdrop-blur-sm border ${isOnline ? 'bg-emerald-600/80 border-emerald-400/40' : 'bg-orange-500/80 border-orange-400/40'}`}>
                {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                {isOnline ? 'Online' : 'Offline'}
              </div>
              {pendingObs.length > 0 && (
                <button
                  onClick={handleSync}
                  disabled={syncing || !isOnline}
                  className="flex items-center gap-2 bg-orange-500/90 hover:bg-orange-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl font-bold text-xs border border-orange-400/40 backdrop-blur-sm"
                >
                  {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  Sync {pendingObs.length}
                </button>
              )}
            </div>
          </div>

          {syncMsg && (
            <div className={` flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold backdrop-blur-sm mb-3 ${syncMsg.type === 'ok' ? 'bg-emerald-600/70 border border-emerald-400/40' : 'bg-red-500/70 border border-red-400/40'}`}>
              {syncMsg.type === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {syncMsg.text}
              <button onClick={() => setSyncMsg(null)} className="ml-auto"><X className="w-4 h-4" /></button>
            </div>
          )}

          {blockAlerts.length > 0 && (
            <div className="flex items-center gap-3 bg-red-600/80 backdrop-blur-sm border border-red-400/40 rounded-xl px-4 py-2.5">
              <AlertTriangle className="w-4 h-4 text-white shrink-0" />
              <p className="text-white text-sm font-bold flex-1">{blockAlerts.length} Block Alert{blockAlerts.length > 1 ? 's' : ''} — Block treatment required</p>
              <button onClick={() => setTab('alerts')} className="text-white text-xs underline flex items-center gap-1">View <ChevronRight className="w-3 h-3" /></button>
            </div>
          )}
        </div>
      </div>

      {/* ── ANIMATED STATS RIBBON ────────────────────────────── */}
      <div className="mx-6 mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 grid grid-cols-5 gap-3 text-center">
        {[
          { label: 'Total Trees', value: treeTags.length,          color: 'text-gray-800'    },
          { label: 'Healthy',     value: statsCount.HEALTHY,        color: 'text-emerald-600' },
          { label: 'Stressed',    value: statsCount.STRESSED,       color: 'text-yellow-600'  },
          { label: 'Infected',    value: statsCount.INFECTED,       color: 'text-red-600'     },
          { label: 'Critical',    value: statsCount.CRITICAL,       color: 'text-gray-900'    },
        ].map((s, i) => (
          <div key={s.label} className={` ts-d${i + 2}`}>
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-gray-400 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── ANIMATED TABS ────────────────────────────────────── */}
      <div className="px-6 pt-4">
        <div className="flex gap-1 bg-white border border-gray-200 rounded-2xl p-1.5 shadow-sm">
          {([
            { key: 'scout',     label: 'Scout',      icon: Bug          },
            { key: 'dashboard', label: 'Dashboard',   icon: BarChart2    },
            { key: 'alerts',    label: 'Alerts',      icon: AlertTriangle },
            { key: 'history',   label: 'History',     icon: Clock        },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`ts-tab flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold relative ${
                tab === t.key
                  ? 'bg-gradient-to-r from-emerald-800 to-teal-700 text-white shadow'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <t.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{t.label}</span>
              {t.key === 'alerts' && openAlerts.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-extrabold shadow">
                  {openAlerts.length}
                </span>
              )}
              {t.key === 'scout' && pendingObs.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-orange-500 rounded-full text-white text-xs flex items-center justify-center font-extrabold shadow">
                  {pendingObs.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB CONTENT ──────────────────────────────────────── */}
      <div className="px-6 py-6 space-y-5">

        {loading && (
          <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" /> <span className="text-sm">Loading trees…</span>
          </div>
        )}

        {!loading && !selectedFieldId && (
          <EmptyState icon={TreePine} title="No orchard selected" sub="Select an orchard or create one in the Fields module." />
        )}

        {/* ══ SCOUT TAB ══ */}
        {!loading && selectedFieldId && tab === 'scout' && (
          <div className="space-y-5">

            {/* Pending sync banner */}
            {pendingObs.length > 0 && (
              <div className="flex items-center gap-3 bg-orange-50 border border-orange-300 rounded-2xl px-5 py-3.5">
                <WifiOff className="w-4 h-4 text-orange-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-orange-800">{pendingObs.length} observation{pendingObs.length > 1 ? 's' : ''} queued offline</p>
                  <p className="text-xs text-orange-600">Will sync automatically on reconnect</p>
                </div>
                {isOnline && (
                  <button onClick={handleSync} disabled={syncing} className="flex items-center gap-1.5 bg-orange-500 text-white px-3 py-2 rounded-xl text-xs font-bold">
                    {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />} Sync Now
                  </button>
                )}
              </div>
            )}

            {/* GPS Tree Finder */}
            <GpsTreeFinder
              gps={gpsHook.gps}
              state={gpsHook.state}
              error={gpsHook.error}
              trees={treeTags}
              onSelect={(tree) => { setScoutingTree(tree); setSelectedTreeId(tree.id); }}
              onStart={gpsHook.startWatch}
              onStop={gpsHook.stopWatch}
            />

            {/* Manual search */}
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
                <Search className="w-4 h-4 text-gray-400" />
                <input className="flex-1 text-sm focus:outline-none placeholder:text-gray-400" placeholder="Search trees, varieties, rows…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 shadow-sm">
                <Filter className="w-4 h-4 text-gray-400" />
                <select className="text-sm text-gray-700 bg-transparent focus:outline-none py-3" value={filterHealth} onChange={e => setFilterHealth(e.target.value as any)}>
                  <option value="ALL">All Health</option>
                  {(['HEALTHY', 'STRESSED', 'INFECTED', 'CRITICAL'] as HealthStatus[]).map(h => (
                    <option key={h} value={h}>{HEALTH_META[h].label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tree grid — grouped by row with serial numbers */}
            {treeTags.length === 0 && <EmptyState icon={TreePine} title="No trees tagged yet" sub="Tag trees using the Fields & Tree Mapping module first." />}
            {treeTags.length > 0 && filteredTrees.length === 0 && <EmptyState icon={Search} title="No trees match your search" />}

            {treeTags.length > 0 && filteredTrees.length > 0 && (() => {
              // Group by row number; trees with no row go under key 'null'
              const rowMap: Map<number | null, TreeTag[]> = new Map();
              // Compute serial number per row across full treeTags list (not filteredTrees)
              // so serial numbers are stable even when search filter is active
              const serialByTreeId: Record<string, number> = {};
              const allRowMap: Map<number | null, TreeTag[]> = new Map();
              for (const t of treeTags) {
                const rk = t.rowNumber ?? null;
                if (!allRowMap.has(rk)) allRowMap.set(rk, []);
                allRowMap.get(rk)!.push(t);
              }
              allRowMap.forEach((trees, _row) => {
                trees.forEach((t, idx) => { serialByTreeId[t.id] = idx + 1; });
              });

              for (const t of filteredTrees) {
                const rk = t.rowNumber ?? null;
                if (!rowMap.has(rk)) rowMap.set(rk, []);
                rowMap.get(rk)!.push(t);
              }

              // Sort rows numerically; null rows at end
              const sortedRows = Array.from(rowMap.keys()).sort((a, b) => {
                if (a === null && b === null) return 0;
                if (a === null) return 1;
                if (b === null) return -1;
                return a - b;
              });

              return (
                <div className="space-y-6">
                  {sortedRows.map(rowKey => {
                    const rowTrees = rowMap.get(rowKey)!;
                    const rowLabel = rowKey != null ? `Row ${rowKey}` : 'Unassigned Row';
                    const rowTotal = allRowMap.get(rowKey)?.length ?? rowTrees.length;
                    return (
                      <div key={String(rowKey)}>
                        {/* Row header */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex items-center gap-2 bg-emerald-800 text-white px-3 py-1.5 rounded-xl text-xs font-extrabold shadow-sm">
                            <TreePine className="w-3.5 h-3.5" />
                            {rowLabel}
                          </div>
                          <div className="text-xs text-gray-400 font-semibold">{rowTotal} tree{rowTotal !== 1 ? 's' : ''} in row</div>
                          <div className="flex-1 h-px bg-gray-200" />
                        </div>
                        {/* Trees in this row */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {rowTrees.map(tree => (
                            <TreeHealthCard
                              key={tree.id}
                              tree={tree}
                              snapshot={snapshots.find(s => s.treeTagId === tree.id)}
                              obsCount={obsCountByTree[tree.id] ?? 0}
                              selected={selectedTreeId === tree.id}
                              serialNumber={serialByTreeId[tree.id]}
                              onClick={() => {
                                // Open scouting form immediately on click
                                setSelectedTreeId(tree.id);
                                setScoutingTree(tree);
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* ══ DASHBOARD TAB ══ */}
        {!loading && selectedFieldId && tab === 'dashboard' && (
          <div className="space-y-5">
            <SectionCard>
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-extrabold text-gray-800 flex items-center gap-2"><Shield className="w-5 h-5 text-emerald-700" /> Block Health — {currentField?.name}</h2>
              </div>
              <div className="p-5 space-y-4">
                {/* Visual bar */}
                {treeTags.length > 0 && (
                  <>
                    <div className="flex h-5 rounded-full overflow-hidden gap-0.5">
                      {(['HEALTHY','STRESSED','INFECTED','CRITICAL'] as HealthStatus[]).map(h => {
                        const pct = (statsCount[h] / treeTags.length) * 100;
                        return pct > 0 ? (
                          <div key={h} className={`bg-gradient-to-r ${HEALTH_META[h].gradient}`} style={{ flex: statsCount[h] }} title={`${HEALTH_META[h].label}: ${statsCount[h]}`} />
                        ) : null;
                      })}
                    </div>
                    <div className="flex gap-4 flex-wrap text-xs">
                      {(['HEALTHY','STRESSED','INFECTED','CRITICAL'] as HealthStatus[]).map(h => (
                        <span key={h} className={`flex items-center gap-1.5 font-semibold ${HEALTH_META[h].text}`}>
                          <span className={`w-2.5 h-2.5 rounded-full ${HEALTH_META[h].dot}`} />
                          {HEALTH_META[h].label}: {statsCount[h]}
                        </span>
                      ))}
                    </div>
                  </>
                )}

                {/* Escalation status */}
                {treeTags.length > 0 && (() => {
                  const infPct = ((statsCount.INFECTED + statsCount.CRITICAL) / treeTags.length) * 100;
                  const urgent = infPct >= 20;
                  return (
                    <div className={`rounded-2xl px-4 py-3.5 flex items-start gap-3 border ${urgent ? 'bg-red-50 border-red-200' : infPct >= 10 ? 'bg-yellow-50 border-yellow-200' : 'bg-emerald-50 border-emerald-200'}`}>
                      {urgent ? <Zap className="w-5 h-5 text-red-600 shrink-0 mt-0.5" /> : infPct >= 10 ? <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
                      <div>
                        <p className={`font-extrabold text-sm ${urgent ? 'text-red-800' : infPct >= 10 ? 'text-yellow-800' : 'text-emerald-800'}`}>
                          {infPct.toFixed(1)}% of block infected
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {urgent ? 'BLOCK-LEVEL TREATMENT REQUIRED — escalation threshold (20%) crossed' : infPct >= 10 ? 'Approaching escalation threshold — increase monitoring frequency' : 'Below escalation threshold — tree-level interventions sufficient'}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </SectionCard>

            {/* Tree grid dashboard view */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-extrabold text-gray-800">Tree Health Map</h2>
                <div className="flex gap-1.5 flex-wrap">
                  {(['ALL','HEALTHY','STRESSED','INFECTED','CRITICAL'] as const).map(h => (
                    <button key={h} onClick={() => setFilterHealth(h)} className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${filterHealth === h ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                      {h === 'ALL' ? 'All' : HEALTH_META[h].label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {filteredTrees.map(tree => (
                  <TreeHealthCard
                    key={tree.id}
                    tree={tree}
                    snapshot={snapshots.find(s => s.treeTagId === tree.id)}
                    obsCount={obsCountByTree[tree.id] ?? 0}
                    selected={false}
                    onClick={() => { setSelectedTreeId(tree.id); setTab('scout'); }}
                  />
                ))}
              </div>
            </div>

            {/* Variety vulnerability */}
            {snapshots.length > 0 && (() => {
              const vm: Record<string, { infected: number; total: number }> = {};
              treeTags.forEach(t => {
                const v = t.variety || 'Unknown';
                if (!vm[v]) vm[v] = { infected: 0, total: 0 };
                vm[v].total++;
                const snap = snapshots.find(s => s.treeTagId === t.id);
                if (snap && ['INFECTED','CRITICAL'].includes(snap.healthStatus)) vm[v].infected++;
              });
              const rows = Object.entries(vm).sort((a, b) => (b[1].infected / b[1].total) - (a[1].infected / a[1].total));
              return (
                <SectionCard>
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h2 className="font-extrabold text-gray-800 flex items-center gap-2"><Activity className="w-5 h-5 text-emerald-700" /> Variety Vulnerability Index</h2>
                  </div>
                  <div className="p-5 space-y-3">
                    {rows.map(([variety, data]) => {
                      const pct = (data.infected / data.total) * 100;
                      return (
                        <div key={variety} className="flex items-center gap-3">
                          <div className="w-32 text-xs font-bold text-gray-700 truncate">{variety}</div>
                          <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                            <div className={`h-full rounded-full ${pct >= 30 ? 'bg-gradient-to-r from-red-500 to-rose-600' : pct >= 15 ? 'bg-gradient-to-r from-yellow-400 to-amber-500' : 'bg-gradient-to-r from-emerald-500 to-green-600'}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-gray-500 w-24 text-right">{data.infected}/{data.total} ({pct.toFixed(0)}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </SectionCard>
              );
            })()}

            {/* AI Insights Summary */}
            {allObs.filter(o => o.aiPrediction).length > 0 && (() => {
              const obsWithAI = allObs.filter(o => o.aiPrediction);
              const avgRisk   = Math.round(obsWithAI.reduce((a, o) => a + (o.aiPrediction?.riskScore ?? 0), 0) / obsWithAI.length);
              const highSpread = obsWithAI.filter(o => o.aiPrediction?.spreadRisk === 'HIGH').length;
              return (
                <SectionCard>
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h2 className="font-extrabold text-gray-800 flex items-center gap-2"><Brain className="w-5 h-5 text-violet-600" /> AI Insights Summary</h2>
                  </div>
                  <div className="p-5 grid grid-cols-3 gap-4 text-center">
                    {[
                      { label: 'Avg Risk Score', value: avgRisk, color: avgRisk >= 65 ? 'text-red-600' : avgRisk >= 30 ? 'text-orange-500' : 'text-emerald-600' },
                      { label: 'AI-analysed Obs.', value: obsWithAI.length, color: 'text-violet-600' },
                      { label: 'High Spread Risk', value: highSpread, color: highSpread > 0 ? 'text-red-600' : 'text-emerald-600' },
                    ].map(s => (
                      <div key={s.label}>
                        <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              );
            })()}
          </div>
        )}

        {/* ══ ALERTS TAB ══ */}
        {!loading && selectedFieldId && tab === 'alerts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-gray-800">Scouting Alerts</h2>
              <div className="flex gap-2">
                <Badge className="border-red-300 text-red-700 bg-red-50">{openAlerts.length} Open</Badge>
                <button onClick={() => { loadAlerts(); loadSnapshots(); }} className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg">
                  <RefreshCw className="w-3.5 h-3.5 text-gray-600" />
                </button>
              </div>
            </div>
            {blockAlerts.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold text-red-500 uppercase tracking-widest flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Block Alerts</h3>
                {blockAlerts.map(a => <AlertCard key={a.id} alert={a} />)}
              </div>
            )}
            {openAlerts.filter(a => a.alertLevel === 'TREE').length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold text-orange-500 uppercase tracking-widest flex items-center gap-1"><TreePine className="w-3.5 h-3.5" /> Tree Alerts</h3>
                {openAlerts.filter(a => a.alertLevel === 'TREE').map(a => <AlertCard key={a.id} alert={a} />)}
              </div>
            )}
            {openAlerts.length === 0 && <EmptyState icon={Shield} title="No open alerts" sub="All trees within safe thresholds." />}
            {alerts.filter(a => a.alertStatus !== 'OPEN').length > 0 && (
              <div className="space-y-3 opacity-50">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Resolved</h3>
                {alerts.filter(a => a.alertStatus !== 'OPEN').map(a => <AlertCard key={a.id} alert={a} />)}
              </div>
            )}
          </div>
        )}

        {/* ══ HISTORY TAB ══ */}
        {!loading && selectedFieldId && tab === 'history' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-gray-800">Full Scouting History</h2>
              <Badge className="border-gray-200 text-gray-600 bg-white">{allObs.length} Total</Badge>
            </div>
            {pendingObs.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold text-orange-500 uppercase tracking-widest flex items-center gap-1.5"><WifiOff className="w-3.5 h-3.5" /> Offline Pending</h3>
                {pendingObs.map(obs => <ObsCard key={obs.id} obs={obs} treeName={treeTags.find(t => t.id === obs.treeTagId)?.name || `Tree #${obs.treeTagId.slice(0,6).toUpperCase()}`} />)}
              </div>
            )}
            {syncedObs.length > 0 && (
              <div className="space-y-3">
                {pendingObs.length > 0 && <h3 className="text-xs font-extrabold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5"><Wifi className="w-3.5 h-3.5" /> Synced</h3>}
                {syncedObs.map(obs => <ObsCard key={obs.id} obs={obs} treeName={treeTags.find(t => t.id === obs.treeTagId)?.name || `Tree #${obs.treeTagId.slice(0,6).toUpperCase()}`} />)}
              </div>
            )}
            {allObs.length === 0 && <EmptyState icon={Bug} title="No observations yet" sub="Scout a tree to begin building history." />}
          </div>
        )}
      </div>

      {/* ── FOOTER STATS BAR ─────────────────────────────────── */}
      <div className="mx-6 mb-8 bg-gradient-to-r from-emerald-950 to-teal-900 rounded-2xl px-5 py-4 grid grid-cols-4 gap-3 text-center ts-card">
        {[
          { label: 'Pending Sync',   value: pendingObs.length,   color: 'text-orange-400' },
          { label: 'Synced Records', value: syncedObs.length,    color: 'text-emerald-400' },
          { label: 'Open Alerts',    value: openAlerts.length,   color: 'text-red-400'    },
          { label: 'Trees Scouted',  value: new Set(allObs.map(o => o.treeTagId)).size, color: 'text-sky-400' },
        ].map((s, i) => (
          <div key={s.label} className={` ts-d${i + 2}`}>
            <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-emerald-500 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
    </>
  );
}
