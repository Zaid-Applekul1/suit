import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Menu,
  Edit,
  LogOut,
  ChevronDown,
  Hospital,
  BarChart2,
  GraduationCap,
  Mail,
  Network,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface NavbarProps {
  onToggleSidebar: () => void;
  user: { name: string; farmName: string; avatar?: string };
}

const NAVBAR_STYLES = `
  /* ── Navbar shell ── */
  .nav-bar {
    background: #ffffff;
    border-bottom: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    width: 100%;
  }

  .nav-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 0.75rem;
    height: 56px;      /* phone height */
    gap: 0.5rem;
  }

  /* Slightly taller on iPad+ */
  @media (min-width: 640px) {
    .nav-inner { height: 64px; padding: 0 1rem; }
  }
  @media (min-width: 1024px) {
    .nav-inner { height: 68px; padding: 0 1.25rem; }
  }

  /* Left slot: hamburger + logo */
  .nav-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
    flex: 1;
  }

  /* Logo image — slightly smaller on phones */
  .nav-logo-img {
    width: 2.5rem;
    height: 2.5rem;
    object-fit: contain;
    flex-shrink: 0;
  }
  @media (min-width: 640px) {
    .nav-logo-img { width: 3rem; height: 3rem; }
  }

  /* App title — hide on very small phones (<380px) */
  .nav-title {
    font-size: 1rem;
    font-weight: 700;
    color: #111827;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  @media (max-width: 380px) {
    .nav-title { display: none; }
  }
  @media (min-width: 640px) {
    .nav-title { font-size: 1.125rem; }
  }

  /* Hamburger button */
  .nav-hamburger {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 44px;
    min-height: 44px;
    border-radius: 0.375rem;
    background: transparent;
    border: none;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    transition: background 0.15s;
    flex-shrink: 0;
  }
  .nav-hamburger:hover { background: #f3f4f6; }

  /* Hide hamburger on desktop (sidebar is always visible) */
  @media (min-width: 1024px) {
    .nav-hamburger { display: none; }
  }

  /* Right slot: avatar button */
  .nav-avatar-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem 0.5rem;
    border-radius: 0.5rem;
    background: transparent;
    border: none;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    transition: background 0.15s;
    min-height: 44px;
    flex-shrink: 0;
  }
  .nav-avatar-btn:hover { background: #f9fafb; }

  /* User text block — only visible on md+ */
  .nav-user-text {
    display: none;
    text-align: right;
  }
  @media (min-width: 768px) {
    .nav-user-text { display: block; }
  }

  /* Avatar circle */
  .nav-avatar {
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 9999px;
    background: #dcfce7;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;
  }

  /* Dropdown panel */
  .nav-dropdown {
    position: absolute;
    right: 0;
    top: calc(100% + 0.375rem);
    width: 14rem;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 0.625rem;
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    z-index: 100;
    overflow: hidden;
    animation: navDropIn 0.15s ease;
  }

  /* On very narrow phones, full-width from right edge */
  @media (max-width: 400px) {
    .nav-dropdown {
      width: calc(100vw - 1.5rem);
      right: -0.75rem;
    }
  }

  @keyframes navDropIn {
    from { opacity: 0; transform: translateY(-6px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0)   scale(1); }
  }

  /* Dropdown items */
  .nav-drop-item {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 0.6rem 1rem;
    font-size: 0.875rem;
    color: #374151;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    text-decoration: none;
    transition: background 0.12s;
    min-height: 44px;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
  .nav-drop-item:hover { background: #f9fafb; }
  .nav-drop-item.danger { color: #dc2626; }
  .nav-drop-item.danger:hover { background: #fef2f2; }
`;

const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, user }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { signOut } = useAuth();

  /* Close dropdown on outside click / touch */
  useEffect(() => {
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, []);

  const handleEditProfile = () => {
    setIsDropdownOpen(false);
    navigate('/profile');
  };

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await signOut();
    navigate('/login');
  };

  return (
    <>
      <style>{NAVBAR_STYLES}</style>

      <nav className="nav-bar" role="banner">
        <div className="nav-inner">
          {/* ── Left: hamburger + logo ── */}
          <div className="nav-left">
            <button
              className="nav-hamburger"
              onClick={onToggleSidebar}
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5 text-gray-600" aria-hidden="true" />
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <img
                src="/logo.png"
                alt="AppleKul Logo"
                className="nav-logo-img"
              />
              <h1 className="nav-title">AppleKul™ Suite</h1>
            </div>
          </div>

          {/* ── Right: avatar dropdown ── */}
          <div className="relative flex-shrink-0" ref={dropdownRef}>
            <button
              className="nav-avatar-btn"
              onClick={() => setIsDropdownOpen((o) => !o)}
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
              aria-label="Open account menu"
            >
              {/* User name + farm (hidden on small screens) */}
              <div className="nav-user-text">
                <p className="text-sm font-medium text-gray-900 leading-tight truncate max-w-[120px]">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 leading-tight truncate max-w-[120px]">
                  {user.farmName}
                </p>
              </div>

              {/* Avatar circle */}
              <div className="nav-avatar">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-green-600" aria-hidden="true" />
                )}
              </div>

              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>

            {/* ── Dropdown panel ── */}
            {isDropdownOpen && (
              <div className="nav-dropdown" role="menu" aria-label="Account options">
                {/* User identity header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                  <div className="nav-avatar flex-shrink-0">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-green-600" aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.farmName}</p>
                  </div>
                </div>

                {/* Actions */}
                <button
                  onClick={handleEditProfile}
                  className="nav-drop-item"
                  role="menuitem"
                >
                  <Edit className="w-4 h-4 mr-3 text-gray-400 flex-shrink-0" aria-hidden="true" />
                  Edit Profile
                </button>

                {/* External links */}
                {[
                  { href: 'https://www.applekul.com/hospital',      Icon: Hospital,       label: 'Hospital' },
                  { href: 'https://www.applekul.com/marketinsights', Icon: BarChart2,      label: 'Market Insights' },
                  { href: 'https://www.applekul.com/university',     Icon: GraduationCap,  label: 'University' },
                  { href: 'https://www.applekul.com/contact',        Icon: Mail,           label: 'Contact' },
                  { href: 'https://www.applekul.com/kulnet',         Icon: Network,        label: 'KulNet' },
                ].map(({ href, Icon, label }) => (
                  <a
                    key={href}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nav-drop-item"
                    role="menuitem"
                  >
                    <Icon className="w-4 h-4 mr-3 text-gray-400 flex-shrink-0" aria-hidden="true" />
                    {label}
                  </a>
                ))}

                <div className="border-t border-gray-100 my-1" role="separator" />

                <button
                  onClick={handleLogout}
                  className="nav-drop-item danger"
                  role="menuitem"
                >
                  <LogOut className="w-4 h-4 mr-3 flex-shrink-0" aria-hidden="true" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
