/**
 * Database Types
 * 
 * Type definitions for database queries and results.
 * Used to reduce `any` types in API routes that use Prisma raw queries.
 */

// User role query result
export interface UserRoleResult {
  role: string;
}

// Analytics event data
export interface AnalyticsEventRow {
  event_type: string;
  event_data: Record<string, unknown>;
  created_at: string;
  user_id?: string;
}

// User behavior analytics types
export interface UserActivityRow {
  hour: number;
  count: string | number;
}

export interface SessionDataRow {
  user_id: string;
  date: string;
  session_start: string;
  session_end: string;
  events: string | number;
  session_duration: string | number;
}

export interface PageViewRow {
  page: string;
  views: string | number;
}

export interface InteractionRow {
  action: string;
  count: string | number;
}

export interface NavigationFlowRow {
  from_page: string;
  to_page: string;
  transitions: string | number;
}

export interface EntryExitPageRow {
  page: string;
  entries?: string | number;
  exits?: string | number;
}

export interface UserRetentionRow {
  cohort_week: string;
  weeks_since_signup: number;
  retained_users: string | number;
  total_users: string | number;
  retention_rate: number;
}

export interface UserEngagementRow {
  user_id: string;
  total_events: string | number;
  unique_days: string | number;
  avg_daily_events: number;
  first_event: string;
  last_event: string;
}

export interface FeatureUsageRow {
  event_type: string;
  unique_users: string | number;
  total_usage: string | number;
}

export interface UserGrowthRow {
  date: string;
  new_users: string | number;
  cumulative_users: string | number;
}

export interface ConversionFunnelRow {
  step: string;
  users: string | number;
  rate: number;
}

export interface SegmentRow {
  segment: string;
  user_count: string | number;
  percentage: number;
}

// Render job statistics
export interface RenderStatsRow {
  status: string;
  count: string | number;
  avg_duration?: number;
}

// Generic query result helper
export type QueryResult<T> = T[];

// Supabase table type helper for dynamic table access
export type SupabaseTable = 
  | 'users'
  | 'projects'
  | 'slides'
  | 'render_jobs'
  | 'analytics_events'
  | 'roles'
  | 'permissions'
  | 'avatars_3d'
  | 'templates'
  | 'timelines'
  | 'pptx_uploads'
  | 'webhook_subscriptions'
  | 'webhook_deliveries'
  | 'nr_compliance_records'
  | 'nr_courses'
  | 'external_api_usage'
  | 'notifications';

// Avatar types
export interface Avatar3D {
  id: string;
  name: string;
  provider: 'heygen' | 'synthesia' | 'custom';
  avatar_id: string;
  thumbnail_url?: string;
  preview_url?: string;
  voice_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  last_used_at?: string;
  user_id?: string;
  project_id?: string;
  avatar_type?: 'full_body' | 'half_body' | 'head_only';
  gender?: 'male' | 'female' | 'other';
  style?: 'realistic' | 'cartoon' | 'anime';
  ready_player_me_url?: string;
  animations?: AvatarAnimation[];
  voice_settings?: AvatarVoiceSettings;
  properties?: Record<string, unknown>;
}

export interface AvatarAnimation {
  name: string;
  type: 'idle' | 'talking' | 'gesture' | 'emotion' | 'custom';
  duration: number;
  loop: boolean;
  file_url?: string;
}

export interface AvatarVoiceSettings {
  voice_id?: string;
  language: string;
  speed: number;
  pitch: number;
  volume: number;
}

// Avatar with project relation (from join query)
export interface Avatar3DWithProject extends Avatar3D {
  projects?: {
    id: string;
    name: string;
    owner_id: string;
    collaborators?: string[];
    is_public?: boolean;
  };
}

// Project history for avatar changes
export interface ProjectHistoryEntry {
  id: string;
  project_id: string;
  user_id: string;
  action: string;
  changes: Record<string, unknown>;
  created_at: string;
}

// Render settings stored in Supabase
export interface RenderSettings {
  id: string;
  user_id: string;
  settings: {
    quality?: 'low' | 'medium' | 'high' | 'ultra';
    codec?: string;
    fps?: number;
    resolution?: { width: number; height: number };
    bitrate?: number;
  };
  created_at: string;
  updated_at: string;
}

// Role types
export interface Role {
  role: string;
  description?: string;
}

// Permission types
export interface Permission {
  id: string;
  role: string;
  resource: string;
  action: string;
  conditions?: Record<string, unknown>;
}

// Retention analytics types
export interface RetentionCohortRow {
  cohort_date: string;
  total_users: string | number;
  day_1?: string | number;
  day_7?: string | number;
  day_30?: string | number;
}

