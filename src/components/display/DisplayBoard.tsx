import React, { useState, useEffect } from 'react';
import { useQueue } from '../../context/QueueContext';
import { 
  Tv, 
  Volume2, 
  VolumeX, 
  Clock, 
  Sparkles, 
  Layers, 
  Maximize2, 
  Minimize2, 
  ArrowRight,
  Radio
} from 'lucide-react';

export const DisplayBoard: React.FC = () => {
  const {
    settings,
    updateSettings,
    currentlyServingTokens,
    activeWaitingTokens,
    completedTodayTokens,
    lastCalledToken,
    triggerManualChime
  } = useQueue();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-white p-4 sm:p-8 flex flex-col justify-between select-none relative overflow-hidden font-sans">
      
      {/* Background Ambience & Grid */}
      <div 
        className="absolute inset-0 opacity-[0.07] pointer-events-none" 
        style={{
          backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }}
      />
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* TOP TV HEADER */}
      <div className="relative z-10 flex flex-wrap items-center justify-between pb-6 border-b border-slate-800 gap-4">
        
        {/* Brand & Venue */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-xl shadow-emerald-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Layers className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              {settings.organizationName}
            </h1>
            <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>{settings.venueName} • Live Signage</span>
            </p>
          </div>
        </div>

        {/* Live Clock & Signage Controls */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-3xl font-black font-mono tracking-tight text-white">
              {currentTime || '12:00:00'}
            </div>
            <div className="text-xs font-medium text-slate-400">
              {currentDate}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => updateSettings({ enableSoundAlerts: !settings.enableSoundAlerts })}
              className={`p-2.5 rounded-xl border transition-colors ${
                settings.enableSoundAlerts ? 'bg-slate-900 border-slate-700 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
              title="Toggle Audio Announce"
            >
              {settings.enableSoundAlerts ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Toggle TV Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>

      </div>

      {/* MAIN SCREEN: 2 LARGE TV COLUMNS */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 my-8 flex-1">
        
        {/* LEFT COLUMN: NOW SERVING (7 COLS) */}
        <div className="lg:col-span-7 flex flex-col justify-start space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <h2 className="text-xl font-extrabold uppercase tracking-wider text-emerald-400">
                Now Serving
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {currentlyServingTokens.length} Active Counter{currentlyServingTokens.length !== 1 ? 's' : ''}
            </span>
          </div>

          {currentlyServingTokens.length === 0 ? (
            <div className="p-12 rounded-3xl border border-slate-800 bg-slate-900/60 text-center flex flex-col items-center justify-center">
              <Clock className="w-12 h-12 text-slate-700 mb-3" />
              <p className="text-lg font-bold text-slate-400">Please Wait</p>
              <p className="text-xs text-slate-500">Next tickets will be announced momentarily.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {currentlyServingTokens.map((tok) => {
                const isJustCalled = tok.id === lastCalledToken?.id || tok.status === 'called';

                return (
                  <div
                    key={tok.id}
                    className={`p-6 sm:p-8 rounded-3xl border transition-all duration-300 flex flex-wrap items-center justify-between gap-4 ${
                      isJustCalled
                        ? 'border-amber-400 bg-gradient-to-r from-amber-500/20 via-slate-900 to-slate-900 shadow-2xl shadow-amber-500/20 scale-[1.02]'
                        : 'border-slate-800 bg-slate-900/80 shadow-xl'
                    }`}
                  >
                    {/* Ticket Number & Customer */}
                    <div>
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-1">
                        {tok.serviceName}
                      </span>
                      <div className="flex items-baseline gap-3">
                        <span className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-white">
                          {tok.tokenNumber}
                        </span>
                        {tok.priority === 'vip' && (
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40">
                            VIP
                          </span>
                        )}
                      </div>
                      <p className="text-base font-bold text-slate-300 mt-1">
                        {tok.customerName}
                      </p>
                    </div>

                    {/* Assigned Counter Badge */}
                    <div className="text-right">
                      <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">
                        Please Proceed To
                      </span>
                      <div className="px-6 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-black text-2xl sm:text-3xl font-mono shadow-lg shadow-emerald-500/25">
                        {tok.counterAssigned || 'Counter 01'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: UP NEXT QUEUE (5 COLS) */}
        <div className="lg:col-span-5 flex flex-col justify-start space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold uppercase tracking-wider text-slate-300">
              Up Next
            </h2>
            <span className="text-xs font-mono text-slate-400">
              {activeWaitingTokens.length} in Queue
            </span>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 space-y-3 backdrop-blur-md">
            {activeWaitingTokens.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                No customers currently waiting in line.
              </div>
            ) : (
              activeWaitingTokens.slice(0, 5).map((tok, index) => (
                <div
                  key={tok.id}
                  className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-mono font-bold text-slate-400">
                      #{index + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-lg font-black text-white">
                          {tok.tokenNumber}
                        </span>
                        {tok.priority === 'vip' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                            VIP
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">{tok.serviceName}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      ~{tok.estimatedWaitMinutes}m
                    </span>
                    <span className="text-[10px] text-slate-500 block">Est. wait</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* RECENTLY SERVED COMPLETED TICKER */}
          <div className="p-4 rounded-2xl border border-slate-800/80 bg-slate-900/50">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-2">
              Recently Completed Today ({completedTodayTokens.length})
            </span>
            <div className="flex flex-wrap gap-2">
              {completedTodayTokens.slice(-6).reverse().map(tok => (
                <span key={tok.id} className="font-mono text-xs px-2.5 py-1 rounded-lg bg-slate-950 text-slate-400 border border-slate-800">
                  {tok.tokenNumber} ✓
                </span>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* BOTTOM TICKER FOOTER */}
      <div className="relative z-10 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-emerald-400 uppercase tracking-wider">Announcement:</span>
          <span>Please keep your mobile ticket open. You will receive an audio chime and vibration when your token is called.</span>
        </div>
        <span className="hidden sm:inline-block font-mono text-[11px] text-slate-500">
          Powered by QueueFlow
        </span>
      </div>

    </div>
  );
};
