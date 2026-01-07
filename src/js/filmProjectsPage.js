// filmProjectsPage.js
import { loadFilmprojekte } from './dataLoader.js';
import { renderTimeline } from './timelineRenderer.js';

document.addEventListener('DOMContentLoaded', async () => {
  try {
      const data = await loadFilmprojekte();
      renderTimeline(data, 'film-timeline');
  } catch (e) {
      console.error(e);
  }
});