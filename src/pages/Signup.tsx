/**
 * Signup.tsx  — RBAC-aware registration
 *
 * Changes vs original:
 * - When role === 'Doctor':
 *     • farm_name, khasra_number, khata_number fields are hidden (not relevant)
 *     • address is still collected (needed for doctor profile too)
 *     • After successful sign-up, creates a skeleton `doctors` row so the doctor
 *       profile is immediately usable without an extra "Register as Doctor" step.
 * - When role === 'Grower':
 *     • All grower fields remain (farmName, khasra, khata, address, etc.)
 *     • No `doctors` row is created.
 * - Role is persisted in both Supabase auth user_metadata AND the profiles row.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Phone, Mail, MapPin, Globe, DollarSign, Lock, Eye, EyeOff, Building2 } from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    language: 'en',
    currency: 'INR',
    role: '',           // 'Doctor' | 'Grower'
    doctorType: '',     // 'Agronomist' (only when role === 'Doctor')
    // Grower-only
    farmName: '',
    khasraNumber: '',
    khataNumber: '',
    // Doctor-only — pre-fill from signup so they land in a usable state
    specialization: '',
    hospitalName: '',
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!acceptedTerms) {
      alert('Please accept the terms and conditions to continue.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    if (formData.password.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }
    if (!formData.role) {
      alert('Please select a role.');
      return;
    }
    if (isDoctor && (!formData.specialization.trim() || !formData.hospitalName.trim())) {
      alert('Please fill in Specialization and Hospital / Clinic Name.');
      return;
    }

    setLoading(true);

    // 1. Create auth user — embed role in metadata for immediate use before profile loads
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          name: formData.name,
          phone: formData.whatsapp,
          role: formData.role,
          doctorType: isDoctor ? formData.doctorType : undefined,
        },
      },
    });

    if (error) {
      setLoading(false);
      setErrorMessage(error.message);
      return;
    }

    if (data.user) {
      const userId = data.user.id;

      // 2. Upsert profiles row (common fields + role)
      const profilePayload: Record<string, unknown> = {
        id: userId,
        name: formData.name,
        email: formData.email,
        phone: formData.whatsapp,
        whatsapp: formData.whatsapp,
        address: formData.address,
        language: formData.language,
        currency: formData.currency,
        role: formData.role,
        doctor_type: isDoctor ? formData.doctorType : null,
        // Grower-only fields
        farm_name: isGrower ? formData.farmName : '',
        khasra_number: isGrower ? (formData.khasraNumber || null) : null,
        khata_number: isGrower ? (formData.khataNumber || null) : null,
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profilePayload);

      if (profileError) {
        setLoading(false);
        setErrorMessage(profileError.message);
        return;
      }

      // 3. For doctors: also create the `doctors` table row immediately
      //    so they can start accepting consultations right after login.
      if (isDoctor) {
        const { error: doctorError } = await supabase
          .from('doctors')
          .insert({
            user_id: userId,
            name: formData.name,
            specialization: formData.specialization,
            hospital_name: formData.hospitalName,
            phone: formData.whatsapp || null,
            email: formData.email || null,
            available: true,
          });

        if (doctorError) {
          // Non-fatal: doctor can complete registration from the portal
          console.warn('Doctor profile creation failed during signup:', doctorError.message);
        }
      }
    }

    setLoading(false);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="AppleKul™ Logo" className="w-24 h-24 mx-auto mb-4 object-contain" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h1>
          <p className="text-gray-600">Join AppleKul™ Suite to manage your orchard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* ── Role selector ── */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                id="role" name="role" value={formData.role} onChange={handleChange}
                className="w-full pl-3 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white"
                required
              >
                <option value="">Select Role</option>
                <option value="Doctor">Doctor / Agronomist</option>
                <option value="Grower">Grower / Farmer</option>
              </select>
            </div>

            {/* ── Doctor: specialization ── */}
            {isDoctor && (
              <div>
                <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-2">
                  Specialization <span className="text-red-500">*</span>
                </label>
                <input
                  id="specialization" name="specialization" type="text"
                  value={formData.specialization} onChange={handleChange}
                  className="w-full pl-3 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g. Plant Pathology"
                  required={isDoctor}
                />
              </div>
            )}

            {/* ── Doctor: hospital/clinic name ── */}
            {isDoctor && (
              <div className="md:col-span-2">
                <label htmlFor="hospitalName" className="block text-sm font-medium text-gray-700 mb-2">
                  Hospital / Clinic Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="hospitalName" name="hospitalName" type="text"
                    value={formData.hospitalName} onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g. Orchard Hospital Kashmir"
                    required={isDoctor}
                  />
                </div>
              </div>
            )}

            {/* ── Full Name ── */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="name" name="name" type="text" value={formData.name} onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder={isDoctor ? 'Dr. Full Name' : 'Enter your full name'}
                  required
                />
              </div>
            </div>

            {/* ── WhatsApp / Phone ── */}
            <div>
              <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="whatsapp" name="whatsapp" type="tel" value={formData.whatsapp} onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="+91 1234567890"
                  required
                />
              </div>
            </div>

            {/* ── Email ── */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="email" name="email" type="email" value={formData.email} onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="your.email@example.com"
                  required
                />
              </div>
            </div>

            {/* ── Grower-only: Farm Name ── */}
            {isGrower && (
              <div>
                <label htmlFor="farmName" className="block text-sm font-medium text-gray-700 mb-2">
                  Farm Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="farmName" name="farmName" type="text" value={formData.farmName} onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Your farm / orchard name"
                    required={isGrower}
                  />
                </div>
              </div>
            )}

            {/* ── Language ── */}
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Language <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  id="language" name="language" value={formData.language} onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white"
                  required
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi (हिंदी)</option>
                  <option value="pa">Punjabi (ਪੰਜਾਬੀ)</option>
                  <option value="ur">Urdu (اردو)</option>
                  <option value="bn">Bengali (বাংলা)</option>
                </select>
              </div>
            </div>

            {/* ── Password ── */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="password" name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password} onChange={handleChange}
                  className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Min. 6 characters"
                  required minLength={6}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* ── Confirm Password ── */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="confirmPassword" name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword} onChange={handleChange}
                  className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Re-enter password"
                  required
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* ── Address (both roles) ── */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <textarea
                id="address" name="address" value={formData.address} onChange={handleChange}
                rows={3}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter your complete address"
                required
              />
            </div>
          </div>

          {/* ── Grower-only: Khasra & Khata ── */}
          {isGrower && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="khasraNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Khasra Number <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <input
                  id="khasraNumber" name="khasraNumber" type="text" value={formData.khasraNumber} onChange={handleChange}
                  className="w-full pl-3 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Khasra number"
                />
              </div>
              <div>
                <label htmlFor="khataNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Khata Number <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <input
                  id="khataNumber" name="khataNumber" type="text" value={formData.khataNumber} onChange={handleChange}
                  className="w-full pl-3 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Khata number"
                />
              </div>
            </div>
          )}

          {/* ── Currency ── */}
          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
              Currency <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                id="currency" name="currency" value={formData.currency} onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white"
                required
              >
                <option value="INR">INR - Indian Rupee (₹)</option>
                <option value="USD">USD - US Dollar ($)</option>
                <option value="EUR">EUR - Euro (€)</option>
                <option value="GBP">GBP - British Pound (£)</option>
                <option value="PKR">PKR - Pakistani Rupee (Rs)</option>
              </select>
            </div>
          </div>

          {/* ── Role hint banner ── */}
          {isDoctor && (
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
              <span className="text-lg">🩺</span>
              <div>
                <p className="font-semibold">Registering as Doctor</p>
                <p className="text-xs mt-0.5 text-blue-600">
                  You will see the Orchard Hospital doctor portal. Farm/field management sections are not shown for doctors.
                </p>
              </div>
            </div>
          )}
          {isGrower && (
            <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800">
              <span className="text-lg">🌿</span>
              <div>
                <p className="font-semibold">Registering as Grower</p>
                <p className="text-xs mt-0.5 text-green-600">
                  You will have full access to orchard management, the map viewer, and can request consultations from doctors.
                </p>
              </div>
            </div>
          )}

          {/* ── Terms ── */}
          <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox" id="terms" checked={acceptedTerms}
              onChange={e => setAcceptedTerms(e.target.checked)}
              className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              required
            />
            <label htmlFor="terms" className="text-sm text-gray-700 flex-1">
              I agree to the{' '}
              <button type="button" onClick={() => setShowTermsModal(true)}
                className="text-green-600 hover:text-green-700 font-medium underline">
                Terms and Conditions
              </button>{' '}and{' '}
              <button type="button" onClick={() => setShowTermsModal(true)}
                className="text-green-600 hover:text-green-700 font-medium underline">
                Privacy Policy
              </button>
            </label>
          </div>

          {errorMessage && (
            <p className="text-sm text-red-600" role="alert">{errorMessage}</p>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-green-600 hover:text-green-700 font-medium">Sign In</Link>
          </p>
        </div>
      </Card>

      {/* Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowTermsModal(false)} />
          <Card className="relative w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Terms and Conditions</h2>
            <div className="space-y-4 text-sm text-gray-700">
              <section>
                <h3 className="font-semibold text-lg mb-2">1. Acceptance of Terms</h3>
                <p>By creating an account with AppleKul™ Suite, you agree to be bound by these Terms and Conditions.</p>
              </section>
              <section>
                <h3 className="font-semibold text-lg mb-2">2. Use of Service</h3>
                <p>AppleKul™ Suite provides orchard management tools and services for lawful purposes only.</p>
              </section>
              <section>
                <h3 className="font-semibold text-lg mb-2">3. User Account</h3>
                <p>You are responsible for maintaining the confidentiality of your account credentials.</p>
              </section>
              <section>
                <h3 className="font-semibold text-lg mb-2">4. Data Privacy</h3>
                <p>We collect and process your personal data in accordance with our Privacy Policy.</p>
              </section>
              <section>
                <h3 className="font-semibold text-lg mb-2">5. Contact Information</h3>
                <p>Questions? Contact us at apl@applekul.com</p>
              </section>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setShowTermsModal(false)}>Close</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Signup;
