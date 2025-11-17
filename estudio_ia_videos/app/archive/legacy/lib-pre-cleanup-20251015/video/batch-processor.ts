/**
 * Batch Video Processor
 * 
 * Sistema completo de processamento em lote de vídeos com:
 * - Fila de tarefas com priorização
 * - Processamento paralelo configurável
 * - Retry automático com backoff exponencial
 * - Progress tracking detalhado
 * - Estatísticas em tempo real
 * - Suporte a múltiplos tipos de operações
 * - Cancelamento de tarefas
 * - Persistência de estado
 * 
 * @module BatchProcessor
 * @version 1.0.0
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

// ==========================================================================
// TYPE DEFINITIONS
// ==========================================================================

/**
 * Status de uma tarefa individual
 */
export type TaskStatus = 
  | 'pending'      // Aguardando processamento
  | 'queued'       // Na fila
  | 'processing'   // Em processamento
  | 'completed'    // Concluída com sucesso
  | 'failed'       // Falhou
  | 'cancelled'    // Cancelada
  | 'retrying';    // Tentando novamente

/**
 * Tipo de operação de vídeo
 */
export type VideoOperation = 
  | 'transcode'    // Transcodificação
  | 'compress'     // Compressão
  | 'watermark'    // Marca d'água
  | 'subtitle'     // Legendas
  | 'thumbnail'    // Miniaturas
  | 'concat'       // Concatenação
  | 'custom';      // Operação customizada

/**
 * Nível de prioridade
 */
export type Priority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Estratégia de retry
 */
export type RetryStrategy = 'exponential' | 'linear' | 'fixed' | 'none';

/**
 * Configuração de uma tarefa
 */
export interface BatchTask {
  id: string;
  operation: VideoOperation;
  inputPath: string;
  outputPath: string;
  priority: Priority;
  status: TaskStatus;
  progress: number;
  retryCount: number;
  maxRetries: number;
  error?: Error;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  processingTime?: number;
  result?: any;
}

/**
 * Configuração do processador
 */
export interface BatchProcessorConfig {
  maxConcurrent: number;           // Máx tarefas simultâneas
  retryStrategy: RetryStrategy;    // Estratégia de retry
  maxRetries: number;              // Máx tentativas por tarefa
  retryDelay: number;              // Delay inicial (ms)
  timeout: number;                 // Timeout por tarefa (ms)
  persistState: boolean;           // Salvar estado em disco
  stateFilePath?: string;          // Caminho do arquivo de estado
  autoStart: boolean;              // Iniciar automaticamente
  priorityEnabled: boolean;        // Habilitar priorização
}

/**
 * Estatísticas do processador
 */
export interface BatchStatistics {
  total: number;
  pending: number;
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  cancelled: number;
  successRate: number;
  averageProcessingTime: number;
  totalProcessingTime: number;
  estimatedTimeRemaining: number;
}

/**
 * Resultado do processamento
 */
export interface ProcessingResult {
  taskId: string;
  success: boolean;
  outputPath?: string;
  error?: Error;
  processingTime: number;
  retryCount: number;
  metadata?: Record<string, unknown>;
}

/**
 * Handler de operação customizada
 */
export type OperationHandler = (task: BatchTask) => Promise<ProcessingResult>;

/**
 * Evento de progresso
 */
export interface ProgressEvent {
  taskId: string;
  progress: number;
  status: TaskStatus;
  message?: string;
}

// ==========================================================================
// BATCH PROCESSOR CLASS
// ==========================================================================

/**
 * Classe principal do processador em lote
 */
export class BatchProcessor extends EventEmitter {
  private tasks: Map<string, BatchTask>;
  private queue: string[];
  private processing: Set<string>;
  private handlers: Map<VideoOperation, OperationHandler>;
  private config: BatchProcessorConfig;
  private isRunning: boolean;
  private nextTaskId: number;
  private statistics: BatchStatistics;
  private processingTimes: number[];

