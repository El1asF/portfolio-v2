import { loadFilmprojekte, loadOtherProjects, formatDate } from './dataLoader.js';

function getImageUrl(imageSource) {
    if (!imageSource) return null;
    if (imageSource.startsWith('http')) return imageSource;
    const cleanName = imageSource.replace(/^(\.\/|\/)/, '');
    const filename = cleanName.split('/').pop();

    try {
        return new URL(`../assets/images/${filename}`, import.meta.url).href;
    } catch (e) {
        console.warn('Bild-Pfad konnte nicht aufgelöst werden:', filename);
        return imageSource;
    }
}

async function init() {
  const titleEl = document.getElementById('detail-title');
  const params = new URLSearchParams(window.location.search);
  const projectId = params.get('id');

  if (!projectId) {
    titleEl.textContent = 'Fehler: Keine ID.';
    return;
  }

  try {
      const [films, others] = await Promise.all([
          loadFilmprojekte(),
          loadOtherProjects()
      ]);

      const allProjects = [...(films || []), ...(others || [])];
      const project = allProjects.find(p => String(p.id) === String(projectId));

      if (!project) {
        titleEl.textContent = 'Projekt nicht gefunden.';
        return;
      }

      renderDetail(project);

  } catch (error) {
      console.error("Fehler:", error);
      titleEl.textContent = 'Ladefehler.';
      titleEl.style.color = 'red';
  }
}

// Hilfsfunktion: Baut eine einzelne Kachel als HTML-String
function createTileHTML(title, contentHTML, isFullWidth = true) {
    return `
      <div class="info-tile-wrapper" style="${isFullWidth ? 'width: 100%;' : ''}">
          <div class="info-tile-label">${title}</div>
          <div class="info-tile-content">
              ${contentHTML}
          </div>
      </div>
    `;
}

function renderDetail(project) {
  // 1. Header (Titel & Datum)
  document.title = `${project.titel} – Details`;
  document.getElementById('detail-title').textContent = project.titel;
  document.getElementById('detail-date').textContent = formatDate(project.datum);

  // 2. Main Media
  const mediaContainer = document.getElementById('detail-main-media');
  mediaContainer.innerHTML = '';
  let mediaContent = '';

  if (project.videolink && project.videolink.trim() !== '') {
      let src = project.videolink;
      try {
        if(src.includes('youtube') || src.includes('youtu.be')) {
            const u = new URL(src);
            let v = u.searchParams.get('v');
            if(!v && src.includes('youtu.be')) v = u.pathname.slice(1);
            if (v) src = `https://www.youtube-nocookie.com/embed/${v}`;
        }
      } catch(e){}
      mediaContent = `<iframe src="${src}" allowfullscreen></iframe>`;
  } else if (project.image) {
      const resolvedImg = getImageUrl(project.image);
      mediaContent = `<img src="${resolvedImg}" alt="${project.titel}">`;
  }

  if (mediaContent) {
      mediaContainer.innerHTML = `
        <div class="video-card long-card standalone">
            <div class="video-thumbnail">
                <div class="thumbnail-mask">
                    ${mediaContent}
                </div>
            </div>
        </div>
      `;
  }

  // 3. DYNAMISCHE KACHELN AUFBAUEN
  const contentArea = document.getElementById('dynamic-content-area');
  contentArea.innerHTML = '';

  // A) Kurzbeschreibung & Rollen (Erste Kachel)
  let rolesHTML = '';
  if (project.aufgaben && project.aufgaben.length > 0) {
      rolesHTML = `<div style="margin-top: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
        ${project.aufgaben.map(role => 
            `<span style="background-color: #2e2b2a; color: #dfc8a5; font-size: 0.8rem; padding: 0.2rem 0.6rem; font-weight: 500;">${role}</span>`
        ).join('')}
      </div>`;
  }
  
  if (project.beschreibung) {
      const descContent = `<p style="font-size: 1.2rem; font-weight: 500; line-height: 1.5;">${project.beschreibung}</p>${rolesHTML}`;
      contentArea.innerHTML += createTileHTML('Überblick', descContent);
  }

  // B) Info Tiles Grid (Mittlerer Teil)
  if (project.infoTiles && project.infoTiles.length > 0) {
      let gridHTML = '<div class="info-tiles-grid" style="margin-top: 0;">';
      project.infoTiles.forEach(tile => {
          // Wir bauen das HTML für die inneren Kacheln manuell, damit sie ins Grid passen
          gridHTML += `
            <div class="info-tile-wrapper">
                <div class="info-tile-label">${tile.title}</div>
                <div class="info-tile-content">
                    <p>${tile.content}</p>
                </div>
            </div>
          `;
      });
      gridHTML += '</div>';
      contentArea.innerHTML += gridHTML;
  }

  // C) Langbeschreibung (Letzte Kachel)
  if (project.langbeschreibung) {
      const longText = project.langbeschreibung.replace(/\n/g, '<br>');
      const longContent = `<div style="line-height: 1.8;">${longText}</div>`;
      contentArea.innerHTML += createTileHTML('Details & Hintergründe', longContent);
  }

  // 4. Galerie
  const gallerySec = document.getElementById('gallery-section');
  const galleryGrid = document.getElementById('detail-gallery');
  galleryGrid.innerHTML = ''; 
  
  if (project.gallery && project.gallery.length > 0) {
      gallerySec.style.display = 'block';
      project.gallery.forEach(item => {
          const div = document.createElement('div');
          div.className = 'video-card standalone gallery-item';
          let inner = '';
          if (item.type === 'video') {
             let src = item.src;
             if(src.includes('youtube') || src.includes('youtu.be')) {
                 try {
                     const u = new URL(src);
                     let v = u.searchParams.get('v');
                     if(!v && src.includes('youtu.be')) v = u.pathname.slice(1);
                     if(v) src = `https://www.youtube-nocookie.com/embed/${v}`;
                 } catch(e){}
             }
             inner = `<iframe src="${src}" allowfullscreen loading="lazy"></iframe>`;
          } else {
             const resolvedGalleryImg = getImageUrl(item.src);
             inner = `<img src="${resolvedGalleryImg}" loading="lazy" alt="Galeriebild">`;
          }
          div.innerHTML = `
            <div class="video-thumbnail">
                <div class="thumbnail-mask">${inner}</div>
            </div>
          `;
          galleryGrid.appendChild(div);
      });
  } else {
      gallerySec.style.display = 'none';
  }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}