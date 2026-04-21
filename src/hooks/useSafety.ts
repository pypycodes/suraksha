import { SMS } from '@awesome-cordova-plugins/sms';
import { CallNumber } from '@awesome-cordova-plugins/call-number';
import { useState, useEffect, useCallback } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Contact, LocationEntry, EmergencyLog, AppSettings, Journey } from '../types';

const STORAGE_KEYS = {
  CONTACTS: 'suraksha_contacts',
  HISTORY: 'suraksha_history',
  LOGS: 'suraksha_logs',
  SETTINGS: 'suraksha_settings',
};

const generateUUID = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const DEFAULT_SETTINGS: AppSettings = {
  userName: '',
  emergencyMessage: "I'm in an emergency! Here is my location.",
  fakeCallName: 'Home',
  fakeCallDelay: 5,
  autoRecordOnPanic: true,
  voiceActivated: false,
  onboardingComplete: false,
  appMode: 'GENERAL',
  geofence: {
    enabled: false,
    latitude: 0,
    longitude: 0,
    radius: 500,
  },
  fallDetection: false,
  lowBatteryAlert: false,
  shakeToAlert: false,
  audioTrigger: false,
  darkMode: false,
  alertMethods: {
    sms: true,
    call: true,
  },
};

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
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
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number }>({ lat: 19.0760, lng: 72.8777 });
  const [deadMansSwitch, setDeadMansSwitch] = useState<{ active: boolean; timeLeft: number; totalTime: number } | null>(null);

  // Battery Monitoring
  useEffect(() => {
    let batteryInstance: any = null;
    let updateLevel: () => void;

    navigator.getBattery?.().then((battery: any) => {
      batteryInstance = battery;
      updateLevel = () => {
        const level = Math.floor(battery.level * 100);
        setBatteryLevel(level);
        if (settings.lowBatteryAlert && level <= 5) {
           contacts.forEach(c => console.log(`SIMULATED Low Battery Alert for ${c.name}: ${level}% charge remaining.`));
        }
      };
      battery.addEventListener('levelchange', updateLevel);
      updateLevel();
    }).catch(() => console.warn('Battery API fallback'));

    return () => {
      if (batteryInstance && updateLevel) {
        batteryInstance.removeEventListener('levelchange', updateLevel);
      }
    };
  }, [settings.lowBatteryAlert, contacts]);

  // Dead Man's Switch Timer
  useEffect(() => {
    let interval: any;
    if (deadMansSwitch?.active && deadMansSwitch.timeLeft > 0) {
      interval = setInterval(() => {
        setDeadMansSwitch(prev => prev ? { ...prev, timeLeft: prev.timeLeft - 1 } : null);
      }, 1000);
    } else if (deadMansSwitch?.active && deadMansSwitch.timeLeft === 0) {
      triggerPanic();
      setDeadMansSwitch(null);
    }
    return () => clearInterval(interval);
  }, [deadMansSwitch?.active, deadMansSwitch?.timeLeft]);

  // Load data
  useEffect(() => {
    const savedContacts = localStorage.getItem(STORAGE_KEYS.CONTACTS);
    const savedHistory = localStorage.getItem(STORAGE_KEYS.HISTORY);
    const savedLogs = localStorage.getItem(STORAGE_KEYS.LOGS);
    const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);

    if (savedContacts) setContacts(JSON.parse(savedContacts));
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    if (savedLogs) setLogs(JSON.parse(savedLogs));
    
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({
          ...DEFAULT_SETTINGS,
          ...parsed,
          geofence: { ...DEFAULT_SETTINGS.geofence, ...(parsed.geofence || {}) },
          alertMethods: { ...DEFAULT_SETTINGS.alertMethods, ...(parsed.alertMethods || {}) }
        });
      } catch (e) {
        console.error('Failed to parse settings', e);
      }
    }
    
    // Request Native Permissions for Background SOS & Location
    const requestNativePermissions = async () => {
      try {
        // Request Background SMS Permission if on Android
        if ((window as any).sms && (window as any).sms.hasPermission) {
          (window as any).sms.hasPermission((has: boolean) => {
            if (!has) (window as any).sms.requestPermission(() => console.log('SMS Permission Granted'), () => console.warn('SMS Permission Denied'));
          });
        }

        // Request Location Permissions
        const perm = await Geolocation.checkPermissions();
        if (perm.location !== 'granted') {
          await Geolocation.requestPermissions();
        }
        
        // Accurate background tracking hint
        console.log('Location and SMS permissions initialized.');
      } catch (e) {
        console.warn('Native setup check failed', e);
      }
    };
    
    requestNativePermissions();
    setIsReady(true);
  }, []);

  // Save data wrappers
  const updateContacts = useCallback((newContacts: Contact[]) => {
    setContacts(newContacts);
    localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(newContacts));
  }, []);

  const updateHistory = useCallback((newHistory: LocationEntry[]) => {
    setHistory(newHistory);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(newHistory));
  }, []);

  const updateLogs = useCallback((update: EmergencyLog[] | ((prev: EmergencyLog[]) => EmergencyLog[])) => {
    setLogs(prev => {
      const next = typeof update === 'function' ? update(prev) : update;
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateSettings = useCallback((newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
  }, []);

  // Helpers
  const _addLocationLog = useCallback((lat: number, lng: number, label?: string) => {
    const newEntry: LocationEntry = {
      id: generateUUID(),
      timestamp: Date.now(),
      latitude: lat,
      longitude: lng,
      label,
    };
    setHistory(prev => [newEntry, ...prev].slice(0, 50));
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify([newEntry, ...history].slice(0, 50)));
  }, [history]);

  const triggerPanic = useCallback(async () => {
    // Vibrate to confirm trigger
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch (e) {
      console.warn('Haptics not supported');
    }

    let locToUse = currentPosition; // Use state position as baseline
    try {
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000
      });
      locToUse = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      _addLocationLog(locToUse.lat, locToUse.lng, 'Panic Trigger Location');
    } catch (err) {
      console.error('Capacitor Location failed, falling back to Web API', err);
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000 });
        });
        locToUse = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        _addLocationLog(locToUse.lat, locToUse.lng, 'Panic Trigger Location (Web Fallback)');
      } catch (webErr) {
        console.error('Web Location also failed', webErr);
      }
    }

    const newLog: EmergencyLog = {
      id: generateUUID(),
      timestamp: Date.now(),
      type: 'PANIC',
      location: locToUse,
      details: `Panic button pressed. Emergency alerts (${Object.entries(settings.alertMethods || DEFAULT_SETTINGS.alertMethods).filter(([_, v]) => v).map(([k]) => k.toUpperCase()).join(', ')}) initiated to contacts.`,
    };
    
    updateLogs(prev => [newLog, ...prev]);

    // Simulated & Native Intent alerts
    contacts.forEach(c => {
      const gMapsUrl = locToUse ? `https://maps.google.com/?q=${locToUse.lat},${locToUse.lng}` : 'Location Unavailable';
      const message = `${settings.emergencyMessage} ${gMapsUrl}`;

      if (settings.alertMethods.sms) {
        console.log(`[SMS ATTEMPT] to ${c.phone}: ${message}`);
        
        // Normalize SMS sending logic for Native background execution
        const options = {
          android: {
            intent: '' // STRICT: An empty string tells Android to bypass the editor UI
          }
        };

        const trySilentSMS = () => {
          // 1. Try raw window.sms (Cordova plugin)
          if ((window as any).sms && (window as any).sms.send) {
            (window as any).sms.send(c.phone, message, options, 
              () => console.log(`[RAW SMS SUCCESS] to ${c.phone}`),
              (err: any) => {
                console.warn(`[RAW SMS FAILED] ${JSON.stringify(err)}. Falling back to intent.`);
                window.open(`sms:${c.phone}?body=${encodeURIComponent(message)}`, '_blank');
              }
            );
          } 
          // 2. Try the Awesome Cordova Plugin wrapper (Promise based)
          else {
            SMS.send(c.phone, message, options)
              .then(() => console.log(`[WRAPPED SMS SUCCESS] to ${c.phone}`))
              .catch((err) => {
                console.warn(`[WRAPPED SMS FAILED] ${err}. Falling back to intent.`);
                window.open(`sms:${c.phone}?body=${encodeURIComponent(message)}`, '_blank');
              });
          }
        };

        try {
          trySilentSMS();
        } catch (e) {
          console.error('[SMS CRITICAL ERROR]', e);
          window.open(`sms:${c.phone}?body=${encodeURIComponent(message)}`, '_blank');
        }
      }
      
      if (settings.alertMethods.call) {
        console.log(`[CALL ATTEMPT] to ${c.phone}`);
        
        // DIRECT CALL: The 'true' parameter tells Android to skip the Dialer screen
        const callPlugin = (window as any).plugins?.CallNumber || CallNumber;
        
        try {
          callPlugin.callNumber(() => {
            console.log(`[DIRECT CALL SUCCESS] initiated to ${c.phone}`);
          }, (err: any) => {
            console.warn(`[DIRECT CALL FAILED] falling back to dialer: ${err}`);
            window.open(`tel:${c.phone}`, '_blank');
          }, c.phone, true);
        } catch (e) {
          console.warn('[DIRECT CALL UNSUPPORTED] falling back to dialer');
          window.open(`tel:${c.phone}`, '_blank');
        }
      }
    });

    return newLog;
  }, [contacts, settings.emergencyMessage, settings.alertMethods, updateLogs, _addLocationLog]);

  const addLocationEntry = useCallback((lat: number, lng: number, label?: string) => {
    setCurrentPosition({ lat, lng });
    _addLocationLog(lat, lng, label);

    // Monitoring
    if (settings.geofence.enabled) {
      const dist = getDistance(lat, lng, settings.geofence.latitude, settings.geofence.longitude);
      if (dist > settings.geofence.radius) {
         console.warn('GEOFENCE BREACHED');
         triggerPanic();
      }
    }

    if (journey && journey.active && journey.status === 'IN_TRANSIT') {
      const dist = getDistance(lat, lng, journey.destLat, journey.destLng);
      if (dist < 50) {
        setJourney(prev => prev ? { ...prev, status: 'ARRIVED', active: false } : null);
        const arrivalLog: EmergencyLog = {
          id: generateUUID(),
          timestamp: Date.now(),
          type: 'RECORDING',
          details: `Safe Arrival reached: ${journey.destinationName}`,
          location: { lat, lng }
        };
        updateLogs(prev => [arrivalLog, ...prev]);
        contacts.forEach(c => console.log(`SIMULATED Arrival SMS to ${c.name}: Your loved one has reached ${journey.destinationName} safely.`));
      }
    }
  }, [settings, journey, triggerPanic, logs, updateLogs, contacts, _addLocationLog]);


  return {
    contacts,
    history,
    logs,
    settings,
    journey,
    isReady,
    batteryLevel,
    currentPosition,
    deadMansSwitch,
    setDeadMansSwitch,
    updateContacts,
    updateSettings,
    setJourney,
    triggerPanic,
    addLocationEntry,
    updateLogs,
  };
}
