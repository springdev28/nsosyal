import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { requireSupabaseConfig } from './config';

/**
 * Sunucu tarafi Supabase istemcisi (kullanici oturumuyla).
 *
 * Bu istemci ANON anahtarini kullanir; yani butun sorgular Row Level Security
 * politikalarina tabidir. Yetkilendirmenin tek dogru yeri budur.
 */
export async function createSupabaseServerClient() {
  const { url, anonKey } = requireSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component icinden cerez yazilamaz. Oturum yenileme
          // middleware'de yapildigi icin burada yutmak guvenlidir.
        }
      },
    },
  });
}
