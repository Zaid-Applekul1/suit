/**
 * LandingPage.tsx — Adobe Acrobat-style landing page (v2)
 *
 * Changes from v1:
 *  - Removed "Sign In" from navbar (only logo + "See Plans")
 *  - Hero: "Choose Your Plan" scrolls → plans, "Sign In" hero btn kept as secondary
 *  - Tabs (Individuals / Business / Cooperative CA) each have distinct plan sets
 *  - "Free trial" → /signup (role pre-selected, trial flag)
 *  - "Buy now" → /payment (plan + billing in state)
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
/* ─────────────────────────────────────────────────────────────
   CSS
───────────────────────────────────────────────────────────── */
const LANDING_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');

@keyframes lp-fade-up {
  from { opacity:0; transform:translateY(32px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes lp-blob-drift {
  0%,100% { transform:translate(0,0) scale(1); }
  33%  { transform:translate(30px,-22px) scale(1.08); }
  66%  { transform:translate(-18px,14px) scale(0.95); }
}
@keyframes lp-shimmer {
  0%   { background-position:-600px 0; }
  100% { background-position: 600px 0; }
}
@keyframes lp-pulse-dot {
  0%,100% { opacity:1; transform:scale(1); }
  50%  { opacity:.5; transform:scale(.78); }
}
@keyframes lp-hero-float {
  0%,100% { transform:translateY(0); }
  50%  { transform:translateY(-10px); }
}
@keyframes lp-badge-pop {
  from { opacity:0; transform:scale(0.6) rotate(-10deg); }
  to   { opacity:1; transform:scale(1) rotate(0deg); }
}
@keyframes lp-scroll-hint {
  0%,100% { opacity:0.5; transform:translateY(0); }
  50%  { opacity:1; transform:translateY(6px); }
}
@keyframes lp-card-in {
  from { opacity:0; transform:translateY(24px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes lp-glow-pulse {
  0%,100% { box-shadow:0 0 0 0 rgba(16,185,129,.4); }
  50%  { box-shadow:0 0 0 16px rgba(16,185,129,0); }
}
@keyframes lp-tab-swap {
  from { opacity:0; transform:translateY(10px); }
  to   { opacity:1; transform:translateY(0); }
}

.lp-root *, .lp-root *::before, .lp-root *::after { box-sizing:border-box; }
.lp-root {
  font-family: 'Poppins', system-ui, -apple-system, sans-serif;
  overflow-x: hidden;
}

/* ── Navbar ── */
.lp-nav {
  position: fixed;
  top:0; left:0; right:0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: .85rem 2rem;
  background: rgba(255,255,255,.94);
  backdrop-filter: blur(20px) saturate(1.8);
  -webkit-backdrop-filter: blur(20px) saturate(1.8);
  border-bottom: 1px solid rgba(0,0,0,.06);
  box-shadow: 0 2px 16px rgba(0,0,0,.06);
}
.lp-nav-logo {
  display: flex;
  align-items: center;
  gap: .6rem;
  text-decoration: none;
}
.lp-nav-logo img {  height: 98px;   /* change this */
  width: auto;
  object-fit: contain;
  border-radius: 10px;}
.lp-nav-brand { font-size:1.05rem; font-weight:800; color:#064e3b; letter-spacing:-.3px; }
.lp-nav-brand span { color:#10b981; }
.lp-btn-solid {
  padding: .45rem 1.3rem;
  border-radius: 999px;
  font-size: .84rem;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg,#059669,#10b981);
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(16,185,129,.35);
  transition: transform .18s, box-shadow .18s;
  font-family: inherit;
}
.lp-btn-solid:hover { transform:translateY(-2px); box-shadow:0 8px 22px rgba(16,185,129,.45); }

/* ── Hero ── */
.lp-hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding-top: 76px;
}
.lp-hero-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%);
}
.lp-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  animation: lp-blob-drift 14s ease-in-out infinite;
  pointer-events: none;
}
.lp-grid-overlay {
  position: absolute; inset:0; pointer-events:none;
  background-image:
    linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px);
  background-size: 60px 60px;
}
.lp-hero-content {
  position: relative;
  z-index: 10;
  text-align: center;
  padding: 2rem 1.5rem 4rem;
  max-width: 860px;
  margin: 0 auto;
}
.lp-hero-badge {
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  background: rgba(5,150,105,.08);
  border: 1px solid rgba(5,150,105,.2);
  border-radius: 999px;
  padding: .38rem 1rem;
  font-size: .7rem;
  font-weight: 700;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: #059669;
  margin-bottom: 1.5rem;
  animation: lp-badge-pop .6s cubic-bezier(.22,1,.36,1) .2s both;
}
.lp-hero-badge-dot {
  width:7px; height:7px;
  border-radius:50%;
  background:#10b981;
  box-shadow:0 0 8px #10b981;
  animation: lp-pulse-dot 1.8s ease-in-out infinite;
}
.lp-hero-logo {
  display:inline-block;
  margin-bottom:1.4rem;
  animation: lp-hero-float 4s ease-in-out infinite, lp-glow-pulse 3s ease-in-out infinite;
  border-radius:22px;
}
.lp-hero-logo img {
  height: clamp(98px, 10vw, 96px);
  width: auto;
  border-radius: 22px;
  object-fit: contain;
  display: block;
}
.lp-hero-title {
  font-size: clamp(2.4rem,7vw,4.2rem);
  font-weight: 900;
  line-height: 1.08;
  letter-spacing: -.5px;
  color: #064e3b;
  margin: 0 0 .6rem;
  animation: lp-fade-up .75s cubic-bezier(.22,1,.36,1) .3s both;
}
.lp-hero-title .brand-one  { color:#fbbf24; }
.lp-hero-title .brand-dot  { color:rgba(6,78,59,.35); }
.lp-hero-title .brand-name { color:#064e3b; }
.lp-hero-punchline {
  font-size: clamp(1.15rem,3vw,1.6rem);
  font-weight: 700;
  color: #374151;
  margin: 0 0 .5rem;
  animation: lp-fade-up .75s cubic-bezier(.22,1,.36,1) .4s both;
}
.lp-hero-punchline .hl { color:#059669; font-weight:900; }
.lp-hero-sub {
  font-size: clamp(.88rem,2.2vw,1.05rem);
  font-weight: 500;
  color: #6b7280;
  margin: .6rem 0 2.2rem;
  animation: lp-fade-up .75s cubic-bezier(.22,1,.36,1) .5s both;
}
.lp-hero-cta-group {
  display:flex; flex-wrap:wrap; gap:.85rem; justify-content:center;
  animation: lp-fade-up .75s cubic-bezier(.22,1,.36,1) .6s both;
}
.lp-hero-cta-primary {
  display:inline-flex; align-items:center; gap:.5rem;
  padding:.9rem 2.1rem; border-radius:14px;
  background:linear-gradient(135deg,#059669,#10b981,#34d399);
  color:#fff; font-size:1rem; font-weight:800; border:none; cursor:pointer;
  box-shadow:0 8px 28px rgba(16,185,129,.45);
  transition:transform .2s,box-shadow .2s;
  font-family:inherit;
}
.lp-hero-cta-primary:hover { transform:translateY(-3px); box-shadow:0 14px 36px rgba(16,185,129,.55); }
.lp-hero-cta-secondary {
  display:inline-flex; align-items:center; gap:.5rem;
  padding:.9rem 2rem; border-radius:14px;
  background:rgba(255,255,255,.1);
  color:#fff; font-size:1rem; font-weight:700;
  border:1.5px solid rgba(255,255,255,.3); cursor:pointer;
  transition:background .2s,border-color .2s;
  font-family:inherit;
}
.lp-hero-cta-secondary:hover { background:rgba(255,255,255,.18); border-color:rgba(255,255,255,.5); }

/* Stats bar */
.lp-stats-bar {
  position:relative; z-index:10;
  display:flex; flex-wrap:wrap; gap:0; justify-content:center;
  background:rgba(255,255,255,.95);
  border:1px solid rgba(5,150,105,.15);
  border-radius:20px; padding:1rem 1.5rem;
  max-width:720px; width:calc(100% - 3rem);
  margin:0 auto;
  box-shadow:0 4px 24px rgba(0,0,0,.06);
  animation: lp-fade-up .75s cubic-bezier(.22,1,.36,1) .7s both;
}
.lp-stat { flex:1; min-width:120px; text-align:center; padding:.5rem 1rem; border-right:1px solid rgba(5,150,105,.1); }
.lp-stat:last-child { border-right:none; }
.lp-stat-val { font-size:1.5rem; font-weight:900; color:#059669; line-height:1; }
.lp-stat-lbl { font-size:.67rem; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:.1em; margin-top:.2rem; }

/* Scroll hint */
.lp-scroll-hint {
  position:absolute; bottom:2rem; left:50%; transform:translateX(-50%);
  z-index:10; display:flex; flex-direction:column; align-items:center; gap:.4rem;
  animation: lp-scroll-hint 2s ease-in-out infinite;
  cursor:pointer;
}
.lp-scroll-hint span { font-size:.65rem; font-weight:600; letter-spacing:.1em; text-transform:uppercase; color:#6b7280; }
.lp-scroll-arrow {
  width:28px; height:28px; border:1.5px solid #059669;
  border-radius:50%; display:flex; align-items:center; justify-content:center;
}

/* ── Plans section ── */
.lp-plans { background:#f8fafc; padding:5rem 1.5rem 6rem; }
.lp-plans-inner { max-width:1200px; margin:0 auto; }
.lp-plans-head { text-align:center; margin-bottom:3rem; }
.lp-plans-head h2 {
  font-size:clamp(1.9rem,4vw,2.75rem); font-weight:900; color:#111;
  letter-spacing:-.4px; margin:0 0 .5rem;
}
.lp-plans-head p { font-size:1rem; color:#6b7280; font-weight:500; margin:0; }

/* Tab bar */
.lp-tab-bar {
  display:flex; justify-content:center; gap:0;
  border-bottom:2px solid #e5e7eb; margin-bottom:2.5rem;
}
.lp-tab {
  padding:.75rem 1.7rem; font-size:.9rem; font-weight:600; color:#6b7280;
  background:none; border:none; border-bottom:3px solid transparent;
  margin-bottom:-2px; cursor:pointer;
  transition:color .18s,border-color .18s; white-space:nowrap;
  font-family:inherit;
}
.lp-tab.active { color:#059669; border-bottom-color:#059669; font-weight:700; }
.lp-tab:hover:not(.active) { color:#374151; }

/* Tab description strip */
.lp-tab-desc {
  text-align:center; margin-bottom:2rem;
  padding:.75rem 1.5rem;
  background:#fff;
  border:1px solid #e5e7eb; border-radius:12px;
  font-size:.85rem; font-weight:500; color:#4b5563;
  animation: lp-tab-swap .3s cubic-bezier(.22,1,.36,1) both;
}
.lp-tab-desc strong { color:#059669; }

/* Billing toggle */
.lp-billing-toggle { display:flex; justify-content:center; margin-bottom:2.5rem; }
.lp-billing-pill {
  display:flex; align-items:center; gap:1.5rem;
  background:#fff; border:1.5px solid #e5e7eb; border-radius:999px;
  padding:.5rem 1.5rem; font-size:.82rem; font-weight:600; color:#374151;
  box-shadow:0 2px 8px rgba(0,0,0,.06);
}
.lp-billing-pill label { display:flex; align-items:center; gap:.45rem; cursor:pointer; }
.lp-billing-pill input[type=radio] { accent-color:#059669; }

/* Plans grid */
.lp-plans-grid {
  display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr));
  gap:1.5rem; align-items:start;
  animation: lp-tab-swap .35s cubic-bezier(.22,1,.36,1) both;
}

/* Plan card */
.lp-plan-card {
  background:#fff; border:1.5px solid #e5e7eb; border-radius:20px;
  overflow:hidden; position:relative;
  transition:box-shadow .22s,transform .22s,border-color .22s;
  animation: lp-card-in .6s cubic-bezier(.22,1,.36,1) both;
}
.lp-plan-card:hover { box-shadow:0 16px 48px rgba(0,0,0,.12); transform:translateY(-4px); border-color:#d1fae5; }
.lp-plan-card.featured { border:2px solid #f59e0b; box-shadow:0 8px 32px rgba(245,158,11,.15); }
.lp-plan-card.featured:hover { box-shadow:0 20px 56px rgba(245,158,11,.22); border-color:#f59e0b; }
.lp-plan-card.enterprise { border:2px solid #7c3aed; box-shadow:0 8px 32px rgba(124,58,237,.12); }
.lp-plan-card.enterprise:hover { box-shadow:0 20px 56px rgba(124,58,237,.22); border-color:#7c3aed; }

/* Best value badge */
.lp-best-badge {
  position:absolute; top:1rem; right:1rem;
  background:linear-gradient(135deg,#f59e0b,#d97706);
  color:#fff; font-size:.6rem; font-weight:900; letter-spacing:.1em;
  text-transform:uppercase; padding:.28rem .7rem; border-radius:6px;
  box-shadow:0 4px 12px rgba(245,158,11,.4);
  animation: lp-badge-pop .5s cubic-bezier(.22,1,.36,1) .4s both;
}
.lp-enterprise-badge {
  position:absolute; top:1rem; right:1rem;
  background:linear-gradient(135deg,#7c3aed,#6d28d9);
  color:#fff; font-size:.6rem; font-weight:900; letter-spacing:.1em;
  text-transform:uppercase; padding:.28rem .7rem; border-radius:6px;
  box-shadow:0 4px 12px rgba(124,58,237,.4);
}

/* Card body */
.lp-card-body { padding:1.75rem 1.6rem 1.2rem; }
.lp-card-plan-name { font-size:1.08rem; font-weight:800; color:#111; margin:0 0 .2rem; }
.lp-card-plan-name .plan-icon { margin-right:.35rem; }
.lp-card-price { font-size:1.75rem; font-weight:900; color:#064e3b; line-height:1; margin:.1rem 0 .15rem; }
.lp-card-price .orig { font-size:1rem; font-weight:600; color:#9ca3af; text-decoration:line-through; margin-right:.4rem; }
.lp-card-price .freq { font-size:.8rem; font-weight:600; color:#6b7280; }
.lp-card-gst { font-size:.7rem; color:#9ca3af; margin-bottom:.35rem; font-style:italic; }
.lp-card-save { font-size:.77rem; font-weight:700; color:#059669; margin-bottom:.7rem; }
.lp-card-desc {
  font-size:.81rem; color:#6b7280; line-height:1.6; margin-bottom:1.2rem;
  border-top:1px solid #f3f4f6; padding-top:.85rem;
}

/* Features */
.lp-feat-list { list-style:none; padding:0; margin:0 0 1.2rem; display:flex; flex-direction:column; gap:.45rem; }
.lp-feat-item { display:flex; align-items:flex-start; gap:.6rem; font-size:.79rem; color:#374151; font-weight:500; }
.lp-feat-check {
  width:18px; height:18px; border-radius:50%;
  background:linear-gradient(135deg,#10b981,#059669);
  display:flex; align-items:center; justify-content:center;
  flex-shrink:0; margin-top:.05rem;
}
.lp-feat-check svg { width:10px; height:10px; }

/* Card footer */
.lp-card-footer {
  padding:.85rem 1.6rem 1.5rem;
  border-top:1px solid #f3f4f6;
  display:flex; align-items:center; justify-content:space-between; gap:.75rem;
}
.lp-secure-label { display:flex; align-items:center; gap:.35rem; font-size:.66rem; color:#9ca3af; font-weight:500; }
.lp-card-actions { display:flex; gap:.55rem; }
.lp-btn-trial {
  padding:.52rem 1.05rem; border-radius:10px;
  border:1.5px solid #064e3b; background:transparent; color:#064e3b;
  font-size:.79rem; font-weight:700; cursor:pointer; white-space:nowrap;
  transition:background .18s,color .18s; font-family:inherit;
}
.lp-btn-trial:hover { background:#064e3b; color:#fff; }
.lp-btn-buy {
  padding:.52rem 1.2rem; border-radius:10px; border:none;
  background:linear-gradient(135deg,#059669,#10b981);
  color:#fff; font-size:.79rem; font-weight:800; cursor:pointer; white-space:nowrap;
  box-shadow:0 4px 14px rgba(16,185,129,.35);
  transition:transform .18s,box-shadow .18s; font-family:inherit;
}
.lp-btn-buy:hover { transform:translateY(-2px); box-shadow:0 8px 22px rgba(16,185,129,.45); }
.lp-btn-buy.blue {
  background:linear-gradient(135deg,#1d4ed8,#2563eb);
  box-shadow:0 4px 14px rgba(37,99,235,.35);
}
.lp-btn-buy.blue:hover { box-shadow:0 8px 22px rgba(37,99,235,.5); }
.lp-btn-buy.purple {
  background:linear-gradient(135deg,#7c3aed,#6d28d9);
  box-shadow:0 4px 14px rgba(124,58,237,.35);
}
.lp-btn-buy.purple:hover { box-shadow:0 8px 22px rgba(124,58,237,.5); }
.lp-btn-contact {
  padding:.52rem 1.2rem; border-radius:10px;
  border:1.5px solid #7c3aed; background:transparent; color:#7c3aed;
  font-size:.79rem; font-weight:700; cursor:pointer; white-space:nowrap;
  transition:background .18s,color .18s; font-family:inherit;
}
.lp-btn-contact:hover { background:#7c3aed; color:#fff; }

/* Shimmer bar */
.lp-shimmer-bar {
  height:4px;
  background:linear-gradient(90deg,rgba(16,185,129,.3) 25%,rgba(16,185,129,.8) 50%,rgba(16,185,129,.3) 75%);
  background-size:600px 100%;
  animation: lp-shimmer 2.2s ease-in-out infinite;
}

/* Trust bar */
.lp-trust { background:#fff; padding:3rem 1.5rem; border-top:1px solid #e5e7eb; }
.lp-trust-inner {
  max-width:900px; margin:0 auto;
  display:flex; flex-wrap:wrap; gap:2rem; justify-content:center; align-items:center;
}
.lp-trust-item { display:flex; align-items:center; gap:.6rem; font-size:.82rem; font-weight:600; color:#4b5563; }
.lp-trust-icon {
  width:36px; height:36px; border-radius:10px;
  background:#f0fdf4; border:1px solid #d1fae5;
  display:flex; align-items:center; justify-content:center; font-size:1.1rem; flex-shrink:0;
}

/* Responsive */
@media (max-width:640px) {
  .lp-nav { padding:.72rem 1rem; }
  .lp-hero-content { padding:1.5rem 1rem 3rem; }
  .lp-stats-bar { flex-direction:column; border-radius:16px; }
  .lp-stat { border-right:none; border-bottom:1px solid rgba(255,255,255,.1); }
  .lp-stat:last-child { border-bottom:none; }
  .lp-tab { padding:.6rem .9rem; font-size:.78rem; }
  .lp-billing-pill { flex-direction:column; gap:.6rem; border-radius:14px; }
  .lp-card-footer { flex-direction:column; align-items:flex-start; }
  .lp-card-actions { width:100%; }
  .lp-btn-trial,.lp-btn-buy { flex:1; text-align:center; }
}
`;

/* ─────────────────────────────────────────────────────────────
   Plan type
───────────────────────────────────────────────────────────── */
interface Plan {
  id: string;
  icon: string;
  name: string;
  role: string;
  monthlyPrice: string;
  annualPrice: string;
  origMonthly?: string;
  origAnnual?: string;
  annualTotal?: string;
  saveMonthly?: string;
  saveAnnual?: string;
  gst: string;
  desc: string;
  featured?: boolean;
  enterprise?: boolean;
  hasTrial: boolean;
  btnColor?: 'green' | 'blue' | 'purple';
  features: string[];
  contactSales?: boolean;
}

/* ─────────────────────────────────────────────────────────────
   Tab plan data
───────────────────────────────────────────────────────────── */
const TAB_PLANS: Record<string, { desc: string; plans: Plan[] }> = {
  individuals: {
    desc: 'Perfect for individual growers, solo farmers, and independent orchard owners.',
    plans: [
      {
        id: 'grower-starter',
        icon: '🍎',
        name: 'Grower Starter',
        role: 'Grower',
        monthlyPrice: '₹699',
        annualPrice: '₹549',
        origAnnual: '₹699',
        annualTotal: '₹6,588',
        saveAnnual: 'Save 21% with annual billing.',
        gst: 'Incl. GST · Cancel anytime',
        desc: 'Everything a solo grower needs to start tracking their orchard with daily AI insights.',
        hasTrial: true,
        btnColor: 'green',
        features: [
          'Up to 5 Orchard Blocks',
          'Daily AI Crop Insights',
          'Weather Forecasts (7-day)',
          'Basic Finance Ledger',
          'Pest & Disease Alerts',
          'Mobile App Access',
        ],
      },
      {
        id: 'grower-pro',
        icon: '🍎',
        name: 'Grower Pro',
        role: 'Grower',
        monthlyPrice: '₹999',
        annualPrice: '₹799',
        origAnnual: '₹999',
        annualTotal: '₹9,588',
        saveAnnual: 'Save 20% with annual billing.',
        gst: 'Incl. GST · Cancel anytime',
        desc: 'The complete orchard management suite for serious growers. Full maps, finance, scouting, and team tools.',
        featured: true,
        hasTrial: true,
        btnColor: 'green',
        features: [
          'Unlimited Orchard Blocks',
          'Orchard Maps & Block Tracking',
          'Real-time Weather Forecasts',
          'Full Finance & Profit Ledger',
          'Soil / Water Test Reports',
          'Tree Scouting & Pest Monitoring',
          'Team & Worker Management',
          'Daily AI Crop Insights',
        ],
      },
      {
        id: 'grower-elite',
        icon: '🍎',
        name: 'Grower Elite',
        role: 'GrowerElite',
        monthlyPrice: '₹1,799',
        annualPrice: '₹1,399',
        origAnnual: '₹1,799',
        annualTotal: '₹16,788',
        saveAnnual: 'Save 22% with annual billing.',
        gst: 'Incl. GST · Per grower account',
        desc: 'For large-scale growers who need advanced satellite imagery, drone scouting, and premium support.',
        hasTrial: false,
        btnColor: 'blue',
        features: [
          'All Grower Pro features',
          'Satellite NDVI Imagery',
          'Drone Scout Integration',
          'Advanced Yield Predictions',
          'Export Reports (PDF/Excel)',
          'Priority Support (24h SLA)',
        ],
      },
    ],
  },
  business: {
    desc: 'For agri-tech companies, developers building on AppleKul, CA stores, and farm management businesses.',
    plans: [
      {
        id: 'dev-basic',
        icon: '⚙️',
        name: 'Developer',
        role: 'Developer',
        monthlyPrice: '₹999',
        annualPrice: '₹799',
        origAnnual: '₹999',
        annualTotal: '₹9,588',
        saveAnnual: 'Save 20% with annual billing.',
        gst: 'Incl. GST · Cancel anytime',
        desc: 'API access and sandbox environment for developers integrating AppleKul into their agri-tech stack.',
        hasTrial: true,
        btnColor: 'green',
        features: [
          'REST API Access (5K calls/mo)',
          'Sandbox Environment',
          'Webhook Support',
          'API Documentation',
          'Basic Weather Data API',
          'Community Support',
        ],
      },
      {
        id: 'dev-pro',
        icon: '🏬',
        name: 'CA Store',
        role: 'CAStore',
        monthlyPrice: '₹1,499',
        annualPrice: '₹1,199',
        origAnnual: '₹2,499',
        origMonthly: '₹2,499',
        annualTotal: '₹14,388',
        saveAnnual: 'Save 52% with annual billing.',
        gst: 'Incl. GST · Annual subscription',
        desc: 'Full API suite, satellite integrations, and weather station data for production agri-tech applications.',
        featured: true,
        hasTrial: true,
        btnColor: 'blue',
        features: [
          'All Developer Basic features',
          'REST API Access (100K calls/mo)',
          'Satellite NDVI & Crop Health API',
          'Weather Station Integration',
          'Webhook & Data Export',
          'Priority Developer Support',
          'Multi-tenant Architecture',
        ],
      },
      {
        id: 'dev-enterprise',
        icon: '🛒',
        name: 'Bewpari',
        role: 'Bewpari',
        monthlyPrice: 'Custom',
        annualPrice: 'Custom',
        gst: 'Custom pricing · SLA included',
        desc: 'Unlimited API access, dedicated infrastructure, custom integrations, and a dedicated success manager.',
        enterprise: true,
        hasTrial: false,
        btnColor: 'purple',
        contactSales: true,
        features: [
          'Unlimited API Calls',
          'Dedicated Infrastructure',
          'Custom Data Pipelines',
          'White-label Option',
          'SLA-backed Uptime (99.9%)',
          'Dedicated Success Manager',
          'Custom Integrations',
        ],
      },
    ],
  },
  cooperative: {
    desc: 'Purpose-built for students, agronomists, and agricultural professionals.',
    plans: [
      {
        id: 'ca-starter',
        icon: '🎓',
        name: 'Student',
        role: 'Student',
        monthlyPrice: '₹1,499',
        annualPrice: '₹1,199',
        origAnnual: '₹1,499',
        annualTotal: '₹14,388',
        saveAnnual: 'Save 20% with annual billing.',
        gst: 'Incl. GST · Up to 25 growers',
        desc: 'Ideal for small CA stores managing up to 25 grower accounts with basic reporting and insights.',
        hasTrial: true,
        btnColor: 'green',
        features: [
          'Up to 25 Grower Accounts',
          'CA Store Dashboard',
          'Grower Insights Overview',
          'Basic Commission Tracking',
          'Bulk Soil Test Reports',
          'WhatsApp Notifications',
        ],
      },
      {
        id: 'ca-store',
        icon: '🌾',
        name: 'Agronomist',
        role: 'Agronomist',
        monthlyPrice: '₹2,499',
        annualPrice: '₹1,999',
        origAnnual: '₹2,499',
        annualTotal: '₹23,988',
        saveAnnual: 'Save 20% with annual billing.',
        gst: 'Incl. GST · Up to 100 growers',
        desc: 'For established CA stores managing many growers. Full commission tracking, analytics, and support.',
        featured: true,
        hasTrial: false,
        btnColor: 'green',
        features: [
          'Up to 100 Grower Accounts',
          'Custom CA Store Dashboard',
          'Commission & Revenue Tracking',
          'Bulk Soil & Water Test Reports',
          'Store Inventory Insights',
          'Multi-grower AI Insights',
          'Priority Phone Support',
          'Monthly Analytics Reports',
        ],
      },
      {
        id: 'ca-enterprise',
        icon: '🏛️',
        name: 'CA Enterprise / FPO',
        role: 'FPO',
        monthlyPrice: 'Custom',
        annualPrice: 'Custom',
        gst: 'Custom pricing · Unlimited growers',
        desc: 'For large FPOs and multi-district cooperatives. Unlimited growers, custom branding, and government reporting.',
        enterprise: true,
        hasTrial: false,
        btnColor: 'purple',
        contactSales: true,
        features: [
          'Unlimited Grower Accounts',
          'Multi-district Management',
          'Custom Branded Portal',
          'Government Report Templates',
          'Bulk Data Import/Export',
          'Dedicated Account Manager',
          'On-site Training Available',
        ],
      },
    ],
  },
};

/* ─────────────────────────────────────────────────────────────
   CheckIcon
───────────────────────────────────────────────────────────── */
const CheckIcon = () => (
  <div className="lp-feat-check">
    <svg viewBox="0 0 10 10" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1.5,5 4,7.5 8.5,2.5" />
    </svg>
  </div>
);

const LockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

/* ─────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────── */
const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [billing] = useState<'annual'>('annual');
  const [activeTab, setActiveTab] = useState<'individuals' | 'business' | 'cooperative'>('individuals');
  

  const scrollToPlans = () => {
    document.getElementById('plans-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const currentTab = TAB_PLANS[activeTab];
  const plans = currentTab.plans;

  const getPrice = (plan: Plan) => plan.annualPrice;
  const getOrigPrice = (plan: Plan) => plan.origAnnual ?? null;
  const getSave = (plan: Plan) => plan.saveAnnual ?? null;
  const getGst = (plan: Plan) =>
    plan.annualTotal
      ? `Incl. GST · ₹${plan.annualTotal.replace('₹','')} billed annually`
      : plan.gst;

  const handleFreeTrial = (plan: Plan) => {
    navigate('/signup', {
      state: { role: plan.role, planId: plan.id, trial: true, tab: activeTab },
    });
  };

  const handleBuyNow = (plan: Plan) => {
    navigate('/payment', {
      state: {
        role: plan.role,
        planId: plan.id,
        planName: plan.name,
        price: getPrice(plan),
        billing,
        tab: activeTab,
        icon: plan.icon,
      },
    });
  };

  const handleContactSales = () => {
    navigate('/signup', { state: { role: 'Enterprise', enterprise: true } });
  };

  return (
    <div className="lp-root">
      <style>{LANDING_STYLES}</style>

      {/* ── Navbar: logo + "See Plans" only ── */}
     <nav className="lp-nav">
 <a href="/" className="lp-nav-logo">
  <img src={logo} alt="AppleKul" className="lp-nav-logo-img" />
  <span className="lp-nav-brand">
    AppleKul <span>One</span>
  </span>
</a>


  <button className="lp-btn-solid" onClick={scrollToPlans}>
    See Plans
  </button>
</nav>

      {/* ══ HERO ══ */}
      <section className="lp-hero">
        <div className="lp-hero-bg" />
        <div className="lp-blob" style={{ width:'32rem',height:'32rem',background:'rgba(52,211,153,.12)',top:'-8rem',left:'-8rem',animationDuration:'16s' }} />
        <div className="lp-blob" style={{ width:'22rem',height:'22rem',background:'rgba(6,95,70,.2)',bottom:'-4rem',right:'-4rem',animationDuration:'20s',animationDelay:'5s' }} />
        <div className="lp-blob" style={{ width:'16rem',height:'16rem',background:'rgba(52,211,153,.1)',top:'40%',right:'8%',animationDuration:'12s',animationDelay:'8s' }} />
        <div className="lp-grid-overlay" />

     

         

          <h1 className="lp-hero-title">
            <span className="brand-name">AppleKul</span>
       
            <span className=" text-green-400"> One</span>
          </h1>

          <p className="lp-hero-punchline">
            No more guess work &mdash; <span className="hl">only daily insights</span>
          </p>
          <p className="lp-hero-sub">
  The complete orchard intelligence suite for growers, developers &amp; cooperatives.
  
</p>

 <div className="lp-hero-content">
          <div className="lp-hero-badge">
            <span className="lp-hero-badge-dot" />
            Now live — Orchard Intelligence Platform
          </div>
          <div className="lp-hero-cta-group">
            <button className="lp-hero-cta-primary" onClick={scrollToPlans}>
               Choose Your Plan
            </button>
           
          </div>
        </div>

        <div className="lp-stats-bar">
          {[
            { val: '10,000+', lbl: 'Orchards Managed' },
            { val: '₹0',      lbl: 'First Month Free' },
            { val: '8',       lbl: 'Intelligence Modules' },
            { val: '24/7',    lbl: 'AI Monitoring' },
          ].map(s => (
            <div key={s.lbl} className="lp-stat">
              <div className="lp-stat-val">{s.val}</div>
              <div className="lp-stat-lbl">{s.lbl}</div>
            </div>
          ))}
        </div>

        <div className="lp-scroll-hint" onClick={scrollToPlans}>
          <span>Scroll to plans</span>
          <div className="lp-scroll-arrow">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="2,4 6,8 10,4" />
            </svg>
          </div>
        </div>
      </section>

      {/* ══ PLANS ══ */}
      <section className="lp-plans" id="plans-section">
        <div className="lp-plans-inner">
          <div className="lp-plans-head">
            <h2>Choose your plan.</h2>
            <p>Transparent pricing for every stage of your orchard journey.</p>
          </div>

          {/* Tabs */}
          <div className="lp-tab-bar">
            {(
              [
                { id: 'individuals', label: 'Individuals' },
                { id: 'business',    label: 'Business' },
                { id: 'cooperative', label: 'Students / Agronomists' },
              ] as Array<{ id: 'individuals' | 'business' | 'cooperative'; label: string }>
            ).map(tab => (
              <button
                key={tab.id}
                className={`lp-tab${activeTab === tab.id ? ' active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab description */}
          <div className="lp-tab-desc" key={activeTab}>
            <strong>
              {activeTab === 'individuals' && 'Individual Growers & Farmers'}
              {activeTab === 'business' && 'Agri-tech Developers & Businesses'}
              {activeTab === 'cooperative' && 'Students & Agronomists'}
            </strong>
            {' — '}{currentTab.desc}
          </div>

          {/* Billing info - Annual only */}
          <div className="lp-billing-toggle">
            <div className="lp-billing-pill">
              <span style={{ fontWeight:700,color:'#374151',fontSize:'.82rem' }}>Annual plan, billed monthly</span>
            </div>
          </div>

          {/* Cards */}
          <div className="lp-plans-grid" key={activeTab + billing}>
            {plans.map((plan, i) => {
              const price    = getPrice(plan);
              const origPx   = getOrigPrice(plan);
              const saveTxt  = getSave(plan);
              const gstTxt   = getGst(plan);
              const cardClass = `lp-plan-card${plan.featured ? ' featured' : ''}${plan.enterprise ? ' enterprise' : ''}`;

              return (
                <div key={plan.id} className={cardClass} style={{ animationDelay: `${i * 0.1}s` }}>
                  {/* Shimmer top */}
                  <div className="lp-shimmer-bar" style={{
                    background: plan.featured
                      ? 'linear-gradient(90deg,rgba(245,158,11,.3) 25%,rgba(245,158,11,.8) 50%,rgba(245,158,11,.3) 75%)'
                      : plan.enterprise
                        ? 'linear-gradient(90deg,rgba(124,58,237,.3) 25%,rgba(124,58,237,.8) 50%,rgba(124,58,237,.3) 75%)'
                        : undefined,
                  }} />

                  {plan.featured   && <div className="lp-best-badge">Best value</div>}
                  {plan.enterprise && <div className="lp-enterprise-badge">Enterprise</div>}

                  <div className="lp-card-body">
                    <div className="lp-card-plan-name">
                      <span className="plan-icon">{plan.icon}</span>
                      {plan.name}
                    </div>

                    <div className="lp-card-price">
                      {origPx && <span className="orig">{origPx}</span>}
                      {price}
                      {price !== 'Custom' && <span className="freq">/mo</span>}
                    </div>

                    <div className="lp-card-gst">{gstTxt}</div>
                    {saveTxt && <div className="lp-card-save">{saveTxt}</div>}

                    <p className="lp-card-desc">{plan.desc}</p>

                    <ul className="lp-feat-list">
                      {plan.features.map(feat => (
                        <li key={feat} className="lp-feat-item">
                          <CheckIcon />
                          {feat}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="lp-card-footer">
                    <div className="lp-secure-label">
                      <LockIcon />
                      Secure transaction
                    </div>
                    <div className="lp-card-actions">
                      {plan.hasTrial && (
                        <button className="lp-btn-trial" onClick={() => handleFreeTrial(plan)}>
                          Free trial
                        </button>
                      )}
                      {plan.contactSales ? (
                        <button className="lp-btn-contact" onClick={handleContactSales}>
                          Contact sales
                        </button>
                      ) : (
                        <button
                          className={`lp-btn-buy${plan.btnColor === 'blue' ? ' blue' : plan.btnColor === 'purple' ? ' purple' : ''}`}
                          onClick={() => handleBuyNow(plan)}
                        >
                          Buy now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="lp-trust">
        <div className="lp-trust-inner">
          {[
            { icon: '🔒', label: '256-bit SSL Encrypted' },
            { icon: '🛡️', label: 'No credit card required' },
            { icon: '↩️', label: 'Cancel anytime' },
            { icon: '⚡', label: 'Instant access' },
            { icon: '🤝', label: 'Dedicated support' },
          ].map(item => (
            <div key={item.label} className="lp-trust-item">
              <div className="lp-trust-icon">{item.icon}</div>
              {item.label}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default LandingPage;