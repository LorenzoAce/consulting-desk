export const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // If VITE_API_URL is explicitly set, use it (allows testing Vercel backend from local)
      if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
      }
      return 'http://localhost:3001';
    }
  }
  return '';
};
