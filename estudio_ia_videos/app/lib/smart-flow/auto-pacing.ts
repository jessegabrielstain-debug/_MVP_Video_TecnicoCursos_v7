import { TimelineClip, TimelineState } from '@/types/timeline';
import { BeatDetectorService, Beat } from '@/lib/timeline/beat-detector';

export interface AutoPacingConfig {
  targetPacing: 'slow' | 'medium' | 'fast' | 'dynamic';
  beatSyncEnabled: boolean;
  motionSyncEnabled: boolean;
  emotionSyncEnabled: boolean;
  minClipDuration: number; // milliseconds
  maxClipDuration: number; // milliseconds
  transitionDuration: number; // milliseconds
  pacingCurve: 'linear' | 'ease_in' | 'ease_out' | 'ease_in_out' | 'custom';
}

export interface PacingAnalysis {
  currentPacing: number; // 0-1, overall pacing score
  beatAlignment: number; // 0-1, how well clips align with beats
  motionRhythm: number; // 0-1, motion-based rhythm quality
  emotionFlow: number; // 0-1, emotional continuity score
  energyCurve: number[]; // energy level at each time point
  optimalCuts: Array<{
    time: number;
    confidence: number;
    reason: 'beat' | 'motion' | 'emotion' | 'content';
  }>;
}

export interface PacingRecommendation {
  type: 'trim' | 'extend' | 'reorder' | 'add_transition' | 'adjust_speed';
  clipId: string;
  currentDuration: number;
  suggestedDuration: number;
  confidence: number;
  reason: string;
  parameters: {
    newStartTime?: number;
    newEndTime?: number;
    speedMultiplier?: number;
    transitionType?: string;
    beatAlignment?: number;
  };
}

export interface EmotionProfile {
  valence: number; // -1 to 1, negative to positive
  arousal: number; // 0 to 1, calm to excited
  dominance: number; // 0 to 1, submissive to dominant
  timestamps: Array<{
    time: number;
    valence: number;
    arousal: number;
    dominance: number;
  }>;
}

export class AutoPacingEngine {
  private config: AutoPacingConfig;
  private beatDetector: BeatDetectorService;
  private emotionProfiles: Map<string, EmotionProfile>;

  constructor(config: AutoPacingConfig) {
    this.config = config;
    this.beatDetector = new BeatDetectorService({
      sensitivity: 0.6,
      minConfidence: 0.4,
      maxBeatsPerMinute: 180,
      minBeatsPerMinute: 60
    });
    this.emotionProfiles = new Map();
  }

  /**
   * Analyze current pacing and rhythm of the timeline
   */
  async analyzePacing(state: TimelineState, audioUrl?: string): Promise<PacingAnalysis> {
    // Detect beats if audio is provided
    let beats: Beat[] = [];
    if (audioUrl) {
      beats = await this.beatDetector.detectBeats(audioUrl);
    }

    // Calculate current pacing metrics
    const currentPacing = this.calculateCurrentPacing(state);
    const beatAlignment = this.calculateBeatAlignment(state, beats);
    const motionRhythm = this.calculateMotionRhythm(state);
    const emotionFlow = this.calculateEmotionFlow(state);
    
    // Generate energy curve
    const energyCurve = this.generateEnergyCurve(state, beats);
    
    // Find optimal cut points
    const optimalCuts = this.findOptimalCuts(state, beats);

    return {
      currentPacing,
      beatAlignment,
      motionRhythm,
      emotionFlow,
      energyCurve,
      optimalCuts
    };
  }

  /**
   * Apply automatic pacing optimizations
   */
  async applyAutoPacing(state: TimelineState, audioUrl?: string): Promise<{
    newState: TimelineState;
    recommendations: PacingRecommendation[];
    analysis: PacingAnalysis;
  }> {
    const analysis = await this.analyzePacing(state, audioUrl);
    const recommendations = this.generatePacingRecommendations(state, analysis);
    const newState = this.applyRecommendations(state, recommendations);

    return {
      newState,
      recommendations,
      analysis
    };
  }

