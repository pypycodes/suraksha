import { useEffect, useRef, useCallback } from 'react';

interface VoiceHandlers {
  onSOS: () => void;
  onStop?: () => void;
}

export function useVoice(enabled: boolean, handlers: VoiceHandlers) {
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-IN'; // Optimized for Indian English

    recognition.onresult = (event: any) => {
      const last = event.results.length - 1;
      const command = event.results[last][0].transcript.toLowerCase();
      
      console.log('Voice Command Received:', command);

      // Trigger keywords
      if (command.includes('sos') || 
          command.includes('emergency') || 
          command.includes('help help') || 
          command.includes('suraksha')) {
        handlers.onSOS();
      }

      if (command.includes('stop recording') || command.includes('cancel')) {
        handlers.onStop?.();
      }
    };

    recognition.onend = () => {
      if (enabled) {
        recognition.start(); // Keep listening
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [enabled, handlers]);

  useEffect(() => {
    if (enabled) {
      startListening();
    } else {
      recognitionRef.current?.stop();
    }

    return () => {
      recognitionRef.current?.stop();
    };
  }, [enabled, startListening]);
}
