import { formatNumber, formatDate, formatDurationISO } from './api.js';

// Importiere generierte und statische Daten
import youtubeData from '../data/youtubeData.json';
import socialsData from '../data/socials.json';

document.addEventListener('DOMContentLoaded', () => {
  if (!youtubeData || youtubeData.error) {
    const container = document.getElementById('yt-channel');
    if (container) container.innerHTML = '<div class="text-box">Daten werden geladen... (Build Script erforderlich)</div>';
    return;
  }
  
  renderChannelInfo();
  renderFeatured();
  renderVideos(youtubeData.latestVideos, 'latest-videos', false);
  renderVideos(youtubeData.latestShorts, 'latest-shorts', true);
});

function renderChannelInfo() {
  const container = document.getElementById('yt-channel');
  if (!container) return;

  const { channel } = youtubeData;
  if (!channel) return;

  const styledTitle = channel.title ? channel.title.replace(/1/g, '<span class="highlight">1</span>') : 'Kanal';
  
  // FIX: Priorisiere High-Res Thumbnail
  // Wir prüfen sicherheitshalber, ob 'high' existiert, sonst medium, sonst default.
  const thumb = channel.thumbnails?.high?.url || 
                channel.thumbnails?.medium?.url || 
                channel.thumbnails?.default?.url || 
                '/src/assets/images/portrait.jpg'; // Fallback Bild

  const socialHtml = socialsData.map(s => {
    const iconPath = `/src/assets/images/${s.platform.toLowerCase()}-icon.png`;
    
    return `
      <a href="${s.url}" target="_blank" class="social-item">
        <img src="${iconPath}" alt="${s.platform}" onerror="this.style.display='none'">
        <div class="social-text">
          <span class="username">${s.username}</span>
          <span class="followers">${formatNumber(s.followers)} Follower</span>
        </div>
      </a>
    `;
  }).join('');

  container.innerHTML = `
    <div class="channel-card">
      <div class="channel-left">
        <img src="${thumb}" alt="${channel.title}" class="channel-thumb">
      </div>
      <div class="channel-middle">
        <h3>${styledTitle}</h3>
        <p class="subscriber-count">${formatNumber(channel.subscriberCount)} Abonnenten • ${channel.videoCount} Videos</p>
        <a href="https://www.youtube.com/@El1asF?sub_confirmation=1" target="_blank" class="cta channel-cta">
          Zum YouTube Kanal
        </a>
      </div>
      <div class="channel-right">
         ${socialHtml}
      </div>
    </div>
  `;
}

function renderFeatured() {
  const container = document.getElementById('most-viewed-videos');
  if (!container || !youtubeData.featured) return;
  
  const { featured } = youtubeData;
  container.innerHTML = '';

  if (featured.long) {
    container.appendChild(createVideoCard(featured.long, false));
  }
  if (featured.short) {
    const card = createVideoCard(featured.short, true);
    card.classList.add('featured-short');
    container.appendChild(card);
  }
}

function renderVideos(videos, containerId, isShort) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = '';
  
  if (!videos || videos.length === 0) {
    container.innerHTML = '<p class="text-box">Aktuell keine Videos verfügbar.</p>';
    return;
  }

  videos.forEach(video => {
    container.appendChild(createVideoCard(video, isShort));
  });
}

function createVideoCard(video, isShort) {
  if (!video) return document.createElement('div');

  const videoId = typeof video.id === 'string' ? video.id : video.id?.videoId;
  const snippet = video.snippet || {};
  
  const thumb = snippet.thumbnails?.maxres?.url || 
                snippet.thumbnails?.standard?.url || 
                snippet.thumbnails?.high?.url || 
                snippet.thumbnails?.medium?.url;

  const card = document.createElement('div');
  card.className = isShort ? 'video-card short-card' : 'video-card long-card';

  let durationHtml = '';
  const durationISO = video.contentDetails?.duration;
  if (durationISO) {
      const timeStr = formatDurationISO(durationISO);
      if (timeStr) durationHtml = `<span class="duration-overlay">${timeStr}</span>`;
  }

  const views = video.statistics?.viewCount ? formatNumber(video.statistics.viewCount) + ' Aufrufe' : '';
  const date = formatDate(snippet.publishedAt);

  card.innerHTML = `
    <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank">
      <div class="video-thumbnail">
        <div class="thumbnail-mask">
          <img src="${thumb}" alt="${snippet.title}" loading="lazy">
        </div>
        ${durationHtml}
      </div>
      <div class="${isShort ? 'short-info' : 'video-info'}">
        <h4 title="${snippet.title}">${snippet.title}</h4>
        <div class="meta">
          <span class="views">${views}</span>
          ${!isShort ? ` • <span class="date">${date}</span>` : ''}
        </div>
      </div>
    </a>
  `;
  return card;
}