/**
 * Login.tsx  — Dual Authentication: Email/Password OR Phone/OTP (SKUAST-style Premium UI)
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Phone, Mail, Eye, EyeOff, Lock, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { validatePhone, formatPhoneForDisplay } from '../utils/phoneValidation';

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

/* Auth method toggle */
.lg-auth-toggle {
  display: inline-flex;
  background: #f0fdf4;
  border: 1.5px solid #d1fae5;
  border-radius: 12px;
  padding: 4px;
}
.lg-auth-toggle button {
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s ease;
}
.lg-auth-toggle button.active {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  box-shadow: 0 2px 8px rgba(16,185,129,0.3);
}
.lg-auth-toggle button:not(.active) {
  color: #065f46;
}
`;

const Login: React.FC = () => {
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { session, userRole } = useAuth();

  // Phone validation state
  const [phoneValidation, setPhoneValidation] = useState<{ valid: boolean; message: string; formatted: string } | null>(null);

  useEffect(() => {
    if (!session) return;
    if (userRole === 'Doctor') {
      navigate('/orchard-doctor', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate, session, userRole]);

  // Email/Password Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

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
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err.message || 'Login failed');
    }
  };

  // Phone OTP Login - Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!phone.trim()) {
      setErrorMessage('Please enter a valid phone number');
      return;
    }

    // Validate phone number format
    const validation = validatePhone(phone);
    if (!validation.valid) {
      setErrorMessage(validation.message);
      return;
    }

    setLoading(true);

    // ══════════════════════════════════════════════════════════════
    // SEND OTP VIA SUPABASE + TWILIO
    // ══════════════════════════════════════════════════════════════
    try {
      // Use the formatted phone number in E.164 format
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: validation.formatted,
        options: {
          channel: 'sms',
        },
      });

      if (error) {
        setLoading(false);
        setErrorMessage(error.message);
        return;
      }

      // Update phone with formatted version
      setPhone(validation.formatted);
      setOtpSent(true);
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err.message || 'Failed to send OTP');
    }
    // ══════════════════════════════════════════════════════════════
  };

  // Phone OTP Login - Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    // ══════════════════════════════════════════════════════════════
    // VERIFY OTP WITH SUPABASE
    // ══════════════════════════════════════════════════════════════
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone, // Already formatted from handleSendOtp
        token: otp,
        type: 'sms',
      });

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
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err.message || 'Failed to verify OTP');
    }
    // ══════════════════════════════════════════════════════════════
  };

  // Handle phone change with validation
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhone(value);

    if (value.trim()) {
      const validation = validatePhone(value);
      setPhoneValidation(validation);
    } else {
      setPhoneValidation(null);
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
                <span className="lg-leaf"></span> Welcome Back
              </h1>
              <p className="lg-fade-up lg-d2 text-sm text-emerald-700 mt-1.5 font-semibold">
                {otpSent ? 'Verify OTP to login' : 'Sign in to manage your orchard'}
              </p>
            </div>

            {/* Auth Method Toggle */}
            {!otpSent && (
              <div className="lg-fade-up lg-d1 flex justify-center mb-6">
                <div className="lg-auth-toggle">
                  <button
                    type="button"
                    className={authMethod === 'email' ? 'active' : ''}
                    onClick={() => setAuthMethod('email')}
                  >
                    <Mail className="w-4 h-4 inline-block mr-2" />
                    Email
                  </button>
                  <button
                    type="button"
                    className={authMethod === 'phone' ? 'active' : ''}
                    onClick={() => setAuthMethod('phone')}
                  >
                    <Phone className="w-4 h-4 inline-block mr-2" />
                    Phone
                  </button>
                </div>
              </div>
            )}

            {/* Email/Password Form */}
            {!otpSent && authMethod === 'email' && (
              <form onSubmit={handleEmailLogin} className="space-y-5">
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
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="lg-input w-full pl-10 pr-12 py-3 rounded-xl text-sm"
                      placeholder="Enter your password" required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500 hover:text-emerald-700 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {errorMessage && (
                  <div className="lg-fade-up flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
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
                        Signing in…
                      </>
                    ) : 'Sign In'}
                  </button>
                </div>
              </form>
            )}

            {/* Phone OTP Form - Send OTP */}
            {!otpSent && authMethod === 'phone' && (
              <form onSubmit={handleSendOtp} className="space-y-5">
                {/* Phone Number */}
                <div className="lg-slide-r lg-d2 space-y-2">
                  <label htmlFor="phone" className="block text-xs font-bold text-emerald-800 uppercase tracking-wide">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500 w-4 h-4" />
                    <input
                      id="phone" type="tel" value={phone}
                      onChange={handlePhoneChange}
                      className="lg-input w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                      placeholder="+911234567890" required
                    />
                  </div>
                  {phoneValidation && phone.trim() && (
                    <div className={`flex items-start gap-2 px-3 py-2 rounded-lg text-xs ${
                      phoneValidation.valid
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                        : 'bg-amber-50 border border-amber-200 text-amber-700'
                    }`}>
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold">{phoneValidation.message}</p>
                        {phoneValidation.valid && (
                          <p className="mt-0.5 opacity-80">Formatted: {formatPhoneForDisplay(phoneValidation.formatted)}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Error */}
                {errorMessage && (
                  <div className="lg-fade-up flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
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
                        Sending OTP…
                      </>
                    ) : 'Send OTP'}
                  </button>
                </div>
              </form>
            )}

            {/* Phone OTP Form - Verify OTP */}
            {otpSent && (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="lg-fade-up text-center">
                  <p className="text-sm text-emerald-700 mb-4">
                    We've sent an OTP to <strong>{phone}</strong>
                  </p>

                  {/* OTP Input */}
                  <div className="space-y-1.5">
                    <label htmlFor="otp" className="block text-xs font-bold text-emerald-800 uppercase tracking-wide">
                      Enter OTP
                    </label>
                    <input
                      id="otp"
                      type="text"
                      value={otp}
                      onChange={e => setOtp(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                      required
                      maxLength={6}
                      className="lg-input w-full px-4 py-2.5 rounded-xl text-sm text-center text-2xl tracking-widest"
                    />
                  </div>
                </div>

                {/* Error */}
                {errorMessage && (
                  <div className="lg-fade-up flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
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
                        Verifying…
                      </>
                    ) : 'Verify OTP'}
                  </button>
                </div>

                <button type="button" onClick={() => setOtpSent(false)}
                  className="w-full text-sm text-emerald-600 hover:text-emerald-800 font-semibold transition-colors">
                  ← Back to phone number
                </button>
              </form>
            )}

            {/* Footer links */}
            <div className="lg-fade-up lg-d5 mt-7 text-center space-y-3">
              <p className="text-sm text-gray-700 font-medium">
                Don't have an account?{' '}
                <Link to="/signup" className="text-emerald-600 hover:text-emerald-800 font-bold transition-colors underline underline-offset-2">Sign Up</Link>
              </p>
              <p className="text-xs text-gray-400 font-medium">
                © 2026 AppleKul™. All rights reserved.
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
