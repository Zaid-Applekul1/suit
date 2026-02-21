import React, { useState } from 'react';
import { skaustSprayTemplate2026Chemicals, skaustSprayTemplate2026Programs, skaustSprayTemplate2026ProgramItems } from '../data/skaustSprayTemplate2026';
import { skaustActivityCalendar, skaustMonthNames } from '../data/skaustActivityCalendar';

/* ─── Animation styles ─── */
const SKUAST_STYLES = `
@keyframes fadeUp {
  from { opacity:0; transform:translateY(18px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes scaleIn {
  from { opacity:0; transform:scale(0.93); }
  to   { opacity:1; transform:scale(1); }
}
@keyframes slideRight {
  from { opacity:0; transform:translateX(-16px); }
  to   { opacity:1; transform:translateX(0); }
}
@keyframes glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.18); }
  50%       { box-shadow: 0 0 0 8px rgba(34,197,94,0); }
}
.sk-fade-up   { animation: fadeUp    0.52s cubic-bezier(.22,1,.36,1) both; }
.sk-scale-in  { animation: scaleIn   0.4s  cubic-bezier(.22,1,.36,1) both; }
.sk-slide-r   { animation: slideRight 0.45s cubic-bezier(.22,1,.36,1) both; }
.sk-glow      { animation: glow 2.5s ease-in-out infinite; }
.sk-d0  { animation-delay:0s;    }
.sk-d1  { animation-delay:.07s;  }
.sk-d2  { animation-delay:.14s;  }
.sk-d3  { animation-delay:.21s;  }
.sk-d4  { animation-delay:.28s;  }
.sk-d5  { animation-delay:.35s;  }
.sk-d6  { animation-delay:.42s;  }
.sk-d7  { animation-delay:.49s;  }
.month-pill {
  transition: transform .18s ease, background .18s ease, box-shadow .18s ease;
  cursor: pointer;
}
.month-pill:hover {
  transform: translateY(-2px) scale(1.04);
  box-shadow: 0 6px 20px rgba(34,197,94,0.15);
}
.month-pill.active {
  background: #16a34a;
  color: white;
  box-shadow: 0 4px 14px rgba(22,163,74,0.35);
}
.chem-row {
  transition: background .15s ease, transform .15s ease;
}
.chem-row:hover {
  background: #f0fdf4;
  transform: translateX(3px);
}
.prog-card {
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
}
.prog-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 28px rgba(34,197,94,0.12);
  border-color: #86efac;
}
`;

