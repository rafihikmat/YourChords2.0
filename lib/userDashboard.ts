import { normalizeSong, supabase } from "@/lib/supabase";
import { Song } from "@/lib/types";
import { getUserFavorites } from "@/lib/setlists";

export interface UserDashboardStats {
    favoritesCount: number;
    setlistsCount: number;
    notesCount: number;
}

export interface UserSongNoteItem {
    id: string;
    song_id: string;
    notes_content: string;
    updated_at: string;
    song?: Song | null;
}

/**
 * Fetch total counts of user favorites, setlists, and song notes.
 */
export async function getUserDashboardStats(
    userId: string,
): Promise<UserDashboardStats> {
    if (!userId || userId === "guest" || userId === "demo-user") {
        return { favoritesCount: 0, setlistsCount: 0, notesCount: 0 };
    }

    try {
        // 1. Favorites count
        let favoritesCount = 0;
        const { count: favCount1 } = await supabase
            .from("user_favorites")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId);

        const { count: favCount2 } = await supabase
            .from("song_favorites")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId);

        favoritesCount = Math.max(favCount1 || 0, favCount2 || 0);
        if ((favCount1 || 0) > 0 && (favCount2 || 0) > 0) {
            // If both tables have records, get unique song_id count
            const { data: f1 } = await supabase.from("user_favorites").select(
                "song_id",
            ).eq("user_id", userId);
            const { data: f2 } = await supabase.from("song_favorites").select(
                "song_id",
            ).eq("user_id", userId);
            const set = new Set(
                [
                    ...(f1 || []).map((x) => x.song_id),
                    ...(f2 || []).map((x) => x.song_id),
                ].filter(Boolean),
            );
            favoritesCount = set.size;
        }

        // 2. Setlists count
        let setlistsCount = 0;
        const { count: setCount1 } = await supabase
            .from("setlists")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId);

        const { count: setCount2 } = await supabase
            .from("user_setlists")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId);

        setlistsCount = Math.max(setCount1 || 0, setCount2 || 0);

        // 3. Song notes count
        const { count: notesCount } = await supabase
            .from("user_song_notes")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId);

        return {
            favoritesCount,
            setlistsCount,
            notesCount: notesCount || 0,
        };
    } catch (err) {
        console.error("[GET USER DASHBOARD STATS ERROR]:", err);
        return { favoritesCount: 0, setlistsCount: 0, notesCount: 0 };
    }
}

/**
 * Fetch favorite songs for current user
 */
export async function getUserFavoriteSongs(userId: string): Promise<Song[]> {
    return getUserFavorites(userId);
}

/**
 * Fetch list of song notes created by current user
 */
export async function getUserNotesList(
    userId: string,
): Promise<UserSongNoteItem[]> {
    if (!userId || userId === "guest" || userId === "demo-user") {
        return [];
    }

    try {
        const { data: notesData, error: notesErr } = await supabase
            .from("user_song_notes")
            .select("*")
            .eq("user_id", userId)
            .order("updated_at", { ascending: false });

        if (notesErr || !notesData || notesData.length === 0) {
            return [];
        }

        const songIds = Array.from(
            new Set(notesData.map((n: any) => n.song_id).filter(Boolean)),
        );

        let songsMap: Record<string, Song> = {};

        if (songIds.length > 0) {
            const { data: songsData } = await supabase
                .from("songs")
                .select("*, albums(cover_url)")
                .in("id", songIds);

            if (songsData) {
                songsData.forEach((rawSong: any) => {
                    songsMap[rawSong.id] = normalizeSong(rawSong);
                });
            }

            // Fallback to chords table for missing songs
            const missingIds = songIds.filter((id) => !songsMap[id]);
            if (missingIds.length > 0) {
                const { data: chordsData } = await supabase
                    .from("chords")
                    .select("*")
                    .in("id", missingIds);

                if (chordsData) {
                    chordsData.forEach((rawSong: any) => {
                        songsMap[rawSong.id] = normalizeSong(rawSong);
                    });
                }
            }
        }

        return notesData.map((noteItem: any) => {
            const content = noteItem.notes_content || noteItem.note ||
                noteItem.content || "";
            return {
                id: noteItem.id,
                song_id: noteItem.song_id,
                notes_content: content,
                updated_at: noteItem.updated_at || noteItem.created_at ||
                    new Date().toISOString(),
                song: songsMap[noteItem.song_id] || null,
            };
        });
    } catch (err) {
        console.error("[GET USER NOTES LIST ERROR]:", err);
        return [];
    }
}

/**
 * Update user display name in profiles table
 */
export async function updateUserProfileName(
    userId: string,
    fullName: string,
): Promise<boolean> {
    if (!userId || !fullName.trim()) return false;

    try {
        const { error } = await supabase
            .from("profiles")
            .upsert({
                id: userId,
                full_name: fullName.trim(),
            }, { onConflict: "id" });

        if (error) {
            console.error("[UPDATE PROFILE NAME ERROR]:", error);
            return false;
        }
        return true;
    } catch (err) {
        console.error("[UPDATE PROFILE NAME EXCEPTION]:", err);
        return false;
    }
}
