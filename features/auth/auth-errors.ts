import type { AuthError } from '@supabase/supabase-js';

export function getAuthErrorMessage(error: AuthError | Error | unknown) {
  if (!(error instanceof Error)) return 'Beklenmeyen bir hata oluştu. Lütfen tekrar dene.';

  const message = error.message.toLowerCase();
  if (message.includes('email not confirmed')) return 'E-posta adresini doğrulaman gerekiyor.';
  if (message.includes('invalid login credentials')) return 'E-posta veya şifre hatalı.';
  if (message.includes('user already registered')) return 'Bu e-posta adresiyle daha önce üyelik oluşturulmuş.';
  if (message.includes('password')) return 'Şifren en az 8 karakter olmalı.';
  if (message.includes('network') || message.includes('fetch')) return 'Bağlantı kurulamadı. Lütfen tekrar dene.';
  if (message.includes('configuration')) return 'Supabase bağlantısı henüz yapılandırılmadı.';
  return 'İşlem tamamlanamadı. Lütfen bilgilerini kontrol edip tekrar dene.';
}
