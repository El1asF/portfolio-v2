import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Umgebungsvariablen laden
dotenv.config();

const API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = 'UC8VMlZ6CVj7g-f3MMUvyCJw'; 
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

// Speicherort
const DATA_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/data');
const OUTPUT_FILE = path.join(DATA_DIR, 'youtubeData.json');

// Cache-Dauer: 24 Stunden
const CACHE_DURATION = 24 * 60 * 60 * 1000; 

// --- HELPER FUNKTIONEN (DIREKT HIER DEFINIERT) ---
function getDurationInSeconds(durationISO) {
  if (!durationISO) return 0;
  const match = durationISO.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;
  
  const hours = parseInt((match[1] || '').replace('H', '')) || 0;
  const minutes = parseInt((match[2] || '').replace('M', '')) || 0;
  const seconds = parseInt((match[3] || '').replace('S', '')) || 0;
  return (hours * 3600) + (minutes * 60) + seconds;
}

function isVideoShort(video) {
    if (video.snippet?.title?.toLowerCase().includes('#shorts')) return true;
    const durationISO = video.contentDetails?.duration;
    // Shorts Definition: Alles unter 60s
    return getDurationInSeconds(durationISO) <= 60;
}

function isLongform(video) {
    const durationISO = video.contentDetails?.duration;
    const seconds = getDurationInSeconds(durationISO);
    // STRIKTER FILTER: Nur Videos > 180 Sekunden (3 Minuten)
    return seconds > 180; 
}

// --- Check Cache ---
async function isCacheValid() {
    try {
        const raw = await fs.readFile(OUTPUT_FILE, 'utf-8');
        const data = JSON.parse(raw);
        if (!data.generatedAt || data.error) return false;

        const lastGen = new Date(data.generatedAt).getTime();
        const now = Date.now();

        if (now - lastGen < CACHE_DURATION) {
            console.log(`✅ YouTube-Daten aktuell (vom ${new Date(lastGen).toLocaleString()}).`);
            return true;
        }
        console.log('cw ⚠️ YouTube-Daten veraltet (>24h). Starte Update...');
        return false;
    } catch (e) {
        console.log('ℹ️ Keine YouTube-Daten gefunden. Starte Download...');
        return false;
    }
}

// --- API Calls ---
async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`YouTube API Error: ${res.status}`);
    return await res.json();
}

async function getVideosByIds(videoIds) {
    if (!videoIds) return [];
    const url = `${BASE_URL}/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${API_KEY}`;
    const data = await fetchJson(url);
    return data.items || [];
}

async function getChannelData() {
    console.log('   Fetching Channel...');
    const url = `${BASE_URL}/channels?part=snippet,statistics,contentDetails&id=${CHANNEL_ID}&key=${API_KEY}`;
    const data = await fetchJson(url);
    return data.items?.[0];
}

// INTELLIGENTER FETCH: Holt so lange Seiten, bis wir genug Longform Videos haben
async function getLatestUploadsRecursive(targetLongCount = 10, maxPages = 10) {
    console.log(`   Fetching Uploads (Suche mind. ${targetLongCount} lange Videos)...`);
    const uploadsId = CHANNEL_ID.replace(/^UC/, 'UU'); // Uploads Playlist ID
    let collectedVideos = [];
    let nextPageToken = '';
    let page = 0;

    while (page < maxPages) {
        const tokenParam = nextPageToken ? `&pageToken=${nextPageToken}` : '';
        const url = `${BASE_URL}/playlistItems?part=contentDetails&playlistId=${uploadsId}&maxResults=50${tokenParam}&key=${API_KEY}`;
        
        const data = await fetchJson(url);
        if (!data.items?.length) break;

        const videoIds = data.items.map(item => item.contentDetails.videoId).join(',');
        const videoDetails = await getVideosByIds(videoIds);
        
        collectedVideos = [...collectedVideos, ...videoDetails];

        // Prüfen, wie viele ECHTE Longform Videos wir jetzt im Korb haben
        const longCount = collectedVideos.filter(isLongform).length;
        
        console.log(`   --> Seite ${page + 1}: ${videoDetails.length} Videos geladen. Davon Longform (>3min): ${longCount} (Gesamt)`);

        if (longCount >= targetLongCount) {
            console.log(`   ✅ Genug Longform Videos gefunden.`);
            break;
        }

        nextPageToken = data.nextPageToken;
        if (!nextPageToken) break; // Keine weiteren Seiten
        page++;
    }
    
    return collectedVideos;
}

async function getMostViewed() {
    console.log('   Fetching Highlights...');
    const url = `${BASE_URL}/search?part=id&channelId=${CHANNEL_ID}&order=viewCount&type=video&maxResults=20&key=${API_KEY}`;
    const data = await fetchJson(url);
    if (!data.items?.length) return [];
    const videoIds = data.items.map(item => item.id.videoId).join(',');
    return await getVideosByIds(videoIds);
}

// --- Main ---
async function main() {
    await fs.mkdir(DATA_DIR, { recursive: true });

    if (await isCacheValid()) return;

    if (!API_KEY) {
        console.warn('⚠️  KEIN API KEY. Erstelle Dummy-Daten.');
        await fs.writeFile(OUTPUT_FILE, JSON.stringify({ error: "No API Key", generatedAt: new Date().toISOString(), latestVideos: [], latestShorts: [], featured: {}, channel: {} }, null, 2));
        return;
    }

    try {
        const channel = await getChannelData();
        
        // Wir suchen jetzt gezielt nach genug Material
        const allUploads = await getLatestUploadsRecursive(10, 10); 
        const mostViewedRaw = await getMostViewed();

        // 1. Longform Filter: Strikt > 180 Sekunden
        const latestVideos = allUploads.filter(isLongform);
        
        // 2. Shorts Filter: <= 60 Sekunden (Rest wird ignoriert, z.B. 2min Videos)
        const latestShorts = allUploads.filter(isVideoShort);
        
        const featuredLong = mostViewedRaw.find(v => isLongform(v)) || latestVideos[0];
        const featuredShort = mostViewedRaw.find(v => isVideoShort(v)) || latestShorts[0];

        const payload = {
            generatedAt: new Date().toISOString(),
            channel: {
                title: channel.snippet.title,
                description: channel.snippet.description,
                thumbnails: {
                    default: channel.snippet.thumbnails.default,
                    medium: channel.snippet.thumbnails.medium,
                    high: channel.snippet.thumbnails.high
                },
                subscriberCount: channel.statistics.subscriberCount,
                videoCount: channel.statistics.videoCount
            },
            featured: { long: featuredLong, short: featuredShort },
            latestVideos: latestVideos.slice(0, 10), // Hier schneiden wir auf exakt 10 ab
            latestShorts: latestShorts.slice(0, 20)
        };

        await fs.writeFile(OUTPUT_FILE, JSON.stringify(payload, null, 2));
        console.log(`✅ Daten erfolgreich gespeichert: ${OUTPUT_FILE}`);
        
    } catch (error) {
        console.error('❌ FEHLER:', error.message);
        process.exit(1); 
    }
}

main();