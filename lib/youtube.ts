export function extractYouTubeId(urlOrId: string | null | undefined): string {
  if (!urlOrId) return '';
  const trimmed = urlOrId.trim();
  
  // Jika sudah berupa 11 karakter ID murni (misal: viW0M5R2BLo)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  
  // RegEx untuk mengekstrak 11 karakter ID dari berbagai format URL YouTube
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = trimmed.match(regExp);
  
  return (match && match[2].length === 11) ? match[2] : '';
}
