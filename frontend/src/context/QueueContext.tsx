import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { QueueToken, ServiceType, StaffMember, QueueSettings, AuditLog, AppView, PriorityLevel } from '../types';
import { INITIAL_SERVICES, INITIAL_STAFF, INITIAL_TOKENS, INITIAL_SETTINGS, INITIAL_AUDIT_LOGS } from '../data/initialData';
import { playCallChime, playSuccessChime, speakAnnouncement } from '../utils/sound';

interface QueueContextType {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  selectedStaffId: string;
  setSelectedStaffId: (id: string) => void;
  activeCustomerTokenId: string | null;
  setActiveCustomerTokenId: (id: string | null) => void;
  services: ServiceType[];
  staff: StaffMember[];
  tokens: QueueToken[];
  settings: QueueSettings;
  auditLogs: AuditLog[];
  lastCalledToken: QueueToken | null;
  activeCustomerToken: QueueToken | null;
  selectedStaff: StaffMember | undefined;
  
  // Auth state
  isAdminAuthenticated: boolean;
  authenticatedAdminEmail: string | null;
  adminLogin: (email: string, password: string) => Promise<boolean>;
  adminLogout: () => void;
  isStaffAuthenticated: boolean;
  staffLogin: (staffId: string, pin: string, counter?: string) => Promise<boolean>;
  staffLogout: () => void;
  navigateAdmin: () => void;
  navigateStaff: () => void;

  // Stats
  activeWaitingTokens: QueueToken[];
  currentlyServingTokens: QueueToken[];
  completedTodayTokens: QueueToken[];
  
  // Actions
  createToken: (
    serviceId: string,
    customerName: string,
    customerPhone?: string,
    customerEmail?: string,
    notes?: string,
    priority?: PriorityLevel
  ) => QueueToken;
  callNextToken: (staffId: string, serviceIdFilter?: string) => QueueToken | null;
  startServingToken: (tokenId: string, staffId: string) => void;
  markTokenServed: (tokenId: string, staffId: string) => void;
  skipToken: (tokenId: string, staffId: string) => void;
  recallToken: (tokenId: string, staffId: string) => void;
  cancelToken: (tokenId: string) => void;
  requestDelay: (tokenId: string, extraMinutes?: number) => void;
  updateService: (service: ServiceType) => void;
  addService: (service: Omit<ServiceType, 'id'>) => void;
  deleteService: (serviceId: string) => void;
  updateStaff: (staffMember: StaffMember) => void;
  addStaff: (staffMember: Omit<StaffMember, 'id' | 'servedTodayCount' | 'avgHandlingMinutes'>) => void;
  updateSettings: (newSettings: Partial<QueueSettings>) => void;
  resetDemoData: () => void;
  triggerManualChime: (tokenNumber: string, counter: string, customerName?: string) => void;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

const STORAGE_KEY = 'queueflow_state_v1';
const BROADCAST_CHANNEL_NAME = 'queueflow_sync_channel';

export const QueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<AppView>('splash');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('staff-1');
  const [activeCustomerTokenId, setActiveCustomerTokenId] = useState<string | null>('tok-43'); // default Alex Rivera A-042

  // Auth states
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [authenticatedAdminEmail, setAuthenticatedAdminEmail] = useState<string | null>(null);
  const [isStaffAuthenticated, setIsStaffAuthenticated] = useState<boolean>(false);

