# BITACORA.md — agustindavid.cl

## CIERRE_PROTOCOLO_MULTISITIO_20261020

- **Solicitud de cierre:** 2026-10-20 13:29:05, America/Santiago. Sesión de gobierno multisitio; no es una auditoría nueva del estado productivo de esta web.
- **Objetivo y resultado:** simplificar las instrucciones de WEB VDTM NUBE y separar reglas estables de datos operativos. Versión definitiva de 3.930 caracteres entregada en el chat; Agustín confirmó «aplicado». La configuración de ChatGPT no fue inspeccionada por herramienta: la aplicación consta por confirmación del usuario.
- **Decisiones:** una tarea a la vez; controles proporcionales al cambio; «aplica y sube»/«publica» constituye autorización específica del cambio y no requiere una segunda aprobación idéntica. Se mantienen los controles obligatorios y restricciones de las herramientas. Las referencias antiguas a pedir siempre una segunda aprobación son históricas y no deben reintroducirla frente a esta autorización vigente.
- **Continuidad:** AGENTS conserva reglas del sitio; BITACORA mantiene estado, evidencia y pendientes; OPERATIONS conserva procedimientos. Los datos variables no se mantienen en instrucciones ni en el antiguo adjunto central. «Cierre de sesión» consolida y persiste documentación; no cierra cuentas. Registrar también hitos durante trabajos largos.
- **NIC.cl:** quedó autorizada la gestión técnica dentro de los proyectos solicitados, con alcance y destino validados. Observación NIC.cl anterior en este chat (2026-10-20): ficha de agustindavid.cl accesible; nameservers rayne.ns.cloudflare.com y nikon.ns.cloudflare.com. No se guardaron cambios ni se probó escritura; no revalidado al cierre.
- **Cambio de este cierre:** únicamente BITACORA.md en este repositorio. Rama documental codex/admin-multisitio-20261008; PR #6 abierto y sin merge; base main. HEAD leído antes del cierre: f8ad601980aa52009b7dbd3c4df441249a393d34. El SHA del commit de cierre queda en el historial remoto de este archivo.
- **Validación:** lectura autenticada de AGENTS.md, BITACORA.md, árbol Git y referencia/PR en GitHub. No se ejecutaron builds, pruebas funcionales, revisión visual ni despliegues manuales por este cambio documental. No se revalidaron producción, DNS, Cloudflare ni sesiones de navegador al cierre; los snapshots anteriores conservan sus fechas y deben reconsultarse cuando sean necesarios.
- **Límite conocido:** el entorno de ejecución local quedó indisponible; el archivo WEB_VDTM_NUBE_MULTISITIO.md abierto no pudo reemplazarse por el último texto compacto. La versión larga anterior no es la política vigente ni una fuente de estado. Retirar su uso como protocolo adjunto si aún existe; no se confirmó su retirada. Las instrucciones definitivas aplicadas por Agustín son la referencia de política.
- **Pendientes y siguiente paso:** conservar los PR anteriores y sus dependencias sin fusionarlos por este cierre. Retomar con una tarea y sitio concretos, leer esta bitácora desde su rama/PR vigente y contrastar solo los datos necesarios. No se cambiaron código, main, producción, DNS, secretos ni permisos durante este cierre.

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

AGENTS.md, docs/OPERATIONS.md, package.json, .github/workflows/, migrations/, Git y API de Cloudflare. La identidad y el estado técnico se mantienen en este repositorio; la política general está en las instrucciones vigentes de WEB VDTM NUBE.
