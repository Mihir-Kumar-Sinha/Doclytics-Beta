// Central API configuration
// In development: points to localhost:8000
// In production: points to the deployed backend (Render, Railway, etc.)
// Set VITE_API_URL in Vercel environment variables

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const API = {
  // Documents
  upload: `${API_BASE_URL}/api/upload`,
  documents: `${API_BASE_URL}/api/documents`,
  document: (id) => `${API_BASE_URL}/api/documents/${id}`,
  deleteDocument: (id) => `${API_BASE_URL}/api/documents/${id}`,
  documentQuery: (id) => `${API_BASE_URL}/api/documents/${id}/query`,
  documentCharts: (id) => `${API_BASE_URL}/api/documents/${id}/charts`,
  documentExport: (id) => `${API_BASE_URL}/api/documents/${id}/export`,
  analyticsQuery: (id) => `${API_BASE_URL}/api/documents/${id}/analytics_query`,

  // General
  chat: `${API_BASE_URL}/api/chat`,
  stats: `${API_BASE_URL}/api/stats`,
  statsSimulate: (action) => `${API_BASE_URL}/api/stats/simulate?action=${action}`,
};

export default API;
