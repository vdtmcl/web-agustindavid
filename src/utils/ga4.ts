/**
 * Google Analytics 4: una etiqueta por sitio. Activación por VITE_GA_MEASUREMENT_ID.
 * Enhanced Measurement registra vistas de página y cambios de historial SPA.
 * No se envían eventos manuales para evitar duplicaciones.
 */
export function initializeGA4(): void {
  if (!import.meta.env.PROD) return;

  const measurementId = String(import.meta.env.VITE_GA_MEASUREMENT_ID || '').trim();
  if (!/^G-[A-Z0-9]+$/.test(measurementId)) return;
  if (/^\/admin(?:\/|$)/i.test(window.location.pathname)) return;
  if ((navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true) return;

  const preferenceKey = 'web-vdtm-ga4-opt-out';
  try {
    const choice = new URLSearchParams(window.location.search).get('ga4_tracking');
    if (choice === 'off') window.localStorage.setItem(preferenceKey, '1');
    if (choice === 'on') window.localStorage.removeItem(preferenceKey);
    if (window.localStorage.getItem(preferenceKey) === '1') return;
  } catch {
    // GA4 continúa sin almacenamiento local de preferencias si este está bloqueado.
  }

  const tagged = window as Window & { dataLayer?: unknown[] };
  tagged.dataLayer ??= [];
  const gtag = (...args: unknown[]): void => { tagged.dataLayer?.push(args); };
  gtag('js', new Date());
  gtag('config', measurementId);

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId);
  document.head.appendChild(script);
}
