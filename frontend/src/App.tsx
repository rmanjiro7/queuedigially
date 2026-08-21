import React from 'react';
import { QueueProvider, useQueue } from './context/QueueContext';
import { Header } from './components/Header';
import { SplashScreen } from './components/splash/SplashScreen';
import { LandingPage } from './components/landing/LandingPage';
import { RoleSelector } from './components/role-selector/RoleSelector';
import { CustomerView } from './components/customer/CustomerView';
import { StaffTerminal } from './components/staff/StaffTerminal';
import { StaffLogin } from './components/staff/StaffLogin';
import { AdminPortal } from './components/admin/AdminPortal';
import { AdminLogin } from './components/admin/AdminLogin';
import { DisplayBoard } from './components/display/DisplayBoard';
import { KioskMode } from './components/kiosk/KioskMode';

const MainRouter: React.FC = () => {
  const { currentView, setCurrentView, isAdminAuthenticated, isStaffAuthenticated } = useQueue();

  // If on initial startup splash screen
  if (currentView === 'splash') {
    return <SplashScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      {/* Show header for all views except pure full-screen TV/Kiosk modes */}
      {currentView !== 'display-board' && currentView !== 'kiosk' && <Header />}
      
      {/* For TV and Kiosk, show a subtle quick exit bar at top */}
      {(currentView === 'display-board' || currentView === 'kiosk') && (
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-1.5 flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            {currentView === 'display-board' ? 'Lobby TV Signage Mode' : 'Lobby Tablet Check-in Kiosk'}
          </span>
          <div className="flex items-center gap-3">
            <button
              id="exit-fullscreen-mode-btn"
              onClick={() => setCurrentView('landing')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium cursor-pointer"
            >
              Exit to Menu
            </button>
          </div>
        </div>
      )}

      <main className="flex-1">
        {currentView === 'landing' && <LandingPage />}
        {currentView === 'role-selector' && <RoleSelector />}
        {(currentView === 'customer' || currentView === 'customer-ticket') && <CustomerView />}
        
        {/* Staff Authentication Gate */}
        {currentView === 'staff-login' && <StaffLogin />}
        {currentView === 'staff' && (
          isStaffAuthenticated ? <StaffTerminal /> : <StaffLogin />
        )}

        {/* Admin Authentication Gate (CRITICAL: Never expose Admin Dashboard before login) */}
        {currentView === 'admin-login' && <AdminLogin />}
        {currentView === 'admin' && (
          isAdminAuthenticated ? <AdminPortal /> : <AdminLogin />
        )}

        {currentView === 'display-board' && <DisplayBoard />}
        {currentView === 'kiosk' && <KioskMode />}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <QueueProvider>
      <MainRouter />
    </QueueProvider>
  );
}
