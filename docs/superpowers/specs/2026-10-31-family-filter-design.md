# Filtro conjunto de relaciones y familias

Diseño aceptado en la conversación: relación general junto a familias detalladas, selección múltiple y estado completo/parcial/ninguno. Se conserva React y el motor de consultas actual. No se modifican datos ni clasificaciones editoriales.

Se mantiene un selector de relación como ámbito y se añaden casillas debajo para sus familias, contador y casilla de selección completa con estado indeterminado. Elegir relación selecciona todas sus familias; desmarcar todas produce cero resultados. La selección se combina con búsqueda y otros filtros; se puede limpiar sin perderlos. El ámbito permanece visible al afinar familias; su casilla general refleja la selección parcial. Al cerrar/reabrir filtros se conserva la selección.

Alternativas: filtros independientes (mantienen la duplicidad actual); árbol de cuatro relaciones (ocupa más espacio y duplica familias compartidas); selector de relación y familias subordinadas (elegido, mantiene la navegación actual). La agrupación se calcula desde los verbos, sin deducir relaciones por prefijos que no coinciden siempre con el catálogo. Para el nuevo control se ocultan etiquetas históricas generales cuando hay una familia detallada; si no, se conservan como alternativa. Los filtros guardados y otras pantallas mantienen su semántica actual.

No se infiere una relación única para familias compartidas: el selector indica el ámbito y el estado parcial se muestra aparte. Verbos sin familia se incluyen mediante «Sin familia detallada». Decisión de implementación: selección local explícita separada de los filtros persistibles, para que cero casillas signifique cero resultados sin cambiar el significado histórico de arrays vacíos en consultas guardadas.
