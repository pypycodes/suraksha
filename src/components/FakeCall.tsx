import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, User, Mic, Video, Grid, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface FakeCallProps {
  callerName: string;
  onEnd: () => void;
}

export const FakeCall: React.FC<FakeCallProps> = ({ callerName, onEnd }) => {
  const [status, setStatus] = useState<'ringing' | 'connected' | 'ended'>('ringing');
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'connected') {
      interval = setInterval(() => setTimer(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (status === 'ended') {
    return null;
  }

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      className="fixed inset-0 z-[100] bg-zinc-900 text-white flex flex-col items-center justify-between py-16 px-8"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center">
          <User className="w-12 h-12 text-zinc-400" />
        </div>
        <div className="text-center">
          <h2 className="text-3xl font-medium">{callerName || 'Home'}</h2>
          <p className="text-zinc-400 mt-1 capitalize">
            {status === 'ringing' ? 'Incoming call...' : formatTime(timer)}
          </p>
        </div>
      </div>

      <div className="w-full flex flex-col gap-12">
        {status === 'connected' && (
          <div className="grid grid-cols-3 gap-y-8 gap-x-4">
            <CallAction icon={Mic} label="Mute" />
            <CallAction icon={Grid} label="Keypad" />
            <CallAction icon={Volume2} label="Speaker" />
            <CallAction icon={Video} label="Video" />
            <CallAction icon={User} label="Add Call" />
            <CallAction icon={Mic} label="Audio" />
          </div>
        )}

        <div className={cn("flex justify-around w-full", status === 'connected' ? 'justify-center' : '')}>
          {status === 'ringing' ? (
            <>
              <button
                onClick={onEnd}
                className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
              >
                <PhoneOff className="w-8 h-8 fill-white" />
              </button>
              <button
                onClick={() => setStatus('connected')}
                className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-pulse active:scale-95 transition-transform"
              >
                <Phone className="w-8 h-8 fill-white" />
              </button>
            </>
          ) : (
            <button
              onClick={onEnd}
              className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            >
              <PhoneOff className="w-8 h-8 fill-white" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const CallAction = ({ icon: Icon, label }: { icon: any, label: string }) => (
  <div className="flex flex-col items-center gap-2">
    <div className="w-14 h-14 bg-zinc-800 rounded-full flex items-center justify-center active:bg-zinc-700 transition-colors">
      <Icon className="w-6 h-6 text-white" />
    </div>
    <span className="text-xs text-zinc-400 font-medium">{label}</span>
  </div>
);
