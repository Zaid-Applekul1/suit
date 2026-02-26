/**
 * Login.tsx  — RBAC-aware login (SKUAST-style Premium UI)
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const LOGIN_STYLES = `
/* ─── Keyframes ─── */
@keyframes lgFadeUp {
  from { opacity:0; transform:translateY(24px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes lgFadeDown {
  from { opacity:0; transform:translateY(-18px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes lgScaleIn {
  from { opacity:0; transform:scale(0.90); }
  to   { opacity:1; transform:scale(1); }
}
@keyframes lgSlideRight {
  from { opacity:0; transform:translateX(-20px); }
  to   { opacity:1; transform:translateX(0); }
}
@keyframes lgGradShift {
  0%   { background-position:0% 50%; }
  50%  { background-position:100% 50%; }
  100% { background-position:0% 50%; }
}
@keyframes lgFloat {
  0%,100% { transform:translateY(0); }
  50%     { transform:translateY(-10px); }
}
@keyframes lgPulseRing {
  0%   { transform:scale(1);   opacity:0.8; }
  100% { transform:scale(1.6); opacity:0; }
}
@keyframes lgLeafSway {
  0%, 100% { transform: rotate(-4deg); }
  50%       { transform: rotate(4deg); }
}
@keyframes lgGlow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.3); }
  50%       { box-shadow: 0 0 0 14px rgba(34,197,94,0); }
}
@keyframes lgBlobDrift {
  0%, 100% { transform: translate(0,0) scale(1); }
  33%       { transform: translate(40px,-30px) scale(1.1); }
  66%       { transform: translate(-20px,20px) scale(0.95); }
}
@keyframes lgShimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}

/* ─── Animation helpers ─── */
.lg-fade-up    { animation: lgFadeUp   0.6s cubic-bezier(.22,1,.36,1) both; }
.lg-fade-down  { animation: lgFadeDown 0.55s cubic-bezier(.22,1,.36,1) both; }
.lg-scale-in   { animation: lgScaleIn  0.5s  cubic-bezier(.22,1,.36,1) both; }
.lg-slide-r    { animation: lgSlideRight 0.5s cubic-bezier(.22,1,.36,1) both; }
.lg-float      { animation: lgFloat 4s ease-in-out infinite; }
.lg-glow       { animation: lgGlow 2.8s ease-in-out infinite; }
.lg-leaf       { display:inline-block; animation: lgLeafSway 3s ease-in-out infinite; transform-origin: bottom center; }

.lg-d0 { animation-delay:0s;   }
.lg-d1 { animation-delay:.08s; }
.lg-d2 { animation-delay:.16s; }
.lg-d3 { animation-delay:.24s; }
.lg-d4 { animation-delay:.32s; }
.lg-d5 { animation-delay:.40s; }
.lg-d6 { animation-delay:.48s; }

/* Animated gradient background */
.lg-bg {
  background: linear-gradient(135deg, #052e16, #064e3b, #065f46, #047857, #059669, #10b981, #34d399, #10b981, #047857, #052e16);
  background-size: 300% 300%;
  animation: lgGradShift 10s ease infinite;
}

/* Animated blobs */
.lg-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  animation: lgBlobDrift 12s ease-in-out infinite;
  pointer-events: none;
}

/* Glassy card — stronger white so form fields are clearly visible */
.lg-card {
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(32px) saturate(1.6);
  -webkit-backdrop-filter: blur(32px) saturate(1.6);
  border: 1px solid rgba(255,255,255,0.9);
  box-shadow:
    0 24px 64px rgba(0,0,0,0.30),
    0 1px 0 rgba(255,255,255,0.9) inset;
}

/* Solid white input — clearly readable on the opaque card */
.lg-input {
  transition: border-color .18s ease, box-shadow .18s ease, background .18s ease;
  background: #ffffff;
  border: 1.5px solid #d1fae5;
  color: #064e3b;
}
.lg-input::placeholder { color: #9ca3af; }
.lg-input:focus {
  border-color: #10b981 !important;
  box-shadow: 0 0 0 3px rgba(16,185,129,0.18);
  background: #f0fdf4;
  outline: none;
}

/* Glassy button */
.lg-btn {
  transition: transform .2s ease, box-shadow .2s ease, background .2s ease;
}
.lg-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 12px 30px rgba(16,185,129,0.45);
}
.lg-btn:active:not(:disabled) { transform: translateY(0); }

/* Pulse indicator */
.lg-pulse::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(167,243,208,0.5);
  animation: lgPulseRing 1.6s cubic-bezier(.215,.61,.355,1) infinite;
}

/* Shimmer accent bar */
.lg-shimmer {
  background: linear-gradient(90deg, rgba(167,243,208,0.2) 25%, rgba(167,243,208,0.5) 50%, rgba(167,243,208,0.2) 75%);
  background-size: 400px 100%;
  animation: lgShimmer 2s ease-in-out infinite;
}
`;

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { session, userRole } = useAuth();

  useEffect(() => {
    if (!session) return;
    if (userRole === 'Doctor') {
      navigate('/orchard-doctor', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate, session, userRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setLoading(false);
      setErrorMessage(error.message);
      return;
    }

    let role: string | null = null;
    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();
      role = profile?.role ?? data.user.user_metadata?.role ?? null;
    }

    setLoading(false);
    if (role === 'Doctor') {
      navigate('/orchard-doctor', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <>
      <style>{LOGIN_STYLES}</style>
      <div className="min-h-screen lg-bg flex items-center justify-center p-4 relative overflow-hidden">

        {/* ── Animated background blobs ── */}
        <div className="lg-blob w-96 h-96 bg-emerald-400/20 top-[-5rem] left-[-6rem]" style={{ animationDuration: '14s' }} />
        <div className="lg-blob w-80 h-80 bg-teal-500/15 bottom-[-4rem] right-[-4rem]" style={{ animationDuration: '18s', animationDelay: '3s' }} />
        <div className="lg-blob w-56 h-56 bg-green-300/15 top-1/2 right-16" style={{ animationDuration: '10s', animationDelay: '6s' }} />
        <div className="lg-blob w-40 h-40 bg-emerald-600/15 bottom-24 left-20" style={{ animationDuration: '16s', animationDelay: '1s' }} />

        {/* ── Decorative grid lines ── */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        {/* ── Glassy Card ── */}
        <div className="lg-scale-in lg-card w-full max-w-md rounded-3xl overflow-hidden relative z-10">
          {/* Shimmer top accent */}
          <div className="h-1 w-full lg-shimmer" />

          <div className="p-8 sm:p-10">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="lg-float lg-glow inline-block rounded-full mb-2">
                <img src="/logo.png" alt="AppleKul™"  className="w-24 h-24 rounded-xl object-contain mx-auto" />
              </div>
              <div className="lg-fade-down lg-d0 text-lg font-extrabold tracking-wide mb-3" style={{ color: '#5a7a3a', fontFamily: 'Georgia, serif' }}>
                AppleKul One
              </div>

              <h1 className="lg-fade-up lg-d1 text-3xl font-extrabold text-gray-900 tracking-tight">
                <span className="lg-leaf">🌿</span> Welcome Back
              </h1>
              <p className="lg-fade-up lg-d2 text-sm text-emerald-700 mt-1.5 font-semibold">Sign in to manage your orchard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="lg-slide-r lg-d2 space-y-1.5">
                <label htmlFor="email" className="block text-xs font-bold text-emerald-800 uppercase tracking-wide">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500 w-4 h-4" />
                  <input
                    id="email" type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="lg-input w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                    placeholder="your.email@example.com" required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="lg-slide-r lg-d3 space-y-1.5">
                <label htmlFor="password" className="block text-xs font-bold text-emerald-800 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500 w-4 h-4" />
                  <input
                    id="password" type={showPassword ? 'text' : 'password'}
                    value={password} onChange={e => setPassword(e.target.value)}
                    className="lg-input w-full pl-10 pr-12 py-3 rounded-xl text-sm"
                    placeholder="Enter your password" required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500 hover:text-emerald-700 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {errorMessage && (
                <div className="lg-fade-up flex items-center gap-2 px-4 py-3 bg-red-900/40 border border-red-400/40 backdrop-blur-sm rounded-xl text-sm text-red-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  {errorMessage}
                </div>
              )}

              {/* Submit */}
              <div className="lg-fade-up lg-d4">
                <button
                  type="submit"
                  disabled={loading}
                  className="lg-btn w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-extrabold text-base shadow-lg shadow-emerald-900/40 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-emerald-400/30"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Signing In…
                    </>
                  ) : 'Sign In'}
                </button>
              </div>
            </form>

            {/* Footer links */}
            <div className="lg-fade-up lg-d5 mt-7 text-center space-y-3">
              <p className="text-sm text-gray-700 font-medium">
                Don't have an account?{' '}
                <Link to="/signup" className="text-emerald-600 hover:text-emerald-800 font-bold transition-colors underline underline-offset-2">Sign Up</Link>
              </p>
              <p className="text-xs text-gray-400 font-medium">
                Doctors are redirected to the Orchard Hospital portal automatically.
              </p>
            </div>
          </div>

          {/* Card bottom shimmer accent */}
          <div className="h-0.5 w-full lg-shimmer opacity-50" />
        </div>
      </div>
    </>
  );
};

export default Login;
