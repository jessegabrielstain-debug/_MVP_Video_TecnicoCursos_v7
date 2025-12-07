import { TimelineClip, TimelineState } from '@/types/timeline';

export interface VisualContinuityConfig {
  sceneChangeThreshold: number; // 0-1, sensitivity for detecting scene changes
  motionSmoothing: number; // milliseconds, smoothing window for motion analysis
  colorContinuityWeight: number; // 0-1, importance of color consistency
  motionContinuityWeight: number; // 0-1, importance of motion smoothness
  pacingMultiplier: number; // 0.5-2.0, speed adjustment factor
}

export interface SceneAnalysis {
  startTime: number;
  endTime: number;
  duration: number;
  sceneChangeScore: number; // 0-1, likelihood of scene change
  motionIntensity: number; // 0-1, average motion in scene
  colorVariance: number; // 0-1, color variation in scene
  keyFrames: Array<{
    time: number;
    importance: number;
    type: 'cut' | 'transition' | 'motion_peak' | 'color_change';
  }>;
}

export interface ContinuityRecommendation {
  type: 'cut_optimization' | 'transition_suggestion' | 'pacing_adjustment' | 'reorder_suggestion';
  description: string;
  confidence: number;
  parameters: {
    originalTime?: number;
    suggestedTime?: number;
    transitionType?: 'cut' | 'fade' | 'dissolve' | 'wipe';
    duration?: number;
    reason?: string;
  };
  affectedClips: string[];
}

export interface FlowMetrics {
  overallContinuity: number; // 0-1, overall visual flow quality
  pacingScore: number; // 0-1, rhythm and timing quality
  transitionScore: number; // 0-1, smoothness of transitions
  visualCoherence: number; // 0-1, consistency of visual elements
  engagementPrediction: number; // 0-1, predicted viewer engagement
}

export class VisualContinuityAnalyzer {
  private config: VisualContinuityConfig;
  private sceneCache: Map<string, SceneAnalysis>;
  private motionCache: Map<string, number[]>;

  constructor(config: VisualContinuityConfig) {
    this.config = config;
    this.sceneCache = new Map();
    this.motionCache = new Map();
  }

  /**
   * Analyze visual continuity across the entire timeline
   */
  async analyzeContinuity(state: TimelineState): Promise<{
    metrics: FlowMetrics;
    recommendations: ContinuityRecommendation[];
    sceneAnalysis: SceneAnalysis[];
  }> {
    const sceneAnalysis = await this.analyzeScenes(state);
    const metrics = await this.calculateMetrics(state, sceneAnalysis);
    const recommendations = await this.generateRecommendations(state, sceneAnalysis, metrics);

    return {
      metrics,
      recommendations,
      sceneAnalysis
    };
  }

  /**
   * Analyze individual scenes and detect visual changes
   */
  private async analyzeScenes(state: TimelineState): Promise<SceneAnalysis[]> {
    const scenes: SceneAnalysis[] = [];
    
    // Group clips by visual similarity and timing
    const visualGroups = this.groupClipsByVisualContinuity(state);
    
    for (const group of visualGroups) {
      const scene = await this.analyzeSceneGroup(group, state);
      scenes.push(scene);
    }

    return scenes;
  }

  /**
   * Group clips based on visual continuity criteria
   */
  private groupClipsByVisualContinuity(state: TimelineState): TimelineClip[][] {
    const groups: TimelineClip[][] = [];
    let currentGroup: TimelineClip[] = [];
    
    const sortedClips = [...state.clips].sort((a, b) => a.startTime - b.startTime);
    
    for (let i = 0; i < sortedClips.length; i++) {
      const clip = sortedClips[i];
      const nextClip = sortedClips[i + 1];
      
      currentGroup.push(clip);
      
      if (nextClip) {
        const continuityScore = this.calculateClipContinuity(clip, nextClip);
        
        // Start new group if continuity is low
        if (continuityScore < (1 - this.config.sceneChangeThreshold)) {
          groups.push([...currentGroup]);
          currentGroup = [];
        }
      }
    }
    
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }
    
