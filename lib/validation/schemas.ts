import { z } from 'zod';

export const SlideInputSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  order_index: z.number().int().nonnegative(),
});

export const VideoJobInputSchema = z.object({
  project_id: z.string().uuid(),
  slides: z.array(SlideInputSchema).min(1),
  tts_voice: z.string().optional(),
  quality: z.enum(['low', 'medium', 'high']).default('medium'),
});

export type SlideInput = z.infer<typeof SlideInputSchema>;
export type VideoJobInput = z.infer<typeof VideoJobInputSchema>;
