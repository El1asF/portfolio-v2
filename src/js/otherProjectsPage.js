// otherProjectsPage.js
// Dieses Modul generiert die Timeline für weitere kreative Arbeiten.

import { loadOtherProjects } from './dataLoader.js';

/**
 * Beim Laden des Dokuments initialisieren wir die Timeline für die
 * "Weitere Arbeiten"‑Seite. Diese orientiert sich an der Film‑Timeline
 * und verwendet dieselben CSS‑Klassen, sodass das Layout konsistent ist.
 */
document.addEventListener('DOMContentLoaded', () => {
  initOtherProjectsTimeline();
});

async function initOtherProjectsTimeline() {
  const container = document.getElementById('other-projects');
  if (!container) return;
  try {
    const projects = await loadOtherProjects();
    if (!projects || projects.length === 0) {
      container.textContent = 'Weitere Arbeiten werden bald ergänzt.';
      return;
    }
    // Verwende die vertikale Timeline-Struktur
    container.classList.add('vertical-timeline');
    container.innerHTML = '';
    projects.forEach(project => {
      const item = document.createElement('div');
      item.className = 'timeline-item';
      let html = '';
      html += `
        <div class="timeline-content">
          <div>
            <span class="project-name-box">${project.titel}</span><span class="project-description">${project.beschreibung || ''}</span>
          </div>
        </div>
      `;
      // Medien: entweder Bild mit Link oder Video
      if (project.image && project.image.trim() !== '') {
        const target = project.link && project.link.trim() !== '' ? project.link.trim() : (project.videolink || '');
        const imagePath = project.image.trim();
        html += `
          <div class="timeline-video">
            <a href="${target}" target="_blank">
              <img src="${imagePath}" alt="${project.titel}" />
            </a>
          </div>
        `;
      } else if (project.videolink && project.videolink.trim() !== '') {
        let embedSrc = project.videolink.trim();
        try {
          const urlObj = new URL(project.videolink);
          const vid = urlObj.searchParams.get('v');
          if (vid) {
            embedSrc = `https://www.youtube.com/embed/${vid}`;
          }
        } catch (e) {
          // belasse embedSrc unverändert
        }
        html += `
          <div class="timeline-video">
            <iframe src="${embedSrc}" title="${project.titel}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
          </div>
        `;
      }
      item.innerHTML = html;
      container.appendChild(item);
    });
  } catch (error) {
    console.error('Fehler beim Laden der weiteren Arbeiten:', error);
    container.textContent = 'Weitere Arbeiten konnten nicht geladen werden.';
  }
}