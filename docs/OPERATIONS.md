# Operación de agustindavid.cl

## Desarrollo y validación

Node 24 según validate.yml. npm ci → npm run typecheck → npm run build. npm run dev para desarrollo, npm run preview para frontend estático. Para probar Functions usar Pages local con bindings de prueba; vite preview no ejecuta Functions. No añadir dependencias por defecto.

## Preview y producción

Cloudflare cuenta 7d5cdcf87df07007a26fc926025fbfc7, proyecto web-agustindavid. Push a codex/** activa preview por integración Git existente. Salida dist; Functions se compilan en Pages. Abrir PR activa Validate. Verificar ambos resultados y el commit exacto en Pages; luego comprobar HTTP y comportamiento público. La portada puede llamar GET /api/videos y sincronizar catálogo en D1 preview: no ejecutar sobre producción como prueba.
No usar login, uploads, escrituras, borrado ni migraciones remotas para demostrar acceso.
Tras autorización concreta, merge a main publica Cloudflare y ejecuta el workflow GitHub Pages existente. Informar ambos destinos antes del merge. No cambiar esta configuración silenciosamente.

## Variables y datos

D1 binding DB: consultar IDs separados en BITACORA. Cloudinary y autenticación usan las variables enumeradas allí; nunca copiar valores. Para cambios de esquema: auditar migraciones, preparar respaldo y restauración específicos y pedir autorización antes de aplicación remota. No asumir que una preview tiene el mismo esquema de producción.

## Rollback

Antes de publicar registrar commit y deployment canónicos actuales. Código: git revert del cambio en nueva rama y validar. Con autorización, rollback al deployment Cloudflare anterior verificado; considerar GitHub Pages por separado. D1 y Cloudinary requieren recuperación propia; no basta revertir frontend.

## Alta multisitio

El registro central pertenece a WEB VDTM NUBE, no al portfolio. Para añadir otro sitio, crear su ficha en ese registro y documentación en su propio repositorio; nunca reutilizar este DB o proyecto Pages.
