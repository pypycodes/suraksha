/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relation: string;
  isPrimary: boolean;
}

export interface LocationEntry {
  id: string;
  timestamp: number;
  latitude: number;
  longitude: number;
  label?: string;
}

export interface EmergencyLog {
  id: string;
  timestamp: number;
  type: 'PANIC' | 'FAKE_CALL' | 'RECORDING';
  location?: {
    lat: number;
    lng: number;
  };
  details: string;
  mediaUrl?: string; // Local blob URL or base64
}

export interface Geofence {
  enabled: boolean;
  latitude: number;
  longitude: number;
  radius: number; // in meters
}

export interface Journey {
  active: boolean;
  destinationName: string;
  destLat: number;
  destLng: number;
  triggerOnArrival: boolean;
  status: 'PENDING' | 'IN_TRANSIT' | 'ARRIVED';
}

export interface AppSettings {
  userName: string;
  emergencyMessage: string;
  fakeCallName: string;
  fakeCallDelay: number;
  autoRecordOnPanic: boolean;
  voiceActivated: boolean;
  onboardingComplete: boolean;
  appMode: 'GENERAL' | 'CHILD' | 'ELDERLY';
  geofence: Geofence;
  fallDetection: boolean;
  lowBatteryAlert: boolean;
  shakeToAlert: boolean;
  audioTrigger: boolean;
  darkMode: boolean;
  alertMethods: {
    sms: boolean;
    call: boolean;
    email: boolean;
  };
}

export interface SafetyState {
  deadMansSwitch: {
    active: boolean;
    timeLeft: number;
    totalTime: number;
  } | null;
  batteryLevel: number | null;
}

export const INDIAN_EMERGENCY_NUMBERS = [
  { name: 'National Emergency Number', number: '112', icon: 'Phone' },
  { name: 'Police', number: '100', icon: 'Shield' },
  { name: 'Ambulance', number: '102', icon: 'Ambulance' },
  { name: 'Fire', number: '101', icon: 'Flame' },
  { name: 'Women Helpline', number: '1091', icon: 'UserRoundCheck' },
  { name: 'Domestic Abuse', number: '181', icon: 'Home' },
  { name: 'Child Helpline', number: '1098', icon: 'Baby' },
];
