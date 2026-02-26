import type { ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Fields from './pages/Fields';
import Profile from './pages/Profile';
import SkuastAdvisory from './pages/SkuastAdvisory';
import SoilTestAdvisory from './pages/SoilTestAdvisory';
import { useAuth } from './contexts/AuthContext';
import FinancialLedger from './pages/FinancialLedger';
import OrchardDoctor from './pages/OrchardDoctor';
import TreeScouting from './pages/TreeScouting';
import Calendar from './pages/Calendar';
import TeamManagement from './pages/TeamManagement';
import AcceptInvitation from './pages/AcceptInvitation';
import Pricing from './pages/Pricing';  
import PaymentPage from './pages/PaymentPage';


const RequireAuth = ({ children }: { children: ReactNode }) => {
  const { session, loading } = useAuth();

 if (loading) {
  return (
    <div className="app-loading night">
      <div className="loader-stack">
        <div className="road-scene">

          {/* ☀️ / 🌙 */}
          <div className="sun" />

          {/* ☁️ Clouds */}
          <div className="cloud one">☁️</div>
          <div className="cloud two">☁️</div>

          {/* 🌳 Apple Trees */}
          <div className="tree apple left">🌳</div>
          <div className="tree apple right">🌳</div>

          {/* 🌱 Field */}
          <div className="field" />

          {/* 💨 Dust */}
          <div className="dust" />

          {/* 🛣️ Road */}
          <div className="road">
            <div className="road-line" />
          </div>

          {/* 🚜 Ultra Tractor */}
          <svg
            className="tractor-svg"
            viewBox="0 0 260 120"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Body gradient — deep green */}
              <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#15803d" />
              </linearGradient>
              {/* Hood gradient */}
              <linearGradient id="hoodGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#16a34a" />
                <stop offset="100%" stopColor="#14532d" />
              </linearGradient>
              {/* Cabin gradient */}
              <linearGradient id="cabinGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4ade80" />
                <stop offset="100%" stopColor="#16a34a" />
              </linearGradient>
              {/* Window glass */}
              <linearGradient id="glassGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.7" />
              </linearGradient>
              {/* Big wheel gradient */}
              <radialGradient id="bigWheelGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#374151" />
                <stop offset="70%" stopColor="#1f2937" />
                <stop offset="100%" stopColor="#111827" />
              </radialGradient>
              {/* Small wheel gradient */}
              <radialGradient id="smallWheelGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#4b5563" />
                <stop offset="100%" stopColor="#1f2937" />
              </radialGradient>
              {/* Hub shine */}
              <radialGradient id="hubGrad" cx="40%" cy="35%" r="60%">
                <stop offset="0%" stopColor="#f3f4f6" />
                <stop offset="100%" stopColor="#9ca3af" />
              </radialGradient>
              {/* Exhaust smoke */}
              <filter id="smoke-blur">
                <feGaussianBlur stdDeviation="1.2" />
              </filter>
              {/* Headlight glow */}
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>

            {/* ── Shadow under tractor ── */}
            <ellipse cx="125" cy="112" rx="80" ry="6" fill="rgba(0,0,0,0.18)" />

            {/* ── Big rear wheel ── */}
            <g className="wheel rear-wheel">
              {/* Tyre */}
              <circle cx="88" cy="92" r="26" fill="url(#bigWheelGrad)" />
              {/* Tread lines */}
              {[0,45,90,135,180,225,270,315].map((angle, i) => (
                <line
                  key={i}
                  x1={88 + 14 * Math.cos((angle * Math.PI) / 180)}
                  y1={92 + 14 * Math.sin((angle * Math.PI) / 180)}
                  x2={88 + 25 * Math.cos((angle * Math.PI) / 180)}
                  y2={92 + 25 * Math.sin((angle * Math.PI) / 180)}
                  stroke="#374151" strokeWidth="3.5" strokeLinecap="round"
                />
              ))}
              {/* Hub */}
              <circle cx="88" cy="92" r="10" fill="url(#hubGrad)" />
              <circle cx="88" cy="92" r="4"  fill="#6b7280" />
              {/* Hub bolts */}
              {[0,72,144,216,288].map((angle, i) => (
                <circle
                  key={i}
                  cx={88 + 7 * Math.cos((angle * Math.PI) / 180)}
                  cy={92 + 7 * Math.sin((angle * Math.PI) / 180)}
                  r="1.5" fill="#374151"
                />
              ))}
            </g>

            {/* ── Chassis / Frame ── */}
            <rect x="60" y="68" width="130" height="12" rx="3" fill="#14532d" />

            {/* ── Main body ── */}
            <rect x="68" y="52" width="100" height="34" rx="7" fill="url(#bodyGrad)" />
            {/* Body panel crease */}
            <rect x="68" y="62" width="100" height="2" rx="1" fill="#15803d" opacity="0.5" />

            {/* ── Hood / Engine compartment ── */}
            <path d="M52 58 L68 52 L68 80 L52 80 Q42 80 40 70 L40 65 Q40 58 52 58 Z"
              fill="url(#hoodGrad)" />
            {/* Hood vents */}
            <line x1="44" y1="62" x2="64" y2="62" stroke="#14532d" strokeWidth="1.5" opacity="0.7"/>
            <line x1="44" y1="67" x2="64" y2="67" stroke="#14532d" strokeWidth="1.5" opacity="0.7"/>
            <line x1="44" y1="72" x2="64" y2="72" stroke="#14532d" strokeWidth="1.5" opacity="0.7"/>
            {/* Front grill */}
            <rect x="40" y="60" width="8" height="18" rx="2" fill="#065f46" />
            <line x1="40" y1="64" x2="48" y2="64" stroke="#14532d" strokeWidth="1.2"/>
            <line x1="40" y1="68" x2="48" y2="68" stroke="#14532d" strokeWidth="1.2"/>
            <line x1="40" y1="72" x2="48" y2="72" stroke="#14532d" strokeWidth="1.2"/>

            {/* ── Headlight ── */}
            <circle cx="39" cy="70" r="6" fill="#1f2937" />
            <circle cx="39" cy="70" r="4.5" fill="#fde047" className="headlight" filter="url(#glow)" />
            <circle cx="37.5" cy="68.5" r="1.2" fill="white" opacity="0.7" />

            {/* ── Exhaust pipe ── */}
            <rect x="58" y="30" width="7" height="24" rx="3" fill="#334155" />
            <rect x="56" y="28" width="11" height="6" rx="3" fill="#475569" />
            {/* Smoke puffs */}
            <circle className="smoke-puff puff1" cx="61" cy="22" r="5" fill="rgba(203,213,225,0.55)" filter="url(#smoke-blur)" />
            <circle className="smoke-puff puff2" cx="64" cy="14" r="7" fill="rgba(203,213,225,0.35)" filter="url(#smoke-blur)" />
            <circle className="smoke-puff puff3" cx="59" cy="6"  r="5" fill="rgba(203,213,225,0.20)" filter="url(#smoke-blur)" />

            {/* ── Cabin / ROPS ── */}
            {/* Roof */}
            <rect x="140" y="30" width="68" height="8" rx="4" fill="#15803d" />
            {/* ROPS pillars */}
            <rect x="140" y="30" width="5" height="30" rx="2" fill="#16a34a" />
            <rect x="203" y="30" width="5" height="30" rx="2" fill="#16a34a" />
            {/* Cabin walls */}
            <rect x="140" y="38" width="68" height="22" rx="3" fill="url(#cabinGrad)" />
            {/* Windshield */}
            <rect x="144" y="40" width="36" height="18" rx="3" fill="url(#glassGrad)" />
            {/* Windshield glare */}
            <path d="M146 42 L158 42 L148 50 Z" fill="white" opacity="0.25" />
            {/* Rear window */}
            <rect x="184" y="40" width="22" height="18" rx="3" fill="url(#glassGrad)" opacity="0.8" />
            {/* Door handle */}
            <rect x="195" y="52" width="8" height="3" rx="1.5" fill="#14532d" />
            {/* SKUAST logo badge on cabin side */}
            <rect x="150" y="46" width="24" height="9" rx="3" fill="#14532d" opacity="0.6" />
            <text x="162" y="53" textAnchor="middle" fontSize="4.5" fill="#4ade80" fontWeight="bold" fontFamily="sans-serif">SKUAST</text>

            {/* ── Seat & steering wheel (visible through window) ── */}
            <ellipse cx="175" cy="52" rx="6" ry="3" fill="#065f46" opacity="0.6" />

            {/* ── Step / footrest ── */}
            <rect x="118" y="76" width="18" height="5" rx="2" fill="#14532d" />

            {/* ── Small front wheel ── */}
            <g className="wheel front-wheel">
              <circle cx="168" cy="96" r="16" fill="url(#smallWheelGrad)" />
              {/* Tread */}
              {[0,60,120,180,240,300].map((angle, i) => (
                <line
                  key={i}
                  x1={168 + 9 * Math.cos((angle * Math.PI) / 180)}
                  y1={96  + 9 * Math.sin((angle * Math.PI) / 180)}
                  x2={168 + 15 * Math.cos((angle * Math.PI) / 180)}
                  y2={96  + 15 * Math.sin((angle * Math.PI) / 180)}
                  stroke="#374151" strokeWidth="3" strokeLinecap="round"
                />
              ))}
              {/* Hub */}
              <circle cx="168" cy="96" r="7"  fill="url(#hubGrad)" />
              <circle cx="168" cy="96" r="3"  fill="#6b7280" />
              {[0,120,240].map((angle, i) => (
                <circle
                  key={i}
                  cx={168 + 5 * Math.cos((angle * Math.PI) / 180)}
                  cy={96  + 5 * Math.sin((angle * Math.PI) / 180)}
                  r="1.2" fill="#374151"
                />
              ))}
            </g>

            {/* ── Rear hitch / implement link ── */}
            <rect x="32" y="72" width="12" height="6" rx="2" fill="#475569" />
            <circle cx="30" cy="75" r="3" fill="#334155" />
          </svg>

        </div>

        <p className="loader-text">🍎 Loading your orchard…</p>
      </div>
    </div>
  );
}
    if (!session) {
    // Unauthenticated users land on the pricing page first
    return <Navigate to="/pricing" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public landing — pricing card shown on first open */}
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="fields" element={<Fields />} />
          <Route path="finance" element={<FinancialLedger />} />
          <Route path="orchard-doctor" element={<OrchardDoctor />} />
          <Route path="profile" element={<Profile />} />
          <Route path="skuast-advisory" element={<SkuastAdvisory />} />
          <Route path="soil-test-advisory" element={<SoilTestAdvisory />} />
          <Route path="tree-scouting" element={<TreeScouting />} />
            <Route path="calendar" element={<Calendar />} />
           <Route path="/teammanagement" element={<TeamManagement />} />
<Route path="/accept-invitation" element={<AcceptInvitation />} />


        </Route>
      </Routes>
    </Router>
  );
}

export default App;
