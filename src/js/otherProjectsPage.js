// otherProjectsPage.js
import { loadOtherProjects } from './dataLoader.js';
import { renderTimeline } from './timelineRenderer.js';

document.addEventListener('DOMContentLoaded', async () => {
  try {
      const data = await loadOtherProjects();
      renderTimeline(data, 'other-projects');
  } catch (e) {
      console.error(e);
  }
});