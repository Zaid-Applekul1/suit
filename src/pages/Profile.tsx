/**
 * Profile.tsx — RBAC-aware profile editor
 *
 * RBAC rules:
 * - Growers see all fields: name, email, phone, farmName, khasraNumber, khataNumber, avatar
 * - Doctors see: name, email, phone, avatar only  (no farmName / land parcel fields)
 * - Role badge shown at top so the user knows which mode they are in
 */

import React, { useEffect, useState, useRef } from 'react';
import { User, Mail, Phone, Building, Save, Upload, FileText, Stethoscope } from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import TeamManagement from './TeamManagement';

const PROFILE_STYLES = `
@keyframes pfFadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
@keyframes pfScaleIn { from{opacity:0;transform:scale(0.93)} to{opacity:1;transform:scale(1)} }
@keyframes pfGradShift {
  0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%}
}
@keyframes pfFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
@keyframes pfPulse { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.25)} 50%{box-shadow:0 0 0 8px rgba(34,197,94,0)} }
.pf-fade-up  { animation: pfFadeUp  0.55s cubic-bezier(.22,1,.36,1) both }
.pf-scale-in { animation: pfScaleIn 0.45s cubic-bezier(.22,1,.36,1) both }
.pf-d0{animation-delay:0s} .pf-d1{animation-delay:.07s} .pf-d2{animation-delay:.14s} .pf-d3{animation-delay:.21s}
.pf-hero {
  background: linear-gradient(135deg,#064e3b,#065f46,#047857,#059669,#10b981,#34d399,#10b981,#047857);
  background-size:300% 300%;
  animation: pfGradShift 8s ease infinite;
}
.pf-hero-blue {
  background: linear-gradient(135deg,#1e3a5f,#1e40af,#1d4ed8,#2563eb,#3b82f6,#60a5fa,#3b82f6,#1d4ed8);
  background-size:300% 300%;
  animation: pfGradShift 8s ease infinite;
}
.pf-avatar {
  transition: transform .22s ease, box-shadow .22s ease;
  animation: pfPulse 2.8s ease-in-out infinite;
}
.pf-avatar:hover { transform: scale(1.06); }
.pf-input {
  transition: border-color .18s ease, box-shadow .18s ease, background .18s ease;
}
.pf-input:focus {
  border-color: #16a34a !important;
  box-shadow: 0 0 0 3px rgba(22,163,74,0.15);
  background: #f0fdf4;
  outline: none;
}
.pf-card {
  transition: transform .22s ease, box-shadow .22s ease;
}
.pf-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 32px rgba(34,197,94,0.10);
}
.pf-toggle { transition: background .2s ease }
`;

