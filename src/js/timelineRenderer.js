import { formatDate, formatAufgaben } from './dataLoader.js';

function getImageUrl(imageSource) {
    if (!imageSource) return null;
    if (imageSource.startsWith('http')) return imageSource;
    const cleanName = imageSource.replace(/^(\.\/|\/)/, '');
    const filename = cleanName.split('/').pop();
    try {
        return new URL(`../assets/images/${filename}`, import.meta.url).href;
    } catch (e) {
        return imageSource;
    }
}

export function renderTimeline(items, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!items || items.length === 0) {
    container.innerHTML = '<p class=\"text-box\">Aktuell keine Einträge vorhanden.</p>';
    return;
  }

  container.innerHTML = '';
  container.classList.add('vertical-timeline');

  // Sortierung: Neueste zuerst
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
  
  // URL Logik
  let targetUrl = null;
  let isInternalDetail = false;

  if (project.id) {
      // WICHTIG: Slash am Anfang (absolute Pfade) verhindert Fehler auf Unterseiten/Netlify
      targetUrl = `/project-detail.html?id=${project.id}`;
      isInternalDetail = true;
  } else if (project.link) {
      targetUrl = project.link;
  }

  // Titel
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

  // Medien
  let mediaHtml = '';
  if (project.image && project.image.trim() !== '') {
      const resolvedImage = getImageUrl(project.image.trim());
      const imgContent = `<img src="${resolvedImage}" alt="${project.titel}" loading="lazy" />`;
      
      if (targetUrl) {
          const targetAttr = isInternalDetail ? '' : 'target="_blank"';
          mediaHtml = `<a href="${targetUrl}" ${targetAttr}>${imgContent}</a>`;
      } else {
          mediaHtml = imgContent;
      }
  } 
  else if (project.videolink && project.videolink.trim() !== '') {
      let embedSrc = project.videolink.trim();
      try {
        if(embedSrc.includes('youtube') || embedSrc.includes('youtu.be')) {
             const u = new URL(embedSrc);
             let vid = u.searchParams.get('v');
             if(!vid && embedSrc.includes('youtu.be')) vid = u.pathname.slice(1);
             if (vid) embedSrc = `https://www.youtube-nocookie.com/embed/${vid}`;
        }
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