# Seguimiento anónimo de sesiones — agustindavid

## Política de proyecto
Aplicar desde la primera maqueta y mantener tras el lanzamiento. Mismo protocolo en los cuatro sitios, pero **código, bases y bindings físicamente separados**. No añadir trackers ajenos al proyecto. No confundir requests, pageviews y sesiones. Ningún despliegue a producción está autorizado por este documento.

## Qué mide
- Una sesión por identificador aleatorio de 128 bits guardado en `sessionStorage` por pestaña/origen; se renueva tras 30 minutos sin registros. Una recarga en el plazo mantiene la misma sesión.
- `pageviews`: carga inicial y cambios reales de ruta SPA (sin contar fragmentos `#`).
- `visible_ms`: segundos de pestaña visible, con pulsos cada 15 s; `engaged_ms`: fracción de ese tiempo con eventos de interacción en el último minuto. `last_seen_at - first_seen_at` es duración transcurrida, NO atención efectiva.
- Origen de deployment aproximado mediante `hostname`: rama/preview `*.pages.dev`, producción por dominio y subdominio estable. D1 distintos por ambiente evitan mezclar métricas de cliente con pruebas.
- Se excluyen `/admin`, `/api`, bots conocidos, GPC/DNT y visitas desde IPs de la lista de exclusión. No se almacena IP, cookie, UA, referrer, query string, hash, contenido de formularios ni identidad real.
- La medición de visibilidad es estimada: bloqueadores, navegación privada y cierre abrupto del navegador pueden impedir registros. No prometer conteo perfecto ni sesión exacta.

## Habilitación por etapas (requiere autorización específica de infraestructura y producción)
1. Crear dos bases D1 propias para este sitio: `sessions_agustindavid_preview` y `sessions_agustindavid_production`. No reutilizar D1 preexistente.
2. Aplicar `migrations/session-analytics/0001.sql` por separado en ambas bases. Verificar sus IDs y esquemas antes de tocar bindings.
3. En proyecto Cloudflare Pages **web-agustindavid**, configurar `SESSION_DB` en Settings → Bindings → D1: preview apunta SOLO a preview; production SOLO a production. Verificar IDs antes de desplegar; ausencia de binding significa cero capturas (HTTP 204).
4. Agregar opcionalmente a cada ambiente la variable privada `SESSION_EXCLUDED_IPS` (IPs IPv4/IPv6 exactas, separadas por coma, sin registrar en Git). Debe incluir la IP pública actual de quien administra; actualizar si cambia. Alternativa individual por navegador: abrir `/?vdtm_analytics=off` (persistente en ese origen). `/?vdtm_analytics=on` revierte el opt-out cuando GPC/DNT no está activado.
5. Documentar la medición en la política de privacidad propia del sitio, revisar bases jurídicas/consentimiento según jurisdicción y ensayar en preview con dispositivos autorizados. Prueba de exclusión: verificar que una IP/opt-out excluida no cree filas.
6. Solo con aprobación productiva específica: publicar y comprobar URL productiva, SHA, scripts, Function, DB, eventos y exclusiones. La promoción del dominio definitivo NO exige migrar el dataset: conservar D1 de producción del mismo proyecto.

## Consultas D1 de lectura (usar acceso autenticado, nunca exponer endpoint público)
Visitas y páginas:
```sql
SELECT COUNT(*) AS sesiones, COALESCE(SUM(pageviews),0) AS paginas_vistas,
       ROUND(COALESCE(SUM(visible_ms),0)/1000.0,1) AS segundos_visibles,
       ROUND(COALESCE(SUM(engaged_ms),0)/1000.0,1) AS segundos_con_interaccion
FROM session_visits;
```
Duración de cada sesión:
```sql
SELECT datetime(first_seen_at/1000,'unixepoch') AS inicio_utc, hostname,
       pageviews, ROUND((last_seen_at-first_seen_at)/1000.0,1) AS transcurridos_s,
       ROUND(visible_ms/1000.0,1) AS visibles_s,
       ROUND(engaged_ms/1000.0,1) AS con_interaccion_s, entry_path, last_path
FROM session_visits ORDER BY first_seen_at DESC LIMIT 200;
```
Para informes históricos de todo el ciclo, consultar por separado D1 de preview y producción, etiquetar cada origen y sumar fuera de las bases. No copiar IDs de sesión a informes públicos.

## Retención, pruebas y rollback
- Retención deslizante aproximada de 395 días: el servidor borra registros antiguos al comenzar una nueva sesión, con eliminación en cascada de páginas. Sin tráfico nuevo la limpieza queda pendiente; prever limpieza calendarizada antes de ampliar uso.
- `npm run check` si existe, si no `npm run build`, junto con pruebas reales de Function + D1 de preview. El build/CI sin binding NO acredita captura real.
- Reversión de código: `git revert` del commit del cambio en la rama aprobada. Retirar el script y la Function no borra datos D1; borrarlos o rotar bindings exige autorización separada.
- Nuevas webs deben copiar el protocolo con su propio repositorio, proyecto Pages y par de D1; registrar este control desde la etapa de maqueta.
