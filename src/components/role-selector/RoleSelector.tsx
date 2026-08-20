import React from 'react';
import { useQueue } from '../../context/QueueContext';
import { AppView } from '../../types';
import { 
  Users, 
  Laptop, 
  ShieldCheck, 
  Tv, 
  Tablet, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  Layers
} from 'lucide-react';

export const RoleSelector: React.FC = () => {
  const { 
    setCurrentView, 
    activeWaitingTokens, 
    currentlyServingTokens, 
    completedTodayTokens,
    tokens,
    navigateAdmin,
    navigateStaff
  } = useQueue();

  const handleRoleClick = (viewId: AppView) => {
    if (viewId === 'admin') {
      navigateAdmin();
    } else if (viewId === 'staff') {
      navigateStaff();
    } else {
      setCurrentView(viewId);
    }
  };

  const roles: {
    id: AppView;
    title: string;
    tagline: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    gradient: string;
    badge?: string;
    stats?: string;
  }[] = [
    {
      id: 'customer',
      title: 'Customer Experience',
      tagline: 'Track Token & Join Queue',
      description: 'Check active waiting times, select a department, get a digital ticket (e.g. A-042), and watch live position with alert chimes.',
      icon: <Users className="w-6 h-6 text-emerald-400" />,
      color: 'border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-950/20',
      gradient: 'from-emerald-500/20 to-teal-500/5',
      badge: 'Live Status A-042',
      stats: `${activeWaitingTokens.length} waiting now`,
    },
    {
      id: 'staff',
      title: 'Staff Service Terminal',
      tagline: 'Counter Desk Operator',
      description: 'Call next in line, start serving, mark completed with 1-click, manage hold/skipped tickets, and monitor daily quota.',
      icon: <Laptop className="w-6 h-6 text-blue-400" />,
      color: 'border-blue-500/30 hover:border-blue-500/60 bg-blue-950/20',
      gradient: 'from-blue-500/20 to-cyan-500/5',
      badge: 'Counter 03 Active',
      stats: `${completedTodayTokens.length} served today`,
    },
    {
      id: 'admin',
      title: 'Organization Admin Portal',
      tagline: 'Supervisors & Managers',
      description: 'Real-time KPI bento grid, service type configuration, staff terminal roster, QR code kiosk generator, and hourly throughput metrics.',
      icon: <ShieldCheck className="w-6 h-6 text-purple-400" />,
      color: 'border-purple-500/30 hover:border-purple-500/60 bg-purple-950/20',
      gradient: 'from-purple-500/20 to-pink-500/5',
      badge: 'Full Access',
      stats: '5 Departments Active',
    },
    {
      id: 'display-board',
      title: 'Lobby Display Board',
      tagline: 'Fullscreen Waiting Room TV',
      description: 'High-contrast digital signage board with real-time "NOW SERVING" counters, upcoming ticker, and audible airport-grade chimes.',
      icon: <Tv className="w-6 h-6 text-amber-400" />,
      color: 'border-amber-500/30 hover:border-amber-500/60 bg-amber-950/20',
      gradient: 'from-amber-500/20 to-orange-500/5',
      badge: 'Chime & TTS Ready',
      stats: `${currentlyServingTokens.length} counters calling`,
    },
    {
      id: 'kiosk',
      title: 'Self-Service Lobby Kiosk',
      tagline: 'Tablet Check-In Station',
      description: 'Touchscreen entry point for physical lobbies allowing walk-in visitors to select a reason for visit and print/scan digital tickets.',
      icon: <Tablet className="w-6 h-6 text-cyan-400" />,
      color: 'border-cyan-500/30 hover:border-cyan-500/60 bg-cyan-950/20',
      gradient: 'from-cyan-500/20 to-blue-500/5',
      badge: 'Touch Optimized',
      stats: 'Instant Pass Generation',
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background Dot Matrix Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.15] pointer-events-none" 
        style={{
          backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />
      
      {/* Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto w-full relative z-10">
        
        {/* Header Header Info */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-emerald-400 mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Multi-Role Workspace</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            Select Your Role to Continue
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Choose an interface to test the complete queue lifecycle. All views synchronize in real-time across devices and browser tabs.
          </p>
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {roles.map((role) => (
            <button
              key={role.id}
              id={`role-card-${role.id}`}
              onClick={() => handleRoleClick(role.id)}
              className={`group relative text-left p-6 rounded-2xl border ${role.color} bg-slate-900/80 backdrop-blur-sm transition-all duration-200 hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between overflow-hidden`}
            >
              {/* Card gradient overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${role.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />

              <div className="relative z-10">
                {/* Top icon and badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                    {role.icon}
                  </div>
                  {role.badge && (
                    <span className="text-[11px] font-semibold tracking-wide px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {role.badge}
                    </span>
                  )}
                </div>

                {/* Role Titles */}
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-emerald-300 transition-colors">
                  {role.title}
                </h3>
                <p className="text-xs font-medium text-slate-400 mb-3">
                  {role.tagline}
                </p>

                {/* Description */}
                <p className="text-xs text-slate-400/90 leading-relaxed mb-6">
                  {role.description}
                </p>
              </div>

              {/* Bottom Footer Details */}
              <div className="relative z-10 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500">
                  {role.stats}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition-transform">
                  Enter <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Quick Demo Help Banner */}
        <div className="mt-10 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">
                Want to test the full loop?
              </p>
              <p className="text-[11px] text-slate-400">
                Open <span className="text-emerald-300 font-medium">Customer App</span> in one window and <span className="text-blue-300 font-medium">Staff Terminal</span> in another to watch live real-time chimes!
              </p>
            </div>
          </div>

          <button
            id="role-try-customer-btn"
            onClick={() => setCurrentView('customer')}
            className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors shadow-sm"
          >
            Launch Customer Experience
          </button>
        </div>

      </div>
    </div>
  );
};
