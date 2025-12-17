'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Logger } from '@/lib/logger';

const logger = new Logger('WorkflowAutomation');

export interface WorkflowTrigger {
  id: string;
  type: 'event' | 'schedule' | 'webhook' | 'manual' | 'condition';
  name: string;
  description?: string;
  config: {
    // Event triggers
    eventType?: 'element_added' | 'element_updated' | 'element_deleted' | 'project_saved' | 'user_action';
    elementType?: string;
    
    // Schedule triggers
    schedule?: {
      type: 'interval' | 'cron' | 'once';
      interval?: number; // milliseconds
      cronExpression?: string;
      executeAt?: Date;
    };
    
    // Webhook triggers
    webhook?: {
      url: string;
      method: 'GET' | 'POST' | 'PUT' | 'DELETE';
      headers?: Record<string, string>;
      authentication?: {
        type: 'none' | 'basic' | 'bearer' | 'api_key';
        credentials?: Record<string, string>;
      };
    };
    
    // Condition triggers
    condition?: {
      field: string;
      operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'starts_with' | 'ends_with';
      value: unknown;
      logicalOperator?: 'and' | 'or';
      conditions?: WorkflowCondition[];
    };
  };
  isActive: boolean;
  lastTriggered?: Date;
  triggerCount: number;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'starts_with' | 'ends_with';
  value: unknown;
}

export interface WorkflowAction {
  id: string;
  type: 'api_call' | 'email' | 'notification' | 'data_transform' | 'file_operation' | 'ai_process' | 'custom_script';
  name: string;
  description?: string;
  config: {
    // API Call actions
    apiCall?: {
      url: string;
      method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
      headers?: Record<string, string>;
      body?: Record<string, unknown> | string;
      authentication?: {
        type: 'none' | 'basic' | 'bearer' | 'api_key';
        credentials?: Record<string, string>;
      };
      retryPolicy?: {
        maxRetries: number;
        retryDelay: number;
        backoffMultiplier: number;
      };
    };
    
    // Email actions
    email?: {
      to: string[];
      cc?: string[];
      bcc?: string[];
      subject: string;
      body: string;
      isHtml: boolean;
      attachments?: {
        name: string;
        content: string;
        contentType: string;
      }[];
    };
    
    // Notification actions
    notification?: {
      type: 'info' | 'success' | 'warning' | 'error';
      title: string;
      message: string;
      recipients: string[];
      channels: ('in_app' | 'email' | 'sms' | 'push')[];
    };
    
    // Data Transform actions
    dataTransform?: {
      inputData: string; // JSON path or variable name
      transformScript: string; // JavaScript code
      outputVariable: string;
    };
    
    // File Operation actions
    fileOperation?: {
      operation: 'create' | 'read' | 'update' | 'delete' | 'copy' | 'move';
      sourcePath?: string;
      targetPath?: string;
      content?: string;
      encoding?: string;
    };
    
    // AI Process actions
    aiProcess?: {
      type: 'text_generation' | 'image_generation' | 'content_analysis' | 'translation' | 'summarization';
      model: string;
      prompt?: string;
      parameters?: Record<string, unknown>;
      outputVariable: string;
    };
    
    // Custom Script actions
    customScript?: {
      language: 'javascript' | 'python' | 'bash';
      code: string;
      timeout: number;
      environment?: Record<string, string>;
    };
  };
  order: number;
  isActive: boolean;
  continueOnError: boolean;
}

export interface WorkflowVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  value: unknown;
  description?: string;
  isGlobal: boolean;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  triggers: WorkflowTrigger[];
  actions: WorkflowAction[];
  variables: WorkflowVariable[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tags: string[];
  category: string;
  version: string;
  executionCount: number;
  lastExecuted?: Date;
  averageExecutionTime: number;
  successRate: number;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  triggerId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  triggerData: Record<string, unknown>;
  variables: Record<string, unknown>;
  actionResults: WorkflowActionResult[];
  error?: string;
  logs: WorkflowLog[];
}

