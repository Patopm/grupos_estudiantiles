/**
 * Progressive security measures implementation
 * Requirement 8.6 - Implement progressive security measures display
 */

import {
  ProgressiveSecurityState,
  SecurityMeasure,
  SecurityError,
} from './types';
import { ErrorLogger } from './handlers';

export class ProgressiveSecurityManager {
  private static readonly STORAGE_KEY = 'auth_security_state';
  private static readonly ESCALATION_THRESHOLDS = [3, 5, 10, 15]; // Failed attempts
  private static readonly MEASURE_DURATIONS = [
    5 * 60 * 1000, // 5 minutes
    15 * 60 * 1000, // 15 minutes
    60 * 60 * 1000, // 1 hour
    24 * 60 * 60 * 1000, // 24 hours
  ];

  private static readonly SECURITY_MEASURES: Omit<
    SecurityMeasure,
    'active' | 'triggeredAt' | 'expiresAt'
  >[] = [
    {
      level: 1,
      name: 'Verificación adicional',
      description: 'Se requiere verificación de email para continuar',
    },
    {
      level: 2,
      name: 'Retraso en intentos',
      description: 'Tiempo de espera entre intentos de inicio de sesión',
    },
    {
      level: 3,
      name: 'Verificación de identidad',
      description: 'Se requiere verificación de teléfono y email',
    },
    {
      level: 4,
      name: 'Bloqueo temporal',
      description: 'Cuenta temporalmente bloqueada por seguridad',
    },
  ];

