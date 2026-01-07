import { loadFilmprojekte, loadOtherProjects, formatDate } from './dataLoader.js';

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const projectId = params.get('id');

  if (!projectId) {
    document.getElementById('detail-title').textContent = 'Fehler: Keine ID angegeben.';
    return;
  }

  // Wir suchen in BEIDEN Listen nach der ID
  const [films, others] = await Promise.all([
      loadFilmprojekte(),
      loadOtherProjects()
  ]);

  // Array zusammenfügen und suchen
  const allProjects = [...(films || []), ...(others || [])];
  const project = allProjects.find(p => p.id === projectId);

  if (!project) {
    document.getElementById('detail-title').textContent = 'Projekt nicht gefunden.';
    return;
  }

  renderDetail(project);
});

function renderDetail(project) {
  // Titel
  document.title = `${project.titel} – Details`;
  document.getElementById('detail-title').textContent = project.titel;
  
  // Datum
  document.getElementById('detail-date').textContent = formatDate(project.datum);

  // Rollen
  const rolesContainer = document.getElementById('detail-roles');
  if (project.aufgaben && project.aufgaben.length > 0) {
      project.aufgaben.forEach(role => {
          const span = document.createElement('span');
          span.className = 'role-tag';
          span.textContent = role;
          rolesContainer.appendChild(span);
      });
  }

  // Texte
  document.getElementById('detail-description').textContent = project.beschreibung || '';
  const longDesc = document.getElementById('detail-long-description');
  if (project.langbeschreibung) {
      longDesc.innerHTML = project.langbeschreibung.replace(/\n/g, '<br>');
  }

  // Haupt-Medien (Video hat Vorrang vor Bild)
  const mediaContainer = document.getElementById('detail-main-media');
  let mediaContent = '';

  if (project.videolink) {
      let src = project.videolink;
      try {
        const u = new URL(src);
        const v = u.searchParams.get('v');
        if (v) src = `https://www.youtube-nocookie.com/embed/${v}`;
      } catch(e){}
      
      mediaContent = `<iframe src="${src}" allowfullscreen></iframe>`;
  } else if (project.image) {
      mediaContent = `<img src="${project.image}" alt="${project.titel}">`;
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

  // Galerie
  if (project.gallery && project.gallery.length > 0) {
      const gallerySec = document.getElementById('gallery-section');
      const galleryGrid = document.getElementById('detail-gallery');
      gallerySec.style.display = 'block';

      project.gallery.forEach(item => {
          const div = document.createElement('div');
          div.className = 'video-card standalone gallery-item';
          
          let inner = '';
          if (item.type === 'video') {
             let src = item.src;
             // einfache check logic für youtube
             if(src.includes('youtube')) {
                 try {
                     const u = new URL(src);
                     const v = u.searchParams.get('v');
                     if(v) src = `https://www.youtube-nocookie.com/embed/${v}`;
                 } catch(e){}
             }
             inner = `<iframe src="${src}" allowfullscreen loading="lazy"></iframe>`;
          } else {
             inner = `<img src="${item.src}" loading="lazy">`;
          }

          div.innerHTML = `
            <div class="video-thumbnail">
                <div class="thumbnail-mask">${inner}</div>
            </div>
          `;
          galleryGrid.appendChild(div);
      });
  }
}