export interface ActiveUsersRow {
  period: 'daily' | 'weekly' | 'monthly';
  count: string | number;
}

export interface UserAgentRow {
  ua: string;
  count: string | number;
}

// Funnel step count result
export interface FunnelStepRow {
  count: string | number;
}

// Render job with project relation
export interface RenderJobWithProject {
  id: string;
  project_id: string;
  status: 'pending' | 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  output_url?: string | null;
  error_message?: string | null;
  projects?: {
    user_id: string;
  } | null;
}

// BullMQ event data types
export interface RenderProgressData {
  progress: number;
  stage?: string;
  message?: string;
  currentSlide?: number;
  totalSlides?: number;
}

export interface RenderCompleteData {
  videoUrl?: string;
  duration?: number;
  fileSize?: number;
}

// BullMQ event callback types
export type BullMQProgressCallback = (args: { jobId: string; data: RenderProgressData }, id: string) => void;
export type BullMQCompletedCallback = (args: { jobId: string; returnvalue: RenderCompleteData }, id: string) => void;
export type BullMQFailedCallback = (args: { jobId: string; failedReason: string }, id: string) => void;

// Notification types
export interface NotificationRow {
  id: string;
  user_id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'render' | 'collaboration' | 'system';
  title: string;
  message: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'unread' | 'read' | 'archived';
  project_id?: string;
  metadata?: Record<string, unknown>;
  actions?: NotificationAction[];
  created_at: string;
  updated_at?: string;
  expires_at?: string;
  read_at?: string;
}

export interface NotificationAction {
  id: string;
  label: string;
  type: 'button' | 'link';
  action: string;
  url?: string;
  style?: 'primary' | 'secondary' | 'danger';
}

// Avatar 3D Gallery types
export interface Avatar3DGalleryItem {
  id: string;
  name: string;
  display_name?: string;
  type: string;
  quality: string;
  thumbnail_url?: string;
  preview_url?: string;
  audio2face_compatible?: boolean;
  category?: string;
  created_at: string;
}

// Voice clone types
export interface VoiceCloneRow {
  id: string;
  user_id: string;
  name: string;
  voice_id: string;
  provider: 'elevenlabs' | 'azure';
  samples?: string[];
  status: 'pending' | 'processing' | 'ready' | 'failed';
  created_at: string;
  updated_at?: string;
}

// Project version types
export interface ProjectVersionRow {
  id: string;
  project_id: string;
  version_number: number;
  changes?: string;
  snapshot?: Record<string, unknown>;
  created_at: string;
  created_by: string;
}
// =====================
// Timeline Types for JSON Fields
// =====================

/** Clip dentro de uma track de timeline */
export interface TimelineClip {
  id: string;
  type: 'video' | 'audio' | 'image' | 'text' | 'avatar' | 'subtitle';
  startTime: number;
  duration: number;
  endTime?: number;
  sourceUrl?: string;
  content?: string;
  trimStart?: number;
  trimEnd?: number;
  effects?: TimelineEffect[];
  transitions?: TimelineTransition;
  metadata?: Record<string, unknown>;
}

/** Efeito aplicado a um clip */
export interface TimelineEffect {
  id: string;
  type: 'fade' | 'blur' | 'color' | 'zoom' | 'pan' | 'custom';
  params?: Record<string, number | string | boolean>;
  startTime?: number;
  duration?: number;
}

/** Transição entre clips */
export interface TimelineTransition {
  type: 'cut' | 'crossfade' | 'dissolve' | 'wipe' | 'slide';
  duration?: number;
  params?: Record<string, unknown>;
}

/** Track individual na timeline */
export interface TimelineTrack {
  id: string;
  type: 'video' | 'audio' | 'text' | 'avatar' | 'subtitle';
  name?: string;
  clips: TimelineClip[];
  locked?: boolean;
  visible?: boolean;
  muted?: boolean;
  volume?: number;
  order?: number;
}

/** Configurações globais da timeline */
export interface TimelineSettings {
  fps?: number;
  resolution?: {
    width: number;
    height: number;
  };
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3';
  backgroundColor?: string;
  defaultTransition?: TimelineTransition;
  snapToGrid?: boolean;
  gridSize?: number;
  autoSave?: boolean;
}

/** Metadata de um template de timeline */
export interface TimelineTemplateMetadata {
  originalProjectId?: string;
  tracksCount?: number;
  version?: number;
  tags?: string[];
  thumbnail?: string;
  previewUrl?: string;
}

/** Tipo completo para Prisma JSON fields em Timeline */
export type TimelineTracks = TimelineTrack[];
export type TimelineSettingsJson = TimelineSettings;