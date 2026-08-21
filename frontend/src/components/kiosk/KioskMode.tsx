import React, { useState } from 'react';
import { useQueue } from '../../context/QueueContext';
import { ServiceType } from '../../types';
import { 
  Tablet, 
  Touchpad, 
  Clock, 
  Users, 
  ArrowLeft, 
  CheckCircle2, 
  Printer, 
  Sparkles, 
  QrCode, 
  ChevronRight, 
  Info, 
  Wrench, 
  CreditCard, 
  Package,
  Layers,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateQRCodeSVG } from '../../utils/qr';

export const KioskMode: React.FC = () => {
  const { services, createToken, activeWaitingTokens, settings } = useQueue();

  const [step, setStep] = useState<'home' | 'service' | 'details' | 'ticket'>('home');
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isVip, setIsVip] = useState(false);
  const [printedToken, setPrintedToken] = useState<ReturnType<typeof createToken> | null>(null);

  const renderServiceIcon = (iconName: string) => {
    switch (iconName) {
      case 'Wrench': return <Wrench className="w-8 h-8" />;
      case 'CreditCard': return <CreditCard className="w-8 h-8" />;
      case 'Package': return <Package className="w-8 h-8" />;
      case 'Sparkles': return <Sparkles className="w-8 h-8" />;
      case 'Info':
      default:
        return <Info className="w-8 h-8" />;
    }
  };

  const handleServiceSelect = (srv: ServiceType) => {
    setSelectedService(srv);
    setStep('details');
  };

  const handleGenerateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;

    const token = createToken(
      selectedService.id,
      customerName.trim() || 'Visitor',
      customerPhone.trim() || undefined,
      undefined,
      'Self-Service Lobby Kiosk',
      isVip ? 'vip' : 'normal'
    );

    setPrintedToken(token);
    setStep('ticket');
    confetti({
      particleCount: 60,
      spread: 50,
      origin: { y: 0.7 }
    });
  };

  const handleResetKiosk = () => {
    setStep('home');
    setSelectedService(null);
    setCustomerName('');
    setCustomerPhone('');
    setIsVip(false);
    setPrintedToken(null);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-white p-6 sm:p-10 flex flex-col justify-between select-none relative overflow-hidden">
      
      {/* Background Glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Kiosk Header */}
      <div className="relative z-10 flex items-center justify-between pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-bold">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              {settings.organizationName}
            </h1>
            <p className="text-xs text-slate-400">
              {settings.venueName} • Self-Service Kiosk
            </p>
          </div>
        </div>

        {step !== 'home' && (
          <button
            onClick={handleResetKiosk}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Start Over</span>
          </button>
        )}
      </div>

      {/* STEP 1: WELCOME TOUCH SCREEN */}
      {step === 'home' && (
        <div className="relative z-10 my-auto text-center max-w-2xl mx-auto py-12">
          <div className="w-24 h-24 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-6 shadow-2xl animate-pulse">
            <Touchpad className="w-12 h-12" />
          </div>

          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-3">
            Welcome! Tap to Check In
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mb-10 max-w-lg mx-auto">
            Take a digital token in seconds. We will notify you when a service desk is ready for your consultation.
          </p>

          <button
            id="kiosk-touch-to-start-btn"
            onClick={() => setStep('service')}
            className="px-10 py-5 rounded-3xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-lg shadow-2xl shadow-emerald-500/30 hover:scale-105 transition-all flex items-center gap-3 mx-auto"
          >
            <span>Touch Screen to Begin</span>
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* STEP 2: SELECT SERVICE */}
      {step === 'service' && (
        <div className="relative z-10 my-auto max-w-4xl mx-auto w-full py-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              What can we help you with today?
            </h2>
            <p className="text-xs text-slate-400 mt-1">Tap a service category below</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.filter(s => s.isActive).map((srv) => {
              const waitingCount = activeWaitingTokens.filter(t => t.serviceId === srv.id).length;

              return (
                <button
                  key={srv.id}
                  onClick={() => handleServiceSelect(srv)}
                  className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500 hover:bg-slate-800/80 transition-all text-left flex items-start gap-4 group shadow-xl"
                >
                  <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                    {renderServiceIcon(srv.icon)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg text-white group-hover:text-emerald-300">
                        {srv.name}
                      </h3>
                      <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded">
                        {srv.prefix}-XXX
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 mb-3">{srv.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>Est. ~{Math.max(3, waitingCount * srv.avgServiceMinutes)} mins</span>
                      <span>•</span>
                      <span>{waitingCount} waiting</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 3: CUSTOMER DETAILS */}
      {step === 'details' && selectedService && (
        <div className="relative z-10 my-auto max-w-lg mx-auto w-full py-6">
          <div className="rounded-3xl bg-slate-900 border border-slate-700 p-8 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-1">
              Your Details
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Selected: <strong className="text-emerald-400">{selectedService.name}</strong>
            </p>

            <form onSubmit={handleGenerateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Jordan Miller"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-white text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Mobile Phone (Optional for SMS)</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-white text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isVip}
                  onChange={(e) => setIsVip(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <span className="text-xs font-medium text-slate-300">
                  Priority / Accessibility Assistance Required
                </span>
              </label>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('service')}
                  className="w-1/3 py-3.5 rounded-2xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/25"
                >
                  Print Digital Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STEP 4: PRINTED TICKET RECEIPT */}
      {step === 'ticket' && printedToken && (
        <div className="relative z-10 my-auto max-w-md mx-auto w-full py-6 text-center">
          <div className="p-8 rounded-3xl bg-white text-slate-950 shadow-2xl relative overflow-hidden">
            
            {/* Top jagged / ticket styling */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              <span className="font-extrabold text-sm tracking-tight">{settings.organizationName}</span>
            </div>

            <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-4">
              Customer Pass • {printedToken.serviceName}
            </p>

            <div className="py-3 border-y-2 border-dashed border-slate-300 my-4">
              <span className="text-xs font-semibold text-slate-400 block mb-1">Your Token</span>
              <h1 className="text-5xl font-black font-mono tracking-tight text-slate-950">
                {printedToken.tokenNumber}
              </h1>
              <p className="text-xs font-bold text-emerald-600 mt-1">
                {printedToken.customerName}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-left text-xs mb-4">
              <div className="p-2 rounded-lg bg-slate-100">
                <span className="text-[10px] text-slate-500 block">Est. Wait</span>
                <strong>~{printedToken.estimatedWaitMinutes} minutes</strong>
              </div>
              <div className="p-2 rounded-lg bg-slate-100">
                <span className="text-[10px] text-slate-500 block">Time Issued</span>
                <strong>{new Date(printedToken.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
              </div>
            </div>

            <div 
              className="w-36 h-36 mx-auto mb-3"
              dangerouslySetInnerHTML={{
                __html: generateQRCodeSVG(`https://queueflow.app/track/${printedToken.tokenNumber}`, 140)
              }}
            />

            <p className="text-[10px] text-slate-500">
              Scan with your phone to track position in real-time
            </p>
          </div>

          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={handleResetKiosk}
              className="px-8 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all"
            >
              Done / Next Customer
            </button>
          </div>
        </div>
      )}

      {/* Kiosk Footer */}
      <div className="relative z-10 text-center text-xs text-slate-500 pt-4 border-t border-slate-800">
        Touch anywhere to interact • QueueFlow Kiosk Terminal OS v3.4
      </div>

    </div>
  );
};
