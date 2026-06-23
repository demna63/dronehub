export const registerServiceWorker = () => {
  if (!('serviceWorker' in navigator) || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('Service worker registration failed:', error);
    });
  });
};
