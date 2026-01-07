// filmprojekteRenderer.js
// Modul zur dynamischen Generierung der Filmprojekte-Timeline

import { loadFilmprojekte, formatDate, formatAufgaben } from './dataLoader.js';

/**
 * Initialisiert die Filmprojekte-Timeline
 */

export async function initFilmprojekteTimeline() {

  try {
    // Filmprojekte laden
    const filmprojekte = await loadFilmprojekte();
    
    if (!filmprojekte || filmprojekte.length === 0) {
      console.error('Keine Filmprojekte gefunden');
      return;
    }
    
    // Container für die Timeline finden
    // In der neuen Version befindet sich die Timeline in einem Element mit der ID
    // "film-timeline". Dadurch entfällt die Abhängigkeit vom alten CSS‑Selektor.
    const timelineContainer = document.querySelector('#film-timeline');
    if (!timelineContainer) {
      console.error('Timeline-Container nicht gefunden');
      return;
    }
    // Container leeren
    timelineContainer.innerHTML = '';
    
    // Filmprojekte sortieren (neueste zuerst)
    filmprojekte.sort((a, b) => {
      // Extrahiere das Jahr und den Monat für den Vergleich
      const dateA = a.datum.split('-');
      const dateB = b.datum.split('-');
      
      // Vergleiche zuerst das Jahr
      if (dateA[0] !== dateB[0]) {
        return dateB[0] - dateA[0];
      }
      
      // Bei gleichem Jahr vergleiche den Monat (falls vorhanden)
      if (dateA.length > 1 && dateB.length > 1) {
        return dateB[1] - dateA[1];
      }
      
      return 0;
    });
    
    // Filmprojekte rendern
    filmprojekte.forEach(projekt => {
      const timelineItem = createTimelineItem(projekt);
      timelineContainer.appendChild(timelineItem);
    });
    
  } catch (error) {
    console.error('Fehler beim Initialisieren der Filmprojekte-Timeline:', error);
  }
}

/**
 * Erstellt ein Timeline-Item für ein Filmprojekt
 * @param {Object} projekt - Das Filmprojekt-Objekt
 * @returns {HTMLElement} - Das erstellte Timeline-Item
 */
function createTimelineItem(projekt) {
  const timelineItem = document.createElement('div');
  timelineItem.className = 'timeline-item';
  
  // Datum formatieren
  const formattedDate = formatDate(projekt.datum);
  
  // Aufgaben formatieren
  const formattedAufgaben = formatAufgaben(projekt.aufgaben);
  
  // HTML für das Timeline-Item erstellen: Datum, Name-Box, Beschreibung und Aufgaben
  let timelineHTML = `
    <div class="timeline-content">
      <div class="timeline-date">${formattedDate}</div>
      <div>
        <span class="project-name-box">${projekt.titel}</span><span class="project-description">${projekt.beschreibung || ''}</span>
      </div>
      ${formattedAufgaben ? `<p class="project-role">${formattedAufgaben}</p>` : ''}
    </div>
  `;
  // Bild oder Video hinzufügen, falls vorhanden. Falls "image" gesetzt ist,
  // wird ein Bild mit optionalem Link verwendet. Andernfalls wird der
  // Videolink als YouTube-Embed eingefügt. Video‑Links können normale
  // watch‑URLs enthalten (mit Parametern wie &t=…). Es wird versucht,
  // die Video‑ID zu extrahieren und in eine embed‑URL umzuwandeln. Falls
  // keine ID gefunden wird, wird der Link direkt verwendet.
  if (projekt.image && projekt.image.trim() !== '') {
    const target = projekt.link && projekt.link.trim() !== '' ? projekt.link.trim() : projekt.videolink || '';
    const imagePath = projekt.image.trim();
    timelineHTML += `
      <div class="timeline-video">
        <a href="${target}" target="_blank">
          <img src="${imagePath}" alt="${projekt.titel}" />
        </a>
      </div>
    `;
  } else if (projekt.videolink && projekt.videolink.trim() !== '') {
    let embedSrc = projekt.videolink.trim();
    try {
      const urlObj = new URL(projekt.videolink);
      const vid = urlObj.searchParams.get('v');
      if (vid) {
        embedSrc = `https://www.youtube.com/embed/${vid}`;
      }
    } catch (e) {
      // Fallback: belasse embedSrc wie übergeben
    }
    timelineHTML += `
      <div class="timeline-video">
        <iframe
          src="${embedSrc}"
          title="${projekt.titel}"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen></iframe>
      </div>
    `;
  }
  timelineItem.innerHTML = timelineHTML;
  return timelineItem;
}
