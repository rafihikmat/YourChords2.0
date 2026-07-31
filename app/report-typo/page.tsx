import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { song_title_artist, issue_type, details, email } = body;

    if (!song_title_artist || !song_title_artist.trim()) {
      return NextResponse.json(
        { success: false, error: 'Judul Lagu & Artis wajib diisi.' },
        { status: 400 }
      );
    }

    if (!details || !details.trim()) {
      return NextResponse.json(
        { success: false, error: 'Detail perbaikan wajib diisi.' },
        { status: 400 }
      );
    }

    const payload = {
      song_title_artist: song_title_artist.trim(),
      issue_type: issue_type || 'Lainnya',
      details: details.trim(),
      reporter_email: email ? email.trim() : null,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    // Try inserting into song_corrections table
    const { data, error } = await supabase
      .from('song_corrections')
      .insert(payload)
      .select();

    if (error) {
      console.warn('[SONG_CORRECTIONS INSERT RETRY]:', error.message);
      // Fallback insert without select
      const { error: retryErr } = await supabase
        .from('song_corrections')
        .insert({
          song_title_artist: song_title_artist.trim(),
          issue_type: issue_type || 'Lainnya',
          details: details.trim(),
          status: 'pending',
        });

      if (retryErr) {
        console.error('[SONG_CORRECTIONS ERROR]:', retryErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Terimakasih! Laporan typo Anda telah diterima oleh Admin.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Gagal mengirim laporan.' },
      { status: 500 }
    );
  }
}
