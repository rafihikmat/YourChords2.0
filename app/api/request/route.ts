import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('missing_songs_log')
      .select('id, keyword, search_count, last_searched_at')
      .order('search_count', { ascending: false })
      .limit(5);

    if (error || !data || data.length === 0) {
      // Fallback top requested songs
      const defaultRequests = [
        { id: '1', keyword: 'Dewa 19 - Pupus', search_count: 84 },
        { id: '2', keyword: 'Sheila On 7 - Dan', search_count: 72 },
        { id: '3', keyword: 'Nadin Amizah - Rayuan Perempuan Gila', search_count: 65 },
        { id: '4', keyword: 'Bernadya - Kata Mereka Ini Berlebihan', search_count: 59 },
        { id: '5', keyword: 'Peterpan - Menghapus Jejakmu', search_count: 48 },
      ];
      return NextResponse.json({ success: true, requests: defaultRequests });
    }

    return NextResponse.json({ success: true, requests: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, artist, note } = body;

    if (!title || !artist) {
      return NextResponse.json(
        { success: false, error: 'Judul Lagu dan Nama Artis wajib diisi.' },
        { status: 400 }
      );
    }

    const cleanTitle = title.trim();
    const cleanArtist = artist.trim();
    const keyword = `${cleanTitle} - ${cleanArtist}`;

    // Check if keyword already exists in missing_songs_log
    const { data: existing } = await supabase
      .from('missing_songs_log')
      .select('id, search_count')
      .ilike('keyword', keyword)
      .maybeSingle();

    if (existing) {
      // Increment search_count
      const newCount = (existing.search_count || 1) + 1;
      await supabase
        .from('missing_songs_log')
        .update({
          search_count: newCount,
          last_searched_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      // Insert new record
      await supabase.from('missing_songs_log').insert({
        keyword,
        search_count: 1,
        last_searched_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      message: `Request lagu "${keyword}" berhasil dikirim! Tim kami akan segera meninjau dan menambahkan chord-nya.`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
