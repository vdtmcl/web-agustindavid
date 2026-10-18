# GA4 · seguimiento web · AgustinDavid

## Alcance y separación
- Cuenta administradora prevista: `vdtm.cl@gmail.com` (el usuario confirmó que administra la propiedad de VDTM.cl).
- Crear una **propiedad GA4 y un flujo web propios de este sitio**. Nunca emplear el ID de VDTM ni de otro cliente.
- Maqueta y web publicada pueden usar la misma propiedad para preservar el historial; separar sus métricas con la dimensión `hostName` y el dominio. Evitar mezclar pruebas internas mediante filtros de tráfico interno o exclusión por navegador.
- Despliegue Cloudflare Pages: `web-agustindavid` (producción `main`, preview en ramas de revisión). URL principal actual de referencia: `https://agustindavid.cl/`.

## Código y activación
- `src/utils/ga4.ts` carga `gtag.js` solo cuando `VITE_GA_MEASUREMENT_ID` contiene un identificador válido `G-…` en un build Vite. No necesita npm adicional, API ni base D1.
- Configurar `VITE_GA_MEASUREMENT_ID` en Cloudflare Pages > Settings > Variables, **independientemente en production y preview**. El ID de medición es público, no es un secreto. Sin ID, el código no carga Google Analytics.
- En la propiedad GA4: Administrar > Flujos de datos > Web > Medición optimizada > Vistas de página, habilitar **cargas de páginas** y **cambios de página por historial del navegador** (React Router). No instalar otro gtag o GTM simultáneamente, ni emitir `page_view` manualmente.
- Para excluir el navegador propio por origen, visitar `/?ga4_tracking=off`. Para reanudar `/?ga4_tracking=on`; el valor se guarda por navegador y dominio. También se excluye `/admin` y se respeta Global Privacy Control.
- Documentar el uso de Google Analytics en el aviso de privacidad propio y comprobar los requisitos de consentimiento antes de activar la recopilación en el entorno público.

## Validación y continuidad
1. Crear propiedad y flujo web en Google Analytics con acceso administrativo de `vdtm.cl@gmail.com`. Registrar **ID de propiedad y de medición**, sin credenciales OAuth en Git.
2. Configurar ID de preview y comprobar que Cloudflare deploy reporta environment=preview, SHA esperado y success. En DebugView/Realt ime de GA4, visitar dos rutas y verificar 1 `page_view` por carga/cambio. Confirmar que el opt-out no registra una visita.
3. Configurar ID de producción solo tras autorización específica de publicación. Verificar `main`, commit, deployment y URL; no inferir producción por un CI verde.
4. Conectar GA4 a Windsor.ai desde este proyecto con OAuth de lectura de `vdtm.cl@gmail.com`, seleccionar las propiedades de cada sitio. No expone credenciales en repos.
5. Mantener un flujo de datos por sitio; al migrar de la maqueta al dominio definitivo, mantener la propiedad e identificar cada etapa mediante el hostname.

## Reversión
- Retirar el ID de Cloudflare Pages (previews y/o producción por separado), re-desplegar y comprobar cese de nuevos eventos; o revertir el commit mediante `git revert`. Los datos ya almacenados en Google Analytics no se borran con un rollback del frontend.
- No modificar propiedades Google, DNS, cuentas, secretos ni hosting en producción como parte de este PR. Revisar y aprobar antes de fusionar.
