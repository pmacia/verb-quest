# Recuperación de «Aplicación no preparada» en desarrollo

31/10/2026. El proveedor esperaba a tener datos antes de montar sus hijos, pero el Context de React se creaba dentro del mismo módulo que exportaba el proveedor y useApp. Una sustitución de ese módulo podía crear otro Context mientras se conservaban componentes o rutas de la versión anterior. Vite avisaba de invalidación de Fast Refresh por exportaciones incompatibles. Eso permite que useApp lea null aunque exista un proveedor del contexto anterior.

Se ha separado AppData, AppContext y useApp en app-context.ts. AppProviders exporta únicamente su componente. Durante HMR se conserva la identidad del contexto mediante import.meta.hot.data; en producción se crea normalmente, sin depender de HMR. Se han actualizado consumidores y mocks.

## Evidencia y alcance

La prueba `npm run test:dev-hmr` crea una copia temporal, con caché de Vite y almacenamiento del navegador aislados. Guarda una preferencia, sustituye el módulo de contexto, verifica su identidad y modifica el proveedor con una marca visible para confirmar que realmente se aplicó el nuevo código. Comprueba que la pantalla funciona, que no aparece el error comunicado y que la preferencia sigue guardada después de recargar. Servidor y copia temporal se cierran y eliminan al terminar. No se toca el servidor del usuario ni sus datos.

La condición que permite el fallo se comprobó en RED con el código de 1abd7da: el Context cambiaba de identidad tras la actualización. La secuencia intermitente exacta de la pantalla de error no se reprodujo de forma determinista; la prueba fija la identidad compartida necesaria para impedir esa desincronización. La versión corregida pasa la prueba con sustitución tanto del contexto como del proveedor. Para comparar una versión antigua de forma explícita: `npm run test:dev-hmr -- --baseline=1abd7da` (fallo de identidad esperado).

También se verificó directamente el servidor ya abierto en localhost:3000: la biblioteca muestra 120 verbos y no registra errores de página. La revisión independiente no encontró bloqueos; su observación sobre fijar la referencia de comparación se resolvió usando un SHA explícito.

## Pestañas que ya muestran el error

Recargar con ⌘R, o Ctrl+R en otros sistemas. La pantalla de error del router puede conservarse aunque llegue la corrección por HMR. No borrar IndexedDB, caché de datos, listas ni progreso.

Validación final: 111 pruebas unitarias/integración, 93 E2E en Chromium/Firefox/WebKit, prueba de HMR con Vite real, tipos y compilación correctos. Los datos persistidos no se modifican como parte de la corrección.