const Profile: React.FC = () => {
  const { user, session, refreshProfile, userRole } = useAuth();
  const isDoctor = userRole === 'Doctor';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    // Grower-only
    farmName: '',
    khasraNumber: '',
    khataNumber: '',
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile]       = useState<File | null>(null);
  const [errorMessage, setErrorMessage]   = useState<string | null>(null);
  const [saving, setSaving]               = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    setFormData({
      name:         user.name         ?? '',
      email:        user.email        ?? '',
      phone:        user.phone        ?? '',
      farmName:     (user as any).farmName     ?? '',
      khasraNumber: (user as any).khasraNumber ?? '',
      khataNumber:  (user as any).khataNumber  ?? '',
    });
    setAvatarPreview(user.avatar ?? null);
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { alert('Image size should be less than 5MB'); return; }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick  = () => fileInputRef.current?.click();
  const handleRemoveImage = () => {
    setAvatarPreview(null);
    setAvatarFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return;
    setErrorMessage(null);
    setSaving(true);

    let avatarUrl = user?.avatar ?? null;
    if (avatarFile) {
      const fileExt  = avatarFile.name.split('.').pop() || 'jpg';
      const filePath = `${session.user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, { upsert: true });

      if (uploadError) {
        setSaving(false);
        setErrorMessage(uploadError.message);
        return;
      }
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      avatarUrl = data.publicUrl;
    }

    // Build the update payload — doctors don't write farm/land fields
    const profilePayload: Record<string, unknown> = {
      id:         session.user.id,
      name:       formData.name,
      email:      formData.email,
      phone:      formData.phone,
      avatar_url: avatarUrl,
    };

    if (!isDoctor) {
      profilePayload.farm_name     = formData.farmName;
      profilePayload.khasra_number = formData.khasraNumber || null;
      profilePayload.khata_number  = formData.khataNumber  || null;
    }

    const { error } = await supabase.from('profiles').upsert(profilePayload);

    if (error) {
      setSaving(false);
      setErrorMessage(error.message);
      return;
    }

    await refreshProfile();
    setSaving(false);
    alert('Profile updated successfully!');
  };

  return (
    <>
      <style>{PROFILE_STYLES}</style>
    <div className="space-y-6 pb-10">

      {/* ── Animated Hero Banner ── */}
      <div className={`pf-fade-up pf-d0 relative overflow-hidden rounded-3xl ${isDoctor ? 'pf-hero-blue' : 'pf-hero'} shadow-2xl`}>
        <div className="absolute -top-10 -left-10 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-60 h-60 rounded-full bg-white/5 pointer-events-none" />
        <div className="relative px-8 py-10 flex flex-col items-center text-center gap-4">
          
          <h1 className="pf-fade-up pf-d2 text-4xl sm:text-5xl font-extrabold tracking-tight text-white drop-shadow-xl leading-tight">
            {isDoctor ? '' : ''} Edit Profile
          </h1>
          <p className="pf-fade-up pf-d3 text-base sm:text-lg text-white/80 font-medium max-w-md">
            {isDoctor ? 'Manage your doctor profile and account settings' : 'Manage your orchard profile and account details'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Picture Card */}
        <Card className="pf-card pf-scale-in pf-d1 p-6 border border-gray-100 rounded-2xl shadow-sm">
          <div className="text-center">
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            <div
              className={`pf-avatar w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden cursor-pointer ${
                isDoctor ? 'bg-blue-100' : 'bg-gradient-to-br from-green-100 to-emerald-100'
              } border-4 ${isDoctor ? 'border-blue-200' : 'border-green-200'}`}
              onClick={handleImageClick}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
              ) : isDoctor ? (
                <Stethoscope className="w-14 h-14 text-blue-500" />
              ) : (
                <User className="w-14 h-14 text-green-600" />
              )}
            </div>
            <h3 className="text-lg font-extrabold text-gray-900 mb-1">{formData.name || 'Your Name'}</h3>
            {!isDoctor && <p className="text-sm text-gray-400 mb-1">{formData.farmName}</p>}
            {isDoctor  && <p className="text-sm text-blue-500 mb-1 font-semibold">Doctor / Agronomist</p>}
            <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-4 ${
              isDoctor ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {isDoctor ? '🩺 Doctor' : '🌿 Grower'}
            </span>
            <div className="flex gap-2 justify-center">
              <button onClick={handleImageClick}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                {avatarPreview ? 'Change' : 'Upload'}
              </button>
              {avatarPreview && (
                <button onClick={handleRemoveImage}
                  className="px-3 py-1.5 rounded-xl border border-red-200 text-red-500 text-xs font-semibold hover:bg-red-50 transition-colors">
                  Remove
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">Max 5MB · JPG/PNG</p>
          </div>
        </Card>

        {/* Profile Form */}
        <Card className="pf-scale-in pf-d2 p-6 lg:col-span-2 border border-gray-100 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-green-500 to-emerald-600" />
            <h3 className="text-base font-extrabold text-gray-900">Personal Information</h3>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label htmlFor="name" className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input id="name" name="name" type="text" value={formData.name} onChange={handleInputChange}
                    className="pf-input w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm" required />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange}
                    className="pf-input w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm" required />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label htmlFor="phone" className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange}
                    className="pf-input w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm" required />
                </div>
              </div>

              {/* Grower-only: Farm Name */}
              {!isDoctor && (
                <div className="space-y-1.5">
                  <label htmlFor="farmName" className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Farm Name</label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input id="farmName" name="farmName" type="text" value={formData.farmName} onChange={handleInputChange}
                      className="pf-input w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm" required />
                  </div>
                </div>
              )}

              {/* Grower-only: Khasra Number */}
              {!isDoctor && (
                <div className="space-y-1.5">
                  <label htmlFor="khasraNumber" className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Khasra Number <span className="text-gray-300 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input id="khasraNumber" name="khasraNumber" type="text" value={formData.khasraNumber} onChange={handleInputChange}
                      placeholder="Enter Khasra number"
                      className="pf-input w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm" />
                  </div>
                </div>
              )}

              {/* Grower-only: Khata Number */}
              {!isDoctor && (
                <div className="space-y-1.5">
                  <label htmlFor="khataNumber" className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Khata Number <span className="text-gray-300 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input id="khataNumber" name="khataNumber" type="text" value={formData.khataNumber} onChange={handleInputChange}
                      placeholder="Enter Khata number"
                      className="pf-input w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm" />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-5 border-t border-gray-100">
              {errorMessage && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  {errorMessage}
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button type="button"
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors">
                  X
                </button>
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-sm shadow-lg shadow-green-200 hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed">
                  {saving ? (
                    <><span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />Saving…</>
                  ) : (
                    <><Save className="w-4 h-4" />Save Changes</>
                  )}
                </button>
              </div>
            </div>
          </form>
        </Card>
      </div>

      {/* Account Settings */}
      <Card className="pf-scale-in p-6 border border-gray-100 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-1 h-6 rounded-full bg-gradient-to-b from-green-500 to-emerald-600" />
          <h3 className="text-base font-extrabold text-gray-900">Account Settings</h3>
        </div>
        <div className="space-y-1">
          {[
            { title: 'Email Notifications', desc: 'Receive alerts and updates via email', defaultChecked: true },
            { title: 'SMS Alerts',          desc: 'Receive urgent alerts via SMS',         defaultChecked: false },
            { title: 'Weather Updates',     desc: 'Daily weather forecasts and alerts',    defaultChecked: true },
          ].map(item => (
            <div key={item.title} className="flex items-center justify-between py-3.5 border-b border-gray-100 last:border-0">
              <div>
                <h4 className="text-sm font-bold text-gray-900">{item.title}</h4>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked={item.defaultChecked} />
                <div className="pf-toggle w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600 shadow-inner"></div>
              </label>
            </div>
          ))}
        </div>
        
      </Card>

      {/* Team Management - Always Visible for Growers */}
      {userRole === 'Grower' && (
        <div className="pf-scale-in">
          <TeamManagement />
        </div>
      )}

    </div>
    </>
  );
};

export default Profile;
