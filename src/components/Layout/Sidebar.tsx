import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  LogOut,
  X,
  BookOpen,
  IndianRupee,
  Stethoscope,
  FlaskConical,
  Search,
  Satellite,
  CalendarIcon,
  TreePine,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const SIDEBAR_STYLES = `
  /* ── Sidebar slide-in animation ── */
  @keyframes sbSlideIn {
    from { transform: translateX(-100%); opacity: 0.6; }
    to   { transform: translateX(0);     opacity: 1; }
  }
  @keyframes sbFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  /* Overlay backdrop */
  .sb-overlay {
    animation: sbFadeIn 0.2s ease;
  }

  /* Drawer panel */
  .sb-drawer {
    /* mobile: off-canvas slide-in */
    position: fixed;
    top: 0;
    left: 0;
    height: 100dvh;
    width: 16rem;           /* 256px */
    background: #ffffff;
    box-shadow: 4px 0 24px rgba(0,0,0,0.12);
    z-index: 50;
    display: flex;
    flex-direction: column;
    transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
  }
  .sb-drawer.is-closed {
    transform: translateX(-100%);
  }
  .sb-drawer.is-open {
    transform: translateX(0);
    animation: sbSlideIn 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* ── Desktop: always visible, part of flex row ── */
  @media (min-width: 1024px) {
    .sb-drawer {
      position: sticky;   /* keep it in flow on desktop */
      top: 0;
      transform: translateX(0) !important;
      box-shadow: none;
      border-right: 1px solid #e5e7eb;
      height: 100dvh;
      flex-shrink: 0;
    }
    .sb-overlay {
      display: none !important;
    }
  }

  /* Nav link touch target */
  .sb-nav-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    min-height: 44px;
    font-weight: 500;
    font-size: 0.9375rem;
    transition: background 0.15s, color 0.15s;
    color: #374151;
    text-decoration: none;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
  .sb-nav-link:hover {
    background: #f9fafb;
  }
  .sb-nav-link.active {
    background: #f0fdf4;
    color: #15803d;
    border-right: 2px solid #16a34a;
  }

  /* Signout button */
  .sb-signout {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    min-height: 44px;
    width: 100%;
    text-align: left;
    font-weight: 500;
    font-size: 0.9375rem;
    color: #374151;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: background 0.15s;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
  .sb-signout:hover {
    background: #fef2f2;
    color: #dc2626;
  }

  /* App logo inside sidebar (desktop only) */
  .sb-logo {
    display: none;
    align-items: center;
    gap: 0.75rem;
    padding: 1.25rem 1rem 1rem;
    border-bottom: 1px solid #e5e7eb;
  }
  @media (min-width: 1024px) {
    .sb-logo { display: flex; }
  }
`;

const menuItems = [
  { path: '/dashboard',          icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/fields',             icon: MapPin,           label: 'Fields' },
  { path: '/calendar',           icon: CalendarIcon,     label: 'Activity Calendar' },
  { path: '/tree-scouting',      icon: TreePine,           label: 'Tree Scouting' },
  
  
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
    onClose();
  };

  return (
    <>
      <style>{SIDEBAR_STYLES}</style>

      {/* ── Mobile backdrop overlay ── */}
      {isOpen && (
        <div
          className="sb-overlay fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* ── Drawer panel ── */}
      <div
        className={`sb-drawer ${isOpen ? 'is-open' : 'is-closed'}`}
        role="navigation"
        aria-label="Main navigation"
      >
      {/* Desktop logo (hidden on mobile — Navbar shows it there) 
        <div className="sb-logo">
          <img
            src="/logo.png"
            alt="AppleKul Logo"
            className="w-10 h-10 object-contain flex-shrink-0"
          />
          <span className="text-base font-bold text-gray-900 leading-tight">AppleKul One</span>
        </div> */}

        {/* Mobile header row */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 lg:hidden">
          <h2 className="text-base font-semibold text-gray-900">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-0.5">
            {menuItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `sb-nav-link${isActive ? ' active' : ''}`
                  }
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}

            {/* External: Sky Insights satellite view */}
            <li>
              <a
                href="https://skyinsights.applekul.com"
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="sb-nav-link"
              >
                <Satellite className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                <span>Satellite</span>
              </a>
            </li>
          </ul>
        </nav>

        {/* Sign out */}
        <div className="px-3 pb-4 border-t border-gray-200 pt-3">
          <button className="sb-signout" onClick={handleSignOut}>
            <LogOut className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
{/* { path: '/fields',             icon: MapPin,           label: 'Fields' },
  { path: '/finance',            icon: IndianRupee,      label: 'Finance' },
  { path: '/orchard-doctor',     icon: Stethoscope,      label: 'Orchard Doctor' },
  { path: '/skuast-advisory',    icon: BookOpen,         label: 'SKUAST Advisory' },
  { path: '/soil-test-advisory', icon: FlaskConical,     label: 'Lab-Test' }, */}