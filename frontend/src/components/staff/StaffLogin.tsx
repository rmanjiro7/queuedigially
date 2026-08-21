import React, { useState } from 'react';
import { useQueue } from '../../context/QueueContext';
import { 
  Laptop, 
  UserCheck, 
  ArrowLeft, 
  Lock, 
  AlertCircle, 
  KeyRound, 
  CheckCircle2, 
  Loader2, 
  Layers,
  Sparkles,
  Users
} from 'lucide-react';

export const StaffLogin: React.FC = () => {
  const { staff, staffLogin, setCurrentView } = useQueue();

  const [selectedStaffMemberId, setSelectedStaffMemberId] = useState<string>(staff[0]?.id || 'staff-1');
  const [pin, setPin] = useState('1234');
  const [assignedCounter, setAssignedCounter] = useState<string>(staff[0]?.assignedCounter || 'Counter 03');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const currentMember = staff.find(s => s.id === selectedStaffMemberId) || staff[0];

  const handleStaffSelect = (staffId: string) => {
    setSelectedStaffMemberId(staffId);
    const member = staff.find(s => s.id === staffId);
    if (member) {
      setAssignedCounter(member.assignedCounter || 'Counter 01');
    }
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const success = await staffLogin(selectedStaffMemberId, pin, assignedCounter);
      if (!success) {
        setErrorMessage('Invalid operator PIN or desk assignment.');
      }
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      
      {/* Ambient Glows */}
      <div 
        className="absolute inset-0 opacity-[0.08] pointer-events-none" 
        style={{
          backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)',
          backgroundSize: '28px 28px'
        }}
      />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-md w-full mx-auto relative z-10">
        
        {/* Top Back Link */}
        <div className="mb-6 flex items-center justify-between">
          <button
            id="staff-login-back-btn"
            onClick={() => setCurrentView('landing')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to QueueFlow</span>
          </button>

          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-300">
            Staff Desk Terminal
          </span>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl p-8 sm:p-9 shadow-2xl relative">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-500 to-cyan-500 p-0.5 shadow-xl shadow-blue-500/20 mx-auto flex items-center justify-center mb-4">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Laptop className="w-7 h-7 text-blue-400" />
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Staff Terminal
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-xs mx-auto">
              Operator & counter service desk workspace.
            </p>
          </div>

          {/* Error Alert Banner */}
          {errorMessage && (
            <div 
              id="staff-login-error-alert"
              className="mb-6 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-shake"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Operator Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Select Service Operator
              </label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {staff.slice(0, 3).map((member) => {
                  const isSelected = selectedStaffMemberId === member.id;
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => handleStaffSelect(member.id)}
                      className={`p-2.5 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500/15 text-white shadow-md shadow-blue-500/20'
                          : 'border-slate-800 bg-slate-950/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <span className="block font-bold text-xs truncate text-white">{member.name.split(' ')[0]}</span>
                      <span className="text-[10px] text-blue-400 block font-mono">{member.assignedCounter}</span>
                    </button>
                  );
                })}
              </div>

              <select
                id="staff-operator-select"
                value={selectedStaffMemberId}
                onChange={(e) => handleStaffSelect(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 focus:border-blue-500 text-white text-xs outline-none"
              >
                {staff.map((member) => (
                  <option key={member.id} value={member.id} className="bg-slate-900 text-white">
                    {member.name} ({member.role}) - {member.assignedCounter}
                  </option>
                ))}
              </select>
            </div>

            {/* Counter Desk Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Active Counter Desk
              </label>
              <select
                id="staff-counter-select"
                value={assignedCounter}
                onChange={(e) => setAssignedCounter(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 focus:border-blue-500 text-white text-xs outline-none font-mono"
              >
                <option value="Counter 01">Counter 01 (General)</option>
                <option value="Counter 02">Counter 02 (Payments)</option>
                <option value="Counter 03">Counter 03 (Express)</option>
                <option value="Counter 04">Counter 04 (Technical)</option>
                <option value="Counter 05">Counter 05 (VIP Desk)</option>
              </select>
            </div>

            {/* Security PIN */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Operator Security PIN
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="staff-pin-input"
                  type="password"
                  required
                  value={pin}
                  onChange={(e) => { setPin(e.target.value); setErrorMessage(''); }}
                  placeholder="1234"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white text-xs sm:text-sm placeholder:text-slate-600 outline-none font-mono tracking-widest transition-all"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Default operator demo PIN: 1234</p>
            </div>

            {/* Sign In Button */}
            <button
              id="staff-signin-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm shadow-xl shadow-blue-600/25 hover:shadow-blue-600/40 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <Laptop className="w-4 h-4" />
                  <span>Sign In to Terminal</span>
                </>
              )}
            </button>

          </form>

        </div>

      </div>

    </div>
  );
};
