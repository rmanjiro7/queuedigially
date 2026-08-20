import React, { useState } from 'react';
import { useQueue } from '../context/QueueContext';
import { AppView } from '../types';
import { 
  Layers, 
  User, 
  Laptop, 
  ShieldCheck, 
  Tv, 
  Tablet, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  ChevronDown, 
  Sparkles,
  Home,
  CheckCircle2
} from 'lucide-react';

export const Header: React.FC = () => {
  const { 
    currentView, 
    setCurrentView, 
    settings, 
    updateSettings, 
    resetDemoData,
    activeWaitingTokens,
    currentlyServingTokens,
    isAdminAuthenticated,
    isStaffAuthenticated,
    adminLogout,
    staffLogout,
    navigateAdmin,
    navigateStaff
  } = useQueue();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleNavClick = (view: AppView) => {
    if (view === 'admin') {
      navigateAdmin();
    } else if (view === 'staff') {
      navigateStaff();
    } else {
      setCurrentView(view);
    }
  };

  const navItems: { view: AppView; label: string; icon: React.ReactNode; badge?: number; authStatus?: boolean }[] = [
    { view: 'customer', label: 'Customer App', icon: <User className="w-4 h-4" /> },
    { view: 'staff', label: 'Staff Terminal', icon: <Laptop className="w-4 h-4" />, badge: activeWaitingTokens.length, authStatus: isStaffAuthenticated },
    { view: 'admin', label: 'Admin Portal', icon: <ShieldCheck className="w-4 h-4" />, authStatus: isAdminAuthenticated },
    { view: 'display-board', label: 'TV Board', icon: <Tv className="w-4 h-4" />, badge: currentlyServingTokens.length },
    { view: 'kiosk', label: 'Kiosk Check-In', icon: <Tablet className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <button 
            id="header-brand-logo"
            onClick={() => setCurrentView('landing')}
            className="flex items-center gap-2.5 group focus:outline-none text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-400 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Layers className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  QueueFlow
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {settings.organizationName}
              </p>
            </div>
          </button>
        </div>

        {/* Navigation Tabs for quick role switching */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
          <button
            id="nav-home"
            onClick={() => setCurrentView('landing')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentView === 'landing'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>

          {navItems.map((item) => {
            const isActive = currentView === item.view || 
              (item.view === 'customer' && currentView === 'customer-ticket') ||
              (item.view === 'admin' && currentView === 'admin-login') ||
              (item.view === 'staff' && currentView === 'staff-login');
            return (
              <button
                key={item.view}
                id={`nav-${item.view}`}
                onClick={() => handleNavClick(item.view)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all relative ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 font-semibold shadow-md shadow-emerald-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`ml-0.5 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-slate-950 text-emerald-400' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Controls & Quick Actions */}
        <div className="flex items-center gap-2">
          
          {/* Mobile Role Switcher Menu */}
          <div className="relative md:hidden">
            <button
              id="mobile-role-dropdown-btn"
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200"
            >
              <span>Views</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900 border border-slate-700 shadow-xl py-1 z-50">
                <button
                  onClick={() => { setCurrentView('landing'); setShowRoleMenu(false); }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                >
                  <Home className="w-4 h-4 text-slate-400" /> Home Page
                </button>
                {navItems.map(item => (
                  <button
                    key={item.view}
                    onClick={() => { handleNavClick(item.view); setShowRoleMenu(false); }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                  >
                    {item.icon} {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sound alert chime toggle */}
          <button
            id="header-sound-toggle-btn"
            onClick={() => updateSettings({ enableSoundAlerts: !settings.enableSoundAlerts })}
            title={settings.enableSoundAlerts ? 'Sound Alert Chimes Enabled' : 'Sound Alerts Muted'}
            className={`p-2 rounded-lg border transition-all ${
              settings.enableSoundAlerts
                ? 'bg-slate-800 border-slate-700 text-emerald-400 hover:bg-slate-700'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            {settings.enableSoundAlerts ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>

          {/* Quick Role Select View button */}
          <button
            id="header-all-roles-btn"
            onClick={() => setCurrentView('role-selector')}
            title="Open Role Selection Hub"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Switch Role</span>
          </button>

          {/* Reset Demo Data */}
          <div className="relative">
            <button
              id="header-reset-demo-btn"
              onClick={() => setShowResetConfirm(!showResetConfirm)}
              title="Reset Sample Data"
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-400 hover:text-slate-200 text-xs transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {showResetConfirm && (
              <div className="absolute right-0 mt-2 w-64 p-3 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl z-50 text-left">
                <p className="text-xs font-semibold text-white mb-1">Reset Demo Data?</p>
                <p className="text-[11px] text-slate-400 mb-3">
                  This will restore all default tokens, services, staff counters, and ticket A-042.
                </p>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      resetDemoData();
                      setShowResetConfirm(false);
                    }}
                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-medium flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3" /> Reset Now
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
