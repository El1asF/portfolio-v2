// src/js/youtubePage.js

import { 
  getChannelData, 
  getLatestVideos, 
  getLatestShorts, 
  getMostViewedVideos, 
  formatDate, // formatNumber nehmen wir raus, nutzen eigene Funktion
  isVideoShort,
  getDurationInSeconds 
} from './api.js';

document.addEventListener('DOMContentLoaded', () => {
  initYouTubePage();
});

async function initYouTubePage() {
  await Promise.all([
    loadChannelInfo(),
    loadFeaturedSection(),
    loadLatestVideos(),
    loadLatestShorts()
  ]);
}

// --- HELPER: Views Formatierung (K/M) ---
function formatViews(num) {
  if (!num) return '0';
  const n = parseInt(num);
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toString();
}

// --- HELPER: JSON LADEN (Nur noch als Fallback) ---
async function fetchLocalData(filename) {
  try {
    const response = await fetch(`/data/${filename}`);
    if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Fehler beim Laden von ${filename}:`, error);
    return null;
  }
}

// --- 1. KANAL INFOBOX ---
async function loadChannelInfo() {
  const container = document.getElementById('yt-channel');
  if (!container) return;

  try {
    let channel = null;
    try {
      channel = await getChannelData();
    } catch (e) {
      console.warn('API Error Channel, versuche lokale JSON...');
    }

    if (!channel) {
      const localChannel = await fetchLocalData('channelData.json');
      channel = localChannel ? localChannel.data : null;
    }

    if (!channel) {
      container.innerHTML = '<p class="error">Kanal-Info nicht verfügbar.</p>';
      return;
    }

    const { title, thumbnails, subscriberCount, videoCount } = channel;
    
    // Nur die "1" im Titel färben
    const styledTitle = title.replace(/1/g, '<span class="highlight">1</span>');
    
    const thumbUrl = thumbnails?.high?.url || 
                     thumbnails?.medium?.url || 
                     thumbnails?.default?.url || 
                     '/src/assets/images/portrait.jpg';

    const socials = await fetchLocalData('socials.json');
    const socialLinksHtml = generateSocialLinksHtml(socials || []);

    container.innerHTML = `
      <div class="channel-card">
        <div class="channel-left">
          <img src="${thumbUrl}" alt="${title}" class="channel-thumb">
        </div>
        
        <div class="channel-middle">
          <h3>${styledTitle}</h3>
          <p class="subscriber-count">${formatViews(subscriberCount)} Abonnenten • ${videoCount} Videos</p>
          <a href="https://www.youtube.com/@El1asF?sub_confirmation=1" target="_blank" class="cta channel-cta">
            Zum YouTube Kanal
          </a>
        </div>
        
        <div class="channel-right">
           ${socialLinksHtml}
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Fehler in loadChannelInfo:', error);
  }
}

function generateSocialLinksHtml(socials) {
  if (!Array.isArray(socials)) return '';
  
  return socials.map(social => {
    const iconName = social.platform.toLowerCase() + '-icon.png';
    const iconPath = `/src/assets/images/${iconName}`;
    
    return `
      <a href="${social.url}" target="_blank" class="social-item">
        <img src="${iconPath}" alt="${social.platform}" onerror="this.style.display='none'">
        <div class="social-text">
          <span class="username">${social.username}</span>
          <span class="followers">${formatViews(social.followers)} Follower</span>
        </div>
      </a>
    `;
  }).join('');
}

// --- 2. MEISTGESEHEN ---
async function loadFeaturedSection() {
  const container = document.getElementById('most-viewed-videos');
  if (!container) return;
  container.innerHTML = '';

  try {
    const topVideos = await getMostViewedVideos(50);
    
    let longVideo = topVideos.find(v => !isVideoShort(v));
    let shortVideo = topVideos.find(v => isVideoShort(v));

    if (!longVideo) {
         const localLong = await fetchLocalData('mostViewedVideo.json');
         longVideo = localLong?.data;
    }
    if (!shortVideo) {
         const localShort = await fetchLocalData('mostViewedShort.json');
         shortVideo = localShort?.data;
    }

    if (longVideo) {
      const card = createVideoCard(longVideo, false);
      addDurationOverlay(card, longVideo);
      container.appendChild(card);
    }

    if (shortVideo) {
      const card = createVideoCard(shortVideo, true);
      card.classList.add('featured-short');
      // FIX: Auch beim Featured Short die Dauer anzeigen!
      addDurationOverlay(card, shortVideo);
      container.appendChild(card);
    }

  } catch (error) {
    console.error('Fehler beim Laden der Featured Videos:', error);
    container.innerHTML = '<p class="error">Highlights konnten nicht geladen werden.</p>';
  }
}

