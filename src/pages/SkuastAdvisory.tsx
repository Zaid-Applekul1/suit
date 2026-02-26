import React, { useState } from 'react';
import { skaustSprayTemplate2026Chemicals, skaustSprayTemplate2026Programs, skaustSprayTemplate2026ProgramItems } from '../data/skaustSprayTemplate2026';
import { skaustActivityCalendar, skaustMonthNames } from '../data/skaustActivityCalendar';

/* ─── Animation & Style Definitions ─── */
const SKUAST_STYLES = `
@keyframes fadeUp {
  from { opacity:0; transform:translateY(24px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes fadeDown {
  from { opacity:0; transform:translateY(-18px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes scaleIn {
  from { opacity:0; transform:scale(0.90); }
  to   { opacity:1; transform:scale(1); }
}
@keyframes slideRight {
  from { opacity:0; transform:translateX(-20px); }
  to   { opacity:1; transform:translateX(0); }
}
@keyframes slideLeft {
  from { opacity:0; transform:translateX(20px); }
  to   { opacity:1; transform:translateX(0); }
}
@keyframes glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.25); }
  50%       { box-shadow: 0 0 0 10px rgba(34,197,94,0); }
}
@keyframes pulse-ring {
  0%   { transform:scale(1);   opacity:0.8; }
  100% { transform:scale(1.6); opacity:0; }
}
@keyframes shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
@keyframes leafSway {
  0%, 100% { transform: rotate(-4deg); }
  50%       { transform: rotate(4deg); }
}
@keyframes headerGradient {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.sk-fade-up    { animation: fadeUp     0.6s cubic-bezier(.22,1,.36,1) both; }
.sk-fade-down  { animation: fadeDown   0.55s cubic-bezier(.22,1,.36,1) both; }
.sk-scale-in   { animation: scaleIn    0.5s  cubic-bezier(.22,1,.36,1) both; }
.sk-slide-r    { animation: slideRight 0.5s  cubic-bezier(.22,1,.36,1) both; }
.sk-slide-l    { animation: slideLeft  0.5s  cubic-bezier(.22,1,.36,1) both; }
.sk-glow       { animation: glow 2.8s ease-in-out infinite; }

.sk-d0  { animation-delay:0s;    }
.sk-d1  { animation-delay:.08s;  }
.sk-d2  { animation-delay:.16s;  }
.sk-d3  { animation-delay:.24s;  }
.sk-d4  { animation-delay:.32s;  }
.sk-d5  { animation-delay:.40s;  }
.sk-d6  { animation-delay:.48s;  }
.sk-d7  { animation-delay:.56s;  }

/* Animated gradient header banner */
.sk-header-banner {
  background: linear-gradient(135deg, #064e3b, #065f46, #047857, #059669, #10b981, #34d399, #6ee7b7, #10b981, #047857);
  background-size: 300% 300%;
  animation: headerGradient 8s ease infinite;
}

/* Month pill hover effects */
.month-pill {
  transition: transform .2s ease, background .2s ease, box-shadow .2s ease, color .2s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  white-space: nowrap;
}
.month-pill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
  opacity: 0;
  transition: opacity .2s ease;
}
.month-pill:hover::after { opacity: 1; }
.month-pill:hover {
  transform: translateY(-3px) scale(1.06);
  box-shadow: 0 8px 24px rgba(34,197,94,0.22);
}
.month-pill.active {
  background: linear-gradient(135deg, #15803d, #16a34a);
  color: white;
  box-shadow: 0 6px 18px rgba(22,163,74,0.45);
}

/* Card hover */
.sk-card {
  transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease;
}
.sk-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 36px rgba(34,197,94,0.14);
  border-color: #86efac;
}

/* Chemical row */
.chem-row {
  transition: background .18s ease, transform .18s ease, padding-left .18s ease;
}
.chem-row:hover {
  background: linear-gradient(90deg, #f0fdf4, #dcfce7);
  transform: translateX(4px);
  padding-left: 1rem;
}

/* Table row */
.sk-table-row {
  transition: background .15s ease;
}
.sk-table-row:hover { background: #f0fdf4 !important; }

/* Activity card */
.activity-card {
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
  cursor: pointer;
}
.activity-card:hover {
  transform: translateY(-4px) scale(1.01);
  box-shadow: 0 10px 30px rgba(34,197,94,0.15);
}

/* Pulse indicator */
.sk-pulse::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(34,197,94,0.5);
  animation: pulse-ring 1.6s cubic-bezier(.215,.61,.355,1) infinite;
}

/* Leaf icon animation */
.sk-leaf {
  display: inline-block;
  animation: leafSway 3s ease-in-out infinite;
  transform-origin: bottom center;
}

/* Shimmer loading bar */
.sk-shimmer {
  background: linear-gradient(90deg, #f0fdf4 25%, #dcfce7 50%, #f0fdf4 75%);
  background-size: 400px 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}

/* ─── Responsive additions ─── */

/* ---- Phone (< 640px) ---- */
@media (max-width: 639px) {
  .sk-header-banner {
    border-radius: 1.25rem;
  }
  .month-pill {
    font-size: 0.68rem;
    padding: 0.3rem 0.65rem;
  }
  .sk-table-cell-sm {
    padding: 0.45rem 0.6rem;
  }
  /* Tighten card inner padding */
  .sk-card-inner-sm {
    padding: 1rem;
  }
  /* Hero title compact */
  .sk-hero-title-sm {
    font-size: 1.8rem !important;
    line-height: 1.15;
  }
  /* Table min-width shrunk to fit phones */
  .sk-table-min-w {
    min-width: 360px;
  }
}

/* ---- iPad portrait (640px – 767px) ---- */
@media (min-width: 640px) and (max-width: 767px) {
  .month-pill {
    font-size: 0.72rem;
    padding: 0.32rem 0.7rem;
  }
}

/* ---- iPad landscape / small laptops (768px – 1023px) ---- */
@media (min-width: 768px) and (max-width: 1023px) {
  /* Spray programs: 2-col on iPad */
  .sk-programs-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
  /* Annual calendar: 3-col on iPad landscape */
  .sk-calendar-grid {
    grid-template-columns: repeat(3, 1fr) !important;
  }
}

/* Ensure touch targets are always at least 44px tall */
.month-pill {
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
`;

