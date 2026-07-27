import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { supabase } from '@/lib/supabase';
import { verifyAdminAccess } from '@/lib/authAdmin';

export async function POST(request: Request) {
  // 1. VERIFIKASI KEAMANAN HAK AKSES ADMIN
  const authHeader = request.headers.get('authorization');
  let token = authHeader?.replace('Bearer ', '');

  if (!token) {
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const match = cookieHeader.match(/(?:sb-access-token|supabase-auth-token|auth-token)=([^;]+)/);
      if (match) {
        try {
          const parsed = JSON.parse(decodeURIComponent(match[1]));
          token = parsed?.access_token || parsed[0] || match[1];
        } catch {
          token = decodeURIComponent(match[1]);
        }
      }
    }
  }

  const access = await verifyAdminAccess(token);

  if (!access.isAdmin) {
    return NextResponse.json(
      { success: false, error: 'Akses ditolak. Membutuhkan hak akses admin.' },
      { status: 403 }
    );
  }

  // 2. PARSE PAYLOAD JSON { urls: string[] }
  let urls: string[] = [];
  try {
    const body = await request.json();
    if (Array.isArray(body.urls)) {
      urls = body.urls;
    } else if (typeof body.url === 'string') {
      urls = [body.url];
    }
  } catch {
    return NextResponse.json(
      { success: false, error: 'Format JSON payload tidak valid.' },
      { status: 400 }
    );
  }

  // Clean & sanitize URLs
  const cleanUrls = urls
    .map((u) => typeof u === 'string' ? u.trim() : '')
    .filter((u) => u.length > 0);

  if (cleanUrls.length === 0) {
    return NextResponse.json(
      { success: false, error: 'Daftar URL kosong. Harap masukkan minimal 1 URL Chordtela.' },
      { status: 400 }
    );
  }

  const results: Array<{
    url: string;
    status: 'success' | 'duplicate' | 'error';
    title?: string;
    artist?: string;
    errorMsg?: string;
  }> = [];

  let successCount = 0;
  let duplicateCount = 0;
  let errorCount = 0;

  // 3. PROSES SETIAP URL SECARA BERURUTAN DENGAN DELAY
  for (let i = 0; i < cleanUrls.length; i++) {
    const targetUrl = cleanUrls[i];

    // Delay 300ms antar request jika bukan request pertama
    if (i > 0) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    // Validasi domain
    if (!targetUrl.toLowerCase().includes('chordtela.com')) {
      errorCount++;
      results.push({
        url: targetUrl,
        status: 'error',
        errorMsg: 'URL harus berasal dari domain chordtela.com.',
      });
      continue;
    }

    try {
      // Pengecekan Duplikasi
      const { data: existingSong } = await supabase
        .from('songs')
        .select('id, title, artist')
        .eq('source_url', targetUrl)
        .maybeSingle();

      if (existingSong?.id) {
        duplicateCount++;
        results.push({
          url: targetUrl,
          status: 'duplicate',
          title: existingSong.title || 'Judul Tidak Dikenal',
          artist: existingSong.artist || 'Artis Tidak Dikenal',
          errorMsg: 'Lagu sudah ada di database.',
        });
        continue;
      }

      // Check fallback table 'chords' for duplicate as well
      const { data: existingChord } = await supabase
        .from('chords')
        .select('id, title, artist')
        .eq('source_url', targetUrl)
        .maybeSingle();

      if (existingChord?.id) {
        duplicateCount++;
        results.push({
          url: targetUrl,
          status: 'duplicate',
          title: existingChord.title || 'Judul Tidak Dikenal',
          artist: existingChord.artist || 'Artis Tidak Dikenal',
          errorMsg: 'Lagu sudah ada di database.',
        });
        continue;
      }

      // Fetch HTML target URL
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Respons server HTTP ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const pageTitleRaw =
        $('h1.entry-title').text() || $('title').text() || 'Tanpa Judul';

      let artist = 'Unknown Artist';
      let title = pageTitleRaw.trim();

      if (pageTitleRaw.includes(' - ')) {
        const parts = pageTitleRaw.split('-');
        artist = parts[0].trim();
        title = parts
          .slice(1)
          .join('-')
          .replace(/\s*Chords?\b/i, '')
          .trim();
      }

      const preContent = $('pre').first().text();

      if (!preContent || preContent.trim() === '') {
        throw new Error('Konten chord (<pre>) tidak ditemukan pada halaman.');
      }

      const finalTitle = title || 'Tanpa Judul';
      const finalArtist = artist || 'Unknown Artist';
      const finalChord = preContent.trim();
      const finalCover =
        'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=600&h=600&auto=format&fit=crop';

      // Insert new row to 'songs'
      const { error: songsError } = await supabase.from('songs').insert({
        title: finalTitle,
        artist: finalArtist,
        chords: finalChord,
        source_url: targetUrl,
        cover_url: finalCover,
        view_count: 0,
      });

      if (songsError) {
        console.warn(
          '[BATCH SCRAPER FALLBACK TO CHORDS]:',
          songsError.message
        );
        const { error: chordsError } = await supabase.from('chords').insert({
          title: finalTitle,
          artist: finalArtist,
          content: finalChord,
          source_url: targetUrl,
          cover_url: finalCover,
          views: 0,
        });

        if (chordsError) {
          throw new Error(`Gagal menyimpan ke database: ${chordsError.message}`);
        }
      }

      successCount++;
      results.push({
        url: targetUrl,
        status: 'success',
        title: finalTitle,
        artist: finalArtist,
      });
    } catch (err: any) {
      errorCount++;
      results.push({
        url: targetUrl,
        status: 'error',
        errorMsg: err?.message || 'Gagal mengambil data lagu.',
      });
    }
  }

  return NextResponse.json({
    success: true,
    processed: cleanUrls.length,
    successCount,
    duplicateCount,
    errorCount,
    results,
  });
}
