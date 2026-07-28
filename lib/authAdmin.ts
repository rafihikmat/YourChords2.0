import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { Profile } from '@/lib/authContext';

export interface AdminAccessResult {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  user: User | null;
  profile: Profile | null;
}

/**
 * Helper internal untuk mengambil token dari cookie/header pada Server Environment (Next.js)
 */
async function getServerAuthToken(): Promise<string | null> {
  if (typeof window !== 'undefined') return null;

  try {
    const { cookies, headers } = await import('next/headers');
    const cookieStore = await cookies();
    
    // 1. Cek cookie khusus sb-access-token
    const sbAccessToken = cookieStore.get('sb-access-token')?.value;
    if (sbAccessToken) return sbAccessToken;

    // 2. Cek cookie Supabase bawaan
    const allCookies = cookieStore.getAll();
    const sbCookie = allCookies.find(c => 
      c.name.includes('-auth-token') || 
      c.name.includes('sb-access-token') || 
      c.name === 'supabase-auth-token'
    );

    if (sbCookie) {
      try {
        const parsed = JSON.parse(sbCookie.value);
        return parsed?.access_token || parsed[0] || sbCookie.value;
      } catch {
        return sbCookie.value;
      }
    }

    // 3. Cek Authorization Header
    const headerStore = await headers();
    const authHeader = headerStore.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
  } catch (err) {
    console.warn('[getServerAuthToken Warn]:', err);
  }

  return null;
}

/**
 * Mengambil session pengguna aktif dari Supabase
 */
export async function getAdminSession(): Promise<Session | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch (err) {
    console.error('[AUTH ADMIN SESSION ERROR]:', err);
    return null;
  }
}

/**
 * Mengambil data pengguna dari tabel 'profiles' berdasarkan ID user atau JWT token
 * dan memeriksa apakah role bernilai 'admin' atau 'super_admin'
 */
export async function verifyAdminAccess(userIdOrToken?: string): Promise<AdminAccessResult> {
  let targetUserId = userIdOrToken;
  let activeUser: User | null = null;
  let tokenToUse: string | null = null;

  // Jika parameter langsung berupa JWT Token
  if (userIdOrToken && (userIdOrToken.startsWith('ey') || userIdOrToken.length > 50)) {
    tokenToUse = userIdOrToken;
  } else if (!targetUserId && typeof window === 'undefined') {
    tokenToUse = await getServerAuthToken();
  }

  // Jika token ditemukan, dapatkan user dari Supabase Auth
  if (tokenToUse) {
    try {
      const { data: { user } } = await supabase.auth.getUser(tokenToUse);
      if (user) {
        targetUserId = user.id;
        activeUser = user;
      }
    } catch {
      // Fallback lanjut ke getAdminSession
    }
  }

  // Fallback ke Client Session jika belum dapat
  if (!targetUserId) {
    const session = await getAdminSession();
    if (session?.user) {
      targetUserId = session.user.id;
      activeUser = session.user;
    }
  }

  // Jika tidak ada user terautentikasi -> Return false
  if (!targetUserId) {
    return { isAdmin: false, isSuperAdmin: false, user: null, profile: null };
  }

  try {
    // Ambil profile dari tabel profiles
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetUserId)
      .maybeSingle();

    if (error || !profile) {
      // Cek fallback metadata jika profile DB belum/gagal ter-sync
      const userRole = activeUser?.user_metadata?.role || activeUser?.app_metadata?.role;
      if (userRole === 'admin' || userRole === 'super_admin') {
        const isSuperAdmin = userRole === 'super_admin';
        return {
          isAdmin: true,
          isSuperAdmin,
          user: activeUser,
          profile: null,
        };
      }
      return { isAdmin: false, isSuperAdmin: false, user: activeUser, profile: null };
    }

    const role = profile.role as string;
    const isSuperAdmin = role === 'super_admin';
    const isAdmin = role === 'admin' || isSuperAdmin;

    return {
      isAdmin,
      isSuperAdmin,
      user: activeUser,
      profile: profile as Profile,
    };
  } catch (err) {
    console.error('[VERIFY ADMIN ACCESS ERROR]:', err);
    return { isAdmin: false, isSuperAdmin: false, user: activeUser, profile: null };
  }
}