  /**
   * Calculate current pacing based on clip durations and transitions
   */
  private calculateCurrentPacing(state: TimelineState): number {
    if (state.clips.length === 0) return 0.5;

    const clipDurations = state.clips.map(clip => clip.duration);
    const avgDuration = clipDurations.reduce((sum, duration) => sum + duration, 0) / clipDurations.length;
    
    // Convert average duration to pacing score (shorter = faster pacing)
    let pacingScore;
    if (avgDuration < 2000) {
      pacingScore = 0.8; // Fast pacing
    } else if (avgDuration < 4000) {
      pacingScore = 0.6; // Medium pacing
    } else if (avgDuration < 8000) {
      pacingScore = 0.4; // Slow pacing
    } else {
      pacingScore = 0.2; // Very slow pacing
    }

    // Adjust based on target pacing
    switch (this.config.targetPacing) {
      case 'slow':
        return Math.min(1, pacingScore + 0.2);
      case 'fast':
        return Math.max(0, pacingScore - 0.2);
      case 'dynamic':
        return this.calculateDynamicPacing(state);
      default:
        return pacingScore;
    }
  }

  /**
   * Calculate dynamic pacing based on content analysis
   */
  private calculateDynamicPacing(state: TimelineState): number {
    // Analyze content complexity and emotional intensity
    const complexityScore = this.calculateContentComplexity(state);
    const emotionalIntensity = this.calculateEmotionalIntensity(state);
    
    // Dynamic pacing: complex/emotional content gets slower pacing
    const basePacing = 0.7;
    const complexityAdjustment = (1 - complexityScore) * 0.3;
    const emotionalAdjustment = emotionalIntensity * 0.2;
    
    return Math.max(0.2, Math.min(0.9, basePacing + complexityAdjustment + emotionalAdjustment));
  }

  /**
   * Calculate content complexity based on visual and audio features
   */
  private calculateContentComplexity(state: TimelineState): number {
    let complexityScore = 0.5; // Base complexity
    
    // Factor in number of clips (more clips = more complex)
    complexityScore += Math.min(0.3, state.clips.length / 20);
    
    // Factor in average motion intensity
    const avgMotionIntensity = state.clips.reduce((sum, clip) => {
      return sum + (clip.metadata?.motionIntensity || 0.5);
    }, 0) / state.clips.length;
    complexityScore += avgMotionIntensity * 0.2;
    
    // Factor in visual transitions and effects
    const effectsCount = state.clips.reduce((sum, clip) => {
      return sum + (clip.effects?.length || 0);
    }, 0);
    complexityScore += Math.min(0.2, effectsCount / 10);
    
    return Math.min(1, complexityScore);
  }

  /**
   * Calculate emotional intensity based on available emotion profiles
   */
  private calculateEmotionalIntensity(state: TimelineState): number {
    if (this.emotionProfiles.size === 0) return 0.5;
    
    let totalIntensity = 0;
    let count = 0;
    
    for (const [clipId, profile] of this.emotionProfiles) {
      const clip = state.clips.find(c => c.id === clipId);
      if (clip) {
        // Calculate emotional intensity from valence and arousal
        const intensity = Math.abs(profile.valence) * profile.arousal;
        totalIntensity += intensity;
        count++;
      }
    }
    
    return count > 0 ? totalIntensity / count : 0.5;
  }

  /**
   * Calculate how well clips align with detected beats
   */
  private calculateBeatAlignment(state: TimelineState, beats: Beat[]): number {
    if (beats.length === 0 || state.clips.length === 0) return 0;

    let totalAlignment = 0;
    let validClips = 0;

    for (const clip of state.clips) {
      // Find beats near clip boundaries
      const startBeat = this.findNearestBeat(clip.startTime, beats);
      const endBeat = this.findNearestBeat(clip.startTime + clip.duration, beats);
      
      if (startBeat && endBeat) {
        const startAlignment = 1 - (Math.abs(clip.startTime - startBeat.time) / 500); // 500ms tolerance
        const endAlignment = 1 - (Math.abs((clip.startTime + clip.duration) - endBeat.time) / 500);
        
        const clipAlignment = Math.max(0, (startAlignment + endAlignment) / 2);
        totalAlignment += clipAlignment;
        validClips++;
      }
    }

    return validClips > 0 ? totalAlignment / validClips : 0;
  }

