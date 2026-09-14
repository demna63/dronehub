import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { registerServiceWorker } from './serviceWorker';
import { LanguageProvider } from './contexts/LanguageContext';
import { ToastProvider } from './contexts/ToastContext';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

registerServiceWorker();

root.render(
  <React.StrictMode>
    {/*
      The providers sit above <App/> rather than inside it. App calls
      useAppData() in its own body, and a hook that runs there is outside any
      provider App itself renders — so the data layer could not reach the
      language or toast contexts at all.
    */}
    <LanguageProvider>
      <ToastProvider>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <App />
        </BrowserRouter>
      </ToastProvider>
    </LanguageProvider>
  </React.StrictMode>
);