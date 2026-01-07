// src/js/timelineRenderer.js
import { formatDate, formatAufgaben } from './dataLoader.js';

/**
 * Rendert eine Timeline (Film oder Andere) in einen Container.
 */
export function renderTimeline(items, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!items || items.length === 0) {
    container.innerHTML = '<p class="text-box">Aktuell keine Einträge vorhanden.</p>';
    return;
  }

  // Layout vorbereiten
  container.innerHTML = '';
  container.classList.add('vertical-timeline');

  // Sortieren nach Datum (neu -> alt)
  items.sort((a, b) => {
    const dateA = (a.datum || '').split('-');
    const dateB = (b.datum || '').split('-');
    if (dateA[0] !== dateB[0]) return dateB[0] - dateA[0];
    if (dateA.length > 1 && dateB.length > 1) return dateB[1] - dateA[1];
    return 0;
  });

  items.forEach(item => {
    container.appendChild(createTimelineItem(item));
  });
}

function createTimelineItem(project) {
  const timelineItem = document.createElement('div');
  timelineItem.className = 'timeline-item';
  
  // 1. Link-Bestimmung
  // - ID vorhanden? -> Detailseite
  // - Keine ID, aber Link? -> Externer Link
  // - Weder noch -> Kein Link
  
  let targetUrl = null;
  let isInternalDetail = false;

  if (project.id) {
      targetUrl = `project-detail.html?id=${project.id}`;
      isInternalDetail = true;
  } else if (project.link) {
      targetUrl = project.link;
  }

  // 2. Titel-Element bauen
  // Wenn Link existiert, machen wir den Titel interaktiv (Klasse .interactive-title)
  let titleHtml = '';
  if (targetUrl) {
      const targetAttr = isInternalDetail ? '' : 'target="_blank"';
      titleHtml = `
        <a href="${targetUrl}" ${targetAttr} class="project-name-box interactive-title" style="text-decoration: none;">
            ${project.titel}
        </a>
      `;
  } else {
      titleHtml = `<span class="project-name-box">${project.titel}</span>`;
  }

  // 3. Medien-Content bauen (Bild oder Video)
  let mediaHtml = '';
  
  // A) Bild ist gesetzt
  if (project.image && project.image.trim() !== '') {
      const imgContent = `<img src="${project.image.trim()}" alt="${project.titel}" />`;
      
      // Wenn Link existiert, Bild verlinken
      if (targetUrl) {
          const targetAttr = isInternalDetail ? '' : 'target="_blank"';
          mediaHtml = `<a href="${targetUrl}" ${targetAttr}>${imgContent}</a>`;
      } else {
          mediaHtml = imgContent;
      }
      
  } 
  // B) Video ist gesetzt
  else if (project.videolink && project.videolink.trim() !== '') {
      let embedSrc = project.videolink.trim();
      try {
        const urlObj = new URL(project.videolink);
        const vid = urlObj.searchParams.get('v');
        if (vid) embedSrc = `https://www.youtube-nocookie.com/embed/${vid}`;
      } catch (e) {}
      
      mediaHtml = `
        <iframe 
          src="${embedSrc}" 
          title="${project.titel}" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowfullscreen>
        </iframe>
      `;
  }

  // Wenn Medien vorhanden sind, in die Card-Struktur verpacken
  let finalMediaBlock = '';
  if (mediaHtml) {
      finalMediaBlock = `
        <div class="timeline-video">
           <div class="video-card long-card standalone">
             <div class="video-thumbnail">
               <div class="thumbnail-mask">
                 ${mediaHtml}
               </div>
             </div>
           </div>
        </div>
      `;
  }

  // HTML zusammenbauen
  timelineItem.innerHTML = `
    <div class="timeline-content">
      <div class="timeline-date">${formatDate(project.datum)}</div>
      <div>
        ${titleHtml}
        <span class="project-description">${project.beschreibung || ''}</span>
      </div>
      ${formatAufgaben(project.aufgaben) ? `<p class="project-role">${formatAufgaben(project.aufgaben)}</p>` : ''}
    </div>
    ${finalMediaBlock}
  `;

  return timelineItem;
}