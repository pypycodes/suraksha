import { useEffect, useRef, useCallback } from 'react';

interface VoiceHandlers {
  onSOS: () => void;
  onStop?: () => void;
}

export function useVoice(enabled: boolean, handlers: VoiceHandlers) {
  const recognitionRef = useRef<any>(null);
  const handlersRef = useRef(handlers);
  const isStoppingRef = useRef(false);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  const startListening = useCallback(() => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.warn('Speech Recognition not supported on this device');
        return;
      }

      if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch(e) {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onresult = (event: any) => {
        const last = event.results.length - 1;
        const command = event.results[last][0].transcript.toLowerCase();
        console.log('[VOICE] Command:', command);
        
        if (command.includes('sos') || command.includes('emergency') || 
            command.includes('help help') || command.includes('suraksha') ||
            command.includes('bachao')) {
          handlersRef.current.onSOS();
        }

        if (command.includes('stop recording') || command.includes('cancel')) {
          handlersRef.current.onStop?.();
        }
      };

      recognition.onend = () => {
        if (enabled && !isStoppingRef.current) {
          setTimeout(() => {
             if (enabled && !isStoppingRef.current) {
               try { recognitionRef.current?.start(); } catch(e) {}
             }
          }, 2000);
        }
      };

      recognition.onerror = (err: any) => {
        console.error('[VOICE] Error:', err);
      };

      recognitionRef.current = recognition;
      
      // Delay start to ensure WebView is fully ready
      setTimeout(() => {
        if (enabled && !isStoppingRef.current) {
          try { recognition.start(); } catch (e) {
            console.error('[VOICE] Start Failed:', e);
          }
        }
      }, 3000);

    } catch (e) {
      console.error('[VOICE] Fatal Init Error:', e);
    }
  }, [enabled]);

  useEffect(() => {
    isStoppingRef.current = !enabled;
    if (enabled) {
      startListening();
    } else {
      recognitionRef.current?.stop();
    }

    return () => {
      isStoppingRef.current = true;
      recognitionRef.current?.stop();
    };
  }, [enabled, startListening]);
}
