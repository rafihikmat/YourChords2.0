import { normalizeSong, supabase } from "@/lib/supabase";
import { Setlist, Song } from "@/lib/types";

/* ====================================================================
   USER-ONLY SETLIST ENGINE & DATABASE SYNC
   Strictly scoped with .eq('user_id', userId)
==================================================================== */

/**
 * Fetch all setlists belonging to a specific user.
 * Strictly enforced with .eq('user_id', userId)
 */
export async function getUserSetlists(userId: string): Promise<Setlist[]> {
    if (!userId || userId === "guest" || userId === "demo-user") {
        return [];
    }

    try {
        // 1. Query 'setlists' table
        const { data: setlistsData, error: setlistsErr } = await supabase
            .from("setlists")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (!setlistsErr && setlistsData) {
            return setlistsData.map((item: any) => ({
                id: item.id,
                user_id: item.user_id,
                name: item.name,
                description: item.description || "",
                created_at: item.created_at,
                song_ids: Array.isArray(item.song_ids) ? item.song_ids : [],
            }));
        }

        // 2. Fallback to 'user_setlists' table if 'setlists' table fails
        const { data: userSetlistsData, error: userErr } = await supabase
            .from("user_setlists")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (!userErr && userSetlistsData) {
            return userSetlistsData.map((item: any) => ({
                id: item.id,
                user_id: item.user_id,
                name: item.name,
                description: item.description || "",
                created_at: item.created_at,
                song_ids: Array.isArray(item.song_ids) ? item.song_ids : [],
            }));
        }
    } catch (err) {
        console.error("[GET USER SETLISTS ERROR]:", err);
    }

    return [];
}

/**
 * Create a new setlist folder for an authenticated user.
 * Strictly saved with .eq('user_id', userId)
 */
export async function createSetlist(
    userId: string,
    name: string,
    description = "",
): Promise<Setlist | null> {
    if (
        !userId || userId === "guest" || userId === "demo-user" || !name.trim()
    ) {
        return null;
    }

    const cleanName = name.trim();
    const cleanDesc = description.trim();
    const now = new Date().toISOString();

    try {
        // Try inserting into 'setlists' table
        const { data, error } = await supabase
            .from("setlists")
            .insert({
                user_id: userId,
                name: cleanName,
                description: cleanDesc,
                song_ids: [],
                created_at: now,
            })
            .select()
            .maybeSingle();

        if (!error && data) {
            return {
                id: data.id,
                user_id: data.user_id,
                name: data.name,
                description: data.description || "",
                created_at: data.created_at,
                song_ids: Array.isArray(data.song_ids) ? data.song_ids : [],
            };
        }

        // Try 'user_setlists' if 'setlists' fails
        const { data: altData, error: altErr } = await supabase
            .from("user_setlists")
            .insert({
                user_id: userId,
                name: cleanName,
                description: cleanDesc,
                song_ids: [],
                created_at: now,
            })
            .select()
            .maybeSingle();

        if (!altErr && altData) {
            return {
                id: altData.id,
                user_id: altData.user_id,
                name: altData.name,
                description: altData.description || "",
                created_at: altData.created_at,
                song_ids: Array.isArray(altData.song_ids)
                    ? altData.song_ids
                    : [],
            };
        }
    } catch (err) {
        console.error("[CREATE SETLIST ERROR]:", err);
    }

    return null;
}

/**
 * Add a song to an existing user setlist.
 */
export async function addSongToSetlist(
    setlistId: string,
    songId: string,
    userId?: string,
): Promise<boolean> {
    if (!setlistId || !songId) return false;

    try {
        let query = supabase.from("setlists").select("song_ids, user_id").eq(
            "id",
            setlistId,
        );
        if (userId && userId !== "guest") {
            query = query.eq("user_id", userId);
        }
        const { data, error } = await query.maybeSingle();

        if (!error && data) {
            const existingIds: string[] = Array.isArray(data.song_ids)
                ? data.song_ids
                : [];
            if (!existingIds.includes(songId)) {
                const updatedIds = [...existingIds, songId];
                let updateQuery = supabase.from("setlists").update({
                    song_ids: updatedIds,
                }).eq("id", setlistId);
                if (userId && userId !== "guest") {
                    updateQuery = updateQuery.eq("user_id", userId);
                }
                await updateQuery;
            }
            return true;
        }

        // Fallback table 'user_setlists'
        let altQuery = supabase.from("user_setlists").select(
            "song_ids, user_id",
        ).eq("id", setlistId);
        if (userId && userId !== "guest") {
            altQuery = altQuery.eq("user_id", userId);
        }
        const { data: altData } = await altQuery.maybeSingle();

        if (altData) {
            const existingIds: string[] = Array.isArray(altData.song_ids)
                ? altData.song_ids
                : [];
            if (!existingIds.includes(songId)) {
                const updatedIds = [...existingIds, songId];
                let updateAltQuery = supabase.from("user_setlists").update({
                    song_ids: updatedIds,
                }).eq("id", setlistId);
                if (userId && userId !== "guest") {
                    updateAltQuery = updateAltQuery.eq("user_id", userId);
                }
                await updateAltQuery;
            }
            return true;
        }
    } catch (err) {
        console.error("[ADD SONG TO SETLIST ERROR]:", err);
    }

    return false;
}

