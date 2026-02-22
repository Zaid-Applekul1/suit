/**
 * Signup.tsx  — RBAC-aware registration (Enhanced UI)
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Phone, Mail, MapPin, Globe, DollarSign, Lock, Eye, EyeOff, Building2, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const SIGNUP_STYLES = `
@keyframes sgFadeUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
@keyframes sgScaleIn { from{opacity:0;transform:scale(0.93)} to{opacity:1;transform:scale(1)} }
@keyframes sgGradShift {
  0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%}
}
@keyframes sgFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
.sg-fade-up  { animation: sgFadeUp  0.55s cubic-bezier(.22,1,.36,1) both }
.sg-scale-in { animation: sgScaleIn 0.45s cubic-bezier(.22,1,.36,1) both }
.sg-d0{animation-delay:0s} .sg-d1{animation-delay:.07s} .sg-d2{animation-delay:.14s}
.sg-d3{animation-delay:.21s} .sg-d4{animation-delay:.28s}
.sg-bg {
  background: linear-gradient(135deg,#064e3b,#065f46,#047857,#059669,#10b981,#34d399,#10b981,#047857);
  background-size:300% 300%;
  animation: sgGradShift 10s ease infinite;
}
.sg-logo { animation: sgFloat 4s ease-in-out infinite }
.sg-input {
  transition: border-color .18s ease, box-shadow .18s ease, background .18s ease;
}
.sg-input:focus {
  border-color: #16a34a !important;
  box-shadow: 0 0 0 3px rgba(22,163,74,0.15);
  background: #f0fdf4;
  outline: none;
}
.sg-btn {
  transition: transform .2s ease, box-shadow .2s ease;
}
.sg-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(22,163,74,0.35);
}
.sg-card {
  background: rgba(255,255,255,0.97);
  backdrop-filter: blur(20px);
}
`;

const InputField = ({
  id, name, type = 'text', value, onChange, placeholder, required, icon: Icon, label, suffix, minLength
}: {
  id: string; name: string; type?: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; required?: boolean; icon?: React.ElementType;
  label: string; suffix?: React.ReactNode; minLength?: number;
}) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />}
      <input
        id={id} name={name} type={type} value={value} onChange={onChange}
        placeholder={placeholder} required={required} minLength={minLength}
        className={`sg-input w-full ${Icon ? 'pl-10' : 'pl-4'} ${suffix ? 'pr-12' : 'pr-4'} py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm`}
      />
      {suffix && <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{suffix}</div>}
    </div>
  </div>
);

const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '', whatsapp: '', email: '', password: '', confirmPassword: '',
    address: '', language: 'en', currency: 'INR', role: '', doctorType: '',
    farmName: '', khasraNumber: '', khataNumber: '',
    specialization: '', hospitalName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!acceptedTerms) { alert('Please accept the terms and conditions to continue.'); return; }
    if (formData.password !== formData.confirmPassword) { alert('Passwords do not match!'); return; }
    if (formData.password.length < 6) { alert('Password must be at least 6 characters long.'); return; }
    if (!formData.role) { alert('Please select a role.'); return; }
    if (isDoctor && (!formData.specialization.trim() || !formData.hospitalName.trim())) {
      alert('Please fill in Specialization and Hospital / Clinic Name.'); return;
    }
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: formData.email, password: formData.password,
      options: { data: { name: formData.name, phone: formData.whatsapp, role: formData.role, doctorType: isDoctor ? formData.doctorType : undefined } },
    });

    if (error) { setLoading(false); setErrorMessage(error.message); return; }

    if (data.user) {
      const userId = data.user.id;
      const profilePayload: Record<string, unknown> = {
        id: userId, name: formData.name, email: formData.email,
        phone: formData.whatsapp, whatsapp: formData.whatsapp,
        address: formData.address, language: formData.language,
        currency: formData.currency, role: formData.role,
        doctor_type: isDoctor ? formData.doctorType : null,
        farm_name: isGrower ? formData.farmName : '',
        khasra_number: isGrower ? (formData.khasraNumber || null) : null,
        khata_number: isGrower ? (formData.khataNumber || null) : null,
      };
      const { error: profileError } = await supabase.from('profiles').upsert(profilePayload);
      if (profileError) { setLoading(false); setErrorMessage(profileError.message); return; }

      if (isDoctor) {
        const { error: doctorError } = await supabase.from('doctors').insert({
          user_id: userId, name: formData.name, specialization: formData.specialization,
          hospital_name: formData.hospitalName, phone: formData.whatsapp || null,
          email: formData.email || null, available: true,
        });
        if (doctorError) console.warn('Doctor profile creation failed during signup:', doctorError.message);
      }
    }
    setLoading(false);
    navigate('/login');
  };

  return (
    <>
      <style>{SIGNUP_STYLES}</style>
      <div className="min-h-screen sg-bg flex items-center justify-center p-4 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-white/5 pointer-events-none" />

        <div className="sg-scale-in sg-card w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-6">
          {/* Top accent bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-green-400 via-emerald-500 to-green-600" />

          <div className="p-7 sm:p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="sg-logo inline-flex w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-700 items-center justify-center shadow-xl shadow-green-300/40 mb-5">
                <img src="/logo.png" alt="AppleKul™" className="w-14 h-14 object-contain" />
              </div>
              <h1 className="sg-fade-up sg-d0 text-3xl font-extrabold text-gray-900 tracking-tight">Create Your Account</h1>
              <p className="sg-fade-up sg-d1 text-sm text-gray-500 mt-1.5">Join AppleKul™ Suite to manage your orchard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* Role selector */}
                <div className="space-y-1.5 sg-fade-up sg-d1">
                  <label htmlFor="role" className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Role <span className="text-red-400">*</span>
                  </label>
                  <select id="role" name="role" value={formData.role} onChange={handleChange}
                    className="sg-input w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm appearance-none"
                    required>
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
                <div className="sg-fade-up sg-d2">
                  <InputField id="name" name="name" value={formData.name} onChange={handleChange}
                    label="Full Name" icon={User}
                    placeholder={isDoctor ? 'Dr. Full Name' : 'Enter your full name'} required />
                </div>

                {/* WhatsApp */}
                <div className="sg-fade-up sg-d2">
                  <InputField id="whatsapp" name="whatsapp" type="tel" value={formData.whatsapp}
                    onChange={handleChange} label="WhatsApp Number" icon={Phone}
                    placeholder="+91 1234567890" required />
                </div>

                {/* Email */}
                <div className="sg-fade-up sg-d3">
                  <InputField id="email" name="email" type="email" value={formData.email}
                    onChange={handleChange} label="Email Address" icon={Mail}
                    placeholder="your.email@example.com" required />
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
                <div className="space-y-1.5 sg-fade-up sg-d3">
                  <label htmlFor="language" className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Preferred Language <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <select id="language" name="language" value={formData.language} onChange={handleChange}
                      className="sg-input w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm appearance-none" required>
                      <option value="en">English</option>
                      <option value="hi">Hindi (हिंदी)</option>
                      <option value="pa">Punjabi (ਪੰਜਾਬੀ)</option>
                      <option value="ur">Urdu (اردو)</option>
                      <option value="bn">Bengali (বাংলা)</option>
                    </select>
                  </div>
                </div>

                {/* Password */}
                <div className="sg-fade-up sg-d3">
                  <InputField id="password" name="password" type={showPassword ? 'text' : 'password'}
                    value={formData.password} onChange={handleChange}
                    label="Password" icon={Lock} placeholder="Min. 6 characters" required minLength={6}
                    suffix={
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-400 hover:text-gray-600 transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    } />
                </div>

                {/* Confirm Password */}
                <div className="sg-fade-up sg-d3">
                  <InputField id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword} onChange={handleChange}
                    label="Confirm Password" icon={Lock} placeholder="Re-enter password" required
                    suffix={
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-gray-400 hover:text-gray-600 transition-colors">
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    } />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1.5 sg-fade-up sg-d3">
                <label htmlFor="address" className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Address <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 text-gray-400 w-4 h-4" />
                  <textarea id="address" name="address" value={formData.address} onChange={handleChange}
                    rows={3} placeholder="Enter your complete address" required
                    className="sg-input w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm resize-none" />
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
                <label htmlFor="currency" className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Currency <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select id="currency" name="currency" value={formData.currency} onChange={handleChange}
                    className="sg-input w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm appearance-none" required>
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
                <div className="sg-fade-up flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3.5 text-sm text-blue-800">
                  <span className="text-xl shrink-0">🩺</span>
                  <div>
                    <p className="font-bold">Registering as Doctor</p>
                    <p className="text-xs mt-0.5 text-blue-600">You will see the Orchard Hospital doctor portal. Farm/field management sections are not shown for doctors.</p>
                  </div>
                </div>
              )}
              {isGrower && (
                <div className="sg-fade-up flex items-start gap-3 bg-green-50 border border-green-200 rounded-2xl px-4 py-3.5 text-sm text-green-800">
                  <span className="text-xl shrink-0">🌿</span>
                  <div>
                    <p className="font-bold">Registering as Grower</p>
                    <p className="text-xs mt-0.5 text-green-600">Full access to orchard management, map viewer, and doctor consultations.</p>
                  </div>
                </div>
              )}

              {/* Terms */}
              <label className="sg-fade-up flex items-start gap-3 p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 hover:border-green-300 hover:bg-green-50/30 transition-colors cursor-pointer">
                <input type="checkbox" id="terms" checked={acceptedTerms}
                  onChange={e => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-green-600" required />
                <span className="text-sm text-gray-700">
                  I agree to the{' '}
                  <button type="button" onClick={() => setShowTermsModal(true)}
                    className="text-green-600 hover:text-green-700 font-bold underline">Terms and Conditions</button>
                  {' '}and{' '}
                  <button type="button" onClick={() => setShowTermsModal(true)}
                    className="text-green-600 hover:text-green-700 font-bold underline">Privacy Policy</button>
                </span>
              </label>

              {errorMessage && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  {errorMessage}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="sg-btn w-full py-3.5 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-extrabold text-base shadow-lg shadow-green-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {loading ? (
                  <><span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />Creating Account…</>
                ) : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-green-600 hover:text-green-700 font-bold">Sign In</Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowTermsModal(false)} />
          <div className="sg-scale-in relative bg-white w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-3xl shadow-2xl p-7">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-extrabold text-gray-900">Terms and Conditions</h2>
              <button onClick={() => setShowTermsModal(false)}
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4 text-sm text-gray-700">
              {[
                { title: '1. Acceptance of Terms', body: 'By creating an account with AppleKul™ Suite, you agree to be bound by these Terms and Conditions.' },
                { title: '2. Use of Service', body: 'AppleKul™ Suite provides orchard management tools and services for lawful purposes only.' },
                { title: '3. User Account', body: 'You are responsible for maintaining the confidentiality of your account credentials.' },
                { title: '4. Data Privacy', body: 'We collect and process your personal data in accordance with our Privacy Policy.' },
                { title: '5. Contact Information', body: 'Questions? Contact us at apl@applekul.com' },
              ].map(s => (
                <div key={s.title} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-1">{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setShowTermsModal(false)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-sm">
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
