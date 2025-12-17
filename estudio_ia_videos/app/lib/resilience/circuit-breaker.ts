/**
 * 🔌 Circuit Breaker Pattern
 * Prevents cascading failures in external service calls
 * 
 * States: CLOSED → OPEN → HALF_OPEN → CLOSED
 */

import { logger } from '@/lib/logger';

export enum CircuitState {
  CLOSED = 'closed',      // Normal operation
  OPEN = 'open',          // Failing, reject requests immediately
  HALF_OPEN = 'half_open' // Testing if service recovered
}

export interface CircuitBreakerOptions {
  failureThreshold: number;      // Failures before opening circuit (default: 5)
  successThreshold: number;      // Successes to close from half-open (default: 2)
  timeout: number;               // Time before attempting half-open (ms, default: 60000)
  resetTimeout: number;          // Time before resetting failure count (ms, default: 300000)
  name?: string;                // Circuit name for logging
}

interface CircuitBreakerStats {
  failures: number;
  successes: number;
  lastFailureTime?: number;
  lastSuccessTime?: number;
  state: CircuitState;
  totalRequests: number;
  totalFailures: number;
  totalSuccesses: number;
}

const DEFAULT_OPTIONS: Required<CircuitBreakerOptions> = {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000,        // 1 minute
  resetTimeout: 300000,  // 5 minutes
  name: 'CircuitBreaker',
};

/**
 * Circuit Breaker implementation
 */
export class CircuitBreaker {
  private options: Required<CircuitBreakerOptions>;
  private stats: CircuitBreakerStats;
  private halfOpenTimer?: NodeJS.Timeout;

