import React, { useState } from 'react';
import { useQueue } from '../../context/QueueContext';
import { 
  Layers, 
  ArrowRight, 
  Sparkles, 
  Users, 
  Laptop, 
  ShieldCheck, 
  Tv, 
  Tablet, 
  CheckCircle2, 
  Clock, 
  Smartphone, 
  QrCode, 
  TrendingDown, 
  BarChart3, 
  Volume2,
  ChevronRight,
  UserCheck,
  Zap
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { 
    setCurrentView, 
    setActiveCustomerTokenId, 
    tokens, 
    activeWaitingTokens, 
    currentlyServingTokens,
    completedTodayTokens,
    triggerManualChime,
    navigateStaff,
    navigateAdmin
  } = useQueue();

  const [ticketInput, setTicketInput] = useState('');
  const [searchMsg, setSearchMsg] = useState('');

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = ticketInput.trim().toUpperCase();
    if (!query) return;

    const match = tokens.find(t => t.tokenNumber.toUpperCase() === query || t.id === query);
    if (match) {
      setActiveCustomerTokenId(match.id);
      setCurrentView('customer');
    } else {
      setSearchMsg(`Ticket "${query}" not found. Try "A-042" or take a new one.`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-slate-950 font-sans">
      
      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        
        {/* Ambient Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-emerald-500/15 via-teal-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Hero Content (7 cols) */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-emerald-400 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Next-Gen Real-Time Queue Management</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.1]">
                Skip the waiting room.{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  Enter QueueFlow.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
                Replace crowded lobbies and chaotic lines with seamless digital tokens, real-time wait countdowns, staff service terminals, and high-visibility lobby TV displays.
              </p>

              {/* Quick Ticket Lookup Search Form */}
              <div className="pt-2">
                <form onSubmit={handleTrackSubmit} className="max-w-md mx-auto lg:mx-0 flex gap-2">
                  <input
                    type="text"
                    value={ticketInput}
                    onChange={(e) => setTicketInput(e.target.value)}
                    placeholder="Enter Ticket (e.g. A-042)"
                    className="flex-1 px-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs text-white placeholder:text-slate-500 outline-none uppercase font-mono tracking-wider"
                  />
                  <button
                    type="submit"
                    className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                  >
                    <span>Track Ticket</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
                {searchMsg && (
                  <p className="text-xs text-rose-400 mt-2 font-medium">{searchMsg}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-3">
                <button
                  id="hero-join-queue-btn"
                  onClick={() => setCurrentView('customer')}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/25 hover:scale-105 transition-all flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  <span>Join Customer Queue</span>
                </button>

                <button
                  id="hero-staff-terminal-btn"
                  onClick={() => navigateStaff()}
                  className="px-5 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-semibold text-xs sm:text-sm transition-colors flex items-center gap-2"
                >
                  <Laptop className="w-4 h-4 text-blue-400" />
                  <span>Staff Terminal</span>
                </button>

                <button
                  id="hero-admin-btn"
                  onClick={() => navigateAdmin()}
                  className="px-5 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-semibold text-xs sm:text-sm transition-colors flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span>Admin Suite</span>
                </button>

                <button
                  id="hero-display-btn"
                  onClick={() => setCurrentView('display-board')}
                  className="px-4 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-300 font-semibold text-xs sm:text-sm transition-colors flex items-center gap-2"
                >
                  <Tv className="w-4 h-4" />
                  <span>Lobby TV</span>
                </button>
              </div>

              {/* Real-time stats ticker */}
              <div className="pt-6 border-t border-slate-900 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span><strong>{activeWaitingTokens.length}</strong> active in line</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                  <span><strong>{completedTodayTokens.length}</strong> served today</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Average wait <strong>7.8 mins</strong></span>
                </div>
              </div>

            </div>

            {/* Right Hero Interactive Preview Widget (5 cols) */}
            <div className="lg:col-span-5 relative">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-7 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
                
                {/* Live Card Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Live Customer Pass</span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">Token A-042</span>
                </div>

                {/* Token Number */}
                <div className="py-6 text-center">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1">
                    General Inquiries
                  </p>
                  <h3 className="text-5xl font-black font-mono tracking-tight text-white">
                    A-042
                  </h3>
                  <p className="text-sm font-bold text-emerald-400 mt-1">
                    Alex Rivera
                  </p>
                </div>

                {/* Metrics Mini-Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-left">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Position</span>
                    <strong className="text-xl font-bold text-white">3rd in line</strong>
                    <p className="text-[10px] text-slate-500">2 ahead of you</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-left">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Est. Wait</span>
                    <strong className="text-xl font-bold text-emerald-400">~11 mins</strong>
                    <p className="text-[10px] text-slate-500">Dynamic countdown</p>
                  </div>
                </div>

                {/* Interactive Action Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setActiveCustomerTokenId('tok-43');
                      setCurrentView('customer');
                    }}
                    className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow"
                  >
                    <span>Open Live Ticket (A-042)</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      triggerManualChime('A-042', 'Counter 03', 'Alex Rivera');
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Test Audio Chime Call</span>
                  </button>
                </div>

              </div>
            </div>

          </div>

        </div>

      </section>

      {/* THE DIGITAL FLOW 3-STEP SECTION */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              The Digital Flow
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Transforming the waiting experience in 3 simple, friction-free steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Step 1 */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 relative">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-base mb-4">
                01
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Scan & Join</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Customers scan a QR code poster on their phone or tap the check-in kiosk tablet upon entering the venue.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 relative">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-base mb-4">
                02
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Real-Time Updates</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Live line position and dynamic countdown updates on their phone. Freedom to visit the café or sit comfortably.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 relative">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-base mb-4">
                03
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Step Up & Get Served</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Audio chime and speech announcements guide the customer directly to their assigned desk (e.g. Counter 03).
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* BENTO GRID: WHY FACILITIES CHOOSE QUEUEFLOW */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Built for Modern Public & Enterprise Facilities
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Every role and stakeholder gets dedicated real-time tools
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Card 1 */}
            <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <Smartphone className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">Mobile Web Passes</h4>
              <p className="text-xs text-slate-400">
                Zero app downloads required. Runs on any mobile browser instantly via QR code.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                <Laptop className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">1-Click Staff Desks</h4>
              <p className="text-xs text-slate-400">
                Call next, serve, skip no-shows, and recall customers with instant keyboard / mouse shortcuts.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                <Tv className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">Waiting Room TV Signage</h4>
              <p className="text-xs text-slate-400">
                Fullscreen high-contrast display board with airport-grade chimes and voice synthesis.
              </p>
            </div>

            {/* Card 4 */}
            <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">Analytics & Audit Logs</h4>
              <p className="text-xs text-slate-400">
                Track hourly arrival peaks, staff handle times, and service level agreements effortlessly.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 py-10 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-bold text-xs">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-300">QueueFlow</span>
            <span>• Smart queues. Less waiting.</span>
          </div>

          <div className="flex gap-4">
            <button onClick={() => setCurrentView('customer')} className="hover:text-white transition-colors">Customer Portal</button>
            <button onClick={() => navigateStaff()} className="hover:text-white transition-colors">Staff Terminal</button>
            <button onClick={() => navigateAdmin()} className="hover:text-white transition-colors">Admin Suite</button>
            <button onClick={() => setCurrentView('display-board')} className="hover:text-white transition-colors">TV Display</button>
          </div>
        </div>
      </footer>

    </div>
  );
};
