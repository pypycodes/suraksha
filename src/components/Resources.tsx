import React from 'react';
import { Phone, Shield, Ambulance, Flame, UserRoundCheck, Home, Baby, ChevronRight, HeartPulse } from 'lucide-react';
import { INDIAN_EMERGENCY_NUMBERS } from '../types';

const ICON_MAP: Record<string, any> = {
  Phone,
  Shield,
  Ambulance,
  Flame,
  UserRoundCheck,
  Home,
  Baby,
};

export const Resources: React.FC<{ 
  onOpenNearMe: () => void, 
  onOpenFirstAid: () => void,
  onOpenFakeCall: () => void,
  onOpenRecording: () => void
}> = ({ onOpenNearMe, onOpenFirstAid, onOpenFakeCall, onOpenRecording }) => {
  const handleCall = (number: string) => {
     window.location.href = `tel:${number}`;
  };

  return (
    <div className="space-y-4 px-4 pb-20">
      <div className="bg-zinc-900 p-6 rounded-3xl text-white mb-4 shadow-xl relative overflow-hidden">
        <h3 className="text-lg font-bold mb-1">Find Nearest Help</h3>
        <p className="text-zinc-400 text-xs mb-4">Dynamically locate Police, Hospitals, and Fuel stations based on your current GPS.</p>
        <button 
          onClick={onOpenNearMe}
          className="flex items-center gap-2 bg-white text-zinc-900 px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest active:scale-95"
        >
          Open Near Me Map
        </button>
      </div>

      <button 
        onClick={onOpenFirstAid}
        className="w-full bg-red-500 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden text-left mb-6 flex items-center justify-between"
      >
        <div>
          <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-red-200" /> First Aid Handbook
          </h3>
          <p className="text-red-100 text-xs">Steps for CPR, Choking, and Severe Bleeding.</p>
        </div>
        <ChevronRight className="w-6 h-6 text-red-200" />
      </button>

      <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">Discrete Simulation</h3>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button 
          onClick={onOpenFakeCall}
          className="flex flex-col items-center gap-2 p-4 bg-indigo-50 border border-indigo-100 rounded-[28px] text-indigo-600 active:scale-95 transition-all shadow-sm"
        >
          <Phone className="w-6 h-6" />
          <span className="text-[10px] font-black uppercase tracking-widest">Fake Call</span>
        </button>
        <button 
          onClick={onOpenRecording}
          className="flex flex-col items-center gap-2 p-4 bg-pink-50 border border-pink-100 rounded-[28px] text-pink-600 active:scale-95 transition-all shadow-sm"
        >
          <Shield className="w-6 h-6" />
          <span className="text-[10px] font-black uppercase tracking-widest">Discreet Rec</span>
        </button>
      </div>

      <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">Emergency Contacts India</h3>
      <div className="grid gap-3">
        {INDIAN_EMERGENCY_NUMBERS.map((item) => {
          const Icon = ICON_MAP[item.icon] || Phone;
          return (
            <button
              key={item.number}
              onClick={() => handleCall(item.number)}
              className="flex items-center justify-between p-4 bg-white border border-zinc-100 rounded-2xl shadow-sm active:bg-zinc-50 transition-colors w-full text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center group-hover:bg-zinc-200 transition-colors text-zinc-700">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-zinc-900">{item.name}</div>
                  <div className="text-sm text-zinc-500 font-mono tracking-widest">{item.number}</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-300" />
            </button>
          );
        })}
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">Safety Checklist</h3>
        <div className="space-y-3">
          {[
            'Keep your phone battery above 30%',
            'Share your trip details with family',
            'Pre-download offline maps',
            'Note down 112 as the primary number',
            'Save local police station numbers',
          ].map((text, i) => (
            <div key={i} className="flex gap-4 p-4 bg-zinc-50 rounded-2xl">
              <div className="w-6 h-6 flex-shrink-0 bg-white rounded-full border border-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-400">
                {i + 1}
              </div>
              <p className="text-zinc-600 text-sm leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
