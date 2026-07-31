import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/request
 * Retrieves missing songs log ordered by search_count descending.
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('missing_songs_log')
      .select('*')
      .order('search_count', { ascending: false });

    if (error || !data || data.length === 0) {
      // Fallback query if search_count ordering returned empty/error
      const { data: dataByCount } = await supabase
        .from('missing_songs_log')
        .select('*')
        .order('count', { ascending: false });

      if (dataByCount && dataByCount.length > 0) {
        const normalized = dataByCount.map((item: any) => ({
          id: item.id || item.keyword || item.query,
          keyword: item.keyword || item.query || 'Tanpa Kata Kunci',
          search_count: Number(item.search_count || item.count || 1),
          last_searched_at: item.last_searched_at || item.updated_at || item.created_at || new Date().toISOString(),
        }));
        return NextResponse.json({ success: true, requests: normalized });
      }

      return NextResponse.json({ success: true, requests: [] });
    }

    const normalized = data.map((item: any) => ({
      id: item.id || item.keyword || item.query,
      keyword: item.keyword || item.query || 'Tanpa Kata Kunci',
      search_count: Number(item.search_count || item.count || 1),
      last_searched_at: item.last_searched_at || item.updated_at || item.created_at || new Date().toISOString(),
    }));

    return NextResponse.json({ success: true, requests: normalized });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

/**
 * POST /api/request
 * Records a missing song request keyword into missing_songs_log table.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let rawKeyword = body.keyword || body.query;

    if (!rawKeyword && body.title && body.artist) {
      rawKeyword = `${body.title.trim()} - ${body.artist.trim()}`;
    }

    if (!rawKeyword || typeof rawKeyword !== 'string' || !rawKeyword.trim()) {
      return NextResponse.json(
        { success: false, error: 'Kata kunci pencarian wajib diisi.' },
        { status: 400 }
      );
    }

    const cleanKeyword = rawKeyword.trim();
    const sanitizedKeyword = cleanKeyword.toLowerCase();
    const nowIso = new Date().toISOString();

    // Check if row already exists in missing_songs_log
    const { data: existing } = await supabase
      .from('missing_songs_log')
      .select('*')
      .or(`keyword.ilike.${sanitizedKeyword},query.ilike.${sanitizedKeyword}`)
      .maybeSingle();

    if (existing) {
      const currentCount = Number(existing.search_count || existing.count || 1);
      const newCount = currentCount + 1;

      const { error: updateErr } = await supabase
        .from('missing_songs_log')
        .update({
          search_count: newCount,
          count: newCount,
          last_searched_at: nowIso,
        })
        .eq('id', existing.id);

      if (updateErr) {
        console.warn('[MISSING_SONGS_LOG UPDATE WARN]:', updateErr.message);
      }
    } else {
      // Insert new row
      const { error: insertErr } = await supabase
        .from('missing_songs_log')
        .insert({
          keyword: sanitizedKeyword,
          query: sanitizedKeyword,
          search_count: 1,
          count: 1,
          last_searched_at: nowIso,
        });

      if (insertErr) {
        console.warn('[MISSING_SONGS_LOG INSERT RETRY]:', insertErr.message);
        // Retry with minimal fields
        await supabase
          .from('missing_songs_log')
          .insert({
            keyword: sanitizedKeyword,
            search_count: 1,
            last_searched_at: nowIso,
          });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Permintaan lagu berhasil dicatat!',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

/**
 * DELETE /api/request
 * Removes a request item from missing_songs_log table.
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');
    let keyword = searchParams.get('keyword');

    if (!id && !keyword) {
      try {
        const body = await req.json();
        id = body.id;
        keyword = body.keyword || body.query;
      } catch {}
    }

    if (!id && !keyword) {
      return NextResponse.json(
        { success: false, error: 'ID atau Keyword permintaan lagu wajib disertakan.' },
        { status: 400 }
      );
    }

    if (id) {
      await supabase.from('missing_songs_log').delete().eq('id', id);
    }

    if (keyword) {
      const sanitized = keyword.trim().toLowerCase();
      await supabase.from('missing_songs_log').delete().or(`keyword.ilike.${sanitized},query.ilike.${sanitized}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Permintaan lagu berhasil dihapus.',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
