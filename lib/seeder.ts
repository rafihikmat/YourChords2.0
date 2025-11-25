
import { supabase } from './supabase';

/**
 * A collection of song data used to seed the database.
 * Each song object contains metadata, chords, and tablature in ChordPro format.
 */
const songs = [
  {
    title: "Kangen",
    artist: "Dewa 19",
    difficulty: "Medium",
    youtube_video_id: "w8zM_eXvUuI",
    spotify_track_id: "1Jd0k0G4r4k",
    chords: ["D", "Bm", "G", "A", "F#m"],
    tablature: {
      content: `[D]Kuteri[Bm]ma surat[G]mu tlah ku[A]baca dan aku mengerti
[D]Betapa merindu[Bm]nya dirimu [G]akan hadirnya [A]diriku
[D]Di dalam [Bm]hari-harimu [G]bersama [A]lagi

[D]Kau berta[Bm]nya padaku [G]kapan aku [A]akan kembali
[D]Lagi-la[Bm]gi kau tak bisa [G]tidur [A]karena ingat padaku
[D]Sedang apa [Bm]dan dimana [G]diriku bera[A]da

Reff:
[D]Semua kata [F#m]rindumu [G]semakin membuatku [A]tak berdaya
[D]Menahan rasa [F#m]ingin jumpa [G]percayalah padaku [A]akupun rindu kamu
[D]Ku akan [Bm]pulang [G]melepas semua [A]kerinduan
[D]Yang ter[Bm]pendam...`
    }
  },
  {
    title: "Dan",
    artist: "Sheila On 7",
    difficulty: "Easy",
    youtube_video_id: "8dJgR4Hqf6U",
    spotify_track_id: "2j",
    chords: ["C", "Am", "Dm", "G", "Em", "F"],
    tablature: {
      content: `[C]Dan... [Am]pabila esok [Dm]datang kembali
[G]Seperti sedia [C]kala dimana kau bisa [Am]bercanda
[Dm]Dan... perlahan [G]kaupun lupakan aku
[C]Mimpi burukmu [Am]dimana tlah [Dm]kutancapkan duri [G]tajam

[C]Kau... [Am]pun menangis [Dm]menangis sedih
[G]Maafkan aku [C]
[C]Dan... [Am]bukan maksudku [Dm]bukan inginku
[G]Melukaimu [C]sadarkah kau [Am]di sini [Dm]kupun terluka
[G]Melupakanmu [C]menepikanmu [Am]maafkan aku

Reff:
[F]Lupakanlah [G]saja diriku
[Em]Bila itu bisa [Am]membuatmu kembali [Dm]bersinar
dan [G]berpijar seperti [C]dulu kala
[F]Caci maki [G]saja diriku
[Em]Bila itu bisa [Am]membuatmu kembali [Dm]bersinar
dan [G]berpijar seperti [C]dulu kala`
    }
  },
  {
    title: "Hati-Hati di Jalan",
    artist: "Tulus",
    difficulty: "Hard",
    youtube_video_id: "_4CqS9T9Z_U",
    spotify_track_id: "4",
    chords: ["F", "Bb", "Am", "Dm", "Gm", "C", "A"],
    tablature: {
      content: `[F]Perjalanan mem[Bb]bawamu
[F]Bertemu denganku [Bb]
[Am]Ku bertemu [Dm]kamu
[Gm]Sepertimu yang ku[C]cari
[F]Konon aku ju[Bb]ga
[F]Seperti yang kau [Bb]cari

[Am]Kukira kita [Dm]asam dan garam
[Gm]Dan kita ber[C]temu di belanga

Reff:
[F]Kisah kita [A]berakhir di [Dm]Januari
[Gm]Selamat tinggal [C]kisah tak berujung
[F]Kini ku [A]sadari takdir[Dm]ku
[Gm]Kau bukan [C]rumah
[Bb]Hati-hati di [F]jalan`
    }
  },
  {
    title: "Yellow",
    artist: "Coldplay",
    difficulty: "Easy",
    youtube_video_id: "yKNxeF4KMsY",
    chords: ["G", "D", "C", "Em"],
    tablature: {
      content: `[G]Look at the stars
Look how they shine for [D]you
And everything you [C]do
Yeah they were all yellow

[G]I came along
I wrote a song for [D]you
And all the things you [C]do
And it was called Yellow

[G]So then I took my [D]turn
Oh what a thing to [C]have done
And it was all [G]yellow

Reff:
[C]Your skin, [Em]oh yeah your [D]skin and bones
[C]Turn in[Em]to something [D]beautiful
[C]Do you know, [Em]you know I [D]love you so
[C]You know I love you so`
    }
  },
  {
    title: "Perfect",
    artist: "Ed Sheeran",
    difficulty: "Easy",
    youtube_video_id: "2Vv-BfVoq4g",
    chords: ["G", "Em", "C", "D"],
    tablature: {
      content: `[G]I found a [Em]love for [C]me
[D]Darling just [G]dive right in, and follow my [D]lead
[G]Well I found a [Em]girl beautiful and [C]sweet
[D]I never [G]knew you were the someone waiting for [D]me

Pre-Chorus:
Cause we were just kids when we [G]fell in love
Not knowing [Em]what it was
I will not [C]give you up this [G]time [D]
But darling, just [G]kiss me slow, your heart is [Em]all I own
And in your [C]eyes you're holding [D]mine

Chorus:
Baby, [Em]I'm [C]dancing in the [G]dark with [D]you between my [Em]arms
[C]Barefoot on the [G]grass, [D]listening to our [Em]favorite song
When you [C]said you looked a [G]mess, I whispered [D]underneath my [Em]breath
But you [C]heard it, darling [G]you look [D]perfect to[G]night`
    }
  },
  {
    title: "Yang Terdalam",
    artist: "Peterpan",
    difficulty: "Easy",
    youtube_video_id: "FjT0z_Yn4wY",
    chords: ["C", "F", "G", "A"],
    tablature: {
      content: `[C]Kulepas semua yang ku [F]inginkan
[G]Tak akan kuulangi [C]
[C]Maafkan jika kau ku [F]sayangi
[G]Dan bila kumenanti [C]

[C]Pernahkah engkau co[F]ba mengerti
[G]Lihatlah ku di si[C]ni
[C]Mungkinkah jika aku [F]bermimpi
[G]Salahkah tuk menan[C]ti

Reff:
[C]Takkan lelah aku menan[F]ti
[G]Takkan hilang cintaku i[C]ni
[C]Hingga saat kau tak kemba[F]li
[G]Kan kukenang di hati sa[C]ja`
    }
  },
  {
    title: "Someone Like You",
    artist: "Adele",
    difficulty: "Medium",
    youtube_video_id: "hLQl3WQQoQ0",
    chords: ["A", "E", "F#m", "D"],
    tablature: {
      content: `[A]I heard that [E]you're settled down
That you [F#m]found a girl and you're [D]married now
[A]I heard that your [E]dreams came true
Guess she [F#m]gave you things I didn't [D]give to you

[A]Old friend, why are you [E]so shy?
Ain't like [F#m]you to hold back or [D]hide from the light

Reff:
[E]Never mind, I'll [F#m]find someone like [D]you
I wish [E]nothing but the [F#m]best for [D]you too
Don't [E]forget me, I [F#m]beg
I'll re[D]member you said
"Sometimes it [E]lasts in love, but [F#m]sometimes it hurts in[D]stead"`
    }
  },
  {
    title: "Akad",
    artist: "Payung Teduh",
    difficulty: "Hard",
    youtube_video_id: "viW0M5R2BLo",
    chords: ["E", "G#m", "A", "B", "F#m", "Am"],
    tablature: {
      content: `[E]Betapa baha[G#m]gianya [A]hatiku saat [E]ku duduk ber[A]dua dengan[E]mu
Berja[F#m]lan bersamamu [B]
[E]Menarilah [G#m]denganku [A]namun bila kau [E]ingin [A]sendiri
[E]Cepatlah kem[F#m]bali [B]

[A]Kusadari [B]engkau takkan [G#m]kan kembali [C#]
[F#m]Namun satu yang [B]pastikan kau [E]ingat [E7]
[A]Di sini aku [Am]ditinggalkan [G#m]cinta [C#]
[F#m]Masih tersenyum [B]melihatmu baha[E]gia

Reff:
[E]Bila nanti [G#m]saatnya tlah [C#m]tiba
[E]Kuingin kau [A]menjadi [B]istriku
[E]Berjalan ber[G#m]sama [C#m]mengarungi [F#m]rumah tangga [B]
[E]Kau dan aku [G#m]selama[C#m]nya`
    }
  },
  {
    title: "All of Me",
    artist: "John Legend",
    difficulty: "Medium",
    youtube_video_id: "450p7goxZqg",
    chords: ["Em", "C", "G", "D", "Am"],
    tablature: {
      content: `[Em]What would I do without your [C]smart mouth?
[G]Drawing me in, and you [D]kicking me out
[Em]You've got my head spinning, [C]no kidding, I [G]can't pin you [D]down
[Em]What's going on in that [C]beautiful mind
[G]I'm on your magical [D]mystery ride
[Em]And I'm so dizzy, don't [C]know what hit me, but [G]I'll be al[D]right

[Am]My head's un[G]der wa[D]ter
[Am]But I'm breath[G]ing [D]fine
[Am]You're crazy and [G]I'm out of [D]my mind

Reff:
[G]Cause all of me loves [Em]all of you
Love your [Am]curves and all your edges
All your [C]perfect im[D]perfections
[G]Give your all to me, I'll give my [Em]all to you
You're my [Am]end and my beginning
Even [C]when I lose I'm [D]winning`
    }
  },
  {
    title: "Separuh Aku",
    artist: "Noah",
    difficulty: "Medium",
    youtube_video_id: "XjBNy1o3j_4",
    chords: ["D", "Bm", "Em", "G", "A"],
    tablature: {
      content: `[D]Dan terjadi lagi [Bm]
[Em]Kisah lama yang [G]terulang kem[D]bali
[D]Kau terluka lagi [Bm]
[Em]Dari cinta rumit [G]yang kau jala[D]ni

[A]Aku ingin kau merasa [Bm]
[A]Kamu mengerti aku mengerti [G]kamu

Reff:
[D]Dengar laraku [Bm]
[Em]Suara hati ini memanggil [A]namamu
[D]Karena separuh a[Bm]ku
[Em]Dirimu... [G] [A]`
    }
  }
];

/**
 * Seeds the database with the predefined list of songs.
 * Checks for existing songs by title and artist to avoid duplicates.
 *
 * @returns {Promise<{success: number, failed: number}>} An object containing the count of successfully seeded songs and failures.
 */
export const seedDatabase = async () => {
  let successCount = 0;
  let failCount = 0;

  for (const song of songs) {
    try {
      // Check duplicates by title/artist to prevent spamming
      const { data: existing } = await supabase
        .from('songs')
        .select('id')
        .eq('title', song.title)
        .eq('artist', song.artist)
        .single();

      if (!existing) {
        const { error } = await supabase.from('songs').insert([song]);
        if (error) {
             console.error("Seed Error:", error);
             failCount++;
        } else {
             successCount++;
        }
      } else {
          // Skip if exists
          console.log(`Skipped ${song.title} (already exists)`);
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      failCount++;
    }
  }
  return { success: successCount, failed: failCount };
};