export interface WorkflowActionResult {
  actionId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  input: unknown;
  output?: unknown;
  error?: string;
  retryCount: number;
}

export interface WorkflowLog {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: unknown;
  actionId?: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'executionCount' | 'lastExecuted' | 'averageExecutionTime' | 'successRate'>;
  isPublic: boolean;
  usageCount: number;
  rating: number;
  author: string;
}

export interface WorkflowStats {
  totalWorkflows: number;
  activeWorkflows: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  mostUsedWorkflows: { workflowId: string; name: string; count: number }[];
  recentExecutions: WorkflowExecution[];
  errorRate: number;
  performanceMetrics: {
    executionsPerDay: { date: string; count: number }[];
    executionTimeDistribution: { range: string; count: number }[];
    errorsByType: { type: string; count: number }[];
  };
}

type WebhookListener = {
  workflowId: string;
  triggerId: string;
  config: NonNullable<WorkflowTrigger['config']['webhook']>;
};

type ConditionGroup = {
  logicalOperator?: 'and' | 'or';
  conditions?: WorkflowCondition[];
}

export const useWorkflowAutomation = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<WorkflowStats | null>(null);
  
  const executionEngineRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const webhookListenersRef = useRef<Map<string, WebhookListener>>(new Map());

  // Load workflows and templates
  const loadWorkflows = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [workflowsResponse, templatesResponse] = await Promise.all([
        fetch('/api/workflows'),
        fetch('/api/workflows/templates')
      ]);

      if (!workflowsResponse.ok || !templatesResponse.ok) {
        throw new Error('Failed to load workflows');
      }

      const workflowsData = await workflowsResponse.json();
      const templatesData = await templatesResponse.json();

      setWorkflows(workflowsData);
      setTemplates(templatesData);

      // Initialize active workflows
      workflowsData.filter((w: Workflow) => w.isActive).forEach((workflow: Workflow) => {
        initializeWorkflow(workflow);
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workflows');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize workflow triggers
  const initializeWorkflow = useCallback((workflow: Workflow) => {
    workflow.triggers.forEach(trigger => {
      if (!trigger.isActive) return;

      switch (trigger.type) {
        case 'schedule':
          initializeScheduleTrigger(workflow.id, trigger);
          break;
        case 'webhook':
          initializeWebhookTrigger(workflow.id, trigger);
          break;
        case 'event':
          initializeEventTrigger(workflow.id, trigger);
          break;
      }
    });
  }, []);

  // Initialize schedule trigger
  const initializeScheduleTrigger = useCallback((workflowId: string, trigger: WorkflowTrigger) => {
    const schedule = trigger.config.schedule;
    if (!schedule) return;

    let timeout: NodeJS.Timeout;

    switch (schedule.type) {
      case 'interval':
        if (schedule.interval) {
          timeout = setInterval(() => {
            executeWorkflow(workflowId, trigger.id, {});
          }, schedule.interval);
        }
        break;
      
      case 'once':
        if (schedule.executeAt) {
          const delay = schedule.executeAt.getTime() - Date.now();
          if (delay > 0) {
            timeout = setTimeout(() => {
              executeWorkflow(workflowId, trigger.id, {});
            }, delay);
          }
        }
        break;
      
      case 'cron':
        // For cron expressions, you would typically use a library like node-cron
        // This is a simplified implementation
        if (schedule.cronExpression) {
          // Parse cron and set up recurring execution
          logger.debug('Cron trigger setup', { cronExpression: schedule.cronExpression });
        }
        break;
    }

    if (timeout!) {
      executionEngineRef.current.set(`${workflowId}_${trigger.id}`, timeout);
    }
  }, []);

  // Initialize webhook trigger
  const initializeWebhookTrigger = useCallback((workflowId: string, trigger: WorkflowTrigger) => {
    const webhook = trigger.config.webhook;
    if (!webhook) return;

    // Register webhook endpoint
    const webhookId = `${workflowId}_${trigger.id}`;
    webhookListenersRef.current.set(webhookId, {
      workflowId,
      triggerId: trigger.id,
      config: webhook
    });
  }, []);

  // Initialize event trigger
  const initializeEventTrigger = useCallback((workflowId: string, trigger: WorkflowTrigger) => {
    const eventType = trigger.config.eventType;
    if (!eventType) return;

    // Listen for custom events
    const handleEvent = (event: CustomEvent<Record<string, unknown>>) => {
      const shouldTrigger = evaluateConditions(trigger.config.condition, event.detail);
      if (shouldTrigger) {
        executeWorkflow(workflowId, trigger.id, event.detail);
      }
    };

    window.addEventListener(`workflow:${eventType}`, handleEvent as EventListener);
  }, []);

  // Evaluate workflow conditions
  const evaluateConditions = useCallback((condition: ConditionGroup | undefined, data: Record<string, unknown>): boolean => {
    if (!condition) return true;

    const { logicalOperator = 'and', conditions } = condition;

    if (!conditions || conditions.length === 0) {
      // If there's a single condition object without the 'conditions' array
      const singleCondition = condition as unknown as WorkflowCondition;
      if(singleCondition.field && singleCondition.operator) {
        return evaluateSingleCondition(singleCondition, data);
      }
      return true;
    }

    const results = conditions.map(cond => evaluateSingleCondition(cond, data));

    if (logicalOperator === 'or') {
      return results.some(res => res);
    }
    return results.every(res => res);
  }, []);

  const evaluateSingleCondition = (cond: WorkflowCondition, data: Record<string, unknown>): boolean => {
    const fieldValue = getNestedValue(data, cond.field);
    
    switch (cond.operator) {
      case 'equals':
        return fieldValue === cond.value;
      case 'not_equals':
        return fieldValue !== cond.value;
      case 'greater_than':
        return Number(fieldValue) > Number(cond.value);
      case 'less_than':
        return Number(fieldValue) < Number(cond.value);
      case 'contains':
        return String(fieldValue).includes(String(cond.value));
      case 'starts_with':
        return String(fieldValue).startsWith(String(cond.value));
      case 'ends_with':
        return String(fieldValue).endsWith(String(cond.value));
      default:
        return false;
    }
  };


  const getNestedValue = (obj: Record<string, unknown>, path: string): unknown => {
    return path.split('.').reduce((acc: unknown, part: string) => {
      if (acc && typeof acc === 'object' && acc !== null && part in acc) {
        return (acc as Record<string, unknown>)[part];
      }
      return undefined;
    }, obj);
  };

  const executeWorkflow = useCallback(async (workflowId: string, triggerId: string, triggerData: Record<string, unknown>) => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) {
      logger.error(`Workflow with id ${workflowId} not found.`);
      return;
    }

    const executionId = `exec_${Date.now()}`;
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId,
      triggerId,
      status: 'running',
      startTime: new Date(),
      triggerData,
      variables: workflow.variables.reduce((acc, v) => ({ ...acc, [v.name]: v.value }), {}),
      actionResults: [],
      logs: [{ id: `log_${Date.now()}`, timestamp: new Date(), level: 'info', message: `Workflow execution started for ${workflow.name}` }]
    };

    setExecutions(prev => [execution, ...prev]);

    let currentVariables = { ...execution.variables, trigger: triggerData };
    let shouldContinue = true;

    for (const action of workflow.actions.sort((a, b) => a.order - b.order)) {
      if (!shouldContinue || !action.isActive) continue;

      const actionResult: WorkflowActionResult = {
        actionId: action.id,
        status: 'running',
        startTime: new Date(),
        input: currentVariables,
        retryCount: 0,
      };

      try {
        let output: unknown;
        switch (action.type) {
          case 'api_call':
            output = await executeApiCall(action.config.apiCall, currentVariables);
            break;
          case 'email':
            output = await executeEmail(action.config.email, currentVariables);
            break;
          case 'notification':
            output = await executeNotification(action.config.notification, currentVariables);
            break;
          case 'data_transform':
            output = await executeDataTransform(action.config.dataTransform, currentVariables);
            break;
          case 'file_operation':
            output = await executeFileOperation(action.config.fileOperation, currentVariables);
            break;
          case 'ai_process':
            output = await executeAiProcess(action.config.aiProcess, currentVariables);
            break;
          case 'custom_script':
            output = await executeCustomScript(action.config.customScript, currentVariables);
            break;
          default:
            throw new Error(`Unsupported action type: ${(action as { type: string }).type}`);
        }
        
        actionResult.status = 'completed';
        actionResult.output = output;
        if (output && typeof output === 'object') {
          currentVariables = { ...currentVariables, ...output as Record<string, unknown> };
        }

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown action error';
        actionResult.status = 'failed';
        actionResult.error = errorMessage;
        execution.logs.push({ id: `log_${Date.now()}`, timestamp: new Date(), level: 'error', message: `Action ${action.name} failed: ${errorMessage}`, actionId: action.id });
        if (!action.continueOnError) {
          shouldContinue = false;
        }
      } finally {
        actionResult.endTime = new Date();
        actionResult.duration = actionResult.endTime.getTime() - actionResult.startTime.getTime();
        execution.actionResults.push(actionResult);
      }
    }

    execution.status = execution.actionResults.some(r => r.status === 'failed') ? 'failed' : 'completed';
    execution.endTime = new Date();
    execution.duration = execution.endTime.getTime() - execution.startTime.getTime();
    execution.logs.push({ id: `log_${Date.now()}`, timestamp: new Date(), level: 'info', message: `Workflow execution finished with status: ${execution.status}` });

    setExecutions(prev => prev.map(e => e.id === executionId ? execution : e));
  }, [workflows]);

  const interpolateString = (template: string, variables: Record<string, unknown>): string => {
    return template.replace(/\${{\s*([^}]+)\s*}}/g, (match, path) => {
      const value = getNestedValue(variables, path.trim());
      return value !== undefined ? String(value) : match;
    });
  };

  const executeApiCall = useCallback(async (config: WorkflowAction['config']['apiCall'], variables: Record<string, unknown>) => {
    if (!config) throw new Error("API call configuration is missing.");
    
    const url = interpolateString(config.url, variables);
    const body = config.body ? JSON.parse(interpolateString(JSON.stringify(config.body), variables)) : undefined;
    
    const response = await fetch(url, {
      method: config.method,
      headers: config.headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API call failed with status ${response.status}`);
    }
    return response.json();
  }, []);

  const executeEmail = useCallback(async (config: WorkflowAction['config']['email'], variables: Record<string, unknown>) => {
    if (!config) throw new Error("Email configuration is missing.");
    logger.info('Sending email', {
      to: config.to.map(recipient => interpolateString(recipient, variables)),
      subject: interpolateString(config.subject, variables),
    });
    // Mock implementation
    return { success: true, messageId: `mock_${Date.now()}` };
  }, []);

  const executeNotification = useCallback(async (config: WorkflowAction['config']['notification'], variables: Record<string, unknown>) => {
    if (!config) throw new Error("Notification configuration is missing.");
    logger.info('Sending notification', {
      title: interpolateString(config.title, variables),
      message: interpolateString(config.message, variables),
      recipients: config.recipients.map(r => interpolateString(r, variables)),
    });
    // Mock implementation
    return { success: true };
  }, []);

  const executeDataTransform = useCallback(async (config: WorkflowAction['config']['dataTransform'], variables: Record<string, unknown>) => {
    if (!config) throw new Error("Data transform configuration is missing.");
    
    const input = getNestedValue(variables, config.inputData);
    
    // WARNING: Executing arbitrary code is unsafe. Use a sandboxed environment in a real app.
    const transformFn = new Function('input', 'context', config.transformScript);
    const context = {
      variables,
      log: (...args: unknown[]) => logger.debug('[Workflow Transform]', { args })
    };
    
    const result = transformFn(input, context);
    
    return { [config.outputVariable]: result };
  }, []);

  const executeFileOperation = useCallback(async (config: WorkflowAction['config']['fileOperation'], variables: Record<string, unknown>) => {
    if (!config) throw new Error("File operation configuration is missing.");
    logger.info('Executing file operation', {
      operation: config.operation,
      source: config.sourcePath ? interpolateString(config.sourcePath, variables) : '',
      target: config.targetPath ? interpolateString(config.targetPath, variables) : '',
    });
    // Mock implementation
    return { success: true, path: config.targetPath };
  }, []);

  const executeAiProcess = useCallback(async (config: WorkflowAction['config']['aiProcess'], variables: Record<string, unknown>) => {
    if (!config) throw new Error("AI process configuration is missing.");
    const prompt = config.prompt ? interpolateString(config.prompt, variables) : '';
    logger.info('Executing AI process', { type: config.type, model: config.model, promptLength: prompt.length });
    // Mock implementation
    const result = `AI result for prompt: "${prompt}"`;
    return { [config.outputVariable]: result };
  }, []);

  const executeCustomScript = useCallback(async (config: WorkflowAction['config']['customScript'], variables: Record<string, unknown>) => {
    if (!config) throw new Error("Custom script configuration is missing.");
    logger.debug('Executing custom script', { language: config.language });
    // WARNING: Unsafe. Use a sandboxed environment.
    // Mock implementation
    return { success: true, output: 'Script executed successfully' };
  }, []);


  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  const createWorkflow = useCallback(async (workflowData: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt' | 'executionCount' | 'lastExecuted' | 'averageExecutionTime' | 'successRate'>) => {
    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflowData),
      });
      if (!response.ok) throw new Error('Failed to create workflow');
      const newWorkflow = await response.json();
      setWorkflows(prev => [...prev, newWorkflow]);
      initializeWorkflow(newWorkflow);
      return newWorkflow;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workflow');
      return null;
    }
  }, [initializeWorkflow]);

  const updateWorkflow = useCallback(async (workflowId: string, updates: Partial<Workflow>) => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update workflow');
      const updatedWorkflow = await response.json();
      setWorkflows(prev => prev.map(w => w.id === workflowId ? updatedWorkflow : w));
      // Re-initialize if triggers or active status changed
      initializeWorkflow(updatedWorkflow);
      return updatedWorkflow;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update workflow');
      return null;
    }
  }, [initializeWorkflow]);

  const deleteWorkflow = useCallback(async (workflowId: string) => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete workflow');
      setWorkflows(prev => prev.filter(w => w.id !== workflowId));
      // Teardown triggers
      const workflow = workflows.find(w => w.id === workflowId);
      workflow?.triggers.forEach(trigger => {
        const timeoutId = executionEngineRef.current.get(`${workflowId}_${trigger.id}`);
        if (timeoutId) {
          clearInterval(timeoutId);
          clearTimeout(timeoutId);
          executionEngineRef.current.delete(`${workflowId}_${trigger.id}`);
        }
      });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete workflow');
      return false;
    }
  }, [workflows]);

  const triggerWorkflow = useCallback(async (workflowId: string, triggerData: Record<string, unknown> = {}) => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) {
      logger.error(`Cannot trigger: workflow with id ${workflowId} not found.`);
      return;
    }
    const manualTrigger = workflow.triggers.find(t => t.type === 'manual' && t.isActive);
    if (!manualTrigger) {
      logger.error(`No active manual trigger found for workflow ${workflow.name}.`);
      return;
    }
    await executeWorkflow(workflowId, manualTrigger.id, triggerData);
  }, [workflows, executeWorkflow]);

  return {
    workflows,
    executions,
    templates,
    isLoading,
    error,
    stats,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    triggerWorkflow,
    executeWorkflow,
  };
};