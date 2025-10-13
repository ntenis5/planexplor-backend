import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function ngarkoFoto(fileBuffer: Buffer, emriSkedarit: string, folder: string = 'ads') {
  try {
    const { data, error } = await supabase.storage
      .from('foto')
      .upload(`${folder}/${emriSkedarit}`, fileBuffer, {
        contentType: 'image/jpeg'
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Gabim ngarkim foto:', error);
    return null;
  }
}

export async function ngarkoVideo(fileBuffer: Buffer, emriSkedarit: string, folder: string = 'ads') {
  try {
    const { data, error } = await supabase.storage
      .from('video')
      .upload(`${folder}/${emriSkedarit}`, fileBuffer, {
        contentType: 'video/mp4'
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Gabim ngarkim video:', error);
    return null;
  }
}

export function merrUrlFoto(emriSkedarit: string, folder: string = 'ads') {
  const { data } = supabase.storage
    .from('foto')
    .getPublicUrl(`${folder}/${emriSkedarit}`);
  
  return data.publicUrl;
}

export function merrUrlVideo(emriSkedarit: string, folder: string = 'ads') {
  const { data } = supabase.storage
    .from('video')
    .getPublicUrl(`${folder}/${emriSkedarit}`);
  
  return data.publicUrl;
}
