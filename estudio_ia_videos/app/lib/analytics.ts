import { metricsSystem, MetricFilters } from './analytics-metrics-system';

export class Analytics {
  static async trackEvent(type: string, properties?: Record<string, unknown>) {
    return metricsSystem.trackEvent(type, properties);
  }

  static async getMetrics(filters: MetricFilters) {
    return metricsSystem.getMetrics(filters);
  }

  static track(event: string, properties?: Record<string, unknown>) {
    return this.trackEvent(event, properties);
  }

  static avatarSelected(avatarId: string, projectId: string) {
    return this.trackEvent('avatar_selected', { avatarId, projectId });
  }

  static voiceSelected(voiceId: string, language: string, projectId: string) {
    return this.trackEvent('voice_selected', { voiceId, language, projectId });
  }

  static editorStarted(projectId: string) {
    return this.trackEvent('editor_started', { projectId });
  }

  static pptxImportStarted(fileName: string, fileSize: number) {
    return this.trackEvent('pptx_import_started', { fileName, fileSize });
  }

  static pptxImportCompleted(fileName: string, slideCount: number, duration: number) {
    return this.trackEvent('pptx_import_completed', { fileName, slideCount, duration });
  }

  static pptxImportFailed(fileName: string, error: string, duration: number) {
    return this.trackEvent('pptx_import_failed', { fileName, error, duration });
  }
}
