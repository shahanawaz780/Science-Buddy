import { useState, useEffect, useRef, useCallback } from 'react';

interface UseQuizTimerProps {
  initialSeconds: number;
  onTimeExpired: () => void;
  isRunning?: boolean;
}

export function useQuizTimer({ initialSeconds, onTimeExpired, isRunning = true }: UseQuizTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(initialSeconds);
  const onTimeExpiredRef = useRef(onTimeExpired);
  onTimeExpiredRef.current = onTimeExpired;

  useEffect(() => {
    setTimeRemaining(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (!isRunning) return;

    if (timeRemaining <= 0) {
      onTimeExpiredRef.current();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeExpiredRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, timeRemaining]);

  const resetTimer = useCallback((newSeconds: number = initialSeconds) => {
    setTimeRemaining(newSeconds);
  }, [initialSeconds]);

  return {
    timeRemaining,
    timeSpent: initialSeconds - timeRemaining,
    resetTimer
  };
}
