/**
 * Supabase yapilandirmasi ve mod secimi.
 *
 * Prototip varsayilan olarak DEMO modunda calisir: hicbir dis servise
 * baglanmaz, veriler sentetik seed'den uretilir. Bu, yarisma demosunun
 * internet veya servis kesintisine dayanikli olmasi icin bilincli bir
 * karardir (PROJECT_SPEC 15.4).
 *
 * DEMO_MODE=false yapildiginda Supabase ortam degiskenleri zorunlu hale gelir.
 */

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function isDemoMode(): boolean {
  // Acikca "false" yazilmadikca demo modundayiz.
  return process.env.DEMO_MODE !== 'false';
}

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

/**
 * DEMO_MODE=false iken eksik yapilandirmayi sessizce gecistirmek yerine
 * acikca hata veriyoruz; sessiz basarisizlik demoda en kotu sonucu verir.
 */
export function requireSupabaseConfig(): SupabaseConfig {
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error(
      'DEMO_MODE=false ayarlandı fakat NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY tanımlı değil. ' +
        '.env.local dosyasını kontrol edin.',
    );
  }
  return config;
}
