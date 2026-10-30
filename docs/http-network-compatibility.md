# Acceso HTTP desde la red · 30/10/2026

Se corrigió el error de arranque `TypeError: crypto.randomUUID is not a function` al abrir una dirección HTTP distinta de localhost.

Causa: `Crypto.randomUUID` depende de un contexto seguro; localhost se considera confiable, pero una IP o nombre de red por HTTP no. `Crypto.getRandomValues` está disponible también en esos contextos. Referencias: [randomUUID](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID) y [getRandomValues](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues).

`src/shared/identity/create-id.ts` centraliza la generación: utiliza randomUUID cuando existe y, en su ausencia, genera un UUID v4 con 16 bytes de getRandomValues, fijando los bits de versión y variante. No usa Math.random, fechas ni contadores para sustituir la entropía. Se aplica al perfil, listas, versiones de edición/importación, planes, preguntas, sesiones y reintentos. Conserva las claves y los datos existentes; no cambia el esquema de IndexedDB ni necesita borrar almacenamiento.

La regresión de navegador usa `http://verbquest.test` y sirve los recursos mediante interceptación hacia el servidor de pruebas local. El navegador mantiene un origen HTTP real sin contexto seguro: se verifica que `isSecureContext` sea false y que randomUUID no esté disponible. No se modifica artificialmente la API de crypto para esa prueba. Antes de corregir, se reprodujo el mismo error del usuario en el arranque. Después se comprueban creación de perfil/lista/plan, generación de sesión, recuperación al recargar y finalización. Así se evita depender de la IP o DNS de una máquina de CI; no se simula una prueba de conectividad desde un dispositivo externo. La prueba reenvía el encabezado Host al servidor local de recursos, sin desactivar la protección de hosts de Vite.

Las pruebas unitarias comprueban preferencia por la API nativa, conservación de su receptor Crypto, formato/versionado v4 de los bytes y entropía nueva por identificador. La instalación PWA y el service worker siguen requiriendo HTTPS o localhost; esta corrección permite utilizar la aplicación por HTTP de red y no elimina las restricciones del navegador sobre esas otras APIs.

También se arrancó temporalmente `npm run dev` en un puerto libre y se abrió la biblioteca en Chromium mediante las dos direcciones IPv4 de red anunciadas por Vite. Ambas cargaron con `isSecureContext: false`, randomUUID ausente y getRandomValues disponible. La comprobación fue desde el propio equipo, no desde otro dispositivo; el servidor temporal se cerró al terminar.

Validación final: 96/96 pruebas unitarias e integración; typecheck y build correctos; 75/75 E2E (25 por motor en Chromium, Firefox y WebKit), incluida la regresión HTTP en los tres motores. Las comprobaciones directas de las dos direcciones de red del servidor de desarrollo también pasaron.
