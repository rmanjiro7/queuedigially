import React, { useState, useEffect } from 'react';
import { useQueue } from '../../context/QueueContext';
import { PriorityLevel, ServiceType } from '../../types';
import { 
  ArrowLeft, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Bell, 
  BellOff, 
  Volume2, 
  RotateCcw, 
  Share2, 
  Sparkles, 
  QrCode, 
  Info, 
  Wrench, 
  CreditCard, 
  Package, 
  UserCheck, 
  Smartphone,
  ChevronRight,
  X,
  Radio,
  Timer,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateQRCodeSVG } from '../../utils/qr';

export const CustomerView: React.FC = () => {
  const { 
    services, 
    tokens, 
    activeCustomerToken, 
    activeCustomerTokenId, 
    setActiveCustomerTokenId, 
    createToken, 
    cancelToken, 
    requestDelay, 
    activeWaitingTokens,
    currentlyServingTokens,
    settings,
    triggerManualChime
  } = useQueue();

  // State for Join Modal
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('normal');
  const [ticketSearchInput, setTicketSearchInput] = useState('');
  const [searchError, setSearchError] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [delaySuccessNotice, setDelaySuccessNotice] = useState(false);
  const [soundChimeActive, setSoundChimeActive] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  // Trigger celebration confetti if status changed to 'completed'
  useEffect(() => {
    if (activeCustomerToken && activeCustomerToken.status === 'completed') {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 }
      });
    }
  }, [activeCustomerToken?.status]);

  // Icon mapper helper
  const renderServiceIcon = (iconName: string, className: string = "w-6 h-6") => {
    switch (iconName) {
      case 'Wrench': return <Wrench className={className} />;
      case 'CreditCard': return <CreditCard className={className} />;
      case 'Package': return <Package className={className} />;
      case 'Sparkles': return <Sparkles className={className} />;
      case 'Info':
      default:
        return <Info className={className} />;
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;

    setIsJoining(true);
    // Smooth micro-feedback delay
    await new Promise(resolve => setTimeout(resolve, 400));

    createToken(
      selectedService.id,
      customerName.trim() || 'Guest Customer',
      customerPhone.trim() || undefined,
      customerEmail.trim() || undefined,
      notes.trim() || undefined,
      priority
    );

    setIsJoining(false);
    setSelectedService(null);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setNotes('');
    setPriority('normal');
  };

  const handleSearchTicket = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    const query = ticketSearchInput.trim().toUpperCase();
    if (!query) return;

    const found = tokens.find(t => t.tokenNumber.toUpperCase() === query || t.id === query);
    if (found) {
      setActiveCustomerTokenId(found.id);
      setTicketSearchInput('');
    } else {
      setSearchError(`Token "${query}" not found in current system.`);
    }
  };

  const handleRequestDelay = () => {
    if (!activeCustomerToken) return;
    requestDelay(activeCustomerToken.id, 5);
    setDelaySuccessNotice(true);
    setTimeout(() => setDelaySuccessNotice(false), 4000);
  };

  // Compute live queue position for current active token
  const calculateQueuePosition = () => {
    if (!activeCustomerToken) return 0;
    if (activeCustomerToken.status === 'called' || activeCustomerToken.status === 'serving') return 0;
    if (activeCustomerToken.status === 'completed' || activeCustomerToken.status === 'cancelled') return 0;

    const waitingInSameService = activeWaitingTokens.filter(t => t.serviceId === activeCustomerToken.serviceId);
    const index = waitingInSameService.findIndex(t => t.id === activeCustomerToken.id);
    return index >= 0 ? index + 1 : 1;
  };

  const queuePosition = calculateQueuePosition();

  // Find currently serving token for this service
  const currentServingForService = currentlyServingTokens.find(
    t => t.serviceId === activeCustomerToken?.serviceId
  ) || currentlyServingTokens[0];

  // ==========================================
  // VIEW 1: LIVE TICKET STATUS SCREEN (A-042)
  // ==========================================
  if (activeCustomerToken && (activeCustomerToken.status === 'waiting' || activeCustomerToken.status === 'called' || activeCustomerToken.status === 'serving')) {
    const isCalled = activeCustomerToken.status === 'called';
    const isServing = activeCustomerToken.status === 'serving';

    return (
      <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8 relative">
        
        {/* Subtle Background Glows */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-xl mx-auto relative z-10">
          
          {/* Top Bar with Return to Services & Sound toggle */}
          <div className="flex items-center justify-between mb-6">
            <button
              id="customer-back-to-services-btn"
              onClick={() => setActiveCustomerTokenId(null)}
              className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>All Services</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Syncing
              </span>

              <button
                id="customer-test-chime-btn"
                onClick={() => {
                  triggerManualChime(activeCustomerToken.tokenNumber, activeCustomerToken.counterAssigned || 'Counter 03', activeCustomerToken.customerName);
                }}
                title="Test Audio Chime"
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 transition-colors"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* CALLED BANNER ALERT */}
          {isCalled && (
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-2xl animate-pulse flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-950/20 flex items-center justify-center font-bold">
                  <Bell className="w-6 h-6 text-slate-950" />
                </div>
                <div>
                  <h4 className="font-extrabold text-base tracking-tight">
                    You've Been Called!
                  </h4>
                  <p className="text-xs font-medium text-slate-900">
                    Please proceed immediately to <span className="font-bold underline">{activeCustomerToken.counterAssigned || 'Counter 03'}</span>
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-slate-950 text-amber-300 rounded-lg text-xs font-bold uppercase tracking-wider">
                Now
              </span>
            </div>
          )}

          {/* MAIN TOKEN CARD (High Fidelity A-042 Design) */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden text-center mb-6">
            
            {/* Top Badge & Service */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {activeCustomerToken.serviceName}
              </span>

              {activeCustomerToken.priority === 'vip' ? (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> VIP Priority
                </span>
              ) : (
                <span className="text-xs text-slate-400 font-mono">
                  {settings.venueName}
                </span>
              )}
            </div>

            {/* Token Number Display */}
            <div className="py-2">
              <p className="text-xs font-medium uppercase tracking-widest text-slate-400 mb-1">
                Your Ticket Number
              </p>
              <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-white font-mono bg-gradient-to-b from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                {activeCustomerToken.tokenNumber}
              </h1>
              <p className="text-sm font-medium text-emerald-400 mt-2">
                {activeCustomerToken.customerName}
              </p>
            </div>

            {/* Progress Status Bar (Joined -> In Line -> Called -> Serving) */}
            <div className="mt-8 mb-6">
              <div className="flex items-center justify-between relative">
                {/* Connecting background bar */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-800 z-0" />
                
                {/* Active progress fill */}
                <div 
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 z-0 transition-all duration-500"
                  style={{
                    width: isServing ? '100%' : isCalled ? '75%' : '35%'
                  }}
                />

                {/* Step 1: Joined */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs shadow-md">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] text-slate-300 font-medium mt-1.5">Joined</span>
                </div>

                {/* Step 2: Waiting in Line */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-md ${
                    !isCalled && !isServing 
                      ? 'bg-emerald-400 text-slate-950 ring-4 ring-emerald-500/20 animate-pulse'
                      : 'bg-emerald-500 text-slate-950'
                  }`}>
                    <Clock className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] text-slate-300 font-medium mt-1.5">Waiting</span>
                </div>

                {/* Step 3: Called */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-md ${
                    isCalled
                      ? 'bg-amber-400 text-slate-950 ring-4 ring-amber-500/30 animate-bounce'
                      : isServing
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}>
                    <Bell className="w-4 h-4" />
                  </div>
                  <span className={`text-[11px] font-medium mt-1.5 ${isCalled ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>
                    Called
                  </span>
                </div>

                {/* Step 4: Serving */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-md ${
                    isServing
                      ? 'bg-teal-400 text-slate-950 ring-4 ring-teal-500/30 animate-pulse'
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}>
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <span className={`text-[11px] font-medium mt-1.5 ${isServing ? 'text-teal-300 font-bold' : 'text-slate-400'}`}>
                    Serving
                  </span>
                </div>

              </div>
            </div>

            {/* 4-Card Live Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              
              {/* Position */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-left">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                  Queue Position
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-white">
                    {isCalled ? 'Next!' : isServing ? 'Active' : `${queuePosition}${queuePosition === 1 ? 'st' : queuePosition === 2 ? 'nd' : queuePosition === 3 ? 'rd' : 'th'}`}
                  </span>
                  {!isCalled && !isServing && (
                    <span className="text-xs text-slate-500">in line</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {queuePosition <= 1 ? 'Prepare to step up' : `${queuePosition - 1} ahead of you`}
                </p>
              </div>

              {/* Estimated Wait */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-left">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                  Est. Wait Time
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-emerald-400">
                    {isCalled || isServing ? '0' : `~${activeCustomerToken.estimatedWaitMinutes || 11}`}
                  </span>
                  <span className="text-xs text-slate-500">minutes</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Calculated dynamically
                </p>
              </div>

              {/* Counter Assigned */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-left">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                  Desk Assigned
                </p>
                <span className="text-lg font-bold text-blue-400 block truncate">
                  {activeCustomerToken.counterAssigned || 'Assigning soon...'}
                </span>
                <p className="text-[10px] text-slate-400 mt-1 truncate">
                  {activeCustomerToken.staffAssignedName ? `with ${activeCustomerToken.staffAssignedName}` : 'Staff ready at desk'}
                </p>
              </div>

              {/* Now Serving */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-left">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                  Now Serving
                </p>
                <span className="text-lg font-mono font-bold text-amber-400 block truncate">
                  {currentServingForService ? currentServingForService.tokenNumber : 'A-039'}
                </span>
                <p className="text-[10px] text-slate-400 mt-1 truncate">
                  {currentServingForService?.counterAssigned || 'Counter 03'}
                </p>
              </div>

            </div>

            {/* Delay Notice banner if triggered */}
            {delaySuccessNotice && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Added +5 minutes buffer. We updated your ticket!
              </div>
            )}

            {/* Customer Actions Footer */}
            <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
              <button
                id="customer-request-delay-btn"
                onClick={handleRequestDelay}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
              >
                <Timer className="w-4 h-4 text-emerald-400" />
                <span>Running Late? (+5m)</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  id="customer-share-pass-btn"
                  onClick={() => setShowShareModal(true)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Share Pass / QR"
                >
                  <Share2 className="w-4 h-4" />
                </button>

                <button
                  id="customer-cancel-token-btn"
                  onClick={() => setShowCancelModal(true)}
                  className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-medium transition-colors"
                >
                  Cancel Ticket
                </button>
              </div>
            </div>

          </div>

          {/* SMS Notification Simulator Card */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
                <Smartphone className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-white">
                    Live SMS & Push Notification Simulation
                  </p>
                  <span className="text-[10px] text-slate-500">Active</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {activeCustomerToken.customerPhone ? `Connected to ${activeCustomerToken.customerPhone}` : 'No phone provided - keeping screen open will chime when called.'}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Share Pass Modal */}
        {showShareModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-6 text-center shadow-2xl relative">
              <button
                onClick={() => setShowShareModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-bold text-white mb-1">
                Digital Boarding Pass
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Scan or share with companions
              </p>

              <div 
                className="w-48 h-48 mx-auto p-3 bg-white rounded-2xl shadow-inner mb-4 flex items-center justify-center"
                dangerouslySetInnerHTML={{
                  __html: generateQRCodeSVG(`https://queueflow.app/track/${activeCustomerToken.tokenNumber}`, 180)
                }}
              />

              <div className="font-mono text-xl font-bold text-emerald-400 mb-2">
                {activeCustomerToken.tokenNumber}
              </div>
              <p className="text-xs text-slate-400 mb-6">
                {activeCustomerToken.serviceName} • {activeCustomerToken.customerName}
              </p>

              <button
                onClick={() => setShowShareModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Close Pass
              </button>
            </div>
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl">
              <h3 className="text-base font-bold text-white mb-2">
                Cancel your position in line?
              </h3>
              <p className="text-xs text-slate-400 mb-5">
                Are you sure you want to surrender Ticket <span className="font-mono font-bold text-white">{activeCustomerToken.tokenNumber}</span>? You will need to take a new ticket to rejoin.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                >
                  Keep Ticket
                </button>
                <button
                  onClick={() => {
                    cancelToken(activeCustomerToken.id);
                    setShowCancelModal(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-500"
                >
                  Yes, Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  // ==========================================
  // VIEW 2: COMPLETED OR CANCELLED TICKET SCREEN
  // ==========================================
  if (activeCustomerToken && (activeCustomerToken.status === 'completed' || activeCustomerToken.status === 'cancelled')) {
    const isCompleted = activeCustomerToken.status === 'completed';
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 flex items-center justify-center py-12 px-4 relative">
        <div className="max-w-md w-full rounded-3xl border border-slate-800 bg-slate-900/90 p-8 text-center backdrop-blur-xl shadow-2xl">
          <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 ${
            isCompleted ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
          }`}>
            {isCompleted ? <CheckCircle2 className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
          </div>

          <span className="text-xs font-mono font-bold text-slate-400 px-3 py-1 rounded-full bg-slate-800">
            {activeCustomerToken.tokenNumber}
          </span>

          <h2 className="text-2xl font-bold text-white mt-3 mb-1">
            {isCompleted ? 'Service Completed!' : 'Ticket Cancelled'}
          </h2>
          <p className="text-xs text-slate-400 mb-6">
            {isCompleted 
              ? 'Thank you for visiting Metropolitan Service Hub. We hope your experience was quick and seamless.'
              : 'Your queue reservation has been cancelled. You can join again anytime.'}
          </p>

          <button
            id="customer-take-new-ticket-btn"
            onClick={() => setActiveCustomerTokenId(null)}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all"
          >
            Take Another Ticket
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 3: SERVICES DIRECTORY & JOIN QUEUE LANDING
  // ==========================================
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8 relative">
      
      {/* Ambient background styling */}
      <div 
        className="absolute inset-0 opacity-[0.12] pointer-events-none" 
        style={{
          backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        
        {/* Hero Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-emerald-400 mb-3 shadow-sm">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>{settings.venueName} • Live System</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">
            Select a Service to Join Queue
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Choose your required department below. You will receive an instant digital token with real-time wait tracking on your phone.
          </p>

          {/* Quick Ticket Lookup Search */}
          <form onSubmit={handleSearchTicket} className="mt-6 max-w-md mx-auto flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={ticketSearchInput}
                onChange={(e) => setTicketSearchInput(e.target.value)}
                placeholder="Already have a ticket? (e.g. A-042)"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs text-white placeholder:text-slate-500 outline-none uppercase font-mono tracking-wider"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
            >
              Track Pass
            </button>
          </form>
          {searchError && (
            <p className="text-xs text-rose-400 mt-2 font-medium">{searchError}</p>
          )}

          {/* Quick Demo Shortcut to signature A-042 */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="text-[11px] text-slate-500">Quick Preview:</span>
            <button
              id="quick-demo-a042-btn"
              onClick={() => setActiveCustomerTokenId('tok-43')}
              className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-4 flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" /> View Token A-042 (Alex Rivera)
            </button>
          </div>
        </div>

        {/* Services Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {services.filter(s => s.isActive).map((srv) => {
            const waitingCount = activeWaitingTokens.filter(t => t.serviceId === srv.id).length;
            const estMinutes = Math.max(2, waitingCount * srv.avgServiceMinutes);

            return (
              <div
                key={srv.id}
                id={`service-card-${srv.id}`}
                className="group relative rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-sm transition-all duration-200 hover:border-emerald-500/40 hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Icon + Prefix Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                      {renderServiceIcon(srv.icon)}
                    </div>
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                      Prefix: {srv.prefix}-XXX
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-emerald-300 transition-colors">
                    {srv.name}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-6">
                    {srv.description}
                  </p>
                </div>

                <div>
                  {/* Wait Time Metrics */}
                  <div className="pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-2 mb-4">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs">Est. ~{estMinutes} min</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-xs">{waitingCount} waiting</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    id={`join-service-btn-${srv.id}`}
                    onClick={() => setSelectedService(srv)}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-white font-semibold text-xs transition-all duration-200 flex items-center justify-center gap-2 group-hover:shadow-md"
                  >
                    <span>Get Ticket</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* How It Works 3-Step Guide (Matches PRD / HTML screen) */}
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-8 backdrop-blur-md">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-white">How QueueFlow Works</h2>
            <p className="text-xs text-slate-400 mt-1">No standing in crowded lines. Freedom to relax.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold mb-3">
                1
              </div>
              <h4 className="font-bold text-sm text-white mb-1">Pick Your Service</h4>
              <p className="text-xs text-slate-400">
                Select your service department and enter your contact information to receive your personal digital token.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold mb-3">
                2
              </div>
              <h4 className="font-bold text-sm text-white mb-1">Live Position Tracking</h4>
              <p className="text-xs text-slate-400">
                Watch your live queue position and dynamic wait estimate. You can roam the premises freely.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold mb-3">
                3
              </div>
              <h4 className="font-bold text-sm text-white mb-1">Step Up When Called</h4>
              <p className="text-xs text-slate-400">
                Receive an audio chime & screen announcement with your assigned counter number when it is your turn.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* JOIN QUEUE FORM MODAL */}
      {selectedService && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 sm:p-8 relative">
            <button
              id="close-join-modal-btn"
              onClick={() => setSelectedService(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                {renderServiceIcon(selectedService.icon)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Join {selectedService.name}
                </h3>
                <p className="text-xs text-slate-400">
                  Estimated wait ~{Math.max(3, activeWaitingTokens.filter(t => t.serviceId === selectedService.id).length * selectedService.avgServiceMinutes)} minutes
                </p>
              </div>
            </div>

            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name / Identifier *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mobile Phone (Optional for SMS)
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reason for Visit / Specific Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Briefly describe what you need assistance with..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:border-emerald-500 outline-none resize-none"
                />
              </div>

              {/* Priority / Accessibility Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Priority / Accessibility Needs
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPriority('normal')}
                    className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
                      priority === 'normal'
                        ? 'bg-slate-800 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <span>Standard Line</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPriority('vip')}
                    className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
                      priority === 'vip'
                        ? 'bg-amber-950/60 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Priority / VIP</span>
                  </button>
                </div>
              </div>

              <div className="pt-3 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedService(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="confirm-take-ticket-btn"
                  disabled={isJoining}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2 disabled:opacity-75"
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Joining queue...</span>
                    </>
                  ) : (
                    <span>Generate Digital Ticket</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
