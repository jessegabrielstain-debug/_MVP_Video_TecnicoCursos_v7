import { supabase } from './client';
import { v4 as uuidv4 } from 'uuid';

// Configuração de buckets
const VIDEOS_BUCKET = 'videos';
const THUMBNAILS_BUCKET = 'thumbnails';
const AVATARS_BUCKET = 'avatars';

// Função para inicializar os buckets (deve ser chamada durante a configuração)
export const initializeStorage = async () => {
  // Verificar e criar buckets se não existirem
  for (const bucket of [VIDEOS_BUCKET, THUMBNAILS_BUCKET, AVATARS_BUCKET]) {
    const { data, error } = await supabase.storage.getBucket(bucket);
    
    if (error && error.message.includes('The resource was not found')) {
      await supabase.storage.createBucket(bucket, {
        public: bucket === THUMBNAILS_BUCKET || bucket === AVATARS_BUCKET,
        fileSizeLimit: bucket === VIDEOS_BUCKET ? 1024 * 1024 * 500 : 1024 * 1024 * 10, // 500MB para vídeos, 10MB para outros
      });
    } else if (error) {
      console.error(`Erro ao verificar bucket ${bucket}:`, error);
    }
  }
};

// Upload de vídeo
export const uploadVideo = async (file: File, courseId: string) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${courseId}/${uuidv4()}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from(VIDEOS_BUCKET)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });
  
  if (error) throw error;
  
  // Retorna a URL pública do vídeo
  const { data: urlData } = await supabase.storage
    .from(VIDEOS_BUCKET)
    .createSignedUrl(fileName, 60 * 60 * 24 * 365); // URL válida por 1 ano
  
  return urlData?.signedUrl;
};

// Upload de thumbnail
export const uploadThumbnail = async (file: File, courseId: string) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${courseId}/${uuidv4()}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from(THUMBNAILS_BUCKET)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });
  
  if (error) throw error;
  
  // Retorna a URL pública da thumbnail
  const { data: publicUrl } = supabase.storage
    .from(THUMBNAILS_BUCKET)
    .getPublicUrl(fileName);
  
  return publicUrl.publicUrl;
};

// Upload de avatar
export const uploadAvatar = async (file: File, userId: string) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}.${fileExt}`;
  
  // Remove avatar anterior se existir
  await supabase.storage
    .from(AVATARS_BUCKET)
    .remove([fileName])
    .catch(() => {}); // Ignora erro se não existir
  
  const { data, error } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
    });
  
  if (error) throw error;
  
  // Retorna a URL pública do avatar
  const { data: publicUrl } = supabase.storage
    .from(AVATARS_BUCKET)
    .getPublicUrl(fileName);
  
  // Atualiza o perfil do usuário com a nova URL do avatar
  await supabase
    .from('users')
    .update({ avatar_url: publicUrl.publicUrl })
    .eq('id', userId);
  
  return publicUrl.publicUrl;
};

// Remover arquivo
export const removeFile = async (bucket: string, filePath: string) => {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([filePath]);
  
  if (error) throw error;
  return { success: true };
};