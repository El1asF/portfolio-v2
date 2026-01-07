// src/js/api.js

import cacheService from './cacheService.js';
import { MOCK_CHANNEL, MOCK_VIDEOS } from './mockData.js';

// --- KONFIGURATION ---
const API_KEY = 'AIzaSyBcdO9KBv5e0Q5LqwzHp9B9ZC0KYi4FsXU'; 
const CHANNEL_ID = 'UC8VMlZ6CVj7g-f3MMUvyCJw'; 
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

// --- HELPER FUNCTIONS ---

export function formatNumber(num) {
  if (num === undefined || num === null) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + ' Mio.';
  if (num >= 10000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + ' Tsd.';
  return new Intl.NumberFormat('de-DE').format(num);
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

export function formatDuration(duration) {
  if (!duration) return '0:00';
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return '0:00';

  const hours = (match[1] && parseInt(match[1].replace('H', ''))) || 0;
  const minutes = (match[2] && parseInt(match[2].replace('M', ''))) || 0;
  const seconds = (match[3] && parseInt(match[3].replace('S', ''))) || 0;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function formatTimeAgo(publishedAt) {
  return formatDate(publishedAt);
}

// NEU: Zentraler Helper um Sekunden zu berechnen
export function getDurationInSeconds(durationISO) {
  if (!durationISO) return 0;
  const match = durationISO.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;
  
  const hours = parseInt((match[1] || '').replace('H', '')) || 0;
  const minutes = parseInt((match[2] || '').replace('M', '')) || 0;
  const seconds = parseInt((match[3] || '').replace('S', '')) || 0;
  
  return (hours * 3600) + (minutes * 60) + seconds;
}

// --- API FETCH FUNCTIONS ---

export async function getChannelData() {
  try {
    return await cacheService.getOrFetch('channel_data', async () => {
      if (!API_KEY) throw new Error('Kein API Key');
      const url = `${BASE_URL}/channels?part=snippet,statistics,contentDetails&id=${CHANNEL_ID}&key=${API_KEY}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`API Fehler: ${response.status}`);
      const data = await response.json();
      const item = data.items?.[0];
      if (!item) throw new Error('Kanal nicht gefunden');
      return {
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnails: item.snippet.thumbnails,
        subscriberCount: item.statistics.subscriberCount,
        videoCount: item.statistics.videoCount,
        uploadsPlaylistId: item.contentDetails.relatedPlaylists.uploads
      };
    });
  } catch (error) {
    console.warn("API Error (Channel), nutze Mock:", error);
    return MOCK_CHANNEL;
  }
}

export async function getMostViewedVideos(limit = 50) {
  try {
    return await cacheService.getOrFetch('most_viewed_50', async () => {
      if (!API_KEY) throw new Error('Kein API Key');
      const url = `${BASE_URL}/search?part=snippet&channelId=${CHANNEL_ID}&order=viewCount&type=video&maxResults=50&key=${API_KEY}`;
      const searchResponse = await fetch(url);
      if (!searchResponse.ok) throw new Error('Search API Error');
      const searchData = await searchResponse.json();
      if (!searchData.items?.length) return [];
      
      const videoIds = searchData.items.map(item => item.id.videoId).join(',');
      return getVideosByIds(videoIds);
    });
  } catch (error) {
    console.warn("API Error (MostViewed), nutze Mock:", error);
    return MOCK_VIDEOS;
  }
}

export async function getMostViewedShort() {
    try {
        return null; 
    } catch (e) {
        return null;
    }
}

export async function getLatestVideos(limit = 50) {
  try {
    return await cacheService.getOrFetch('latest_uploads_50', async () => {
      if (!API_KEY) throw new Error('Kein API Key');
      const uploadsId = CHANNEL_ID.replace(/^UC/, 'UU');
      const url = `${BASE_URL}/playlistItems?part=snippet,contentDetails&playlistId=${uploadsId}&maxResults=50&key=${API_KEY}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('PlaylistItems API Error');
      const data = await response.json();
      if (!data.items?.length) return [];
      
      const videoIds = data.items.map(item => item.contentDetails.videoId).join(',');
      return getVideosByIds(videoIds);
    });
  } catch (error) {
    console.warn("API Error (LatestVideos), nutze Mock:", error);
    return MOCK_VIDEOS.slice(0, limit);
  }
}

export async function getLatestShorts(limit = 50) {
  try {
    return await cacheService.getOrFetch('latest_shorts_50', async () => {
      if (!API_KEY) throw new Error('Kein API Key');
      const url = `${BASE_URL}/search?part=snippet&channelId=${CHANNEL_ID}&order=date&type=video&videoDuration=short&maxResults=50&key=${API_KEY}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Shorts Search API Error');
      const data = await response.json();
      if (!data.items?.length) return [];
      
      const videoIds = data.items.map(item => item.id.videoId).join(',');
      return getVideosByIds(videoIds);
    });
  } catch (error) {
    console.warn("API Error (Shorts), nutze Mock:", error);
    return MOCK_VIDEOS.filter(v => isVideoShort(v)).slice(0, limit);
  }
}

// --- INTERNE HELPER ---

async function getVideosByIds(videoIds) {
  const url = `${BASE_URL}/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${API_KEY}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Videos API Error');
  const data = await response.json();
  return data.items || [];
}

// Logik angepasst: Nutzt jetzt den Helper
export function isVideoShort(video) {
    const durationISO = video.contentDetails?.duration;
    if (!durationISO) return false;
    
    if (video.snippet?.title?.toLowerCase().includes('#shorts')) return true;

    // Alles bis 60 Sekunden ist ein Short
    return getDurationInSeconds(durationISO) <= 60;
}