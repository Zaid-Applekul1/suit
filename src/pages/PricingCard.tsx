

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
const PRICING_STYLES = `
/* ── Keyframes ── */
@keyframes pcFadeUp {
  from { opacity:0; transform:translateY(28px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes pcScaleIn {
  from { opacity:0; transform:scale(0.9); }
  to   { opacity:1; transform:scale(1); }
}
@keyframes pcGradShift {
  0%,100% { background-position:0% 50%; }
  50%      { background-position:100% 50%; }
}
@keyframes pcBlobDrift {
  0%,100% { transform:translate(0,0) scale(1); }
  33%     { transform:translate(28px,-22px) scale(1.07); }
  66%     { transform:translate(-14px,16px) scale(0.95); }
}
@keyframes pcShimmer {
  0%   { background-position:-600px 0; }
  100% { background-position: 600px 0; }
}
@keyframes pcGlow {
  0%,100% { box-shadow:0 0 0 0 rgba(34,197,94,.35); }
  50%      { box-shadow:0 0 0 18px rgba(34,197,94,0); }
}
@keyframes pcRibbonPop {
  from { opacity:0; transform:translateX(20px) translateY(-20px) rotate(45deg) scale(.7); }
  to   { opacity:1; transform:translateX(0) translateY(0) rotate(45deg) scale(1); }
}
@keyframes pcPulse {
  0%,100% { opacity:1; transform:scale(1); }
  50%      { opacity:.55; transform:scale(.82); }
}
@keyframes pcCheckBounce {
  0%   { transform:scale(0); opacity:0; }
  60%  { transform:scale(1.2); }
  100% { transform:scale(1); opacity:1; }
}
@keyframes pcLogoBadge {
  0%,100% { transform:translateY(0) rotate(0deg); }
  50%      { transform:translateY(-6px) rotate(2deg); }
}
@keyframes pcHeadlineIn {
  from { opacity:0; transform:translateY(-18px); }
  to   { opacity:1; transform:translateY(0); }
}

/* ── Animation helpers ── */
.pc-fade-up   { animation:pcFadeUp   .7s cubic-bezier(.22,1,.36,1) both; }
.pc-scale-in  { animation:pcScaleIn  .55s cubic-bezier(.22,1,.36,1) both; }
.pc-glow      { animation:pcGlow 3s ease-in-out infinite; }
.pc-head-in   { animation:pcHeadlineIn .65s cubic-bezier(.22,1,.36,1) both; }

.pc-d0  { animation-delay:.00s; } .pc-d1  { animation-delay:.08s; }
.pc-d2  { animation-delay:.16s; } .pc-d3  { animation-delay:.24s; }
.pc-d4  { animation-delay:.32s; } .pc-d5  { animation-delay:.40s; }
.pc-d6  { animation-delay:.48s; } .pc-d7  { animation-delay:.56s; }
.pc-d8  { animation-delay:.64s; } .pc-d9  { animation-delay:.72s; }
.pc-d10 { animation-delay:.80s; } .pc-d11 { animation-delay:.88s; }

/* ── Animated background ── */
.pc-bg {
  background: linear-gradient(135deg,#052e16,#064e3b,#065f46,#047857,#059669,#10b981,#34d399,#10b981,#047857,#052e16);
  background-size:300% 300%;
  animation:pcGradShift 10s ease infinite;
}

/* ── Animated blobs ── */
.pc-blob {
  position:absolute; border-radius:50%;
  filter:blur(90px);
  animation:pcBlobDrift 14s ease-in-out infinite;
  pointer-events:none;
}

/* ── Page headline ── */
.pc-page-head {
  text-align:center;
  margin-bottom:2.5rem;
  position:relative;
  z-index:10;
}
.pc-page-title {
  font-family:'Poppins',system-ui,sans-serif;
  font-size:clamp(2rem,6vw,3.2rem);
  font-weight:900;
  line-height:1.1;
  letter-spacing:-.5px;
  color:#fff;
}
.pc-page-title .one   { color:#fbbf24; }
.pc-page-title .dot   { color:rgba(255,255,255,.35); }
.pc-page-title .ak    { color:#fff; }
.pc-page-title .join  {
  display:inline-block;
  background:linear-gradient(135deg,#fbbf24,#f59e0b);
  -webkit-background-clip:text;
  -webkit-text-fill-color:transparent;
  background-clip:text;
  margin-left:.25em;
}
.pc-page-sub {
  margin-top:.5rem;
  font-size:clamp(.9rem,2.2vw,1.1rem);
  font-weight:500;
  color:rgba(255,255,255,.7);
}
.pc-page-sub .hl { color:#6ee7b7; font-weight:700; }

/* ── Card wrapper — logo badge anchors here ── */
.pc-card-wrap {
  position:relative;
  width:100%;
  max-width:448px;
  z-index:10;
}

/* ── Logo badge — OUTSIDE card, top-right ── */
.pc-logo-badge {
  position:absolute;
  top:-26px;
  right:-18px;
  width:72px;
  height:72px;
  border-radius:20px;
  background:linear-gradient(145deg,#1a7a50,#0d5c3a);
  display:flex;
  align-items:center;
  justify-content:center;
  box-shadow:
    0 6px 24px rgba(0,0,0,.45),
    0 0 0 3px rgba(255,255,255,.14),
    0 0 0 6px rgba(255,255,255,.05);
  z-index:30;
  animation:pcLogoBadge 4.5s ease-in-out infinite, pcGlow 3s ease-in-out infinite;
  overflow:hidden;
}
.pc-logo-badge img {
  width:52px;
  height:52px;
  object-fit:contain;
  border-radius:12px;
}

/* ── Pricing card shell ── */
.pc-card {
  background:rgba(255,255,255,.97);
  backdrop-filter:blur(40px) saturate(1.8);
  -webkit-backdrop-filter:blur(40px) saturate(1.8);
  border:1.5px solid rgba(255,255,255,.95);
  box-shadow:
    0 32px 80px rgba(0,0,0,.32),
    0 0 0 1px rgba(16,185,129,.12),
    0 1px 0 rgba(255,255,255,1) inset;
  border-radius:28px;
  overflow:hidden;
  width:100%;
}

/* ── Ribbon ── */
.pc-ribbon-wrap {
  position:absolute;
  top:0; right:0;
  width:110px; height:110px;
  overflow:hidden;
  border-radius:0 28px 0 0;
  pointer-events:none;
  z-index:20;
}
.pc-ribbon {
  position:absolute;
  top:22px; right:-32px;
  width:140px;
  padding:7px 0;
  text-align:center;
  font-size:.6rem;
  font-weight:900;
  letter-spacing:.12em;
  text-transform:uppercase;
  color:#fff;
  background:linear-gradient(135deg,#f59e0b,#d97706,#b45309);
  box-shadow:0 4px 16px rgba(180,83,9,.45);
  transform:rotate(45deg);
  animation:pcRibbonPop .7s cubic-bezier(.22,1,.36,1) .15s both;
}

/* ── Card header (dark green) ── */
.pc-header {
  background:linear-gradient(150deg,#052e16 0%,#064e3b 55%,#065f46 100%);
  position:relative;
  overflow:hidden;
  padding:2.25rem 1.75rem 2rem;
}
.pc-header::before {
  content:'';
  position:absolute; inset:0;
  background:linear-gradient(135deg,rgba(16,185,129,.14),transparent 60%);
  pointer-events:none;
}
/* decorative orb */
.pc-header::after {
  content:'';
  position:absolute;
  top:-80px; left:-80px;
  width:260px; height:260px;
  background:radial-gradient(circle,rgba(52,211,153,.1) 0%,transparent 70%);
  pointer-events:none;
}

/* ── Shimmer bar ── */
.pc-shimmer {
  background:linear-gradient(90deg,rgba(167,243,208,.15) 25%,rgba(167,243,208,.5) 50%,rgba(167,243,208,.15) 75%);
  background-size:600px 100%;
  animation:pcShimmer 2.5s ease-in-out infinite;
}

/* ── Plan pill ── */
.pc-pill {
  display:inline-flex;
  align-items:center;
  gap:.4rem;
  background:rgba(255,255,255,.1);
  border:1px solid rgba(255,255,255,.18);
  border-radius:999px;
  padding:.3rem .85rem;
  font-size:.68rem;
  font-weight:800;
  letter-spacing:.12em;
  text-transform:uppercase;
  color:rgba(255,255,255,.85);
  margin-bottom:1.1rem;
}
.pc-pill-dot {
  width:7px; height:7px;
  border-radius:50%;
  background:#6ee7b7;
  box-shadow:0 0 6px #6ee7b7;
  animation:pcPulse 1.8s ease-in-out infinite;
}

/* ── Pricing grid ── */
.pc-price-grid {
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:.75rem;
  margin-bottom:1.25rem;
}
.pc-price-box {
  background:rgba(255,255,255,.08);
  border:1px solid rgba(255,255,255,.12);
  border-radius:16px;
  padding:1rem;
  text-align:center;
}
.pc-price-box.free {
  background:linear-gradient(135deg,rgba(110,231,183,.18),rgba(110,231,183,.07));
  border-color:rgba(110,231,183,.35);
}
.pc-price-lbl {
  font-size:.65rem;
  font-weight:700;
  letter-spacing:.1em;
  text-transform:uppercase;
  color:rgba(255,255,255,.45);
  margin-bottom:.4rem;
}
.pc-price-lbl.free { color:#6ee7b7; }
.pc-price-val {
  font-family:'Poppins',system-ui,sans-serif;
  font-size:1.45rem;
  font-weight:800;
  color:rgba(255,255,255,.38);
  text-decoration:line-through;
  text-decoration-color:rgba(255,80,80,.6);
  text-decoration-thickness:2.5px;
}
.pc-price-val.free {
  font-size:2rem;
  color:#fff;
  text-decoration:none;
}
.pc-price-note {
  font-size:.7rem;
  color:rgba(255,255,255,.32);
  font-weight:500;
}
.pc-price-note.free { color:#6ee7b7; font-weight:600; }

/* ── Trust badge ── */
.pc-trust {
  display:flex;
  align-items:center;
  justify-content:center;
  gap:.5rem;
  background:rgba(255,255,255,.07);
  border:1px solid rgba(255,255,255,.12);
  border-radius:999px;
  padding:.55rem 1.1rem;
  font-size:.72rem;
  font-weight:600;
  color:rgba(255,255,255,.7);
}

/* ── Card body (white) ── */
.pc-body {
  background:#fff;
  padding:1.75rem 1.6rem 2rem;
}

/* ── Features ── */
.pc-feat {
  display:flex;
  align-items:center;
  gap:.85rem;
  padding:.65rem .75rem;
  border-radius:14px;
  transition:background .18s ease,transform .18s ease;
}
.pc-feat:hover {
  background:rgba(16,185,129,.07);
  transform:translateX(3px);
}
.pc-feat-icon {
  font-size:1.2rem;
  width:38px; height:38px;
  border-radius:10px;
  display:flex; align-items:center; justify-content:center;
  flex-shrink:0;
}
.pc-feat-name { font-size:.85rem; font-weight:700; color:#111; line-height:1.25; }
.pc-feat-desc { font-size:.72rem; color:#6b7280; margin-top:1px; }
.pc-check {
  width:22px; height:22px;
  border-radius:50%;
  background:linear-gradient(135deg,#10b981,#059669);
  display:flex; align-items:center; justify-content:center;
  flex-shrink:0;
  box-shadow:0 2px 8px rgba(16,185,129,.35);
  animation:pcCheckBounce .4s cubic-bezier(.22,1,.36,1) both;
}

/* ── CTA button ── */
.pc-cta {
  width:100%;
  padding:1.1rem 1.5rem;
  border-radius:16px;
  background:linear-gradient(135deg,#059669 0%,#10b981 60%,#34d399 100%);
  background-size:200% 200%;
  color:#fff;
  font-family:'Poppins',system-ui,sans-serif;
  font-size:1rem;
  font-weight:800;
  letter-spacing:.02em;
  border:none;
  cursor:pointer;
  position:relative;
  overflow:hidden;
  box-shadow:0 8px 28px rgba(16,185,129,.45),0 2px 0 rgba(255,255,255,.12) inset;
  transition:transform .2s ease,box-shadow .2s ease,background-position .4s ease;
}
.pc-cta::before {
  content:'';
  position:absolute; inset:0;
  background:linear-gradient(90deg,transparent 30%,rgba(255,255,255,.18) 50%,transparent 70%);
  background-size:200% 100%;
  animation:pcShimmer 2.2s ease-in-out infinite;
}
.pc-cta:hover {
  transform:translateY(-3px) scale(1.01);
  box-shadow:0 16px 40px rgba(16,185,129,.55),0 2px 0 rgba(255,255,255,.12) inset;
  background-position:right center;
}
.pc-cta:active { transform:translateY(0) scale(.99); }

/* ── Responsive ── */
@media (max-width:480px) {
  .pc-header { padding:1.75rem 1.25rem 1.5rem; }
  .pc-body   { padding:1.4rem 1.1rem 1.6rem; }
  .pc-logo-badge { width:60px; height:60px; top:-20px; right:-10px; border-radius:16px; }
  .pc-logo-badge img { width:44px; height:44px; }
  .pc-page-title { font-size:clamp(1.75rem,8vw,2.5rem); }
}
@media (max-width:360px) {
  .pc-price-grid { grid-template-columns:1fr; }
}
`;

