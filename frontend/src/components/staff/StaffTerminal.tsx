import React, { useState, useEffect } from 'react';
import { useQueue } from '../../context/QueueContext';
import { 
  Laptop, 
  UserCheck, 
  PhoneForwarded, 
  SkipForward, 
  RotateCcw, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  Users, 
  PlusCircle, 
  Volume2, 
  AlertTriangle, 
  User, 
  Flame, 
  ChevronDown, 
  Radio, 
  Layers,
  ArrowRight,
  X,
  LogOut
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const StaffTerminal: React.FC = () => {
  const {
    staff,
    selectedStaffId,
    setSelectedStaffId,
    selectedStaff,
    services,
    tokens,
    activeWaitingTokens,
    currentlyServingTokens,
    completedTodayTokens,
    callNextToken,
    startServingToken,
    markTokenServed,
    skipToken,
    recallToken,
    createToken,
    triggerManualChime,
    staffLogout
  } = useQueue();

  const [selectedServiceFilter, setSelectedServiceFilter] = useState<string>('all');
  const [staffStatus, setStaffStatus] = useState<'online' | 'break' | 'busy'>('online');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'waiting' | 'skipped' | 'completed'>('waiting');
  
  // Walk-in modal
  const [showWalkinModal, setShowWalkinModal] = useState(false);
  const [walkinName, setWalkinName] = useState('');
  const [walkinServiceId, setWalkinServiceId] = useState(services[0]?.id || 'srv-1');
  const [walkinPriority, setWalkinPriority] = useState<'normal' | 'vip'>('normal');

  // Currently serving token for this staff's assigned counter
  const myServingToken = currentlyServingTokens.find(
    t => t.counterAssigned === selectedStaff?.assignedCounter || t.staffAssignedName === selectedStaff?.name
  );

  // Skipped tokens
  const skippedTokens = tokens.filter(t => t.status === 'skipped');

  // Timer effect for currently serving customer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (myServingToken) {
      const startTime = myServingToken.servedAt || myServingToken.calledAt || Date.now();
      const calcElapsed = () => Math.max(0, Math.floor((Date.now() - startTime) / 1000));
      setElapsedSeconds(calcElapsed());

      interval = setInterval(() => {
        setElapsedSeconds(calcElapsed());
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }

    return () => clearInterval(interval);
  }, [myServingToken]);

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  };

  const handleCallNext = () => {
    if (!selectedStaff) return;
    const filter = selectedServiceFilter === 'all' ? undefined : selectedServiceFilter;
    const called = callNextToken(selectedStaff.id, filter);
    if (called) {
      confetti({
        particleCount: 50,
        spread: 45,
        origin: { y: 0.8 }
      });
    }
  };

  const handleMarkServed = () => {
    if (!myServingToken || !selectedStaff) return;
    markTokenServed(myServingToken.id, selectedStaff.id);
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 }
    });
  };

  const handleWalkinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createToken(
      walkinServiceId,
      walkinName.trim() || 'Walk-in Guest',
      undefined,
      undefined,
      'Desk Walk-in Ticket',
      walkinPriority
    );
    setWalkinName('');
    setShowWalkinModal(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* TOP BAR: Staff Identity, Counter & Controls */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shadow-xl">
          
          {/* Left: Staff Selector & Counter */}
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <img
                src={selectedStaff?.avatarUrl || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150"}
                alt={selectedStaff?.name}
                className="w-12 h-12 rounded-xl object-cover border-2 border-slate-700 shadow-md"
              />
              <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                staffStatus === 'online' ? 'bg-emerald-400' : staffStatus === 'break' ? 'bg-amber-400' : 'bg-rose-400'
              }`} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <select
                  id="staff-operator-select"
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="bg-transparent font-bold text-base text-white outline-none cursor-pointer hover:text-emerald-400 transition-colors"
                >
                  {staff.map((member) => (
                    <option key={member.id} value={member.id} className="bg-slate-900 text-white">
                      {member.name} ({member.assignedCounter})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {selectedStaff?.role}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span className="font-semibold text-emerald-400">{selectedStaff?.assignedCounter}</span>
                <span>•</span>
                <span>Handling {selectedStaff?.assignedServiceIds.length} categories</span>
              </div>
            </div>
          </div>

          {/* Right: Status Switcher & Walk-in button */}
          <div className="flex items-center gap-3">
            
            {/* Status Pills */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                id="staff-status-online"
                onClick={() => setStaffStatus('online')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  staffStatus === 'online' ? 'bg-emerald-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Online
              </button>
              <button
                id="staff-status-break"
                onClick={() => setStaffStatus('break')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  staffStatus === 'break' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Break
              </button>
              <button
                id="staff-status-busy"
                onClick={() => setStaffStatus('busy')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  staffStatus === 'busy' ? 'bg-rose-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Away
              </button>
            </div>

            {/* Quick Walk-in Ticket generator */}
            <button
              id="staff-walkin-ticket-btn"
              onClick={() => setShowWalkinModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white shadow-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>Walk-in Ticket</span>
            </button>

            {/* Staff Sign Out button */}
            <button
              id="staff-logout-btn"
              onClick={staffLogout}
              title="Sign Out from Staff Terminal"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all border border-rose-500/20"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>

        </div>

        {/* MAIN 2-COLUMN OPERATOR WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: Currently Serving Hero Card + Quick Action (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* CURRENTLY SERVING HERO CARD */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-7 backdrop-blur-xl shadow-2xl relative overflow-hidden">
              
              {/* Header inside card */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Currently at {selectedStaff?.assignedCounter}
                  </span>
                </div>

                {myServingToken && (
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold bg-slate-950 px-3 py-1 rounded-xl border border-slate-800 text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{formatElapsed(elapsedSeconds)}</span>
                  </div>
                )}
              </div>

              {myServingToken ? (
                <div>
                  {/* Token Details */}
                  <div className="flex flex-wrap items-start justify-between gap-4 py-2 mb-6">
                    <div>
                      <div className="flex items-center gap-2.5 mb-1">
                        <h2 className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">
                          {myServingToken.tokenNumber}
                        </h2>
                        {myServingToken.priority === 'vip' && (
                          <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" /> VIP
                          </span>
                        )}
                      </div>
                      <p className="text-lg font-bold text-slate-200">
                        {myServingToken.customerName}
                      </p>
                      <p className="text-xs text-slate-400 font-medium">
                        {myServingToken.serviceName} • {myServingToken.customerPhone || 'No phone'}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                        myServingToken.status === 'called' 
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                          : 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                      }`}>
                        {myServingToken.status === 'called' ? 'Called (Awaiting Step Up)' : 'In Consultation'}
                      </span>
                      {myServingToken.calledAt && (
                        <p className="text-[11px] text-slate-500 mt-1">
                          Called at {new Date(myServingToken.calledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Notes / Reason */}
                  {myServingToken.notes && (
                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 mb-6">
                      <span className="font-semibold text-slate-400 block mb-0.5">Customer Notes:</span>
                      {myServingToken.notes}
                    </div>
                  )}

                  {/* Action Controls for Current Customer */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800">
                    
                    {/* Mark Served / Complete */}
                    <button
                      id="staff-mark-served-btn"
                      onClick={handleMarkServed}
                      className="py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark Served</span>
                    </button>

                    {/* Start Serving (if state is called) or Re-announce */}
                    {myServingToken.status === 'called' ? (
                      <button
                        id="staff-start-serving-btn"
                        onClick={() => startServingToken(myServingToken.id, selectedStaff!.id)}
                        className="py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Customer Arrived</span>
                      </button>
                    ) : (
                      <button
                        id="staff-recall-btn"
                        onClick={() => {
                          triggerManualChime(myServingToken.tokenNumber, selectedStaff?.assignedCounter || 'Counter 03', myServingToken.customerName);
                        }}
                        className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                      >
                        <Volume2 className="w-4 h-4 text-emerald-400" />
                        <span>Repeat Chime</span>
                      </button>
                    )}

                    {/* Skip / No-show */}
                    <button
                      id="staff-skip-btn"
                      onClick={() => skipToken(myServingToken.id, selectedStaff!.id)}
                      className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <SkipForward className="w-4 h-4" />
                      <span>Skip / No-Show</span>
                    </button>

                  </div>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 mx-auto flex items-center justify-center text-slate-500 mb-4">
                    <User className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    Desk is Ready
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
                    {activeWaitingTokens.length > 0 
                      ? `There are ${activeWaitingTokens.length} customers waiting in line. Click below to call the next ticket.`
                      : 'All queues are currently clear. Great job!'}
                  </p>

                  <button
                    id="staff-call-next-hero-btn"
                    onClick={handleCallNext}
                    disabled={activeWaitingTokens.length === 0}
                    className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                  >
                    <PhoneForwarded className="w-5 h-5" />
                    <span>Call Next Customer</span>
                  </button>
                </div>
              )}

            </div>

            {/* QUICK STATS BENTO FOR STAFF */}
            <div className="grid grid-cols-3 gap-4">
              
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span className="text-[11px] font-semibold uppercase">Served Today</span>
                </div>
                <span className="text-2xl font-bold text-white font-mono">
                  {selectedStaff?.servedTodayCount || 0}
                </span>
                <p className="text-[10px] text-slate-500 mt-0.5">Tickets completed</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span className="text-[11px] font-semibold uppercase">Avg Service</span>
                </div>
                <span className="text-2xl font-bold text-emerald-400 font-mono">
                  {selectedStaff?.avgHandlingMinutes || 7.2}m
                </span>
                <p className="text-[10px] text-slate-500 mt-0.5">Per consultation</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-[11px] font-semibold uppercase">Satisfaction</span>
                </div>
                <span className="text-2xl font-bold text-purple-400 font-mono">
                  99.2%
                </span>
                <p className="text-[10px] text-slate-500 mt-0.5">SLA positive</p>
              </div>

            </div>

          </div>

          {/* RIGHT COLUMN: Waiting Queue Roster & Tabs (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 backdrop-blur-xl shadow-xl flex flex-col h-[520px]">
              
              {/* Tabs & Service Filter */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 gap-2">
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => setActiveTab('waiting')}
                    className={`px-3 py-1 rounded-lg font-medium transition-all ${
                      activeTab === 'waiting' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Waiting ({activeWaitingTokens.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('skipped')}
                    className={`px-3 py-1 rounded-lg font-medium transition-all ${
                      activeTab === 'skipped' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Hold ({skippedTokens.length})
                  </button>
                </div>

                {/* Service Department Filter */}
                <select
                  value={selectedServiceFilter}
                  onChange={(e) => setSelectedServiceFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-300 outline-none"
                >
                  <option value="all">All Services</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* TAB CONTENT: WAITING LIST */}
              {activeTab === 'waiting' && (
                <div className="flex-1 overflow-y-auto pt-3 space-y-2.5 pr-1">
                  {activeWaitingTokens.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                      <CheckCircle2 className="w-10 h-10 text-slate-700 mb-2" />
                      <p className="text-xs font-semibold text-slate-400">Queue is Clear</p>
                      <p className="text-[11px] text-slate-500">No customers currently waiting.</p>
                    </div>
                  ) : (
                    activeWaitingTokens
                      .filter(t => selectedServiceFilter === 'all' || t.serviceId === selectedServiceFilter)
                      .map((token, index) => (
                        <div
                          key={token.id}
                          className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-3 group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-mono text-xs font-bold text-slate-400">
                              #{index + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-black text-white">
                                  {token.tokenNumber}
                                </span>
                                {token.priority === 'vip' && (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                                    VIP
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-300 font-medium truncate max-w-[140px]">
                                {token.customerName}
                              </p>
                              <span className="text-[10px] text-slate-500">
                                {token.serviceName} • {token.estimatedWaitMinutes}m wait
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              callNextToken(selectedStaff!.id, token.serviceId);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 font-semibold text-xs transition-all flex items-center gap-1 opacity-90 group-hover:opacity-100"
                          >
                            <span>Call</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                  )}
                </div>
              )}

              {/* TAB CONTENT: SKIPPED / HOLD LIST */}
              {activeTab === 'skipped' && (
                <div className="flex-1 overflow-y-auto pt-3 space-y-2.5 pr-1">
                  {skippedTokens.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                      <p className="text-xs font-semibold text-slate-400">No Tickets on Hold</p>
                      <p className="text-[11px] text-slate-500">Skipped tickets will appear here for instant recall.</p>
                    </div>
                  ) : (
                    skippedTokens.map((token) => (
                      <div
                        key={token.id}
                        className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-amber-400">
                              {token.tokenNumber}
                            </span>
                            <span className="text-[10px] text-slate-500">Skipped</span>
                          </div>
                          <p className="text-xs text-slate-300 font-medium">
                            {token.customerName}
                          </p>
                          <span className="text-[10px] text-slate-500">{token.serviceName}</span>
                        </div>

                        <button
                          onClick={() => recallToken(token.id, selectedStaff!.id)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 hover:text-slate-950 text-amber-300 font-semibold text-xs border border-amber-500/40 transition-colors flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Recall</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Bottom Quick Call button */}
              <div className="pt-3 border-t border-slate-800">
                <button
                  id="staff-quick-call-next-bottom-btn"
                  onClick={handleCallNext}
                  disabled={activeWaitingTokens.length === 0}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <PhoneForwarded className="w-4 h-4" />
                  <span>Call Next ({activeWaitingTokens.length} in queue)</span>
                </button>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* WALK-IN DESK TICKET MODAL */}
      {showWalkinModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 p-6 shadow-2xl relative">
            <button
              onClick={() => setShowWalkinModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">
              Issue Walk-in Ticket
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Generate a queue token directly from {selectedStaff?.assignedCounter}
            </p>

            <form onSubmit={handleWalkinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  required
                  value={walkinName}
                  onChange={(e) => setWalkinName(e.target.value)}
                  placeholder="e.g. Walk-in Visitor"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Service Category
                </label>
                <select
                  value={walkinServiceId}
                  onChange={(e) => setWalkinServiceId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-emerald-500"
                >
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.prefix}-XXX)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Priority
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWalkinPriority('normal')}
                    className={`p-2 rounded-xl border text-xs font-medium ${
                      walkinPriority === 'normal' ? 'bg-slate-800 border-emerald-500 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Normal Line
                  </button>
                  <button
                    type="button"
                    onClick={() => setWalkinPriority('vip')}
                    className={`p-2 rounded-xl border text-xs font-medium ${
                      walkinPriority === 'vip' ? 'bg-amber-950 border-amber-500 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    VIP Priority
                  </button>
                </div>
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowWalkinModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold"
                >
                  Create & Print Pass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