  // Persistent app data with fallback to initial seed
  const [services, setServices] = useState<ServiceType[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_services`);
      return saved ? JSON.parse(saved) : INITIAL_SERVICES;
    } catch {
      return INITIAL_SERVICES;
    }
  });

  const [staff, setStaff] = useState<StaffMember[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_staff`);
      return saved ? JSON.parse(saved) : INITIAL_STAFF;
    } catch {
      return INITIAL_STAFF;
    }
  });

  const [tokens, setTokens] = useState<QueueToken[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_tokens`);
      return saved ? JSON.parse(saved) : INITIAL_TOKENS;
    } catch {
      return INITIAL_TOKENS;
    }
  });

  const [settings, setSettings] = useState<QueueSettings>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_settings`);
      return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_logs`);
      return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  });

  const [lastCalledToken, setLastCalledToken] = useState<QueueToken | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_services`, JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_staff`, JSON.stringify(staff));
  }, [staff]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_tokens`, JSON.stringify(tokens));
  }, [tokens]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_settings`, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_logs`, JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Broadcast Channel for multi-tab synchronization
  useEffect(() => {
    if (!('BroadcastChannel' in window)) return;
    const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);

    channel.onmessage = (event) => {
      const { type, payload } = event.data;
      if (type === 'SYNC_STATE') {
        if (payload.tokens) setTokens(payload.tokens);
        if (payload.staff) setStaff(payload.staff);
        if (payload.services) setServices(payload.services);
        if (payload.auditLogs) setAuditLogs(payload.auditLogs);
        if (payload.lastCalledToken) {
          setLastCalledToken(payload.lastCalledToken);
          // Play sound alert in receiving tab if enabled
          if (settings.enableSoundAlerts) {
            playCallChime();
          }
          if (settings.enableSpeechAnnouncements) {
            speakAnnouncement(
              payload.lastCalledToken.tokenNumber,
              payload.lastCalledToken.counterAssigned || 'Service Counter',
              payload.lastCalledToken.customerName
            );
          }
        }
      }
    };

    return () => {
      channel.close();
    };
  }, [settings.enableSoundAlerts, settings.enableSpeechAnnouncements]);

  const broadcastUpdate = useCallback((partialState: Record<string, unknown>) => {
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.postMessage({ type: 'SYNC_STATE', payload: partialState });
      channel.close();
    }
  }, []);

  const addLog = useCallback((action: string, actor: string, details: string, type: AuditLog['type'] = 'info', tokenNumber?: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: Date.now(),
      action,
      actor,
      details,
      tokenNumber,
      type,
    };
    setAuditLogs(prev => [newLog, ...prev.slice(0, 49)]);
  }, []);

  // Filtered lists
  const activeWaitingTokens = useMemo(() => {
    return tokens.filter(t => t.status === 'waiting').sort((a, b) => {
      // VIP first, then priority, then normal, sorted by join time
      const priorityOrder = { vip: 3, priority: 2, normal: 1 };
      if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return a.joinedAt - b.joinedAt;
    });
  }, [tokens]);

  const currentlyServingTokens = useMemo(() => {
    return tokens.filter(t => t.status === 'serving' || t.status === 'called');
  }, [tokens]);

  const completedTodayTokens = useMemo(() => {
    return tokens.filter(t => t.status === 'completed');
  }, [tokens]);

  const activeCustomerToken = useMemo(() => {
    if (!activeCustomerTokenId) return null;
    return tokens.find(t => t.id === activeCustomerTokenId) || null;
  }, [tokens, activeCustomerTokenId]);

  const selectedStaff = useMemo(() => {
    return staff.find(s => s.id === selectedStaffId) || staff[0];
  }, [staff, selectedStaffId]);

  // Recalculate dynamic wait time estimates for all waiting tokens
  const calculateWaitTimes = useCallback((currentTokens: QueueToken[], currentServices: ServiceType[]) => {
    const serviceMap = new Map(currentServices.map(s => [s.id, s.avgServiceMinutes]));
    let runningWaitMap: Record<string, number> = {};

    return currentTokens.map(tok => {
      if (tok.status !== 'waiting') return tok;
      const srvAvg = serviceMap.get(tok.serviceId) || 8;
      const accumulated = (runningWaitMap[tok.serviceId] || 0) + srvAvg;
      runningWaitMap[tok.serviceId] = accumulated;
      
      // VIPs get faster estimate
      const adjustedWait = tok.priority === 'vip' ? Math.max(2, Math.round(accumulated * 0.4)) : accumulated;
      return { ...tok, estimatedWaitMinutes: adjustedWait };
    });
  }, []);

  // 1. Create Token
  const createToken = useCallback((
    serviceId: string,
    customerName: string,
    customerPhone?: string,
    customerEmail?: string,
    notes?: string,
    priority: PriorityLevel = 'normal'
  ): QueueToken => {
    const srv = services.find(s => s.id === serviceId) || services[0];
    const prefix = srv.prefix || 'A';
    
    // Determine next sequence number for this prefix
    const existingPrefixTokens = tokens.filter(t => t.tokenNumber.startsWith(prefix));
    const nextSeq = existingPrefixTokens.length + 1;
    const formattedToken = `${prefix}-${String(nextSeq).padStart(3, '0')}`;

    // Estimated wait time
    const waitingForService = activeWaitingTokens.filter(t => t.serviceId === serviceId).length;
    const estimatedMinutes = Math.max(3, (waitingForService + 1) * srv.avgServiceMinutes);

    const newToken: QueueToken = {
      id: `tok-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      tokenNumber: formattedToken,
      serviceId: srv.id,
      serviceName: srv.name,
      customerName: customerName.trim() || `Customer ${formattedToken}`,
      customerPhone,
      customerEmail,
      notes,
      priority,
      status: 'waiting',
      joinedAt: Date.now(),
      estimatedWaitMinutes: priority === 'vip' ? Math.max(2, Math.round(estimatedMinutes * 0.4)) : estimatedMinutes,
    };

    setTokens(prev => {
      const updated = [...prev, newToken];
      broadcastUpdate({ tokens: updated });
      return updated;
    });

    setActiveCustomerTokenId(newToken.id);
    addLog('Token Generated', 'Customer Self-Service', `Generated Token ${formattedToken} for ${newToken.customerName} (${srv.name})`, 'success', formattedToken);

    return newToken;
  }, [services, tokens, activeWaitingTokens, broadcastUpdate, addLog]);

  // 2. Call Next Token
  const callNextToken = useCallback((staffId: string, serviceIdFilter?: string): QueueToken | null => {
    const staffMember = staff.find(s => s.id === staffId);
    const counterName = staffMember ? staffMember.assignedCounter : 'Counter 01';
    const staffName = staffMember ? staffMember.name : 'Operator';

    // Find candidate tokens that staff can handle
    const eligibleTokens = activeWaitingTokens.filter(t => {
      if (serviceIdFilter && t.serviceId !== serviceIdFilter) return false;
      if (staffMember && staffMember.assignedServiceIds.length > 0) {
        return staffMember.assignedServiceIds.includes(t.serviceId);
      }
      return true;
    });

    if (eligibleTokens.length === 0) return null;

    const nextToken = eligibleTokens[0];
    const updatedToken: QueueToken = {
      ...nextToken,
      status: 'called',
      calledAt: Date.now(),
      counterAssigned: counterName,
      staffAssignedName: staffName,
      estimatedWaitMinutes: 0,
    };

    setTokens(prev => {
      const updated = prev.map(t => t.id === nextToken.id ? updatedToken : t);
      broadcastUpdate({ tokens: updated, lastCalledToken: updatedToken });
      return updated;
    });

    setLastCalledToken(updatedToken);

    // Audio chimes & voice announcement
    if (settings.enableSoundAlerts) {
      playCallChime();
    }
    if (settings.enableSpeechAnnouncements) {
      speakAnnouncement(updatedToken.tokenNumber, counterName, updatedToken.customerName);
    }

    addLog('Called Next Customer', `${staffName} (${counterName})`, `Called Token ${updatedToken.tokenNumber} (${updatedToken.customerName})`, 'info', updatedToken.tokenNumber);

    return updatedToken;
  }, [staff, activeWaitingTokens, broadcastUpdate, settings.enableSoundAlerts, settings.enableSpeechAnnouncements, addLog]);

  // 3. Start Serving Token
  const startServingToken = useCallback((tokenId: string, staffId: string) => {
    const staffMember = staff.find(s => s.id === staffId);
    const counterName = staffMember ? staffMember.assignedCounter : 'Counter 01';
    const staffName = staffMember ? staffMember.name : 'Operator';

    setTokens(prev => {
      const updated = prev.map(t => {
        if (t.id === tokenId) {
          return {
            ...t,
            status: 'serving' as const,
            servedAt: Date.now(),
            counterAssigned: counterName,
            staffAssignedName: staffName,
          };
        }
        return t;
      });
      broadcastUpdate({ tokens: updated });
      return updated;
    });

    addLog('Started Serving', `${staffName} (${counterName})`, `Begun serving token`, 'info');
  }, [staff, broadcastUpdate, addLog]);

  // 4. Mark Token Served (Complete)
  const markTokenServed = useCallback((tokenId: string, staffId: string) => {
    const staffMember = staff.find(s => s.id === staffId);
    const targetToken = tokens.find(t => t.id === tokenId);
    const tokenNumber = targetToken?.tokenNumber || '';

    setTokens(prev => {
      const updated = prev.map(t => {
        if (t.id === tokenId) {
          return {
            ...t,
            status: 'completed' as const,
            completedAt: Date.now(),
          };
        }
        return t;
      });
      broadcastUpdate({ tokens: updated });
      return updated;
    });

    // Update staff count
    if (staffMember) {
      setStaff(prev => prev.map(s => {
        if (s.id === staffId) {
          return {
            ...s,
            servedTodayCount: s.servedTodayCount + 1,
          };
        }
        return s;
      }));
    }

    if (settings.enableSoundAlerts) {
      playSuccessChime();
    }

    addLog('Service Completed', staffMember ? `${staffMember.name} (${staffMember.assignedCounter})` : 'Staff', `Completed service for token ${tokenNumber}`, 'success', tokenNumber);
  }, [staff, tokens, broadcastUpdate, settings.enableSoundAlerts, addLog]);

  // 5. Skip Token (No-Show)
  const skipToken = useCallback((tokenId: string, staffId: string) => {
    const staffMember = staff.find(s => s.id === staffId);
    const targetToken = tokens.find(t => t.id === tokenId);
    const tokenNumber = targetToken?.tokenNumber || '';

    setTokens(prev => {
      const updated = prev.map(t => {
        if (t.id === tokenId) {
          return {
            ...t,
            status: 'skipped' as const,
          };
        }
        return t;
      });
      broadcastUpdate({ tokens: updated });
      return updated;
    });

    addLog('Customer Skipped (No-Show)', staffMember ? `${staffMember.name}` : 'Staff', `Skipped token ${tokenNumber}`, 'warning', tokenNumber);
  }, [staff, tokens, broadcastUpdate, addLog]);

  // 6. Recall Token
  const recallToken = useCallback((tokenId: string, staffId: string) => {
    const staffMember = staff.find(s => s.id === staffId);
    const counterName = staffMember ? staffMember.assignedCounter : 'Counter 01';

    let recalledToken: QueueToken | null = null;

    setTokens(prev => {
      const updated = prev.map(t => {
        if (t.id === tokenId) {
          recalledToken = {
            ...t,
            status: 'called' as const,
            calledAt: Date.now(),
            counterAssigned: counterName,
            staffAssignedName: staffMember?.name || 'Staff',
          };
          return recalledToken;
        }
        return t;
      });
      broadcastUpdate({ tokens: updated, lastCalledToken: recalledToken });
      return updated;
    });

    if (recalledToken) {
      setLastCalledToken(recalledToken);
      if (settings.enableSoundAlerts) {
        playCallChime();
      }
      if (settings.enableSpeechAnnouncements) {
        speakAnnouncement((recalledToken as QueueToken).tokenNumber, counterName, (recalledToken as QueueToken).customerName);
      }
      addLog('Recalled Customer', staffMember?.name || 'Staff', `Recalled Token ${(recalledToken as QueueToken).tokenNumber}`, 'info', (recalledToken as QueueToken).tokenNumber);
    }
  }, [staff, broadcastUpdate, settings.enableSoundAlerts, settings.enableSpeechAnnouncements, addLog]);

  // 7. Cancel Token (Customer initiated)
  const cancelToken = useCallback((tokenId: string) => {
    const targetToken = tokens.find(t => t.id === tokenId);
    const tokenNumber = targetToken?.tokenNumber || '';

    setTokens(prev => {
      const updated = prev.map(t => {
        if (t.id === tokenId) {
          return {
            ...t,
            status: 'cancelled' as const,
          };
        }
        return t;
      });
      broadcastUpdate({ tokens: updated });
      return updated;
    });

    addLog('Token Cancelled', 'Customer Portal', `Customer cancelled token ${tokenNumber}`, 'warning', tokenNumber);
  }, [tokens, broadcastUpdate, addLog]);

  // 8. Request Delay (+5 mins)
  const requestDelay = useCallback((tokenId: string, extraMinutes: number = 5) => {
    setTokens(prev => {
      const updated = prev.map(t => {
        if (t.id === tokenId) {
          return {
            ...t,
            estimatedWaitMinutes: (t.estimatedWaitMinutes || 5) + extraMinutes,
            notes: `${t.notes ? t.notes + ' | ' : ''}Customer requested +${extraMinutes}m delay`,
          };
        }
        return t;
      });
      broadcastUpdate({ tokens: updated });
      return updated;
    });

    addLog('Delay Requested', 'Customer Mobile', `Added +${extraMinutes} min buffer for token`, 'info');
  }, [broadcastUpdate, addLog]);

  // 9. Service Management
  const updateService = useCallback((updated: ServiceType) => {
    setServices(prev => prev.map(s => s.id === updated.id ? updated : s));
    addLog('Updated Service', 'Administrator', `Updated service config for ${updated.name}`, 'info');
  }, [addLog]);

  const addService = useCallback((newSrv: Omit<ServiceType, 'id'>) => {
    const created: ServiceType = {
      ...newSrv,
      id: `srv-${Date.now()}`,
    };
    setServices(prev => [...prev, created]);
    addLog('Created Service', 'Administrator', `Added new service category: ${created.name}`, 'success');
  }, [addLog]);

  const deleteService = useCallback((serviceId: string) => {
    setServices(prev => prev.filter(s => s.id !== serviceId));
    addLog('Deleted Service', 'Administrator', `Removed service ${serviceId}`, 'warning');
  }, [addLog]);

  // 10. Staff Management
  const updateStaff = useCallback((updatedMember: StaffMember) => {
    setStaff(prev => prev.map(s => s.id === updatedMember.id ? updatedMember : s));
    addLog('Updated Staff Profile', 'Administrator', `Updated details for ${updatedMember.name}`, 'info');
  }, [addLog]);

  const addStaff = useCallback((newMember: Omit<StaffMember, 'id' | 'servedTodayCount' | 'avgHandlingMinutes'>) => {
    const created: StaffMember = {
      ...newMember,
      id: `staff-${Date.now()}`,
      servedTodayCount: 0,
      avgHandlingMinutes: 8.0,
    };
    setStaff(prev => [...prev, created]);
    addLog('Added Staff Member', 'Administrator', `Added team member ${created.name}`, 'success');
  }, [addLog]);

  // 11. Settings
  const updateSettings = useCallback((newSettings: Partial<QueueSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    addLog('Queue Settings Changed', 'Administrator', 'Updated global queue configurations', 'info');
  }, [addLog]);

  // 12. Reset Demo Data
  const resetDemoData = useCallback(() => {
    setServices(INITIAL_SERVICES);
    setStaff(INITIAL_STAFF);
    setTokens(INITIAL_TOKENS);
    setSettings(INITIAL_SETTINGS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setActiveCustomerTokenId('tok-43');
    localStorage.removeItem(`${STORAGE_KEY}_services`);
    localStorage.removeItem(`${STORAGE_KEY}_staff`);
    localStorage.removeItem(`${STORAGE_KEY}_tokens`);
    localStorage.removeItem(`${STORAGE_KEY}_settings`);
    localStorage.removeItem(`${STORAGE_KEY}_logs`);
    addLog('Reset System Demo Data', 'System Administrator', 'Restored initial realistic queue dataset', 'info');
  }, [addLog]);

  // 13. Authentication Handlers
  const adminLogin = useCallback(async (email: string, pass: string): Promise<boolean> => {
    // Simulated auth delay
    await new Promise(resolve => setTimeout(resolve, 600));

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    // Valid admin credentials check
    const isValid = (cleanEmail === 'admin@queueflow.com' && cleanPass === 'admin123') ||
                    (cleanEmail.includes('@') && cleanPass.length >= 6);

    if (isValid) {
      setIsAdminAuthenticated(true);
      setAuthenticatedAdminEmail(cleanEmail);
      setCurrentView('admin');
      addLog('Admin Login Successful', cleanEmail, 'Authenticated to Administrator Suite', 'success');
      return true;
    } else {
      addLog('Failed Admin Login Attempt', cleanEmail || 'Unknown', 'Invalid credentials provided', 'warning');
      return false;
    }
  }, [addLog]);

  const adminLogout = useCallback(() => {
    setIsAdminAuthenticated(false);
    setAuthenticatedAdminEmail(null);
    setCurrentView('landing');
    addLog('Admin Signed Out', 'Administrator', 'Logged out of admin session', 'info');
  }, [addLog]);

  const staffLogin = useCallback(async (staffId: string, pin: string, counter?: string): Promise<boolean> => {
    // Simulated auth delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const cleanPin = pin.trim();
    // Default PIN is 1234 or any 4+ digit pin
    if (cleanPin === '1234' || cleanPin.length >= 4) {
      setSelectedStaffId(staffId);
      if (counter) {
        setStaff(prev => prev.map(s => s.id === staffId ? { ...s, assignedCounter: counter, isOnline: true } : s));
      }
      setIsStaffAuthenticated(true);
      setCurrentView('staff');
      const member = staff.find(s => s.id === staffId);
      addLog('Staff Desk Login', member ? `${member.name} (${counter || member.assignedCounter})` : 'Staff', 'Signed in to Staff Terminal', 'success');
      return true;
    } else {
      addLog('Failed Staff Login', staffId, 'Incorrect PIN entered', 'warning');
      return false;
    }
  }, [staff, addLog]);

  const staffLogout = useCallback(() => {
    setIsStaffAuthenticated(false);
    setCurrentView('landing');
    addLog('Staff Operator Signed Out', selectedStaff?.name || 'Staff', 'Logged out of staff terminal', 'info');
  }, [selectedStaff, addLog]);

  const navigateAdmin = useCallback(() => {
    if (isAdminAuthenticated) {
      setCurrentView('admin');
    } else {
      setCurrentView('admin-login');
    }
  }, [isAdminAuthenticated]);

  const navigateStaff = useCallback(() => {
    if (isStaffAuthenticated) {
      setCurrentView('staff');
    } else {
      setCurrentView('staff-login');
    }
  }, [isStaffAuthenticated]);

  // 14. Manual Chime Trigger
  const triggerManualChime = useCallback((tokenNumber: string, counter: string, customerName?: string) => {
    playCallChime();
    speakAnnouncement(tokenNumber, counter, customerName);
  }, []);

  return (
    <QueueContext.Provider
      value={{
        currentView,
        setCurrentView,
        selectedStaffId,
        setSelectedStaffId,
        activeCustomerTokenId,
        setActiveCustomerTokenId,
        services,
        staff,
        tokens,
        settings,
        auditLogs,
        lastCalledToken,
        activeCustomerToken,
        selectedStaff,
        isAdminAuthenticated,
        authenticatedAdminEmail,
        adminLogin,
        adminLogout,
        isStaffAuthenticated,
        staffLogin,
        staffLogout,
        navigateAdmin,
        navigateStaff,
        activeWaitingTokens,
        currentlyServingTokens,
        completedTodayTokens,
        createToken,
        callNextToken,
        startServingToken,
        markTokenServed,
        skipToken,
        recallToken,
        cancelToken,
        requestDelay,
        updateService,
        addService,
        deleteService,
        updateStaff,
        addStaff,
        updateSettings,
        resetDemoData,
        triggerManualChime,
      }}
    >
      {children}
    </QueueContext.Provider>
  );
};

export const useQueue = () => {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
};
