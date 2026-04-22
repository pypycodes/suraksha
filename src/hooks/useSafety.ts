import { useState, useEffect, useCallback, useRef } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { Contact, LocationEntry, EmergencyLog, AppSettings, Journey } from '../types';

const STORAGE_KEYS = {
  CONTACTS: 'suraksha_contacts',
  HISTORY: 'suraksha_history',
  LOGS: 'suraksha_logs',
  SETTINGS: 'suraksha_settings',
};

const DEFAULT_SETTINGS: AppSettings = {
  userName: '',
  emergencyMessage: "I'm in an emergency! Here is my location.",
  fakeCallName: 'Home',
  fakeCallDelay: 5,
  autoRecordOnPanic: true,
  onboardingComplete: false,
  appMode: 'GENERAL',
  geofence: { enabled: false, latitude: 0, longitude: 0, radius: 500 },
  fallDetection: false,
  lowBatteryAlert: false,
  shakeToAlert: false,
  darkMode: false,
  floatingSOS: false,
  testMode: false,
  alertMethods: { sms: true, call: true },
};

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export function useSafety() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [history, setHistory] = useState<LocationEntry[]>([]);
  const [logs, setLogs] = useState<EmergencyLog[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [journey, setJourney] = useState<Journey | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [deadMansSwitch, setDeadMansSwitch] = useState<{ active: boolean; timeLeft: number; totalTime: number } | null>(null);
  const [showToast, setShowToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [isPanicActive, setIsPanicActive] = useState(false);
  
  const panicCooldownRef = useRef(false);
  const staggeredSmsIntervalRef = useRef<any>(null);
  const isPanicActiveRef = useRef(false);

  useEffect(() => {
    isPanicActiveRef.current = isPanicActive;
  }, [isPanicActive]);

  // Persistence Loaders
  useEffect(() => {
    const loadData = () => {
      try {
        const c = localStorage.getItem(STORAGE_KEYS.CONTACTS);
        const h = localStorage.getItem(STORAGE_KEYS.HISTORY);
        const l = localStorage.getItem(STORAGE_KEYS.LOGS);
        const s = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (c) setContacts(JSON.parse(c));
        if (h) setHistory(JSON.parse(h));
        if (l) setLogs(JSON.parse(l));
        if (s) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(s) });
      } catch (e) {}
      setIsReady(true);
    };
    loadData();
  }, []);

  // Toast Management
  useEffect(() => {
    if (showToast) {
      const t = setTimeout(() => setShowToast(null), 1000);
      return () => clearTimeout(t);
    }
  }, [showToast]);

  // Battery Monitoring
  useEffect(() => {
    const updateBattery = async () => {
        try {
            if ((window as any).NativeSOSBridge?.getBatteryLevel) {
                (window as any).NativeSOSBridge.getBatteryLevel();
            } else if ((navigator as any).getBattery) {
                const b = await (navigator as any).getBattery();
                setBatteryLevel(Math.floor(b.level * 100));
            } else { setBatteryLevel(99); }
        } catch (e) { setBatteryLevel(99); }
    };
    const interval = setInterval(updateBattery, 30000);
    updateBattery();
    return () => clearInterval(interval);
  }, []);

  // Location Watcher (Gated by Onboarding)
  useEffect(() => {
    if (!settings.onboardingComplete) return;
    
    let watchId: string | null = null;
    const startWatch = async () => {
        try {
            watchId = await Geolocation.watchPosition({ 
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0 
            }, (pos) => {
                if (!pos) return;
                const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setCurrentPosition(newPos);
                if (settings.geofence.enabled && !isPanicActiveRef.current) {
                    if (getDistance(newPos.lat, newPos.lng, settings.geofence.latitude, settings.geofence.longitude) > settings.geofence.radius) {
                        triggerPanic();
                    }
                }
            });
        } catch (e) {}
    };
    startWatch();
    return () => { if (watchId) Geolocation.clearWatch({ id: watchId }); };
  }, [settings.geofence, settings.onboardingComplete]);

  // Dead Man's Switch
  useEffect(() => {
    let interval: any;
    if (deadMansSwitch?.active && deadMansSwitch.timeLeft > 0) {
      interval = setInterval(() => {
        setDeadMansSwitch(prev => prev ? { ...prev, timeLeft: prev.timeLeft - 1 } : null);
      }, 1000);
    } else if (deadMansSwitch?.active && deadMansSwitch.timeLeft <= 0) {
      triggerPanic();
    }
    return () => clearInterval(interval);
  }, [deadMansSwitch?.active, deadMansSwitch?.timeLeft]);

  // --- NATIVE PERMISSIONS SYNC ---
  useEffect(() => {
    const handlePermissionsGranted = () => {
      setSettings(prev => {
        if (prev.onboardingComplete) return prev;
        const next = { ...prev, onboardingComplete: true };
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(next));
        return next;
      });
      setShowToast({ message: 'Safety Protocols Activated!', type: 'success' });
    };
    window.addEventListener('nativePermissionsGranted', handlePermissionsGranted);
    return () => window.removeEventListener('nativePermissionsGranted', handlePermissionsGranted);
  }, []);

  // --- FUSED LOCATION LISTENER ---
  useEffect(() => {
    const handleFused = (e: any) => {
      const { latitude, longitude } = e.detail;
      setCurrentPosition({ lat: latitude, lng: longitude });
    };
    window.addEventListener('fusedLocationUpdate', handleFused);
    return () => window.removeEventListener('fusedLocationUpdate', handleFused);
  }, []);

  const sendAllSms = useCallback(async () => {
    try {
        // Request immediate fused fix from native
        if ((window as any).NativeSOSBridge?.getFusedLocation) {
            (window as any).NativeSOSBridge.getFusedLocation();
        }

        const coords = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        });
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${coords.coords.latitude},${coords.coords.longitude}`;
        const message = `EMERGENCY SOS: I am in danger! Precise location: ${googleMapsUrl}`;
        
        contacts.forEach(c => {
            const cleanPhone = String(c.phone).replace(/\s+/g, '');
            if ((window as any).NativeSOSBridge?.send) {
                (window as any).NativeSOSBridge.send(cleanPhone, message);
            }
        });
    } catch (e) {
        // Use last known position if fresh fix fails
        const lat = currentPosition?.lat || 0;
        const lng = currentPosition?.lng || 0;
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        const message = `EMERGENCY SOS: I am in danger! Last known location: ${googleMapsUrl}`;
        
        contacts.forEach(c => {
            const cleanPhone = String(c.phone).replace(/\s+/g, '');
            if ((window as any).NativeSOSBridge?.send) {
                (window as any).NativeSOSBridge.send(cleanPhone, message);
            }
        });
    }
  }, [contacts, currentPosition]);

  const markAsSafe = useCallback(() => {
    setIsPanicActive(false);
    isPanicActiveRef.current = false;
    
    // Clear all intervals immediately
    if (staggeredSmsIntervalRef.current) {
      clearInterval(staggeredSmsIntervalRef.current);
      staggeredSmsIntervalRef.current = null;
    }

    // Set a cooldown to prevent accidental re-triggers (e.g. from a lingering shake)
    panicCooldownRef.current = true;
    setTimeout(() => { panicCooldownRef.current = false; }, 10000);
    
    setShowToast({ message: "You are marked as safe. All alerts stopped.", type: 'success' });
  }, []);

  const triggerPanic = useCallback(async () => {
    if (isPanicActiveRef.current || panicCooldownRef.current) return;
    
    setIsPanicActive(true);
    isPanicActiveRef.current = true;
    try { Haptics.notification({ type: NotificationType.Error }); } catch (e) {}

    const newLog: EmergencyLog = {
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      type: 'PANIC',
      details: `SOS Activated.`,
    };
    
    setLogs(prev => {
        const next = [newLog, ...prev];
        localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(next));
        return next;
    });

    // SMS Protocol
    if (settings.alertMethods.sms && !settings.testMode) {
        sendAllSms();
        staggeredSmsIntervalRef.current = setInterval(() => {
            if (isPanicActiveRef.current) sendAllSms();
            else clearInterval(staggeredSmsIntervalRef.current);
        }, 120000);
    } else if (settings.testMode) {
        setShowToast({ message: "TEST MODE: SMS Suppressed", type: 'success' });
    }

    // Call Protocol (HARDENED BROADCAST BRIDGE)
    if (settings.alertMethods.call && contacts.length > 0) {
        const startHunting = async () => {
            for (const c of contacts) {
                if (!isPanicActiveRef.current) break;
                if (settings.testMode) {
                    setShowToast({ message: `TEST MODE: Calling ${c.name} (Simulated)`, type: 'success' });
                    await new Promise(r => setTimeout(r, 5000));
                    continue;
                }
                try {
                    const cleanPhone = String(c.phone).replace(/\s+/g, '');
                    if ((window as any).NativeSOSBridge?.call) {
                        (window as any).NativeSOSBridge.call(cleanPhone);
                        await new Promise(r => setTimeout(r, 20000));
                    } else {
                        window.open(`tel:${cleanPhone}`, '_system');
                        await new Promise(r => setTimeout(r, 20000));
                    }
                } catch (e) {}
            }
        };
        startHunting();
    }
    return newLog;
  }, [contacts, settings.alertMethods, sendAllSms]);

  const stopSOS = useCallback(() => {
    setIsPanicActive(false);
    setDeadMansSwitch(null);
    if (staggeredSmsIntervalRef.current) clearInterval(staggeredSmsIntervalRef.current);
    setShowToast({ message: 'Status: Safe', type: 'success' });
  }, []);

  return {
    contacts, history, logs, settings, journey, isReady, batteryLevel,
    currentPosition, deadMansSwitch, isPanicActive, setDeadMansSwitch,
    updateContacts: (c: Contact[]) => { setContacts(c); localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(c)); },
    updateSettings: (s: AppSettings) => { setSettings(s); localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(s)); },
    setJourney, triggerPanic, stopSOS, 
    lockGeofence: (radius: number) => {
        if (!currentPosition) return;
        const s = { ...settings, geofence: { enabled: !settings.geofence.enabled, latitude: currentPosition.lat, longitude: currentPosition.lng, radius } };
        setSettings(s);
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(s));
    },
    showToast, setShowToast,
  };
}
