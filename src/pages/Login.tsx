/**
 * Login.tsx  — RBAC-aware login (Enhanced UI)
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const LOGIN_STYLES = `
@keyframes lgFadeUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
@keyframes lgScaleIn { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }
@keyframes lgGradShift {
  0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%}
}
@keyframes lgFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
@keyframes lgPulseRing {
  0%{transform:scale(1);opacity:0.7} 100%{transform:scale(1.8);opacity:0}
}
.lg-fade-up  { animation: lgFadeUp  0.55s cubic-bezier(.22,1,.36,1) both }
.lg-scale-in { animation: lgScaleIn 0.45s cubic-bezier(.22,1,.36,1) both }
.lg-d0{animation-delay:0s} .lg-d1{animation-delay:.07s} .lg-d2{animation-delay:.14s}
.lg-d3{animation-delay:.21s} .lg-d4{animation-delay:.28s} .lg-d5{animation-delay:.35s}
.lg-bg {
  background: linear-gradient(135deg,#064e3b,#065f46,#047857,#059669,#10b981,#34d399,#10b981,#047857);
  background-size:300% 300%;
  animation: lgGradShift 10s ease infinite;
}
.lg-logo { animation: lgFloat 4s ease-in-out infinite }
.lg-input {
  transition: border-color .18s ease, box-shadow .18s ease, background .18s ease;
}
.lg-input:focus {
  border-color: #16a34a !important;
  box-shadow: 0 0 0 3px rgba(22,163,74,0.15);
  background: #f0fdf4;
  outline: none;
}
.lg-btn {
  transition: transform .2s ease, box-shadow .2s ease;
}
.lg-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(22,163,74,0.35);
}
.lg-btn:active:not(:disabled) { transform: translateY(0); }
.lg-card {
  background: rgba(255,255,255,0.97);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.8);
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
        {/* Decorative blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-white/5 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-white/5 translate-x-1/3 translate-y-1/3 pointer-events-none" />
        <div className="absolute top-1/2 right-10 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />

        <div className="lg-scale-in lg-card w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
          {/* Card top accent */}
          <div className="h-1.5 w-full bg-gradient-to-r from-green-400 via-emerald-500 to-green-600" />

          <div className="p-8 sm:p-10">
            {/* Logo + Title */}
            <div className="text-center mb-8">
              <div className="lg-logo inline-flex w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-700 items-center justify-center shadow-xl shadow-green-300/40 mb-5">
                <img src="/logo.png" alt="AppleKul™" className="w-14 h-14 object-contain" />
              </div>
              <h1 className="lg-fade-up lg-d0 text-3xl font-extrabold text-gray-900 tracking-tight">AppleKul™ Suite</h1>
              <p className="lg-fade-up lg-d1 text-sm text-gray-500 mt-1.5">Sign in to manage your orchard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="lg-fade-up lg-d2 space-y-1.5">
                <label htmlFor="email" className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    id="email" type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="lg-input w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-sm"
                    placeholder="your.email@example.com" required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="lg-fade-up lg-d3 space-y-1.5">
                <label htmlFor="password" className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    id="password" type={showPassword ? 'text' : 'password'}
                    value={password} onChange={e => setPassword(e.target.value)}
                    className="lg-input w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl bg-gray-50 text-sm"
                    placeholder="Enter your password" required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {errorMessage && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  {errorMessage}
                </div>
              )}

              {/* Submit */}
              <div className="lg-fade-up lg-d4">
                <button
                  type="submit"
                  disabled={loading}
                  className="lg-btn w-full py-3.5 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-extrabold text-base shadow-lg shadow-green-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/signup" className="text-green-600 hover:text-green-700 font-bold">Sign Up</Link>
              </p>
              <p className="text-xs text-gray-400">
                Doctors are redirected to the Orchard Hospital portal automatically.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