  /**
   * Find the nearest beat to a given time
   */
  private findNearestBeat(time: number, beats: Beat[]): Beat | null {
    if (beats.length === 0) return null;

    let nearest = beats[0];
    let minDistance = Math.abs(time - nearest.time);

    for (const beat of beats) {
      const distance = Math.abs(time - beat.time);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = beat;
      }
    }

    return nearest;
  }

  /**
   * Calculate motion-based rhythm quality
   */
  private calculateMotionRhythm(state: TimelineState): number {
    if (state.clips.length === 0) return 0;

    const motionIntensities = state.clips.map(clip => 
      clip.metadata?.motionIntensity || 0.5
    );

    // Calculate rhythm based on motion intensity variations
    const rhythmScore = this.calculateRhythmFromPattern(motionIntensities);
    
    return rhythmScore;
  }

  /**
   * Calculate rhythm score from a pattern of values
   */
  private calculateRhythmFromPattern(values: number[]): number {
    if (values.length < 3) return 0.5;

    // Calculate variations and patterns
    const variations = [];
    for (let i = 1; i < values.length; i++) {
      variations.push(Math.abs(values[i] - values[i - 1]));
    }

    // Look for rhythmic patterns (alternating high/low)
    let patternScore = 0;
    for (let i = 2; i < variations.length; i++) {
      // Check for alternating pattern
      if ((variations[i] > 0.1 && variations[i - 1] < 0.05) ||
          (variations[i] < 0.05 && variations[i - 1] > 0.1)) {
        patternScore += 0.2;
      }
    }

    return Math.min(1, 0.3 + patternScore);
  }

  /**
   * Calculate emotional flow continuity
   */
  private calculateEmotionFlow(state: TimelineState): number {
    if (this.emotionProfiles.size === 0) return 0.5;

    let totalFlow = 0;
    let validTransitions = 0;

    for (let i = 0; i < state.clips.length - 1; i++) {
      const currentClip = state.clips[i];
      const nextClip = state.clips[i + 1];
      
      const currentProfile = this.emotionProfiles.get(currentClip.id);
      const nextProfile = this.emotionProfiles.get(nextClip.id);
      
      if (currentProfile && nextProfile) {
        // Calculate emotional continuity
        const valenceDiff = Math.abs(currentProfile.valence - nextProfile.valence);
        const arousalDiff = Math.abs(currentProfile.arousal - nextProfile.arousal);
        
        // Smoother transitions are better (lower difference = higher score)
        const flowScore = 1 - ((valenceDiff + arousalDiff) / 2);
        totalFlow += flowScore;
        validTransitions++;
      }
    }

    return validTransitions > 0 ? totalFlow / validTransitions : 0.5;
  }

  /**
   * Generate energy curve for the timeline
   */
  private generateEnergyCurve(state: TimelineState, beats: Beat[]): number[] {
    const duration = state.duration;
    const resolution = 100; // samples per second
    const numSamples = Math.floor(duration / 1000 * resolution);
    const energyCurve: number[] = new Array(numSamples).fill(0.5);

    // Add energy from beats
    if (beats.length > 0) {
      for (let i = 0; i < numSamples; i++) {
        const time = (i / numSamples) * duration;
        const nearbyBeats = beats.filter(beat => 
          Math.abs(beat.time - time) < 200 // 200ms window
        );
        
        if (nearbyBeats.length > 0) {
          const maxConfidence = Math.max(...nearbyBeats.map(beat => beat.confidence));
          energyCurve[i] = Math.max(energyCurve[i], 0.3 + maxConfidence * 0.7);
        }
      }
    }

    // Add energy from motion
    for (const clip of state.clips) {
      const motionIntensity = clip.metadata?.motionIntensity || 0.5;
      const startSample = Math.floor((clip.startTime / duration) * numSamples);
      const endSample = Math.floor(((clip.startTime + clip.duration) / duration) * numSamples);
      
      for (let i = startSample; i < endSample; i++) {
        if (i < numSamples) {
          energyCurve[i] = Math.max(energyCurve[i], motionIntensity);
        }
      }
    }

    // Add energy from emotion
    for (const [clipId, profile] of this.emotionProfiles) {
      const clip = state.clips.find(c => c.id === clipId);
      if (clip) {
        const emotionalEnergy = (Math.abs(profile.valence) + profile.arousal) / 2;
        const startSample = Math.floor((clip.startTime / duration) * numSamples);
        const endSample = Math.floor(((clip.startTime + clip.duration) / duration) * numSamples);
        
        for (let i = startSample; i < endSample; i++) {
          if (i < numSamples) {
            energyCurve[i] = Math.max(energyCurve[i], emotionalEnergy);
          }
        }
      }
    }

    // Smooth the curve
    return this.smoothCurve(energyCurve, 5);
  }

  /**
   * Smooth energy curve with moving average
   */
  private smoothCurve(curve: number[], windowSize: number): number[] {
    const smoothed: number[] = [];
    
    for (let i = 0; i < curve.length; i++) {
      let sum = 0;
      let count = 0;
      
      for (let j = Math.max(0, i - windowSize); j <= Math.min(curve.length - 1, i + windowSize); j++) {
        sum += curve[j];
        count++;
      }
      
      smoothed.push(sum / count);
    }
    
    return smoothed;
  }

  /**
   * Find optimal cut points based on beats, motion, and emotion
   */
  private findOptimalCuts(state: TimelineState, beats: Beat[]): Array<{
    time: number;
    confidence: number;
    reason: 'beat' | 'motion' | 'emotion' | 'content';
  }> {
    const optimalCuts: Array<{
      time: number;
      confidence: number;
      reason: 'beat' | 'motion' | 'emotion' | 'content';
    }> = [];

    // Analyze each potential cut point
    for (const clip of state.clips) {
      const cutCandidates = [
        { time: clip.startTime, reason: 'content' as const },
        { time: clip.startTime + clip.duration, reason: 'content' as const }
      ];

      for (const candidate of cutCandidates) {
        let confidence = 0.3; // Base confidence
        let primaryReason: 'beat' | 'motion' | 'emotion' | 'content' = 'content';

        // Check beat alignment
        if (beats.length > 0) {
          const nearestBeat = this.findNearestBeat(candidate.time, beats);
          if (nearestBeat && Math.abs(candidate.time - nearestBeat.time) < 200) {
            confidence += nearestBeat.confidence * 0.4;
            primaryReason = 'beat';
          }
        }

        // Check motion peaks
        const clipMotionIntensity = clip.metadata?.motionIntensity || 0;
        if (clipMotionIntensity > 0.7) {
          confidence += 0.2;
          if (primaryReason === 'content') primaryReason = 'motion';
        }

        // Check emotion transitions
        const profile = this.emotionProfiles.get(clip.id);
        if (profile) {
          const emotionalIntensity = (Math.abs(profile.valence) + profile.arousal) / 2;
          if (emotionalIntensity > 0.6) {
            confidence += 0.15;
            if (primaryReason === 'content') primaryReason = 'emotion';
          }
        }

        if (confidence > 0.5) {
          optimalCuts.push({
            time: candidate.time,
            confidence: Math.min(1, confidence),
            reason: primaryReason
          });
        }
      }
    }

    // Remove duplicates and sort
    return optimalCuts
      .filter((cut, index, arr) => 
        index === 0 || Math.abs(cut.time - arr[index - 1].time) > 500 // 500ms minimum gap
      )
      .sort((a, b) => a.time - b.time);
  }

  /**
   * Generate pacing recommendations based on analysis
   */
  private generatePacingRecommendations(state: TimelineState, analysis: PacingAnalysis): PacingRecommendation[] {
    const recommendations: PacingRecommendation[] = [];

    // Target pacing adjustments
    const targetPacingScore = this.getTargetPacingScore();
    const currentPacingScore = analysis.currentPacing;
    
    if (Math.abs(targetPacingScore - currentPacingScore) > 0.2) {
      recommendations.push(...this.generatePacingAdjustmentRecommendations(state, analysis));
    }

    // Beat alignment improvements
    if (analysis.beatAlignment < 0.7 && this.config.beatSyncEnabled) {
      recommendations.push(...this.generateBeatAlignmentRecommendations(state, analysis));
    }

    // Motion rhythm improvements
    if (analysis.motionRhythm < 0.6 && this.config.motionSyncEnabled) {
      recommendations.push(...this.generateMotionRhythmRecommendations(state, analysis));
    }

    // Emotion flow improvements
    if (analysis.emotionFlow < 0.6 && this.config.emotionSyncEnabled) {
      recommendations.push(...this.generateEmotionFlowRecommendations(state, analysis));
    }

    return recommendations;
  }

  /**
   * Get target pacing score based on config
   */
  private getTargetPacingScore(): number {
    switch (this.config.targetPacing) {
      case 'slow': return 0.3;
      case 'medium': return 0.5;
      case 'fast': return 0.8;
      case 'dynamic': return 0.6; // Variable, but this is average
      default: return 0.5;
    }
  }

  /**
   * Generate pacing adjustment recommendations
   */
  private generatePacingAdjustmentRecommendations(state: TimelineState, analysis: PacingAnalysis): PacingRecommendation[] {
    const recommendations: PacingRecommendation[] = [];
    const targetScore = this.getTargetPacingScore();
    
    // Adjust clip durations to achieve target pacing
    for (const clip of state.clips) {
      const currentDuration = clip.duration;
      let targetDuration = currentDuration;
      
      if (targetScore > analysis.currentPacing) {
        // Need faster pacing - shorten clips
        targetDuration = Math.max(this.config.minClipDuration, currentDuration * 0.8);
      } else {
        // Need slower pacing - extend clips
        targetDuration = Math.min(this.config.maxClipDuration, currentDuration * 1.2);
      }
      
      if (Math.abs(targetDuration - currentDuration) > 500) { // Significant change
        recommendations.push({
          type: 'trim',
          clipId: clip.id,
          currentDuration,
          suggestedDuration: targetDuration,
          confidence: Math.abs(targetScore - analysis.currentPacing),
          reason: `Adjust pacing from ${(analysis.currentPacing * 100).toFixed(0)}% to ${(targetScore * 100).toFixed(0)}%`,
          parameters: {
            newStartTime: clip.startTime,
            newEndTime: clip.startTime + targetDuration
          }
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate beat alignment recommendations
   */
  private generateBeatAlignmentRecommendations(state: TimelineState, analysis: PacingAnalysis): PacingRecommendation[] {
    const recommendations: PacingRecommendation[] = [];
    
    for (const cut of analysis.optimalCuts) {
      if (cut.reason === 'beat' && cut.confidence > 0.7) {
        recommendations.push({
          type: 'trim',
          clipId: 'multiple', // Would need to identify specific clips
          currentDuration: 0,
          suggestedDuration: cut.time,
          confidence: cut.confidence,
          reason: `Align cut with beat at ${this.formatTime(cut.time)}`,
          parameters: {
            beatAlignment: cut.confidence
          }
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate motion rhythm recommendations
   */
  private generateMotionRhythmRecommendations(state: TimelineState, analysis: PacingAnalysis): PacingRecommendation[] {
    const recommendations: PacingRecommendation[] = [];
    
    // Identify clips with poor motion rhythm
    for (const clip of state.clips) {
      const motionIntensity = clip.metadata?.motionIntensity || 0;
      
      if (motionIntensity < 0.3) {
        recommendations.push({
          type: 'adjust_speed',
          clipId: clip.id,
          currentDuration: clip.duration,
          suggestedDuration: clip.duration * 1.1, // Slightly slower
          confidence: 0.6,
          reason: 'Enhance motion rhythm by adjusting speed',
          parameters: {
            speedMultiplier: 0.9
          }
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate emotion flow recommendations
   */
  private generateEmotionFlowRecommendations(state: TimelineState, analysis: PacingAnalysis): PacingRecommendation[] {
    const recommendations: PacingRecommendation[] = [];
    
    // Add transitions for better emotional flow
    if (analysis.emotionFlow < 0.5) {
      for (let i = 0; i < state.clips.length - 1; i++) {
        const currentClip = state.clips[i];
        const nextClip = state.clips[i + 1];
        
        const currentProfile = this.emotionProfiles.get(currentClip.id);
        const nextProfile = this.emotionProfiles.get(nextClip.id);
        
        if (currentProfile && nextProfile) {
          const valenceDiff = Math.abs(currentProfile.valence - nextProfile.valence);
          
          if (valenceDiff > 0.5) {
            recommendations.push({
              type: 'add_transition',
              clipId: currentClip.id,
              currentDuration: currentClip.duration,
              suggestedDuration: currentClip.duration + this.config.transitionDuration,
              confidence: valenceDiff,
              reason: 'Smooth emotional transition',
              parameters: {
                transitionType: valenceDiff > 0.7 ? 'dissolve' : 'fade',
                newEndTime: currentClip.startTime + currentClip.duration + this.config.transitionDuration
              }
            });
          }
        }
      }
    }

    return recommendations;
  }

  /**
   * Apply recommendations to timeline state
   */
  private applyRecommendations(state: TimelineState, recommendations: PacingRecommendation[]): TimelineState {
    let newState = { ...state };
    
    for (const recommendation of recommendations) {
      newState = this.applyRecommendation(newState, recommendation);
    }
    
    return newState;
  }

  /**
   * Apply a single recommendation
   */
  private applyRecommendation(state: TimelineState, recommendation: PacingRecommendation): TimelineState {
    switch (recommendation.type) {
      case 'trim':
        return this.applyTrimRecommendation(state, recommendation);
      case 'extend':
        return this.applyExtendRecommendation(state, recommendation);
      case 'adjust_speed':
        return this.applySpeedAdjustmentRecommendation(state, recommendation);
      case 'add_transition':
        return this.applyTransitionRecommendation(state, recommendation);
      default:
        return state;
    }
  }

  /**
   * Apply trim recommendation
   */
  private applyTrimRecommendation(state: TimelineState, recommendation: PacingRecommendation): TimelineState {
    return {
      ...state,
      clips: state.clips.map(clip => 
        clip.id === recommendation.clipId
          ? { ...clip, duration: recommendation.suggestedDuration }
          : clip
      )
    };
  }

  /**
   * Apply extend recommendation
   */
  private applyExtendRecommendation(state: TimelineState, recommendation: PacingRecommendation): TimelineState {
    return {
      ...state,
      clips: state.clips.map(clip => 
        clip.id === recommendation.clipId
          ? { ...clip, duration: recommendation.suggestedDuration }
          : clip
      )
    };
  }

  /**
   * Apply speed adjustment recommendation
   */
  private applySpeedAdjustmentRecommendation(state: TimelineState, recommendation: PacingRecommendation): TimelineState {
    return {
      ...state,
      clips: state.clips.map(clip => 
        clip.id === recommendation.clipId
          ? { 
              ...clip, 
              duration: recommendation.suggestedDuration,
              metadata: {
                ...clip.metadata,
                speedMultiplier: recommendation.parameters.speedMultiplier
              }
            }
          : clip
      )
    };
  }

  /**
   * Apply transition recommendation
   */
  private applyTransitionRecommendation(state: TimelineState, recommendation: PacingRecommendation): TimelineState {
    // This would add transition effects to the clip
    // For now, just update the duration
    return this.applyExtendRecommendation(state, recommendation);
  }

  /**
   * Add emotion profile for a clip
   */
  addEmotionProfile(clipId: string, profile: EmotionProfile): void {
    this.emotionProfiles.set(clipId, profile);
  }

  /**
   * Remove emotion profile
   */
  removeEmotionProfile(clipId: string): void {
    this.emotionProfiles.delete(clipId);
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<AutoPacingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): AutoPacingConfig {
    return this.config;
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
}