  static getSecurityState(): ProgressiveSecurityState {
    if (typeof window === 'undefined') {
      return this.getDefaultState();
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return this.getDefaultState();
      }

      const state = JSON.parse(stored) as ProgressiveSecurityState;

      // Convert date strings back to Date objects
      state.measures = state.measures.map(measure => ({
        ...measure,
        triggeredAt: measure.triggeredAt
          ? new Date(measure.triggeredAt)
          : undefined,
        expiresAt: measure.expiresAt ? new Date(measure.expiresAt) : undefined,
      }));

      if (state.nextEscalation) {
        state.nextEscalation = new Date(state.nextEscalation);
      }

      if (state.resetAvailableAt) {
        state.resetAvailableAt = new Date(state.resetAvailableAt);
      }

      // Clean up expired measures
      return this.cleanupExpiredMeasures(state);
    } catch (error) {
      console.error('Failed to load security state:', error);
      return this.getDefaultState();
    }
  }

  static updateSecurityState(state: ProgressiveSecurityState): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save security state:', error);
    }
  }

  static recordFailedAttempt(userId?: string): ProgressiveSecurityState {
    const state = this.getSecurityState();
    const now = new Date();

    // Check if we should escalate security level
    const currentFailures = this.getCurrentFailureCount();
    const newFailureCount = currentFailures + 1;

    // Log security event
    ErrorLogger.logSecurityEvent(
      'authentication_failure',
      this.getSeverityForFailureCount(newFailureCount),
      {
        failureCount: newFailureCount,
        userId,
        currentSecurityLevel: state.currentLevel,
      }
    );

    // Check for escalation
    const newLevel = this.calculateSecurityLevel(newFailureCount);

    if (newLevel > state.currentLevel) {
      state.currentLevel = newLevel;

      // Activate new security measures
      const measure = this.SECURITY_MEASURES.find(m => m.level === newLevel);
      if (measure) {
        const duration =
          this.MEASURE_DURATIONS[newLevel - 1] ||
          this.MEASURE_DURATIONS[this.MEASURE_DURATIONS.length - 1];
        const expiresAt = new Date(now.getTime() + duration);

        state.measures.push({
          ...measure,
          active: true,
          triggeredAt: now,
          expiresAt,
        });

        // Set next escalation time if not at max level
        if (newLevel < this.SECURITY_MEASURES.length) {
          const nextThreshold =
            this.ESCALATION_THRESHOLDS[newLevel] ||
            this.ESCALATION_THRESHOLDS[this.ESCALATION_THRESHOLDS.length - 1];
          const remainingAttempts = nextThreshold - newFailureCount;
          if (remainingAttempts > 0) {
            state.nextEscalation = new Date(
              now.getTime() + remainingAttempts * 60 * 1000
            ); // Estimate
          }
        }
      }
    }

    // Update reset availability (24 hours after first failure)
    if (!state.resetAvailableAt) {
      state.resetAvailableAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }

    state.canReset = now >= (state.resetAvailableAt || now);

    this.updateSecurityState(state);
    this.recordFailureAttempt();

    return state;
  }

  static recordSuccessfulAuth(): ProgressiveSecurityState {
    // Clear failure count on successful authentication
    this.clearFailureCount();

    // Reset security state to default
    const defaultState = this.getDefaultState();
    this.updateSecurityState(defaultState);

    ErrorLogger.logSecurityEvent('authentication_success', 'low', {
      previousSecurityLevel: this.getSecurityState().currentLevel,
    });

    return defaultState;
  }

  static canAttemptAuth(): {
    allowed: boolean;
    reason?: string;
    waitTime?: number;
  } {
    const state = this.getSecurityState();
    const now = new Date();

    // Check for active blocking measures
    const blockingMeasure = state.measures.find(
      measure =>
        measure.active &&
        measure.level >= 4 &&
        (!measure.expiresAt || measure.expiresAt > now)
    );

    if (blockingMeasure) {
      const waitTime = blockingMeasure.expiresAt
        ? Math.ceil(
            (blockingMeasure.expiresAt.getTime() - now.getTime()) / 1000
          )
        : 3600; // Default 1 hour

      return {
        allowed: false,
        reason: blockingMeasure.description,
        waitTime,
      };
    }

    // Check for delay measures
    const delayMeasure = state.measures.find(
      measure =>
        measure.active &&
        measure.level === 2 &&
        (!measure.expiresAt || measure.expiresAt > now)
    );

    if (delayMeasure) {
      const lastAttempt = this.getLastAttemptTime();
      const requiredDelay = this.getRequiredDelay();

      if (
        lastAttempt &&
        now.getTime() - lastAttempt.getTime() < requiredDelay
      ) {
        const waitTime = Math.ceil(
          (requiredDelay - (now.getTime() - lastAttempt.getTime())) / 1000
        );

        return {
          allowed: false,
          reason: 'Debes esperar antes del próximo intento',
          waitTime,
        };
      }
    }

    return { allowed: true };
  }

  static getActiveSecurityMeasures(): SecurityMeasure[] {
    const state = this.getSecurityState();
    const now = new Date();

    return state.measures.filter(
      measure =>
        measure.active && (!measure.expiresAt || measure.expiresAt > now)
    );
  }

  static resetSecurityState(): ProgressiveSecurityState {
    const state = this.getSecurityState();
    const now = new Date();

    if (
      !state.canReset ||
      (state.resetAvailableAt && now < state.resetAvailableAt)
    ) {
      throw new Error(
        'No se puede restablecer el estado de seguridad en este momento'
      );
    }

    this.clearFailureCount();
    const defaultState = this.getDefaultState();
    this.updateSecurityState(defaultState);

    ErrorLogger.logSecurityEvent('security_state_reset', 'medium', {
      previousLevel: state.currentLevel,
      resetBy: 'user',
    });

    return defaultState;
  }

  private static getDefaultState(): ProgressiveSecurityState {
    return {
      currentLevel: 0,
      measures: [],
      canReset: false,
    };
  }

  private static cleanupExpiredMeasures(
    state: ProgressiveSecurityState
  ): ProgressiveSecurityState {
    const now = new Date();

    state.measures = state.measures.filter(
      measure => !measure.expiresAt || measure.expiresAt > now
    );

    // Recalculate current level based on active measures
    const activeMeasures = state.measures.filter(measure => measure.active);
    state.currentLevel =
      activeMeasures.length > 0
        ? Math.max(...activeMeasures.map(m => m.level))
        : 0;

    return state;
  }

  private static calculateSecurityLevel(failureCount: number): number {
    for (let i = 0; i < this.ESCALATION_THRESHOLDS.length; i++) {
      if (failureCount >= this.ESCALATION_THRESHOLDS[i]) {
        return i + 1;
      }
    }
    return 0;
  }

  private static getSeverityForFailureCount(
    count: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (count >= 15) return 'critical';
    if (count >= 10) return 'high';
    if (count >= 5) return 'medium';
    return 'low';
  }

  private static getCurrentFailureCount(): number {
    if (typeof window === 'undefined') return 0;

    try {
      const count = localStorage.getItem('auth_failure_count');
      return count ? parseInt(count, 10) : 0;
    } catch {
      return 0;
    }
  }

  private static recordFailureAttempt(): void {
    if (typeof window === 'undefined') return;

    try {
      const currentCount = this.getCurrentFailureCount();
      localStorage.setItem('auth_failure_count', (currentCount + 1).toString());
      localStorage.setItem('auth_last_attempt', new Date().toISOString());
    } catch (error) {
      console.error('Failed to record failure attempt:', error);
    }
  }

  private static clearFailureCount(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem('auth_failure_count');
      localStorage.removeItem('auth_last_attempt');
    } catch (error) {
      console.error('Failed to clear failure count:', error);
    }
  }

  private static getLastAttemptTime(): Date | null {
    if (typeof window === 'undefined') return null;

    try {
      const lastAttempt = localStorage.getItem('auth_last_attempt');
      return lastAttempt ? new Date(lastAttempt) : null;
    } catch {
      return null;
    }
  }

  private static getRequiredDelay(): number {
    const failureCount = this.getCurrentFailureCount();
    // Progressive delay: 30s, 60s, 120s, 300s, etc.
    return Math.min(30000 * Math.pow(2, Math.max(0, failureCount - 3)), 300000);
  }
}
