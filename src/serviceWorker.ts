export const registerServiceWorker = () => {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const enableOnLocalhost = import.meta.env.VITE_ENABLE_SW_LOCAL === 'true';

  if (isLocalhost && !enableOnLocalhost) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('Service worker registration failed:', error);
    });
  });
};