const SkuastAdvisory: React.FC = () => {
  const now = new Date();
  const currentMonthIdx = now.getMonth();
  const [activeMonthIdx, setActiveMonthIdx] = useState(currentMonthIdx);

  const activeMonth     = skaustActivityCalendar.find(m => m.month === activeMonthIdx + 1);
  const activeMonthName = skaustMonthNames[activeMonthIdx];

  const monthPrograms = skaustSprayTemplate2026Programs.filter(p =>
    p.name.toLowerCase().includes(activeMonthName.toLowerCase())
  );

  return (
    <>
      <style>{SKUAST_STYLES}</style>
      {/* Full-width responsive wrapper — no fixed widths, full bleed on mobile */}
      <div className="w-full max-w-screen-xl mx-auto space-y-5 sm:space-y-6 lg:space-y-8 pb-14 px-0">

        {/* ── Hero banner ── */}
        <div className="sk-fade-down sk-d0 relative overflow-hidden rounded-2xl sm:rounded-3xl sk-header-banner shadow-2xl">
          {/* Decorative circles — hidden on phone to save space */}
          <div className="hidden sm:block absolute -top-10 -left-10 w-52 h-52 rounded-full bg-white/5 pointer-events-none" />
          <div className="hidden sm:block absolute -bottom-12 -right-12 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
          <div className="hidden md:block absolute top-6 right-24 w-20 h-20 rounded-full bg-white/8 pointer-events-none" />

          <div className="relative px-4 sm:px-8 lg:px-12 py-7 sm:py-10 flex flex-col items-center text-center gap-3 sm:gap-4">
            {/* Badge */}
            <div className="sk-scale-in sk-d1 inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full text-[11px] sm:text-xs font-bold text-white/90 tracking-widest uppercase">
              <span className="relative inline-block w-2 h-2 rounded-full bg-emerald-300 sk-pulse" />
              Season 2026 · Live
            </div>

            {/* Title */}
            <h1 className="sk-fade-up sk-d2 sk-hero-title-sm text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white drop-shadow-xl leading-tight">
              <span className="sk-leaf"></span>{' '}
              SKUAST Advisory
            </h1>

            {/* Subtitle */}
            <p className="sk-fade-up sk-d3 text-xs sm:text-sm md:text-base text-emerald-100/90 font-medium max-w-sm sm:max-w-xl">
              Spray programs &amp; activity calendar · Tailored for Kashmir Apple Orchards
            </p>

            {/* Current month chip */}
            <div className="sk-scale-in sk-d4 flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-white shadow-lg">
              <svg className="w-4 h-4 text-emerald-300 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              {skaustMonthNames[currentMonthIdx]} is the active month
            </div>
          </div>
        </div>

        {/* ── Month selector ── */}
        <div className="sk-fade-up sk-d1">
          <div className="bg-white border border-gray-100 rounded-2xl p-3 sm:p-4 md:p-5 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 text-center">Browse by Month</p>
            {/* Horizontal-scroll on phone; wraps naturally on sm+ */}
            <div className="overflow-x-auto -mx-1 px-1 pb-1">
              <div className="flex flex-nowrap sm:flex-wrap gap-1.5 sm:gap-2 sm:justify-center">
                {skaustMonthNames.map((name, idx) => (
                  <button
                    key={idx}
                    className={`month-pill text-xs font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border ${
                      activeMonthIdx === idx
                        ? 'active border-green-600'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-700'
                    } ${idx === currentMonthIdx && activeMonthIdx !== idx ? 'border-green-300 text-green-700 bg-green-50' : ''}`}
                    onClick={() => setActiveMonthIdx(idx)}
                  >
                    {name.slice(0, 3)}
                    {idx === currentMonthIdx && (
                      <span className="ml-1 sm:ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 align-middle" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Current Month Advisory ── */}
        {activeMonth && (
          <div className="sk-scale-in sk-d2">
            <div className="sk-card bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 md:p-6 shadow-sm">
              {/* Card header */}
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5 md:mb-6">
                <div className="sk-glow relative w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shrink-0 shadow-lg shadow-green-200">
                  <span className="text-white text-base sm:text-lg md:text-xl font-extrabold">{activeMonthName.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base sm:text-lg md:text-xl font-extrabold text-gray-900 truncate">{activeMonthName} Advisory</h2>
                  <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">Recommended orchard activities for this month</p>
                </div>
                {activeMonthIdx === currentMonthIdx && (
                  <span className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 text-xs font-bold rounded-full border border-green-200 shrink-0">
                    ✦ Current
                  </span>
                )}
              </div>

              {/* Activity list */}
              <ul className="space-y-2 sm:space-y-2.5">
                {activeMonth.activities.map((act, i) => (
                  <li
                    key={i}
                    className="sk-slide-r flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 md:p-3.5 rounded-xl bg-gradient-to-r from-gray-50 to-green-50/30 border border-gray-100 hover:border-green-200 transition-colors"
                    style={{ animationDelay: `${i * 0.07}s` }}
                  >
                    <span className="w-2 h-2 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 mt-1.5 shrink-0 shadow shadow-green-200" />
                    <span className="text-xs sm:text-sm text-gray-700 leading-relaxed">{act}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ── Spray Programs Grid ── */}
        {monthPrograms.length > 0 && (
          <div className="sk-fade-up sk-d3">
            <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 md:p-6 shadow-sm">
              <div className="text-center mb-4 sm:mb-5 md:mb-6">
                <h2 className="text-base sm:text-lg font-extrabold text-gray-900">Recommended Spray Treatments</h2>
                <p className="text-xs text-gray-400 mt-1">For <span className="font-semibold text-green-600">{activeMonthName}</span> · based on SKUAST-K schedule</p>
              </div>
              {/* 1-col → 2-col (iPad) → 2-col (desktop) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {monthPrograms.map((prog, pi) => {
                  const items = skaustSprayTemplate2026ProgramItems.find(p => p.programName === prog.name)?.items || [];
                  return (
                    <div
                      key={pi}
                      className="sk-card sk-scale-in border border-gray-100 rounded-2xl p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-green-50/20"
                      style={{ animationDelay: `${pi * 0.09}s` }}
                    >
                      <div className="flex items-start gap-2.5 sm:gap-3 mb-3">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shrink-0 shadow shadow-green-200">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">{prog.name}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200 rounded-full font-semibold inline-block">
                              {prog.stage}
                            </span>
                          </div>
                        </div>
                      </div>
                      {items.length > 0 ? (
                        <ul className="mt-1 space-y-1.5">
                          {items.map((item, j) => (
                            <li key={j} className="chem-row flex items-center gap-2 text-xs py-1.5 sm:py-2 px-2 sm:px-2.5 rounded-xl bg-white border border-gray-100">
                              <span className="w-2 h-2 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 shrink-0" />
                              <span className="font-semibold text-gray-800 truncate">{item.chemicalName}</span>
                              <span className="ml-auto text-gray-400 font-medium shrink-0">{item.dose_rate} {item.dose_unit}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-gray-400 mt-2 text-center italic">No chemicals listed</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── All Spray Programs Table ── */}
        <div className="sk-fade-up sk-d4">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 md:p-6 shadow-sm">
            <div className="text-center mb-4 sm:mb-5 md:mb-6">
              <h2 className="text-base sm:text-lg font-extrabold text-gray-900">All Spray Programs</h2>
              <p className="text-xs text-gray-400 mt-1">Complete SKUAST-K schedule by growth stage</p>
            </div>
            {/* Scrollable on any narrow screen */}
            <div className="overflow-x-auto -mx-1 rounded-2xl border border-gray-100">
              <table className="w-full text-xs sm:text-sm" style={{ minWidth: '360px' }}>
                <thead>
                  <tr className="bg-gradient-to-r from-green-600 to-emerald-600">
                    <th className="px-3 sm:px-5 py-3 text-left text-xs font-bold text-white uppercase tracking-widest whitespace-nowrap">Program</th>
                    <th className="px-3 sm:px-5 py-3 text-left text-xs font-bold text-white uppercase tracking-widest whitespace-nowrap">Stage</th>
                    <th className="px-3 sm:px-5 py-3 text-left text-xs font-bold text-white uppercase tracking-widest">Chemicals</th>
                  </tr>
                </thead>
                <tbody>
                  {skaustSprayTemplate2026Programs.map((prog, i) => {
                    const items = skaustSprayTemplate2026ProgramItems.find(p => p.programName === prog.name)?.items || [];
                    return (
                      <tr
                        key={i}
                        className={`sk-table-row border-b border-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}
                      >
                        <td className="px-3 sm:px-5 py-2.5 sm:py-3.5 font-bold text-gray-900 align-top whitespace-nowrap">{prog.name}</td>
                        <td className="px-3 sm:px-5 py-2.5 sm:py-3.5 align-top">
                          <div className="flex flex-wrap gap-1">
                            <span className="px-2 sm:px-2.5 py-1 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200 rounded-full text-xs font-bold whitespace-nowrap">
                              {prog.stage}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-5 py-2.5 sm:py-3.5">
                          {items.length === 0 ? (
                            <span className="text-gray-400 text-xs italic">No chemicals listed</span>
                          ) : (
                            <ul className="space-y-1 sm:space-y-1.5">
                              {items.map((item, j) => (
                                <li key={j} className="flex items-center gap-2 text-xs flex-wrap">
                                  <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shrink-0" />
                                  <span className="font-semibold text-gray-700">{item.chemicalName}</span>
                                  <span className="text-gray-400">({item.dose_rate} {item.dose_unit})</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Annual Activity Calendar ── */}
        <div className="sk-fade-up sk-d5">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 md:p-6 shadow-sm">
            <div className="text-center mb-4 sm:mb-5 md:mb-6">
              <h2 className="text-base sm:text-lg font-extrabold text-gray-900">Annual Activity Calendar</h2>
              <p className="text-xs text-gray-400 mt-1">Month-by-month orchard management guide — click a month to view</p>
            </div>
            {/* 1 col → 2 col (sm) → 3 col (md/iPad landscape) → 4 col (xl) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {skaustActivityCalendar.map((monthData, mi) => {
                const mName = skaustMonthNames[monthData.month - 1];
                const isCurrent = monthData.month - 1 === currentMonthIdx;
                const isActive  = monthData.month - 1 === activeMonthIdx;
                return (
                  <div
                    key={mi}
                    className={`activity-card sk-scale-in rounded-2xl border-2 p-3 sm:p-4 ${
                      isActive
                        ? 'border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 shadow-md shadow-green-100'
                        : isCurrent
                          ? 'border-green-200 bg-green-50/50'
                          : 'border-gray-100 bg-gray-50/50 hover:border-green-200'
                    }`}
                    style={{ animationDelay: `${mi * 0.04}s` }}
                    onClick={() => setActiveMonthIdx(monthData.month - 1)}
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5 mb-2.5 sm:mb-3">
                      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-xs font-extrabold shadow-sm shrink-0 ${
                        isActive
                          ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-green-200'
                          : isCurrent
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-200 text-gray-600'
                      }`}>
                        {mName.slice(0, 1)}
                      </div>
                      <span className={`text-xs sm:text-sm font-extrabold ${isActive ? 'text-green-800' : 'text-gray-900'}`}>{mName}</span>
                      {isCurrent && (
                        <span className="ml-auto text-[10px] px-2 py-0.5 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-full font-bold border border-green-200 shrink-0">
                          Now
                        </span>
                      )}
                    </div>
                    <ul className="space-y-1 sm:space-y-1.5">
                      {monthData.activities.slice(0, 3).map((act, ai) => (
                        <li key={ai} className="flex items-start gap-1.5 sm:gap-2 text-xs text-gray-600 leading-snug">
                          <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 mt-1 shrink-0" />
                          {act}
                        </li>
                      ))}
                      {monthData.activities.length > 3 && (
                        <li className="text-xs text-green-600 font-semibold pl-3 sm:pl-3.5 mt-1">
                          +{monthData.activities.length - 3} more activities…
                        </li>
                      )}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </>
  );
};

export default SkuastAdvisory;
