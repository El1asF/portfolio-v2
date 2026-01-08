// src/js/dataLoader.js

import filmprojekteData from '../data/filmprojekte.json';
import otherProjectsData from '../data/otherprojects.json';

// Wir geben die Daten sicher zurück. 
// Falls imports undefined wären (was bei JSON Modulen selten ist, aber möglich), fangen wir es ab.

export async function loadFilmprojekte() {
  return filmprojekteData || [];
}

export async function loadOtherProjects() {
  return otherProjectsData || [];
}

// Helper Funktionen (unverändert wichtig)
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