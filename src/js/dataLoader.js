// src/js/dataLoader.js

// Statische Imports der JSON-Dateien
// Vite bündelt diese Daten direkt in den Build.
import filmprojekteData from '../data/filmprojekte.json';
import otherProjectsData from '../data/otherprojects.json';

// Falls du noch mehr Daten hast, hier importieren:
// import skillsData from '../data/skills.json';
// import lebenslaufData from '../data/lebenslauf.json';

export async function loadFilmprojekte() {
  return filmprojekteData;
}

export async function loadOtherProjects() {
  return otherProjectsData;
}

export async function loadLebenslauf() {
  // return lebenslaufData; 
  return [];
}

export async function loadSkills() {
  // return skillsData;
  return [];
}

// --- Helper ---

export function formatDate(raw) {
  if (!raw) return '';
  if (raw.includes('heute')) return raw;

  const parts = raw.split('-');
  if (parts.length === 2 && parts[1].length === 2) return raw;
  if (parts.length === 2 && parts[1].length === 4) return raw;
  
  return raw;
}

export function formatAufgaben(aufgaben) {
  if (!aufgaben || !Array.isArray(aufgaben) || aufgaben.length === 0) {
    return '';
  }
  return aufgaben.join(', ') + '.';
}