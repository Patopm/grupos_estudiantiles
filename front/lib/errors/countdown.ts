/**
 * Countdown timer utility for rate limiting indicators
 * Requirement 8.4 - Add rate limiting indicators and countdown timers
 */

import { useEffect, useState, useCallback } from 'react';

export interface CountdownState {
  timeRemaining: number;
  isActive: boolean;
  isComplete: boolean;
  formattedTime: string;
}

export function useCountdown(initialSeconds: number): CountdownState & {
  start: (seconds?: number) => void;
  stop: () => void;
  reset: () => void;
} {
  const [timeRemaining, setTimeRemaining] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);

  const start = useCallback((seconds?: number) => {
    if (seconds !== undefined) {
      setTimeRemaining(seconds);
    }
    setIsActive(true);
  }, []);

  const stop = useCallback(() => {
    setIsActive(false);
  }, []);

  const reset = useCallback(() => {
    setTimeRemaining(initialSeconds);
    setIsActive(false);
  }, [initialSeconds]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(time => {
          if (time <= 1) {
            setIsActive(false);
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, timeRemaining]);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes < 60) {
      return remainingSeconds > 0
        ? `${minutes}m ${remainingSeconds}s`
        : `${minutes}m`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  };

  return {
    timeRemaining,
    isActive,
    isComplete: timeRemaining === 0 && !isActive,
    formattedTime: formatTime(timeRemaining),
    start,
    stop,
    reset,
  };
}

// Rate limit countdown component hook
export function useRateLimitCountdown(retryAfter?: number) {
  const countdown = useCountdown(0);

  useEffect(() => {
    if (retryAfter && retryAfter > 0) {
      countdown.start(retryAfter);
    }
  }, [retryAfter, countdown]);

  return {
    ...countdown,
    canRetry: countdown.isComplete,
    message: countdown.isActive
      ? `Podrás intentar de nuevo en ${countdown.formattedTime}`
      : countdown.isComplete
        ? 'Ya puedes intentar de nuevo'
        : '',
  };
}

// Progressive delay calculator for multiple failures
export class ProgressiveDelayCalculator {
  private static readonly BASE_DELAY = 30; // 30 seconds
  private static readonly MAX_DELAY = 3600; // 1 hour
  private static readonly MULTIPLIER = 2;

  static calculateDelay(attemptCount: number): number {
    const delay = this.BASE_DELAY * Math.pow(this.MULTIPLIER, attemptCount - 1);
    return Math.min(delay, this.MAX_DELAY);
  }

  static getDelayMessage(attemptCount: number): string {
    const delay = this.calculateDelay(attemptCount);

    if (delay < 60) {
      return `Espera ${delay} segundos antes del próximo intento`;
    } else if (delay < 3600) {
      const minutes = Math.floor(delay / 60);
      return `Espera ${minutes} minuto${minutes > 1 ? 's' : ''} antes del próximo intento`;
    } else {
      const hours = Math.floor(delay / 3600);
      return `Espera ${hours} hora${hours > 1 ? 's' : ''} antes del próximo intento`;
    }
  }
}

// Utility to format time remaining for display
export function formatTimeRemaining(seconds: number): {
  value: number;
  unit: string;
  display: string;
} {
  if (seconds < 60) {
    return {
      value: seconds,
      unit: 'segundo',
      display: `${seconds} segundo${seconds !== 1 ? 's' : ''}`,
    };
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return {
      value: minutes,
      unit: 'minuto',
      display: `${minutes} minuto${minutes !== 1 ? 's' : ''}`,
    };
  }

  const hours = Math.floor(minutes / 60);
  return {
    value: hours,
    unit: 'hora',
    display: `${hours} hora${hours !== 1 ? 's' : ''}`,
  };
}
