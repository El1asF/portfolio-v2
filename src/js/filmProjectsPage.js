// filmProjectsPage.js
// Dieses Modul wird auf der Film & Projekte‑Seite geladen und sorgt dafür,
// dass die Timeline aus den JSON‑Daten generiert wird.

import { initFilmprojekteTimeline } from './filmprojekteRenderer.js';

document.addEventListener('DOMContentLoaded', () => {
  initFilmprojekteTimeline();
});