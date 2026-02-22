
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, TreePine, TriangleAlert as AlertTriangle, Cloud, TrendingUp, Calendar, UserCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import type { User, Field } from '../types';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

import { AlertCircle, Droplet, Bug, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
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

/* ─── Animated gradient header banner — identical to SkuastAdvisory ─── */
.dash-header-banner {
  background: linear-gradient(135deg, #064e3b, #065f46, #047857, #059669, #10b981, #34d399, #6ee7b7, #10b981, #047857);
  background-size: 300% 300%;
  animation: dashHeaderGradient 8s ease infinite;
}

/* ─── Glass card — signature SkuastAdvisory treatment ─── */
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

/* ─── Month pill hover (activity item) ─── */
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
`;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const boundaryPolygonsRef = useRef<Map<string, any>>(new Map());
  const treeMarkersRef = useRef<any[]>([]);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [treeTags, setTreeTags] = useState<Array<{ id: string; fieldId: string; name: string; variety: string; latitude: number; longitude: number }>>([]);
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
  const [pestStatus, setPestStatus] = useState<'green'|'yellow'|'red'|'gray'>('gray');
  const [pestTooltip, setPestTooltip] = useState('No recent pest data');
  const [smartActions, setSmartActions] = useState<any[]>([]);

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

  /* ─── Google Maps loader ─── */
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    if (!apiKey) return;
    if ((window as any).google?.maps) { setMapsLoaded(true); return; }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,drawing`;
    script.async = true; script.defer = true;
    script.onload = () => setMapsLoaded(true);
    document.head.appendChild(script);
  }, []);

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

  /* ─── Soil status ─── */
  useEffect(() => {
    const fetchSoilStatus = async () => {
      if (!session?.user) { setSoilStatus('gray'); return; }
      const { data, error } = await supabase
        .from('soil_test_results').select('soil_ph, nitrogen, phosphorus, potassium, ec, recorded_date')
        .eq('user_id', session.user.id).order('recorded_date', { ascending: false }).limit(1);
      if (error || !data || data.length === 0) { setSoilStatus('gray'); setSoilTooltip('No recent soil test'); return; }
      const test = data[0];
      if (test.soil_ph == null) { setSoilStatus('gray'); setSoilTooltip('No pH value'); return; }
      if (test.soil_ph < 6 || test.soil_ph > 7.5) { setSoilStatus('red'); setSoilTooltip(`Soil pH out of range (${test.soil_ph})`); }
      else { setSoilStatus('green'); setSoilTooltip(`Soil pH optimal (${test.soil_ph})`); }
    };
    fetchSoilStatus();
    setWaterStatus('gray'); setWaterTooltip('No water test data');
    setPestStatus('gray'); setPestTooltip('No pest data');
  }, [session?.user]);

  /* ─── Smart actions (moved to below forecast) ─── */
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
        .select('id, field_id, name, variety, latitude, longitude').eq('user_id', session.user.id);
      setTreeTags((data ?? []).map((row: any) => ({
        id: row.id, fieldId: row.field_id, name: row.name ?? '',
        variety: row.variety ?? '', latitude: row.latitude, longitude: row.longitude,
      })));
    };
    loadTreeTags();
  }, [session?.user]);

  /* ─── Activities loader ─── */
  useEffect(() => {
    const loadActivities = async () => {
      if (!session?.user) { setActivities([]); setActivityError(null); return; }
      setActivityError(null);
      const { data, error } = await supabase.from('activities')
        .select('id, title, created_at, kind').eq('user_id', session.user.id)
        .order('created_at', { ascending: false }).limit(3);
      if (error) { setActivityError(error.message); return; }
      setActivities((data ?? []).map((row: any) => ({
        id: row.id, title: row.title, createdAt: row.created_at, kind: row.kind ?? 'info',
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

    let treeIW: any = null;
    treeTags.forEach(tag => {
      if (!tag.latitude || !tag.longitude) return;
      const pos = { lat: tag.latitude, lng: tag.longitude };
      const color = getVarietyColor(tag.variety);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="24" r="18" fill="${color}"/><rect x="28" y="36" width="8" height="18" fill="#8b5a2b"/></svg>`;
      const marker = new googleMaps.maps.Marker({ position: pos, map, title: tag.name || 'Tree', icon: { url: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`, scaledSize: new googleMaps.maps.Size(28, 28), anchor: new googleMaps.maps.Point(14, 28) } });
      marker.addListener('click', () => {
        handleViewTree(tag); if (treeIW) treeIW.close();
        treeIW = new googleMaps.maps.InfoWindow({ content: `<div style='min-width:140px'><div><strong>${tag.name || 'Tree'}</strong></div><div>Variety: ${tag.variety || '-'}</div></div>` });
        treeIW.open(map, marker);
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

  const handleViewTree = (tag: { latitude: number; longitude: number; fieldId: string }) => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.panTo({ lat: tag.latitude, lng: tag.longitude }); mapInstanceRef.current.setZoom(18); setSelectedFieldId(tag.fieldId);
  };

  const totalTrees = treeTags.length;

  const stats = [
    { title: 'Total Fields', value: fields.length,  icon: '🌿', color: 'from-emerald-500 to-green-400',   delay: 'dash-d0' },
    { title: 'Total Trees',  value: totalTrees,       icon: '🌳', color: 'from-teal-500 to-emerald-400',   delay: 'dash-d1' },
    { title: 'Active Alerts',value: 0,                icon: '⚠️', color: 'from-orange-400 to-amber-400',   delay: 'dash-d2' },
    { title: 'Temperature',  value: weatherLoading ? '…' : (weather ? `${weather.temperature}°C` : (weatherError || 'N/A')), icon: '🌡️', color: 'from-violet-500 to-purple-400', delay: 'dash-d3' },
  ];

  const ragColor = {
    green:  { ring: 'ring-2 ring-emerald-400', bg: 'bg-emerald-50',  text: 'text-emerald-500' },
    yellow: { ring: 'ring-2 ring-amber-400',   bg: 'bg-amber-50',   text: 'text-amber-500' },
    red:    { ring: 'ring-2 ring-red-400',      bg: 'bg-red-50',     text: 'text-red-500' },
    gray:   { ring: 'ring-2 ring-gray-300',     bg: 'bg-gray-50',    text: 'text-gray-400' },
  };

  /* ─── Smart action priority icon ─── */
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

      <div className="dash-page-bg space-y-8 pb-12 px-0">

        {/* ══════════════════════════════════════════════
            HERO HEADER — identical to SkuastAdvisory
        ══════════════════════════════════════════════ */}
        <div className="dash-fade-down dash-d0 relative overflow-hidden rounded-3xl dash-header-banner shadow-2xl mx-0">
          {/* Decorative blobs */}
          <div className="absolute -top-10 -left-10 w-52 h-52 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-white/3 pointer-events-none blur-2xl" />

          <div className="relative px-8 py-10 flex flex-col items-center text-center gap-4">
            {/* Live badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full text-emerald-100 text-xs font-semibold tracking-wide">
              <span className="relative inline-block w-2 h-2 rounded-full bg-emerald-300 dash-pulse" />
              Season 2026 · Live
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-white drop-shadow-lg tracking-tight leading-tight">
              <span className="dash-leaf">🌿</span>{' '}
              Orchard Dashboard
            </h1>

            <p className="text-emerald-100 text-sm font-medium">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            {weather && (
              <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white/15 backdrop-blur-sm border border-white/25 rounded-2xl text-white text-sm font-semibold">
                <span className="text-2xl">{getAnimatedIcon(weather.weathercode)}</span>
                <span>{weather.temperature}°C</span>
                <span className="w-px h-4 bg-white/30" />
                <span className="text-emerald-100 font-normal">Current conditions</span>
              </div>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            STAT CARDS — 4 glass pills
        ══════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div
              key={i}
              className={`dash-scale-in ${s.delay} dash-stat-card rounded-2xl p-5 flex flex-col items-center text-center`}
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center text-2xl shadow-md mb-3`}>
                {s.icon}
              </div>
              <p className="text-3xl font-extrabold text-gray-900 tabular-nums">{s.value}</p>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-1">{s.title}</span>
            </div>
          ))}
        </div>

        {/* ══════════════════════════════════════════════
            HEALTH RAG MATRIX
        ══════════════════════════════════════════════ */}
        <div className="dash-fade-up dash-d2 dash-glass-card rounded-2xl p-6">
          <div className="flex flex-col items-center text-center mb-6 gap-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-emerald-700 text-xs font-semibold">
              🔬 Health RAG Matrix
            </div>
            <p className="text-xs text-gray-400 mt-1">Real-time soil, water & pest status</p>
          </div>

          <div className="flex items-center justify-around">
            {[
              { label: 'Soil',  status: soilStatus,  tooltip: soilTooltip,  icon: { green: CheckCircle, yellow: AlertCircle, red: XCircle, gray: HelpCircle }, emoji: '🌱' },
              { label: 'Water', status: waterStatus, tooltip: waterTooltip, icon: { green: Droplet, yellow: Droplet, red: Droplet, gray: Droplet }, emoji: '💧' },
              { label: 'Pest',  status: pestStatus,  tooltip: pestTooltip,  icon: { green: Bug, yellow: Bug, red: Bug, gray: Bug }, emoji: '🐛' },
            ].map(({ label, status, tooltip, icon, emoji }) => {
              const Icon = icon[status];
              const rc = ragColor[status];
              return (
                <div key={label} className="flex flex-col items-center gap-2">
                  <div
                    className={`dash-rag-orb w-16 h-16 rounded-full flex items-center justify-center shadow-md ${rc.ring} ${rc.bg} relative`}
                    title={tooltip}
                  >
                    <Icon className={`w-7 h-7 ${rc.text}`} />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-base">{emoji}</span>
                    <span className="text-sm font-semibold text-gray-700">{label}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 text-center max-w-24 leading-tight">{tooltip}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            MAP SECTION
        ══════════════════════════════════════════════ */}
        <div className="dash-fade-up dash-d3">
          <div className="dash-glass-card rounded-2xl p-6">
            <div className="flex flex-col items-center text-center mb-5 gap-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center shadow-md">
                <span className="text-2xl">🗺️</span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-green-700 to-emerald-500 bg-clip-text text-transparent">
                Orchard Map Overview
              </h2>
              <p className="text-sm text-gray-400">All saved fields and tree locations</p>
              <Button onClick={() => navigate('/fields')} size="sm" variant="outline" className="mt-1">
                <MapPin className="w-4 h-4 mr-2" />View All Fields
              </Button>
            </div>

            {fieldsError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{fieldsError}</div>
            )}

            {loadingFields ? (
              <div className="w-full h-80 rounded-2xl bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Loading fields…</p>
                </div>
              </div>
            ) : fields.length === 0 ? (
              <div className="w-full h-80 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl dash-float mb-4">🌳</div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-1">No Orchards Mapped Yet</h3>
                  <p className="text-sm text-gray-400 mb-4">Your saved orchards will appear here on the map</p>
                  <Button onClick={() => navigate('/fields')} size="sm">
                    <MapPin className="w-4 h-4 mr-2" />Create Your First Orchard
                  </Button>
                </div>
              </div>
            ) : (
              <div
                ref={mapRef}
                className="w-full rounded-2xl border-2 border-green-400 bg-gray-100 shadow-lg"
                style={{ height: '440px' }}
              />
            )}
          </div>

          {/* ── Saved Fields chips ── */}
          {fields.length > 0 && (
            <div className="mt-4 space-y-3">
              <h3 className="text-sm font-bold text-gray-600 uppercase tracking-widest pb-1 border-b border-gray-100">Saved Fields</h3>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {fields.map((field, fi) => {
                  const orchardType = field.details && 'orchardType' in field.details ? field.details.orchardType : '—';
                  const varietyTrees = field.details && Array.isArray(field.details.varietyTrees) ? field.details.varietyTrees : [];
                  return (
                    <div
                      key={field.id}
                      className={`dash-field-card dash-scale-in shrink-0 min-w-52 p-4 rounded-2xl cursor-pointer ${selectedFieldId === field.id ? 'border-green-500 bg-green-50/80 shadow-md' : ''}`}
                      style={{ animationDelay: `${fi * 0.07}s` }}
                      onClick={() => handleViewField(field)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 text-sm">{field.name}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getHealthStatusColor(field.healthStatus)}`}>
                          {field.healthStatus}
                        </span>
                      </div>
                      <div className="space-y-1 text-xs text-gray-500">
                        <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{field.location}</div>
                        <div className="flex items-center justify-between">
                          <span>{(typeof field.mapAreaKanal === 'number' ? field.mapAreaKanal : (typeof field.areaKanal === 'number' ? field.areaKanal : field.area ?? '—'))} kanal</span>
                          <span className="text-gray-400">{field.cropStage}</span>
                        </div>
                        {orchardType !== '—' && <div className="font-medium text-green-700">{orchardType}</div>}
                        {varietyTrees.length > 0 && (
                          <ul className="mt-1 space-y-0.5">
                            {varietyTrees.map((v: any, i: number) => (
                              <li key={i} className="text-green-700">{v.variety} <span className="text-gray-400">({v.totalTrees})</span></li>
                            ))}
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
          {(selectedFieldId ? treeTags.filter(t => t.fieldId === selectedFieldId) : treeTags).length > 0 && (
            <div className="mt-4 space-y-3">
              <h3 className="text-sm font-bold text-gray-600 uppercase tracking-widest pb-1 border-b border-gray-100">Tagged Trees</h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {(selectedFieldId ? treeTags.filter(t => t.fieldId === selectedFieldId) : treeTags).map(tag => (
                  <div
                    key={tag.id}
                    className="dash-field-card shrink-0 min-w-36 p-2.5 rounded-xl cursor-pointer"
                    onClick={() => handleViewTree(tag)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: getVarietyColor(tag.variety) }} />
                      <div>
                        <p className="text-xs font-semibold text-gray-900">{tag.name || 'Tree'}</p>
                        <p className="text-xs text-gray-400">{tag.variety || 'Unknown variety'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════
            7-DAY WEATHER FORECAST
        ══════════════════════════════════════════════ */}
        {weatherLoading && (
          <div className="dash-glass-card rounded-2xl p-8 flex items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading weather forecast…</p>
          </div>
        )}

        {!weatherLoading && weatherError && (
          <div className="dash-glass-card rounded-2xl p-5 border border-red-200 bg-red-50/60">
            <p className="text-sm text-red-600 text-center">⚠️ {weatherError}</p>
          </div>
        )}

        {forecast.length > 0 && (
          <div className="dash-fade-up dash-d4 dash-glass-card rounded-2xl p-6">
            <div className="flex flex-col items-center text-center mb-6 gap-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-400 flex items-center justify-center shadow-md">
                <span className="text-2xl">🌤️</span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-700 to-violet-500 bg-clip-text text-transparent">
                7-Day Forecast
              </h2>
              <p className="text-xs text-gray-400">Spray window & irrigation advisory</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 mb-6">
              {forecast.map((day, i) => {
                const spray = getSprayBadge(day);
                return (
                  <div
                    key={i}
                    className="dash-weather dash-weather-card flex flex-col items-center p-3 rounded-2xl"
                    style={{ animationDelay: `${i * 0.06}s` }}
                  >
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}
                    </span>
                    <span className="text-4xl my-2">{getAnimatedIcon(day.weathercode)}</span>
                    <span className="text-sm font-bold text-gray-900">{day.tempMax}° / {day.tempMin}°</span>
                    {day.feelsLikeMax !== undefined && (
                      <span className="text-[10px] text-gray-400">Feels {day.feelsLikeMax}°</span>
                    )}

                    {typeof day.precipitationProb === 'number' && (
                      <div className="w-full mt-2">
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-1.5 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full transition-all"
                            style={{ width: `${day.precipitationProb}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-center text-gray-400 mt-0.5">{day.precipitationProb}% rain</p>
                      </div>
                    )}

                    <p className="text-[10px] text-gray-400 mt-1">💨 {day.windSpeed} km/h</p>
                    <p className="text-[10px] text-gray-400">UV {day.uvIndex ?? '—'}</p>

                    <div className={`mt-2 px-2 py-0.5 text-[9px] rounded-full font-semibold text-center leading-tight ${spray.color}`}>
                      {spray.text}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Irrigation banner + weather alert pills */}
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="dash-pulse-soft flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold">
                {getIrrigationAdvice()}
              </div>
              <div className="flex flex-wrap gap-2">
                {forecast.some(isHeavyRain) && (
                  <span className="px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">🌧️ Heavy rain expected</span>
                )}
                {forecast.some(isFrostRisk) && (
                  <span className="px-3 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold">❄️ Frost risk</span>
                )}
                {forecast.some(isSpraySafeDay) && (
                  <span className="px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-semibold">🌿 Spray-safe day</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            SMART ACTIONS — below 7-day forecast
        ══════════════════════════════════════════════ */}
        <div className="dash-fade-up dash-d5 dash-glass-card rounded-2xl p-6">
          {/* Section header with animated gradient badge */}
          <div className="flex flex-col items-center text-center mb-6 gap-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-green-400 rounded-full text-white text-xs font-bold shadow-md">
              <span className="relative inline-block w-2 h-2 rounded-full bg-white dash-pulse" />
              AI-Powered
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-green-700 to-emerald-500 bg-clip-text text-transparent">
              Smart Action Center
            </h2>
            <p className="text-xs text-gray-400">SKUAST 2026 advisory — weather-filtered recommendations</p>
          </div>

          {smartActions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-3 text-3xl">
                ✅
              </div>
              <p className="text-base font-semibold text-gray-700">All Clear</p>
              <p className="text-sm text-gray-400 mt-1">No prioritized actions right now</p>
            </div>
          ) : (
            <div className="space-y-3">
              {smartActions.map((action, idx) => (
                <div
                  key={idx}
                  className={`dash-action-row dash-slide-r dash-d${idx + 1} flex items-start gap-4 p-4 rounded-2xl border`}
                  style={{
                    background: 'rgba(240,253,244,0.8)',
                    borderColor: '#bbf7d0',
                  }}
                >
                  {/* Priority icon badge */}
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-400 flex items-center justify-center text-xl shadow-md shrink-0">
                    {getActionIcon(action)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <p className="text-sm font-bold text-gray-900">{action.name}</p>
                      {action.target_pest && (
                        <span className="shrink-0 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                          {action.target_pest}
                        </span>
                      )}
                    </div>
                    {action.notes && (
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{action.notes}</p>
                    )}
                    {action.dose && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="px-2 py-0.5 rounded-full bg-white border border-gray-200 text-[10px] font-semibold text-gray-600 shadow-sm">
                          💊 Dose: {action.dose}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Weather window indicator */}
                  <div className="shrink-0 flex flex-col items-center gap-1">
                    {forecast[0] && (() => {
                      const spray = getSprayBadge(forecast[0]);
                      return (
                        <div
                          className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold"
                          style={{ borderColor: spray.dot, color: spray.dot, background: `${spray.dot}15` }}
                          title={spray.text}
                        >
                          {getSprayWindowStatus(forecast[0]) === 'GREEN' ? '✓' : getSprayWindowStatus(forecast[0]) === 'RED' ? '✗' : '!'}
                        </div>
                      );
                    })()}
                    <span className="text-[8px] text-gray-400 text-center leading-tight max-w-12">window</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════
            PROFILE COMPLETION
        ══════════════════════════════════════════════ */}
        {profileCompletion < 100 && (
          <div className="dash-fade-up dash-d5 dash-glass-card rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center shadow-md shrink-0">
                  <span className="text-2xl">👤</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-bold text-gray-900">Complete Your Profile</h3>
                    <span className="px-2.5 py-0.5 bg-gradient-to-r from-green-500 to-emerald-400 text-white text-xs font-bold rounded-full shadow-sm">
                      {profileCompletion}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">Add more information to unlock personalized recommendations.</p>
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-400 h-2 rounded-full transition-all duration-700"
                      style={{ width: `${profileCompletion}%` }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {[
                      { label: 'Name',      done: !!profileUser.name },
                      { label: 'Email',     done: !!profileUser.email },
                      { label: 'Phone',     done: !!profileUser.phone },
                      { label: 'Farm Name', done: !!profileUser.farmName },
                      { label: 'Photo',     done: !!profileUser.avatar },
                      { label: 'Khasra',    done: !!profileUser.khasraNumber },
                      { label: 'Khata',     done: !!profileUser.khataNumber },
                    ].map(({ label, done }) => (
                      <span key={label} className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${done ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                        {done ? '✓' : '○'} {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <Button onClick={() => navigate('/profile')} size="sm" className="shrink-0">Complete Profile</Button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            CHARTS PLACEHOLDER
        ══════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[
            { title: 'Production Overview', icon: '📈', gradient: 'from-emerald-500 to-green-400', delay: 'dash-d5' },
            { title: 'Growth Analytics',    icon: '🌳', gradient: 'from-teal-500 to-emerald-400',  delay: 'dash-d6' },
          ].map(({ title, icon, gradient, delay }, i) => (
            <div key={i} className={`dash-fade-up ${delay} dash-glass-card rounded-2xl p-6`}>
              <div className="flex flex-col items-center text-center mb-4 gap-2">
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-xl shadow-md`}>
                  {icon}
                </div>
                <h3 className="text-lg font-extrabold text-gray-900">{title}</h3>
              </div>
              <div className="h-44 bg-gray-50 rounded-xl flex items-center justify-center border border-dashed border-gray-200">
                <div className="text-center">
                  <div className="text-4xl dash-float mb-2">{icon}</div>
                  <p className="text-sm text-gray-400">Visualization coming soon</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ══════════════════════════════════════════════
            RECENT ACTIVITY
        ══════════════════════════════════════════════ */}
        <div className="dash-fade-up dash-d6 dash-glass-card rounded-2xl p-6">
          <div className="flex flex-col items-center text-center mb-6 gap-1">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-400 flex items-center justify-center shadow-md text-xl">
              📋
            </div>
            <h3 className="text-xl font-extrabold text-gray-900 mt-2">Recent Activity</h3>
          </div>

          {activityError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{activityError}</div>
          )}

          {activities.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
              <div className="text-4xl dash-float mb-2">📅</div>
              <p className="text-sm text-gray-400">No recent activity yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activities.map((activity, ai) => (
                <div
                  key={activity.id}
                  className="dash-activity-row dash-slide-r flex items-center gap-4 p-3.5 rounded-xl border border-transparent"
                  style={{
                    animationDelay: `${ai * 0.1}s`,
                    background: getActivityBg(activity.kind),
                  }}
                >
                  <div
                    className="w-3 h-3 rounded-full shrink-0 relative dash-pulse"
                    style={{ background: getActivityDotColor(activity.kind) }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{activity.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(activity.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  );
};

export default Dashboard;