  constructor(config?: Partial<BatchProcessorConfig>) {
    super();

    // Configuração padrão
    this.config = {
      maxConcurrent: 3,
      retryStrategy: 'exponential',
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 300000, // 5 minutos
      persistState: false,
      autoStart: true,
      priorityEnabled: true,
      ...config,
    };

    this.tasks = new Map();
    this.queue = [];
    this.processing = new Set();
    this.handlers = new Map();
    this.isRunning = false;
    this.nextTaskId = 1;
    this.processingTimes = [];

    this.statistics = {
      total: 0,
      pending: 0,
      queued: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
      successRate: 0,
      averageProcessingTime: 0,
      totalProcessingTime: 0,
      estimatedTimeRemaining: 0,
    };

    // Auto-start se configurado
    if (this.config.autoStart) {
      this.start();
    }
  }

  // ==========================================================================
  // TASK MANAGEMENT
  // ==========================================================================

  /**
   * Adiciona uma nova tarefa à fila
   */
  addTask(
    operation: VideoOperation,
    inputPath: string,
    outputPath: string,
    options?: {
      priority?: Priority;
      maxRetries?: number;
      metadata?: Record<string, unknown>;
    }
  ): string {
    const taskId = `task-${this.nextTaskId++}`;

    const task: BatchTask = {
      id: taskId,
      operation,
      inputPath,
      outputPath,
      priority: options?.priority || 'normal',
      status: 'pending',
      progress: 0,
      retryCount: 0,
      maxRetries: options?.maxRetries ?? this.config.maxRetries,
      metadata: options?.metadata,
      createdAt: new Date(),
    };

    this.tasks.set(taskId, task);
    this.enqueueTask(taskId);

    this.emit('task:added', task);
    this.updateStatistics();

    // Persistir estado se configurado
    if (this.config.persistState) {
      this.saveState().catch(() => {});
    }

    return taskId;
  }

  /**
   * Adiciona múltiplas tarefas de uma vez
   */
  addTasks(
    tasks: Array<{
      operation: VideoOperation;
      inputPath: string;
      outputPath: string;
      priority?: Priority;
      maxRetries?: number;
      metadata?: Record<string, unknown>;
    }>
  ): string[] {
    const taskIds: string[] = [];

    for (const taskConfig of tasks) {
      const taskId = this.addTask(
        taskConfig.operation,
        taskConfig.inputPath,
        taskConfig.outputPath,
        {
          priority: taskConfig.priority,
          maxRetries: taskConfig.maxRetries,
          metadata: taskConfig.metadata,
        }
      );
      taskIds.push(taskId);
    }

    this.emit('tasks:batch-added', { count: taskIds.length, taskIds });

    return taskIds;
  }

  /**
   * Cancela uma tarefa
   */
  cancelTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    // Não pode cancelar tarefas concluídas ou já canceladas
    if (task.status === 'completed' || task.status === 'cancelled') {
      return false;
    }

    // Remover da fila se estiver lá
    const queueIndex = this.queue.indexOf(taskId);
    if (queueIndex !== -1) {
      this.queue.splice(queueIndex, 1);
    }

    task.status = 'cancelled';
    task.completedAt = new Date();

    this.emit('task:cancelled', task);
    this.updateStatistics();

