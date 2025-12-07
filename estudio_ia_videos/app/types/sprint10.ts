
/**
 * 🚀 Estúdio IA de Vídeos - Sprint 10 & 11
 * Definições de Tipos
 */

// Colaboração
export interface Room {
  id: string;
  name: string;
  participants: number;
  status: string;
  project: string;
  lastActivity: Date;
  creator: string;
}

export interface OnlineUser {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: string;
}

export interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: Date;
  type: 'message' | 'system';
}

export interface ProjectReview {
  id: string;
  project: string;
  reviewer: string;
  status: 'approved' | 'pending' | 'rejected' | 'under_review';
  rating?: number;
  comment: string;
  timestamp: Date;
}

// Gamificação
export interface UserStats {
  level: number;
  xp: number;
  xpToNext: number;
  streak: number;
  completedCourses: number;
  totalVideos: number;
  hoursWatched: number;
  rank: number;
  points: number;
}

export interface LeaderboardEntry {
  id: number;
  name: string;
  avatar: string;
  level: number;
  points: number;
  streak: number;
  badge: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt: Date | null;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  xp: number;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  type: 'weekly' | 'monthly' | 'special';
  progress: number;
  total: number;
  reward: string;
  timeLeft: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface BadgeItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earned: boolean;
}

// IA Generativa
export interface GeneratedAvatar {
  type: 'avatar';
  url: string;
  style: string;
  description: string;
  variations: Array<{
    id: number;
    url: string;
    style: string;
  }>;
}

export interface GeneratedScenario {
  type: 'scenario';
  url: string;
  environment: string;
  description: string;
  elements: string[];
  lighting: string;
}

export interface GeneratedScript {
  type: 'script';
  text: string;
  duration: string;
  tone: string;
  complexity: string;
}

export type GeneratedContent = GeneratedAvatar | GeneratedScenario | GeneratedScript;

// Analytics Comportamental
export interface BehavioralData {
  totalUsers: number;
  activeUsers: number;
  avgSessionTime: number;
  completionRate: number;
  dropoffRate: number;
  engagementScore: number;
  learningEffectiveness: number;
  satisfactionScore: number;
}

export interface HeatmapSection {
  section: string;
  interactions: number;
  avgTime: number;
  clicks: number;
  attention: number;
}

export interface EngagementMetrics {
  videoPlayRate: number;
  avgWatchTime: number;
  interactionRate: number;
  socialShares: number;
  bookmarks: number;
  notes: number;
  discussions: number;
  retakes: number;
}

export interface RiskPrediction {
  id: string;
  name: string;
  department: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  factors: string[];
  recommendation: string;
  lastActivity: string;
}

// Integrações
export interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  status: 'connected' | 'available' | 'error';
  features: string[];
  color: string;
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  status: 'active' | 'inactive';
  lastTriggered: Date;
  successRate: number;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  createdAt: Date;
  lastUsed: Date;
  requestCount: number;
}

// Automação Inteligente
export interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  type: string;
  status: 'active' | 'paused' | 'error';
  trigger: string;
  actions: string[];
  executionCount: number;
  successRate: number;
  lastExecution: Date;
}

export interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  steps: number;
  estimatedTime: string;
  icon: string;
  color: string;
}

export interface ScheduledTask {
  id: string;
  name: string;
  type: string;
  schedule: string;
  nextRun: Date;
  status: 'active' | 'inactive';
  lastRun: Date;
}

export interface NotificationItem {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

// Sprint 11 - Funcionalidades de Nova Geração

// Voice Cloning
export interface VoiceProfile {
  id: string;
  name: string;
  language: string;
  accent: string;
  gender: string;
  sampleCount: number;
  quality: number;
  status: 'training' | 'ready' | 'processing';
  createdAt: Date;
  lastUsed?: Date;
  useCount: number;
}

export interface CloningSample {
  id: string;
  name: string;
  duration: number;
  quality: 'excellent' | 'good' | 'poor';
  text: string;
  audioUrl: string;
  uploadedAt: Date;
}

// 3D Environments Advanced
export interface Environment3D {
  id: string;
  name: string;
  category: string;
  description: string;
  previewUrl: string;
  complexity: 'low' | 'medium' | 'high';
  renderTime: number;
  popularity: number;
  tags: string[];
  isCustom: boolean;
  createdAt: Date;
}

export interface SceneConfiguration {
  lighting: {
    type: string;
    intensity: number;
    color: string;
    shadows: boolean;
  };
  camera: {
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    fov: number;
  };
  environment: {
    skybox: string;
    fog: boolean;
    fogDensity: number;
  };
  materials: {
    quality: string;
    reflections: boolean;
    refractions: boolean;
  };
}

// Mobile Native PWA+
export interface PWAFeature {
  id: string;
  name: string;
  description: string;
  status: 'enabled' | 'disabled' | 'configuring';
  icon: string;
  category: string;
}

export interface OfflineContent {
  id: string;
  title: string;
  type: 'video' | 'document' | 'image';
  size: number;
  downloadedAt: Date;
  lastAccessed: Date;
  syncStatus: 'synced' | 'pending' | 'error';
}

export interface MobileStats {
  installationRate: number;
  offlineUsage: number;
  pushNotificationRate: number;
  averageSessionTime: number;
  retentionRate: number;
  crashRate: number;
}

// Blockchain Certificates
export interface BlockchainCertificate {
  id: string;
  studentName: string;
  courseName: string;
  completionDate: Date;
  blockchainHash: string;
  contractAddress: string;
  tokenId: string;
  verificationUrl: string;
  ipfsHash: string;
  issuer: string;
  status: 'minted' | 'pending' | 'verified';
  validUntil?: Date;
  skills: string[];
  grade: number;
}

export interface BlockchainNetwork {
  id: string;
  name: string;
  symbol: string;
  rpcUrl: string;
  explorerUrl: string;
  gasPrice: number;
  isTestnet: boolean;
  status: 'active' | 'maintenance';
}

export interface VerificationLog {
  id: string;
  certificateId: string;
  verifierName: string;
  verificationDate: Date;
  result: 'valid' | 'invalid' | 'expired';
  verifierAddress: string;
}

// IA Avançada
export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  capabilities: string[];
  maxTokens: number;
  costPerToken: number;
  responseTime: number;
  accuracy: number;
  status: 'active' | 'maintenance' | 'beta';
}

export interface GenerationRequest {
  id: string;
  type: 'script' | 'content' | 'quiz' | 'summary';
  model: string;
  prompt: string;
  result: string;
  tokens: number;
  cost: number;
  duration: number;
  quality: number;
  createdAt: Date;
}

export interface AIAnalytics {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  averageQuality: number;
  averageResponseTime: number;
  popularModels: { model: string; usage: number }[];
}
