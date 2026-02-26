
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, TreePine, TriangleAlert as AlertTriangle, Cloud, TrendingUp, Calendar, UserCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import type { User, Field } from '../types';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

import { AlertCircle, Droplet, CheckCircle, XCircle, HelpCircle, Bug, ShieldAlert } from 'lucide-react';
import { skaustSprayTemplate2026Chemicals } from '../data/skaustSprayTemplate2026';

/* ─── SkuastAdvisory-style Glass + Animation CSS ─── */
const DASH_STYLES = `
@keyframes dashFadeUp {
  from { opacity:0; transform:translateY(24px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes dashFadeDown {
  from { opacity:0; transform:translateY(-18px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes dashScaleIn {
  from { opacity:0; transform:scale(0.90); }
  to   { opacity:1; transform:scale(1); }
}
@keyframes dashSlideRight {
  from { opacity:0; transform:translateX(-20px); }
  to   { opacity:1; transform:translateX(0); }
}
@keyframes dashGlow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.25); }
  50%       { box-shadow: 0 0 0 12px rgba(34,197,94,0); }
}
@keyframes dashPulseRing {
  0%   { transform:scale(1);   opacity:0.8; }
  100% { transform:scale(1.7); opacity:0; }
}
@keyframes dashShimmer {
  0%   { background-position: -400px 0; }
  100% { background-position:  400px 0; }
}
@keyframes dashLeafSway {
  0%, 100% { transform: rotate(-4deg); }
  50%       { transform: rotate(4deg); }
}
@keyframes dashHeaderGradient {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes dashFloat {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-8px); }
}
@keyframes dashWeatherPop {
  0%   { transform: scale(0.8) rotate(-5deg); opacity: 0; }
  60%  { transform: scale(1.08) rotate(2deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
@keyframes dashBarGrow {
  from { width: 0%; }
  to   { width: var(--bar-w); }
}
@keyframes dashPulseSoft {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.6; }
}

.dash-fade-up   { animation: dashFadeUp     0.6s  cubic-bezier(.22,1,.36,1) both; }
.dash-fade-down { animation: dashFadeDown   0.55s cubic-bezier(.22,1,.36,1) both; }
.dash-scale-in  { animation: dashScaleIn    0.5s  cubic-bezier(.22,1,.36,1) both; }
.dash-slide-r   { animation: dashSlideRight 0.5s  cubic-bezier(.22,1,.36,1) both; }
.dash-glow      { animation: dashGlow 2.8s ease-in-out infinite; }
.dash-float     { animation: dashFloat 3.5s ease-in-out infinite; }
.dash-weather   { animation: dashWeatherPop 0.55s cubic-bezier(.34,1.56,.64,1) both; }
.dash-pulse-soft{ animation: dashPulseSoft 2.4s ease-in-out infinite; }

.dash-d0  { animation-delay:0s;    }
.dash-d1  { animation-delay:.08s;  }
.dash-d2  { animation-delay:.16s;  }
.dash-d3  { animation-delay:.24s;  }
.dash-d4  { animation-delay:.32s;  }
.dash-d5  { animation-delay:.40s;  }
.dash-d6  { animation-delay:.48s;  }
.dash-d7  { animation-delay:.56s;  }

/* ─── Animated gradient header banner ─── */
.dash-header-banner {
  background: linear-gradient(135deg, #064e3b, #065f46, #047857, #059669, #10b981, #34d399, #6ee7b7, #10b981, #047857);
  background-size: 300% 300%;
  animation: dashHeaderGradient 8s ease infinite;
}

/* ─── Glass card ─── */
.dash-glass-card {
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.6);
  box-shadow: 0 4px 24px rgba(34,197,94,0.07), 0 1px 3px rgba(0,0,0,0.04);
  transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease;
}
.dash-glass-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 36px rgba(34,197,94,0.14);
  border-color: #86efac;
}

/* ─── Stat card ─── */
.dash-stat-card {
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1.5px solid rgba(255,255,255,0.7);
  box-shadow: 0 4px 20px rgba(34,197,94,0.06), 0 1px 2px rgba(0,0,0,0.04);
  transition: transform .22s ease, box-shadow .22s ease;
}
.dash-stat-card:hover {
  transform: translateY(-5px) scale(1.025);
  box-shadow: 0 14px 38px rgba(34,197,94,0.15);
}

/* ─── Weather card ─── */
.dash-weather-card {
  background: rgba(255,255,255,0.88);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.6);
  box-shadow: 0 3px 14px rgba(99,102,241,0.07);
  transition: transform .2s ease, box-shadow .2s ease;
}
.dash-weather-card:hover {
  transform: translateY(-5px) scale(1.04);
  box-shadow: 0 14px 36px rgba(99,102,241,0.15);
  border-color: #a5b4fc;
}

/* ─── Field card ─── */
.dash-field-card {
  background: rgba(255,255,255,0.92);
  border: 1.5px solid #e5e7eb;
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
  position: relative;
  overflow: hidden;
}
.dash-field-card::before {
  content:'';
  position:absolute;
  top:0;left:0;right:0;
  height:3px;
  background:linear-gradient(90deg,#10b981,#059669,#34d399);
  opacity:0;
  transition:opacity .22s ease;
}
.dash-field-card:hover { transform:translateY(-3px) scale(1.015); box-shadow:0 8px 28px rgba(34,197,94,0.15); border-color:#86efac; }
.dash-field-card:hover::before { opacity:1; }

/* ─── Pulse ring live badge ─── */
.dash-pulse {
  position: relative;
}
.dash-pulse::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(34,197,94,0.5);
  animation: dashPulseRing 1.6s cubic-bezier(.215,.61,.355,1) infinite;
}

/* ─── Leaf sway ─── */
.dash-leaf { display:inline-block; animation: dashLeafSway 2.8s ease-in-out infinite; }

/* ─── RAG orb hover ─── */
.dash-rag-orb {
  transition: transform .2s ease, box-shadow .2s ease;
}
.dash-rag-orb:hover {
  transform: scale(1.12);
}

/* ─── Smart action row hover ─── */
.dash-action-row {
  transition: background .2s ease, transform .2s ease, padding-left .2s ease;
}
.dash-action-row:hover {
  background: linear-gradient(90deg, #f0fdf4, #dcfce7) !important;
  transform: translateX(4px);
  padding-left: 1rem;
}

/* ─── Activity item shimmer ─── */
.dash-activity-row {
  position: relative;
  overflow: hidden;
  transition: background .2s ease, transform .2s ease;
}
.dash-activity-row:hover {
  background: #f0fdf4 !important;
  transform: translateX(3px);
}
.dash-activity-row::after {
  content:'';
  position:absolute;
  inset:0;
  background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.5) 50%,transparent 100%);
  background-size:200% 100%;
  opacity:0;
  transition:opacity .3s;
}
.dash-activity-row:hover::after {
  opacity:1;
  animation: dashShimmer 0.8s linear;
}

/* ─── Page background ─── */
.dash-page-bg {
  background: linear-gradient(160deg, #f0fdf4 0%, #ecfdf5 30%, #f8fafc 60%, #fafaf9 100%);
  min-height:100vh;
}

/* ─── Alert row ─── */
.dash-alert-row {
  transition: background .2s ease, transform .2s ease;
}
.dash-alert-row:hover {
  background: rgba(254,242,242,0.9) !important;
  transform: translateX(3px);
}

/* ═══════════════════════════════════════
   RESPONSIVE OVERRIDES
   ═══════════════════════════════════════ */

/* ── Phone (< 640px) ── */
@media (max-width: 639px) {
  .dash-hero-title   { font-size: 1.75rem !important; line-height: 1.15; }
  .dash-stat-value   { font-size: 1.5rem  !important; }
  .dash-map-height   { height: 240px !important; }
  .dash-rag-orb      { width: 3.25rem !important; height: 3.25rem !important; }
  /* Weather grid: 2×4 on phones */
  .dash-weather-grid { grid-template-columns: repeat(2, 1fr) !important; }
  /* Hero banner rounded corners tighter */
  .dash-header-banner { border-radius: 1.25rem !important; }
  /* Stat icon smaller on phone */
  .dash-stat-icon { width: 2.25rem !important; height: 2.25rem !important; }
}

/* ── iPad portrait (640–767px) ── */
@media (min-width: 640px) and (max-width: 767px) {
  .dash-hero-title   { font-size: 2.25rem !important; }
  .dash-map-height   { height: 320px !important; }
  /* Weather grid: 4 cols */
  .dash-weather-grid { grid-template-columns: repeat(4, 1fr) !important; }
}

/* ── iPad landscape (768–1023px) ── */
@media (min-width: 768px) and (max-width: 1023px) {
  .dash-map-height   { height: 380px !important; }
  /* Weather grid: 4 cols — full 7 on desktop */
  .dash-weather-grid { grid-template-columns: repeat(4, 1fr) !important; }
}

/* ── Desktop (1024px+) ── */
@media (min-width: 1024px) {
  .dash-weather-grid { grid-template-columns: repeat(7, 1fr) !important; }
  .dash-map-height   { height: 440px !important; }
}
`;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const mapRef = useRef<HTMLDivElement>(null);
  const taggedTreesSectionRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const boundaryPolygonsRef = useRef<Map<string, any>>(new Map());
  const treeMarkersRef = useRef<any[]>([]);
  const treeHealthSnapshotsRef = useRef<typeof treeHealthSnapshots>([]);
  const handleOpenScoutingModalRef = useRef<((tag: typeof treeTags[0]) => void) | null>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [treeTags, setTreeTags] = useState<Array<{ id: string; fieldId: string; name: string; variety: string; latitude: number; longitude: number; rowNumber: number | null }>>([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [fieldsError, setFieldsError] = useState<string | null>(null);
  const [activities, setActivities] = useState<Array<{ id: string; title: string; createdAt: string; kind: 'success' | 'warning' | 'info' }>>([]);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [weather, setWeather] = useState<any>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const [soilStatus, setSoilStatus] = useState<'green'|'yellow'|'red'|'gray'>('gray');
  const [soilTooltip, setSoilTooltip] = useState('No recent soil test');
  const [waterStatus, setWaterStatus] = useState<'green'|'yellow'|'red'|'gray'>('gray');
  const [waterTooltip, setWaterTooltip] = useState('No recent water test');
  const [scoutingAlerts, setScoutingAlerts] = useState<Array<{
    id: string; alertLevel: string; alertStatus: string; severity: string;
    pestName: string; etlAction: string; message: string;
    blockInfectedPct: number | null; affectedTreeCount: number; createdAt: string;
  }>>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [smartActions, setSmartActions] = useState<any[]>([]);

  const [treeHealthSnapshots, setTreeHealthSnapshots] = useState<Array<{
    treeTagId: string; healthStatus: string; lastScoutedAt: string | null;
    lastPestName: string | null; lastSeverityScore: number; totalObservations: number;
    etlAction: string; riskScore: number;
  }>>([]);
  const [scoutingModalTree, setScoutingModalTree] = useState<null | {
    tag: { id: string; name: string; variety: string; fieldId: string; latitude: number; longitude: number };
    snapshot: { healthStatus: string; lastScoutedAt: string | null; lastPestName: string | null;
      lastSeverityScore: number; totalObservations: number; etlAction: string; riskScore: number; } | null;
    recentObs: Array<{ pestName: string; severityScore: number; notes: string; scoutedAt: string; affectedPart: string; }>;
  }>(null);
  const [scoutingModalLoading, setScoutingModalLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const WIND_THRESHOLD = 15;
  const HIGH_TEMP = 32;
  const MARGINAL_RAIN = 40;

  const isHeavyRain = (day?: any) => (day?.precipitationProb ?? 0) >= 70;
  const isFrostRisk = (day?: any) => (day?.tempMin ?? 100) <= 2;

  const getSprayWindowStatus = (day?: any) => {
    if (!day) return 'UNKNOWN';
    const rainProb = day.precipitationProb ?? 0;
    const wind = day.windSpeed ?? 0;
    const maxTemp = day.tempMax ?? 0;
    if (rainProb >= 70 || wind > WIND_THRESHOLD) return 'RED';
    if (maxTemp >= HIGH_TEMP || rainProb >= MARGINAL_RAIN) return 'AMBER';
    return 'GREEN';
  };

  const isSpraySafeDay = (day?: any) => getSprayWindowStatus(day) === 'GREEN';

  const getIrrigationAdvice = () => {
    if (!Array.isArray(forecast) || forecast.length === 0) return '';
    if (forecast.some(d => d && getSprayWindowStatus(d) === 'RED')) return '🚫 Irrigation not recommended — rainfall or wind expected';
    const hotDry = forecast.some(d => d && (d.tempMax ?? 0) >= HIGH_TEMP && (d.precipitationProb ?? 0) < 30);
    if (hotDry) return '💧 Irrigation recommended — hot & dry conditions';
    return '✅ Moderate irrigation only if soil is dry';
  };

  const getAnimatedIcon = (code: number) => {
    if ([0].includes(code)) return '☀️';
    if ([1, 2].includes(code)) return '🌤️';
    if ([3].includes(code)) return '☁️';
    if ([45, 48].includes(code)) return '🌫️';
    if ([51, 53, 55, 61, 63, 65].includes(code)) return '🌧️';
    if ([71, 73, 75].includes(code)) return '❄️';
    if ([95, 96, 99].includes(code)) return '⛈️';
    return '🌡️';
  };

  const getSprayBadge = (day: any) => {
    const status = getSprayWindowStatus(day);
    if (status === 'RED')   return { text: 'Do NOT Spray',       color: 'bg-red-100 text-red-700 border border-red-200',     dot: '#ef4444' };
    if (status === 'AMBER') return { text: 'Spray with Caution', color: 'bg-amber-100 text-amber-700 border border-amber-200', dot: '#f59e0b' };
    if (status === 'GREEN') return { text: 'Safe to Spray',      color: 'bg-green-100 text-green-700 border border-green-200', dot: '#22c55e' };
    return { text: 'Unknown', color: 'bg-gray-100 text-gray-500 border border-gray-200', dot: '#9ca3af' };
  };

  /* ─── Weather fetch ─── */
  useEffect(() => {
    setWeatherError(null);
    setWeatherLoading(true);
    if (!navigator.geolocation) { setWeatherError('Geolocation not supported'); setWeatherLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        try {
          const url =
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
            `&current_weather=true&daily=temperature_2m_max,temperature_2m_min,apparent_temperature_max,` +
            `precipitation_sum,precipitation_probability_max,windspeed_10m_max,weathercode,uv_index_max` +
            `&forecast_days=7&timezone=auto`;
          const res = await fetch(url);
          const data = await res.json();
          if (!data.current_weather || !data.daily) { setWeatherError('Invalid weather data'); setWeatherLoading(false); return; }
          setWeather(data.current_weather);
          setForecast(data.daily.time.map((date: string, i: number) => ({
            date,
            tempMax: data.daily.temperature_2m_max[i],
            tempMin: data.daily.temperature_2m_min[i],
            feelsLikeMax: data.daily.apparent_temperature_max?.[i],
            precipitation: data.daily.precipitation_sum[i],
            precipitationProb: data.daily.precipitation_probability_max[i],
            windSpeed: data.daily.windspeed_10m_max[i],
            weathercode: data.daily.weathercode[i],
            uvIndex: data.daily.uv_index_max?.[i],
          })));
        } catch { setWeatherError('Failed to fetch weather'); }
        finally { setWeatherLoading(false); }
      },
      () => { setWeatherError('Unable to get location'); setWeatherLoading(false); }
    );
  }, []);

  const { user, session } = useAuth();

  const profileUser: User = user ?? {
    id: session?.user.id ?? '',
    name: session?.user.user_metadata?.name ?? '',
    email: session?.user.email ?? '',
    phone: session?.user.user_metadata?.phone ?? '',
    farmName: '',
  };

  const calculateProfileCompletion = (user: User): number => {
    let completed = 0;
    const totalFields = 7;
    if (user.name?.trim()) completed++;
    if (user.email?.trim()) completed++;
    if (user.phone?.trim()) completed++;
    if (user.farmName?.trim()) completed++;
    if (user.avatar?.trim()) completed++;
    if (user.khasraNumber?.trim()) completed++;
    if (user.khataNumber?.trim()) completed++;
    return Math.round((completed / totalFields) * 100);
  };

  const profileCompletion = calculateProfileCompletion(profileUser);

  function getQueryParams() {
    const params = new URLSearchParams(location.search);
    return { fieldId: params.get('fieldId'), lat: params.get('lat'), lng: params.get('lng') };
  }

  /* ─── Google Maps lazy loader (loads only when map div enters viewport) ─── */
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    if (!apiKey || !mapRef.current) return;

    const loadMaps = () => {
      if ((window as any).google?.maps) { setMapsLoaded(true); return; }
      // Avoid duplicate script tags; reuse one created by Fields or OrchardDoctor
      const existing = document.querySelector('script[data-google-maps]');
      if (existing) {
        existing.addEventListener('load', () => setMapsLoaded(true));
        return;
      }
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,drawing`;
      script.async = true; script.defer = true;
      script.dataset.googleMaps = 'true';
      script.onload = () => setMapsLoaded(true);
      document.head.appendChild(script);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMaps();
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(mapRef.current);
    return () => observer.disconnect();
  // Re-run when fields load so mapRef.current is attached to the DOM
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields.length]);

  /* ─── Fields loader ─── */
  useEffect(() => {
    const loadFields = async () => {
      if (!session?.user) { setFields([]); setLoadingFields(false); return; }
      setLoadingFields(true); setFieldsError(null);
      const { data, error } = await supabase
        .from('fields')
        .select('id, name, area, soil_type, crop_stage, health_status, location, planted_date, latitude, longitude, boundary_path, details')
        .eq('user_id', session.user.id);
      if (error) { setFieldsError(error.message); setLoadingFields(false); return; }
      setFields((data ?? []).map((row: any) => ({
        id: row.id, name: row.name, area: row.area ?? 0,
        areaKanal: row.areaKanal ?? row.mapAreaKanal ?? row.area,
        mapAreaKanal: row.mapAreaKanal,
        soilType: row.soil_type ?? 'Unknown', cropStage: row.crop_stage ?? 'Growing',
        healthStatus: row.health_status ?? 'Good', location: row.location ?? 'Unknown',
        plantedDate: row.planted_date ?? '',
        latitude: row.latitude ?? undefined, longitude: row.longitude ?? undefined,
        boundaryPath: row.boundary_path ?? undefined, details: row.details ?? {},
      })));
      setLoadingFields(false);
    };
    loadFields();
  }, [session?.user]);

  /* ─── Soil & Water status + Scouting alerts ─── */
  useEffect(() => {
    if (!session?.user) {
      setSoilStatus('gray'); setSoilTooltip('No recent soil test');
      setWaterStatus('gray'); setWaterTooltip('No recent water test');
      setScoutingAlerts([]);
      return;
    }

    const fetchSoilStatus = async () => {
      const { data, error } = await supabase
        .from('soil_test_results').select('soil_ph, nitrogen, phosphorus, potassium, ec, recorded_date')
        .eq('user_id', session.user.id).order('recorded_date', { ascending: false }).limit(1);
      if (error || !data || data.length === 0) { setSoilStatus('gray'); setSoilTooltip('No recent soil test'); return; }
      const test = data[0];
      if (test.soil_ph == null) { setSoilStatus('gray'); setSoilTooltip('No pH value'); return; }
      if (test.soil_ph < 6 || test.soil_ph > 7.5) { setSoilStatus('red'); setSoilTooltip(`Soil pH out of range (${test.soil_ph})`); }
      else { setSoilStatus('green'); setSoilTooltip(`Soil pH optimal (${test.soil_ph})`); }
    };

    const fetchWaterStatus = async () => {
      const { data, error } = await supabase
        .from('water_test_results').select('water_ph, ec, sar, rsc, suitability, test_date')
        .eq('user_id', session.user.id).order('test_date', { ascending: false }).limit(1);
      if (error || !data || data.length === 0) { setWaterStatus('gray'); setWaterTooltip('No recent water test'); return; }
      const test = data[0];
      if (test.suitability) {
        const s = test.suitability.toLowerCase();
        if (s.includes('good') || s.includes('excellent') || s.includes('safe')) {
          setWaterStatus('green'); setWaterTooltip(`Water: ${test.suitability}`);
        } else if (s.includes('marginal') || s.includes('moderate')) {
          setWaterStatus('yellow'); setWaterTooltip(`Water: ${test.suitability}`);
        } else {
          setWaterStatus('red'); setWaterTooltip(`Water: ${test.suitability}`);
        }
        return;
      }
      if (test.water_ph == null) { setWaterStatus('gray'); setWaterTooltip('No pH value in water test'); return; }
      if (test.water_ph < 6.5 || test.water_ph > 8.5) { setWaterStatus('red'); setWaterTooltip(`Water pH out of range (${test.water_ph})`); }
      else { setWaterStatus('green'); setWaterTooltip(`Water pH optimal (${test.water_ph})`); }
    };

    const fetchScoutingAlerts = async () => {
      setAlertsLoading(true);
      const { data } = await supabase
        .from('tree_scouting_alerts')
        .select('id, alert_level, alert_status, severity, pest_name, etl_action, message, block_infected_pct, affected_tree_count, created_at')
        .eq('user_id', session.user.id)
        .in('alert_status', ['OPEN', 'ACKNOWLEDGED'])
        .order('created_at', { ascending: false })
        .limit(5);
      setScoutingAlerts((data ?? []).map((r: any) => ({
        id: r.id, alertLevel: r.alert_level ?? 'TREE', alertStatus: r.alert_status ?? 'OPEN',
        severity: r.severity ?? 'INFECTED', pestName: r.pest_name ?? '',
        etlAction: r.etl_action ?? 'NO_ACTION', message: r.message ?? '',
        blockInfectedPct: r.block_infected_pct, affectedTreeCount: r.affected_tree_count ?? 1,
        createdAt: r.created_at,
      })));
      setAlertsLoading(false);
    };

    const fetchTreeHealthSnapshots = async () => {
      const { data } = await supabase
        .from('tree_health_snapshots')
        .select('tree_tag_id, health_status, last_scouted_at, last_pest_eppo, last_severity_score, total_observations, etl_action, risk_score')
        .eq('user_id', session.user.id);
      setTreeHealthSnapshots((data ?? []).map((r: any) => ({
        treeTagId: r.tree_tag_id, healthStatus: r.health_status ?? 'HEALTHY',
        lastScoutedAt: r.last_scouted_at ?? null, lastPestName: r.last_pest_eppo ?? null,
        lastSeverityScore: r.last_severity_score ?? 0, totalObservations: r.total_observations ?? 0,
        etlAction: r.etl_action ?? 'NO_ACTION', riskScore: r.risk_score ?? 0,
      })));
    };

    fetchSoilStatus();
    fetchWaterStatus();
    fetchScoutingAlerts();
    fetchTreeHealthSnapshots();
  }, [session?.user]);

  /* ─── Smart actions ─── */
  useEffect(() => {
    let actions: any[] = [];
    if (Array.isArray(skaustSprayTemplate2026Chemicals)) {
      actions = skaustSprayTemplate2026Chemicals.filter(item => {
        if (item.target_pest?.toLowerCase().includes('scab')) {
          if (forecast.slice(0, 3).some(day => getSprayWindowStatus(day) === 'RED')) return false;
        }
        return true;
      });
    }
    setSmartActions(actions.slice(0, 3));
  }, [forecast]);

  /* ─── Tree tags loader ─── */
  useEffect(() => {
    const loadTreeTags = async () => {
      if (!session?.user) { setTreeTags([]); return; }
      const { data } = await supabase.from('tree_tags')
        .select('id, field_id, name, variety, latitude, longitude, row_number').eq('user_id', session.user.id);
      setTreeTags((data ?? []).map((row: any) => ({
        id: row.id, fieldId: row.field_id, name: row.name ?? '',
        variety: row.variety ?? '', latitude: row.latitude, longitude: row.longitude,
        rowNumber: row.row_number ?? null,
      })));
    };
    loadTreeTags();
  }, [session?.user]);

  /* ─── Activities loader — reads from calendar_activities (Supabase) ─── */
  useEffect(() => {
    const loadActivities = async () => {
      setActivityError(null);
      if (!session?.user) { setActivities([]); return; }

      const activityKindMap: Record<string, 'success' | 'warning' | 'info'> = {
        tree_scouting: 'info',
        soil_test: 'info',
        water_test: 'info',
        orchard_doctor: 'warning',
        spray: 'warning',
        irrigation: 'info',
        pruning: 'success',
        harvesting: 'success',
        fertilizer: 'success',
        other: 'info',
      };

      const { data, error } = await supabase
        .from('calendar_activities')
        .select('id, title, date, type, completed')
        .eq('user_id', session.user.id)
        .order('date', { ascending: false })
        .limit(5);

      if (error) { setActivityError(error.message); return; }

      setActivities((data ?? []).map((row: any) => ({
        id: row.id,
        title: row.title,
        createdAt: row.date + 'T00:00:00',
        kind: row.completed ? 'success' : (activityKindMap[row.type] ?? 'info'),
      })));
    };
    loadActivities();
  }, [session?.user]);

  /* ─── Google Maps renderer ─── */
  useEffect(() => {
    if (!mapsLoaded || !mapRef.current || fields.length === 0) return;
    const googleMaps = (window as any).google;
    if (!googleMaps?.maps) return;

    const { fieldId, lat, lng } = getQueryParams();
    const fieldsWithCoords = fields.filter(f => f.latitude && f.longitude);
    const fieldsWithBoundaries = fields.filter(f => f.boundaryPath && f.boundaryPath.length > 0);

    let initialCenter: any = null;
    let initialZoom = 12;

    if (fieldId) {
      const field = fields.find(f => f.id === fieldId);
      if (field) {
        if (field.latitude && field.longitude) { initialCenter = { lat: field.latitude, lng: field.longitude }; initialZoom = 16; }
        else if (field.boundaryPath?.length) { initialCenter = { lat: field.boundaryPath[0].lat, lng: field.boundaryPath[0].lng }; initialZoom = 16; }
        setSelectedFieldId(field.id);
      }
    } else if (lat && lng) { initialCenter = { lat: parseFloat(lat), lng: parseFloat(lng) }; initialZoom = 16; }

    if (!initialCenter) {
      if (fieldsWithCoords[0]) initialCenter = { lat: fieldsWithCoords[0].latitude!, lng: fieldsWithCoords[0].longitude! };
      else if (fieldsWithBoundaries[0]?.boundaryPath?.[0]) initialCenter = { lat: fieldsWithBoundaries[0].boundaryPath![0].lat, lng: fieldsWithBoundaries[0].boundaryPath![0].lng };
      else { initialCenter = { lat: 34.0837, lng: 74.7973 }; initialZoom = 10; }
    }

    const map = new googleMaps.maps.Map(mapRef.current, { center: initialCenter, zoom: initialZoom, mapTypeId: 'satellite' });
    mapInstanceRef.current = map;

    const bounds = new googleMaps.maps.LatLngBounds();
    let hasBounds = false;

    boundaryPolygonsRef.current.forEach(p => p.setMap(null)); boundaryPolygonsRef.current.clear();
    treeMarkersRef.current.forEach(m => m.setMap(null)); treeMarkersRef.current = [];

    fieldsWithCoords.forEach(field => {
      const pos = { lat: field.latitude!, lng: field.longitude! };
      const marker = new googleMaps.maps.Marker({ position: pos, map, title: field.name, label: { text: field.name.charAt(0), color: 'white', fontSize: '14px', fontWeight: 'bold' } });
      const iw = new googleMaps.maps.InfoWindow({ content: `<div style="padding:8px"><h3 style="font-weight:600;margin-bottom:4px">${field.name}</h3><p style="font-size:12px;color:#666">Area: ${field.mapAreaKanal ?? field.areaKanal ?? field.area ?? '—'} kanal</p><p style="font-size:12px;color:#666">Status: ${field.healthStatus}</p></div>` });
      marker.addListener('click', () => { setSelectedFieldId(field.id); iw.open(map, marker); });
      bounds.extend(pos); hasBounds = true;
    });

    fieldsWithBoundaries.forEach(field => {
      const path = field.boundaryPath!.map(p => ({ lat: p.lat, lng: p.lng }));
      const polygon = new googleMaps.maps.Polygon({ paths: path, strokeColor: '#16a34a', strokeOpacity: 0.9, strokeWeight: 2, fillColor: '#22c55e', fillOpacity: 0.2, map });
      boundaryPolygonsRef.current.set(field.id, polygon);
      polygon.addListener('click', (e: any) => { setSelectedFieldId(field.id); if (e?.latLng) map.panTo({ lat: e.latLng.lat(), lng: e.latLng.lng() }); });
      path.forEach(p => { bounds.extend(p); hasBounds = true; });
    });

    // Build serial numbers per row (same logic as chip display)
    const markerRowMap = new Map<number | null, typeof treeTags>();
    for (const t of treeTags) {
      const rk = t.rowNumber ?? null;
      if (!markerRowMap.has(rk)) markerRowMap.set(rk, []);
      markerRowMap.get(rk)!.push(t);
    }
    const markerSerialById: Record<string, number> = {};
    markerRowMap.forEach(trees => {
      trees.forEach((t, idx) => { markerSerialById[t.id] = idx + 1; });
    });

    let treeIW: any = null;
    treeTags.forEach(tag => {
      if (!tag.latitude || !tag.longitude) return;
      const pos = { lat: tag.latitude, lng: tag.longitude };
      const color = getVarietyColor(tag.variety);
      const serial = markerSerialById[tag.id] ?? '';
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72"><circle cx="36" cy="27" r="22" fill="${color}" opacity="0.25"/><circle cx="36" cy="27" r="16" fill="${color}"/><rect x="32" y="40" width="8" height="18" rx="3" fill="#7c4d2b"/><text x="36" y="31" text-anchor="middle" dominant-baseline="middle" font-size="13" font-weight="800" font-family="system-ui,sans-serif" fill="white">${serial}</text></svg>`;
      const marker = new googleMaps.maps.Marker({
        position: pos, map,
        title: tag.name || 'Tree',
        icon: { url: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`, scaledSize: new googleMaps.maps.Size(36, 36), anchor: new googleMaps.maps.Point(18, 36) },
        zIndex: 10,
      });
      marker.addListener('click', () => {
        map.panTo(pos);
        map.setZoom(19);
        setSelectedFieldId(tag.fieldId);
        setSelectedTreeId(tag.id);
        if (treeIW) treeIW.close();
        const snap = treeHealthSnapshotsRef.current.find(s => s.treeTagId === tag.id);
        const healthColor: Record<string, string> = { HEALTHY: '#22c55e', STRESSED: '#f59e0b', INFECTED: '#f97316', CRITICAL: '#ef4444' };
        const hColor = snap ? (healthColor[snap.healthStatus] || '#9ca3af') : '#9ca3af';
        const hLabel = snap ? snap.healthStatus.charAt(0) + snap.healthStatus.slice(1).toLowerCase() : 'Not scouted';
        const iwContent = `
          <div style="font-family:system-ui,sans-serif;padding:2px 0;min-width:160px">
            <div style="font-weight:700;font-size:14px;color:#111;margin-bottom:3px">🌳 ${tag.name || 'Tree'}</div>
            <div style="font-size:11px;color:#666;margin-bottom:6px">${tag.variety || 'Unknown variety'}</div>
            <div style="display:inline-flex;align-items:center;gap:5px;background:${hColor}18;border:1.5px solid ${hColor}55;border-radius:20px;padding:3px 10px">
              <span style="width:8px;height:8px;border-radius:50%;background:${hColor};display:inline-block;flex-shrink:0"></span>
              <span style="font-weight:700;font-size:11px;color:${hColor}">${hLabel}</span>
            </div>
            ${snap ? `<div style="font-size:10px;color:#888;margin-top:5px">Risk: ${snap.riskScore}/100 · ${snap.totalObservations} observations</div>` : ''}
          </div>`;
        treeIW = new googleMaps.maps.InfoWindow({ content: iwContent });
        treeIW.open(map, marker);
        if (handleOpenScoutingModalRef.current) handleOpenScoutingModalRef.current(tag);
      });
      treeMarkersRef.current.push(marker); bounds.extend(pos); hasBounds = true;
    });

    if (hasBounds) map.fitBounds(bounds);
  }, [mapsLoaded, fields, treeTags]);

  useEffect(() => {
    if (!boundaryPolygonsRef.current.size) return;
    boundaryPolygonsRef.current.forEach((polygon, fid) => {
      const sel = fid === selectedFieldId;
      polygon.setOptions({ strokeColor: sel ? '#15803d' : '#16a34a', strokeWeight: sel ? 3 : 2, fillColor: sel ? '#16a34a' : '#22c55e', fillOpacity: sel ? 0.3 : 0.2 });
    });
  }, [selectedFieldId]);

  useEffect(() => {
    if (!treeMarkersRef.current.length) return;
    // Recompute serials so SVG labels stay correct on re-render
    const updRowMap = new Map<number | null, typeof treeTags>();
    for (const t of treeTags) {
      const rk = t.rowNumber ?? null;
      if (!updRowMap.has(rk)) updRowMap.set(rk, []);
      updRowMap.get(rk)!.push(t);
    }
    const updSerial: Record<string, number> = {};
    updRowMap.forEach(trees => { trees.forEach((t, idx) => { updSerial[t.id] = idx + 1; }); });

    treeMarkersRef.current.forEach((marker: any) => {
      const tag = treeTags.find(t => t.name === marker.getTitle() || (marker.getPosition()?.lat() === t.latitude && marker.getPosition()?.lng() === t.longitude));
      if (!tag) return;
      const isSelected = tag.id === selectedTreeId;
      const color = getVarietyColor(tag.variety);
      const serial = updSerial[tag.id] ?? '';
      const svg = isSelected
        ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72"><circle cx="36" cy="27" r="26" fill="#fbbf24" opacity="0.4"/><circle cx="36" cy="27" r="22" fill="${color}" opacity="0.25"/><circle cx="36" cy="27" r="16" fill="${color}" stroke="#fbbf24" stroke-width="3"/><rect x="32" y="40" width="8" height="18" rx="3" fill="#7c4d2b"/><text x="36" y="31" text-anchor="middle" dominant-baseline="middle" font-size="13" font-weight="800" font-family="system-ui,sans-serif" fill="white">${serial}</text></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72"><circle cx="36" cy="27" r="22" fill="${color}" opacity="0.25"/><circle cx="36" cy="27" r="16" fill="${color}"/><rect x="32" y="40" width="8" height="18" rx="3" fill="#7c4d2b"/><text x="36" y="31" text-anchor="middle" dominant-baseline="middle" font-size="13" font-weight="800" font-family="system-ui,sans-serif" fill="white">${serial}</text></svg>`;
      const googleMaps = (window as any).google;
      if (googleMaps?.maps) marker.setIcon({ url: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`, scaledSize: new googleMaps.maps.Size(isSelected ? 44 : 36, isSelected ? 44 : 36), anchor: new googleMaps.maps.Point(isSelected ? 22 : 18, isSelected ? 44 : 36) });
      marker.setZIndex(isSelected ? 20 : 10);
    });
  }, [selectedTreeId, treeTags]);

  const handleViewField = (field: Field) => {
    if (!mapInstanceRef.current) return;
    const googleMaps = (window as any).google;
    if (!googleMaps?.maps) return;
    if (field.boundaryPath?.length) {
      const bounds = new googleMaps.maps.LatLngBounds();
      field.boundaryPath.forEach(p => bounds.extend({ lat: p.lat, lng: p.lng }));
      mapInstanceRef.current.fitBounds(bounds); setSelectedFieldId(field.id); return;
    }
    if (field.latitude && field.longitude) { mapInstanceRef.current.panTo({ lat: field.latitude, lng: field.longitude }); mapInstanceRef.current.setZoom(16); setSelectedFieldId(field.id); }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'Excellent': return 'text-emerald-700 bg-emerald-50 border border-emerald-200';
      case 'Good':      return 'text-blue-700 bg-blue-50 border border-blue-200';
      case 'Fair':      return 'text-amber-700 bg-amber-50 border border-amber-200';
      case 'Poor':      return 'text-red-700 bg-red-50 border border-red-200';
      default:          return 'text-gray-600 bg-gray-50 border border-gray-200';
    }
  };

  const getActivityDotColor = (kind: 'success' | 'warning' | 'info') => {
    switch (kind) { case 'success': return '#22c55e'; case 'warning': return '#f97316'; default: return '#3b82f6'; }
  };
  const getActivityBg = (kind: 'success' | 'warning' | 'info') => {
    switch (kind) { case 'success': return 'rgba(34,197,94,0.08)'; case 'warning': return 'rgba(249,115,22,0.08)'; default: return 'rgba(59,130,246,0.08)'; }
  };

  const varietyPalette = ['#22c55e', '#f97316', '#3b82f6', '#e11d48', '#a855f7', '#14b8a6'];
  const getVarietyColor = (variety: string) => {
    if (!variety) return '#16a34a';
    const hash = variety.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return varietyPalette[hash % varietyPalette.length];
  };

  const handleViewTree = (tag: { id: string; latitude: number; longitude: number; fieldId: string }) => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.panTo({ lat: tag.latitude, lng: tag.longitude }); mapInstanceRef.current.setZoom(19); setSelectedFieldId(tag.fieldId); setSelectedTreeId(tag.id);
    mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleOpenScoutingModal = async (tag: typeof treeTags[0]) => {
    const snapshot = treeHealthSnapshots.find(s => s.treeTagId === tag.id) ?? null;
    setScoutingModalTree({ tag, snapshot, recentObs: [] });
    setScoutingModalLoading(true);
    const { data } = await supabase
      .from('tree_scouting_observations')
      .select('pest_name, severity_score, notes, scouted_at, affected_part')
      .eq('tree_tag_id', tag.id)
      .order('scouted_at', { ascending: false })
      .limit(5);
    setScoutingModalTree(prev => prev ? {
      ...prev,
      recentObs: (data ?? []).map((r: any) => ({
        pestName: r.pest_name ?? 'Unknown', severityScore: r.severity_score ?? 0,
        notes: r.notes ?? '', scoutedAt: r.scouted_at, affectedPart: r.affected_part ?? '',
      })),
    } : null);
    setScoutingModalLoading(false);
  };

  useEffect(() => { treeHealthSnapshotsRef.current = treeHealthSnapshots; }, [treeHealthSnapshots]);
  useEffect(() => { handleOpenScoutingModalRef.current = handleOpenScoutingModal; }, [treeTags, treeHealthSnapshots]);

  const getHealthStatusMeta = (status: string) => {
    const s = (status ?? '').toUpperCase();
    if (s === 'HEALTHY')  return { label: 'Healthy',  dot: '#22c55e', bg: 'bg-emerald-50',  border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' };
    if (s === 'STRESSED') return { label: 'Stressed', dot: '#f59e0b', bg: 'bg-amber-50',    border: 'border-amber-200',   text: 'text-amber-700',   badge: 'bg-amber-100 text-amber-700' };
    if (s === 'INFECTED') return { label: 'Infected', dot: '#f97316', bg: 'bg-orange-50',   border: 'border-orange-200',  text: 'text-orange-700',  badge: 'bg-orange-100 text-orange-700' };
    if (s === 'CRITICAL') return { label: 'Critical', dot: '#ef4444', bg: 'bg-red-50',      border: 'border-red-200',     text: 'text-red-700',     badge: 'bg-red-100 text-red-700' };
    return { label: 'Unknown', dot: '#9ca3af', bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600', badge: 'bg-gray-100 text-gray-600' };
  };

  const totalTrees = treeTags.length;

  const stats = [
    { title: 'Total Fields', value: fields.length,            icon: '🌿', color: 'from-emerald-500 to-green-400',  delay: 'dash-d0', onClick: () => navigate('/fields') },
    { title: 'Total Trees',  value: totalTrees,                icon: '🌳', color: 'from-teal-500 to-emerald-400',  delay: 'dash-d1', onClick: () => taggedTreesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) },
    { title: 'Active Alerts',value: scoutingAlerts.length,     icon: '⚠️', color: 'from-orange-400 to-amber-400',  delay: 'dash-d2', onClick: () => navigate('/tree-scouting') },
    { title: 'Temperature',  value: weatherLoading ? '…' : (weather ? `${weather.temperature}°C` : (weatherError || 'N/A')), icon: '🌡️', color: 'from-violet-500 to-purple-400', delay: 'dash-d3', onClick: undefined },
  ];

  const ragColor = {
    green:  { ring: 'ring-2 ring-emerald-400', bg: 'bg-emerald-50',  text: 'text-emerald-500' },
    yellow: { ring: 'ring-2 ring-amber-400',   bg: 'bg-amber-50',   text: 'text-amber-500' },
    red:    { ring: 'ring-2 ring-red-400',      bg: 'bg-red-50',     text: 'text-red-500' },
    gray:   { ring: 'ring-2 ring-gray-300',     bg: 'bg-gray-50',    text: 'text-gray-400' },
  };

  const getAlertSeverityStyle = (severity: string) => {
    const s = severity?.toUpperCase();
    if (s === 'CRITICAL') return { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700 border-red-200', dot: '#ef4444', label: 'Critical' };
    if (s === 'INFECTED') return { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700 border-orange-200', dot: '#f97316', label: 'Infected' };
    if (s === 'AT_RISK')  return { bg: 'bg-amber-50',  border: 'border-amber-200',  badge: 'bg-amber-100 text-amber-700 border-amber-200',   dot: '#f59e0b', label: 'At Risk' };
    return { bg: 'bg-gray-50', border: 'border-gray-200', badge: 'bg-gray-100 text-gray-600 border-gray-200', dot: '#9ca3af', label: 'Healthy' };
  };

  const getAlertLevelLabel = (level: string) => {
    const l = level?.toUpperCase();
    if (l === 'BLOCK') return '🔴 Block';
    if (l === 'FIELD') return '🟠 Field';
    return '🟡 Tree';
  };

  const getActionIcon = (action: any) => {
    const pest = (action.target_pest ?? '').toLowerCase();
    if (pest.includes('scab')) return '🍎';
    if (pest.includes('mite') || pest.includes('aphid')) return '🐛';
    if (pest.includes('fire') || pest.includes('blight')) return '🔥';
    return '🌿';
  };

  return (
    <>
      <style>{DASH_STYLES}</style>

      {/* ── Full-width page wrapper ── */}
      <div className="dash-page-bg w-full space-y-4 sm:space-y-5 lg:space-y-6 pb-12 px-0">

        {/* ══════════════════════════════════════════
            HERO HEADER
        ══════════════════════════════════════════ */}
        <div className="dash-fade-down dash-d0 relative overflow-hidden rounded-2xl sm:rounded-3xl dash-header-banner shadow-2xl">
          {/* Decorative blobs — lighter on mobile */}
          <div className="hidden sm:block absolute -top-10 -left-10 w-52 h-52 rounded-full bg-white/5 pointer-events-none" />
          <div className="hidden sm:block absolute -bottom-12 -right-12 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
          <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-white/3 pointer-events-none blur-2xl" />

          <div className="relative px-4 sm:px-8 lg:px-12 py-7 sm:py-10 flex flex-col items-center text-center gap-2 sm:gap-3 md:gap-4">
            {/* Live badge */}
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full text-emerald-100 text-[11px] sm:text-xs font-semibold tracking-wide">
              <span className="relative inline-block w-2 h-2 rounded-full bg-emerald-300 dash-pulse" />
              Season 2026 · Live
            </div>

            <h1 className="dash-hero-title text-2xl sm:text-4xl md:text-5xl font-black text-white drop-shadow-lg tracking-tight leading-tight">
              <span className="dash-leaf"></span>{' '}
              Orchard Dashboard
            </h1>

            <p className="text-emerald-100 text-xs sm:text-sm font-medium">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            {weather && (
              <div className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-2.5 bg-white/15 backdrop-blur-sm border border-white/25 rounded-xl sm:rounded-2xl text-white text-xs sm:text-sm font-semibold">
                <span className="text-xl sm:text-2xl">{getAnimatedIcon(weather.weathercode)}</span>
                <span>{weather.temperature}°C</span>
                <span className="w-px h-4 bg-white/30" />
                <span className="text-emerald-100 font-normal">Current conditions</span>
              </div>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════
            STAT CARDS — 2-col on phone, 4-col on desktop
        ══════════════════════════════════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          {stats.map((s, i) => (
            <div
              key={i}
              onClick={s.onClick}
              className={`dash-scale-in ${s.delay} dash-stat-card rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 flex flex-col items-center text-center ${s.onClick ? 'cursor-pointer' : ''}`}
            >
              <div className={`dash-stat-icon w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center text-lg sm:text-xl md:text-2xl shadow-md mb-2 sm:mb-3`}>
                {s.icon}
              </div>
              <p className="dash-stat-value text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900 tabular-nums">{s.value}</p>
              <span className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-gray-400 uppercase tracking-widest mt-1 leading-tight text-center">{s.title}</span>
              {s.onClick && (
                <span className="text-[9px] text-orange-400 font-semibold mt-1 tracking-wide cursor-pointer">tap to view →</span>
              )}
            </div>
          ))}
        </div>

        {/* ══════════════════════════════════════════
            HEALTH RAG MATRIX
        ══════════════════════════════════════════ */}
        <div className="dash-fade-up dash-d2 dash-glass-card rounded-2xl p-4 sm:p-5 md:p-6">
          <div className="flex flex-col items-center text-center mb-4 sm:mb-5 gap-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-emerald-700 text-xs font-semibold">
              🔬 Health RAG Matrix
            </div>
            <p className="text-xs text-gray-400 mt-1">Real-time soil &amp; water status</p>
          </div>

          <div className="flex items-start justify-around gap-3 sm:gap-6">
            {[
              { label: 'Soil',  status: soilStatus,  tooltip: soilTooltip,  icon: { green: CheckCircle, yellow: AlertCircle, red: XCircle, gray: HelpCircle }, emoji: '🌱', href: '/soil-test-advisory' },
              { label: 'Water', status: waterStatus, tooltip: waterTooltip, icon: { green: Droplet, yellow: Droplet, red: Droplet, gray: Droplet }, emoji: '💧', href: '/soil-test-advisory?tab=water' },
            ].map(({ label, status, tooltip, icon, emoji, href }) => {
              const Icon = icon[status];
              const rc = ragColor[status];
              return (
                <div key={label} className="flex flex-col items-center gap-2 flex-1 cursor-pointer group" onClick={() => navigate(href)}>
                  <div
                    className={`dash-rag-orb w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-md ${rc.ring} ${rc.bg} relative group-hover:scale-110 transition-transform`}
                    title={tooltip}
                  >
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 ${rc.text}`} />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm sm:text-base">{emoji}</span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-700 group-hover:text-emerald-600 transition-colors">{label}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 text-center max-w-[6rem] leading-tight">{tooltip}</span>
                  <span className="text-[9px] text-emerald-500 font-semibold tracking-wide">tap to view →</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ══════════════════════════════════════════
            MAP SECTION
        ══════════════════════════════════════════ */}
        <div className="dash-fade-up dash-d3">
          <div className="dash-glass-card rounded-2xl p-4 sm:p-5 md:p-6">
            <div className="flex flex-col items-center text-center mb-4 sm:mb-5 gap-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center shadow-md">
                <span className="text-xl sm:text-2xl">🗺️</span>
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-green-700 to-emerald-500 bg-clip-text text-transparent">
                Orchard Map Overview
              </h2>
              <p className="text-xs sm:text-sm text-gray-400">All saved fields and tree locations</p>
              <Button onClick={() => navigate('/fields')} size="sm" variant="outline" className="mt-1">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="text-xs sm:text-sm">View All Fields</span>
              </Button>
            </div>

            {fieldsError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs sm:text-sm text-red-700">{fieldsError}</div>
            )}

            {loadingFields ? (
              <div className="w-full h-56 sm:h-72 md:h-80 rounded-2xl bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs sm:text-sm text-gray-500">Loading fields…</p>
                </div>
              </div>
            ) : fields.length === 0 ? (
              <div className="w-full h-56 sm:h-72 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center px-4">
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl dash-float mb-3 sm:mb-4">🌳</div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-1">No Orchards Mapped Yet</h3>
                  <p className="text-xs sm:text-sm text-gray-400 mb-4">Your saved orchards will appear here on the map</p>
                  <Button onClick={() => navigate('/fields')} size="sm">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />Create Your First Orchard
                  </Button>
                </div>
              </div>
            ) : (
              <div
                ref={mapRef}
                className="dash-map-height w-full rounded-2xl border-2 border-green-400 bg-gray-100 shadow-lg"
                style={{ height: '340px' }}
              />
            )}
          </div>

          {/* ── Saved Fields chips — horizontal scroll ── */}
          {fields.length > 0 && (
            <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
              <h3 className="text-xs font-bold text-gray-600 uppercase tracking-widest pb-1 border-b border-gray-100">Saved Fields</h3>
              <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2" style={{ WebkitOverflowScrolling: 'touch' }}>
                {fields.map((field, fi) => {
                  const orchardType = field.details && 'orchardType' in field.details ? field.details.orchardType : '—';
                  const varietyTrees = field.details && Array.isArray(field.details.varietyTrees) ? field.details.varietyTrees : [];
                  return (
                    <div
                      key={field.id}
                      className={`dash-field-card dash-scale-in shrink-0 w-44 sm:w-52 p-3 sm:p-4 rounded-xl sm:rounded-2xl cursor-pointer ${selectedFieldId === field.id ? 'border-green-500 bg-green-50/80 shadow-md' : ''}`}
                      style={{ animationDelay: `${fi * 0.07}s` }}
                      onClick={() => handleViewField(field)}
                    >
                      <div className="flex items-start justify-between mb-1.5 sm:mb-2">
                        <h4 className="font-semibold text-gray-900 text-xs sm:text-sm truncate max-w-[7rem]">{field.name}</h4>
                        <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium shrink-0 ${getHealthStatusColor(field.healthStatus)}`}>
                          {field.healthStatus}
                        </span>
                      </div>
                      <div className="space-y-0.5 sm:space-y-1 text-xs text-gray-500">
                        <div className="flex items-center gap-1"><MapPin className="w-3 h-3 shrink-0" /><span className="truncate">{field.location}</span></div>
                        <div className="flex items-center justify-between">
                          <span>{(typeof field.mapAreaKanal === 'number' ? field.mapAreaKanal : (typeof field.areaKanal === 'number' ? field.areaKanal : field.area ?? '—'))} kanal</span>
                          <span className="text-gray-400 truncate ml-1">{field.cropStage}</span>
                        </div>
                        {orchardType !== '—' && <div className="font-medium text-green-700 truncate">{orchardType}</div>}
                        {varietyTrees.length > 0 && (
                          <ul className="mt-0.5 space-y-0.5">
                            {varietyTrees.slice(0, 2).map((v: any, i: number) => (
                              <li key={i} className="text-green-700 truncate">{v.variety} <span className="text-gray-400">({v.totalTrees})</span></li>
                            ))}
                            {varietyTrees.length > 2 && <li className="text-gray-400 text-[10px]">+{varietyTrees.length - 2} more</li>}
                          </ul>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Tagged Trees chips ── */}
          {(() => {
            const visibleTags = (selectedFieldId ? treeTags.filter(t => t.fieldId === selectedFieldId) : treeTags);
            if (visibleTags.length === 0) return null;

            // Build serial numbers per-row exactly as TreeScouting does
            // Group all tags (across all fields) by rowNumber, assign serial per row
            const allTagsForSerial = treeTags;
            const rowMap = new Map<number | null, typeof treeTags>();
            for (const t of allTagsForSerial) {
              const rk = t.rowNumber ?? null;
              if (!rowMap.has(rk)) rowMap.set(rk, []);
              rowMap.get(rk)!.push(t);
            }
            const serialByTreeId: Record<string, number> = {};
            rowMap.forEach(trees => {
              trees.forEach((t, idx) => { serialByTreeId[t.id] = idx + 1; });
            });

            // Sort visible tags: by rowNumber (nulls last), then by serial within row
            const sortedTags = [...visibleTags].sort((a, b) => {
              const ra = a.rowNumber ?? Infinity;
              const rb = b.rowNumber ?? Infinity;
              if (ra !== rb) return ra - rb;
              return (serialByTreeId[a.id] ?? 0) - (serialByTreeId[b.id] ?? 0);
            });

            // Group sorted tags by rowNumber for display
            const displayRowMap = new Map<number | null, typeof treeTags>();
            for (const t of sortedTags) {
              const rk = t.rowNumber ?? null;
              if (!displayRowMap.has(rk)) displayRowMap.set(rk, []);
              displayRowMap.get(rk)!.push(t);
            }
            const sortedRowKeys = Array.from(displayRowMap.keys()).sort((a, b) => {
              if (a === null && b === null) return 0;
              if (a === null) return 1;
              if (b === null) return -1;
              return a - b;
            });

            return (
              <div ref={taggedTreesSectionRef} className="mt-3 sm:mt-4 space-y-2">
                <h3 className="text-xs font-bold text-gray-600 uppercase tracking-widest pb-1 border-b border-gray-100">Tagged Trees</h3>
                {sortedRowKeys.map(rowKey => {
                  const rowTrees = displayRowMap.get(rowKey)!;
                  const rowLabel = rowKey != null ? `Row ${rowKey}` : 'Unassigned';
                  const rowKeyStr = String(rowKey);
                  const isExpanded = expandedRows.has(rowKeyStr);
                  const toggleRow = () => setExpandedRows(prev => {
                    const next = new Set(prev);
                    next.has(rowKeyStr) ? next.delete(rowKeyStr) : next.add(rowKeyStr);
                    return next;
                  });
                  // count health statuses for summary
                  const healthCounts = rowTrees.reduce<Record<string, number>>((acc, tag) => {
                    const snap = treeHealthSnapshots.find(s => s.treeTagId === tag.id);
                    const h = snap?.healthStatus ?? 'UNKNOWN';
                    acc[h] = (acc[h] ?? 0) + 1;
                    return acc;
                  }, {});
                  return (
                    <div key={rowKeyStr} className="rounded-xl border border-gray-200 overflow-hidden">
                      {/* Row header — clickable drill-down toggle */}
                      <button
                        onClick={toggleRow}
                        className="w-full flex items-center justify-between px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                      >
                        {/* left spacer for centering */}
                        <span className="w-5" />
                        {/* centered label + count */}
                        <div className="flex items-center gap-2">
                          <TreePine className="w-3.5 h-3.5 text-emerald-700" />
                          <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wide">{rowLabel}</span>
                          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-200 rounded-full px-1.5 py-0.5">{rowTrees.length}</span>
                          {/* mini health dots */}
                          <div className="flex gap-1 ml-1">
                            {Object.entries(healthCounts).map(([h, count]) => {
                              const dotColor: Record<string, string> = { HEALTHY: '#22c55e', STRESSED: '#f59e0b', INFECTED: '#f97316', CRITICAL: '#ef4444', UNKNOWN: '#9ca3af' };
                              return (
                                <span key={h} className="flex items-center gap-0.5">
                                  <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: dotColor[h] ?? '#9ca3af' }} />
                                  <span className="text-[9px] text-gray-500">{count}</span>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                        {/* chevron */}
                        {isExpanded
                          ? <ChevronUp className="w-4 h-4 text-emerald-600" />
                          : <ChevronDown className="w-4 h-4 text-emerald-600" />}
                      </button>

                      {/* Drill-down tree chips */}
                      {isExpanded && (
                        <div className="px-2 pt-2 pb-3 bg-white">
                          <div className="flex gap-2 overflow-x-auto pb-1" style={{ WebkitOverflowScrolling: 'touch' }}>
                            {rowTrees.map(tag => {
                              const snap = treeHealthSnapshots.find(s => s.treeTagId === tag.id);
                              const meta = snap ? getHealthStatusMeta(snap.healthStatus) : null;
                              const isSelected = selectedTreeId === tag.id;
                              const serial = serialByTreeId[tag.id];
                              return (
                                <div
                                  key={tag.id}
                                  className={`dash-field-card shrink-0 w-36 sm:w-40 p-2 sm:p-2.5 rounded-xl cursor-pointer transition-all ${
                                    isSelected
                                      ? 'border-2 border-amber-400 bg-amber-50 shadow-md scale-105'
                                      : meta ? `${meta.border} border` : 'border border-gray-200'
                                  }`}
                                  onClick={() => { handleViewTree(tag); handleOpenScoutingModal(tag); }}
                                  title="Click to go to this tree on the map and view scouting details"
                                >
                                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                                    <span className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center text-[9px] font-extrabold text-white" style={{ background: meta ? meta.dot : getVarietyColor(tag.variety) }}>
                                      {serial ?? '?'}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[10px] sm:text-xs font-semibold text-gray-900 truncate">{tag.name || 'Tree'}</p>
                                      <p className="text-[10px] text-gray-400 truncate">{tag.variety || 'Unknown variety'}</p>
                                    </div>
                                    {isSelected && <span className="text-amber-500 text-xs shrink-0">📍</span>}
                                  </div>
                                  {snap ? (
                                    <div className="flex items-center gap-1 flex-wrap">
                                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${meta!.badge}`}>{meta!.label}</span>
                                      {snap.totalObservations > 0 && (
                                        <span className="text-[9px] text-gray-400">{snap.totalObservations} obs</span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-[9px] text-gray-400">Tap to view on map</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* ══════════════════════════════════════════
            7-DAY WEATHER FORECAST
        ══════════════════════════════════════════ */}
        {weatherLoading && (
          <div className="dash-glass-card rounded-2xl p-6 sm:p-8 flex items-center justify-center gap-3">
            <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs sm:text-sm text-gray-500">Loading weather forecast…</p>
          </div>
        )}

        {!weatherLoading && weatherError && (
          <div className="dash-glass-card rounded-2xl p-4 sm:p-5 border border-red-200 bg-red-50/60">
            <p className="text-xs sm:text-sm text-red-600 text-center">⚠️ {weatherError}</p>
          </div>
        )}

        {forecast.length > 0 && (
          <div className="dash-fade-up dash-d4 dash-glass-card rounded-2xl p-4 sm:p-5 md:p-6">
            <div className="flex flex-col items-center text-center mb-4 sm:mb-5 md:mb-6 gap-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-400 flex items-center justify-center shadow-md">
                <span className="text-xl sm:text-2xl">🌤️</span>
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-700 to-violet-500 bg-clip-text text-transparent">
                7-Day Forecast
              </h2>
              <p className="text-xs text-gray-400">Spray window &amp; irrigation advisory</p>
            </div>

            {/* Weather grid — 2-col phone, 4-col iPad, 7-col desktop */}
            <div className="dash-weather-grid grid gap-2 sm:gap-2.5 md:gap-3 mb-4 sm:mb-5 md:mb-6">
              {forecast.map((day, i) => {
                const spray = getSprayBadge(day);
                return (
                  <div
                    key={i}
                    className="dash-weather dash-weather-card flex flex-col items-center p-2 sm:p-2.5 md:p-3 rounded-xl sm:rounded-2xl"
                    style={{ animationDelay: `${i * 0.06}s` }}
                  >
                    <span className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}
                    </span>
                    <span className="text-3xl sm:text-4xl my-1.5 sm:my-2">{getAnimatedIcon(day.weathercode)}</span>
                    <span className="text-xs sm:text-sm font-bold text-gray-900">{day.tempMax}° / {day.tempMin}°</span>
                    {day.feelsLikeMax !== undefined && (
                      <span className="text-[9px] sm:text-[10px] text-gray-400">Feels {day.feelsLikeMax}°</span>
                    )}

                    {typeof day.precipitationProb === 'number' && (
                      <div className="w-full mt-1.5 sm:mt-2">
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-1.5 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full transition-all"
                            style={{ width: `${day.precipitationProb}%` }}
                          />
                        </div>
                        <p className="text-[9px] sm:text-[10px] text-center text-gray-400 mt-0.5">{day.precipitationProb}% rain</p>
                      </div>
                    )}

                    <p className="text-[9px] sm:text-[10px] text-gray-400 mt-1">💨 {day.windSpeed} km/h</p>
                    <p className="text-[9px] sm:text-[10px] text-gray-400">UV {day.uvIndex ?? '—'}</p>

                    <div className={`mt-1.5 sm:mt-2 px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[9px] rounded-full font-semibold text-center leading-tight ${spray.color}`}>
                      {spray.text}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Irrigation banner + pills */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 items-start sm:items-center justify-between">
              <div className="dash-pulse-soft flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold w-full sm:w-auto">
                {getIrrigationAdvice()}
              </div>
              <div className="flex flex-wrap gap-2">
                {forecast.some(isHeavyRain) && (
                  <span className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">🌧️ Heavy rain expected</span>
                )}
                {forecast.some(isFrostRisk) && (
                  <span className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold">❄️ Frost risk</span>
                )}
                {forecast.some(isSpraySafeDay) && (
                  <span className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-semibold">🌿 Spray-safe day</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            SMART ACTION CENTER
        ══════════════════════════════════════════ */}
        <div className="dash-fade-up dash-d5 dash-glass-card rounded-2xl p-4 sm:p-5 md:p-6">
          <div className="flex flex-col items-center text-center mb-4 sm:mb-5 md:mb-6 gap-2">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 bg-gradient-to-r from-emerald-500 to-green-400 rounded-full text-white text-xs font-bold shadow-md">
              <span className="relative inline-block w-2 h-2 rounded-full bg-white dash-pulse" />
              AI-Powered
            </div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-green-700 to-emerald-500 bg-clip-text text-transparent">
              Smart Action Center
            </h2>
            <p className="text-xs text-gray-400">SKUAST 2026 advisory — weather-filtered recommendations</p>
          </div>

          {smartActions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-3 text-2xl sm:text-3xl">
                ✅
              </div>
              <p className="text-sm sm:text-base font-semibold text-gray-700">All Clear</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">No prioritized actions right now</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {smartActions.map((action, idx) => (
                <div
                  key={idx}
                  className={`dash-action-row dash-slide-r dash-d${idx + 1} flex flex-col sm:flex-row items-start gap-2.5 sm:gap-3 md:gap-4 p-3 sm:p-3.5 md:p-4 rounded-xl sm:rounded-2xl border`}
                  style={{ background: 'rgba(240,253,244,0.8)', borderColor: '#bbf7d0' }}
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-400 flex items-center justify-center text-lg sm:text-xl shadow-md shrink-0">
                    {getActionIcon(action)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <p className="text-xs sm:text-sm font-bold text-gray-900">{action.name}</p>
                      {action.target_pest && (
                        <span className="shrink-0 px-2 sm:px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                          {action.target_pest}
                        </span>
                      )}
                    </div>
                    {action.notes && (
                      <p className="text-[10px] sm:text-xs text-gray-500 mt-1 leading-relaxed">{action.notes}</p>
                    )}
                    {action.dose && (
                      <div className="flex items-center gap-1.5 mt-1.5 sm:mt-2">
                        <span className="px-2 py-0.5 rounded-full bg-white border border-gray-200 text-[10px] font-semibold text-gray-600 shadow-sm">
                          💊 Dose: {action.dose}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex flex-col items-center gap-1">
                    {forecast[0] && (() => {
                      const spray = getSprayBadge(forecast[0]);
                      return (
                        <div
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold"
                          style={{ borderColor: spray.dot, color: spray.dot, background: `${spray.dot}15` }}
                          title={spray.text}
                        >
                          {getSprayWindowStatus(forecast[0]) === 'GREEN' ? '✓' : getSprayWindowStatus(forecast[0]) === 'RED' ? '✗' : '!'}
                        </div>
                      );
                    })()}
                    <span className="text-[8px] text-gray-400 text-center leading-tight max-w-10 sm:max-w-12">window</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════
            PROFILE COMPLETION
        ══════════════════════════════════════════ */}
        {profileCompletion < 100 && (
          <div className="dash-fade-up dash-d5 dash-glass-card rounded-2xl p-4 sm:p-5 md:p-6">
            <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
              <div className="flex items-start gap-3 sm:gap-4 flex-1">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center shadow-md shrink-0">
                  <span className="text-xl sm:text-2xl">👤</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-sm sm:text-base font-bold text-gray-900">Complete Your Profile</h3>
                    <span className="px-2 sm:px-2.5 py-0.5 bg-gradient-to-r from-green-500 to-emerald-400 text-white text-xs font-bold rounded-full shadow-sm">
                      {profileCompletion}%
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">Add more information to unlock personalized recommendations.</p>
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-2 sm:mb-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-400 h-2 rounded-full transition-all duration-700"
                      style={{ width: `${profileCompletion}%` }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 text-xs">
                    {[
                      { label: 'Name',      done: !!profileUser.name },
                      { label: 'Email',     done: !!profileUser.email },
                      { label: 'Phone',     done: !!profileUser.phone },
                      { label: 'Farm Name', done: !!profileUser.farmName },
                      { label: 'Photo',     done: !!profileUser.avatar },
                      { label: 'Khasra',    done: !!profileUser.khasraNumber },
                      { label: 'Khata',     done: !!profileUser.khataNumber },
                    ].map(({ label, done }) => (
                      <span key={label} className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full border text-[10px] sm:text-[11px] font-medium ${done ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                        {done ? '✓' : '○'} {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <Button onClick={() => navigate('/profile')} size="sm" className="shrink-0 w-full sm:w-auto mt-2 sm:mt-0">Complete Profile</Button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            PRODUCTION OVERVIEW + GROWTH ANALYTICS
        ══════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Production Overview */}
          <div className="dash-fade-up dash-d5 dash-glass-card rounded-2xl p-4 sm:p-5 md:p-6">
            <div className="flex flex-col items-center text-center mb-3 sm:mb-4 gap-2">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500 to-green-400 flex items-center justify-center text-lg sm:text-xl shadow-md">
                📊
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-gray-900">Production Overview</h3>
              <p className="text-[10px] sm:text-xs text-gray-400">No. of trees vs infected vs severe</p>
            </div>

            {treeTags.length === 0 ? (
              <div className="h-36 sm:h-44 bg-gray-50 rounded-xl flex flex-col items-center justify-center border border-dashed border-gray-200 gap-2">
                <span className="text-3xl">🌿</span>
                <p className="text-xs sm:text-sm text-gray-400">No tree data yet</p>
              </div>
            ) : (() => {
              const total        = treeTags.length;
              const healthy      = treeHealthSnapshots.filter(s => s.healthStatus === 'HEALTHY').length;
              const stressed     = treeHealthSnapshots.filter(s => s.healthStatus === 'STRESSED').length;
              const infected     = treeHealthSnapshots.filter(s => s.healthStatus === 'INFECTED').length;
              const critical     = treeHealthSnapshots.filter(s => s.healthStatus === 'CRITICAL').length;
              const infAndSevere = infected + critical;

              const bars: Array<{ label: string; count: number; color: string; shadow: string }> = [
                { label: 'Total\nTrees',  count: total,        color: '#059669', shadow: 'rgba(5,150,105,0.35)'   },
                { label: 'Healthy',       count: healthy,      color: '#22c55e', shadow: 'rgba(34,197,94,0.35)'   },
                { label: 'Stressed',      count: stressed,     color: '#f59e0b', shadow: 'rgba(245,158,11,0.35)'  },
                { label: 'Infected',      count: infected,     color: '#f97316', shadow: 'rgba(249,115,22,0.35)'  },
                { label: 'Severe',        count: critical,     color: '#ef4444', shadow: 'rgba(239,68,68,0.35)'   },
                { label: 'Inf+\nSevere',  count: infAndSevere, color: '#dc2626', shadow: 'rgba(220,38,38,0.35)'   },
              ];
              const maxCount = Math.max(...bars.map(b => b.count), 1);
              const BAR_H    = 100; // max bar height px

              const impactRate = total > 0 ? (infAndSevere / total) * 100 : 0;
              const impactColor = impactRate >= 20 ? '#dc2626' : impactRate >= 10 ? '#f59e0b' : '#059669';

              return (
                <div className="space-y-3">
                  {/* 6-bar chart */}
                  <div className="flex items-end justify-between gap-1.5 pt-2" style={{ height: BAR_H + 52 }}>
                    {bars.map(b => {
                      const h   = Math.max(6, Math.round((b.count / maxCount) * BAR_H));
                      const pct = total > 0 ? ((b.count / total) * 100).toFixed(0) : '0';
                      return (
                        <div key={b.label} className="flex flex-col items-center gap-1 flex-1 min-w-0">
                          {/* count above bar */}
                          <span className="text-[9px] sm:text-[10px] font-extrabold leading-none" style={{ color: b.color }}>
                            {b.count}
                          </span>
                          {/* bar */}
                          <div
                            className="w-full rounded-t-lg transition-all duration-700"
                            style={{
                              height: h,
                              background: `linear-gradient(to top, ${b.color}, ${b.color}aa)`,
                              boxShadow: `0 3px 10px ${b.shadow}`,
                            }}
                          />
                          {/* label */}
                          <span className="text-[7px] sm:text-[8px] font-semibold text-gray-500 text-center leading-tight whitespace-pre-line mt-0.5">
                            {b.label}
                          </span>
                          {/* % of total */}
                          <span className="text-[7px] sm:text-[8px] text-gray-400">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary strip */}
                  <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-gray-100 flex-wrap">
                    {[
                      { txt: `${total} Tagged`,                                                             col: '#059669' },
                      { txt: `${infAndSevere} Inf+Severe`,                                                  col: infAndSevere > 0 ? '#dc2626' : '#059669' },
                      { txt: `${impactRate.toFixed(1)}% Impact`,                                            col: impactColor },
                    ].map(p => (
                      <span key={p.txt} className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: p.col + '18', color: p.col, border: `1px solid ${p.col}33` }}>
                        {p.txt}
                      </span>
                    ))}
                    <button onClick={() => navigate('/tree-scouting')}
                      className="text-[9px] sm:text-[10px] font-semibold text-teal-600 hover:underline ml-auto">
                      View scouting →
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Growth Analytics */}
          <div className="dash-fade-up dash-d6 dash-glass-card rounded-2xl p-4 sm:p-5 md:p-6">
            <div className="flex flex-col items-center text-center mb-3 sm:mb-4 gap-2">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-400 flex items-center justify-center text-lg sm:text-xl shadow-md">
                🌳
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-gray-900">Growth Analytics</h3>
              <p className="text-xs text-gray-400">Tree scouting health distribution</p>
            </div>

            {treeHealthSnapshots.length === 0 ? (
              <div className="h-36 sm:h-44 bg-gray-50 rounded-xl flex flex-col items-center justify-center border border-dashed border-gray-200 gap-2">
                <span className="text-3xl">🌿</span>
                <p className="text-xs sm:text-sm text-gray-400">No scouting data yet</p>
                <button
                  onClick={() => navigate('/tree-scouting')}
                  className="text-xs font-semibold text-teal-600 hover:underline"
                >Start scouting →</button>
              </div>
            ) : (() => {
              const total = treeHealthSnapshots.length;
              const healthy  = treeHealthSnapshots.filter(s => s.healthStatus === 'HEALTHY').length;
              const stressed = treeHealthSnapshots.filter(s => s.healthStatus === 'STRESSED').length;
              const infected = treeHealthSnapshots.filter(s => s.healthStatus === 'INFECTED').length;
              const critical = treeHealthSnapshots.filter(s => s.healthStatus === 'CRITICAL').length;
              const bars = [
                { label: 'Healthy',  count: healthy,  color: '#22c55e', bg: 'bg-emerald-400', textColor: 'text-emerald-700', icon: '🟢' },
                { label: 'Stressed', count: stressed, color: '#f59e0b', bg: 'bg-amber-400',   textColor: 'text-amber-700',   icon: '🟡' },
                { label: 'Infected', count: infected, color: '#f97316', bg: 'bg-orange-400',  textColor: 'text-orange-700',  icon: '🔴' },
                { label: 'Critical', count: critical, color: '#ef4444', bg: 'bg-red-500',     textColor: 'text-red-700',     icon: '⚫' },
              ];
              return (
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-around py-2 px-2 sm:px-3 bg-gray-50 rounded-xl border border-gray-100">
                    {bars.map(b => (
                      <div key={b.label} className="flex flex-col items-center gap-0.5">
                        <span className="text-base sm:text-lg">{b.icon}</span>
                        <span className="text-sm sm:text-base font-extrabold text-gray-900">{b.count}</span>
                        <span className="text-[8px] sm:text-[9px] font-semibold text-gray-400 uppercase tracking-wide">{b.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    {bars.map(b => {
                      const pct = total > 0 ? Math.round((b.count / total) * 100) : 0;
                      return (
                        <div key={b.label} className="flex items-center gap-2">
                          <span className={`text-[9px] sm:text-[10px] font-bold w-12 sm:w-14 shrink-0 ${b.textColor}`}>{b.label}</span>
                          <div className="flex-1 h-2 sm:h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-2 sm:h-2.5 rounded-full ${b.bg} transition-all duration-700`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 w-6 sm:w-8 text-right">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-gray-400">{total} trees scouted</span>
                    <button
                      onClick={() => navigate('/tree-scouting')}
                      className="text-[10px] font-semibold text-teal-600 hover:underline"
                    >View all scouting →</button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* ══════════════════════════════════════════
            RECENT ACTIVITY
        ══════════════════════════════════════════ */}
        <div className="dash-fade-up dash-d6 dash-glass-card rounded-2xl p-4 sm:p-5 md:p-6">
          <div className="flex flex-col items-center text-center mb-4 sm:mb-5 md:mb-6 gap-1">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-400 flex items-center justify-center shadow-md text-lg sm:text-xl">
              📋
            </div>
            <h3 className="text-base sm:text-lg md:text-xl font-extrabold text-gray-900 mt-1 sm:mt-2">Recent Activity</h3>
          </div>

          {activityError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs sm:text-sm text-red-700">{activityError}</div>
          )}

          {activities.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 sm:p-8 text-center">
              <div className="text-3xl sm:text-4xl dash-float mb-2">📅</div>
              <p className="text-xs sm:text-sm text-gray-400">No recent activity yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activities.map((activity, ai) => (
                <div
                  key={activity.id}
                  className="dash-activity-row dash-slide-r flex items-center gap-3 sm:gap-4 p-3 sm:p-3.5 rounded-xl border border-transparent"
                  style={{ animationDelay: `${ai * 0.1}s`, background: getActivityBg(activity.kind) }}
                >
                  <div
                    className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0 relative dash-pulse"
                    style={{ background: getActivityDotColor(activity.kind) }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{activity.title}</p>
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">
                      {new Date(activity.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ══════════════════════════════════════════
          SCOUTING DETAILS MODAL
          — full-screen bottom sheet on mobile,
            centered modal on sm+
      ══════════════════════════════════════════ */}
      {scoutingModalTree && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setScoutingModalTree(null); setSelectedTreeId(null); }} />
          <div
            className="dash-scale-in relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
            style={{ maxHeight: '92vh' }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 dash-header-banner">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-base sm:text-lg shadow">
                  🌳
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-white">{scoutingModalTree.tag.name || 'Tree'}</h2>
                  <p className="text-[10px] sm:text-xs text-emerald-200">{scoutingModalTree.tag.variety || 'Unknown variety'} · Scouting Details</p>
                </div>
              </div>
              <button
                onClick={() => { setScoutingModalTree(null); setSelectedTreeId(null); }}
                className="p-2 rounded-xl bg-white/15 hover:bg-white/25 transition-colors"
                aria-label="Close"
              >
                <span className="text-white text-lg leading-none">×</span>
              </button>
            </div>

            <div className="px-4 sm:px-5 py-3 sm:py-4 overflow-y-auto" style={{ maxHeight: 'calc(92vh - 72px)' }}>
              {/* Health snapshot */}
              {scoutingModalTree.snapshot ? (() => {
                const snap = scoutingModalTree.snapshot!;
                const meta = getHealthStatusMeta(snap.healthStatus);
                const etlLabels: Record<string, string> = {
                  NO_ACTION: 'No Action', MONITOR: 'Monitor Closely',
                  TREAT_TREE: 'Treat This Tree', TREAT_BLOCK: 'Treat Entire Block', TREAT_ORCHARD: 'Full Orchard Spray',
                };
                return (
                  <div className={`rounded-2xl border p-3 sm:p-4 mb-3 sm:mb-4 ${meta.bg} ${meta.border}`}>
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2" style={{ background: `${meta.dot}20`, borderColor: meta.dot }}>
                        <span className="text-base sm:text-lg">🌿</span>
                      </div>
                      <div>
                        <span className={`text-xs sm:text-sm font-extrabold ${meta.text}`}>{meta.label}</span>
                        <p className="text-[10px] sm:text-xs text-gray-400">{snap.totalObservations} total observation{snap.totalObservations !== 1 ? 's' : ''}</p>
                      </div>
                      <span className={`ml-auto text-[9px] sm:text-[10px] font-bold px-2 sm:px-2.5 py-1 rounded-full ${meta.badge}`}>{meta.label}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-xs">
                      <div className="bg-white/60 rounded-xl p-2 sm:p-2.5">
                        <p className="text-gray-400 font-semibold mb-0.5">Risk Score</p>
                        <p className="font-extrabold text-gray-900">{snap.riskScore}/100</p>
                      </div>
                      <div className="bg-white/60 rounded-xl p-2 sm:p-2.5">
                        <p className="text-gray-400 font-semibold mb-0.5">Recommended</p>
                        <p className={`font-bold text-[10px] sm:text-xs ${meta.text}`}>{etlLabels[snap.etlAction] ?? snap.etlAction}</p>
                      </div>
                      {snap.lastScoutedAt && (
                        <div className="bg-white/60 rounded-xl p-2 sm:p-2.5">
                          <p className="text-gray-400 font-semibold mb-0.5">Last Scouted</p>
                          <p className="font-bold text-gray-900">{new Date(snap.lastScoutedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                      )}
                      {snap.lastPestName && (
                        <div className="bg-white/60 rounded-xl p-2 sm:p-2.5">
                          <p className="text-gray-400 font-semibold mb-0.5">Last Pest</p>
                          <p className="font-bold text-gray-900 truncate">{snap.lastPestName}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })() : (
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3 sm:p-4 mb-3 sm:mb-4 text-center">
                  <span className="text-2xl mb-1 block">🌿</span>
                  <p className="text-xs sm:text-sm font-semibold text-gray-700">Not yet scouted</p>
                  <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">No health snapshot available for this tree</p>
                </div>
              )}

              {/* Recent observations */}
              <div className="mb-3 sm:mb-4">
                <h4 className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Recent Observations</h4>
                {scoutingModalLoading ? (
                  <div className="flex items-center justify-center py-5 sm:py-6 gap-2">
                    <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-gray-400">Loading…</p>
                  </div>
                ) : scoutingModalTree.recentObs.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-4 sm:py-5 text-center">
                    <p className="text-xs text-gray-400">No observations recorded yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {scoutingModalTree.recentObs.map((obs, oi) => {
                      const sevLabel = ['None','Trace','Low','Moderate','High','Severe'][obs.severityScore] ?? String(obs.severityScore);
                      const sevColor = ['text-gray-400','text-emerald-600','text-yellow-600','text-orange-600','text-red-600','text-red-800'][obs.severityScore] ?? 'text-gray-600';
                      return (
                        <div key={oi} className="rounded-xl border border-gray-100 bg-white p-2.5 sm:p-3">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span className="text-[10px] sm:text-xs font-bold text-gray-900">{obs.pestName}</span>
                            <span className={`text-[9px] sm:text-[10px] font-bold ${sevColor}`}>{sevLabel}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] text-gray-400 mb-1">
                            {obs.affectedPart && <span>🌿 {obs.affectedPart.replace(/_/g, ' ')}</span>}
                            {obs.scoutedAt && <span>🕒 {new Date(obs.scoutedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                          </div>
                          {obs.notes && <p className="text-[9px] sm:text-[10px] text-gray-500 leading-relaxed line-clamp-2">{obs.notes}</p>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal actions */}
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    const tag = scoutingModalTree!.tag;
                    const params = new URLSearchParams();
                    if (tag.fieldId) params.set('fieldId', tag.fieldId);
                    params.set('treeTagId', tag.id);
                    setScoutingModalTree(null);
                    setSelectedTreeId(null);
                    navigate(`/tree-scouting?${params.toString()}`);
                  }}
                  className="flex-1 py-2 sm:py-2.5 rounded-xl text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all"
                  style={{ background: 'linear-gradient(135deg, #0f766e, #059669)' }}
                >
                  View Full Scouting →
                </button>
                <button
                  onClick={() => { setScoutingModalTree(null); setSelectedTreeId(null); }}
                  className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs sm:text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;
