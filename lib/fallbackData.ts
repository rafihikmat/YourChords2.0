import { ChordEntry } from './types';

export const INITIAL_FALLBACK_CHORDS: ChordEntry[] = [
  {
    id: "komang-raim-laode",
    title: "Komang",
    artist: "Raim Laode",
    content: `Intro : G D Am C

G                   D
Sebab kau terlalu indah
            Am
Untuk jadi kenyataan
               C
Kutahu ini tak mudah
                  G
Tapi ku kan terus mencoba

Reff :
          G                     D
Sebab kau terlalu indah untuk jadi kenyataan
          Am                  C
Sebab kau terlalu mulia untuk diriku yang fana
    G                     D
Jika kau datang kembali membawa senyum itu
    Am                     C
Ku tak ingin terbangun dari mimpi indah ini

Outro : G D Am C G`,
    source_url: "https://www.chordtela.com/2023/02/raim-laode-komang.html",
    cover_url: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=800&auto=format&fit=crop",
    views: 18500,
    created_at: "2026-01-15T08:00:00.000Z"
  },
  {
    id: "sial-mahalini",
    title: "Sial",
    artist: "Mahalini",
    content: `Intro : C G Am F

C               G
Sampai saat ini ku tak menyangka
Am             F
Kau tega lakukan ini
C             G
Meninggalkan luka mendalam
Am               F
Yang tak mudah terobati

Reff :
C            G
Sial.. sialnya ku mencintaimu
Am           F
Setulus hati tanpa ragu
C              G
Namun balasanmu tak seindah
Am              F
Janji yang kau ucapkan dulu

Outro : C G Am F C`,
    source_url: "https://www.chordtela.com/2023/01/mahalini-sial.html",
    cover_url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop",
    views: 14200,
    created_at: "2026-02-10T10:30:00.000Z"
  },
  {
    id: "penjaga-hati-nadhif-basalamah",
    title: "Penjaga Hati",
    artist: "Nadhif Basalamah",
    content: `Intro : F G Em Am

F            G
Tak pernah kurasakan
Em          Am
Cinta seindah ini
F             G
Kau hadir di hidupku
Em             Am
Membawa terang abadi

Reff :
F                G
Karna bersamamu semua terasa indah
Em               Am
Kau jadi penjaga di dalam hatiku
F              G
Takkan kubiarkan siapapun merebutmu
Em             Am
Dariku penjaga hatiku

Outro : F G Em Am F`,
    source_url: "https://www.chordtela.com/2023/08/nadhif-basalamah-penjaga-hati.html",
    cover_url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop",
    views: 16800,
    created_at: "2026-03-01T14:20:00.000Z"
  },
  {
    id: "separuh-aku-noah",
    title: "Separuh Aku",
    artist: "NOAH",
    content: `Intro : Em C G D

Em               C
Dan terjadi lagi kisah lama yang terulang kembali
G                D
Kau terluka lagi oleh cinta yang salah
Em               C
Dengar laraku, suara hati ini memanggil namamu
G                D
Karna separuh aku menyentuh jiwamu

Reff :
Em          C          G           D
Dengarkan angin yang berhembus kencang
Em          C          G           D
Membawa kisah tentang kita yang telah lalu
Em          C          G           D
Kuingin kau tahu diriku di sini selalu ada
Em          C          G           D
Menantikanmu kembali di dalam pelukku

Outro : Em C G D Em`,
    source_url: "https://www.chordtela.com/2012/08/noah-separuh-aku.html",
    cover_url: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=800&auto=format&fit=crop",
    views: 21500,
    created_at: "2026-03-15T12:00:00.000Z"
  },
  {
    id: "mesra-mesraannya-sal-priadi",
    title: "Mesra-mesraannya kecil-kecilan dulu",
    artist: "Sal Priadi",
    content: `Intro : C Am F G

C               Am
Kita belum punya apa-apa
F              G
Tapi punya banyak cinta
C              Am
Rencana-rencana besar
F               G
Yang kita susun bersama

Reff :
C                     Am
Mesra-mesraannya kecil-kecilan dulu
F                   G
Makan mi instan berdua di teras rumah
C                      Am
Nanti kalau kita sudah punya segalanya
F                    G
Kita mesra-mesraan di mana saja

Outro : C Am F G C`,
    source_url: "https://www.chordtela.com/2024/04/sal-priadi-mesra-mesraannya.html",
    cover_url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop",
    views: 9400,
    created_at: "2026-04-05T09:15:00.000Z"
  },
  {
    id: "rungkad-happy-asmara",
    title: "Rungkad",
    artist: "Happy Asmara",
    content: `Intro : C F G C

C                F
Rungkad.. entek-entekan
G                C
Kelangan kowe sing paling tak sayang
Am               Dm
Stop mencintai dirimu
G                C
Aku wis kapok kena pengaruhmu

Reff :
C                F
Rungkad entek ambyar
G                C
Atiku wes remuk tak tersisa
Am               Dm
Matursuwun gusti kulo pun sadar
G                C
Sing ditresnani ora rumangsa

Outro : C F G C`,
    source_url: "https://www.chordtela.com/2022/10/happy-asmara-rungkad.html",
    cover_url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=800&auto=format&fit=crop",
    views: 12100,
    created_at: "2026-05-12T11:00:00.000Z"
  }
];

// Helper to search fallback chords
export function getFallbackChords(query?: string) {
  if (!query) return INITIAL_FALLBACK_CHORDS;
  const q = query.toLowerCase();
  return INITIAL_FALLBACK_CHORDS.filter(c => 
    c.title.toLowerCase().includes(q) || c.artist.toLowerCase().includes(q)
  );
}

// Helper to get chord by ID
export function getFallbackChordById(id: string) {
  return INITIAL_FALLBACK_CHORDS.find(c => c.id === id) || INITIAL_FALLBACK_CHORDS[0];
}
