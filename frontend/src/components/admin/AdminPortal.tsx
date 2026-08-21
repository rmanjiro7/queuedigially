import React, { useState } from 'react';
import { useQueue } from '../../context/QueueContext';
import { ServiceType, StaffMember, PriorityLevel } from '../../types';
import { 
  ShieldCheck, 
  BarChart3, 
  Layers, 
  Users, 
  QrCode, 
  Settings, 
  Clock, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Edit3, 
  Trash2, 
  Download, 
  Printer, 
  Volume2, 
  ExternalLink, 
  Smartphone, 
  Sparkles, 
  FileSpreadsheet, 
  Activity, 
  X,
  UserPlus,
  LogOut
} from 'lucide-react';
import { generateQRCodeSVG } from '../../utils/qr';

export const AdminPortal: React.FC = () => {
  const {
    services,
    staff,
    tokens,
    settings,
    auditLogs,
    activeWaitingTokens,
    currentlyServingTokens,
    completedTodayTokens,
    updateService,
    addService,
    deleteService,
    updateStaff,
    addStaff,
    updateSettings,
    resetDemoData,
    setCurrentView,
    adminLogout,
    authenticatedAdminEmail
  } = useQueue();

  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'staff' | 'qr' | 'settings'>('overview');

  // Modals
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<ServiceType | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [servicePrefix, setServicePrefix] = useState('G');
  const [serviceAvgMin, setServiceAvgMin] = useState(8);

  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffRole, setStaffRole] = useState<'operator' | 'supervisor' | 'admin'>('operator');
  const [staffCounter, setStaffCounter] = useState('Counter 05');

  // Settings form state
  const [orgName, setOrgName] = useState(settings.organizationName);
  const [venueName, setVenueName] = useState(settings.venueName);
  const [opStart, setOpStart] = useState(settings.operatingHours.start);
  const [opEnd, setOpEnd] = useState(settings.operatingHours.end);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Peak traffic hourly simulation data for chart
  const hourlyActivity = [
    { hour: '08:00', count: 8 },
    { hour: '09:00', count: 24 },
    { hour: '10:00', count: 38 },
    { hour: '11:00', count: 46 },
    { hour: '12:00', count: 35 },
    { hour: '13:00', count: 29 },
    { hour: '14:00', count: 42 },
    { hour: '15:00', count: 31 },
    { hour: '16:00', count: 18 },
    { hour: '17:00', count: 12 },
  ];
  const maxHourly = Math.max(...hourlyActivity.map(h => h.count));

  // Service form handler
  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingService) {
      updateService({
        ...editingService,
        name: serviceName,
        description: serviceDesc,
        prefix: servicePrefix.toUpperCase(),
        avgServiceMinutes: Number(serviceAvgMin),
      });
    } else {
      addService({
        name: serviceName,
        description: serviceDesc,
        prefix: servicePrefix.toUpperCase(),
        avgServiceMinutes: Number(serviceAvgMin),
        icon: 'Info',
        color: 'emerald',
        isActive: true,
      });
    }
    setShowServiceModal(false);
    setEditingService(null);
  };

  const openEditService = (srv: ServiceType) => {
    setEditingService(srv);
    setServiceName(srv.name);
    setServiceDesc(srv.description);
    setServicePrefix(srv.prefix);
    setServiceAvgMin(srv.avgServiceMinutes);
    setShowServiceModal(true);
  };

  // Staff form handler
  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    addStaff({
      name: staffName,
      email: staffEmail,
      role: staffRole,
      assignedCounter: staffCounter,
      assignedServiceIds: services.map(s => s.id),
      isOnline: true,
      avatarUrl: `https://images.unsplash.com/photo-${1534528741775 + staff.length}?w=150&auto=format&fit=crop&q=80`,
    });
    setShowStaffModal(false);
    setStaffName('');
    setStaffEmail('');
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      organizationName: orgName,
      venueName: venueName,
      operatingHours: {
        ...settings.operatingHours,
        start: opStart,
        end: opEnd,
      },
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const exportDataJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      organization: settings.organizationName,
      tokens,
      services,
      staff,
      auditLogs,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `queueflow-export-${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ADMIN HEADER & TAB NAVIGATION */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 backdrop-blur-md shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              <h1 className="text-xl font-black text-white">
                Admin Management Suite
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Enterprise
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {settings.organizationName} • {settings.venueName}
            </p>
          </div>

          {/* Navigation Tab Bar */}
          <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs overflow-x-auto">
            <button
              id="admin-tab-overview"
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold transition-all ${
                activeTab === 'overview' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>

            <button
              id="admin-tab-services"
              onClick={() => setActiveTab('services')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold transition-all ${
                activeTab === 'services' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Services ({services.length})</span>
            </button>

            <button
              id="admin-tab-staff"
              onClick={() => setActiveTab('staff')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold transition-all ${
                activeTab === 'staff' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Staff ({staff.length})</span>
            </button>

            <button
              id="admin-tab-qr"
              onClick={() => setActiveTab('qr')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold transition-all ${
                activeTab === 'qr' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR & Kiosk</span>
            </button>

            <button
              id="admin-tab-settings"
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold transition-all ${
                activeTab === 'settings' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>

            {/* Admin Logout Button */}
            <button
              id="admin-logout-btn"
              onClick={adminLogout}
              title="Sign Out of Admin Portal"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all border border-rose-500/20 ml-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* TAB 1: OVERVIEW & KPI BENTO */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* KPI BENTO GRID */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                <p className="text-[11px] font-semibold uppercase text-slate-400 mb-1">Active Queues</p>
                <p className="text-2xl font-black text-white font-mono">{services.filter(s => s.isActive).length}</p>
                <span className="text-[10px] text-emerald-400 font-medium">All systems online</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                <p className="text-[11px] font-semibold uppercase text-slate-400 mb-1">Total Today</p>
                <p className="text-2xl font-black text-blue-400 font-mono">{tokens.length}</p>
                <span className="text-[10px] text-blue-400 font-medium">+14% vs yesterday</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                <p className="text-[11px] font-semibold uppercase text-slate-400 mb-1">Waiting Now</p>
                <p className="text-2xl font-black text-amber-400 font-mono">{activeWaitingTokens.length}</p>
                <span className="text-[10px] text-amber-400 font-medium">In active lines</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                <p className="text-[11px] font-semibold uppercase text-slate-400 mb-1">Now Serving</p>
                <p className="text-2xl font-black text-teal-400 font-mono">{currentlyServingTokens.length}</p>
                <span className="text-[10px] text-teal-400 font-medium">At service counters</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                <p className="text-[11px] font-semibold uppercase text-slate-400 mb-1">Avg Wait Time</p>
                <p className="text-2xl font-black text-emerald-400 font-mono">7.8m</p>
                <span className="text-[10px] text-emerald-400 font-medium">-2.4m vs target</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                <p className="text-[11px] font-semibold uppercase text-slate-400 mb-1">SLA Completed</p>
                <p className="text-2xl font-black text-purple-400 font-mono">98.9%</p>
                <span className="text-[10px] text-purple-400 font-medium">Service level met</span>
              </div>

            </div>

            {/* 2-COLUMN SECTION: Peak Hours Chart + Live Audit Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Peak Activity Chart (7 cols) */}
              <div className="lg:col-span-7 rounded-3xl border border-slate-800 bg-slate-900/90 p-6 backdrop-blur-xl shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Hourly Throughput & Peak Demand
                    </h3>
                    <p className="text-xs text-slate-400">
                      Customer arrivals and token generations across the day
                    </p>
                  </div>
                  <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-slate-800 text-slate-300">
                    Peak: 11:00 AM
                  </span>
                </div>

                {/* Simulated SVG Bar Chart */}
                <div className="h-56 flex items-end gap-2 sm:gap-3 pt-6 pb-2 px-2 border-b border-slate-800">
                  {hourlyActivity.map((item) => {
                    const heightPercent = Math.round((item.count / maxHourly) * 100);
                    const isPeak = item.count === maxHourly;

                    return (
                      <div key={item.hour} className="flex-1 flex flex-col items-center gap-1 group relative">
                        {/* Tooltip on hover */}
                        <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-[10px] text-white font-mono px-1.5 py-0.5 rounded shadow pointer-events-none">
                          {item.count} tickets
                        </div>

                        {/* Bar */}
                        <div 
                          className={`w-full rounded-t-lg transition-all duration-300 ${
                            isPeak 
                              ? 'bg-gradient-to-t from-purple-600 to-pink-500' 
                              : 'bg-slate-800 hover:bg-slate-700'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        />
                        <span className="text-[9px] font-mono text-slate-500">
                          {item.hour.slice(0, 2)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Breakdown by Service Types */}
                <div className="mt-6 space-y-3">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Service Utilization Today
                  </h4>
                  {services.slice(0, 3).map((srv) => {
                    const count = tokens.filter(t => t.serviceId === srv.id).length;
                    const percent = Math.min(100, Math.round((count / Math.max(1, tokens.length)) * 100));

                    return (
                      <div key={srv.id} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-300 font-medium">{srv.name}</span>
                          <span className="text-slate-400 font-mono">{count} tickets ({percent}%)</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-emerald-400 rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>

              {/* Real-Time Audit Log (5 cols) */}
              <div className="lg:col-span-5 rounded-3xl border border-slate-800 bg-slate-900/90 p-6 backdrop-blur-xl shadow-xl flex flex-col h-[520px]">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-400" />
                    <h3 className="text-base font-bold text-white">Live System Audit Log</h3>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>

                <div className="flex-1 overflow-y-auto pt-3 space-y-3 pr-1">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-bold ${
                          log.type === 'success' ? 'text-emerald-400' : log.type === 'warning' ? 'text-amber-400' : 'text-purple-400'
                        }`}>
                          {log.action}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-300">{log.details}</p>
                      <span className="text-[10px] text-slate-500 mt-1 block">Actor: {log.actor}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: SERVICES CONFIGURATION */}
        {activeTab === 'services' && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">Service Department Directory</h3>
                <p className="text-xs text-slate-400">Configure ticket prefix codes, estimated handling durations and capacity</p>
              </div>
              <button
                id="admin-add-service-btn"
                onClick={() => {
                  setEditingService(null);
                  setServiceName('');
                  setServiceDesc('');
                  setServicePrefix('X');
                  setServiceAvgMin(8);
                  setShowServiceModal(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Department</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((srv) => (
                <div key={srv.id} className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-900 text-purple-300 border border-purple-500/30">
                        {srv.prefix}-XXX
                      </span>
                      <button
                        onClick={() => updateService({ ...srv, isActive: !srv.isActive })}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          srv.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {srv.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </div>

                    <h4 className="font-bold text-white text-base mb-1">{srv.name}</h4>
                    <p className="text-xs text-slate-400 mb-4">{srv.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      Avg: <strong className="text-white">{srv.avgServiceMinutes} mins</strong>
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditService(srv)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteService(srv.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: STAFF MANAGEMENT */}
        {activeTab === 'staff' && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">Staff Roster & Counters</h3>
                <p className="text-xs text-slate-400">Assign desk terminals, manage roles and view today's productivity</p>
              </div>
              <button
                id="admin-add-staff-btn"
                onClick={() => setShowStaffModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Staff Member</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {staff.map((member) => (
                <div key={member.id} className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
                  <img
                    src={member.avatarUrl}
                    alt={member.name}
                    className="w-16 h-16 rounded-2xl mx-auto object-cover border-2 border-purple-500/30 mb-3 shadow"
                  />
                  <h4 className="font-bold text-white text-sm">{member.name}</h4>
                  <p className="text-xs text-purple-400 font-semibold mb-1">{member.assignedCounter}</p>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                    {member.role}
                  </span>

                  <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-left text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Served Today</span>
                      <strong className="text-white font-mono">{member.servedTodayCount}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Avg Time</span>
                      <strong className="text-emerald-400 font-mono">{member.avgHandlingMinutes}m</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: QR CODE & KIOSK GENERATOR */}
        {activeTab === 'qr' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* QR Poster Preview */}
            <div className="lg:col-span-6 rounded-3xl border border-slate-800 bg-slate-900/90 p-8 backdrop-blur-xl shadow-xl flex flex-col items-center text-center">
              <div className="p-6 bg-white rounded-3xl text-slate-950 max-w-sm w-full shadow-2xl">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-950 flex items-center justify-center text-white">
                    <Layers className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="font-extrabold text-base tracking-tight">QueueFlow</span>
                </div>
                <h3 className="font-black text-xl text-slate-950 mb-1">
                  Scan to Join Queue
                </h3>
                <p className="text-xs text-slate-600 mb-4">
                  {settings.organizationName}
                </p>

                <div 
                  className="w-52 h-52 mx-auto mb-4"
                  dangerouslySetInnerHTML={{
                    __html: generateQRCodeSVG(`https://queueflow.app/kiosk/${settings.venueName}`, 200)
                  }}
                />

                <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800">
                  📱 Point camera • Instant pass on phone
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Kiosk Poster</span>
                </button>
                <button
                  onClick={() => setCurrentView('kiosk')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Launch Check-in Tablet</span>
                </button>
              </div>
            </div>

            {/* Direct Links & Setup */}
            <div className="lg:col-span-6 space-y-4">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
                <h4 className="font-bold text-white text-base mb-2">Facility Entry Links</h4>
                <p className="text-xs text-slate-400 mb-4">
                  Use these links for your physical lobby kiosks, tablets, and public waiting TV boards.
                </p>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white block">Customer Web Portal</span>
                      <span className="text-slate-500 font-mono text-[11px]">https://queueflow.app/join</span>
                    </div>
                    <button
                      onClick={() => setCurrentView('customer')}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-emerald-400 font-medium hover:bg-slate-700"
                    >
                      Open
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white block">Lobby Display Board (TV Signage)</span>
                      <span className="text-slate-500 font-mono text-[11px]">https://queueflow.app/display</span>
                    </div>
                    <button
                      onClick={() => setCurrentView('display-board')}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-amber-400 font-medium hover:bg-slate-700"
                    >
                      Open TV
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 5: SYSTEM SETTINGS */}
        {activeTab === 'settings' && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 backdrop-blur-xl shadow-xl max-w-3xl">
            <h3 className="text-lg font-bold text-white mb-1">Queue & Organization Settings</h3>
            <p className="text-xs text-slate-400 mb-6">Configure operating schedules, sound notification behaviors, and export data</p>

            <form onSubmit={handleSaveSettings} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Facility / Venue Location
                  </label>
                  <input
                    type="text"
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Opening Time
                  </label>
                  <input
                    type="time"
                    value={opStart}
                    onChange={(e) => setOpStart(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Closing Time
                  </label>
                  <input
                    type="time"
                    value={opEnd}
                    onChange={(e) => setOpEnd(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <div>
                    <span className="text-xs font-semibold text-white block">Audible Chimes on Ticket Call</span>
                    <span className="text-[11px] text-slate-400">Play standard 3-tone notification chime</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableSoundAlerts}
                    onChange={(e) => updateSettings({ enableSoundAlerts: e.target.checked })}
                    className="w-4 h-4 accent-purple-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <div>
                    <span className="text-xs font-semibold text-white block">Voice Synthesizer Announcements</span>
                    <span className="text-[11px] text-slate-400">Announce ticket numbers over browser text-to-speech</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableSpeechAnnouncements}
                    onChange={(e) => updateSettings({ enableSpeechAnnouncements: e.target.checked })}
                    className="w-4 h-4 accent-purple-600 rounded"
                  />
                </label>
              </div>

              {saveSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Settings successfully saved!
                </div>
              )}

              <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={exportDataJSON}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Export Report (JSON)</span>
                </button>

                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}

      </div>

      {/* SERVICE MODAL */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 p-6 shadow-2xl relative">
            <button
              onClick={() => setShowServiceModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-4">
              {editingService ? 'Edit Service Department' : 'Add New Department'}
            </h3>

            <form onSubmit={handleSaveService} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="e.g. Express Consultation"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={serviceDesc}
                  onChange={(e) => setServiceDesc(e.target.value)}
                  placeholder="Summary for customer self-service screen..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Prefix Letter</label>
                  <input
                    type="text"
                    maxLength={2}
                    required
                    value={servicePrefix}
                    onChange={(e) => setServicePrefix(e.target.value)}
                    placeholder="e.g. A"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white uppercase font-mono outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Avg Duration (min)</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    required
                    value={serviceAvgMin}
                    onChange={(e) => setServiceAvgMin(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STAFF MODAL */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 p-6 shadow-2xl relative">
            <button
              onClick={() => setShowStaffModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-4">Add Staff Member</h3>

            <form onSubmit={handleSaveStaff} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="e.g. Jordan Taylor"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="jordan.taylor@queueflow.internal"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Assigned Counter</label>
                  <input
                    type="text"
                    required
                    value={staffCounter}
                    onChange={(e) => setStaffCounter(e.target.value)}
                    placeholder="e.g. Counter 05"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Role Permission</label>
                  <select
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value as 'operator' | 'supervisor' | 'admin')}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-purple-500"
                  >
                    <option value="operator">Operator</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  Add to Roster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
