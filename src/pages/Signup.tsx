/**
 * Signup.tsx  — Dual Authentication: Email/Password OR Phone/OTP (SKUAST-style Premium Glassy UI)
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Phone, Mail, MapPin, Globe, DollarSign, Lock, Eye, EyeOff, Building2, X, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { validatePhone, formatPhoneForDisplay } from '../utils/phoneValidation';

const SIGNUP_STYLES = `
/* ─── Keyframes ─── */
@keyframes sgFadeUp {
  from { opacity:0; transform:translateY(24px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes sgFadeDown {
  from { opacity:0; transform:translateY(-18px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes sgScaleIn {
  from { opacity:0; transform:scale(0.90); }
  to   { opacity:1; transform:scale(1); }
}
@keyframes sgSlideRight {
  from { opacity:0; transform:translateX(-20px); }
  to   { opacity:1; transform:translateX(0); }
}
@keyframes sgGradShift {
  0%   { background-position:0% 50%; }
  50%  { background-position:100% 50%; }
  100% { background-position:0% 50%; }
}
@keyframes sgFloat {
  0%,100% { transform:translateY(0); }
  50%     { transform:translateY(-10px); }
}
@keyframes sgPulseRing {
  0%   { transform:scale(1);   opacity:0.8; }
  100% { transform:scale(1.6); opacity:0; }
}
@keyframes sgLeafSway {
  0%, 100% { transform: rotate(-4deg); }
  50%       { transform: rotate(4deg); }
}
@keyframes sgGlow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.3); }
  50%       { box-shadow: 0 0 0 14px rgba(34,197,94,0); }
}
@keyframes sgBlobDrift {
  0%, 100% { transform: translate(0,0) scale(1); }
  33%       { transform: translate(40px,-30px) scale(1.1); }
  66%       { transform: translate(-20px,20px) scale(0.95); }
}
@keyframes sgShimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}

/* ─── Animation helpers ─── */
.sg-fade-up   { animation: sgFadeUp   0.6s cubic-bezier(.22,1,.36,1) both; }
.sg-fade-down { animation: sgFadeDown 0.55s cubic-bezier(.22,1,.36,1) both; }
.sg-scale-in  { animation: sgScaleIn  0.5s  cubic-bezier(.22,1,.36,1) both; }
.sg-slide-r   { animation: sgSlideRight 0.5s cubic-bezier(.22,1,.36,1) both; }
.sg-float     { animation: sgFloat 4s ease-in-out infinite; }
.sg-glow      { animation: sgGlow 2.8s ease-in-out infinite; }
.sg-leaf      { display:inline-block; animation: sgLeafSway 3s ease-in-out infinite; transform-origin: bottom center; }

.sg-d0 { animation-delay:0s;   }
.sg-d1 { animation-delay:.08s; }
.sg-d2 { animation-delay:.16s; }
.sg-d3 { animation-delay:.24s; }
.sg-d4 { animation-delay:.32s; }
.sg-d5 { animation-delay:.40s; }
.sg-d6 { animation-delay:.48s; }

/* Animated gradient background */
.sg-bg {
  background: linear-gradient(135deg, #052e16, #064e3b, #065f46, #047857, #059669, #10b981, #34d399, #10b981, #047857, #052e16);
  background-size: 300% 300%;
  animation: sgGradShift 10s ease infinite;
}

/* Animated blobs */
.sg-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  animation: sgBlobDrift 12s ease-in-out infinite;
  pointer-events: none;
}

/* Solid white card — form is clearly visible */
.sg-card {
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(32px) saturate(1.6);
  -webkit-backdrop-filter: blur(32px) saturate(1.6);
  border: 1px solid rgba(255,255,255,0.95);
  box-shadow:
    0 24px 64px rgba(0,0,0,0.28),
    0 1px 0 rgba(255,255,255,0.9) inset;
}

/* Solid white input — clearly readable */
.sg-input {
  transition: border-color .18s ease, box-shadow .18s ease, background .18s ease;
  background: #ffffff;
  border: 1.5px solid #d1fae5;
  color: #064e3b;
}
.sg-input::placeholder { color: #9ca3af; }
.sg-input:focus {
  border-color: #10b981 !important;
  box-shadow: 0 0 0 3px rgba(16,185,129,0.18);
  background: #f0fdf4;
  outline: none;
}
.sg-input option { background: #f0fdf4; color: #064e3b; }

/* Glassy button */
.sg-btn {
  transition: transform .2s ease, box-shadow .2s ease;
}
.sg-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 12px 30px rgba(16,185,129,0.45);
}
.sg-btn:active:not(:disabled) { transform: translateY(0); }

/* Pulse indicator */
.sg-pulse::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(167,243,208,0.5);
  animation: sgPulseRing 1.6s cubic-bezier(.215,.61,.355,1) infinite;
}

/* Shimmer accent bar */
.sg-shimmer {
  background: linear-gradient(90deg, rgba(167,243,208,0.2) 25%, rgba(167,243,208,0.5) 50%, rgba(167,243,208,0.2) 75%);
  background-size: 400px 100%;
  animation: sgShimmer 2s ease-in-out infinite;
}

/* Label — dark green on white card */
.sg-label {
  color: #065f46;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* Section divider */
.sg-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(167,243,208,0.2), transparent);
  margin: 1.25rem 0;
}

/* Terms area — glassy green mirror with solid green tint */
.sg-terms {
  background: rgba(16,185,129,0.22);
  border: 1.5px solid rgba(52,211,153,0.5);
  backdrop-filter: blur(14px) saturate(1.4);
  -webkit-backdrop-filter: blur(14px) saturate(1.4);
  box-shadow: 0 2px 16px rgba(16,185,129,0.12), inset 0 1px 0 rgba(255,255,255,0.18);
  transition: background .18s ease, border-color .18s ease, box-shadow .18s ease;
}
.sg-terms:hover {
  background: rgba(16,185,129,0.32);
  border-color: rgba(52,211,153,0.8);
  box-shadow: 0 4px 24px rgba(16,185,129,0.22), inset 0 1px 0 rgba(255,255,255,0.22);
}

/* Role hint banner on solid card */
.sg-role-banner {
  background: #f0fdf4;
  border: 1px solid #d1fae5;
}

/* Auth method toggle */
.sg-auth-toggle {
  display: inline-flex;
  background: #f0fdf4;
  border: 1.5px solid #d1fae5;
  border-radius: 12px;
  padding: 4px;
}
.sg-auth-toggle button {
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s ease;
}
.sg-auth-toggle button.active {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  box-shadow: 0 2px 8px rgba(16,185,129,0.3);
}
.sg-auth-toggle button:not(.active) {
  color: #065f46;
}
`;

/* ── InputField helper ── */
const InputField = ({
  id, name, type = 'text', value, onChange, placeholder, required, icon: Icon, label, suffix, minLength
}: {
  id: string; name: string; type?: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; required?: boolean; icon?: React.ElementType;
  label: string; suffix?: React.ReactNode; minLength?: number;
}) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="sg-label block">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500 w-4 h-4" />}
      <input
        id={id} name={name} type={type} value={value} onChange={onChange}
        placeholder={placeholder} required={required} minLength={minLength}
        className={`sg-input w-full ${Icon ? 'pl-10' : 'pl-4'} ${suffix ? 'pr-12' : 'pr-4'} py-2.5 rounded-xl text-sm`}
      />
      {suffix && <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{suffix}</div>}
    </div>
  </div>
);

const Signup: React.FC = () => {
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    language: 'en',
    currency: 'INR',
    role: '',
    doctorType: '',
    farmName: '',
    khasraNumber: '',
    khataNumber: '',
    specialization: '',
    hospitalName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // OTP-related state (for phone auth)
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  // Phone validation state
  const [phoneValidation, setPhoneValidation] = useState<{ valid: boolean; message: string; formatted: string } | null>(null);

  const navigate = useNavigate();
  const { session } = useAuth();

  const isDoctor = formData.role === 'Doctor';
  const isGrower = formData.role === 'Grower';

  useEffect(() => {
    if (session) navigate('/dashboard', { replace: true });
  }, [navigate, session]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Validate phone in real-time if phone field is changed
    if (name === 'phone' && value.trim()) {
      const validation = validatePhone(value);
      setPhoneValidation(validation);
    } else if (name === 'phone') {
      setPhoneValidation(null);
    }
  };

  // Email/Password Signup
  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!acceptedTerms) { alert('Please accept the terms and conditions to continue.'); return; }
    if (formData.password !== formData.confirmPassword) { alert('Passwords do not match!'); return; }
    if (formData.password.length < 6) { alert('Password must be at least 6 characters long.'); return; }
    if (!formData.role) { alert('Please select a role.'); return; }
    if (isDoctor && (!formData.specialization.trim() || !formData.hospitalName.trim())) {
      alert('Please fill in Specialization and Hospital / Clinic Name.'); return;
    }
    if (!formData.email.trim()) { alert('Please enter a valid email.'); return; }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            phone: formData.phone,
            role: formData.role,
          }
        }
      });

      if (error) {
        setLoading(false);
        setErrorMessage(error.message);
        return;
      }

      if (data.user) {
        const userId = data.user.id;
        const profilePayload: Record<string, unknown> = {
          id: userId,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          whatsapp: formData.phone,
          address: formData.address,
          language: formData.language,
          currency: formData.currency,
          role: formData.role,
          doctor_type: isDoctor ? formData.doctorType : null,
          farm_name: isGrower ? formData.farmName : '',
          khasra_number: isGrower ? (formData.khasraNumber || null) : null,
          khata_number: isGrower ? (formData.khataNumber || null) : null,
        };

        const { error: profileError } = await supabase.from('profiles').upsert(profilePayload);
        if (profileError) {
          setLoading(false);
          setErrorMessage(profileError.message);
          return;
        }

        if (isDoctor) {
          const { error: doctorError } = await supabase.from('doctors').insert({
            user_id: userId,
            name: formData.name,
            specialization: formData.specialization,
            hospital_name: formData.hospitalName,
            phone: formData.phone || null,
            email: formData.email || null,
            available: true,
          });
          if (doctorError) console.warn('Doctor profile creation failed during signup:', doctorError.message);
        }
      }

      setLoading(false);
      alert('Signup successful! Please check your email for verification.');
      navigate('/login');
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err.message || 'Signup failed');
    }
  };

  // Phone OTP Signup - Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!acceptedTerms) { alert('Please accept the terms and conditions to continue.'); return; }
    if (formData.password !== formData.confirmPassword) { alert('Passwords do not match!'); return; }
    if (formData.password.length < 6) { alert('Password must be at least 6 characters long.'); return; }
    if (!formData.role) { alert('Please select a role.'); return; }
    if (isDoctor && (!formData.specialization.trim() || !formData.hospitalName.trim())) {
      alert('Please fill in Specialization and Hospital / Clinic Name.'); return;
    }
    if (!formData.phone.trim()) {
      alert('Please enter a valid phone number.'); return;
    }

    // Validate phone number format
    const validation = validatePhone(formData.phone);
    if (!validation.valid) {
      setErrorMessage(validation.message);
      return;
    }

    setLoading(true);

    // ══════════════════════════════════════════════════════════════
    // TWILIO OTP INTEGRATION
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

      // Update formData with formatted phone
      setFormData(prev => ({ ...prev, phone: validation.formatted }));
      setOtpSent(true);
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err.message || 'Failed to send OTP');
    }
    // ══════════════════════════════════════════════════════════════
  };

  // Phone OTP Signup - Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    // ══════════════════════════════════════════════════════════════
    // VERIFY OTP WITH SUPABASE
    // ══════════════════════════════════════════════════════════════
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formData.phone, // Already formatted from handleSendOtp
        token: otp,
        type: 'sms',
      });

      if (error) {
        setLoading(false);
        setErrorMessage(error.message);
        return;
      }

      if (data.user) {
        const userId = data.user.id;
        const profilePayload: Record<string, unknown> = {
          id: userId,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          whatsapp: formData.phone,
          address: formData.address,
          language: formData.language,
          currency: formData.currency,
          role: formData.role,
          doctor_type: isDoctor ? formData.doctorType : null,
          farm_name: isGrower ? formData.farmName : '',
          khasra_number: isGrower ? (formData.khasraNumber || null) : null,
          khata_number: isGrower ? (formData.khataNumber || null) : null,
        };

        const { error: profileError } = await supabase.from('profiles').upsert(profilePayload);
        if (profileError) {
          setLoading(false);
          setErrorMessage(profileError.message);
          return;
        }

        if (isDoctor) {
          const { error: doctorError } = await supabase.from('doctors').insert({
            user_id: userId,
            name: formData.name,
            specialization: formData.specialization,
            hospital_name: formData.hospitalName,
            phone: formData.phone || null,
            email: formData.email || null,
            available: true,
          });
          if (doctorError) console.warn('Doctor profile creation failed during signup:', doctorError.message);
        }
      }

      setLoading(false);
      navigate('/dashboard');
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err.message || 'Failed to verify OTP');
    }
    // ══════════════════════════════════════════════════════════════
  };

  return (
    <>
      <style>{SIGNUP_STYLES}</style>
      <div className="min-h-screen sg-bg flex items-center justify-center p-4 relative overflow-hidden">

        {/* ── Animated background blobs ── */}
        <div className="sg-blob w-[32rem] h-[32rem] bg-emerald-400/15 top-[-8rem] left-[-8rem]" style={{ animationDuration: '14s' }} />
        <div className="sg-blob w-80 h-80 bg-teal-500/15 bottom-[-4rem] right-[-4rem]" style={{ animationDuration: '18s', animationDelay: '3s' }} />
        <div className="sg-blob w-56 h-56 bg-green-300/15 top-1/2 right-20" style={{ animationDuration: '10s', animationDelay: '6s' }} />
        <div className="sg-blob w-40 h-40 bg-emerald-700/20 bottom-24 left-24" style={{ animationDuration: '16s', animationDelay: '1s' }} />

        {/* ── Decorative grid lines ── */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        {/* ── Glassy Card ── */}
        <div className="sg-scale-in sg-card w-full max-w-2xl rounded-3xl overflow-hidden my-6 relative z-10">
          {/* Shimmer top accent */}
          <div className="h-1 w-full sg-shimmer" />

          <div className="p-7 sm:p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="sg-float sg-glow inline-block rounded-full  mb-2">
                <img src="/logo.png" alt="AppleKul™" className="w-24 h-24 object-contain mx-auto" />
              </div>
              <div className="sg-fade-down sg-d0 text-lg font-extrabold tracking-wide mb-3" style={{ color: '#5a7a3a', fontFamily: 'Georgia, serif' }}>
                AppleKul One
              </div>

              <h1 className="sg-fade-up sg-d1 text-3xl font-extrabold text-gray-900 tracking-tight">
                <span className="sg-leaf"></span> Create Your Account
              </h1>
              <p className="sg-fade-up sg-d2 text-sm text-emerald-700 mt-1.5 font-semibold">
                {otpSent ? 'Verify OTP to complete signup' : 'Join AppleKul™ One to manage your orchard'}
              </p>
            </div>

            {/* Auth Method Toggle */}
            {!otpSent && (
              <div className="sg-fade-up sg-d1 flex justify-center mb-6">
                <div className="sg-auth-toggle">
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

            {!otpSent ? (
              <form onSubmit={authMethod === 'email' ? handleEmailSignup : handleSendOtp} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                  {/* Role selector */}
                  <div className="space-y-1.5 sg-slide-r sg-d1">
                    <label htmlFor="role" className="sg-label block">
                      Role <span className="text-red-400">*</span>
                    </label>
                    <select id="role" name="role" value={formData.role} onChange={handleChange}
                      className="sg-input w-full px-4 py-2.5 rounded-xl text-sm appearance-none" required>
                      <option value="">Select Role…</option>
                      <option value="Doctor">Doctor / Agronomist</option>
                      <option value="Grower">Grower / Farmer</option>
                    </select>
                  </div>

                  {/* Doctor: specialization */}
                  {isDoctor && (
                    <div className="sg-fade-up">
                      <InputField id="specialization" name="specialization" value={formData.specialization}
                        onChange={handleChange} label="Specialization" placeholder="e.g. Plant Pathology" required={isDoctor} />
                    </div>
                  )}

                  {/* Doctor: hospital name */}
                  {isDoctor && (
                    <div className="md:col-span-2 sg-fade-up">
                      <InputField id="hospitalName" name="hospitalName" value={formData.hospitalName}
                        onChange={handleChange} label="Hospital / Clinic Name" icon={Building2}
                        placeholder="e.g. Orchard Hospital Kashmir" required={isDoctor} />
                    </div>
                  )}

                  {/* Full Name */}
                  <div className="sg-slide-r sg-d2">
                    <InputField id="name" name="name" value={formData.name} onChange={handleChange}
                      label="Full Name" icon={User}
                      placeholder={isDoctor ? 'Dr. Full Name' : 'Enter your full name'} required />
                  </div>

                  {/* Email (required for email auth, optional for phone auth) */}
                  <div className="sg-slide-r sg-d3">
                    <InputField id="email" name="email" type="email" value={formData.email}
                      onChange={handleChange}
                      label={authMethod === 'email' ? 'Email Address' : 'Email Address (Optional)'}
                      icon={Mail}
                      placeholder="your.email@example.com"
                      required={authMethod === 'email'} />
                  </div>

                  {/* Phone Number (required for phone auth, optional for email auth) */}
                  <div className="sg-slide-r sg-d2 space-y-2">
                    <InputField id="phone" name="phone" type="tel" value={formData.phone}
                      onChange={handleChange}
                      label={authMethod === 'phone' ? 'Phone Number' : 'Phone Number (Optional)'}
                      icon={Phone}
                      placeholder="+911234567890"
                      required={authMethod === 'phone'} />
                    {phoneValidation && formData.phone.trim() && (
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

                  {/* Grower: Farm Name */}
                  {isGrower && (
                    <div className="sg-fade-up">
                      <InputField id="farmName" name="farmName" value={formData.farmName}
                        onChange={handleChange} label="Farm Name" icon={Building2}
                        placeholder="Your farm / orchard name" required={isGrower} />
                    </div>
                  )}

                  {/* Language */}
                  <div className="space-y-1.5 sg-slide-r sg-d3">
                    <label htmlFor="language" className="sg-label block">
                      Preferred Language <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500 w-4 h-4" />
                      <select id="language" name="language" value={formData.language} onChange={handleChange}
                        className="sg-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm appearance-none" required>
                        <option value="en">English</option>
                        <option value="hi">Hindi (हिंदी)</option>
                        <option value="pa">Punjabi (ਪੰਜਾਬੀ)</option>
                        <option value="ur">Urdu (اردو)</option>
                        <option value="bn">Bengali (বাংলা)</option>
                      </select>
                    </div>
                  </div>

                  {/* Password */}
                  <div className="sg-slide-r sg-d3">
                    <InputField id="password" name="password" type={showPassword ? 'text' : 'password'}
                      value={formData.password} onChange={handleChange}
                      label="Password" icon={Lock} placeholder="Min. 6 characters" required minLength={6}
                      suffix={
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="text-emerald-500 hover:text-emerald-700 transition-colors">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      } />
                  </div>

                  {/* Confirm Password */}
                  <div className="sg-slide-r sg-d3">
                    <InputField id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword} onChange={handleChange}
                      label="Confirm Password" icon={Lock} placeholder="Re-enter password" required
                      suffix={
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="text-emerald-500 hover:text-emerald-700 transition-colors">
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      } />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-1.5 sg-fade-up sg-d3">
                  <label htmlFor="address" className="sg-label block">
                    Address <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3 text-emerald-500 w-4 h-4" />
                    <textarea id="address" name="address" value={formData.address} onChange={handleChange}
                      rows={3} placeholder="Enter your complete address" required
                      className="sg-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm resize-none" />
                  </div>
                </div>

                {/* Grower: Khasra & Khata */}
                {isGrower && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sg-fade-up">
                    <InputField id="khasraNumber" name="khasraNumber" value={formData.khasraNumber}
                      onChange={handleChange} label="Khasra Number" placeholder="Khasra number" />
                    <InputField id="khataNumber" name="khataNumber" value={formData.khataNumber}
                      onChange={handleChange} label="Khata Number" placeholder="Khata number" />
                  </div>
                )}

                {/* Currency */}
                <div className="space-y-1.5 sg-fade-up sg-d4">
                  <label htmlFor="currency" className="sg-label block">
                    Currency <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500 w-4 h-4" />
                    <select id="currency" name="currency" value={formData.currency} onChange={handleChange}
                      className="sg-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm appearance-none" required>
                      <option value="INR">INR - Indian Rupee (₹)</option>
                      <option value="USD">USD - US Dollar ($)</option>
                      <option value="EUR">EUR - Euro (€)</option>
                      <option value="GBP">GBP - British Pound (£)</option>
                      <option value="PKR">PKR - Pakistani Rupee (Rs)</option>
                    </select>
                  </div>
                </div>

                {/* Role hint banners */}
                {isDoctor && (
                  <div className="sg-fade-up sg-role-banner flex items-start gap-3 rounded-2xl px-4 py-3.5 text-sm text-blue-700">
                    <span className="text-xl shrink-0">🩺</span>
                    <div>
                      <p className="font-bold text-blue-900">Registering as Doctor</p>
                      <p className="text-xs mt-0.5 text-blue-600">You will see the Orchard Hospital doctor portal. Farm/field management sections are not shown for doctors.</p>
                    </div>
                  </div>
                )}
                {isGrower && (
                  <div className="sg-fade-up sg-role-banner flex items-start gap-3 rounded-2xl px-4 py-3.5 text-sm text-emerald-700">
                    <span className="text-xl shrink-0">🌾</span>
                    <div>
                      <p className="font-bold text-emerald-900">Registering as Grower</p>
                      <p className="text-xs mt-0.5 text-emerald-600">Full access to orchard management, map viewer, and doctor consultations.</p>
                    </div>
                  </div>
                )}

                {/* Terms */}
                <label className="sg-fade-up sg-terms flex items-start gap-3 p-4 rounded-2xl transition-colors cursor-pointer">
                  <input type="checkbox" id="terms" checked={acceptedTerms}
                    onChange={e => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded accent-emerald-400" required />
                  <span className="text-sm font-semibold" style={{ color: '#052e16' }}>
                    I agree to the{' '}
                    <button type="button" onClick={() => setShowTermsModal(true)}
                      className="font-extrabold underline underline-offset-2 transition-colors"
                      style={{ color: '#065f46' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#000')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#065f46')}>
                      Terms and Conditions
                    </button>
                    {' '}and{' '}
                    <button type="button" onClick={() => setShowTermsModal(true)}
                      className="font-extrabold underline underline-offset-2 transition-colors"
                      style={{ color: '#065f46' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#000')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#065f46')}>
                      Privacy Policy
                    </button>
                  </span>
                </label>

                {errorMessage && (
                  <div className="sg-fade-up flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                    {errorMessage}
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="sg-btn w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-extrabold text-base shadow-lg shadow-emerald-900/40 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-emerald-400/30">
                  {loading ? (
                    <><span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      {authMethod === 'email' ? 'Signing up…' : 'Sending OTP…'}
                    </>
                  ) : authMethod === 'email' ? 'Sign Up' : 'Send OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="sg-fade-up text-center">
                  <p className="text-sm text-emerald-700 mb-4">
                    We've sent an OTP to <strong>{formData.phone}</strong>
                  </p>

                  {/* OTP Input */}
                  <div className="space-y-1.5">
                    <label htmlFor="otp" className="sg-label block">
                      Enter OTP <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="otp"
                      type="text"
                      value={otp}
                      onChange={e => setOtp(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                      required
                      maxLength={6}
                      className="sg-input w-full px-4 py-2.5 rounded-xl text-sm text-center text-2xl tracking-widest"
                    />
                  </div>
                </div>

                {errorMessage && (
                  <div className="sg-fade-up flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                    {errorMessage}
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="sg-btn w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-extrabold text-base shadow-lg shadow-emerald-900/40 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-emerald-400/30">
                  {loading ? (
                    <><span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />Verifying…</>
                  ) : 'Verify OTP'}
                </button>

                <button type="button" onClick={() => setOtpSent(false)}
                  className="w-full text-sm text-emerald-600 hover:text-emerald-800 font-semibold transition-colors">
                  ← Back to signup
                </button>
              </form>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-700">
                Already have an account?{' '}
                <Link to="/login" className="text-emerald-600 hover:text-emerald-800 font-bold transition-colors">Sign In</Link>
              </p>
            </div>
          </div>

          {/* Card bottom shimmer accent */}
          <div className="h-0.5 w-full sg-shimmer opacity-50" />
        </div>
      </div>

      {/* ── Terms Modal ── */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowTermsModal(false)} />
          <div className="sg-scale-in relative w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-3xl p-7 z-10"
               style={{
                 background: 'rgba(16,185,129,0.22)',
                 backdropFilter: 'blur(28px) saturate(1.6)',
                 WebkitBackdropFilter: 'blur(28px) saturate(1.6)',
                 border: '1.5px solid rgba(52,211,153,0.45)',
                 boxShadow: '0 24px 64px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.25)',
               }}>
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-3xl sg-shimmer opacity-70"/>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-extrabold" style={{ color: '#052e16' }}>Terms and Conditions</h2>
              <button onClick={() => setShowTermsModal(false)}
                className="p-2 rounded-xl bg-white/40 hover:bg-white/60 border border-white/50 transition-colors">
                <X className="w-4 h-4" style={{ color: '#052e16' }} />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              {[
                { title: '1. Acceptance of Terms', body: 'By creating an account with AppleKul™ One, you agree to be bound by these Terms and Conditions.' },
                { title: '2. Use of Service', body: 'AppleKul™ One provides orchard management tools and services for lawful purposes only.' },
                { title: '3. User Account', body: 'You are responsible for maintaining the confidentiality of your account credentials.' },
                { title: '4. Data Privacy', body: 'We collect and process your personal data in accordance with our Privacy Policy.' },
                { title: '5. Contact Information', body: 'Questions? Contact us at apl@applekul.com' },
              ].map(s => (
                <div key={s.title} className="p-4 rounded-xl border"
                     style={{ background: 'rgba(255,255,255,0.45)', borderColor: 'rgba(52,211,153,0.5)', backdropFilter: 'blur(8px)' }}>
                  <h3 className="font-bold mb-1" style={{ color: '#052e16' }}>{s.title}</h3>
                  <p style={{ color: '#064e3b' }}>{s.body}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setShowTermsModal(false)}
                className="sg-btn px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold text-sm border border-emerald-400/30 shadow-lg shadow-emerald-900/20">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Signup;
