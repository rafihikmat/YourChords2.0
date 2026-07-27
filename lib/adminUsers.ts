import { supabase } from '@/lib/supabase';

export interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'user' | 'admin' | 'super_admin';
  is_banned?: boolean;
  created_at?: string;
  email?: string | null;
}

export interface UserAdminResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Mengambil daftar pengguna dari tabel 'profiles' Supabase
 * dengan filter opsi pencarian berdasarkan nama, ID, atau email.
 */
export async function getAllUsers(searchQuery?: string): Promise<UserAdminResponse<UserProfile[]>> {
  try {
    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false, nullsFirst: false });

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.trim();
      // Supabase or filter
      query = query.or(`full_name.ilike.%${q}%,id.ilike.%${q}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[GET ALL USERS ERROR]:', error);
      return { success: false, error: error.message };
    }

    const users: UserProfile[] = (data || []).map((u: any) => ({
      id: u.id,
      full_name: u.full_name || 'Pengguna Tanpa Nama',
      avatar_url: u.avatar_url || null,
      role: (u.role as 'user' | 'admin' | 'super_admin') || 'user',
      is_banned: Boolean(u.is_banned),
      created_at: u.created_at || new Date().toISOString(),
      email: u.email || null,
    }));

    return { success: true, data: users };
  } catch (err: any) {
    console.error('[GET ALL USERS SYSTEM ERROR]:', err);
    return { success: false, error: err?.message || 'Gagal mengambil data pengguna.' };
  }
}

/**
 * Mengubah role pengguna di Supabase ('user' | 'admin' | 'super_admin')
 */
export async function updateUserRole(
  targetUserId: string,
  newRole: 'user' | 'admin' | 'super_admin'
): Promise<UserAdminResponse<UserProfile>> {
  if (!targetUserId) {
    return { success: false, error: 'ID Pengguna tidak valid.' };
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        role: newRole,
        updated_at: new Date().toISOString() 
      })
      .eq('id', targetUserId)
      .select('*')
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'Pengguna tidak ditemukan.' };
    }

    return {
      success: true,
      data: {
        id: data.id,
        full_name: data.full_name || 'Pengguna Tanpa Nama',
        avatar_url: data.avatar_url,
        role: data.role,
        is_banned: Boolean(data.is_banned),
        created_at: data.created_at,
      },
    };
  } catch (err: any) {
    console.error('[UPDATE USER ROLE ERROR]:', err);
    return { success: false, error: err?.message || 'Gagal mengubah role pengguna.' };
  }
}

/**
 * Mengubah status blokir pengguna (kolom 'is_banned' pada tabel profiles)
 */
export async function toggleUserBanStatus(
  targetUserId: string,
  isBanned: boolean
): Promise<UserAdminResponse<UserProfile>> {
  if (!targetUserId) {
    return { success: false, error: 'ID Pengguna tidak valid.' };
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        is_banned: isBanned,
        updated_at: new Date().toISOString() 
      })
      .eq('id', targetUserId)
      .select('*')
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: data ? {
        id: data.id,
        full_name: data.full_name || 'Pengguna Tanpa Nama',
        avatar_url: data.avatar_url,
        role: data.role,
        is_banned: Boolean(data.is_banned),
        created_at: data.created_at,
      } : undefined,
    };
  } catch (err: any) {
    console.error('[TOGGLE USER BAN STATUS ERROR]:', err);
    return { success: false, error: err?.message || 'Gagal mengubah status blokir pengguna.' };
  }
}
