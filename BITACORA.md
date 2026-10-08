# BITACORA.md — agustindavid.cl

## ESTADO_ACTUAL

Auditoría 2026-10-08 UTC. Repositorio vdtmcl/web-agustindavid, main en 773421961878f600de1def4770763aa4d9948f5c. Cloudflare web-agustindavid, cuenta 7d5cdcf87df07007a26fc926025fbfc7. Dominios agustindavid.cl y www.agustindavid.cl activos.
Deployment canónico de producción c0873e06-4d49-4bf6-84d4-79676221ccb3, 2026-08-31, exitoso; commit coincide con main. Verificar de nuevo al comenzar cada tarea.
Cloudflare Git integrado: producción main y previews de todas las ramas; build npm run build, salida dist. GitHub Actions validate.yml valida PR; deploy-pages.yml publica además en GitHub Pages. No se retiró ese hosting secundario.
Este cambio prepara reglas y documentación en codex/admin-multisitio-20261008; no está incorporado a main.

## MAPA_TECNICO

React 19, Vite 7, TypeScript y Tailwind 4. src/App.tsx (portfolio), src/AdminApp.tsx (administrador), src/content.ts (catálogo). Functions en functions/api y helpers en functions/_lib. migrations/0001_init.sql y 0002_video_trim.sql; no se aplicaron migraciones durante la auditoría.
GET /api/videos puede sincronizar el catálogo y escribir D1; no tratarlo como lectura sin efectos.

## INTEGRACIONES_Y_OPERACION

- Pages Functions y D1 DB: preview 41e6d17e-56bb-4977-9279-0125df9bb316; producción 909d6dba-9579-4733-9788-572f466db1ad. IDs diferentes verificados sin consultar filas.
- Cloudinary: entrega y uploads desde Functions. Nombres presentes en ambos ambientes: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.
- Autenticación: ADMIN_PASSWORD y SESSION_SECRET presentes como secretos en ambos ambientes. No se compararon valores.
- GitHub vdtmcl: admin/push/pull verificados por conexión. Cloudflare: lectura de cuenta, proyecto, bindings y deployments comprobada; publicación de preview debe verificarse con resultado real.
- Variables y backups solo en almacenes autorizados. No asumir acceso administrativo efectivo a Cloudinary por la presencia de URLs.

## RIESGOS_Y_PENDIENTES

- Dos hostings: Cloudflare y workflow GitHub Pages. No eliminar el secundario sin decisión explícita.
- main sin protección de rama reportada por GitHub; reglas externas adicionales no auditadas.
- Build/typecheck frontend excluyen Functions; no hay suite test/lint.
- Las credenciales de preview y producción podrían compartir recursos Cloudinary; valores y alcance no inspeccionados. No hacer uploads ni cambios del administrador para validar preview.
- D1 aislada por ID no demuestra igualdad de esquema/datos ni backup recuperable. Migraciones y recuperación quedan pendientes.
- Cloudflare build no depende del resultado de Actions; exigir ambos aprobados antes de merge.

## ULTIMA_VALIDACION

Auditoría documental y APIs: correspondencia de repositorio, dominio, commit canónico y bindings verificada. Último workflow Validate de main: https://github.com/vdtmcl/web-agustindavid/actions/runs/33357943508 (success).
Pruebas nuevas y preview de esta rama: consultar PR y resultados finales; no inferirlas del historial.

## FUENTES_DE_DETALLE

AGENTS.md, docs/OPERATIONS.md, package.json, .github/workflows/, migrations/, Git y API de Cloudflare. El registro de WEB VDTM NUBE sirve para seleccionar sitio; este repositorio conserva su verdad técnica.