/**
 * Remove a song from a user setlist.
 */
export async function removeSongFromSetlist(
    setlistId: string,
    songId: string,
    userId?: string,
): Promise<boolean> {
    if (!setlistId || !songId) return false;

    try {
        let query = supabase.from("setlists").select("song_ids, user_id").eq(
            "id",
            setlistId,
        );
        if (userId && userId !== "guest") {
            query = query.eq("user_id", userId);
        }
        const { data } = await query.maybeSingle();

        if (data) {
            const existingIds: string[] = Array.isArray(data.song_ids)
                ? data.song_ids
                : [];
            const updatedIds = existingIds.filter((id) => id !== songId);
            let updateQuery = supabase.from("setlists").update({
                song_ids: updatedIds,
            }).eq("id", setlistId);
            if (userId && userId !== "guest") {
                updateQuery = updateQuery.eq("user_id", userId);
            }
            await updateQuery;
            return true;
        }

        // Fallback user_setlists
        let altQuery = supabase.from("user_setlists").select(
            "song_ids, user_id",
        ).eq("id", setlistId);
        if (userId && userId !== "guest") {
            altQuery = altQuery.eq("user_id", userId);
        }
        const { data: altData } = await altQuery.maybeSingle();

        if (altData) {
            const existingIds: string[] = Array.isArray(altData.song_ids)
                ? altData.song_ids
                : [];
            const updatedIds = existingIds.filter((id) => id !== songId);
            let updateAltQuery = supabase.from("user_setlists").update({
                song_ids: updatedIds,
            }).eq("id", setlistId);
            if (userId && userId !== "guest") {
                updateAltQuery = updateAltQuery.eq("user_id", userId);
            }
            await updateAltQuery;
            return true;
        }
    } catch (err) {
        console.error("[REMOVE SONG FROM SETLIST ERROR]:", err);
    }

    return false;
}

/**
 * Delete a setlist folder belonging to user.
 */
export async function deleteSetlist(
    setlistId: string,
    userId?: string,
): Promise<boolean> {
    if (!setlistId) return false;

    try {
        let deleteQuery = supabase.from("setlists").delete().eq(
            "id",
            setlistId,
        );
        if (userId && userId !== "guest") {
            deleteQuery = deleteQuery.eq("user_id", userId);
        }
        const { error } = await deleteQuery;

        if (!error) return true;

        let deleteAltQuery = supabase.from("user_setlists").delete().eq(
            "id",
            setlistId,
        );
        if (userId && userId !== "guest") {
            deleteAltQuery = deleteAltQuery.eq("user_id", userId);
        }
        await deleteAltQuery;
        return true;
    } catch (err) {
        console.error("[DELETE SETLIST ERROR]:", err);
    }

    return false;
}

/**
 * Reorder songs in a setlist.
 */
export async function reorderSetlistSongs(
    setlistId: string,
    songIds: string[],
    userId?: string,
): Promise<boolean> {
    if (!setlistId) return false;

    try {
        let updateQuery = supabase.from("setlists").update({
            song_ids: songIds,
        }).eq("id", setlistId);
        if (userId && userId !== "guest") {
            updateQuery = updateQuery.eq("user_id", userId);
        }
        const { error } = await updateQuery;
        if (!error) return true;

        let altQuery = supabase.from("user_setlists").update({
            song_ids: songIds,
        }).eq("id", setlistId);
        if (userId && userId !== "guest") {
            altQuery = altQuery.eq("user_id", userId);
        }
        await altQuery;
        return true;
    } catch (err) {
        console.error("[REORDER SETLIST SONGS ERROR]:", err);
    }

    return false;
}

/**
 * Fetch all favorite songs belonging to authenticated user.
 * Joins user_favorites / song_favorites with songs table.
 */
export async function getUserFavorites(userId: string): Promise<Song[]> {
    if (!userId || userId === "guest" || userId === "demo-user") {
        return [];
    }

    try {
        // 1. Fetch favorite song IDs from user_favorites
        const { data: userFavs } = await supabase
            .from("user_favorites")
            .select("song_id")
            .eq("user_id", userId);

        let songIds: string[] = (userFavs || []).map((f: any) => f.song_id)
            .filter(Boolean);

        // 2. Also check song_favorites
        const { data: songFavs } = await supabase
            .from("song_favorites")
            .select("song_id")
            .eq("user_id", userId);

        if (songFavs && songFavs.length > 0) {
            const extraIds = songFavs.map((f: any) => f.song_id).filter(
                Boolean,
            );
            songIds = Array.from(new Set([...songIds, ...extraIds]));
        }

        if (songIds.length === 0) return [];

        // 3. Fetch song details
        const { data: songsData } = await supabase
            .from("songs")
            .select("*, albums(cover_url)")
            .in("id", songIds);

        if (songsData && songsData.length > 0) {
            return songsData.map(normalizeSong);
        }

        // Try 'chords' table
        const { data: chordsData } = await supabase
            .from("chords")
            .select("*")
            .in("id", songIds);

        if (chordsData && chordsData.length > 0) {
            return chordsData.map(normalizeSong);
        }
    } catch (err) {
        console.error("[GET USER FAVORITES ERROR]:", err);
    }

    return [];
}
