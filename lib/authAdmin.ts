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

  // Jika input adalah token JWT Supabase
  if (userIdOrToken && (userIdOrToken.startsWith('ey') || userIdOrToken.length > 50)) {
    try {
      const { data: { user } } = await supabase.auth.getUser(userIdOrToken);
      if (user) {
        targetUserId = user.id;
        activeUser = user;
      }
    } catch {
      // Fallback
    }
  }

  if (!targetUserId) {
    const session = await getAdminSession();
    if (!session?.user) {
      return { isAdmin: false, isSuperAdmin: false, user: null, profile: null };
    }
    targetUserId = session.user.id;
    activeUser = session.user;
  }

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetUserId)
      .maybeSingle();

    if (error || !profile) {
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
