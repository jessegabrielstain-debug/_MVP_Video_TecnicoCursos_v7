/**
 * Schemas de Validação Zod
 * 
 * Schemas reutilizáveis com mensagens de erro em português
 * Use com react-hook-form + @hookform/resolvers/zod
 * 
 * Exemplo:
 * import { projectSchema } from '@/lib/validations'
 * const form = useForm({ resolver: zodResolver(projectSchema) })
 */

import { z } from 'zod'

// =============================================================================
// MENSAGENS DE ERRO PADRÃO
// =============================================================================

export const VALIDATION_MESSAGES = {
  required: 'Este campo é obrigatório',
  email: 'Digite um e-mail válido',
  minLength: (min: number) => `Mínimo de ${min} caracteres`,
  maxLength: (max: number) => `Máximo de ${max} caracteres`,
  min: (min: number) => `Valor mínimo: ${min}`,
  max: (max: number) => `Valor máximo: ${max}`,
  url: 'Digite uma URL válida',
  date: 'Digite uma data válida',
  positive: 'O valor deve ser positivo',
  integer: 'Digite um número inteiro',
  password: {
    min: 'A senha deve ter pelo menos 8 caracteres',
    uppercase: 'A senha deve conter pelo menos uma letra maiúscula',
    lowercase: 'A senha deve conter pelo menos uma letra minúscula',
    number: 'A senha deve conter pelo menos um número',
    special: 'A senha deve conter pelo menos um caractere especial',
  },
} as const

// =============================================================================
// SCHEMAS PRIMITIVOS REUTILIZÁVEIS
// =============================================================================

/** Email válido */
export const emailSchema = z
  .string({ required_error: VALIDATION_MESSAGES.required })
  .min(1, VALIDATION_MESSAGES.required)
  .email(VALIDATION_MESSAGES.email)
  .max(255, VALIDATION_MESSAGES.maxLength(255))

/** Senha forte */
export const passwordSchema = z
  .string({ required_error: VALIDATION_MESSAGES.required })
  .min(8, VALIDATION_MESSAGES.password.min)
  .regex(/[A-Z]/, VALIDATION_MESSAGES.password.uppercase)
  .regex(/[a-z]/, VALIDATION_MESSAGES.password.lowercase)
  .regex(/[0-9]/, VALIDATION_MESSAGES.password.number)

/** Senha simples (apenas mínimo) */
export const simplePasswordSchema = z
  .string({ required_error: VALIDATION_MESSAGES.required })
  .min(6, VALIDATION_MESSAGES.minLength(6))

/** Nome de pessoa */
export const nameSchema = z
  .string({ required_error: VALIDATION_MESSAGES.required })
  .min(2, VALIDATION_MESSAGES.minLength(2))
  .max(100, VALIDATION_MESSAGES.maxLength(100))
  .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Nome deve conter apenas letras')

/** Título genérico */
export const titleSchema = z
  .string({ required_error: VALIDATION_MESSAGES.required })
  .min(1, VALIDATION_MESSAGES.required)
  .max(200, VALIDATION_MESSAGES.maxLength(200))
  .transform((val) => val.trim())

/** Descrição/texto longo opcional */
export const descriptionSchema = z
  .string()
  .max(5000, VALIDATION_MESSAGES.maxLength(5000))
  .optional()
  .transform((val) => val?.trim() || undefined)

/** URL válida */
export const urlSchema = z
  .string()
  .url(VALIDATION_MESSAGES.url)
  .optional()
  .or(z.literal(''))

/** UUID */
export const uuidSchema = z
  .string()
  .uuid('ID inválido')

/** Número positivo */
export const positiveNumberSchema = z
  .number({ invalid_type_error: 'Digite um número válido' })
  .positive(VALIDATION_MESSAGES.positive)

/** Número inteiro positivo */
export const positiveIntSchema = z
  .number({ invalid_type_error: 'Digite um número válido' })
  .int(VALIDATION_MESSAGES.integer)
  .positive(VALIDATION_MESSAGES.positive)

// =============================================================================
// SCHEMAS DE AUTENTICAÇÃO
// =============================================================================

/** Login */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, VALIDATION_MESSAGES.required),
})
export type LoginInput = z.infer<typeof loginSchema>

/** Registro */
export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, VALIDATION_MESSAGES.required),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})
export type RegisterInput = z.infer<typeof registerSchema>

/** Reset de senha */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
})
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

/** Nova senha */
export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string().min(1, VALIDATION_MESSAGES.required),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

