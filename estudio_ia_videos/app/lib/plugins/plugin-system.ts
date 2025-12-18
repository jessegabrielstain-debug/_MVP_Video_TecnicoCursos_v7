/**
 * Plugin System
 * Sistema extensível de plugins para adicionar funcionalidades customizadas
 */

import { logger } from '@/lib/logger';
import { EventEmitter } from 'events';

// ==============================================
// TIPOS
// ==============================================

export interface Plugin {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  enabled: boolean;
  
  // Hooks do plugin
  hooks: {
    onInit?: () => Promise<void>;
    onDestroy?: () => Promise<void>;
    
    // Hooks de vídeo
    beforeRender?: (data: RenderData) => Promise<RenderData>;
    afterRender?: (data: RenderResult) => Promise<RenderResult>;
    
    // Hooks de PPTX
    beforePPTXProcess?: (data: PPTXData) => Promise<PPTXData>;
    afterPPTXProcess?: (data: ProcessedPPTX) => Promise<ProcessedPPTX>;
    
    // Hooks de TTS
    beforeTTS?: (data: TTSData) => Promise<TTSData>;
    afterTTS?: (data: TTSResult) => Promise<TTSResult>;
    
    // Hooks de export
    beforeExport?: (data: ExportData) => Promise<ExportData>;
    afterExport?: (data: ExportResult) => Promise<ExportResult>;
  };
  
  // Configuração do plugin
  config?: Record<string, unknown>;
}

export interface RenderData {
  projectId: string;
  slides: unknown[];
  settings: Record<string, unknown>;
}

export interface RenderResult {
  videoPath: string;
  duration: number;
  metadata: Record<string, unknown>;
}

export interface PPTXData {
  file: Buffer;
  filename: string;
}

export interface ProcessedPPTX {
  slides: unknown[];
  metadata: Record<string, unknown>;
}

export interface TTSData {
  text: string;
  voiceId: string;
  language: string;
}

export interface TTSResult {
  audio: Buffer;
  duration: number;
}

export interface ExportData {
  videoPath: string;
  format: string;
  quality: string;
}

export interface ExportResult {
  outputPath: string;
  fileSize: number;
}

// ==============================================
// PLUGIN SYSTEM
// ==============================================

export class PluginSystem extends EventEmitter {
  private plugins: Map<string, Plugin> = new Map();
  private enabledPlugins: Set<string> = new Set();

