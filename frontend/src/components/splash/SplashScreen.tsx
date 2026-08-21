import React, { useState, useEffect } from 'react';
import { useQueue } from '../../context/QueueContext';
import { Layers, Sparkles } from 'lucide-react';

export const SplashScreen: React.FC = () => {
  const { setCurrentView } = useQueue();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Smooth simulated initialization progress from 0 to 100
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const step = Math.random() * 25 + 15;
        return Math.min(100, Math.floor(prev + step));
      });
    }, 180);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const timeout = setTimeout(() => {
        setCurrentView('landing');
      }, 350);
      return () => clearTimeout(timeout);
    }
  }, [progress, setCurrentView]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 select-none overflow-hidden font-sans">
      {/* Subtle Background Radial Grid & Ambient Glow */}
      <div 
        className="absolute inset-0 opacity-[0.08] pointer-events-none" 
        style={{
          backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }}
      />
      <div className="absolute w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute w-[350px] h-[350px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full animate-fade-in">
        
        {/* Brand Icon with glowing ring */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 p-0.5 shadow-2xl shadow-emerald-500/30 flex items-center justify-center animate-pulse">
            <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
              <Layers className="w-10 h-10 text-emerald-400" />
            </div>
          </div>
          <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-900 border-2 border-slate-950 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          </span>
        </div>

        {/* Brand Title & Tagline */}
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">
          QueueFlow
        </h1>
        <p className="text-sm font-medium text-slate-400 mb-8 tracking-wide">
          Smart queues. Less waiting.
        </p>

        {/* Professional Loading Bar */}
        <div className="w-full max-w-xs space-y-3">
          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800/80 p-0.5 relative">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(16,185,129,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono px-1">
            <span className="text-slate-400 font-sans flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Initializing your queue experience...
            </span>
            <span>{progress}%</span>
          </div>
        </div>

      </div>

      {/* Production App Footer Tag */}
      <div className="absolute bottom-8 text-[11px] text-slate-600 font-medium tracking-wider uppercase">
        Enterprise Queue Management v3.4
      </div>
    </div>
  );
};
