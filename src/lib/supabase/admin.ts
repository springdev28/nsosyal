import 'server-only';

import { createClient } from '@supabase/supabase-js';

import { requireSupabaseConfig } from './config';

/**
 * Service-role istemcisi.
 *
 * UYARI: Bu anahtar Row Level Security'yi TAMAMEN atlar.
 *
 * Kurallar (PROJECT_SPEC 9.4 / 11.3):
 *   1. Yalnizca sunucu tarafinda kullanilir. `import 'server-only'` bu dosyanin
 *      bir client bileseninden import edilmesini derleme zamaninda hata yapar.
 *   2. Ortam degiskeni NEXT_PUBLIC_ oneki TASIMAZ; aksi hâlde istemci paketine
 *      girerdi.
 *   3. Yalnizca kullanicinin kendi yetkisiyle yapamayacagi islemler icin
 *      kullanilir: bildirim uretme, moderasyon sonrasi topluluk olusturma,
 *      gazete yayini gibi sunucu sorumlulugundaki isler.
 *
 * Normal okuma/yazma icin createSupabaseServerClient() kullanilmalidir.
 */
export function createSupabaseAdminClient() {
  const { url } = requireSupabaseConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY tanımlı değil. Bu anahtar yalnızca sunucu ortamında bulunmalıdır.');
  }

  // Ek koruma: anahtar yanlislikla public bir degiskene kopyalanmissa erken uyar.
  if (process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'Service role anahtarı NEXT_PUBLIC_ önekiyle tanımlanmış. Bu anahtar istemciye asla gönderilmemelidir.',
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
