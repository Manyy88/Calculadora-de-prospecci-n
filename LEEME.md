# Calculadora de Prospección · AUTOCOM WAY v2

## Actualizar la aplicación existente

1. Abre el mismo proyecto de Apps Script que utiliza la calculadora actual.
2. Reemplaza por completo el contenido de `Code.gs` (puede llamarse `Código.gs` en tu editor), `Index.html` y `Logic.html`. No dejes copias adicionales del código anterior.
3. En Configuración del proyecto, activa la visualización del manifiesto y reemplaza `appsscript.json`.
4. Conserva la propiedad de script `PROSPECCION_SHEET_ID`: debe contener el ID del archivo de datos actual. Si el proyecto está vinculado a esa hoja y no existe la propiedad, `configurar` la establece automáticamente. En proyectos independientes, establece la propiedad antes de continuar.
5. Ejecuta `configurar` desde el editor, como propietario, y autoriza los permisos. Crea `Capturas` y `Solicitudes` sin modificar `Prospeccion`.
6. Configura el directorio como se indica abajo.
7. Ejecuta `testCalculos` y `testCapturas`. Esta última crea un archivo separado de prueba; no modifica tus capturas reales.
8. En Implementar → Administrar implementaciones, edita la implementación existente, selecciona Nueva versión y actualiza. Mantén ejecución como propietario y acceso para cualquiera. Así conservas la misma URL. Abre de nuevo la aplicación para cargar la nueva versión.

## Directorio

Mientras llega el directorio real, ejecuta `crearDirectorioPrueba` desde el editor. Crea un archivo separado con 12 perfiles ficticios en tres unidades, uno dado de baja y uno sin número de empleado. Configura automáticamente `DIRECTORIO_SHEET_ID` y `DIRECTORIO_TAB`. No reemplaza un directorio ya configurado.

Para utilizar el directorio real, el propietario del script debe poder leerlo. Establece estas propiedades del script:

- `DIRECTORIO_SHEET_ID`: ID del archivo que mantiene Mario.
- `DIRECTORIO_TAB`: nombre de pestaña; por defecto, `Directorio`.

Encabezados: `No. empleado`, `Nombre completo`, `Unidad de negocio`, `Línea`, `Puesto`, `Estatus`, `Correo`. El orden es libre. Si los nombres son diferentes, ajusta `DIRECTORIO_COLS`. Guarda los números de empleado como texto para preservar ceros iniciales.

Solo aparecen asesores con Estatus Activo. Línea acepta Nuevos o Seminuevos, sin importar mayúsculas o acentos. El catálogo se conserva en caché durante diez minutos; `actualizarDirectorio` fuerza su lectura. La aplicación nunca modifica el directorio real.

La identificación es por selección de nombre, no una autenticación: no requiere correo, PIN ni cuenta Google del asesor. El dispositivo recuerda el ID; si pierde esa preferencia, elegir nuevamente el nombre recupera los datos de la hoja.

## Uso

El asesor elige agencia y nombre una vez. Después captura únicamente los prospectos del día. La calculadora suma el mes, muestra el ritmo y solicita una acción solo cuando está en ámbar o rojo. Si ya capturó hoy, abre el resultado y permite corregir el valor. Guardar otra vez reemplaza la cantidad de esa fecha.

“Capturar un día anterior” permite los tres días hábiles anteriores, dentro del mes actual. La fecha del servidor gobierna el cálculo, en America/Mexico_City. Capturar hoy se permite también en domingo o feriado.

“No aparezco” genera una solicitud pendiente de alta y permite capturar con ID temporal. Mario revisa `Solicitudes` y realiza el alta en el directorio externo. No se envían notificaciones automáticas.

Para vincular después un temporal al número de empleado, ejecuta `vincularTemporal(idTemporal, noEmpleado)` como propietario. Para pasar los argumentos desde el editor puedes añadir y ejecutar esta función administrativa, sustituyendo ambos valores:

```javascript
function vincularUnAsesor() {
  return vincularTemporal('T-ABC123', '001234');
}
```

La vinculación exige coincidencia de nombre y unidad y conserva los registros. Si ambos IDs tienen datos en la misma fecha, se detiene para que el administrador resuelva el duplicado sin sumar ni borrar datos automáticamente.

## Parámetros y cálculo

`PROSPECCION` en Code.gs es la configuración de producción. Meta 8 ventas y conversión 25% generan 32 prospectos por mes en ambas líneas. Los días operativos son lunes a sábado, excepto la lista configurable de feriados. Las tasas son los parámetros solicitados, no una garantía de venta.

El esperado corresponde al cierre de hoy. “Por día” reparte lo que falta entre los días hábiles restantes, incluyendo hoy cuando es hábil. Verde: ritmo ≥100%; ámbar: ≥80% y <100%; rojo: <80%. La acción depende del ritmo, no del faltante mensual.

Elegí una única fuente de cálculo conservando los cuatro archivos: el servidor lee el contenido local de Logic.html, extrae su etiqueta script y evalúa esa misma lógica pura. El cliente recibe ese archivo mediante include_. No hay fórmulas duplicadas ni código recibido del usuario para evaluar. Cambiar parámetros no requiere modificar la pantalla ni las fórmulas. El servidor comprueba además una huella de configuración para rechazar capturas con parámetros antiguos.

## Datos

- `Prospeccion`: histórico v1, intacto. No se convierte ni se suma a los registros diarios.
- `Capturas`: una fila por asesor y fecha. El acumulado se calcula sumando solo prospectos_dia. Los demás indicadores son fotografías del momento de guardado, incluso al corregir un día anterior.
- `Solicitudes`: altas pendientes y su vinculación posterior.

Las escrituras usan bloqueo y validación de servidor. El ID de captura permanece al corregir. Las notas de la primera columna conservan las claves de reintento para evitar aplicar dos veces una misma petición; no las borres. La lectura mensual recupera las ocho primeras columnas y filtra por mes y asesor. No se ha medido la latencia en tu despliegue con 300 usuarios; el índice adicional queda condicionado al umbral de tres segundos indicado en las instrucciones.

## Vista previa y verificación

Abre `Vista-previa.html` en un navegador para explorar los perfiles ficticios y el flujo sin Google Apps Script. Las capturas de esta vista son solo una simulación en memoria y se reinician al recargar; no escriben en Google Sheets. Incluye la configuración v2 solicitada.

Verificado localmente:

- Los siete casos A–G, incluidos domingo, feriado y objetivo superado.
- Alta temporal, tres capturas, corrección y rechazo fuera de rango.
- Reintento antiguo después de una corrección: conserva la cantidad más reciente.
- Catálogo activo, encabezados reordenados, columna faltante, normalización y vinculación temporal.
- Rechazo de versión obsoleta, fecha futura y acción vacía cuando es obligatoria.
- Preservación de la hoja histórica y sintaxis JavaScript de interfaz/vista previa.

Las operaciones de Sheets se comprobaron con una simulación local del servicio. Falta ejecutar las funciones de prueba incluidas y comprobar el flujo visual en tu despliegue real; este paquete no se ha publicado ni se ha conectado a tu directorio real.