// =============================================================================
// SCHEMAS DE PROJETO
// =============================================================================

/** Criar/editar projeto */
export const projectSchema = z.object({
  name: titleSchema,
  description: descriptionSchema,
  template_id: z.string().optional(),
  settings: z.object({
    resolution: z.enum(['720p', '1080p', '4k']).default('1080p'),
    fps: z.number().min(24).max(60).default(30),
    aspect_ratio: z.enum(['16:9', '9:16', '1:1', '4:3']).default('16:9'),
  }).optional(),
})
export type ProjectInput = z.infer<typeof projectSchema>

/** Slide */
export const slideSchema = z.object({
  title: titleSchema.optional(),
  content: z.string().optional(),
  duration: z.number().min(1).max(300).default(5),
  order_index: positiveIntSchema,
  background_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida').optional(),
  background_image: urlSchema,
  elements: z.array(z.any()).optional(), // Flexível para elementos do editor
})
export type SlideInput = z.infer<typeof slideSchema>

// =============================================================================
// SCHEMAS DE AVATAR / TTS
// =============================================================================

/** Configuração de avatar */
export const avatarConfigSchema = z.object({
  avatar_id: z.string().min(1, 'Selecione um avatar'),
  voice_id: z.string().min(1, 'Selecione uma voz'),
  script: z.string().min(10, 'O script deve ter pelo menos 10 caracteres').max(5000),
  language: z.enum(['pt-BR', 'en-US', 'es-ES']).default('pt-BR'),
  emotion: z.enum(['neutral', 'happy', 'sad', 'angry', 'surprised']).default('neutral'),
})
export type AvatarConfigInput = z.infer<typeof avatarConfigSchema>

/** Texto para TTS */
export const ttsSchema = z.object({
  text: z.string().min(1, 'Digite o texto para narração').max(5000),
  voice_id: z.string().min(1, 'Selecione uma voz'),
  speed: z.number().min(0.5).max(2).default(1),
  pitch: z.number().min(0.5).max(2).default(1),
})
export type TTSInput = z.infer<typeof ttsSchema>

// =============================================================================
// SCHEMAS DE RENDER / EXPORT
// =============================================================================

/** Configuração de render */
export const renderConfigSchema = z.object({
  project_id: uuidSchema,
  quality: z.enum(['draft', 'preview', 'production']).default('preview'),
  format: z.enum(['mp4', 'webm', 'gif']).default('mp4'),
  resolution: z.enum(['720p', '1080p', '4k']).default('1080p'),
  fps: z.number().min(15).max(60).default(30),
  include_audio: z.boolean().default(true),
  include_watermark: z.boolean().default(false),
})
export type RenderConfigInput = z.infer<typeof renderConfigSchema>

// =============================================================================
// SCHEMAS DE COMENTÁRIOS / COLABORAÇÃO
// =============================================================================

/** Comentário */
export const commentSchema = z.object({
  content: z.string().min(1, 'Digite seu comentário').max(2000),
  timestamp: z.number().optional(), // Timestamp do vídeo
  parent_id: uuidSchema.optional(),
})
export type CommentInput = z.infer<typeof commentSchema>

// =============================================================================
// SCHEMAS DE CONFIGURAÇÕES
// =============================================================================

/** Perfil do usuário */
export const profileSchema = z.object({
  name: nameSchema,
  avatar_url: urlSchema,
  bio: z.string().max(500).optional(),
  company: z.string().max(100).optional(),
  role: z.string().max(50).optional(),
})
export type ProfileInput = z.infer<typeof profileSchema>

/** Configurações de notificação */
export const notificationSettingsSchema = z.object({
  email_on_render_complete: z.boolean().default(true),
  email_on_comment: z.boolean().default(true),
  email_marketing: z.boolean().default(false),
  push_enabled: z.boolean().default(true),
})
export type NotificationSettingsInput = z.infer<typeof notificationSettingsSchema>

// =============================================================================
// HELPERS DE VALIDAÇÃO
// =============================================================================

/**
 * Valida dados contra um schema e retorna resultado tipado
 */
export function validateData<T extends z.ZodSchema>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, errors: result.error }
}

/**
 * Extrai mensagens de erro de um ZodError para exibição
 */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {}
  error.errors.forEach((err) => {
    const path = err.path.join('.')
    errors[path] = err.message
  })
  return errors
}

/**
 * Obtém a primeira mensagem de erro
 */
export function getFirstZodError(error: z.ZodError): string {
  return error.errors[0]?.message || 'Dados inválidos'
}
