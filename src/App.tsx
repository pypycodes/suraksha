/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  AlertCircle, MapPin, PhoneCall, Settings, Users, History as HistoryIcon, Home as HomeIcon, Shield, Plus, Trash2, Check, ChevronLeft, X, Navigation, Target, Baby as BabyIcon, Accessibility, Battery, Timer, Zap, Ear, Map as MapIcon, Crosshair, HeartPulse, Lock, MessageSquare, Phone, Mic, Activity, Info, PhoneForwarded
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useSafety } from './hooks/useSafety';
import { useRecording } from './hooks/useRecording';
import { useMotion } from './hooks/useMotion';
import { useVoice } from './hooks/useVoice';
import { FakeCall } from './components/FakeCall';
import { Resources } from './components/Resources';
import { NearMe } from './components/NearMe';
import { FirstAid } from './components/FirstAid';
import { SafetyMap } from './components/SafetyMap';
import { cn } from './lib/utils';
import { format } from 'date-fns';

const generateID = () => Math.random().toString(36).substring(2, 9);
type Tab = 'dashboard' | 'history' | 'contacts' | 'settings' | 'resources' | 'journey' | 'near-me' | 'first-aid';

export default function App() {
  const safety = useSafety();
  const { isRecording, startRecording, stopRecording } = useRecording();

  // --- SENSORS & HANDLERS ---
  const motionHandlers = useMemo(() => ({
    onFall: () => {
      safety.setShowToast({ message: 'Fall Detected! SOS in 5s...', type: 'error' });
      setTimeout(() => safety.triggerPanic(), 5000);
    },
    onShake: () => {
      safety.setShowToast({ message: 'Shake SOS Triggered!', type: 'success' });
      safety.triggerPanic();
    }
  }), [safety]);

  const voiceHandlers = useMemo(() => ({
    onSOS: () => {
      safety.setShowToast({ message: 'Voice SOS Activated!', type: 'success' });
      safety.triggerPanic();
    },
    onStop: () => {
      if (isRecording) {
        stopRecording();
        safety.setShowToast({ message: 'Recording Stopped', type: 'success' });
      }
    }
  }), [safety, isRecording, stopRecording]);

  useMotion(safety.settings.fallDetection, safety.settings.shakeToAlert, motionHandlers);
  useMotion(safety.settings.fallDetection, safety.settings.shakeToAlert, motionHandlers);

  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [showFakeCall, setShowFakeCall] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [panicCountdown, setPanicCountdown] = useState<number | null>(null);

  const cancelPanic = () => {
    setIsActivating(false);
    setPanicCountdown(null);
  };

  // --- CONTACT PICKER ---
  useEffect(() => {
    const handlePicked = (e: any) => {
      const { name, phone } = e.detail;
      if (name && phone) {
        safety.updateContacts([...safety.contacts, { id: Date.now().toString(), name, phone }]);
        safety.setShowToast({ message: `Added ${name}`, type: 'success' });
      }
    };
    window.addEventListener('contactPicked', handlePicked);
    return () => window.removeEventListener('contactPicked', handlePicked);
  }, [safety.contacts]);

  const pickContact = async () => {
    if ((window as any).NativeSOSBridge?.pickContact) {
      (window as any).NativeSOSBridge.pickContact();
    } else {
      // Fallback
      const name = prompt("Enter Guardian Name:");
      const phone = prompt("Enter Guardian Phone:");
      if (name && phone) {
        safety.updateContacts([...safety.contacts, { id: Date.now().toString(), name, phone }]);
      }
    }
  };

  // --- BACK BUTTON HANDLING ---
  useEffect(() => {
    const handleBackButton = (e: any) => {
      e.preventDefault();
      if (showFakeCall) {
        setShowFakeCall(false);
        return;
      }
      if (activeTab !== 'dashboard') {
        setActiveTab('dashboard');
        return;
      }
      // If on dashboard, confirm exit
      const confirmed = window.confirm("Do you want to exit Suraksha? Emergency monitoring will remain active in the background.");
      if (confirmed) {
        (window as any).navigator?.app?.exitApp?.() || window.close();
      }
    };

    document.addEventListener('backbutton', handleBackButton);
    return () => {
      document.removeEventListener('backbutton', handleBackButton);
    };
  }, [activeTab, showFakeCall]);

  // --- HARDWARE LISTENERS ---
  useEffect(() => {
    const handleNativePanic = () => {
      safety.setShowToast({ message: 'Hardware SOS Triggered!', type: 'success' });
      safety.triggerPanic();
    };

    const handleNativeFakeCall = () => {
      safety.setShowToast({ message: 'Hardware Fake Call Triggered!', type: 'success' });
      setShowFakeCall(true);
    };

    window.addEventListener('nativePanicTrigger', handleNativePanic);
    window.addEventListener('nativeFakeCallTrigger', handleNativeFakeCall);

    return () => {
      window.removeEventListener('nativePanicTrigger', handleNativePanic);
      window.removeEventListener('nativeFakeCallTrigger', handleNativeFakeCall);
    };
  }, [safety.triggerPanic]);
  useEffect(() => {
    const handleNativePanic = () => {
      safety.setShowToast({ message: 'Hardware SOS Triggered!', type: 'success' });
      safety.triggerPanic();
    };

    const handleNativeFakeCall = () => {
      safety.setShowToast({ message: 'Hardware Fake Call Triggered!', type: 'success' });
      setShowFakeCall(true);
    };

    window.addEventListener('nativePanicTrigger', handleNativePanic);
    window.addEventListener('nativeFakeCallTrigger', handleNativeFakeCall);

    return () => {
      window.removeEventListener('nativePanicTrigger', handleNativePanic);
      window.removeEventListener('nativeFakeCallTrigger', handleNativeFakeCall);
    };
  }, [safety.triggerPanic]); // Only re-bind if the trigger logic changes

  // --- VOICE TRIGGER SYNC ---
  useEffect(() => {
    if (safety.settings.onboardingComplete && (window as any).NativeSOSBridge?.setVoiceTrigger) {
      (window as any).NativeSOSBridge.setVoiceTrigger(safety.settings.audioTrigger);
    }
  }, [safety.settings.audioTrigger, safety.settings.onboardingComplete]);

  // --- VOICE TRIGGER IS NOW HANDLED NATIVELY IN SAFETYSERVICE.JAVA ---
  // --- (Removes the background beeps and flickering) ---
  if (!safety.isReady) return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#09090b] text-white p-8 text-center">
       <Shield className="w-16 h-16 text-red-500 animate-pulse mb-6" />
       <h1 className="text-2xl font-black mb-2 tracking-tighter">SECURING YOUR DEVICE</h1>
       <p className="text-zinc-500 text-sm font-medium">Suraksha Safety Protocols Loading...</p>
    </div>
  );

  if (!safety.settings.onboardingComplete) {
    return (
      <div className="h-screen w-screen bg-[#09090b] text-white flex flex-col p-8 overflow-y-auto">
        <header className="py-12 text-center">
          <div className="w-20 h-20 bg-red-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-red-500/30">
            <Shield className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter mb-2">SURAKSHA</h1>
          <p className="text-zinc-500 font-medium">Professional Safety Shield</p>
        </header>

        <div className="space-y-6 flex-1">
          <div className="bg-zinc-900/50 p-6 rounded-[32px] border border-white/5">
            <h2 className="font-bold mb-4 flex items-center gap-2 text-red-400">
              <Lock className="w-5 h-5" /> Safety Protocols
            </h2>
            <div className="space-y-4">
              <PermissionRow icon={MapPin} label="Location" desc="Real-time emergency tracking" />
              <PermissionRow icon={MessageSquare} label="SMS" desc="Background silent alerts" />
              <PermissionRow icon={Phone} label="Calls" desc="Emergency hunting line" />
            </div>
          </div>
        </div>

        <button 
          onClick={() => {
            if ((window as any).NativeSOSBridge?.requestAllPermissions) {
              (window as any).NativeSOSBridge.requestAllPermissions();
            }
          }}
          className="mt-8 w-full bg-red-600 py-5 rounded-[24px] font-black text-lg active:scale-95 transition-all"
        >
          ACTIVATE PROTECTION
        </button>
      </div>
    );
  }

  const handlePanicStart = () => {
    if (isActivating) return;
    try { Haptics.impact({ style: ImpactStyle.Heavy }); } catch (e) {}
    setIsActivating(true);
    setPanicCountdown(5);
    const interval = setInterval(() => {
      setPanicCountdown(prev => {
        if (prev && prev > 1) return prev - 1;
        clearInterval(interval);
        safety.triggerPanic();
        return null;
      });
    }, 1000);
  };

  const handleFakeCallTrigger = () => {
    safety.setShowToast({ message: `Simulating call in ${safety.settings.fakeCallDelay}s`, type: 'success' });
    setTimeout(() => {
      setShowFakeCall(true);
      safety.setShowToast(null); // FIX: Clear the countdown toast when the call starts
    }, safety.settings.fakeCallDelay * 1000);
  };

  return (
    <div className={cn(
      "flex flex-col h-screen font-sans select-none overflow-hidden max-w-md mx-auto relative border-x transition-colors duration-300",
      safety.settings.darkMode ? "bg-[#0F172A] text-[#F8FAFC] border-slate-800 dark" : "bg-zinc-50 text-zinc-900 border-zinc-200"
    )}>
      
      {/* Dynamic Header */}
      <header className={cn(
        "pt-8 pb-4 px-6 flex justify-between items-center z-10 transition-colors",
        safety.settings.darkMode ? "bg-[#0F172A]/80" : "bg-zinc-50/80"
      )}>
        <div>
          <h1 className={cn(
            "text-2xl font-black tracking-tighter flex items-center gap-2",
            safety.settings.darkMode ? "text-white" : "text-zinc-950"
          )}>
            SURAKSHA <Shield className="w-5 h-5 text-red-500 fill-red-500" />
          </h1>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Safety & Protection Unit</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1 bg-zinc-100 rounded-full border border-zinc-200",
             safety.settings.darkMode && "bg-slate-800 border-slate-700"
          )}>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
            <span className={cn("text-[10px] font-bold", safety.settings.darkMode ? "text-emerald-400" : "text-emerald-600 uppercase tracking-widest")}>Active</span>
          </div>
          <button 
            onClick={() => setActiveTab('settings')}
            className={cn(
              "w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90",
              safety.settings.darkMode ? "bg-slate-800 text-white" : "bg-white text-zinc-950 shadow-sm border border-zinc-200"
            )}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Primary Workspace */}
      <main className="flex-1 overflow-y-auto no-scrollbar pt-4">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dash" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="px-6 space-y-6 pb-20"
            >
              {safety.isPanicActive && (
                <div className="p-1.5 bg-zinc-900 rounded-[40px] shadow-2xl border border-white/5 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-transparent animate-pulse" />
                  <button 
                    onClick={safety.stopSOS}
                    className="w-full bg-emerald-500 py-6 rounded-[34px] flex flex-col items-center justify-center gap-2 shadow-inner active:scale-95 transition-all relative z-10"
                  >
                    <Check className="w-8 h-8 text-white drop-shadow-md" />
                    <span className="text-white font-black text-xl tracking-tighter uppercase">I AM NOW SAFE</span>
                    <span className="text-emerald-100/60 text-[10px] uppercase font-bold tracking-widest">TAP TO END ALERTS</span>
                  </button>
                </div>
              )}

              {!safety.isPanicActive && (
                <div className="relative flex justify-center py-8">
                  <div className={cn(
                    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-[100px] opacity-20 animate-pulse",
                    isActivating ? "bg-red-500" : "bg-emerald-500"
                  )} />
                  <div className="relative group">
                    <div className={cn(
                      "absolute inset-0 rounded-full opacity-20 animate-ping",
                      isActivating ? "bg-red-500" : "bg-zinc-200"
                    )} style={{ animationDuration: '2s' }} />
                    <button 
                      onPointerDown={handlePanicStart}
                      onPointerUp={cancelPanic}
                      onPointerLeave={cancelPanic}
                      onClick={() => safety.triggerPanic()}
                      className={cn(
                        "w-64 h-64 rounded-full flex flex-col items-center justify-center gap-3 relative z-10 transition-all duration-300 transform active:scale-90",
                        isActivating 
                          ? "bg-red-600 shadow-[0_0_80px_rgba(220,38,38,0.5)] border-4 border-red-500" 
                          : "bg-zinc-950 shadow-2xl shadow-zinc-500/20"
                      )}
                    >
                      {isActivating ? (
                        <>
                          <div className="text-5xl font-black text-white">{panicCountdown}</div>
                          <div className="text-[10px] font-bold text-red-100 uppercase tracking-widest px-8 text-center leading-tight">TRIGGERING SOS...</div>
                        </>
                      ) : (
                        <>
                          <div className="w-16 h-16 bg-red-500/10 rounded-3xl flex items-center justify-center mb-2">
                             <Shield className="w-8 h-8 text-red-500 fill-red-500/20" />
                          </div>
                          <div className="text-2xl font-black text-white tracking-tighter leading-none">SOS TRIGGER</div>
                          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mt-1 italic">HOLD TO ACTIVATE</div>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <DashboardItem 
                  icon={PhoneCall} label="Fake Call" desc="Discrete Exit"
                  color="bg-indigo-50 text-indigo-600 border-indigo-100"
                  onClick={handleFakeCallTrigger}
                />
                <DashboardItem 
                  icon={Shield} label="Rec Evidence" desc="Silent Capture"
                  color={isRecording ? "bg-red-500 text-white" : "bg-pink-50 text-pink-600 border-pink-100"}
                  onClick={isRecording ? stopRecording : startRecording}
                />
                <DashboardItem 
                  icon={MapPin} label="Journey" desc="Safe Geofence"
                  color="bg-emerald-50 text-emerald-600 border-emerald-100"
                  onClick={() => setActiveTab('journey')}
                />
                <DashboardItem 
                   icon={HistoryIcon} label="Alert Logs" desc="History"
                   color="bg-zinc-100 text-zinc-600 border-zinc-200"
                   onClick={() => setActiveTab('history')}
                />
              </div>

              <div className={cn(
                "p-6 rounded-[32px] border",
                safety.settings.darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-zinc-100 shadow-sm"
              )}>
                <div className="flex justify-between items-center mb-6">
                   <h3 className="font-extrabold text-sm uppercase">Protection Status</h3>
                   <div className="flex gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /></div>
                </div>
                <div className="space-y-4">
                  <StatusRow icon={Navigation} label="GPS" value={safety.currentPosition ? "Active" : "Searching..."} />
                  <StatusRow icon={Users} label="Guardians" value={`${safety.contacts.length} Active`} />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && <HistoryView logs={safety.logs} darkMode={safety.settings.darkMode} />}
          {activeTab === 'contacts' && <ContactsView contacts={safety.contacts} onUpdate={safety.updateContacts} darkMode={safety.settings.darkMode} />}
          {activeTab === 'resources' && (
            <Resources 
              onOpenNearMe={() => setActiveTab('near-me')} 
              onOpenFirstAid={() => setActiveTab('first-aid')} 
              onOpenFakeCall={handleFakeCallTrigger}
              onOpenRecording={startRecording}
            />
          )}
          {activeTab === 'near-me' && <NearMe currentPos={safety.currentPosition} />}
          {activeTab === 'first-aid' && <FirstAid onBack={() => setActiveTab('resources')} />}
          {activeTab === 'settings' && <SettingsView settings={safety.settings} onUpdate={safety.updateSettings} />}
          {activeTab === 'journey' && (
            <JourneyView 
              journey={safety.journey} onUpdate={safety.setJourney} onStartSOS={() => safety.triggerPanic()}
              onStopSOS={() => safety.stopSOS()}
              currentPos={safety.currentPosition} deadMansSwitch={safety.deadMansSwitch} setDeadMansSwitch={safety.setDeadMansSwitch}
              darkMode={safety.settings.darkMode}
              settings={safety.settings}
              onLockGeofence={safety.lockGeofence}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Universal Footer */}
      <nav className={cn(
        "px-4 pb-6 pt-2 border-t flex justify-between items-center z-10 transition-colors",
        safety.settings.darkMode ? "bg-[#0F172A] border-slate-800" : "bg-white border-zinc-100"
      )}>
        <NavItem active={activeTab === 'dashboard'} icon={HomeIcon} onClick={() => setActiveTab('dashboard')} />
        <NavItem active={activeTab === 'journey'} icon={Target} onClick={() => setActiveTab('journey')} />
        <div className="relative -top-6">
          <button onClick={() => safety.triggerPanic()} className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white shadow-2xl active:scale-90 transition-transform"><Shield className="w-8 h-8" /></button>
        </div>
        <NavItem active={activeTab === 'resources'} icon={MapIcon} onClick={() => setActiveTab('resources')} />
        <NavItem active={activeTab === 'contacts'} icon={Users} onClick={() => setActiveTab('contacts')} />
      </nav>

      {/* Global Elements */}
      <AnimatePresence>
        {showFakeCall && <FakeCall onEnd={() => setShowFakeCall(false)} callerName={safety.settings.fakeCallName} />}
        {safety.showToast && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="absolute bottom-24 left-6 right-6 z-[1000]">
            <div className={cn("px-6 py-4 rounded-2xl text-white font-bold text-sm shadow-2xl flex items-center gap-3 backdrop-blur-md border border-white/10", safety.showToast.type === 'success' ? "bg-emerald-500/90" : "bg-red-500/90")}>
              <Check className="w-5 h-5" /> {safety.showToast.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({ active, icon: Icon, onClick }: { active: boolean, icon: any, onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("w-12 h-12 flex items-center justify-center rounded-2xl transition-all", active ? "bg-zinc-950 text-white shadow-xl scale-110" : "text-zinc-400 hover:bg-zinc-50")}>
      <Icon className="w-6 h-6" />
    </button>
  );
}

function DashboardItem({ icon: Icon, label, desc, color, onClick }: { icon: any, label: string, desc: string, color: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("p-5 rounded-[28px] border text-left active:scale-95 transition-all group overflow-hidden relative", color)}>
      <div className="w-10 h-10 rounded-2xl bg-white/50 backdrop-blur-sm flex items-center justify-center mb-3 shadow-sm border border-black/5"><Icon className="w-5 h-5" /></div>
      <div className="font-black text-sm tracking-tighter leading-none mb-1 uppercase">{label}</div>
      <div className="text-[10px] opacity-60 font-bold leading-tight">{desc}</div>
    </button>
  );
}

function StatusRow({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-500"><Icon className="w-4 h-4" /></div>
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-sm font-black tracking-tighter">{value}</span>
    </div>
  );
}

function HistoryView({ logs, darkMode }: { logs: any[], darkMode: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="px-6 space-y-6 pb-20">
       <h2 className={cn("text-2xl font-black tracking-tighter", darkMode ? "text-white" : "text-zinc-950")}>Timeline</h2>
       <div className="space-y-4">
          {logs.map(log => (
            <div key={log.id} className={cn("p-6 rounded-[32px] border", darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-zinc-100")}>
               <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black text-red-500 uppercase">Alert</span>
                  <span className="text-[10px] font-bold text-zinc-400">{format(new Date(log.timestamp), 'h:mm a')}</span>
               </div>
               <p className="text-sm font-medium">{log.details}</p>
            </div>
          ))}
          {logs.length === 0 && <div className="text-center py-20 opacity-20 font-bold italic">No incident reports</div>}
       </div>
    </motion.div>
  );
}

function ContactsView({ contacts, onUpdate, darkMode }: { contacts: any[], onUpdate: any, darkMode: boolean }) {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const pickFromPhone = async () => {
    if ((window as any).NativeSOSBridge?.pickContact) {
        (window as any).NativeSOSBridge.pickContact();
    } else {
        alert("Initializing native picker...");
        setShowAdd(true);
    }
  };

  useEffect(() => {
    const handleContactPicked = (e: any) => {
        const contact = e.detail;
        if (contact?.name && contact?.phone) {
            onUpdate([...contacts, { id: generateID(), ...contact }]);
        }
    };
    window.addEventListener('contactPicked', handleContactPicked);
    return () => window.removeEventListener('contactPicked', handleContactPicked);
  }, [contacts, onUpdate]);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="px-6 space-y-6 pb-20">
       <div className="flex justify-between items-center">
          <h2 className={cn("text-2xl font-black tracking-tighter", darkMode ? "text-white" : "text-zinc-950")}>Guardians</h2>
          <div className="flex gap-2">
            <button onClick={pickFromPhone} className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white"><PhoneForwarded className="w-5 h-5" /></button>
            <button onClick={() => setShowAdd(true)} className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white"><Plus className="w-5 h-5" /></button>
          </div>
       </div>
       
       {showAdd && (
          <div className={cn("p-6 rounded-[32px] space-y-4 shadow-2xl", darkMode ? "bg-slate-800 border border-slate-700" : "bg-white border border-zinc-200")}>
             <input value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" className={cn("w-full p-4 rounded-2xl font-bold", darkMode ? "bg-slate-700 text-white" : "bg-zinc-100 text-zinc-950")} />
             <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone Number" className={cn("w-full p-4 rounded-2xl font-bold", darkMode ? "bg-slate-700 text-white" : "bg-zinc-100 text-zinc-950")} />
             <div className="flex gap-2">
                <button onClick={() => { onUpdate([...contacts, { id: generateID(), name, phone }]); setShowAdd(false); }} className="flex-1 bg-red-600 py-4 rounded-2xl text-white font-black">SAVE</button>
                <button onClick={() => setShowAdd(false)} className="px-6 bg-zinc-100 rounded-2xl font-bold uppercase text-[10px]">Close</button>
             </div>
          </div>
       )}

       <div className="space-y-4">
          {contacts.map(c => (
             <div key={c.id} className={cn("p-6 rounded-[32px] border flex justify-between items-center", darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-zinc-100 shadow-sm")}>
                <div><div className="font-black tracking-tighter">{c.name}</div><div className="text-[10px] text-zinc-500 font-mono font-bold tracking-widest">{c.phone}</div></div>
                <button onClick={() => onUpdate(contacts.filter(x => x.id !== c.id))} className="text-zinc-400 active:text-red-500"><Trash2 className="w-5 h-5" /></button>
             </div>
          ))}
       </div>
    </motion.div>
  );
}

function SettingsView({ settings, onUpdate }: { settings: any, onUpdate: any }) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="px-6 space-y-8 pb-20">
       <h2 className={cn("text-2xl font-black tracking-tighter", settings.darkMode ? "text-white" : "text-zinc-950")}>Control Panel</h2>
       <div className="space-y-4">
          <div className={cn("p-6 rounded-[32px] border", settings.darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-zinc-100")}>
             <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-6 underline decoration-red-500">Sensor Protocols</h3>
             <div className="space-y-6">
                <Toggle label="Fall Detection" checked={settings.fallDetection} onChange={v => onUpdate({...settings, fallDetection: v})} />
                <Toggle label="Shake Trigger" checked={settings.shakeToAlert} onChange={v => onUpdate({...settings, shakeToAlert: v})} />
                <Toggle label="Dark Mode" checked={settings.darkMode} onChange={v => onUpdate({...settings, darkMode: v})} />
             </div>
          </div>

          <div className={cn("p-6 rounded-[32px] border", settings.darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-zinc-100")}>
             <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-6 underline decoration-indigo-500">Alert Channels</h3>
             <div className="space-y-6">
                <Toggle label="Silent SMS Alerts" checked={settings.alertMethods.sms} onChange={v => onUpdate({...settings, alertMethods: {...settings.alertMethods, sms: v}})} />
                <Toggle label="Emergency Voice Calls" checked={settings.alertMethods.call} onChange={v => onUpdate({...settings, alertMethods: {...settings.alertMethods, call: v}})} />
                
                <button 
                  onClick={() => (window as any).NativeSOSBridge?.requestSmsPermission?.()}
                  className="w-full py-3 bg-zinc-100 dark:bg-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest"
                >
                  Verify Native Permissions
                </button>
             </div>
          </div>
       </div>
    </motion.div>
  );
}

function JourneyView({ journey, onUpdate, onStartSOS, onStopSOS, currentPos, deadMansSwitch, setDeadMansSwitch, darkMode, settings, onLockGeofence }: { journey: any, onUpdate: any, onStartSOS: any, onStopSOS: any, currentPos: any, deadMansSwitch: any, setDeadMansSwitch: any, darkMode: boolean, settings: any, onLockGeofence: (r: number) => void }) {
  const [showPicker, setShowPicker] = useState(false);
  const [radius, setRadius] = useState(settings.geofence.radius || 500);
  const startDMS = (m: number) => { setDeadMansSwitch({ active: true, timeLeft: m*60, totalTime: m*60 }); setShowPicker(false); };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="px-6 space-y-6 pb-20">
       <h2 className={cn("text-2xl font-black tracking-tighter", darkMode ? "text-white" : "text-zinc-950")}>Journey Shields</h2>
       
       <div className={cn("p-8 rounded-[40px] border flex flex-col items-center gap-6", darkMode ? "bg-slate-800 border-slate-700 shadow-2xl" : "bg-white border-zinc-100 shadow-sm")}>
          {!deadMansSwitch ? (
             <>
                <Timer className="w-12 h-12 text-red-500" />
                <div className="text-center"><h3 className="font-black text-lg">Dead Man's Switch</h3><p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">SOS triggers if you don't check in</p></div>
                <button onClick={() => setShowPicker(true)} className="w-full bg-zinc-950 text-white py-5 rounded-[24px] font-black uppercase tracking-tighter active:scale-95">Set Timer</button>
             </>
          ) : (
             <div className="text-center w-full py-4 flex flex-col items-center">
                <div className="text-5xl font-black mb-6 tracking-tighter text-red-500">{Math.floor(deadMansSwitch.timeLeft / 60)}:{(deadMansSwitch.timeLeft % 60).toString().padStart(2, '0')}</div>
                <div className="grid grid-cols-2 gap-3 w-full">
                   <button onClick={() => onStopSOS()} className="py-5 bg-emerald-500 text-white rounded-[24px] font-black uppercase tracking-tighter shadow-lg shadow-emerald-500/20 active:scale-95">I'm SAFE</button>
                   <button onClick={() => setDeadMansSwitch(null)} className="py-5 bg-zinc-100 rounded-[24px] font-black text-zinc-950 uppercase tracking-tighter active:scale-95">STOP</button>
                </div>
             </div>
          )}
       </div>

       {showPicker && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-10 bg-black/60 backdrop-blur-sm">
             <div className={cn("rounded-[40px] p-8 w-full max-w-xs space-y-4 shadow-2xl", darkMode ? "bg-slate-800 border border-slate-700" : "bg-white")}>
                <h3 className="font-black text-lg text-center tracking-tighter">Check-in Interval</h3>
                {[1, 5, 15, 30, 60].map(m => <button key={m} onClick={() => startDMS(m)} className={cn("w-full py-4 rounded-2xl font-black uppercase tracking-tighter", darkMode ? "bg-slate-700 text-white hover:bg-slate-600" : "bg-zinc-100 text-zinc-900 hover:bg-zinc-200")}>{m} {m === 1 ? 'Minute' : 'Minutes'}</button>)}
                <button onClick={() => setShowPicker(false)} className="w-full py-2 text-zinc-400 font-bold uppercase text-[10px]">Cancel</button>
             </div>
          </div>
       )}

       <div className={cn("p-6 rounded-[32px] border overflow-hidden relative", darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-zinc-100")}>
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-4">
                <Target className="w-10 h-10 text-emerald-500" />
                <div><h4 className="font-bold text-sm tracking-tight">Geofence Zone</h4><p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">SOS if you leave zone</p></div>
             </div>
             {settings.geofence.enabled && <div className="px-2 py-1 bg-emerald-500 text-white text-[9px] font-black rounded-lg animate-pulse">LOCKED</div>}
          </div>
          
          <div className="h-40 bg-zinc-100 rounded-2xl mb-4 relative overflow-hidden border border-zinc-200">
             {currentPos ? (
                <SafetyMap center={currentPos} geofence={{ latitude: settings.geofence.enabled ? settings.geofence.latitude : currentPos.lat, longitude: settings.geofence.enabled ? settings.geofence.longitude : currentPos.lng, radius }} />
             ) : (
                <div className="flex items-center justify-center h-full text-[10px] font-bold text-zinc-400 animate-pulse">LOCKING GPS SIGNAL...</div>
             )}
          </div>

          <div className="space-y-4">
             <div className="flex items-center justify-between bg-zinc-50 p-3 rounded-2xl border border-zinc-100">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Radius Control</span>
                <select 
                  value={radius} 
                  onChange={(e) => setRadius(Number(e.target.value))}
                  disabled={settings.geofence.enabled}
                  className="bg-transparent font-black text-sm outline-none"
                >
                   <option value={200}>200 Meters</option>
                   <option value={500}>500 Meters</option>
                   <option value={1000}>1 Kilometer</option>
                   <option value={2000}>2 Kilometers</option>
                </select>
             </div>

             <button 
                onClick={() => onLockGeofence(radius)}
                className={cn(
                   "w-full py-5 rounded-[24px] font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-lg",
                   settings.geofence.enabled 
                      ? "bg-red-500 text-white shadow-red-500/20" 
                      : "bg-emerald-500 text-white shadow-emerald-500/20"
                )}
             >
                {settings.geofence.enabled ? 'DEACTIVATE PROTOCOL' : 'LOCK ZONE PROTOCOL'}
             </button>
          </div>
       </div>
    </motion.div>
  );
}

function Toggle({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-bold tracking-tight">{label}</span>
      <button onClick={() => onChange(!checked)} className={cn("w-14 h-7 rounded-full transition-all relative flex items-center px-1.5 shadow-inner", checked ? 'bg-red-600' : 'bg-zinc-200')}>
        <div className={cn("w-4 h-4 bg-white rounded-full transition-all shadow-md", checked ? 'translate-x-7' : 'translate-x-0')} />
      </button>
    </div>
  );
}

function PermissionRow({ icon: Icon, label, desc }: { icon: any, label: string, desc: string }) {
  return (
    <div className="flex items-center gap-4 py-3">
      <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center shrink-0 border border-white/5"><Icon className="w-5 h-5 text-zinc-400" /></div>
      <div><h4 className="font-bold text-sm text-zinc-200 tracking-tight leading-none mb-1">{label}</h4><p className="text-[11px] text-zinc-500 font-medium leading-tight">{desc}</p></div>
    </div>
  );
}
