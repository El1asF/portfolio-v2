// src/js/app.js

import '../styles/main.scss';
import { injectHeader, injectFooter, initScrollControls } from './layoutManager.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Layout aufbauen
  injectHeader();
  injectFooter();

  // 2. Features initialisieren
  initScrollControls();
  
  // FIX: FOUC verhindern
  // Das Inline-Style im HTML Head setzt opacity: 0.
  // Hier setzen wir es auf 1, sobald JS geladen und Layout injiziert ist.
  setTimeout(() => {
    document.body.style.opacity = '1';
  }, 50); // Kleiner Timeout zur Sicherheit, damit Browser rendern kann
  
  console.log('App initialized');
});