# Offline y almacenamiento

Primera carga con conexión: se precachean shell, módulos, catálogo y plantillas. Después se puede navegar, estudiar texto, editar y guardar offline. El aviso pide confirmación para cerrar una sesión activa antes de actualizar. El cierre es definitivo y conserva las respuestas registradas. Si la activación falla después del cierre, puedes reintentar la actualización desde el aviso. Para conservar las preguntas pendientes y el borrador de repaso, pausa la sesión antes de actualizar. No se borran datos ante error de apertura o versión futura de IndexedDB.

IndexedDB almacena localmente perfil, contenido y evidencias. No hay sincronización ni telemetría remota. El navegador puede retirar almacenamiento, especialmente en modo privado; conservar copias JSON fuera de él. Borrar caché de recursos y borrar datos de IndexedDB tienen efectos distintos. El modo sin conexión no garantiza audio: algunas voces son remotas; la UI muestra la voz/dialecto real y ofrece alternativa visual que no suma escucha.

Instalación PWA: navegador compatible, HTTPS o localhost. El alojamiento debe servir index.html como fallback de rutas SPA. No se ha elegido ni publicado proveedor.