/* ─────────────────────────────────────────────────────────────
   Security hook — fires once on mount
───────────────────────────────────────────────────────────── */
function useSecurityHardening() {
  useEffect(() => {
    /* 1. Iframe bust — clickjacking prevention */
    if (window.top !== window.self) {
      try { window.top!.location.href = window.self.location.href; } catch { /* cross-origin */ }
    }

    /* 2. Right-click */
    const noCtx = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', noCtx);

    /* 3. Keyboard shortcuts (F12, Ctrl+Shift+I/J/C/U, Ctrl+U/S/P) */
    const noKeys = (e: KeyboardEvent) => {
      const k = e.key.toUpperCase();
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I','J','C'].includes(k)) ||
        (e.ctrlKey && ['U','S','P'].includes(k)) ||
        (e.metaKey && e.altKey && ['I','J','U'].includes(k))
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener('keydown', noKeys, true);

    /* 4. DevTools open — dimension heuristic */
    const THRESHOLD = 160;
    let devOpen = false;
    const checkDev = () => {
      const open =
        window.outerWidth  - window.innerWidth  > THRESHOLD ||
        window.outerHeight - window.innerHeight > THRESHOLD;
      if (open && !devOpen) {
        devOpen = true;
        document.body.style.filter = 'blur(12px) brightness(.4)';
        document.body.style.pointerEvents = 'none';
      } else if (!open && devOpen) {
        devOpen = false;
        document.body.style.filter = '';
        document.body.style.pointerEvents = '';
      }
    };
    const devTimer = setInterval(checkDev, 1200);

    /* 5. Drag prevention */
    const noDrag = (e: DragEvent) => e.preventDefault();
    document.addEventListener('dragstart', noDrag);

    return () => {
      document.removeEventListener('contextmenu', noCtx);
      document.removeEventListener('keydown', noKeys, true);
      document.removeEventListener('dragstart', noDrag);
      clearInterval(devTimer);
    };
  }, []);
}

/* ─────────────────────────────────────────────────────────────
   Feature list
───────────────────────────────────────────────────────────── */
const features = [
  { icon: '🗺️', bg: '#eff6ff', label: 'Orchard Maps',       desc: 'Interactive field & block mapping',  delay: 'pc-d4' },
  { icon: '⛅',  bg: '#fff7ed', label: 'Weather',             desc: 'Real-time forecasts & alerts',       delay: 'pc-d5' },
  { icon: '💰',  bg: '#fdf4ff', label: 'Finance',             desc: 'Revenue, costs & profit ledger',     delay: 'pc-d6' },
  { icon: '🧪',  bg: '#f0fdf4', label: 'Soil / Water Tests',  desc: 'Lab reports & analysis history',     delay: 'pc-d7' },
  { icon: '🔍',  bg: '#fef2f2', label: 'Tree Scouting / GOM', desc: 'Pest & disease monitoring',          delay: 'pc-d8' },
  { icon: '👥',  bg: '#eef2ff', label: 'Team Management',     desc: 'Assign tasks, track workers',        delay: 'pc-d9' },
  { icon: '📡',  bg: '#f0fdfa', label: 'Weather Station',     desc: 'On-site sensor integration',         delay: 'pc-d10' },
  { icon: '🛰️', bg: '#f8fafc', label: 'Satellite',           desc: 'NDVI & crop-health imagery',         delay: 'pc-d11' },
];

/* ─────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────── */
interface PricingCardProps {
  onStartTrial?: () => void;
}

const PricingCard: React.FC<PricingCardProps> = ({ onStartTrial }) => {
  const navigate = useNavigate();
  useSecurityHardening();

  const handleStartTrial = () => {
    if (onStartTrial) {
      onStartTrial();
    } else {
      navigate('/signup');
    }
  };

  return (
    <>
      <style>{PRICING_STYLES}</style>

      {/* ── Animated Background ── */}
      <div className="min-h-screen pc-bg flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden select-none">

        {/* Blobs */}
        <div className="pc-blob w-[30rem] h-[30rem] bg-emerald-400/20 top-[-6rem] left-[-7rem]" style={{ animationDuration:'16s' }} />
        <div className="pc-blob w-72 h-72 bg-teal-500/15 bottom-[-4rem] right-[-4rem]"         style={{ animationDuration:'20s', animationDelay:'4s' }} />
        <div className="pc-blob w-56 h-56 bg-green-300/15 top-1/3 right-10"                    style={{ animationDuration:'12s', animationDelay:'7s' }} />
        <div className="pc-blob w-36 h-36 bg-emerald-600/15 bottom-24 left-16"                 style={{ animationDuration:'18s', animationDelay:'2s' }} />

        {/* Decorative grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage:'linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px)',
          backgroundSize:'60px 60px'
        }} />

        {/* ── Page Headline ── */}
        <div className="pc-page-head pc-head-in" style={{ animationDelay:'.05s' }}>
          <h1 className="pc-page-title">
            <span className="one">AppleKul</span>
           
            <span className="ak">One</span>
            <span className="join"> join</span>
          </h1>
          <p className="pc-page-sub">
            No more guess work &mdash; <span className="hl">only daily insights</span>
          </p>
        </div>

        {/* ── Card Wrapper — logo badge anchors here ── */}
        <div className="pc-card-wrap pc-scale-in" style={{ animationDelay:'.12s' }}>

          {/* ── Pricing Card ── */}
          <div className="pc-card">

            {/* Shimmer top accent */}
            <div className="h-[3px] w-full pc-shimmer" />

            {/* ── Header ── */}
            <div className="pc-header">

              {/* 1 MONTH FREE ribbon */}
              <div className="pc-ribbon-wrap" aria-label="1 month free">
                <div className="pc-ribbon">1 MONTH FREE</div>
              </div>

              {/* Plan pill */}
              <div className="pc-fade-up pc-d0">
                <div className="pc-pill">
                  <span className="pc-pill-dot" />
                  Pro Plan
                </div>
              </div>

              {/* Title */}
              <div className="pc-fade-up pc-d1 mb-1">
                <h2 style={{
                  fontFamily:"'Poppins',system-ui,sans-serif",
                  fontSize:'clamp(1.5rem,5vw,2rem)',
                  fontWeight:900,
                  lineHeight:1.15,
                  color:'#fff',
                  letterSpacing:'-.3px'
                }}>
                  <span style={{ color:'#6ee7b7' }}>one.</span>applekul{' '}
                  <span style={{ color:'#fbbf24' }}>Pro</span>
                </h2>
                <p style={{ fontSize:'.8rem', color:'rgba(255,255,255,.55)', fontWeight:500, marginTop:'.2rem' }}>
                  Complete Orchard Intelligence Suite
                </p>
              </div>

              {/* Pricing grid */}
              <div className="pc-fade-up pc-d2 pc-price-grid">
                <div className="pc-price-box">
                  <div className="pc-price-lbl">Regular Price</div>
                  <div className="pc-price-val">₹999<span style={{ fontSize:'.8rem', fontWeight:700 }}>/mo</span></div>
                  <div className="pc-price-note">standard rate</div>
                </div>
                <div className="pc-price-box free">
                  <div className="pc-price-lbl free">First Month</div>
                  <div className="pc-price-val free">FREE</div>
                  <div className="pc-price-note free">no charge</div>
                </div>
              </div>

              {/* Trust badge */}
              <div className="pc-fade-up pc-d3 pc-trust">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="#6ee7b7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                No credit card required &nbsp;·&nbsp; Cancel anytime
              </div>
            </div>

            {/* ── Features ── */}
            <div className="pc-body">
              <p className="pc-fade-up pc-d3 text-center mb-4"
                style={{ fontSize:'.65rem', fontWeight:800, letterSpacing:'.18em', textTransform:'uppercase', color:'#065f46' }}>
                Everything Included
              </p>

              <ul className="space-y-0.5 mb-6">
                {features.map((f) => (
                  <li key={f.label} className={`pc-fade-up ${f.delay} pc-feat`}>
                    <div className="pc-feat-icon" style={{ background: f.bg }}>{f.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="pc-feat-name">{f.label}</div>
                      <div className="pc-feat-desc">{f.desc}</div>
                    </div>
                    <div className="pc-check">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                        stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="2,6 5,9 10,3" />
                      </svg>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Divider */}
              <div style={{ height:1, background:'linear-gradient(90deg,transparent,#d1fae5 30%,#d1fae5 70%,transparent)', marginBottom:'1.5rem' }} />

              {/* CTA */}
              <button className="pc-cta" onClick={handleStartTrial}>
                <span className="relative z-10 flex items-center justify-center gap-2">
                  
                  Start 1-Month Free Trial
                </span>
              </button>

              {/* Sign-in link — no "After free month" line */}
              <p className="text-center mt-3" style={{ fontSize:'.73rem', color:'#9ca3af', fontWeight:500 }}>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  style={{ color:'#059669', fontWeight:700, textDecoration:'underline', textUnderlineOffset:'2px', background:'none', border:'none', cursor:'pointer' }}
                >
                  Sign In
                </button>
              </p>

              {/* Security seal */}
              <div className="flex items-center justify-center gap-1.5 mt-4"
                style={{ fontSize:'.68rem', color:'#d1d5db', fontWeight:500 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                256-bit SSL &nbsp;·&nbsp; Protected by applekul
              </div>
            </div>

            {/* Bottom shimmer */}
            <div className="h-0.5 w-full pc-shimmer opacity-50" />
          </div>
        </div>
      </div>
    </>
  );
};

export default PricingCard;