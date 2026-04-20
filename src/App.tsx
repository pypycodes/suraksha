/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertCircle, 
  MapPin, 
  PhoneCall, 
  Settings, 
  Users, 
  History as HistoryIcon,
  Home as HomeIcon,
  Shield,
  Plus,
  Trash2,
  Check,
  ChevronLeft,
  X,
  Navigation,
  Target,
  Baby as BabyIcon,
  Accessibility,
  Battery,
  Timer,
  Zap,
  Ear,
  Map as MapIcon,
  Crosshair,
  HeartPulse
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
  const {
    contacts,
    history,
    logs,
    settings,
    journey,
    isReady,
    batteryLevel,
    deadMansSwitch,
    setDeadMansSwitch,
    updateContacts,
    updateSettings,
    setJourney,
    triggerPanic,
    addLocationEntry,
    updateLogs,
  } = useSafety();

  const { isRecording, startRecording, stopRecording } = useRecording();

  useMotion(settings.fallDetection, settings.shakeToAlert, {
    onFall: () => {
      setShowToast({ message: 'Potential Fall Detected! SOS in 5s...', type: 'error' });
      setTimeout(() => triggerPanic(), 5000);
    },
    onShake: () => {
      setShowToast({ message: 'Shake SOS Triggered!', type: 'success' });
      triggerPanic();
    }
  });

  useVoice(settings.voiceActivated, {
    onSOS: () => {
      setShowToast({ message: 'Voice SOS Activated!', type: 'success' });
      triggerPanic();
    },
    onStop: () => {
      if (isRecording) {
        stopRecording();
        setShowToast({ message: 'Voice Stop Recording', type: 'success' });
      }
    }
  });

  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [showFakeCall, setShowFakeCall] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [panicCountdown, setPanicCountdown] = useState<number | null>(null);
  const [showToast, setShowToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [currentPos, setCurrentPos] = useState({ lat: 19.0760, lng: 72.8777 }); // Default Mumbai

  // Background location updates (simulated)
  useEffect(() => {
    const updateLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setCurrentPos(newPos);
            // addLocationEntry(newPos.lat, newPos.lng);
          },
          null,
          { enableHighAccuracy: true }
        );
      }
    };
    updateLocation();
    const interval = setInterval(updateLocation, 600000); 
    return () => clearInterval(interval);
  }, [addLocationEntry]);

  if (!isReady) return <div className="h-screen w-screen flex items-center justify-center bg-zinc-50 font-medium">Loading Suraksha...</div>;

  const handlePanicStart = () => {
    if (isActivating) return;
    
    try {
      Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (e) {}
    setIsActivating(true);
    setPanicCountdown(3);
    const interval = setInterval(() => {
      setPanicCountdown(prev => {
        if (prev && prev > 1) return prev - 1;
        clearInterval(interval);
        return 0;
      });
    }, 1000);

    setTimeout(async () => {
      const log = await triggerPanic();
      
      if (settings.autoRecordOnPanic) {
        await startRecording();
        // Update specific log with recording info
        updateLogs((prev: any[]) => prev.map(l => l.id === log.id ? { ...l, details: l.details + ' (Audio recording started)' } : l));
      }

      setIsActivating(false);
      setPanicCountdown(null);
      setShowToast({ message: 'Emergency Alerts Sent!', type: 'success' });
      setTimeout(() => setShowToast(null), 3000);
    }, 3000);
  };

  const cancelPanic = () => {
    setIsActivating(false);
    setPanicCountdown(null);
  };

  const handleFakeCall = () => {
    setShowToast({ message: `Triggering call in ${settings.fakeCallDelay}s`, type: 'success' });
    setTimeout(() => {
      setShowFakeCall(true);
      setShowToast(null);
    }, settings.fakeCallDelay * 1000);
  };

  return (
    <div className={cn(
      "flex flex-col h-screen font-sans select-none overflow-hidden max-w-md mx-auto relative border-x transition-colors duration-300",
      settings.darkMode ? "bg-zinc-950 text-white border-zinc-800 dark" : "bg-zinc-50 text-zinc-900 border-zinc-200"
    )}>
      
      {/* Header */}
      <header className={cn(
        "px-6 pt-12 pb-6 border-b shrink-0 transition-colors",
        settings.darkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100"
      )}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-red-500 rounded-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h1 className={cn(
              "text-xl font-bold tracking-tight transition-colors",
              settings.darkMode ? "text-white" : "text-zinc-900"
            )}>Suraksha</h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => updateSettings({...settings, darkMode: !settings.darkMode})}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                settings.darkMode ? "bg-zinc-800 text-amber-400" : "bg-zinc-100 text-zinc-500"
              )}
            >
              {settings.darkMode ? <Zap className="w-5 h-5 fill-current" /> : <Zap className="w-5 h-5" />}
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                settings.darkMode ? "bg-zinc-800 text-zinc-400" : "bg-zinc-100 text-zinc-500"
              )}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dash"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="px-6 space-y-8"
            >
              {/* Emergency Status Card */}
              <div className={cn(
                "p-6 rounded-3xl border shadow-sm relative overflow-hidden transition-colors",
                settings.darkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100"
              )}>
                <SafetyMap center={currentPos} markers={[{ id: 'me', position: currentPos }]} className="h-32 mb-4 rounded-2xl" />
                {isRecording && (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="absolute top-0 right-0 p-3 flex items-center gap-2"
                  >
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Recording</span>
                  </motion.div>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-400 mb-1">Current Status</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                      <span className={cn(
                        "text-lg font-semibold transition-colors",
                        settings.darkMode ? "text-white" : "text-zinc-800"
                      )}>You are protected</span>
                    </div>
                  </div>
                  {batteryLevel !== null && (
                    <div className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors",
                      settings.darkMode ? "bg-zinc-800 border-zinc-700" : "bg-zinc-50 border-zinc-100"
                    )}>
                      <Battery className={cn("w-4 h-4", batteryLevel <= 20 ? "text-red-500" : "text-green-500")} />
                      <span className={cn(
                        "text-xs font-bold font-mono transition-colors",
                        settings.darkMode ? "text-zinc-400" : "text-zinc-600"
                      )}>{batteryLevel}%</span>
                    </div>
                  )}
                </div>

                {deadMansSwitch?.active && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-zinc-900 rounded-2xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/10 rounded-lg">
                        <Timer className="w-5 h-5 text-white animate-pulse" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Safety Check</p>
                        <p className="text-white font-bold font-mono">
                          {Math.floor(deadMansSwitch.timeLeft / 60)}:{String(deadMansSwitch.timeLeft % 60).padStart(2, '0')}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setDeadMansSwitch(null)}
                      className="px-4 py-2 bg-white text-zinc-900 rounded-xl text-xs font-bold active:scale-95 transition-all"
                    >
                      I'm Safe
                    </button>
                  </motion.div>
                )}
                {isRecording && (
                   <button 
                    onClick={() => stopRecording()}
                    className="mt-4 w-full py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold uppercase tracking-widest active:scale-95 transition-all"
                   >
                     Stop Discreet Recording
                   </button>
                )}
              </div>

              {/* Panic Section */}
              <div className="flex flex-col items-center justify-center py-8">
                <div className="relative group">
                  {/* Glowing background */}
                  <div className={cn(
                    "absolute inset-0 bg-red-400 rounded-full blur-2xl opacity-20 transition-all duration-500",
                    isActivating ? "scale-150 opacity-40" : "scale-100"
                  )} />
                  
                  <button
                    onContextMenu={(e) => e.preventDefault()}
                    onClick={isActivating ? cancelPanic : handlePanicStart}
                    className={cn(
                      "relative w-48 h-48 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-300 active:scale-95",
                      isActivating ? "bg-zinc-900" : "bg-red-500 hover:bg-red-600"
                    )}
                  >
                    {isActivating ? (
                      <div className="text-center">
                        <span className="text-5xl font-bold text-white mb-2 block">{panicCountdown}</span>
                        <span className="text-red-400 text-xs font-bold uppercase tracking-widest">Cancel</span>
                      </div>
                    ) : (
                      <>
                        <AlertCircle className="w-16 h-16 text-white mb-2" />
                        <span className="text-white font-bold text-lg uppercase tracking-tighter">Panic</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="mt-6 text-zinc-400 text-sm font-medium text-center max-w-[200px]">
                  {isActivating ? "Alerting contacts..." : "Tap and hold for 3 seconds to trigger emergency alert"}
                </p>
              </div>

              {/* Action Grid */}
              <div className="grid grid-cols-2 gap-4">
                <ActionButton 
                  icon={PhoneCall} 
                  label="Fake Call" 
                  color={settings.darkMode ? "bg-indigo-900/20 text-indigo-400 border-indigo-900/10" : "bg-indigo-50 text-indigo-600 border-zinc-100"}
                  onClick={handleFakeCall}
                  darkMode={settings.darkMode}
                />
                <ActionButton 
                  icon={Timer} 
                  label="Safety Timer" 
                  color={settings.darkMode ? "bg-zinc-800 text-white border-zinc-700" : "bg-zinc-900 text-white border-zinc-900 shadow-xl"}
                  onClick={() => setDeadMansSwitch({ active: true, timeLeft: 1200, totalTime: 1200 })}
                  darkMode={settings.darkMode}
                />
                <ActionButton 
                  icon={HistoryIcon} 
                  label="Safe Logs" 
                  color={settings.darkMode ? "bg-amber-900/20 text-amber-400 border-amber-900/10" : "bg-amber-50 text-amber-600 border-zinc-100"}
                  onClick={() => setActiveTab('history')}
                  darkMode={settings.darkMode}
                />
                <ActionButton 
                  icon={Navigation} 
                  label="Journey" 
                  color={settings.darkMode ? "bg-zinc-800 text-zinc-400 border-zinc-700" : "bg-zinc-100 text-zinc-600 border-zinc-100"}
                  onClick={() => setActiveTab('journey')}
                  darkMode={settings.darkMode}
                />
                <ActionButton 
                  icon={Crosshair} 
                  label="Near Me" 
                  color={settings.darkMode ? "bg-red-900/20 text-red-400 border-red-900/10" : "bg-red-50 text-red-600 border-zinc-100"}
                  onClick={() => setActiveTab('near-me')}
                  darkMode={settings.darkMode}
                />
                <ActionButton 
                  icon={HeartPulse} 
                  label="First Aid" 
                  color={settings.darkMode ? "bg-rose-900/20 text-rose-400 border-rose-900/10" : "bg-rose-50 text-rose-500 border-zinc-100"}
                  onClick={() => setActiveTab('first-aid')}
                  darkMode={settings.darkMode}
                />
              </div>

              {/* Quick Resources */}
              <div className="bg-zinc-900 rounded-3xl p-6 text-white shadow-xl overflow-hidden relative">
                <div className="relative z-10">
                  <h3 className="text-lg font-bold mb-1">Safety Shield Active</h3>
                  <p className="text-zinc-400 text-xs mb-4">Location reporting to primary contacts every 15 mins</p>
                  <button 
                    onClick={() => setActiveTab('resources')}
                    className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm font-semibold active:bg-white/20 transition-colors"
                  >
                    Emergency Numbers <Plus className="w-4 h-4" />
                  </button>
                </div>
                <Shield className="absolute -bottom-4 -right-4 w-32 h-32 opacity-10 text-white rotate-12" />
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="px-6 space-y-6 pb-24"
            >
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveTab('dashboard')} className={cn(
                  "p-2 rounded-full transition-colors",
                  settings.darkMode ? "hover:bg-zinc-800" : "hover:bg-zinc-100"
                )}>
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold">Location & Event History</h2>
              </div>

              {logs.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                  <div className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center mx-auto transition-colors",
                    settings.darkMode ? "bg-zinc-900" : "bg-zinc-100"
                  )}>
                    <HistoryIcon className="w-8 h-8 text-zinc-300" />
                  </div>
                  <p className="text-zinc-500 font-medium">No emergency logs yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {logs.map((log) => (
                    <div key={log.id} className={cn(
                      "p-4 rounded-2xl border shadow-sm flex gap-4 transition-colors",
                      settings.darkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100"
                    )}>
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                        log.type === 'PANIC' 
                          ? (settings.darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-500') 
                          : (settings.darkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-500')
                      )}>
                        {log.type === 'PANIC' ? <AlertCircle className="w-6 h-6" /> : <HistoryIcon className="w-6 h-6" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className={cn(
                            "font-bold truncate transition-colors",
                            settings.darkMode ? "text-white" : "text-zinc-900"
                          )}>
                            {log.type === 'PANIC' ? 'Emergency Alert' : log.type}
                          </h4>
                          <span className="text-[10px] font-bold text-zinc-400 whitespace-nowrap">
                            {format(log.timestamp, 'HH:mm dd MMM')}
                          </span>
                        </div>
                        <p className={cn(
                          "text-sm line-clamp-2 transition-colors",
                          settings.darkMode ? "text-zinc-400" : "text-zinc-500"
                        )}>{log.details}</p>
                        {log.location && (
                          <div className={cn(
                            "mt-2 flex items-center gap-1 text-xs transition-colors",
                            settings.darkMode ? "text-zinc-500" : "text-zinc-400"
                          )}>
                            <MapPin className="w-3 h-3" />
                            <span>{log.location.lat.toFixed(4)}, {log.location.lng.toFixed(4)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className={cn(
                "pt-8 border-t transition-colors",
                settings.darkMode ? "border-zinc-800" : "border-zinc-100"
              )}>
                 <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Simulation Tools</h3>
                 <button 
                  onClick={() => {
                    navigator.geolocation.getCurrentPosition((pos) => {
                      addLocationEntry(pos.coords.latitude + 0.01, pos.coords.longitude + 0.01, 'Simulated Movement');
                      setShowToast({ message: 'GPS Movement Simulated', type: 'success' });
                      setTimeout(() => setShowToast(null), 2000);
                    });
                  }}
                  className={cn(
                    "w-full py-4 rounded-2xl font-bold text-sm transition-colors",
                    settings.darkMode ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-600"
                  )}
                 >
                   Simulate GPS Movement (Trigger Checks)
                 </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'contacts' && <ContactsView contacts={contacts} onUpdate={updateContacts} darkMode={settings.darkMode} />}
          {activeTab === 'resources' && <Resources onOpenNearMe={() => setActiveTab('near-me')} onOpenFirstAid={() => setActiveTab('first-aid')} />}
          {activeTab === 'near-me' && <NearMe currentPos={currentPos} />}
          {activeTab === 'first-aid' && <FirstAid onBack={() => setActiveTab('resources')} />}
          {activeTab === 'settings' && <SettingsView settings={settings} onUpdate={updateSettings} currentPos={currentPos} />}
          {activeTab === 'journey' && <JourneyView journey={journey} onUpdate={setJourney} currentPos={currentPos} />}

        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      <nav className={cn(
        "fixed bottom-0 left-0 right-0 max-w-md mx-auto border-t px-4 py-4 z-50 transition-colors backdrop-blur-xl",
        settings.darkMode ? "bg-zinc-900/80 border-zinc-800" : "bg-white/80 border-zinc-100"
      )}>
        <div className="flex justify-between items-center max-w-md mx-auto">
          <NavButton active={activeTab === 'dashboard'} icon={HomeIcon} onClick={() => setActiveTab('dashboard')} darkMode={settings.darkMode} />
          <NavButton active={activeTab === 'journey'} icon={Navigation} onClick={() => setActiveTab('journey')} darkMode={settings.darkMode} />
          <NavButton active={activeTab === 'near-me'} icon={Crosshair} onClick={() => setActiveTab('near-me')} darkMode={settings.darkMode} />
          
          {/* Float SOS Widget */}
          <div className="relative -top-10">
            <button 
              onClick={handlePanicStart}
              className="w-16 h-16 bg-red-600 rounded-full border-4 border-white shadow-2xl flex items-center justify-center active:scale-90 transition-transform active:bg-red-700"
            >
              <AlertCircle className="w-8 h-8 text-white" />
            </button>
          </div>

          <NavButton active={activeTab === 'contacts'} icon={Users} onClick={() => setActiveTab('contacts')} darkMode={settings.darkMode} />
          <NavButton active={activeTab === 'resources'} icon={Plus} onClick={() => setActiveTab('resources')} darkMode={settings.darkMode} />
          <NavButton active={activeTab === 'history'} icon={HistoryIcon} onClick={() => setActiveTab('history')} darkMode={settings.darkMode} />
        </div>
      </nav>

      {/* Overlays */}
      <AnimatePresence>
        {showFakeCall && (
          <FakeCall 
            callerName={settings.fakeCallName} 
            onEnd={() => setShowFakeCall(false)} 
          />
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={cn(
              "fixed bottom-24 left-6 right-6 p-4 rounded-2xl shadow-xl flex items-center gap-3 z-50",
              showToast.type === 'success' ? 'bg-zinc-900 text-white' : 'bg-red-500 text-white'
            )}
          >
            {showToast.type === 'success' ? <Check className="w-5 h-5 text-green-400" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-medium">{showToast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-components

function ActionButton({ icon: Icon, label, color, onClick, darkMode }: { icon: any, label: string, color: string, onClick: () => void, darkMode?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "p-6 rounded-3xl flex flex-col items-center gap-3 shadow-sm border active:scale-95 transition-all text-center", 
        color,
        !color.includes('border') && (darkMode ? "border-zinc-800" : "border-zinc-100")
      )}
    >
      <Icon className="w-8 h-8" />
      <span className="font-bold text-sm">{label}</span>
    </button>
  );
}

function NavButton({ active, icon: Icon, onClick, darkMode }: { active: boolean, icon: any, onClick: () => void, darkMode?: boolean }) {
  const handleClick = () => {
    try {
      Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {}
    onClick();
  };

  return (
    <button 
      onClick={handleClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-colors duration-300",
        active 
          ? (darkMode ? "text-white" : "text-zinc-900") 
          : (darkMode ? "text-zinc-600" : "text-zinc-300")
      )}
    >
      <div className={cn(
        "p-1.5 rounded-xl transition-colors",
        active 
          ? (darkMode ? "bg-zinc-800" : "bg-zinc-100") 
          : "bg-transparent"
      )}>
        <Icon className="w-5 h-5" />
      </div>
    </button>
  );
}

function ContactsView({ contacts, onUpdate, darkMode }: { contacts: any[], onUpdate: (c: any[]) => void, darkMode?: boolean }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '', relation: '' });

  const addContact = () => {
    if (newContact.name && newContact.phone) {
      onUpdate([{ ...newContact, id: generateID(), isPrimary: contacts.length === 0 }, ...contacts]);
      setNewContact({ name: '', phone: '', relation: '' });
      setIsAdding(false);
    }
  };

  const deleteContact = (id: string) => {
    onUpdate(contacts.filter(c => c.id !== id));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-6 space-y-6"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Trusted Contacts</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center text-white"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-4 pb-12">
        {contacts.length === 0 && (
          <div className={cn(
            "py-20 text-center space-y-4 border-2 border-dashed rounded-3xl transition-colors",
            darkMode ? "border-zinc-800" : "border-zinc-100"
          )}>
            <Users className="w-12 h-12 text-zinc-200 mx-auto" />
            <p className="text-zinc-400 px-12">Add loved ones who should receive alerts in case of emergency.</p>
          </div>
        )}
        {contacts.map((c) => (
          <div key={c.id} className={cn(
            "p-4 rounded-2xl border shadow-sm flex justify-between items-center transition-colors",
            darkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100"
          )}>
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                darkMode ? "bg-zinc-800" : "bg-zinc-50"
              )}>
                <Users className="w-5 h-5 text-zinc-400" />
              </div>
              <div>
                <div className={cn(
                  "font-bold flex items-center gap-2 transition-colors",
                  darkMode ? "text-white" : "text-zinc-900"
                )}>
                  {c.name}
                  {c.isPrimary && <span className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full uppercase tracking-tighter transition-colors",
                    darkMode ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-500"
                  )}>Primary</span>}
                </div>
                <div className="text-xs text-zinc-400 font-mono tracking-wider">{c.phone}</div>
              </div>
            </div>
            <button onClick={() => deleteContact(c.id)} className="p-2 text-zinc-300 hover:text-red-500 transition-colors">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-end">
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }}
            className="w-full max-w-md mx-auto bg-white rounded-t-[40px] p-8 space-y-6"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Add Contact</h3>
              <button onClick={() => setIsAdding(false)} className="p-2 bg-zinc-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <Input label="Full Name" placeholder="e.g. Maa" value={newContact.name} onChange={(v) => setNewContact({...newContact, name: v})} />
              <Input label="Phone Number" placeholder="+91 00000" type="tel" value={newContact.phone} onChange={(v) => setNewContact({...newContact, phone: v})} />
              <Input label="Relation" placeholder="e.g. Sister" value={newContact.relation} onChange={(v) => setNewContact({...newContact, relation: v})} />
            </div>
            <button onClick={addContact} className="w-full bg-zinc-900 text-white font-bold py-4 rounded-2xl active:scale-95 transition-all">
              Save Contact
            </button>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

function JourneyView({ journey, onUpdate, currentPos }: { journey: any, onUpdate: (j: any) => void, currentPos: {lat: number, lng: number} }) {
  const [dest, setDest] = useState({ name: '', lat: '', lng: '' });

  const startJourney = () => {
    if (dest.name && dest.lat && dest.lng) {
      onUpdate({
        active: true,
        destinationName: dest.name,
        destLat: parseFloat(dest.lat),
        destLng: parseFloat(dest.lng),
        triggerOnArrival: true,
        status: 'IN_TRANSIT'
      });
    }
  };

  return (
    <div className="px-6 space-y-6">
      <h2 className="text-xl font-bold">Planned Journeys</h2>
      
      {journey?.active ? (
        <div className="bg-zinc-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">In Transit</p>
            <h3 className="text-xl font-bold mb-4">Destination: {journey.destinationName}</h3>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-zinc-300">Live GPS tracking active</span>
            </div>
            <button 
              onClick={() => onUpdate({ ...journey, active: false })}
              className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-sm font-bold transition-all"
            >
              Cancel Journey
            </button>
          </div>
          <Navigation className="absolute -bottom-4 -right-4 w-32 h-32 opacity-10 text-white" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm space-y-4">
             <SafetyMap 
              center={dest.lat && dest.lng ? { lat: parseFloat(dest.lat), lng: parseFloat(dest.lng) } : currentPos} 
              onMapClick={(pos) => setDest({ ...dest, lat: pos.lat.toString(), lng: pos.lng.toString() })}
              markers={dest.lat && dest.lng ? [{ id: 'dest', position: { lat: parseFloat(dest.lat), lng: parseFloat(dest.lng) } }] : []}
              className="h-40 rounded-2xl"
             />
             <p className="text-[10px] text-zinc-400 text-center">Tap on the map above to select destination</p>
             <Input label="Destination Name" placeholder="e.g. School or Home" value={dest.name} onChange={(v) => setDest({...dest, name: v})} />
             <div className="grid grid-cols-2 gap-4">
               <Input label="Latitude" placeholder="e.g. 19.0760" value={dest.lat} onChange={(v) => setDest({...dest, lat: v})} />
               <Input label="Longitude" placeholder="e.g. 72.8777" value={dest.lng} onChange={(v) => setDest({...dest, lng: v})} />
             </div>
             <button 
              onClick={startJourney}
              className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold active:scale-95 transition-all flex items-center justify-center gap-2"
             >
               <Navigation className="w-5 h-5" /> Start Journey
             </button>
          </div>
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 text-amber-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-xs leading-relaxed">Entering destination coordinates allows Suraksha to automatically notify your trusted contacts when you reach safely.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsView({ settings, onUpdate, currentPos }: { settings: any, onUpdate: (s: any) => void, currentPos: {lat: number, lng: number} }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-6 space-y-8 pb-32">
      <h2 className="text-xl font-bold">Preferences</h2>
      
      <div className="space-y-6">
        <section>
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">Emergency Alerts</h3>
          <div className={cn(
            "space-y-4 p-6 rounded-3xl border shadow-sm transition-colors",
            settings.darkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100"
          )}>
             <Toggle 
              label="SMS Alerts (Mandatory)" 
              checked={settings.alertMethods.sms} 
              onChange={(v) => onUpdate({...settings, alertMethods: { ...settings.alertMethods, sms: true }})} // Forced true as per user request
             />
             <div className={cn("h-px transition-colors", settings.darkMode ? "bg-zinc-800" : "bg-zinc-50")} />
             <Toggle 
              label="Phone Call Alerts (Mandatory)" 
              checked={settings.alertMethods.call} 
              onChange={(v) => onUpdate({...settings, alertMethods: { ...settings.alertMethods, call: true }})} // Forced true as per user request
             />
          </div>
          <p className="mt-2 text-[10px] text-zinc-400 px-2 flex items-start gap-2">
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            SMS and Call alerts are mandatory for safety integrity and cannot be disabled in the current configuration.
          </p>
        </section>

        <section>
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">Appearance</h3>
          <div className={cn(
            "space-y-4 p-6 rounded-3xl border shadow-sm transition-colors",
            settings.darkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100"
          )}>
             <Toggle 
              label="Dark Mode" 
              checked={settings.darkMode} 
              onChange={(v) => onUpdate({...settings, darkMode: v})} 
             />
          </div>
        </section>

        <section>
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">Application Mode</h3>
          <div className="grid grid-cols-3 gap-3">
             <ModeButton 
              active={settings.appMode === 'GENERAL'} 
              icon={Shield} label="General" 
              onClick={() => onUpdate({...settings, appMode: 'GENERAL'})} 
             />
             <ModeButton 
              active={settings.appMode === 'CHILD'} 
              icon={BabyIcon} label="Child" 
              onClick={() => onUpdate({...settings, appMode: 'CHILD'})} 
             />
             <ModeButton 
              active={settings.appMode === 'ELDERLY'} 
              icon={Accessibility} label="Elderly" 
              onClick={() => onUpdate({...settings, appMode: 'ELDERLY'})} 
             />
          </div>
        </section>

        <section>
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">Geofence (GPS Perimeter)</h3>
          <div className={cn(
            "space-y-4 p-6 rounded-3xl border shadow-sm transition-colors",
            settings.darkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100"
          )}>
             <Toggle 
              label="Enable GPS Boundary" 
              checked={settings.geofence.enabled} 
              onChange={(v) => {
                const newSettings = { ...settings, geofence: { ...settings.geofence, enabled: v } };
                if (v && settings.geofence.latitude === 0) {
                  // Set to current location if never set
                  newSettings.geofence.latitude = currentPos.lat;
                  newSettings.geofence.longitude = currentPos.lng;
                }
                onUpdate(newSettings);
              }} 
             />
             {settings.geofence.enabled && (
               <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className={cn(
                 "space-y-4 pt-4 border-t transition-colors",
                 settings.darkMode ? "border-zinc-800" : "border-zinc-50"
               )}>
                  <SafetyMap 
                    center={{ lat: settings.geofence.latitude || currentPos.lat, lng: settings.geofence.longitude || currentPos.lng }}
                    onMapClick={(pos) => onUpdate({...settings, geofence: { ...settings.geofence, latitude: pos.lat, longitude: pos.lng }})}
                    markers={[{ id: 'fence', position: { lat: settings.geofence.latitude, lng: settings.geofence.longitude } }]}
                    geofence={settings.geofence}
                    className="h-32 rounded-2xl"
                  />
                  <p className="text-[10px] text-zinc-400 text-center">Tap on map to set boundary center</p>
                  <Input 
                    label="Boundary Radius (meters)" 
                    type="number" 
                    value={settings.geofence.radius.toString()} 
                    onChange={(v) => onUpdate({...settings, geofence: { ...settings.geofence, radius: parseInt(v) }})} 
                  />
                  <p className="text-[10px] text-zinc-400">If the device moves {settings.geofence.radius}m away from its current set location, a panic alert will automatically trigger.</p>
               </motion.div>
             )}
          </div>
        </section>

        <section>
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">Autonomous Safety</h3>
          <div className={cn(
            "space-y-4 p-6 rounded-3xl border shadow-sm transition-colors",
            settings.darkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100"
          )}>
             <Toggle 
              label="Fall Detection" 
              checked={settings.fallDetection} 
              onChange={(v) => onUpdate({...settings, fallDetection: v})} 
             />
             <div className={cn("h-px transition-colors", settings.darkMode ? "bg-zinc-800" : "bg-zinc-50")} />
             <Toggle 
              label="Low Battery Alert (5%)" 
              checked={settings.lowBatteryAlert} 
              onChange={(v) => onUpdate({...settings, lowBatteryAlert: v})} 
             />
             <div className={cn("h-px transition-colors", settings.darkMode ? "bg-zinc-800" : "bg-zinc-50")} />
             <Toggle 
              label="Shake-to-Alert" 
              checked={settings.shakeToAlert} 
              onChange={(v) => onUpdate({...settings, shakeToAlert: v})} 
             />
          </div>
        </section>

        <section>
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">Recording & Audio</h3>
          <div className={cn(
            "space-y-4 p-6 rounded-3xl border shadow-sm transition-colors",
            settings.darkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100"
          )}>
             <Toggle 
              label="Auto-record on panic" 
              checked={settings.autoRecordOnPanic} 
              onChange={(v) => onUpdate({...settings, autoRecordOnPanic: v})} 
             />
             <div className={cn("h-px transition-colors", settings.darkMode ? "bg-zinc-800" : "bg-zinc-50")} />
             <Toggle 
              label="Voice Activated SOS" 
              checked={settings.voiceActivated} 
              onChange={(v) => onUpdate({...settings, voiceActivated: v})} 
             />
             <div className={cn("h-px transition-colors", settings.darkMode ? "bg-zinc-800" : "bg-zinc-50")} />
             <Toggle 
              label="Sound Recognition (Scream)" 
              checked={settings.audioTrigger} 
              onChange={(v) => onUpdate({...settings, audioTrigger: v})} 
             />
          </div>
        </section>

        <section>
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">Identity</h3>
          <div className={cn(
            "space-y-4 p-6 rounded-3xl border shadow-sm transition-colors",
            settings.darkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100"
          )}>
             <Input label="Fake Call Name" value={settings.fakeCallName} onChange={(v) => onUpdate({...settings, fakeCallName: v})} />
          </div>
        </section>

        <p className="text-[10px] text-center text-zinc-400 leading-relaxed px-8 pb-4">
          All data is encrypted locally. Ad-free forever. Suraksha works on Tablets, Foldables, and Web Browsers.
        </p>
      </div>
    </motion.div>
  );
}

function ModeButton({ active, icon: Icon, label, onClick }: { active: boolean, icon: any, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all h-full",
        active 
          ? "bg-zinc-900 text-white border-zinc-900 shadow-lg dark:bg-white dark:text-zinc-900 dark:border-white" 
          : "bg-white text-zinc-500 border-zinc-100 dark:bg-zinc-900 dark:text-zinc-500 dark:border-zinc-800"
      )}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
    </button>
  );
}

function Input({ label, value, onChange, placeholder, type = 'text' }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string, type?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">{label}</label>
      <input 
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-4 text-zinc-900 font-medium placeholder:text-zinc-300 focus:outline-none focus:ring-2 ring-zinc-100 transition-all dark:bg-zinc-800 dark:border-zinc-700 dark:text-white dark:ring-zinc-800"
      />
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{label}</span>
      <button 
        onClick={() => onChange(!checked)}
        className={cn(
          "w-12 h-6 rounded-full transition-colors relative flex items-center px-1",
          checked ? 'bg-green-500' : 'bg-zinc-200 dark:bg-zinc-800'
        )}
      >
        <div className={cn(
          "w-4 h-4 bg-white rounded-full transition-transform shadow-sm",
          checked ? 'translate-x-6' : 'translate-x-0'
        )} />
      </button>
    </div>
  );
}
