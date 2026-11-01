# Audio de read — 01/11/2026

**Estado vigente:** la solución contextual descrita abajo fue sustituida a petición del usuario por reproducción aislada, manteniendo `read / read / read`. Véase [audio aislado por forma](read-isolated-audio-2026-11-01.md). El resto de este documento conserva el diagnóstico y la solución anteriores como historial.

La revisión del código y del catálogo de 120 verbos detectó un único bloqueo explícito por ambigüedad: **read**. Su IPA sí está completa: base /riːd/; pasado y participio /red/. La escritura aislada no permite elegir el sonido por forma gramatical en el motor de voz del navegador.

La biblioteca ya utilizaba ejemplos revisados, pero la ficha conservaba una condición que eliminaba sus tres controles de audio. Se corrigió esta diferencia reutilizando la misma selección de ejemplos por forma, estado de revisión y dialecto. Cada tarjeta muestra la frase que se reproduce:

- Base: We can read a book about space.
- Pasado: We read a book about space yesterday.
- Participio: We have read a book about space.

Se conservan voz, dialecto, volumen y velocidad configurados. Los demás verbos mantienen su reproducción aislada. La selección por forma es independiente: si una ficha personalizada pierde un ejemplo revisado, las otras formas disponibles siguen funcionando y se explica cómo completar la que falta. La biblioteca conserva la secuencia de las tres formas.

La auditoría de datos no encontró ejemplos necesarios ausentes en ningún verbo del catálogo incluido, en UK ni US. Esto comprueba disponibilidad del texto de reproducción; no certifica el resultado fonético de cada voz. Para asegurar una palabra aislada con pronunciación idéntica en todos los dispositivos harían falta grabaciones revisadas y con derechos de uso. No se han descargado ni redistribuido audios de diccionarios.

Audio Detective mantiene la exclusión de read como palabra aislada evaluable; escuchar en una ficha no acredita dominio ni añade XP.

Pruebas: reproducción en la ficha inicialmente falló por ausencia del botón (RED); tras la corrección, prueba E2E de los tres textos y de go aislado correcta en Chromium, Firefox y WebKit (GREEN). 121 pruebas unitarias/integración y 21 E2E de audio/biblioteca/ayuda correctas; compilación con tipos correcta. La prueba unitaria recorre los 120 verbos en ambos dialectos y comprueba el fallo parcial de un ejemplo local ausente. Las pruebas de voz usan un puerto simulado y no equivalen a una escucha humana del audio generado por cada sistema.
