import { useState, useCallback, useRef } from 'react';

export function useRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // Auto stop after 30 seconds for safety
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') stopRecording();
      }, 30000);

    } catch (err) {
      console.error('Recording stopped/failed', err);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      
      // In a real app we'd save this blob to IndexedDB
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      return URL.createObjectURL(blob);
    }
    return null;
  }, []);

  return { isRecording, startRecording, stopRecording };
}