    return true;
  }

  /**
   * Remove uma tarefa completamente
   */
  removeTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    // Cancelar se ainda ativa
    if (task.status !== 'completed' && task.status !== 'failed' && task.status !== 'cancelled') {
      this.cancelTask(taskId);
    }

    this.tasks.delete(taskId);
    this.emit('task:removed', { taskId });
    this.updateStatistics();

    return true;
  }

  /**
   * Limpa todas as tarefas concluídas/canceladas/falhadas
   */
  clearCompletedTasks(): number {
    let count = 0;

    for (const [taskId, task] of this.tasks.entries()) {
      if (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') {
        this.tasks.delete(taskId);
        count++;
      }
    }

    this.emit('tasks:cleared', { count });
    this.updateStatistics();

    return count;
  }

  /**
   * Obtém uma tarefa
   */
  getTask(taskId: string): BatchTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Obtém todas as tarefas
   */
  getAllTasks(): BatchTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Obtém tarefas por status
   */
  getTasksByStatus(status: TaskStatus): BatchTask[] {
    return Array.from(this.tasks.values()).filter((task) => task.status === status);
  }

  // ==========================================================================
  // QUEUE MANAGEMENT
  // ==========================================================================

  /**
   * Adiciona tarefa à fila com priorização
   */
  private enqueueTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status = 'queued';

    if (!this.config.priorityEnabled) {
      // Fila simples FIFO
      this.queue.push(taskId);
    } else {
      // Inserir com base na prioridade
      const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
      const taskPriority = priorityOrder[task.priority];

      let insertIndex = this.queue.length;
      for (let i = 0; i < this.queue.length; i++) {
        const queuedTask = this.tasks.get(this.queue[i])!;
        const queuedPriority = priorityOrder[queuedTask.priority];

        if (taskPriority < queuedPriority) {
          insertIndex = i;
          break;
        }
      }

      this.queue.splice(insertIndex, 0, taskId);
    }

    this.emit('task:queued', task);
    this.processQueue();
  }

  /**
   * Processa a fila
   */
  private async processQueue(): Promise<void> {
    if (!this.isRunning) return;

    // Processar até atingir limite de concorrência
    while (
      this.processing.size < this.config.maxConcurrent &&
      this.queue.length > 0
    ) {
      const taskId = this.queue.shift()!;
      this.processing.add(taskId);

      // Processar tarefa de forma assíncrona
      this.processTask(taskId).catch(() => {
        // Erro já tratado em processTask
      });
    }
  }

  // ==========================================================================
  // TASK PROCESSING
  // ==========================================================================

  /**
   * Processa uma tarefa individual
   */
  private async processTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      this.processing.delete(taskId);
      return;
    }

    try {
      task.status = 'processing';
      task.startedAt = new Date();

      this.emit('task:started', task);
      this.updateStatistics();

      // Obter handler para a operação
      const handler = this.handlers.get(task.operation);
      if (!handler) {
        throw new Error(`No handler registered for operation: ${task.operation}`);
      }

      // Executar com timeout
      const result = await this.executeWithTimeout(handler(task), this.config.timeout);

      // Sucesso
      task.status = 'completed';
      task.completedAt = new Date();
      task.processingTime = task.completedAt.getTime() - task.startedAt.getTime();
      task.result = result;

      this.processingTimes.push(task.processingTime);

      this.emit('task:completed', { task, result });
    } catch (error) {
      // Erro - tentar retry
      await this.handleTaskError(task, error as Error);
    } finally {
      this.processing.delete(taskId);
      this.updateStatistics();

      // Persistir estado
      if (this.config.persistState) {
        this.saveState().catch(() => {});
      }

      // Continuar processando fila
      this.processQueue();
    }
  }

  /**
   * Trata erro de tarefa e decide se faz retry
   */
  private async handleTaskError(task: BatchTask, error: Error): Promise<void> {
    task.error = error;
    task.retryCount++;

    // Verificar se deve fazer retry
    if (task.retryCount <= task.maxRetries) {
      task.status = 'retrying';

      const delay = this.calculateRetryDelay(task.retryCount);

      this.emit('task:retrying', {
        task,
        error,
        retryCount: task.retryCount,
        delay,
      });

      // Aguardar delay e reprocessar
      await this.sleep(delay);
      this.enqueueTask(task.id);
    } else {
      // Falhou definitivamente
      task.status = 'failed';
      task.completedAt = new Date();

      this.emit('task:failed', { task, error });
    }
  }

  /**
   * Calcula delay de retry baseado na estratégia
   */
  private calculateRetryDelay(retryCount: number): number {
    const baseDelay = this.config.retryDelay;

    switch (this.config.retryStrategy) {
      case 'exponential':
        return baseDelay * Math.pow(2, retryCount - 1);

      case 'linear':
        return baseDelay * retryCount;

      case 'fixed':
        return baseDelay;

      case 'none':
        return 0;

      default:
        return baseDelay;
    }
  }

  /**
   * Executa operação com timeout
   */
  private async executeWithTimeout<T>(
    promise: Promise<T>,
    timeout: number
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Task timeout')), timeout)
      ),
    ]);
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ==========================================================================
  // OPERATION HANDLERS
  // ==========================================================================

  /**
   * Registra um handler para um tipo de operação
   */
  registerHandler(operation: VideoOperation, handler: OperationHandler): void {
    this.handlers.set(operation, handler);
    this.emit('handler:registered', { operation });
  }

  /**
   * Remove um handler
   */
  unregisterHandler(operation: VideoOperation): boolean {
    const deleted = this.handlers.delete(operation);
    if (deleted) {
      this.emit('handler:unregistered', { operation });
    }
    return deleted;
  }

  /**
   * Verifica se há handler para operação
   */
  hasHandler(operation: VideoOperation): boolean {
    return this.handlers.has(operation);
  }

  // ==========================================================================
  // PROCESSOR CONTROL
  // ==========================================================================

  /**
   * Inicia o processador
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.emit('processor:started');
    this.processQueue();
  }

  /**
   * Pausa o processador
   */
  pause(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    this.emit('processor:paused');
  }

  /**
   * Para o processador e cancela tarefas em processamento
   */
  async stop(): Promise<void> {
    this.pause();

    // Aguardar tarefas em processamento
    while (this.processing.size > 0) {
      await this.sleep(100);
    }

    this.emit('processor:stopped');
  }

  /**
   * Reseta o processador completamente
   */
  reset(): void {
    this.stop();
    this.tasks.clear();
    this.queue = [];
    this.processing.clear();
    this.processingTimes = [];
    this.nextTaskId = 1;
    this.updateStatistics();

    this.emit('processor:reset');
  }

  /**
   * Verifica se está rodando
   */
  isProcessing(): boolean {
    return this.isRunning;
  }

  // ==========================================================================
  // STATISTICS
  // ==========================================================================

  /**
   * Atualiza estatísticas
   */
  private updateStatistics(): void {
    const tasks = Array.from(this.tasks.values());

    this.statistics.total = tasks.length;
    this.statistics.pending = tasks.filter((t) => t.status === 'pending').length;
    this.statistics.queued = tasks.filter((t) => t.status === 'queued').length;
    this.statistics.processing = tasks.filter((t) => t.status === 'processing').length;
    this.statistics.completed = tasks.filter((t) => t.status === 'completed').length;
    this.statistics.failed = tasks.filter((t) => t.status === 'failed').length;
    this.statistics.cancelled = tasks.filter((t) => t.status === 'cancelled').length;

    // Taxa de sucesso
    const finished = this.statistics.completed + this.statistics.failed;
    this.statistics.successRate = finished > 0
      ? (this.statistics.completed / finished) * 100
      : 0;

    // Tempo médio de processamento
    if (this.processingTimes.length > 0) {
      const sum = this.processingTimes.reduce((a, b) => a + b, 0);
      this.statistics.averageProcessingTime = sum / this.processingTimes.length;
      this.statistics.totalProcessingTime = sum;
    }

    // Tempo estimado restante
    const remaining = this.statistics.queued + this.statistics.processing;
    if (remaining > 0 && this.statistics.averageProcessingTime > 0) {
      this.statistics.estimatedTimeRemaining =
        (remaining / this.config.maxConcurrent) * this.statistics.averageProcessingTime;
    } else {
      this.statistics.estimatedTimeRemaining = 0;
    }

    this.emit('statistics:updated', this.statistics);
  }

  /**
   * Obtém estatísticas atuais
   */
  getStatistics(): BatchStatistics {
    return { ...this.statistics };
  }

  /**
   * Obtém progresso geral (0-100)
   */
  getOverallProgress(): number {
    if (this.statistics.total === 0) return 0;

    const weighted =
      this.statistics.completed * 100 +
      this.statistics.processing * 50 +
      this.statistics.failed * 100 +
      this.statistics.cancelled * 100;

    return Math.min(100, weighted / this.statistics.total);
  }

  // ==========================================================================
  // STATE PERSISTENCE
  // ==========================================================================

  /**
   * Salva estado em disco
   */
  async saveState(): Promise<void> {
    if (!this.config.stateFilePath) {
      this.config.stateFilePath = './batch-processor-state.json';
    }

    const state = {
      tasks: Array.from(this.tasks.entries()),
      queue: this.queue,
      nextTaskId: this.nextTaskId,
      statistics: this.statistics,
      savedAt: new Date().toISOString(),
    };

    await fs.writeFile(
      this.config.stateFilePath,
      JSON.stringify(state, null, 2),
      'utf-8'
    );

    this.emit('state:saved', { path: this.config.stateFilePath });
  }

  /**
   * Carrega estado do disco
   */
  async loadState(): Promise<void> {
    if (!this.config.stateFilePath) {
      this.config.stateFilePath = './batch-processor-state.json';
    }

    try {
      const data = await fs.readFile(this.config.stateFilePath, 'utf-8');
      const state = JSON.parse(data);

      this.tasks = new Map(state.tasks);
      this.queue = state.queue;
      this.nextTaskId = state.nextTaskId;
      this.statistics = state.statistics;

      // Converter datas de string para Date
      for (const task of this.tasks.values()) {
        task.createdAt = new Date(task.createdAt);
        if (task.startedAt) task.startedAt = new Date(task.startedAt);
        if (task.completedAt) task.completedAt = new Date(task.completedAt);
      }

      this.emit('state:loaded', { path: this.config.stateFilePath });
      this.updateStatistics();
    } catch (error) {
      this.emit('state:load-error', { error });
      throw error;
    }
  }

  // ==========================================================================
  // CONFIGURATION
  // ==========================================================================

  /**
   * Obtém configuração atual
   */
  getConfig(): BatchProcessorConfig {
    return { ...this.config };
  }

  /**
   * Atualiza configuração
   */
  updateConfig(config: Partial<BatchProcessorConfig>): void {
    const oldMaxConcurrent = this.config.maxConcurrent;

    this.config = { ...this.config, ...config };

    // Se aumentou concorrência, processar mais tarefas
    if (this.config.maxConcurrent > oldMaxConcurrent && this.isRunning) {
      this.processQueue();
    }

    this.emit('config:updated', this.config);
  }
}

