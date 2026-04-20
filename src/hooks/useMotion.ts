import { useEffect, useRef, useCallback } from 'react';

interface MotionHandlers {
  onFall?: () => void;
  onShake?: () => void;
}

export function useMotion(enabled: boolean, shakeEnabled: boolean, handlers: MotionHandlers) {
  const lastX = useRef<number | null>(null);
  const lastY = useRef<number | null>(null);
  const lastZ = useRef<number | null>(null);
  const shakeThreshold = 15; // Adjusted for sensitivity
  const fallThreshold = 5; // Low acceleration followed by high impact

  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    const acc = event.accelerationIncludingGravity;
    if (!acc) return;

    const { x, y, z } = acc;
    if (x === null || y === null || z === null) return;

    // 1. Shake Detection
    if (shakeEnabled) {
      if (lastX.current !== null) {
        const deltaX = Math.abs(lastX.current - x);
        const deltaY = Math.abs(lastY.current! - y);
        const deltaZ = Math.abs(lastZ.current! - z);

        if ((deltaX > shakeThreshold && deltaY > shakeThreshold) || 
            (deltaX > shakeThreshold && deltaZ > shakeThreshold) || 
            (deltaY > shakeThreshold && deltaZ > shakeThreshold)) {
          handlers.onShake?.();
        }
      }
    }

    // 2. Fall Detection Logic (Simplified)
    // A fall often involves a period of freefall (near 0G) followed by an impact (>1G)
    // We look for total acceleration magnitude changes
    const totalAcc = Math.sqrt(x*x + y*y + z*z);
    
    // In browser, gravity is usually 9.8. Freefall would be near 0.
    if (enabled && totalAcc < fallThreshold) {
       // Potential fall started... wait for impact
       setTimeout(() => {
          // If we detect a sharp rise after the low period, it's likely a fall impact
          handlers.onFall?.();
       }, 500);
    }

    lastX.current = x;
    lastY.current = y;
    lastZ.current = z;
  }, [enabled, shakeEnabled, handlers]);

  useEffect(() => {
    if (!enabled && !shakeEnabled) return;

    // Request permission for iOS if needed
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      (DeviceMotionEvent as any).requestPermission()
        .then((permissionState: string) => {
          if (permissionState === 'granted') {
            window.addEventListener('devicemotion', handleMotion);
          }
        })
        .catch(console.error);
    } else {
      window.addEventListener('devicemotion', handleMotion);
    }

    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [enabled, shakeEnabled, handleMotion]);
}
