import React, { useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';

const LAYOUT_STYLES = `
  /*
   * Layout shell
   * Mobile  : Navbar (top) + full-width content.
   *           Sidebar slides in as an off-canvas drawer over a backdrop.
   * Desktop : Navbar (top) + [Sidebar 256px | main flex-1] row.
   */

  .layout-root {
    min-height: 100dvh;
    background: #f9fafb;
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
  }

  /* Sticky top navbar */
  .layout-navbar {
    position: sticky;
    top: 0;
    z-index: 30;
    flex-shrink: 0;
  }

  /* Row that holds sidebar + main */
  .layout-body {
    flex: 1;
    display: flex;
    min-width: 0;
    overflow-x: hidden;
  }

  /* Main content */
  .layout-main {
    flex: 1;
    min-width: 0;
    overflow-x: hidden;
    /* phone: no extra padding — pages handle their own */
    padding: 0.75rem;
  }

  /* Tablet (640px+): slightly more breathing room */
  @media (min-width: 640px) {
    .layout-main {
      padding: 1rem;
    }
  }

  /* Desktop (1024px+): sidebar always visible, comfortable content padding */
  @media (min-width: 1024px) {
    .layout-main {
      padding: 1.5rem;
    }
  }

  .layout-inner {
    max-width: 80rem; /* 7xl */
    margin-left: auto;
    margin-right: auto;
    width: 100%;
  }
`;

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, session } = useAuth();

  const displayUser = useMemo(
    () => ({
      name: user?.name || session?.user?.email || 'Account',
      farmName: user?.farmName || 'Farm',
      avatar: user?.avatar,
    }),
    [session?.user?.email, user?.avatar, user?.farmName, user?.name]
  );

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar  = () => setSidebarOpen(false);

  return (
    <>
      <style>{LAYOUT_STYLES}</style>

      <div className="layout-root">
        {/* ── Top Navbar ── */}
        <div className="layout-navbar">
          <Navbar onToggleSidebar={toggleSidebar} user={displayUser} />
        </div>

        {/* ── Body row ── */}
        <div className="layout-body">
          {/* Sidebar — off-canvas on mobile, sticky on desktop */}
          <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

          {/* Page content */}
          <main className="layout-main" id="main-content">
            <div className="layout-inner">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default Layout;
