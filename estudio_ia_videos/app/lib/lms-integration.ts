export interface LMSMetadata {
  title: string;
  description: string;
  keywords: string[];
  difficulty: string;
  target_audience: string;
  learning_objectives: string[];
  prerequisites: string[];
  certification: {
    available: boolean;
    hours: number;
    authority: string;
  };
  duration_minutes?: number;
  identifier?: string;
  language?: string;
  typical_learning_time?: string;
}
