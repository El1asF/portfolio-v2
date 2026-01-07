// src/js/api.js

export function formatNumber(num) {
  if (num === undefined || num === null) return '0';
  const n = parseInt(num);
  
  // Regel: Ab 100.000 als "100 K" formatieren
  if (n >= 100000) {
    // Teilt durch 1000 und nutzt maximal 1 Nachkommastelle (z.B. 150.5 K)
    // Wenn du gar keine Nachkommastellen willst (nur 150 K), setze maximumFractionDigits auf 0
    return (n / 1000).toLocaleString('de-DE', { maximumFractionDigits: 0 }) + ' K';
  }
  
  // Regel: Unter 100.000 einfach die ganze Zahl (z.B. 1.500)
  return n.toLocaleString('de-DE');
}

export function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

  if (diffDays < 7) return `vor ${diffDays} Tagen`;
  if (diffDays < 30) return `vor ${Math.floor(diffDays / 7)} Wochen`;
  
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function formatDurationISO(duration) {
  if (!duration) return '';
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return '';
  
  const h = (match[1] || '').replace('H', '');
  const m = (match[2] || '').replace('M', '');
  const s = (match[3] || '').replace('S', '');
  
  if (h) return `${h}:${m.padStart(2,'0')}:${s.padStart(2,'0')}`;
  return `${m || '0'}:${s.padStart(2,'0')}`;
}