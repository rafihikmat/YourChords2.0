import { supabase } from '@/lib/supabase';

export interface SongCorrection {
  id: string;
  song_id: string;
  user_id: string | null;
  reason: string;
  proposed_content: string;
  original_content?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  song_title?: string;
  song_artist?: string;
  user_email?: string;
  user_name?: string;
}

/**
 * Submit a chord/lyric correction proposal.
 */
export async function submitSongCorrection(payload: {
  songId: string;
  userId: string | null;
  reason: string;
  proposedContent: string;
  originalContent?: string;
}): Promise<{ success: boolean; data?: any; error?: string; message?: string }> {
  try {
    if (!payload.songId || !payload.userId) {
      throw new Error('Song ID dan User ID wajib diisi.');
    }
    if (!payload.reason || !payload.reason.trim() || !payload.proposedContent || !payload.proposedContent.trim()) {
      throw new Error('Alasan dan usulan perbaikan tidak boleh kosong.');
    }

    const insertPayload: any = {
      song_id: payload.songId,
      user_id: payload.userId,
      reason: payload.reason.trim(),
      proposed_content: payload.proposedContent.trim(),
      status: 'pending',
    };

    if (payload.originalContent) {
      insertPayload.original_content = payload.originalContent;
    }

    const { data, error } = await supabase
      .from('song_corrections')
      .insert([insertPayload])
      .select();

    if (error) {
      console.error('[SUBMIT CORRECTION SUPABASE ERROR]:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw new Error(error.message || 'Gagal menyimpan usulan perbaikan.');
    }

    return {
      success: true,
      data,
      message: '✨ Usulan perbaikan berhasil dikirim ke Admin!',
    };
  } catch (err: any) {
    const errorMsg = typeof err === 'string' ? err : err?.message || 'Terjadi kesalahan sistem.';
    console.error('[SUBMIT CORRECTION CATCH]:', errorMsg, err);
    return {
      success: false,
      error: errorMsg,
      message: errorMsg,
    };
  }
}

/**
 * Fetch all pending corrections for admin moderation panel.
 */
export async function getPendingCorrections(): Promise<SongCorrection[]> {
  try {
    const { data: corrections, error } = await supabase
      .from('song_corrections')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error || !corrections) {
      console.warn('[GET PENDING CORRECTIONS WARN]:', error);
      return [];
    }

    const songIds = Array.from(new Set(corrections.map((c: any) => c.song_id).filter(Boolean)));
    const userIds = Array.from(new Set(corrections.map((c: any) => c.user_id).filter(Boolean)));

    const songMap: Record<string, { title: string; artist: string }> = {};
    if (songIds.length > 0) {
      const { data: songsData } = await supabase
        .from('songs')
        .select('id, title, artist')
        .in('id', songIds);

      if (songsData) {
        songsData.forEach((s: any) => {
          songMap[s.id] = { title: s.title, artist: s.artist };
        });
      }
    }

    const userMap: Record<string, { email?: string; name?: string }> = {};
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      if (profilesData) {
        profilesData.forEach((p: any) => {
          userMap[p.id] = { email: p.email, name: p.full_name };
        });
      }
    }

    return corrections.map((item: any) => ({
      id: item.id,
      song_id: item.song_id,
      user_id: item.user_id,
      reason: item.reason || '',
      proposed_content: item.proposed_content || '',
      original_content: item.original_content || '',
      status: item.status || 'pending',
      created_at: item.created_at,
      song_title: songMap[item.song_id]?.title || item.song_id,
      song_artist: songMap[item.song_id]?.artist || 'Unknown Artist',
      user_name: userMap[item.user_id]?.name || 'Member Registered',
      user_email: userMap[item.user_id]?.email || '',
    }));
  } catch (err) {
    console.error('[GET PENDING CORRECTIONS EXCEPTION]:', err);
    return [];
  }
}

/**
 * Approve a correction: update the song content in `songs` and mark status as 'approved'.
 */
export async function approveCorrection(
  correctionId: string,
  songId: string,
  proposedContent: string
): Promise<{ success: boolean; message: string }> {
  try {
    const now = new Date().toISOString();

    // 1. Update the song content in 'songs' table
    const { error: songUpdateErr } = await supabase
      .from('songs')
      .update({
        content: proposedContent,
        chords: proposedContent,
        chords_v2: proposedContent,
        updated_at: now,
      })
      .eq('id', songId);

    if (songUpdateErr) {
      console.warn('[APPROVE CORRECTION SONGS TABLE WARN]:', songUpdateErr.message);
      // Fallback update 'chords' table if used
      await supabase
        .from('chords')
        .update({ content: proposedContent, chords: proposedContent })
        .eq('id', songId);
    }

    // 2. Mark correction as approved
    const { error: correctionErr } = await supabase
      .from('song_corrections')
      .update({ status: 'approved' })
      .eq('id', correctionId);

    if (correctionErr) {
      console.error('[APPROVE CORRECTION MARK ERR]:', correctionErr);
      return { success: false, message: 'Gagal memperbarui status usulan.' };
    }

    return { success: true, message: 'Perbaikan berhasil diterapkan ke lagu utama!' };
  } catch (err: any) {
    console.error('[APPROVE CORRECTION EXCEPTION]:', err);
    return { success: false, message: err?.message || 'Gagal menerapkan perbaikan.' };
  }
}

/**
 * Reject a correction: mark status as 'rejected'.
 */
export async function rejectCorrection(
  correctionId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase
      .from('song_corrections')
      .update({ status: 'rejected' })
      .eq('id', correctionId);

    if (error) {
      console.error('[REJECT CORRECTION ERROR]:', error);
      return { success: false, message: 'Gagal menolak usulan perbaikan.' };
    }

    return { success: true, message: 'Usulan perbaikan telah ditolak.' };
  } catch (err: any) {
    console.error('[REJECT CORRECTION EXCEPTION]:', err);
    return { success: false, message: err?.message || 'Gagal menolak usulan.' };
  }
}
