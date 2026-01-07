// src/js/mockData.js
// Fallback-Daten, falls die API streikt oder das Quota leer ist.

export const MOCK_CHANNEL = {
  title: "El1as.F (Offline Mode)",
  description: "Dies sind statische Fallback-Daten, da die API nicht erreichbar ist.",
  thumbnails: {
    high: { url: "/src/assets/images/portrait.jpg" }, 
    default: { url: "/src/assets/images/portrait.jpg" }
  },
  subscriberCount: 10000,
  viewCount: 42000,
  videoCount: 150
};

// Kombinierter Mock aus deinen JSONs für den Notfall
export const MOCK_VIDEOS = [
  {
    id: "go-touch-grass",
    snippet: {
      title: "Go Touch Grass",
      publishedAt: "2024-10-01T10:00:00Z",
      thumbnails: {
        high: { url: "https://via.placeholder.com/480x360?text=Go+Touch+Grass" }
      }
    },
    statistics: { viewCount: "2500" },
    contentDetails: { duration: "PT6M55S" } // Longform
  },
  {
    id: "the-sketch",
    snippet: {
      title: "The Sketch",
      publishedAt: "2023-12-15T10:00:00Z",
      thumbnails: {
        high: { url: "https://via.placeholder.com/480x360?text=The+Sketch" }
      }
    },
    statistics: { viewCount: "1200" },
    contentDetails: { duration: "PT4M10S" }
  },
  {
    id: "dummyShort1",
    snippet: {
      title: "Shorts: Lackieren wie ein Pro #shorts",
      publishedAt: "2025-12-20T10:00:00Z",
      thumbnails: {
        high: { url: "https://via.placeholder.com/480x360?text=Short+1" }
      }
    },
    statistics: { viewCount: "99000" },
    contentDetails: { duration: "PT0M58S" } // Short
  }
];