    return groups;
  }

  /**
   * Calculate continuity score between two clips
   */
  private calculateClipContinuity(clip1: TimelineClip, clip2: TimelineClip): number {
    let score = 1.0;
    
    // Time gap penalty
    const timeGap = clip2.startTime - (clip1.startTime + clip1.duration);
    if (timeGap > 1000) { // More than 1 second gap
      score -= 0.3;
    }
    
    // Visual similarity (if metadata available)
    if (clip1.metadata?.visualHash && clip2.metadata?.visualHash) {
      const visualSimilarity = this.calculateVisualSimilarity(
        clip1.metadata.visualHash,
        clip2.metadata.visualHash
      );
      score += visualSimilarity * 0.4;
    }
    
    // Motion continuity (if available)
    if (clip1.metadata?.motionIntensity && clip2.metadata?.motionIntensity) {
      const motionContinuity = 1 - Math.abs(
        clip1.metadata.motionIntensity - clip2.metadata.motionIntensity
      );
      score += motionContinuity * this.config.motionContinuityWeight;
    }
    
    // Color continuity (if available)
    if (clip1.metadata?.colorPalette && clip2.metadata?.colorPalette) {
      const colorContinuity = this.calculateColorContinuity(
        clip1.metadata.colorPalette,
        clip2.metadata.colorPalette
      );
      score += colorContinuity * this.config.colorContinuityWeight;
    }
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Analyze a group of visually continuous clips as a scene
   */
  private async analyzeSceneGroup(group: TimelineClip[], state: TimelineState): Promise<SceneAnalysis> {
    const startTime = Math.min(...group.map(clip => clip.startTime));
    const endTime = Math.max(...group.map(clip => clip.startTime + clip.duration));
    const duration = endTime - startTime;
    
    // Calculate scene change score
    let sceneChangeScore = 0;
    if (group.length > 1) {
      for (let i = 1; i < group.length; i++) {
        const continuity = this.calculateClipContinuity(group[i-1], group[i]);
        sceneChangeScore += (1 - continuity);
      }
      sceneChangeScore /= (group.length - 1);
    }
    
    // Analyze motion intensity
    const motionIntensity = await this.calculateAverageMotionIntensity(group);
    
    // Analyze color variance
    const colorVariance = await this.calculateColorVariance(group);
    
    // Identify key frames
    const keyFrames = await this.identifyKeyFrames(group, state);
    
    return {
      startTime,
      endTime,
      duration,
      sceneChangeScore,
      motionIntensity,
      colorVariance,
      keyFrames
    };
  }

  /**
   * Calculate average motion intensity for a group of clips
   */
  private async calculateAverageMotionIntensity(group: TimelineClip[]): Promise<number> {
    let totalIntensity = 0;
    let count = 0;
    
    for (const clip of group) {
      if (clip.metadata?.motionIntensity) {
        totalIntensity += clip.metadata.motionIntensity;
        count++;
      }
      
      // If motion analysis is available in video file
      if (clip.mediaUrl) {
        const motionData = await this.analyzeMotionInVideo(clip.mediaUrl);
        if (motionData.length > 0) {
          const avgMotion = motionData.reduce((sum, val) => sum + val, 0) / motionData.length;
          totalIntensity += avgMotion;
          count++;
        }
      }
    }
    
    return count > 0 ? totalIntensity / count : 0.5;
  }

  /**
   * Analyze motion in video file (placeholder for actual implementation)
   */
  private async analyzeMotionInVideo(videoUrl: string): Promise<number[]> {
    // This would use FFmpeg or similar to analyze motion vectors
    // For now, return mock data based on video duration
    
    // Mock implementation - in real scenario, this would use:
    // - FFmpeg's 'mpdecimate' filter to detect motion
    // - Optical flow analysis
    // - Motion vector extraction
    
    const mockMotionData = [];
    const duration = 5; // Assume 5 second clips for mock
    const samples = duration * 10; // 10 samples per second
    
    for (let i = 0; i < samples; i++) {
      // Generate realistic motion pattern with some randomness
      const baseMotion = 0.3 + 0.4 * Math.sin(i * 0.1);
      const noise = (Math.random() - 0.5) * 0.2;
      mockMotionData.push(Math.max(0, Math.min(1, baseMotion + noise)));
    }
    
    return mockMotionData;
  }

  /**
   * Calculate color variance across clips
   */
  private async calculateColorVariance(group: TimelineClip[]): Promise<number> {
    if (group.length === 0) return 0;
    
    const colorData: number[][] = [];
    
    for (const clip of group) {
      if (clip.metadata?.colorPalette) {
        colorData.push(clip.metadata.colorPalette);
      }
    }
    
    if (colorData.length === 0) return 0.5;
    
    // Calculate variance in color space
    const variance = this.calculateColorSpaceVariance(colorData);
    return Math.min(1, variance);
  }

  /**
   * Calculate variance in color space
   */
  private calculateColorSpaceVariance(colorPalettes: number[][]): number {
    if (colorPalettes.length < 2) return 0;
    
    // Simplified color variance calculation
    let totalVariance = 0;
    const dimensions = colorPalettes[0].length;
    
    for (let dim = 0; dim < dimensions; dim++) {
      const values = colorPalettes.map(palette => palette[dim]);
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      totalVariance += variance;
    }
    
    return totalVariance / dimensions;
  }

  /**
   * Identify key frames within a scene
   */
  private async identifyKeyFrames(group: TimelineClip[], state: TimelineState): Promise<Array<{
    time: number;
    importance: number;
    type: 'cut' | 'transition' | 'motion_peak' | 'color_change';
  }>> {
    const keyFrames: Array<{
      time: number;
      importance: number;
      type: 'cut' | 'transition' | 'motion_peak' | 'color_change';
    }> = [];
    
    // Analyze each clip in the group
    for (const clip of group) {
      // Clip start is always a key frame
      keyFrames.push({
        time: clip.startTime,
        importance: 0.8,
        type: 'cut'
      });
      
      // Look for motion peaks
      if (clip.metadata?.motionIntensity) {
        const motionPeakTime = await this.findMotionPeakInClip(clip);
        if (motionPeakTime) {
          keyFrames.push({
            time: motionPeakTime,
            importance: clip.metadata.motionIntensity,
            type: 'motion_peak'
          });
        }
      }
      
      // Look for color changes
      if (clip.metadata?.colorTransitions) {
        for (const transition of clip.metadata.colorTransitions) {
          keyFrames.push({
            time: clip.startTime + transition.time,
            importance: transition.intensity,
            type: 'color_change'
          });
        }
      }
    }
    
    // Sort by time and remove duplicates
    return keyFrames
      .sort((a, b) => a.time - b.time)
      .filter((frame, index, arr) => 
        index === 0 || Math.abs(frame.time - arr[index - 1].time) > 100 // 100ms threshold
      );
  }

  /**
   * Find motion peak within a clip
   */
  private async findMotionPeakInClip(clip: TimelineClip): Promise<number | null> {
    if (!clip.mediaUrl) return null;
    
    const motionData = await this.analyzeMotionInVideo(clip.mediaUrl);
    if (motionData.length === 0) return null;
    
    let maxMotion = 0;
    let peakIndex = 0;
    
    for (let i = 0; i < motionData.length; i++) {
      if (motionData[i] > maxMotion) {
        maxMotion = motionData[i];
        peakIndex = i;
      }
    }
    
    // Convert sample index to time
    const peakTime = (peakIndex / motionData.length) * clip.duration;
    return clip.startTime + peakTime;
  }

  /**
   * Calculate visual similarity between two visual hashes
   */
  private calculateVisualSimilarity(hash1: string, hash2: string): number {
    // Simple Hamming distance for perceptual hashes
    if (hash1.length !== hash2.length) return 0;
    
    let differences = 0;
    for (let i = 0; i < hash1.length; i++) {
      if (hash1[i] !== hash2[i]) {
        differences++;
      }
    }
    
    return 1 - (differences / hash1.length);
  }

  /**
   * Calculate color continuity between palettes
   */
  private calculateColorContinuity(palette1: number[], palette2: number[]): number {
    if (palette1.length !== palette2.length) return 0;
    
    let similarity = 0;
    for (let i = 0; i < palette1.length; i++) {
      similarity += 1 - Math.abs(palette1[i] - palette2[i]);
    }
    
    return similarity / palette1.length;
  }

  /**
   * Calculate overall flow metrics
   */
  private async calculateMetrics(state: TimelineState, sceneAnalysis: SceneAnalysis[]): Promise<FlowMetrics> {
    // Calculate pacing score based on scene durations and transitions
    const pacingScore = this.calculatePacingScore(sceneAnalysis);
    
    // Calculate transition score based on smoothness between scenes
    const transitionScore = this.calculateTransitionScore(sceneAnalysis);
    
    // Calculate visual coherence across all clips
    const visualCoherence = this.calculateVisualCoherence(state);
    
    // Calculate overall continuity
    const overallContinuity = (pacingScore + transitionScore + visualCoherence) / 3;
    
    // Predict engagement based on pacing and visual variety
    const engagementPrediction = this.predictEngagement(sceneAnalysis);
    
    return {
      overallContinuity,
      pacingScore,
      transitionScore,
      visualCoherence,
      engagementPrediction
    };
  }

  /**
   * Calculate pacing score based on scene analysis
   */
  private calculatePacingScore(scenes: SceneAnalysis[]): number {
    if (scenes.length === 0) return 0;
    
    // Ideal scene duration distribution (varied but not erratic)
    const idealDurations = [2000, 3000, 4000, 2500, 3500]; // milliseconds
    const actualDurations = scenes.map(scene => scene.duration);
    
    // Calculate how well actual durations match ideal pattern
    let score = 0;
    for (let i = 0; i < Math.min(actualDurations.length, idealDurations.length); i++) {
      const ratio = Math.min(actualDurations[i], idealDurations[i]) / 
                   Math.max(actualDurations[i], idealDurations[i]);
      score += ratio;
    }
    
    return score / Math.min(actualDurations.length, idealDurations.length);
  }

  /**
   * Calculate transition score between scenes
   */
  private calculateTransitionScore(scenes: SceneAnalysis[]): number {
    if (scenes.length < 2) return 1;
    
    let totalScore = 0;
    
    for (let i = 1; i < scenes.length; i++) {
      const prevScene = scenes[i - 1];
      const currScene = scenes[i];
      
      // Score based on smooth transition indicators
      let transitionScore = 1;
      
      // Penalty for abrupt changes
      const motionChange = Math.abs(prevScene.motionIntensity - currScene.motionIntensity);
      transitionScore -= motionChange * 0.3;
      
      const sceneChange = currScene.sceneChangeScore;
      transitionScore -= sceneChange * 0.4;
      
      totalScore += Math.max(0, transitionScore);
    }
    
    return totalScore / (scenes.length - 1);
  }

  /**
   * Calculate visual coherence across the timeline
   */
  private calculateVisualCoherence(state: TimelineState): number {
    if (state.clips.length === 0) return 0;
    
    // Analyze visual consistency across all clips
    let totalCoherence = 0;
    let comparisons = 0;
    
    for (let i = 0; i < state.clips.length - 1; i++) {
      for (let j = i + 1; j < state.clips.length; j++) {
        const continuity = this.calculateClipContinuity(state.clips[i], state.clips[j]);
        totalCoherence += continuity;
        comparisons++;
      }
    }
    
    return comparisons > 0 ? totalCoherence / comparisons : 0;
  }

  /**
   * Predict viewer engagement based on pacing and visual variety
   */
  private predictEngagement(scenes: SceneAnalysis[]): number {
    if (scenes.length === 0) return 0;
    
    // Engagement factors
    const pacingVariety = this.calculatePacingVariety(scenes);
    const visualVariety = this.calculateVisualVariety(scenes);
    const motionEngagement = this.calculateMotionEngagement(scenes);
    
    // Weighted combination
    const engagement = (
      pacingVariety * 0.3 +
      visualVariety * 0.3 +
      motionEngagement * 0.4
    );
    
    return Math.max(0, Math.min(1, engagement));
  }

  /**
   * Calculate pacing variety score
   */
  private calculatePacingVariety(scenes: SceneAnalysis[]): number {
    if (scenes.length < 2) return 0.5;
    
    const durations = scenes.map(scene => scene.duration);
    const variance = this.calculateVariance(durations);
    const meanDuration = durations.reduce((sum, val) => sum + val, 0) / durations.length;
    
    // Normalize variance by mean
    const normalizedVariance = variance / (meanDuration * meanDuration);
    
    // Convert to 0-1 score (some variety is good, too much is bad)
    return Math.max(0, 1 - Math.abs(normalizedVariance - 0.3) * 3);
  }

  /**
   * Calculate visual variety score
   */
  private calculateVisualVariety(scenes: SceneAnalysis[]): number {
    if (scenes.length === 0) return 0;
    
    const colorVariances = scenes.map(scene => scene.colorVariance);
    const motionIntensities = scenes.map(scene => scene.motionIntensity);
    
    const colorVariety = this.calculateVariance(colorVariances) * 2; // Scale up
    const motionVariety = this.calculateVariance(motionIntensities) * 2;
    
    return Math.min(1, (colorVariety + motionVariety) / 2);
  }

  /**
   * Calculate motion engagement score
   */
  private calculateMotionEngagement(scenes: SceneAnalysis[]): number {
    if (scenes.length === 0) return 0;
    
    const motionIntensities = scenes.map(scene => scene.motionIntensity);
    const avgMotion = motionIntensities.reduce((sum, val) => sum + val, 0) / motionIntensities.length;
    const motionVariance = this.calculateVariance(motionIntensities);
    
    // Optimal motion: moderate average with some variation
    const avgScore = 1 - Math.abs(avgMotion - 0.6) * 2; // Optimal around 0.6
    const varianceScore = Math.min(1, motionVariance * 3);
    
    return Math.max(0, (avgScore + varianceScore) / 2);
  }

  /**
   * Calculate variance of an array
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return variance;
  }

  /**
   * Generate continuity recommendations
   */
  private async generateRecommendations(
    state: TimelineState, 
    sceneAnalysis: SceneAnalysis[], 
    metrics: FlowMetrics
  ): Promise<ContinuityRecommendation[]> {
    const recommendations: ContinuityRecommendation[] = [];
    
    // Pacing recommendations
    if (metrics.pacingScore < 0.7) {
      recommendations.push(...this.generatePacingRecommendations(sceneAnalysis));
    }
    
    // Transition recommendations
    if (metrics.transitionScore < 0.7) {
      recommendations.push(...this.generateTransitionRecommendations(sceneAnalysis));
    }
    
    // Visual coherence recommendations
    if (metrics.visualCoherence < 0.6) {
      recommendations.push(...this.generateCoherenceRecommendations(state, sceneAnalysis));
    }
    
    return recommendations;
  }

  /**
   * Generate pacing-related recommendations
   */
  private generatePacingRecommendations(scenes: SceneAnalysis[]): ContinuityRecommendation[] {
    const recommendations: ContinuityRecommendation[] = [];
    
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      
      // Recommend shorter scenes that are too long
      if (scene.duration > 8000) { // 8 seconds
        recommendations.push({
          type: 'pacing_adjustment',
          description: `Scene at ${this.formatTime(scene.startTime)} is too long (${this.formatTime(scene.duration)}), consider trimming`,
          confidence: Math.min(1, (scene.duration - 8000) / 5000),
          parameters: {
            originalTime: scene.endTime,
            suggestedTime: scene.startTime + 6000, // Trim to 6 seconds
            reason: 'Optimal scene duration for engagement'
          },
          affectedClips: [] // Would need to identify specific clips
        });
      }
      
      // Recommend longer scenes that are too short
      if (scene.duration < 1500) { // 1.5 seconds
        recommendations.push({
          type: 'pacing_adjustment',
          description: `Scene at ${this.formatTime(scene.startTime)} is too short (${this.formatTime(scene.duration)}), consider extending`,
          confidence: Math.min(1, (1500 - scene.duration) / 1000),
          parameters: {
            originalTime: scene.endTime,
            suggestedTime: scene.startTime + 2500, // Extend to 2.5 seconds
            reason: 'Minimum scene duration for comprehension'
          },
          affectedClips: []
        });
      }
    }
    
    return recommendations;
  }

  /**
   * Generate transition recommendations
   */
  private generateTransitionRecommendations(scenes: SceneAnalysis[]): ContinuityRecommendation[] {
    const recommendations: ContinuityRecommendation[] = [];
    
    for (let i = 1; i < scenes.length; i++) {
      const prevScene = scenes[i - 1];
      const currScene = scenes[i];
      
      const transitionScore = 1 - currScene.sceneChangeScore;
      
      if (transitionScore < 0.5) {
        // Abrupt transition detected
        recommendations.push({
          type: 'transition_suggestion',
          description: `Abrupt transition between scenes at ${this.formatTime(prevScene.endTime)} and ${this.formatTime(currScene.startTime)}`,
          confidence: 1 - transitionScore,
          parameters: {
            originalTime: prevScene.endTime,
            suggestedTime: prevScene.endTime,
            transitionType: this.suggestTransitionType(prevScene, currScene),
            duration: 500, // 500ms transition
            reason: 'Smooth jarring scene changes'
          },
          affectedClips: []
        });
      }
    }
    
    return recommendations;
  }

  /**
   * Suggest appropriate transition type
   */
  private suggestTransitionType(prevScene: SceneAnalysis, currScene: SceneAnalysis): 'fade' | 'dissolve' | 'wipe' | 'cut' {
    const motionDiff = Math.abs(prevScene.motionIntensity - currScene.motionIntensity);
    const colorDiff = Math.abs(prevScene.colorVariance - currScene.colorVariance);
    
    if (motionDiff > 0.4 || colorDiff > 0.4) {
      return 'dissolve'; // Smooth transition for large differences
    } else if (motionDiff > 0.2) {
      return 'fade'; // Gentle transition for moderate differences
    } else {
      return 'cut'; // Direct cut for similar scenes
    }
  }

  /**
   * Generate visual coherence recommendations
   */
  private generateCoherenceRecommendations(state: TimelineState, scenes: SceneAnalysis[]): ContinuityRecommendation[] {
    const recommendations: ContinuityRecommendation[] = [];
    
    // Analyze color consistency across scenes
    const colorVariances = scenes.map(scene => scene.colorVariance);
    const avgColorVariance = colorVariances.reduce((sum, val) => sum + val, 0) / colorVariances.length;
    
    if (avgColorVariance > 0.6) {
      recommendations.push({
        type: 'reorder_suggestion',
        description: 'High color variance across scenes suggests reordering for better visual flow',
        confidence: Math.min(1, (avgColorVariance - 0.6) * 2),
        parameters: {
          reason: 'Group similar color palettes for visual coherence'
        },
        affectedClips: state.clips.map(clip => clip.id)
      });
    }
    
    return recommendations;
  }

  /**
   * Format time for display
   */
  private formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const remainingMs = Math.floor((ms % 1000) / 10);
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}.${remainingMs.toString().padStart(2, '0')}`;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<VisualContinuityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.sceneCache.clear();
    this.motionCache.clear();
  }

  /**
   * Get current configuration
   */
  getConfig(): VisualContinuityConfig {
    return this.config;
  }
}