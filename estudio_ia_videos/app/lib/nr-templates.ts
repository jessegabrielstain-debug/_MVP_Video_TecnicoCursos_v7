import { Slide } from '@/lib/types';

export interface NRTemplate {
  id: string;
  nr: string;
  title: string;
  description: string;
  duration_minutes: number;
  slides: Slide[];
  certification_hours?: number;
  target_audience: string;
  keywords: string[];
  category: string;
}
