import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  HeartPulse, 
  Bandage, 
  Activity, 
  Flame, 
  ChevronLeft, 
  Search,
  BookOpen,
  AlertTriangle,
  Stethoscope,
  Pill,
  Wind
} from 'lucide-react';
import { cn } from '../lib/utils';

interface Guide {
  id: string;
  title: string;
  icon: any;
  steps: string[];
  tips: string[];
  color: string;
}

const FIRST_AID_GUIDES: Guide[] = [
  {
    id: 'cpr',
    title: 'How to do CPR',
    icon: HeartPulse,
    color: 'bg-red-500',
    steps: [
      'Check the scene for safety and the person for responsiveness.',
      'Call 102/112 immediately if they are not responding.',
      'Place the heel of one hand in the center of their chest.',
      'Push hard and fast (100-120 compressions per minute).',
      'Allow the chest to recoil completely between compressions.',
      'Continue until professional help arrives.'
    ],
    tips: [
      'Hum "Stayin\' Alive" to keep the right rhythm.',
      'Do not stop unless you are exhausted or help arrives.'
    ]
  },
  {
    id: 'bleeding',
    title: 'Severe Bleeding',
    icon: Bandage,
    color: 'bg-rose-600',
    steps: [
      'Apply direct pressure to the wound with a clean cloth.',
      'Keep pressure constant until bleeding stops.',
      'If blood soaks through, add more cloth on top (do not remove old one).',
      'If it is an arm or leg, raise it above heart level.',
      'Call for an ambulance if bleeding is heavy or spurting.'
    ],
    tips: [
      'Do not remove objects embedded in the wound.',
      'Apply a tourniquet only as a last resort for life-threatening limb bleeding.'
    ]
  },
  {
    id: 'burns',
    title: 'Burns & Scalds',
    icon: Flame,
    color: 'bg-orange-500',
    steps: [
      'Immediately cool the burn under cool (not cold) running water.',
      'Continue for at least 20 minutes.',
      'Remove any jewelry or tight clothing before area swells.',
      'Cover loosely with plastic wrap or a sterile bandage.',
      'Seek help if it’s bigger than a palm.'
    ],
    tips: [
      'Do not apply ice, butter, or ointments to a fresh burn.',
      'Do not pop any blisters.'
    ]
  },
  {
    id: 'choking',
    title: 'Choking (Heimlich)',
    icon: Wind,
    color: 'bg-blue-500',
    steps: [
      'Stand behind the person and wrap your arms around their waist.',
      'Make a fist and place it just above their navel.',
      'Grasp your fist with your other hand.',
      'Perform quick, upward abdominal thrusts.',
      'Repeat until the object is forced out.'
    ],
    tips: [
      'Encourage them to cough if they can still speak.',
      'If they lose consciousness, start CPR.'
    ]
  }
];

export const FirstAid: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);

  return (
    <div className="px-6 space-y-6 pb-32">
      <AnimatePresence mode="wait">
        {!selectedGuide ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
              <button onClick={onBack} className="p-2 hover:bg-zinc-100 rounded-full">
                <ChevronLeft className="w-5 h-5 text-zinc-500" />
              </button>
              <h2 className="text-xl font-bold">First Aid Handbook</h2>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4 text-amber-800 mb-6">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <p className="text-xs font-medium leading-relaxed">
                These guides are for emergency assistance only. Always call 112/102 for professional medical help first.
              </p>
            </div>

            <div className="grid gap-4">
              {FIRST_AID_GUIDES.map((guide) => {
                const Icon = guide.icon;
                return (
                  <button
                    key={guide.id}
                    onClick={() => setSelectedGuide(guide)}
                    className="bg-white p-5 rounded-3xl border border-zinc-100 shadow-sm flex items-center justify-between group active:scale-95 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg", guide.color)}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-bold text-zinc-900">{guide.title}</h4>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Emergency Guide</p>
                      </div>
                    </div>
                    <div className="w-8 h-8 bg-zinc-50 rounded-full flex items-center justify-center group-hover:bg-zinc-100">
                      <BookOpen className="w-4 h-4 text-zinc-300" />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 space-y-4">
               <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest px-2">Common Medications</h3>
               <div className="grid grid-cols-2 gap-3">
                 {[
                   { label: 'Pain (SOS)', desc: 'Paracetamol', icon: Pill },
                   { label: 'Antiseptic', desc: 'Dettol/Betadine', icon: Stethoscope },
                   { label: 'Allergy', desc: 'Cetirizine', icon: Activity },
                   { label: 'Acidity', desc: 'Antacid', icon: Pill },
                 ].map((med, i) => (
                   <div key={i} className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm flex items-center gap-3">
                      <div className="p-2 bg-zinc-50 rounded-lg">
                        <med.icon className="w-4 h-4 text-zinc-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter leading-none mb-1">{med.label}</p>
                        <p className="text-xs font-bold text-zinc-800">{med.desc}</p>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="guide"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setSelectedGuide(null)}
                className="flex items-center gap-2 text-zinc-500 font-bold text-xs uppercase tracking-widest"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Handbook
              </button>
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white", selectedGuide.color)}>
                <selectedGuide.icon className="w-5 h-5" />
              </div>
            </div>

            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">{selectedGuide.title}</h1>
              <p className="text-zinc-400 text-sm font-medium">Follow these steps carefully.</p>
            </div>

            <div className="space-y-4">
              {selectedGuide.steps.map((step, i) => (
                <div key={i} className="flex gap-4 p-5 bg-white rounded-[32px] border border-zinc-100 shadow-sm relative overflow-hidden group">
                  <div className="w-10 h-10 bg-zinc-950 text-white rounded-2xl flex items-center justify-center shrink-0 font-bold text-lg">
                    {i + 1}
                  </div>
                  <p className="text-zinc-800 font-medium leading-relaxed pt-1.5">{step}</p>
                </div>
              ))}
            </div>

            <div className="bg-zinc-900 p-6 rounded-[32px] text-white space-y-3 shadow-xl">
               <h4 className="flex items-center gap-2 font-bold text-amber-400">
                 <AlertTriangle className="w-4 h-4" /> Pro-Tips
               </h4>
               <ul className="space-y-2">
                 {selectedGuide.tips.map((tip, i) => (
                   <li key={i} className="text-xs text-zinc-400 flex gap-2">
                     <span className="text-amber-400 font-bold">•</span> {tip}
                   </li>
                 ))}
               </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
