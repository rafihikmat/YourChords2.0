// IndexedDB Offline Storage Engine for YourChords 2.0
const DB_NAME = 'YourChordsOfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'cached_songs';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export interface CachedSong {
  id: string;
  title: string;
  artist: string;
  chords?: string;
  content?: string;
  difficulty?: string | null;
  cover_url?: string;
  cachedAt?: string;
}

export async function saveSongToOfflineCache(songData: CachedSong): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const record: CachedSong = {
        ...songData,
        cachedAt: new Date().toISOString(),
      };

      const request = store.put(record);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('[OFFLINE CACHE SAVE ERROR]:', error);
    return false;
  }
}

export async function getSongFromOfflineCache(songId: string): Promise<CachedSong | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(songId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('[OFFLINE CACHE GET ERROR]:', error);
    return null;
  }
}

export async function getAllCachedSongs(): Promise<CachedSong[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('[OFFLINE CACHE GET ALL ERROR]:', error);
    return [];
  }
}

export async function removeSongFromOfflineCache(songId: string): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(songId);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('[OFFLINE CACHE DELETE ERROR]:', error);
    return false;
  }
}

export async function isSongCached(songId: string): Promise<boolean> {
  const song = await getSongFromOfflineCache(songId);
  return !!song;
}