// --- 3. LETZTE VIDEOS (Limit erhöht) ---
async function loadLatestVideos() {
  const container = document.getElementById('latest-videos');
  // Wir erhöhen das Limit auf 20, damit die Leiste voller wird.
  // Beachte: Wenn die API nur 50 Items liefert und davon 43 Shorts sind,
  // können wir technisch nur 7 Longform anzeigen.
  const LIMIT = 20; 
  
  try {
    const videos = await getLatestVideos(50);
    
    // FILTER: Nur Videos, die LÄNGER als 3 Minuten (180 Sekunden) sind
    const filtered = videos.filter(v => {
      const sec = getDurationInSeconds(v.contentDetails?.duration);
      return sec > 180;
    });
    
    if (filtered.length > 0) {
      renderList(container, filtered.slice(0, LIMIT), false);
      return;
    }
  } catch (e) {
    console.warn('API Latest Videos Problem:', e);
  }

  // Fallback
  const localData = await fetchLocalData('allVideos.json');
  if (localData && localData.data) {
    const filtered = localData.data.filter(v => {
      const sec = getDurationInSeconds(v.contentDetails?.duration);
      return sec > 180;
    });
    renderList(container, filtered.slice(0, LIMIT), false);
  }
}

// --- 4. LETZTE SHORTS (Limit erhöht) ---
async function loadLatestShorts() {
  const container = document.getElementById('latest-shorts');
  const LIMIT = 30;

  try {
    const shorts = await getLatestShorts(50);
    const filtered = shorts.filter(v => isVideoShort(v));

    if (filtered.length > 0) {
      renderList(container, filtered.slice(0, LIMIT), true);
      return;
    }
  } catch (e) {
    console.warn('API Shorts Problem:', e);
  }

  // Fallback
  const localData = await fetchLocalData('allVideos.json');
  if (localData && localData.data) {
    const filtered = localData.data.filter(v => isVideoShort(v));
    renderList(container, filtered.slice(0, LIMIT), true);
  }
}

// --- RENDER & HELPER FUNKTIONEN ---

function renderList(container, videos, isShort) {
  if (!container) return;
  container.innerHTML = '';
  
  if (!videos || videos.length === 0) {
    container.innerHTML = '<p class="text-box">Keine Videos gefunden.</p>';
    return;
  }

  videos.forEach(video => {
    const card = createVideoCard(video, isShort);
    addDurationOverlay(card, video);
    container.appendChild(card);
  });
}

function createVideoCard(video, isShort) {
  let videoId = video.id;
  if (typeof videoId === 'object' && videoId.videoId) {
    videoId = videoId.videoId;
  }

  const snippet = video.snippet || {};
  const stats = video.statistics || {};
  const title = snippet.title || 'Video Titel';
  
  const thumbnails = snippet.thumbnails || {};
  const thumb = thumbnails.maxres?.url || 
                thumbnails.standard?.url || 
                thumbnails.high?.url || 
                thumbnails.medium?.url || '';
  
  // Neue Formatierung nutzen
  const views = stats.viewCount ? formatViews(stats.viewCount) + ' Aufrufe' : '';
  const date = formatDate(snippet.publishedAt);

  const card = document.createElement('div');
  card.className = isShort ? 'video-card short-card' : 'video-card long-card';

  card.innerHTML = `
    <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank">
      <div class="video-thumbnail">
        <div class="thumbnail-mask">
          <img src="${thumb}" alt="${title}" loading="lazy">
        </div>
      </div>
      <div class="${isShort ? 'short-info' : 'video-info'}">
        <h4 title="${title}">${title}</h4>
        <div class="meta">
          <span class="views">${views}</span>
          ${!isShort ? ` • <span class="date">${date}</span>` : ''}
        </div>
      </div>
    </a>
  `;
  return card;
}

function addDurationOverlay(cardElement, videoData) {
  const durationISO = videoData.contentDetails?.duration;
  if (durationISO) {
    const timeStr = formatDurationISO(durationISO);
    if (timeStr) {
      const thumb = cardElement.querySelector('.video-thumbnail');
      if (thumb && !thumb.querySelector('.duration-overlay')) {
           thumb.insertAdjacentHTML('beforeend', `<span class="duration-overlay">${timeStr}</span>`);
      }
    }
  }
}

function formatDurationISO(duration) {
  if (!duration) return '';
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return '';
  const h = (match[1] || '').replace('H', '');
  const m = (match[2] || '').replace('M', '');
  const s = (match[3] || '').replace('S', '');
  
  if (h) return `${h}:${m.padStart(2,'0')}:${s.padStart(2,'0')}`;
  return `${m || '0'}:${s.padStart(2,'0')}`;
}