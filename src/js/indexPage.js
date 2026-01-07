// src/js/indexPage.js

import { formatNumber } from './api.js';

// WICHTIG: Wir laden jetzt die statischen Daten, die das Build-Skript erzeugt hat.
// Keine API-Calls mehr im Client!
import youtubeData from '../data/youtubeData.json';

document.addEventListener('DOMContentLoaded', () => {
  
  // 1. Abonnentenzahl laden
  const infoEl = document.getElementById('subscriber-info');
  if (infoEl) {
    // Prüfen ob Daten im JSON vorhanden sind
    if (youtubeData && youtubeData.channel && youtubeData.channel.subscriberCount) {
      infoEl.textContent = formatNumber(youtubeData.channel.subscriberCount) + ' Abonnenten';
    } else {
      // Fallback, falls Daten fehlen (z.B. beim ersten lokalen Start ohne fetch)
      infoEl.textContent = ''; 
    }
  }

  // 2. Kontaktformular initialisieren
  initContactForm();
});

function initContactForm() {
  const form = document.querySelector('.contact-card form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button');
    const originalText = btn.textContent;
    
    // UI Loading State
    btn.textContent = 'Sende...';
    btn.disabled = true;

    const formData = new FormData(form);

    try {
      // AJAX Request an Formspree
      const response = await fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        form.reset();
        showStatus(form, 'success', 'Deine Nachricht wurde erfolgreich gesendet!');
      } else {
        const data = await response.json();
        if (Object.hasOwn(data, 'errors')) {
          const errMsg = data.errors.map(err => err.message).join(", ");
          showStatus(form, 'error', 'Fehler: ' + errMsg);
        } else {
           showStatus(form, 'error', 'Beim Senden ist ein Fehler aufgetreten.');
        }
      }
    } catch (error) {
      showStatus(form, 'error', 'Verbindungsfehler. Bitte prüfe deine Internetverbindung.');
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });
}

function showStatus(form, type, msg) {
  // Alte Status-Meldungen entfernen
  const existing = form.parentNode.querySelector('.form-status');
  if (existing) existing.remove();

  // Neue Meldung erstellen
  const statusDiv = document.createElement('div');
  statusDiv.className = `form-status ${type}`;
  statusDiv.textContent = msg;
  
  // Vor dem Formular einfügen
  form.parentNode.insertBefore(statusDiv, form);
  
  // Nach 5 Sekunden ausblenden
  setTimeout(() => {
    statusDiv.style.opacity = '0';
    setTimeout(() => statusDiv.remove(), 500); // Warten bis Fade-Out fertig
  }, 5000);
}