  /**
   * Registra um novo plugin
   */
  async register(plugin: Plugin): Promise<{ success: boolean; error?: string }> {
    try {
      if (this.plugins.has(plugin.id)) {
        return {
          success: false,
          error: `Plugin ${plugin.id} is already registered`
        };
      }

      this.plugins.set(plugin.id, plugin);

      if (plugin.enabled) {
        await this.enable(plugin.id);
      }

      logger.info('Plugin registered', {
        component: 'PluginSystem',
        pluginId: plugin.id,
        pluginName: plugin.name
      });

      this.emit('plugin:registered', plugin);

      return { success: true };
    } catch (error) {
      logger.error('Plugin registration error', error instanceof Error ? error : new Error(String(error)), {
        component: 'PluginSystem',
        pluginId: plugin.id
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Habilita um plugin
   */
  async enable(pluginId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const plugin = this.plugins.get(pluginId);
      if (!plugin) {
        return { success: false, error: 'Plugin not found' };
      }

      if (this.enabledPlugins.has(pluginId)) {
        return { success: true }; // Já habilitado
      }

      // Executar hook onInit se existir
      if (plugin.hooks.onInit) {
        await plugin.hooks.onInit();
      }

      this.enabledPlugins.add(pluginId);
      plugin.enabled = true;

      logger.info('Plugin enabled', {
        component: 'PluginSystem',
        pluginId
      });

      this.emit('plugin:enabled', plugin);

      return { success: true };
    } catch (error) {
      logger.error('Plugin enable error', error instanceof Error ? error : new Error(String(error)), {
        component: 'PluginSystem',
        pluginId
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Desabilita um plugin
   */
  async disable(pluginId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const plugin = this.plugins.get(pluginId);
      if (!plugin) {
        return { success: false, error: 'Plugin not found' };
      }

      if (!this.enabledPlugins.has(pluginId)) {
        return { success: true }; // Já desabilitado
      }

      // Executar hook onDestroy se existir
      if (plugin.hooks.onDestroy) {
        await plugin.hooks.onDestroy();
      }

      this.enabledPlugins.delete(pluginId);
      plugin.enabled = false;

      logger.info('Plugin disabled', {
        component: 'PluginSystem',
        pluginId
      });

      this.emit('plugin:disabled', plugin);

      return { success: true };
    } catch (error) {
      logger.error('Plugin disable error', error instanceof Error ? error : new Error(String(error)), {
        component: 'PluginSystem',
        pluginId
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Executa hook em todos os plugins habilitados
   */
  async executeHook<T>(hookName: keyof Plugin['hooks'], data: T): Promise<T> {
    let result = data;

    for (const pluginId of this.enabledPlugins) {
      const plugin = this.plugins.get(pluginId);
      if (!plugin) continue;

      const hook = plugin.hooks[hookName] as ((data: T) => Promise<T>) | undefined;
      if (hook) {
        try {
          result = await hook(result);
          logger.debug('Plugin hook executed', {
            component: 'PluginSystem',
            pluginId,
            hookName
          });
        } catch (error) {
          logger.error('Plugin hook error', error instanceof Error ? error : new Error(String(error)), {
            component: 'PluginSystem',
            pluginId,
            hookName
          });
          // Continuar mesmo se um plugin falhar
        }
      }
    }

    return result;
  }

  /**
   * Lista todos os plugins
   */
  listPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Lista plugins habilitados
   */
  listEnabledPlugins(): Plugin[] {
    return Array.from(this.plugins.values()).filter(p => p.enabled);
  }

  /**
   * Obtém plugin específico
   */
  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Atualiza configuração de um plugin
   */
  async updateConfig(pluginId: string, config: Record<string, unknown>): Promise<{ success: boolean; error?: string }> {
    try {
      const plugin = this.plugins.get(pluginId);
      if (!plugin) {
        return { success: false, error: 'Plugin not found' };
      }

      plugin.config = { ...plugin.config, ...config };

      logger.info('Plugin config updated', {
        component: 'PluginSystem',
        pluginId
      });

      this.emit('plugin:config-updated', plugin);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton
export const pluginSystem = new PluginSystem();

// ==============================================
// PLUGINS BUILT-IN
// ==============================================

/**
 * Plugin de exemplo: Watermark automático
 */
export const AutoWatermarkPlugin: Plugin = {
  id: 'auto-watermark',
  name: 'Auto Watermark',
  version: '1.0.0',
  author: 'Estúdio IA',
  description: 'Adiciona watermark automaticamente a todos os vídeos',
  enabled: false,
  config: {
    watermarkPath: '/assets/watermark.png',
    position: 'bottom-right',
    opacity: 0.7
  },
  hooks: {
    async beforeExport(data) {
      logger.info('Adding watermark', { component: 'AutoWatermarkPlugin' });
      // Lógica de watermark seria implementada aqui
      return data;
    }
  }
};

/**
 * Plugin de exemplo: Analytics Tracker
 */
export const AnalyticsTrackerPlugin: Plugin = {
  id: 'analytics-tracker',
  name: 'Analytics Tracker',
  version: '1.0.0',
  author: 'Estúdio IA',
  description: 'Rastreia eventos de renderização e export',
  enabled: false,
  config: {},
  hooks: {
    async afterRender(data) {
      logger.info('Tracking render event', { component: 'AnalyticsTrackerPlugin' });
      // Enviar evento para analytics
      return data;
    },
    async afterExport(data) {
      logger.info('Tracking export event', { component: 'AnalyticsTrackerPlugin' });
      // Enviar evento para analytics
      return data;
    }
  }
};

// Registrar plugins built-in (opcional)
if (process.env.AUTO_REGISTER_PLUGINS === 'true') {
  pluginSystem.register(AutoWatermarkPlugin);
  pluginSystem.register(AnalyticsTrackerPlugin);
}