const SkuastAdvisory: React.FC = () => {
  const now = new Date();
  const currentMonthIdx = now.getMonth(); // 0-based
  const [activeMonthIdx, setActiveMonthIdx] = useState(currentMonthIdx);

  const activeMonth    = skaustActivityCalendar.find(m => m.month === activeMonthIdx + 1);
  const activeMonthName = skaustMonthNames[activeMonthIdx];

  const monthPrograms = skaustSprayTemplate2026Programs.filter(p =>
    p.name.toLowerCase().includes(activeMonthName.toLowerCase())
  );

  return (
    <>
      <style>{SKUAST_STYLES}</style>
      <div className="space-y-8 pb-10">

        {/* ── Header ── */}
        <div className="sk-fade-up sk-d0 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">SKUAST Advisory</h1>
            <p className="text-sm text-gray-400 mt-0.5">Spray programs & activity calendar · Season 2026</p>
          </div>
          <div className="px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-xs font-semibold text-green-700">
            {skaustMonthNames[currentMonthIdx]} Active
          </div>
        </div>

        {/* ── Month selector pills ── */}
        <div className="sk-fade-up sk-d1 flex flex-wrap gap-2">
          {skaustMonthNames.map((name, idx) => (
            <button
              key={idx}
              className={`month-pill text-xs font-semibold px-3 py-1.5 rounded-full border ${
                activeMonthIdx === idx
                  ? 'active border-green-600'
                  : 'bg-white border-gray-200 text-gray-600'
              } ${idx === currentMonthIdx && activeMonthIdx !== idx ? 'border-green-300 text-green-700' : ''}`}
              onClick={() => setActiveMonthIdx(idx)}
            >
              {name.slice(0, 3)}
            </button>
          ))}
        </div>

        {/* ── Current Month Advisory ── */}
        {activeMonth && (
          <div className="sk-scale-in sk-d2">
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="sk-glow w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center shrink-0">
                  <span className="text-white text-lg font-bold">{activeMonthName.charAt(0)}</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{activeMonthName} Advisory</h2>
                  <p className="text-xs text-gray-400">Recommended orchard activities</p>
                </div>
                {activeMonthIdx === currentMonthIdx && (
                  <span className="ml-auto px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200">Current Month</span>
                )}
              </div>
              <ul className="space-y-2">
                {activeMonth.activities.map((act, i) => (
                  <li key={i} className={`sk-slide-r flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100`} style={{ animationDelay: `${i * 0.07}s` }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                    <span className="text-sm text-gray-700">{act}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ── Recommended Spray Treatments for active month ── */}
        {monthPrograms.length > 0 && (
          <div className="sk-fade-up sk-d3">
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-gray-900 mb-1">Recommended Spray Treatments</h2>
              <p className="text-xs text-gray-400 mb-5">For {activeMonthName} · based on SKUAST-K schedule</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {monthPrograms.map((prog, pi) => {
                  const items = skaustSprayTemplate2026ProgramItems.find(p => p.programName === prog.name)?.items || [];
                  return (
                    <div key={pi} className={`prog-card sk-scale-in border border-gray-100 rounded-xl p-4 bg-gray-50`} style={{ animationDelay: `${pi * 0.08}s` }}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-bold text-gray-900">{prog.name}</p>
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 border border-green-200 rounded-full font-medium">{prog.stage}</span>
                        </div>
                      </div>
                      {items.length > 0 ? (
                        <ul className="mt-3 space-y-1.5">
                          {items.map((item, j) => (
                            <li key={j} className="chem-row flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                              <span className="font-medium text-gray-800">{item.chemicalName}</span>
                              <span className="ml-auto text-gray-400">{item.dose_rate} {item.dose_unit}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-gray-400 mt-2">No chemicals listed</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── All Spray Programs ── */}
        <div className="sk-fade-up sk-d4">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-1">All Spray Programs</h2>
            <p className="text-xs text-gray-400 mb-5">Complete SKUAST-K schedule by growth stage</p>
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-green-50 border-b border-green-100">
                    <th className="px-4 py-3 text-left text-xs font-bold text-green-800 uppercase tracking-wide">Program</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-green-800 uppercase tracking-wide">Stage</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-green-800 uppercase tracking-wide">Chemicals</th>
                  </tr>
                </thead>
                <tbody>
                  {skaustSprayTemplate2026Programs.map((prog, i) => {
                    const items = skaustSprayTemplate2026ProgramItems.find(p => p.programName === prog.name)?.items || [];
                    return (
                      <tr key={i} className={`border-b border-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <td className="px-4 py-3 font-semibold text-gray-900 align-top">{prog.name}</td>
                        <td className="px-4 py-3 align-top">
                          <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-medium">{prog.stage}</span>
                        </td>
                        <td className="px-4 py-3">
                          {items.length === 0 ? (
                            <span className="text-gray-400 text-xs">No chemicals listed</span>
                          ) : (
                            <ul className="space-y-1">
                              {items.map((item, j) => (
                                <li key={j} className="flex items-center gap-2 text-xs">
                                  <span className="w-1 h-1 rounded-full bg-green-400" />
                                  <span className="text-gray-700">{item.chemicalName}</span>
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

        {/* ── Full Activity Calendar ── */}
        <div className="sk-fade-up sk-d5">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-1">Annual Activity Calendar</h2>
            <p className="text-xs text-gray-400 mb-5">Month-by-month orchard management guide</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {skaustActivityCalendar.map((monthData, mi) => {
                const mName = skaustMonthNames[monthData.month - 1];
                const isCurrent = monthData.month - 1 === currentMonthIdx;
                return (
                  <div
                    key={mi}
                    className={`prog-card sk-scale-in rounded-xl border p-4 cursor-pointer ${isCurrent ? 'border-green-400 bg-green-50' : 'border-gray-100 bg-gray-50/50'}`}
                    style={{ animationDelay: `${mi * 0.04}s` }}
                    onClick={() => setActiveMonthIdx(monthData.month - 1)}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${isCurrent ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                        {mName.slice(0, 1)}
                      </div>
                      <span className="text-sm font-bold text-gray-900">{mName}</span>
                      {isCurrent && <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-semibold border border-green-200">Now</span>}
                    </div>
                    <ul className="space-y-1.5">
                      {monthData.activities.slice(0, 3).map((act, ai) => (
                        <li key={ai} className="flex items-start gap-1.5 text-xs text-gray-600">
                          <span className="w-1 h-1 rounded-full bg-green-400 mt-1.5 shrink-0" />
                          {act}
                        </li>
                      ))}
                      {monthData.activities.length > 3 && (
                        <li className="text-xs text-gray-400 pl-2.5">+{monthData.activities.length - 3} more…</li>
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
