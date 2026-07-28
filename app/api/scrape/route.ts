import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { supabase } from '@/lib/supabase';
import { verifyAdminAccess } from '@/lib/authAdmin';

export async function GET(request: Request) {
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
      { success: false, error: "Akses ditolak. Membutuhkan hak akses admin." },
      { status: 403 }
    );
  }

  // 2. PARSE PARAMETER URL
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  // Validasi Ketersediaan URL
  if (!targetUrl) {
    return NextResponse.json(
      { success: false, error: 'URL parameter tidak ditemukan. Harap masukkan URL.' }, 
      { status: 400 }
    );
  }

  // Validasi Domain
  if (!targetUrl.toLowerCase().includes('chordtela.com')) {
    return NextResponse.json(
      { success: false, error: 'Hanya URL dari domain chordtela.com yang didukung saat ini.' }, 
      { status: 400 }
    );
  }

  try {
    // Helper function for fetching URL with modern Chrome 126 headers and 403 fallback
    const fetchWithFallback = async (url: string) => {
      const primaryHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'Sec-Ch-Ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      };

      let res = await fetch(url, {
        method: "GET",
        headers: primaryHeaders,
        cache: 'no-store'
      });

      // Fallback jika diblokir 403: bersihkan URL dan coba header yang disederhanakan
      if (res.status === 403) {
        console.warn(`[SCRAPER 403 WARN]: 403 Forbidden detected for ${url}. Executing fallback retry...`);
        const cleanedUrl = url.split('?')[0].split('#')[0].trim();
        const fallbackHeaders = {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cache-Control': 'no-cache'
        };

        res = await fetch(cleanedUrl, {
          method: "GET",
          headers: fallbackHeaders,
          cache: 'no-store'
        });
      }

      return res;
    };

    const response = await fetchWithFallback(targetUrl);

    if (!response.ok) {
      throw new Error(`Respons server tidak wajar. Status: ${response.status}`);
    }

    const html = await response.text();
    
    // Parsing dokumen HTML menggunakan Cheerio
    const $ = cheerio.load(html);

    // Ambil Judul Halaman dari tag h1.entry-title
    const pageTitleRaw = $('h1.entry-title').text() || $('title').text() || "Tanpa Judul";
    
    // Data Sanitization: Memisahkan Artis dan Judul Lagu (Asumsi Format Chordtela: "Artis - Judul")
    let artist = "Unknown Artist";
    let title = pageTitleRaw.trim();
    
    if (pageTitleRaw.includes(' - ')) {
      const parts = pageTitleRaw.split('-');
      artist = parts[0].trim();
      title = parts.slice(1).join('-').replace(/\s*Chords?\b/i, '').trim();
    }

    // Ekstraksi Chord dari bagian <pre>
    const preContent = $('pre').first().text();

    if (!preContent || preContent.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Tidak dapat menemukan konten chord (tag <pre> kosong) pada halaman target.' }, 
        { status: 404 }
      );
    }

    const finalTitle = title || "Tanpa Judul";
    const finalArtist = artist || "Unknown Artist";
    const finalChord = preContent.trim();
    const finalCover = "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=600&h=600&auto=format&fit=crop";

    // 1. Check if song already exists in 'songs'
    const { data: existingSong } = await supabase
      .from('songs')
      .select('id')
      .eq('source_url', targetUrl)
      .maybeSingle();

    if (existingSong?.id) {
      await supabase
        .from('songs')
        .update({
          title: finalTitle,
          artist: finalArtist,
          chords: finalChord,
          cover_url: finalCover
        })
        .eq('id', existingSong.id);
    } else {
      // Insert new row to 'songs'
      const { error: songsError } = await supabase
        .from('songs')
        .insert({
          title: finalTitle,
          artist: finalArtist,
          chords: finalChord,
          source_url: targetUrl,
          cover_url: finalCover,
          view_count: 0
        });

      if (songsError) {
        console.warn('[SUPABASE SONGS INSERT WARN/FALLBACK]:', songsError.message);
        // Fallback to 'chords' table if 'songs' schema varies
        await supabase
          .from('chords')
          .insert({
            title: finalTitle,
            artist: finalArtist,
            content: finalChord,
            source_url: targetUrl,
            cover_url: finalCover,
            views: 0
          });
      }
    }

    // Mengembalikan Respons Sukses Format Konsisten
    return NextResponse.json({
      success: true,
      title: finalTitle,
      artist: finalArtist,
      chord: finalChord,
      original_url: targetUrl
    });

  } catch (error: any) {
    console.error('[API SCRAPER ERROR]:', error?.message || error);
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Sistem gagal mengambil halaman. Pastikan koneksi internet stabil atau URL target dapat diakses.' 
      }, 
      { status: 500 }
    );
  }
}
