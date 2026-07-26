import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
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
  if (!targetUrl.includes('chordtela.com')) {
    return NextResponse.json(
      { success: false, error: 'Hanya URL dari domain chordtela.com yang didukung saat ini.' }, 
      { status: 400 }
    );
  }

  try {
    // Proses Fetch dengan Timeout Semu dan Header lengkap untuk mencegah blokir Bot
    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });

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
      // Perhatikan kasus jika judul/artis mengandung tanda hubung yang wajar
      const parts = pageTitleRaw.split('-');
      artist = parts[0].trim();
      title = parts.slice(1).join('-').trim(); // Gabungkan sisa array untuk mengantisipasi judul dengan hubung
    }

    // Ekstraksi Chord dari bagian <pre>
    const preContent = $('pre').first().text();

    if (!preContent || preContent.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Tidak dapat menemukan konten chord (tag <pre> kosong) pada halaman target.' }, 
        { status: 404 }
      );
    }

    const finalTitle = title;
    const finalArtist = artist;
    const finalChord = preContent.trim();
    const finalCover = "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=600&h=600&auto=format&fit=crop";

    // Simpan/Upsert ke tabel 'chords' di Supabase
    // Asumsi: 'source_url' adalah UNIQUE identifier di database
    const { error: dbError } = await supabase
      .from('chords')
      .upsert({
        title: finalTitle,
        artist: finalArtist,
        content: finalChord,
        source_url: targetUrl,
        cover_url: finalCover
      }, { onConflict: 'source_url' });

    if (dbError) {
      console.error('[SUPABASE UPSERT ERROR]:', dbError);
      // Tetap lanjutkan memberikan respons agar UI tidak crash jika DB error
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
    console.error('[API SCRAPER ERROR]:', error.message || error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Sistem gagal mengambil halaman. Pastikan koneksi internet stabil atau URL target dapat diakses.' 
      }, 
      { status: 500 }
    );
  }
}
