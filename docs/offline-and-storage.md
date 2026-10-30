# Offline y almacenamiento

Primera carga con conexión: se precachean shell, módulos, catálogo y plantillas. Después se puede navegar, estudiar texto, editar y guardar offline. El aviso de actualización requiere acción y comprueba que no haya sesión activa; pausar guarda datos antes de actualizar. No se borran datos ante error de apertura o versión futura de IndexedDB.

IndexedDB almacena localmente perfil, contenido y evidencias. No hay sincronización ni telemetría remota. El navegador puede retirar almacenamiento, especialmente en modo privado; conservar copias JSON fuera de él. Borrar caché de recursos y borrar datos de IndexedDB tienen efectos distintos. El modo sin conexión no garantiza audio: algunas voces son remotas; la UI muestra la voz/dialecto real y ofrece alternativa visual que no suma escucha.

Instalación PWA: navegador compatible, HTTPS o localhost. El alojamiento debe servir index.html como fallback de rutas SPA. No se ha elegido ni publicado proveedor.