  constructor(options: Partial<CircuitBreakerOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.stats = {
      failures: 0,
      successes: 0,
      state: CircuitState.CLOSED,
      totalRequests: 0,
      totalFailures: 0,
      totalSuccesses: 0,
    };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(
    fn: () => Promise<T>,
    fallback?: () => Promise<T> | T
  ): Promise<T> {
    this.stats.totalRequests++;

    // Check circuit state
    if (this.stats.state === CircuitState.OPEN) {
      if (this.shouldAttemptHalfOpen()) {
        this.transitionToHalfOpen();
      } else {
        logger.warn(`Circuit breaker ${this.options.name} is OPEN, rejecting request`, {
          component: 'CircuitBreaker',
          circuit: this.options.name,
          state: this.stats.state,
        });

        if (fallback) {
          return await Promise.resolve(fallback());
        }

        throw new Error(`Circuit breaker ${this.options.name} is OPEN`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      
      if (fallback) {
        logger.warn(`Circuit breaker ${this.options.name} caught error, using fallback`, {
          component: 'CircuitBreaker',
          circuit: this.options.name,
          error: error instanceof Error ? error.message : String(error),
        });
        return await Promise.resolve(fallback());
      }

      throw error;
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.stats.totalSuccesses++;
    this.stats.lastSuccessTime = Date.now();

    if (this.stats.state === CircuitState.HALF_OPEN) {
      this.stats.successes++;
      
      if (this.stats.successes >= this.options.successThreshold) {
        this.transitionToClosed();
      }
    } else if (this.stats.state === CircuitState.CLOSED) {
      // Reset failure count on success in closed state
      this.stats.failures = 0;
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(): void {
    this.stats.totalFailures++;
    this.stats.lastFailureTime = Date.now();

    if (this.stats.state === CircuitState.CLOSED) {
      this.stats.failures++;
      
      if (this.stats.failures >= this.options.failureThreshold) {
        this.transitionToOpen();
      }
    } else if (this.stats.state === CircuitState.HALF_OPEN) {
      // Any failure in half-open immediately opens circuit
      this.transitionToOpen();
    }
  }

  /**
   * Transition to OPEN state
   */
  private transitionToOpen(): void {
    this.stats.state = CircuitState.OPEN;
    this.stats.successes = 0;
    
    logger.error(`Circuit breaker ${this.options.name} opened`, {
      component: 'CircuitBreaker',
      circuit: this.options.name,
      failures: this.stats.failures,
      totalFailures: this.stats.totalFailures,
    });

    // Schedule transition to half-open
    this.halfOpenTimer = setTimeout(() => {
      this.transitionToHalfOpen();
    }, this.options.timeout);
  }

  /**
   * Transition to HALF_OPEN state
   */
  private transitionToHalfOpen(): void {
    this.stats.state = CircuitState.HALF_OPEN;
    this.stats.successes = 0;
    this.stats.failures = 0;

    logger.info(`Circuit breaker ${this.options.name} transitioned to HALF_OPEN`, {
      component: 'CircuitBreaker',
      circuit: this.options.name,
    });

    if (this.halfOpenTimer) {
      clearTimeout(this.halfOpenTimer);
      this.halfOpenTimer = undefined;
    }
  }

  /**
   * Transition to CLOSED state
   */
  private transitionToClosed(): void {
    this.stats.state = CircuitState.CLOSED;
    this.stats.failures = 0;
    this.stats.successes = 0;

    logger.info(`Circuit breaker ${this.options.name} closed (service recovered)`, {
      component: 'CircuitBreaker',
      circuit: this.options.name,
    });
  }

  /**
   * Check if circuit should attempt half-open
   */
  private shouldAttemptHalfOpen(): boolean {
    if (!this.stats.lastFailureTime) {
      return false;
    }

    const timeSinceFailure = Date.now() - this.stats.lastFailureTime;
    return timeSinceFailure >= this.options.timeout;
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.stats.state;
  }

  /**
   * Get circuit statistics
   */
  getStats(): Readonly<CircuitBreakerStats> {
    return { ...this.stats };
  }

  /**
   * Manually reset circuit to CLOSED state
   */
  reset(): void {
    this.stats.state = CircuitState.CLOSED;
    this.stats.failures = 0;
    this.stats.successes = 0;
    
    if (this.halfOpenTimer) {
      clearTimeout(this.halfOpenTimer);
      this.halfOpenTimer = undefined;
    }

    logger.info(`Circuit breaker ${this.options.name} manually reset`, {
      component: 'CircuitBreaker',
      circuit: this.options.name,
    });
  }

  /**
   * Check if circuit is healthy
   */
  isHealthy(): boolean {
    return this.stats.state === CircuitState.CLOSED;
  }
}

/**
 * Circuit breaker registry for managing multiple circuits
 */
class CircuitBreakerRegistry {
  private circuits: Map<string, CircuitBreaker> = new Map();

  /**
   * Get or create a circuit breaker
   */
  getOrCreate(name: string, options?: Partial<CircuitBreakerOptions>): CircuitBreaker {
    if (!this.circuits.has(name)) {
      this.circuits.set(name, new CircuitBreaker({ ...options, name }));
    }
    return this.circuits.get(name)!;
  }

  /**
   * Get circuit breaker by name
   */
  get(name: string): CircuitBreaker | undefined {
    return this.circuits.get(name);
  }

  /**
   * Get all circuit breakers
   */
  getAll(): Map<string, CircuitBreaker> {
    return new Map(this.circuits);
  }

  /**
   * Reset all circuits
   */
  resetAll(): void {
    this.circuits.forEach(circuit => circuit.reset());
  }
}

// Global registry instance
export const circuitBreakerRegistry = new CircuitBreakerRegistry();

/**
 * Convenience function to execute with circuit breaker
 */
export async function withCircuitBreaker<T>(
  name: string,
  fn: () => Promise<T>,
  options?: Partial<CircuitBreakerOptions>,
  fallback?: () => Promise<T> | T
): Promise<T> {
  const circuit = circuitBreakerRegistry.getOrCreate(name, options);
  return circuit.execute(fn, fallback);
}

