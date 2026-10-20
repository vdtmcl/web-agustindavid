# GA4 · seguimiento web · AgustinDavid

## Propiedad y flujo web (creados el 2026-10-18)
- Cuenta: `VDTM 2026` (ID `382406614`).
- Propiedad GA4: `Agustín David` (ID `559470829`).
- Flujo web `Agustín David`: `https://agustindavid.cl` (ID de flujo `16155071724`).
- ID de medición: `G-X1CFHXTB5L`.
- Medición mejorada activada: cargas de página y cambios del historial del navegador.

## Alcance y separación
- La propiedad y el flujo son exclusivos de este sitio; nunca emplear el ID de otro sitio o cliente.
- Las métricas de previews y producción comparten propiedad; distinguirlas por hostname. No usar el tráfico de pruebas como referencia de usuarios reales.
- Cloudflare Pages: `web-agustindavid`; producción en `main`, previews en ramas de revisión. URL pública de referencia: `https://agustindavid.cl/`.

## Código, consentimiento y activación
- `src/utils/ga4.ts` carga `gtag.js` solo en producción, con un ID válido y después de aceptar la analítica en el aviso del sitio. Sin una decisión, tras rechazar o con Global Privacy Control (GPC) activo, no se carga la etiqueta ni se envían solicitudes de GA4. `/admin` queda excluido.
- El aviso explica que Google Analytics 4 mide visitas y navegación para mejorar el sitio, ofrece aceptar o rechazar y enlaza a la política de privacidad de Google. El control permanente `Preferencias de analítica` permite cambiar la elección. Para excluir un navegador específico, abrir `/?ga4_tracking=off`; el parámetro guarda el rechazo para ese hostname.
- La elección queda guardada en el almacenamiento local del navegador para este hostname. Si el navegador lo bloquea, no se carga la etiqueta sin una aceptación explícita en la visita actual.
- Los indicadores de publicidad de Google están desactivados en la configuración de GA4. No se instalan GTM ni eventos manuales; la propiedad genera las vistas de página y los cambios SPA mediante Medición mejorada.
- Cloudflare Pages usa `VITE_GA_MEASUREMENT_ID=G-X1CFHXTB5L` en los entornos preview y production. El ID es público; no es una credencial ni un secreto.

## Validación y continuidad
1. Confirmar que propiedad, hostname e ID de medición coinciden con esta ficha.
2. Antes de aceptar el aviso, comprobar que no se inserta `gtag.js` ni salen solicitudes a GA4. Tras aceptar, verificar `page_view` en Realtime/DebugView y un único evento por carga o cambio de ruta.
3. Repetir la comprobación con rechazo y GPC activo: no debe enviarse tráfico. Cambiar la elección desde `Preferencias de analítica`.
4. Verificar en Cloudflare la rama, SHA, entorno production y estado success; abrir la URL pública. Los informes estándar pueden tardar en poblarse después de que Realtime reciba eventos.
5. Mantener separado el análisis de cada sitio. Cualquier integración externa con GA4 debe usar solo acceso de lectura y seleccionar esta propiedad.

## Reversión
- Eliminar `VITE_GA_MEASUREMENT_ID` del entorno production y volver a desplegar; o revertir el merge de GA4. Después comprobar que no se carga `gtag.js`. Los datos ya almacenados en Google Analytics no se eliminan al revertir.
- No se modifican propiedades de Google, DNS, dominios, cuentas ni credenciales. La activación aprobada se limita al código del sitio y su variable pública de Cloudflare Pages.
