/**
 * GA4 se activa solo en producción cuando la persona acepta la analítica.
 * Enhanced Measurement registra page_view y cambios del historial SPA.
 * No se emiten eventos manuales para evitar duplicaciones.
 */
type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

export function initializeGA4(rawMeasurementId: unknown, isProduction: boolean): void {
  if (!isProduction) return;

  const measurementId = String(rawMeasurementId || "").trim();
  if (!/^G-[A-Z0-9]+$/.test(measurementId)) return;
  if (/^\/admin(?:\/|$)/i.test(window.location.pathname)) return;
  if ((navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true) return;

  const preferenceKey = `vdtm-ga4-consent:${window.location.hostname}`;
  const controlId = "vdtm-ga4-preferences";
  const choiceFromUrl = new URLSearchParams(window.location.search).get("ga4_tracking");
  let savedChoice: string | null = null;

  try {
    if (choiceFromUrl === "off") {
      window.localStorage.setItem(preferenceKey, "rejected");
      savedChoice = "rejected";
    } else {
      savedChoice = window.localStorage.getItem(preferenceKey);
    }
  } catch {
    // Sin almacenamiento disponible se vuelve a solicitar la decisión en la próxima visita.
  }

  let tagLoaded = false;

  const loadTag = (): void => {
    if (tagLoaded || document.getElementById("vdtm-ga4-script")) return;

    const taggedWindow = window as AnalyticsWindow;
    taggedWindow.dataLayer ??= [];
    // Keep the standard gtag queue format; the Google tag consumes the Arguments object.
    // eslint-disable-next-line prefer-rest-params
    taggedWindow.gtag ??= function () { taggedWindow.dataLayer?.push(arguments); };
    taggedWindow.gtag("js", new Date());
    taggedWindow.gtag("config", measurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });

    const script = document.createElement("script");
    script.id = "vdtm-ga4-script";
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(measurementId);
    document.head.appendChild(script);
    tagLoaded = true;
  };

  const control = document.createElement("div");
  control.id = controlId;
  document.body.appendChild(control);

  const renderPreferences = (expanded: boolean): void => {
    control.replaceChildren();
    control.style.cssText = expanded
      ? "position:fixed;z-index:2147483000;left:16px;right:16px;bottom:16px;display:flex;justify-content:center;font:14px/1.45 system-ui,-apple-system,Segoe UI,sans-serif;color:#17212b"
      : "position:fixed;z-index:2147483000;right:16px;bottom:16px;display:flex;font:14px/1.45 system-ui,-apple-system,Segoe UI,sans-serif;color:#17212b";

    if (!expanded) {
      const settingsButton = document.createElement("button");
      settingsButton.type = "button";
      settingsButton.textContent = "Preferencias de analítica";
      settingsButton.setAttribute("aria-label", "Abrir preferencias de analítica");
      settingsButton.style.cssText = "border:1px solid #64748b;border-radius:999px;background:#fff;color:#17212b;padding:9px 14px;box-shadow:0 2px 12px #0002;cursor:pointer";
      settingsButton.addEventListener("click", () => renderPreferences(true));
      control.appendChild(settingsButton);
      return;
    }

    const panel = document.createElement("section");
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-label", "Preferencias de analítica");
    panel.style.cssText = "box-sizing:border-box;width:min(100%,760px);padding:18px 20px;border:1px solid #cbd5e1;border-radius:12px;background:#fff;box-shadow:0 8px 28px #0003";

    const message = document.createElement("p");
    message.style.cssText = "margin:0 0 12px";
    message.append("Si aceptas, Google Analytics 4 (Google) medirá visitas y navegación para ayudarnos a mejorar este sitio. No se carga hasta que aceptes. Puedes cambiar tu decisión desde «Preferencias de analítica». ");
    const privacyLink = document.createElement("a");
    privacyLink.href = "https://policies.google.com/privacy?hl=es";
    privacyLink.target = "_blank";
    privacyLink.rel = "noopener noreferrer";
    privacyLink.textContent = "Privacidad de Google";
    message.appendChild(privacyLink);

    const actions = document.createElement("div");
    actions.style.cssText = "display:flex;flex-wrap:wrap;gap:8px";

    const choose = (choice: "accepted" | "rejected"): void => {
      try {
        window.localStorage.setItem(preferenceKey, choice);
      } catch {
        // La elección se mantiene para esta visita aunque no pueda persistirse.
      }
      if (choice === "accepted") {
        loadTag();
      } else if (tagLoaded) {
        window.location.reload();
        return;
      }
      renderPreferences(false);
    };

    const accept = document.createElement("button");
    accept.type = "button";
    accept.textContent = "Aceptar analítica";
    accept.style.cssText = "border:1px solid #17212b;border-radius:8px;background:#17212b;color:#fff;padding:9px 14px;cursor:pointer";
    accept.addEventListener("click", () => choose("accepted"));

    const reject = document.createElement("button");
    reject.type = "button";
    reject.textContent = "Rechazar analítica";
    reject.style.cssText = "border:1px solid #64748b;border-radius:8px;background:#fff;color:#17212b;padding:9px 14px;cursor:pointer";
    reject.addEventListener("click", () => choose("rejected"));

    actions.append(accept, reject);
    panel.append(message, actions);
    control.appendChild(panel);
  };

  if (savedChoice === "accepted") loadTag();
  renderPreferences(savedChoice === null);
}