// ==========================================================================
// FACTORY FUNCTIONS
// ==========================================================================

/**
 * Cria processador básico
 */
export function createBasicBatchProcessor(): BatchProcessor {
  return new BatchProcessor({
    maxConcurrent: 3,
    retryStrategy: 'exponential',
    maxRetries: 3,
    timeout: 300000,
    autoStart: true,
    priorityEnabled: false,
  });
}

/**
 * Cria processador de alta performance
 */
export function createHighPerformanceProcessor(): BatchProcessor {
  return new BatchProcessor({
    maxConcurrent: 10,
    retryStrategy: 'exponential',
    maxRetries: 5,
    timeout: 600000,
    autoStart: true,
    priorityEnabled: true,
    persistState: true,
  });
}

/**
 * Cria processador para servidor
 */
export function createServerProcessor(): BatchProcessor {
  return new BatchProcessor({
    maxConcurrent: 5,
    retryStrategy: 'exponential',
    maxRetries: 3,
    timeout: 900000, // 15 minutos
    autoStart: false, // Start manualmente
    priorityEnabled: true,
    persistState: true,
    stateFilePath: './data/batch-processor-state.json',
  });
}

/**
 * Cria processador para desenvolvimento
 */
export function createDevelopmentProcessor(): BatchProcessor {
  return new BatchProcessor({
    maxConcurrent: 1, // Processar um por vez
    retryStrategy: 'fixed',
    maxRetries: 1,
    timeout: 60000,
    autoStart: true,
    priorityEnabled: false,
    persistState: false,
  });
}
