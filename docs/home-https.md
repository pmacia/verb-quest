# VerbQuest por HTTPS en una red doméstica

El servidor incluido utiliza Node 24 y sirve únicamente la compilación estática `dist/`. No necesita un proveedor externo, un backend de datos ni dependencias de servidor adicionales. La PWA se abre desde el móvil en la dirección HTTPS del ordenador y conserva sus datos en cada navegador.

## Preparación del certificado

Para que el navegador admita el service worker y la instalación PWA, la conexión debe ser HTTPS **sin avisos de certificado**, con un certificado válido para la dirección utilizada y una autoridad de confianza en cada dispositivo. Abrir la excepción de un certificado autofirmado no equivale a configurar esa confianza.

Una opción apropiada para esta red privada es [mkcert](https://github.com/FiloSottile/mkcert). En macOS, si utilizas Homebrew:

```sh
brew install mkcert
```

Si usas Firefox, la documentación de mkcert también indica instalar `nss` con Homebrew antes de configurar la confianza. Windows y Linux tienen instrucciones en el mismo proyecto oficial.

La siguiente orden crea una autoridad local e instala su certificado raíz en los almacenes de confianza de este ordenador. Es un cambio explícito de confianza del sistema: ejecútalo tú cuando quieras configurarlo; el servidor de VerbQuest no lo ejecuta automáticamente.

```sh
mkcert -install
```

Elige una IP fija o reserva DHCP para el ordenador en el router. En un Mac con Wi-Fi en `en0` puedes consultar su IP con:

```sh
ipconfig getifaddr en0
```

Si tu conexión usa otra interfaz, consulta la dirección en los ajustes de red. **Sustituye `192.168.1.50` por la IP real** en este ejemplo:

```sh
mkdir -p .certs
mkcert -cert-file .certs/verbquest.pem -key-file .certs/verbquest-key.pem localhost 127.0.0.1 ::1 192.168.1.50
```

Si prefieres acceder con un nombre que todos los dispositivos resuelvan, añádelo al final de la misma orden, por ejemplo `mi-mac.local`. Incluir un nombre en el certificado no configura DNS: el nombre también debe resolver al ordenador. Usar la IP fija suele ser más directo. Si cambia la IP o el nombre, genera de nuevo el certificado para las direcciones nuevas y reinicia el servidor.

`.certs/` está excluido de Git y queda fuera de `dist/`. Guarda la clave privada `verbquest-key.pem` en el ordenador servidor. La clave raíz `rootCA-key.pem` de mkcert tampoco debe copiarse a otros dispositivos ni compartirse.

## Ejecutar el servidor

Desde la raíz del repositorio:

```sh
npm ci
npm run build
npm run serve:https
```

Por defecto escucha en `0.0.0.0:8443` y muestra localhost y las direcciones IPv4 de las interfaces disponibles. Utiliza una de las direcciones que figuren en tu certificado, por ejemplo:

```text
https://192.168.1.50:8443/
```

En el móvil, `localhost` identifica al propio móvil, no al ordenador. Ambos dispositivos deben estar en la misma red y tener conectividad entre sí. Una red de invitados puede bloquear esta comunicación. Si el cortafuegos pregunta, permite la conexión entrante de Node solo para la red doméstica. No hace falta abrir ni redirigir puertos hacia Internet en el router.

Puedes limitar la escucha a una interfaz, cambiar el puerto o utilizar certificados propios:

```sh
npm run serve:https -- --host 192.168.1.50 --port 8443
npm run serve:https -- --cert /ruta/certificado.pem --key /ruta/clave.pem
```

Opciones disponibles:

```sh
npm run serve:https -- --help
```

| Opción | Predeterminado | Uso |
| --- | --- | --- |
| `--host` | `0.0.0.0` | Dirección de escucha; todos los interfaces IPv4 por defecto |
| `--port` | `8443` | Puerto HTTPS, entre 1 y 65535 |
| `--dir` | `dist` | Carpeta compilada que se publica; rutas relativas al directorio de ejecución |
| `--cert` | `.certs/verbquest.pem` | Certificado PEM, con la cadena si corresponde |
| `--key` | `.certs/verbquest-key.pem` | Clave privada PEM correspondiente |

El proceso debe seguir abierto mientras otros dispositivos cargan la aplicación o buscan actualizaciones. Detén el servidor con Ctrl+C. No se instala como servicio de arranque del sistema; puedes configurarlo posteriormente según el equipo donde lo alojes.

## Confiar en el certificado desde cada dispositivo

`mkcert -install` configura este ordenador, **no todos los dispositivos de casa**. Para confiar en sus certificados, instala manualmente su certificado raíz público en los dispositivos que quieras utilizar. Puedes localizarlo con:

```sh
mkcert -CAROOT
```

El archivo que debes transferir es **`rootCA.pem`**, nunca `rootCA-key.pem`. Puedes usar AirDrop u otro medio que controles. Mantén el archivo fuera de `dist/`; no es necesario publicarlo con la aplicación.

- **iPhone/iPad:** instala el perfil del certificado y activa la confianza SSL/TLS en Ajustes → General → Información → Ajustes de confianza de certificados. Apple detalla el procedimiento en su [guía oficial](https://support.apple.com/en-us/102390). Después abre la URL de VerbQuest en Safari y utiliza su opción de añadir a la pantalla de inicio.
- **Android:** instala el certificado público de la CA en los ajustes de seguridad/certificados del sistema; los nombres varían por fabricante. Abre la URL en un navegador compatible, comprueba que no aparece ningún aviso de certificado y utiliza su opción de instalar o añadir la aplicación.
- **Otros ordenadores:** configura la confianza de esa CA en el sistema o navegador correspondiente y comprueba la dirección HTTPS antes de instalar la PWA.

No se han generado ni instalado certificados reales con este cambio de código. Las pruebas utilizan un certificado temporal cuya confianza solo se proporciona al cliente de prueba, sin modificar los almacenes del sistema. La instalación final en móviles debe verificarse una vez configurada su confianza.

## Rutas, actualizaciones y datos

El servidor resuelve rutas como `/verbs/become` o `/settings` hacia `index.html`. Los recursos inexistentes devuelven 404; no reciben HTML en lugar de JavaScript. No ofrece listados de carpetas y bloquea archivos ocultos y enlaces fuera de la carpeta publicada.

`index.html`, `sw.js` y el manifiesto se sirven con revalidación; los recursos compilados con huella en `/assets/` pueden guardarse con caché larga. La PWA conserva su mecanismo de aviso de actualización. Para distribuir una nueva compilación, detén el servidor, ejecuta `npm run build` y vuelve a iniciarlo. Evita reconstruir `dist/` mientras se está sirviendo, para no mezclar archivos de dos versiones durante la escritura.

Aloja VerbQuest en la raíz de la dirección, no en `/verbquest/`, con la configuración actual. Mantén estable el dominio/IP y el puerto: cambiar cualquiera de ellos crea un origen distinto. Para pasar tus datos de `http://localhost:3000` o `http://127.0.0.1:5173` a la dirección HTTPS, descarga antes una **copia completa**, abre la nueva URL y restáurala allí. HTTPS y servir desde un ordenador común no sincronizan el progreso entre dispositivos.

Después de una primera carga completa, el uso sin conexión depende de los recursos guardados por la PWA. Algunas voces de audio pueden requerir red. No es necesario mantener el servidor activo para los recursos ya disponibles offline, pero sí para primeras cargas y actualizaciones.

## Comprobaciones

```sh
npm run test:https
```

Las pruebas requieren OpenSSL y verifican TLS con certificado de prueba confiable para el cliente, las rutas SPA, MIME, HEAD, caché, recursos ausentes y aislamiento de archivos. No desactivan la verificación de certificados ni instalan una CA en el sistema.

Referencias: [HTTPS en Node](https://nodejs.org/api/https.html), [mkcert](https://github.com/FiloSottile/mkcert), [service workers y contextos seguros](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API), [confianza de certificados en Apple](https://support.apple.com/en-us/102390).
