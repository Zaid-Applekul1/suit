/**
 * PaymentPage.tsx — Payment checkout page
 *
 * Receives from router state:
 *   { planName, price, billing, icon, planId, role, tab }
 *
 * Flow:
 *   1. Shows plan summary
 *   2. User fills billing details + card (UPI toggle)
 *   3. On submit → /signup (with plan + payment intent attached)
 *
 * Note: No real payment gateway is wired here — integrate Razorpay/Stripe
 *       by replacing the handleSubmit logic.
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/* ─────────────────────────────────────────────────────────────
   CSS
───────────────────────────────────────────────────────────── */
const PAY_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');

@keyframes py-fade-up {
  from { opacity:0; transform:translateY(24px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes py-scale-in {
  from { opacity:0; transform:scale(.94); }
  to   { opacity:1; transform:scale(1); }
}
@keyframes py-shimmer {
  0%   { background-position:-600px 0; }
  100% { background-position: 600px 0; }
}
@keyframes py-blob {
  0%,100% { transform:translate(0,0) scale(1); }
  50%  { transform:translate(20px,-15px) scale(1.06); }
}
@keyframes py-spin {
  to { transform:rotate(360deg); }
}
@keyframes py-success-pop {
  0%   { opacity:0; transform:scale(.5); }
  70%  { transform:scale(1.12); }
  100% { opacity:1; transform:scale(1); }
}

.py-root *, .py-root *::before, .py-root *::after { box-sizing:border-box; }
.py-root {
  font-family: 'Poppins', system-ui, sans-serif;
  min-height: 100vh;
  background: #f1f5f9;
  display: flex;
  flex-direction: column;
}

/* ── Top bar ── */
.py-topbar {
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: .85rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky; top: 0; z-index: 50;
  box-shadow: 0 1px 8px rgba(0,0,0,.05);
}
.py-topbar-brand { font-size:1rem; font-weight:800; color:#064e3b; }
.py-topbar-brand span { color:#10b981; }
.py-topbar-step {
  display:flex; align-items:center; gap:.4rem;
  font-size:.75rem; font-weight:600; color:#6b7280;
}
.py-step-dot {
  width:22px; height:22px; border-radius:50%;
  display:flex; align-items:center; justify-content:center;
  font-size:.65rem; font-weight:800;
}
.py-step-dot.done  { background:#10b981; color:#fff; }
.py-step-dot.active { background:#064e3b; color:#fff; }
.py-step-dot.todo  { background:#e5e7eb; color:#9ca3af; }
.py-step-line { width:32px; height:2px; background:#e5e7eb; }
.py-step-line.done { background:#10b981; }

/* ── Main layout ── */
.py-main {
  flex:1;
  display:grid;
  grid-template-columns: 1fr 380px;
  gap:2rem;
  max-width:1000px;
  margin:2.5rem auto;
  padding:0 1.5rem 3rem;
  align-items:start;
  animation: py-fade-up .5s cubic-bezier(.22,1,.36,1) both;
}
@media (max-width:780px) {
  .py-main { grid-template-columns:1fr; }
  .py-summary { order:-1; }
}

/* ── Form card ── */
.py-card {
  background:#fff; border-radius:20px;
  border:1px solid #e5e7eb;
  box-shadow:0 4px 24px rgba(0,0,0,.06);
  overflow:hidden;
}
.py-card-head {
  padding:1.4rem 1.6rem;
  border-bottom:1px solid #f3f4f6;
  display:flex; align-items:center; gap:.75rem;
}
.py-card-head-icon {
  width:38px; height:38px; border-radius:10px;
  background:#f0fdf4; border:1px solid #d1fae5;
  display:flex; align-items:center; justify-content:center; font-size:1.1rem;
}
.py-card-head-title { font-size:1rem; font-weight:700; color:#111; }
.py-card-head-sub { font-size:.74rem; color:#6b7280; font-weight:500; }
.py-card-body { padding:1.5rem 1.6rem; }

/* Section label */
.py-section-label {
  font-size:.68rem; font-weight:800; text-transform:uppercase;
  letter-spacing:.1em; color:#064e3b; margin-bottom:.75rem;
}

/* Form grid */
.py-form-grid { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
.py-form-grid.full { grid-template-columns:1fr; }
@media (max-width:480px) { .py-form-grid { grid-template-columns:1fr; } }

/* Input group */
.py-field { display:flex; flex-direction:column; gap:.35rem; }
.py-field.span2 { grid-column:span 2; }
@media (max-width:480px) { .py-field.span2 { grid-column:span 1; } }
.py-label { font-size:.72rem; font-weight:700; color:#374151; }
.py-label span { color:#ef4444; }
.py-input {
  padding:.62rem .9rem; border-radius:10px;
  border:1.5px solid #e5e7eb; background:#fff;
  font-size:.85rem; font-weight:500; color:#111;
  font-family:inherit;
  transition:border-color .18s,box-shadow .18s;
  outline:none;
}
.py-input:focus { border-color:#10b981; box-shadow:0 0 0 3px rgba(16,185,129,.14); }
.py-input::placeholder { color:#9ca3af; }
.py-input.error { border-color:#ef4444; }

/* Payment method toggle */
.py-method-tabs {
  display:flex; gap:.5rem; margin-bottom:1.25rem;
}
.py-method-tab {
  flex:1; padding:.55rem; border-radius:10px;
  border:1.5px solid #e5e7eb; background:#fff;
  font-size:.78rem; font-weight:700; color:#6b7280;
  cursor:pointer; text-align:center;
  transition:all .18s; font-family:inherit;
  display:flex; align-items:center; justify-content:center; gap:.4rem;
}
.py-method-tab.active {
  border-color:#10b981; background:#f0fdf4; color:#064e3b;
}

/* Card number display */
.py-card-num-wrap { position:relative; }
.py-card-num-wrap .py-input { padding-right:3.5rem; letter-spacing:.08em; }
.py-card-brand-logo {
  position:absolute; right:.9rem; top:50%; transform:translateY(-50%);
  font-size:1.1rem;
}

/* CVV help icon */
.py-cvv-wrap { position:relative; }
.py-cvv-wrap .py-input { padding-right:2.2rem; }
.py-cvv-help {
  position:absolute; right:.7rem; top:50%; transform:translateY(-50%);
  font-size:.75rem; color:#9ca3af; cursor:help;
}

/* UPI input */
.py-upi-note { font-size:.74rem; color:#6b7280; margin-top:.5rem; }

/* Divider */
.py-divider { height:1px; background:#f3f4f6; margin:1.25rem 0; }

/* Submit button */
.py-submit {
  width:100%; padding:.95rem; border-radius:12px; border:none;
  background:linear-gradient(135deg,#059669,#10b981);
  color:#fff; font-size:1rem; font-weight:800; cursor:pointer;
  font-family:inherit;
  box-shadow:0 6px 20px rgba(16,185,129,.35);
  transition:transform .2s,box-shadow .2s;
  display:flex; align-items:center; justify-content:center; gap:.6rem;
}
.py-submit:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 10px 28px rgba(16,185,129,.45); }
.py-submit:disabled { opacity:.65; cursor:not-allowed; }
.py-submit-spinner {
  width:18px; height:18px; border-radius:50%;
  border:2.5px solid rgba(255,255,255,.4);
  border-top-color:#fff;
  animation: py-spin .7s linear infinite;
}

/* Small security note */
.py-security-note {
  display:flex; align-items:center; justify-content:center; gap:.4rem;
  font-size:.7rem; color:#9ca3af; font-weight:500; margin-top:.85rem;
}

/* ── Summary card ── */
.py-summary {
  background:#fff; border-radius:20px;
  border:1px solid #e5e7eb;
  box-shadow:0 4px 24px rgba(0,0,0,.06);
  overflow:hidden;
  position:sticky; top:90px;
}
.py-summary-head {
  padding:1.25rem 1.5rem;
  background:linear-gradient(135deg,#052e16,#064e3b);
  color:#fff;
}
.py-summary-head-label { font-size:.65rem; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:#6ee7b7; margin-bottom:.3rem; }
.py-summary-plan {
  display:flex; align-items:center; gap:.6rem;
}
.py-summary-icon { font-size:1.5rem; }
.py-summary-name { font-size:1rem; font-weight:800; }
.py-summary-billing { font-size:.72rem; color:rgba(255,255,255,.6); font-weight:500; margin-top:.1rem; }
.py-summary-body { padding:1.25rem 1.5rem; }
.py-summary-row {
  display:flex; justify-content:space-between; align-items:center;
  font-size:.82rem; color:#374151; font-weight:500; padding:.35rem 0;
}
.py-summary-row.total {
  font-size:1rem; font-weight:800; color:#064e3b;
  border-top:2px solid #e5e7eb; margin-top:.5rem; padding-top:.85rem;
}
.py-summary-row.discount { color:#059669; }
.py-summary-footer {
  padding:.85rem 1.5rem 1.25rem;
  border-top:1px solid #f3f4f6;
}
.py-summary-footer p { font-size:.72rem; color:#9ca3af; line-height:1.6; }
.py-back-link {
  display:inline-flex; align-items:center; gap:.35rem;
  font-size:.78rem; font-weight:600; color:#059669;
  cursor:pointer; border:none; background:none;
  margin-top:.75rem; font-family:inherit;
  text-decoration:underline; text-underline-offset:2px;
}

/* ── Success overlay ── */
.py-success-overlay {
  position:fixed; inset:0; z-index:200;
  background:rgba(5,46,22,.92);
  display:flex; align-items:center; justify-content:center; flex-direction:column;
  gap:1.5rem; text-align:center; padding:2rem;
}
.py-success-circle {
  width:90px; height:90px; border-radius:50%;
  background:linear-gradient(135deg,#059669,#10b981);
  display:flex; align-items:center; justify-content:center;
  font-size:2.5rem;
  animation: py-success-pop .6s cubic-bezier(.22,1,.36,1) both;
  box-shadow:0 0 0 16px rgba(16,185,129,.2);
}
.py-success-title { font-size:1.6rem; font-weight:900; color:#fff; }
.py-success-sub { font-size:.9rem; color:rgba(255,255,255,.7); font-weight:500; max-width:340px; }
.py-success-next {
  padding:.75rem 2rem; border-radius:12px; border:none;
  background:linear-gradient(135deg,#059669,#10b981);
  color:#fff; font-size:.9rem; font-weight:800; cursor:pointer;
  font-family:inherit;
  box-shadow:0 6px 20px rgba(16,185,129,.4);
}

/* Shimmer bar */
.py-shimmer-bar {
  height:4px;
  background:linear-gradient(90deg,rgba(16,185,129,.3) 25%,rgba(16,185,129,.8) 50%,rgba(16,185,129,.3) 75%);
  background-size:600px 100%;
  animation: py-shimmer 2.2s ease-in-out infinite;
}
`;

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */
function formatCardNumber(val: string) {
  return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}
function detectCardBrand(num: string): string {
  const n = num.replace(/\s/g, '');
  if (/^4/.test(n)) return '💳 Visa';
  if (/^5[1-5]/.test(n)) return '💳 MC';
  if (/^6/.test(n)) return '💳 RuPay';
  if (/^3[47]/.test(n)) return '💳 Amex';
  return '💳';
}

/* ─────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────── */
const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // State passed from LandingPage "Buy now"
  const {
    planName = 'Grower Pro',
    price    = '₹999',
    billing  = 'monthly',
    icon     = '🍎',
    planId   = 'grower-pro',
    role     = 'Grower',
    tab      = 'individuals',
  } = (location.state as Record<string, string>) ?? {};

  const [method, setMethod] = useState<'card' | 'upi' | 'netbanking'>('card');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    fullName: '', email: '', phone: '',
    cardNum: '', expiry: '', cvv: '', nameOnCard: '',
    upiId: '',
    bank: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const rawNum = price.replace(/[₹,]/g, '');
  const numericPrice = isNaN(Number(rawNum)) ? 0 : Number(rawNum);
  const gst = Math.round(numericPrice * 0.18);
  const total = numericPrice + gst;
  const annualDiscount = billing === 'annual' ? Math.round(numericPrice * 2) : 0;

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim())  e.fullName = 'Required';
    if (!form.email.includes('@')) e.email  = 'Valid email required';
    if (!form.phone || form.phone.length < 10) e.phone = 'Valid phone required';
    if (method === 'card') {
      if (form.cardNum.replace(/\s/g,'').length < 16) e.cardNum = 'Enter 16-digit card number';
      if (!form.expiry.match(/^\d{2}\/\d{2}$/)) e.expiry = 'MM/YY format';
      if (form.cvv.length < 3) e.cvv = '3 digits required';
      if (!form.nameOnCard.trim()) e.nameOnCard = 'Required';
    }
    if (method === 'upi') {
      if (!form.upiId.includes('@')) e.upiId = 'Valid UPI ID required (e.g. name@upi)';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    // Simulate payment processing (replace with Razorpay/Stripe SDK call)
    await new Promise(r => setTimeout(r, 2000));

    setLoading(false);
    setSuccess(true);
  };

  const handleSuccessNext = () => {
    navigate('/signup', {
      state: { role, planId, billing, tab, paid: true, email: form.email },
    });
  };

  const formatExpiry = (val: string) => {
    const d = val.replace(/\D/g, '').slice(0, 4);
    return d.length >= 3 ? d.slice(0, 2) + '/' + d.slice(2) : d;
  };

  return (
    <div className="py-root">
      <style>{PAY_STYLES}</style>

      {/* Success overlay */}
      {success && (
        <div className="py-success-overlay">
          <div className="py-success-circle">✓</div>
          <div className="py-success-title">Payment Successful!</div>
          <div className="py-success-sub">
            Your <strong>{planName}</strong> subscription is confirmed.
            Let's set up your account now.
          </div>
          <button className="py-success-next" onClick={handleSuccessNext}>
            Set Up My Account →
          </button>
        </div>
      )}

      {/* Top bar */}
      <div className="py-topbar">
        <div className="py-topbar-brand">AppleKul<span> One</span></div>
        <div className="py-topbar-step">
          <div className="py-step-dot done">✓</div>
          <div className="py-step-line done" />
          <div className="py-step-dot active">2</div>
          <span style={{ marginLeft:'.4rem', color:'#064e3b', fontWeight:700 }}>Payment</span>
          <div className="py-step-line" />
          <div className="py-step-dot todo">3</div>
          <span>Account</span>
        </div>
      </div>

      {/* Main */}
      <form onSubmit={handleSubmit}>
        <div className="py-main">
          {/* Left: Checkout form */}
          <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>

            {/* Billing details */}
            <div className="py-card" style={{ animation:'py-scale-in .5s cubic-bezier(.22,1,.36,1) .1s both' }}>
              <div className="py-shimmer-bar" />
              <div className="py-card-head">
                <div className="py-card-head-icon">👤</div>
                <div>
                  <div className="py-card-head-title">Billing Details</div>
                  <div className="py-card-head-sub">Your contact information for the invoice</div>
                </div>
              </div>
              <div className="py-card-body">
                <div className="py-form-grid">
                  <div className="py-field span2">
                    <label className="py-label">Full Name <span>*</span></label>
                    <input className={`py-input${errors.fullName ? ' error':''}`} placeholder="John Doe"
                      value={form.fullName} onChange={set('fullName')} />
                    {errors.fullName && <span style={{fontSize:'.68rem',color:'#ef4444'}}>{errors.fullName}</span>}
                  </div>
                  <div className="py-field">
                    <label className="py-label">Email <span>*</span></label>
                    <input className={`py-input${errors.email ? ' error':''}`} type="email" placeholder="you@email.com"
                      value={form.email} onChange={set('email')} />
                    {errors.email && <span style={{fontSize:'.68rem',color:'#ef4444'}}>{errors.email}</span>}
                  </div>
                  <div className="py-field">
                    <label className="py-label">WhatsApp / Phone <span>*</span></label>
                    <input className={`py-input${errors.phone ? ' error':''}`} type="tel" placeholder="+91 9876543210"
                      value={form.phone} onChange={set('phone')} />
                    {errors.phone && <span style={{fontSize:'.68rem',color:'#ef4444'}}>{errors.phone}</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment method */}
            <div className="py-card" style={{ animation:'py-scale-in .5s cubic-bezier(.22,1,.36,1) .2s both' }}>
              <div className="py-shimmer-bar" />
              <div className="py-card-head">
                <div className="py-card-head-icon">💳</div>
                <div>
                  <div className="py-card-head-title">Payment Method</div>
                  <div className="py-card-head-sub">Choose how you'd like to pay</div>
                </div>
              </div>
              <div className="py-card-body">

                {/* Method tabs */}
                <div className="py-method-tabs">
                  {[
                    { id: 'card',       label: '💳 Card' },
                    { id: 'upi',        label: '⚡ UPI' },
                    { id: 'netbanking', label: '🏦 Net Banking' },
                  ].map(m => (
                    <button
                      key={m.id} type="button"
                      className={`py-method-tab${method === m.id ? ' active' : ''}`}
                      onClick={() => setMethod(m.id as 'card' | 'upi' | 'netbanking')}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Card fields */}
                {method === 'card' && (
                  <div className="py-form-grid">
                    <div className="py-field span2">
                      <label className="py-label">Card Number <span>*</span></label>
                      <div className="py-card-num-wrap">
                        <input
                          className={`py-input${errors.cardNum ? ' error':''}`}
                          placeholder="1234 5678 9012 3456"
                          value={form.cardNum}
                          onChange={e => setForm(p => ({ ...p, cardNum: formatCardNumber(e.target.value) }))}
                          maxLength={19}
                        />
                        <span className="py-card-brand-logo">
                          {form.cardNum ? detectCardBrand(form.cardNum) : '💳'}
                        </span>
                      </div>
                      {errors.cardNum && <span style={{fontSize:'.68rem',color:'#ef4444'}}>{errors.cardNum}</span>}
                    </div>
                    <div className="py-field">
                      <label className="py-label">Expiry (MM/YY) <span>*</span></label>
                      <input
                        className={`py-input${errors.expiry ? ' error':''}`}
                        placeholder="MM/YY" maxLength={5}
                        value={form.expiry}
                        onChange={e => setForm(p => ({ ...p, expiry: formatExpiry(e.target.value) }))}
                      />
                      {errors.expiry && <span style={{fontSize:'.68rem',color:'#ef4444'}}>{errors.expiry}</span>}
                    </div>
                    <div className="py-field">
                      <label className="py-label">CVV <span>*</span></label>
                      <div className="py-cvv-wrap">
                        <input
                          className={`py-input${errors.cvv ? ' error':''}`}
                          placeholder="•••" type="password" maxLength={4}
                          value={form.cvv}
                          onChange={e => setForm(p => ({ ...p, cvv: e.target.value.replace(/\D/g,'').slice(0,4) }))}
                        />
                        <span className="py-cvv-help" title="3 digits on the back of your card">?</span>
                      </div>
                      {errors.cvv && <span style={{fontSize:'.68rem',color:'#ef4444'}}>{errors.cvv}</span>}
                    </div>
                    <div className="py-field span2">
                      <label className="py-label">Name on Card <span>*</span></label>
                      <input
                        className={`py-input${errors.nameOnCard ? ' error':''}`}
                        placeholder="As printed on card"
                        value={form.nameOnCard} onChange={set('nameOnCard')}
                      />
                      {errors.nameOnCard && <span style={{fontSize:'.68rem',color:'#ef4444'}}>{errors.nameOnCard}</span>}
                    </div>
                  </div>
                )}

                {/* UPI fields */}
                {method === 'upi' && (
                  <div>
                    <div className="py-field">
                      <label className="py-label">UPI ID <span>*</span></label>
                      <input
                        className={`py-input${errors.upiId ? ' error':''}`}
                        placeholder="yourname@upi or yourname@okaxis"
                        value={form.upiId} onChange={set('upiId')}
                      />
                      {errors.upiId && <span style={{fontSize:'.68rem',color:'#ef4444'}}>{errors.upiId}</span>}
                    </div>
                    <p className="py-upi-note">
                      A payment request will be sent to your UPI app (PhonePe, GPay, Paytm, BHIM).
                    </p>
                  </div>
                )}

                {/* Net banking */}
                {method === 'netbanking' && (
                  <div className="py-field">
                    <label className="py-label">Select Bank <span>*</span></label>
                    <select className="py-input" value={form.bank} onChange={set('bank')}>
                      <option value="">Choose your bank…</option>
                      {['SBI', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Bank', 'PNB', 'Bank of Baroda', 'Canara Bank', 'Union Bank', 'J&K Bank'].map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                )}

              </div>
            </div>

            {/* Submit */}
            <button type="submit" className="py-submit" disabled={loading}>
              {loading ? (
                <><div className="py-submit-spinner" /> Processing payment…</>
              ) : (
                <>🔒 Pay {price !== 'Custom' ? `₹${total.toLocaleString('en-IN')}` : 'as quoted'} securely</>
              )}
            </button>
            <div className="py-security-note">
              <span>🔒</span> 256-bit SSL · PCI-DSS compliant · Powered by Razorpay
            </div>

          </div>

          {/* Right: Order summary */}
          <div className="py-summary">
            <div className="py-summary-head">
              <div className="py-summary-head-label">Order Summary</div>
              <div className="py-summary-plan">
                <span className="py-summary-icon">{icon}</span>
                <div>
                  <div className="py-summary-name">{planName}</div>
                  <div className="py-summary-billing">
                    {billing === 'annual' ? 'Annual plan · billed monthly' : 'Monthly plan'}
                  </div>
                </div>
              </div>
            </div>
            <div className="py-summary-body">
              <div className="py-summary-row">
                <span>Plan price</span>
                <span>{price !== 'Custom' ? price + '/mo' : 'Custom'}</span>
              </div>
              {annualDiscount > 0 && (
                <div className="py-summary-row discount">
                  <span>Annual discount</span>
                  <span>−₹{annualDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}
              {numericPrice > 0 && (
                <div className="py-summary-row">
                  <span>GST (18%)</span>
                  <span>₹{gst.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="py-summary-row total">
                <span>Total due today</span>
                <span>
                  {numericPrice > 0 ? `₹${total.toLocaleString('en-IN')}` : 'As quoted'}
                </span>
              </div>
            </div>
            <div className="py-summary-footer">
              <p>
                Annual subscriptions are billed monthly at the discounted rate.
                Cancel anytime with a full refund within 14 days.
              </p>
              <button
                type="button"
                className="py-back-link"
                onClick={() => navigate(-1)}
              >
                ← Change plan
              </button>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
};

export default PaymentPage;