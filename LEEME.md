# Calculadora de Prospección AW · Directorio externo actualizado

## Instalación sobre el proyecto existente

1. Sustituye completos Code.gs (o Código.gs en tu editor) e Index.html. Logic.html y appsscript.json se incluyen completos y no cambiaron.
2. Conserva PROSPECCION_SHEET_ID con el ID del archivo donde guardas las capturas. Debe ser diferente al directorio externo.
3. Ejecuta configurar para crear o validar Capturas y Solicitudes. Prospeccion permanece intacta.
4. Ejecuta configurarDirectorioReal. Establece DIRECTORIO_SHEET_ID=1zM0quUwJAIknNPRTTUY3vTfakOaMJdstKRrN43wO104 y DIRECTORIO_TAB=Hoja1, reemplazando las propiedades anteriores, y valida la lectura. El propietario del proyecto debe tener acceso al directorio.
5. Ejecuta eliminarCatalogosLocales. Elimina exclusivamente las pestañas Asesores y Bitacora_Asesores del archivo de capturas, si existen. No modifica Capturas, Solicitudes ni Prospeccion. El código entregado no contiene generarIds; si tienes esa función en otro archivo antiguo de tu proyecto, elimínala también.
6. Ejecuta testCalculos y testCapturas. La segunda crea un archivo de prueba separado.
7. Actualiza la implementación existente con Nueva versión, manteniendo ejecución como propietario y acceso para cualquiera. Conservas la URL.

Las modificaciones remotas ocurren al ejecutar estas funciones en tu proyecto. Este paquete no ha sido desplegado ni ha leído o modificado tu directorio real.

## Directorio de solo lectura

DIRECTORIO_COLS define estos encabezados, leídos sin importar orden, acentos, mayúsculas o espacios extra:
ID Colaborador | Nombre completo | Unidad de negocio | Area | Puesto | Estatus (activo o baja) | Correo Institucional.
Todos son obligatorios; el error identifica el que falta. Los ID deben conservarse como texto para mantener ceros iniciales.

AREA_A_LINEA: VENTAS TRADICIONAL → nuevos; SEMINUEVOS → seminuevos. Otras áreas se ignoran.
UNIDADES_EXCLUIDAS: GO RIDERS PACHUCA y GO RIDERS PUEBLA. También se bloquean en No aparezco.
Solo baja excluye por estatus; vacío, activo y otros valores se incluyen conforme a la regla solicitada. Las capturas históricas se conservan.
Los nombres y unidades se muestran en formato título. El ID faltante usa N- más hash estable del nombre normalizado y unidad. El directorio se cachea diez minutos; actualizarDirectorio fuerza una nueva lectura. No hay metas por unidad: todas mantienen 8 ventas y conversión 25%.

## Solicitudes y temporales

Solicitudes contiene: fecha, tipo, asesor_id, nombre, unidad_negocio, linea, detalle, solicitado_por, estatus.
registrarAsesor busca primero el mismo nombre normalizado y unidad en el directorio. Recupera al asesor activo existente; no permite reactivar una baja mediante alta temporal. Si no existe, crea una solicitud pendiente con T- y seis caracteres. Repetir el alta recupera el mismo temporal.

Después de darlo de alta en el directorio externo, ejecuta vincularTemporal(idTemporal, idColaborador) como propietario. Para pasar argumentos desde el editor puedes añadir:

```javascript
function vincularUnAsesor() {
  return vincularTemporal('T-ABC123', '001234');
}
```

Reasigna el ID en Capturas y marca la solicitud aplicada. Si hay registros de ambos IDs en una misma fecha, se detiene para que el administrador resuelva el duplicado; no suma ni borra registros automáticamente. No se envían notificaciones a Mario.

## Pruebas

crearDirectorioPrueba crea un archivo separado con pestaña Hoja1, mismos siete encabezados y 12 asesores ficticios distribuidos en tres unidades: seis en Unidad Demo 1, cinco en Unidad Demo 2 y uno en Go Riders Pachuca. Incluye una baja, un ID vacío y un estatus vacío. Tras filtrar aparecen diez asesores y dos unidades.
No cambia las propiedades de producción. Para usarlo, copia su ID del registro de ejecución a DIRECTORIO_SHEET_ID y utiliza DIRECTORIO_TAB=Hoja1. configurarDirectorioReal permite volver al directorio real.

Vista-previa.html funciona sin Apps Script; sus capturas son simuladas y se reinician al recargar. Su identidad usa una clave local distinta de la aplicación real.

Se verificaron localmente los siete casos de cálculo y, con el servicio de lectura simulado, encabezados normalizados/reordenados, errores por columna faltante, áreas, estatus vacío, bajas, exclusiones, formato título, hash estable y deduplicación. Falta verificar permisos, datos reales y ejecución en tu Apps Script.

## Archivos y funciones

Modificados: Code.gs, Index.html, Vista-previa.html y este LEEME.md.
Sin cambios: Logic.html y appsscript.json.
Nuevas funciones públicas: configurarDirectorioReal y eliminarCatalogosLocales.
Nuevas auxiliares: titulo_, excluida_, lineaArea_ y directorioConfig_.
Adaptadas: directory_, dirKey_, temporary_, resolve_, register_, vincularTemporal y crearDirectorioPrueba.
Disponibles desde v2: registrarAsesor, listAgencias, listAsesores, getAsesorMes, saveCaptura, actualizarDirectorio, configurar, testCalculos y testCapturas.

El cálculo sigue teniendo una única fuente: Logic.html se carga tanto en servidor como en cliente. El acumulado suma prospectos_dia; guardar de nuevo una fecha reemplaza su cantidad. Las notas de la primera columna guardan los IDs de reintento y deben conservarse. La selección de asesor es identificación declarada, no autenticación.
