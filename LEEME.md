# Calculadora de Prospección · AUTOCOM WAY

## Ver la calculadora

Abre `Vista-previa.html` en Chrome, Safari o Edge. Incluye cálculos e ideas desplegables; indica claramente que no guarda. El botón de guardado se activa en la aplicación instalada.

## Instalar en Google Apps Script

Esta calculadora es una aplicación independiente del Radar 3D. No sustituyas los archivos del proyecto Radar.

1. Crea una hoja de Google Sheets para los registros de prospección.
2. Abre **Extensiones → Apps Script** desde esa hoja.
3. Pega el contenido de `Code.gs` en el archivo del mismo nombre.
4. Crea archivos HTML llamados **Index** y **Logic** y pega los archivos correspondientes del paquete. No instales `Vista-previa.html`.
5. En Configuración del proyecto, activa la visualización de **appsscript.json** y pega el archivo incluido. Usa la zona horaria correspondiente a tu operación; se entrega America/Mexico_City.
6. Guarda y ejecuta **configurar** una vez. Autoriza el acceso a Sheets. Se crea una pestaña llamada **Prospeccion**.
7. Selecciona **Implementar → Nueva implementación → Aplicación web**. Ejecutar como propietario; selecciona el acceso autorizado de tu organización según las opciones disponibles de Workspace. Comparte la URL `/exec` entre los usuarios autorizados.
8. Guarda un cálculo de prueba y verifica agencia, asesor, mes, objetivo, prospectos y acción en la nueva fila de Sheets.

Para cambios posteriores: modifica el mismo proyecto y publica una nueva versión desde Administrar implementaciones. No se requiere volver a configurar.

## Lógica aprobada

Meta individual fija: **8 ventas mensuales**.

| Línea | Relación de ejemplo | Objetivo mensual de prospectos |
|---|---|---:|
| Nuevos | 40 prospectos → 28 citas → 8 ventas | 40 |
| Seminuevos | 12 prospectos → 6 citas → 2 ventas | 48 |

Fórmula: redondear hacia arriba (meta de ventas × prospectos base / ventas base). Se conserva la relación exacta, sin redondear tasas intermedias. El objetivo es mensual, no cartera activa ni contactos diarios. Las tasas son parámetros iniciales derivados de ejemplos aprobados, no tasas observadas de todas las agencias. El volumen no garantiza ocho ventas.

La configuración vive en la constante PROSPECCION en Code.gs. Cualquier recalibración exige actualizar su versión. La aplicación publicada obtiene la configuración del servidor; el servidor vuelve a calcular antes de guardar. La vista previa incluye una copia de los parámetros iniciales para funcionar sin conexión.

## Uso

Completa agencia y nombre del asesor, selecciona Nuevos o Seminuevos y captura los prospectos de calidad generados durante el mes mostrado. El sistema calcula los faltantes. Abre la ayuda si necesitas ideas. Cuando existe déficit, escribe una acción breve y guarda.

Prospecto de calidad: intención confirmada, interés definido y siguiente paso. Cuenta cada prospecto una sola vez. Un recontacto no es automáticamente un prospecto nuevo; la reactivación sigue las políticas de la marca.

Agencia y nombre son identidad declarada, no autenticada. No se guardan datos de clientes. Las cifras e identificación permanecen en la sesión abierta; al recargar se capturan nuevamente. La fecha del servidor determina el mes. Si el mes cambia mientras la pantalla está abierta, se pide recargar.

## Registro

Una fila por guardado: ID técnico, fecha/hora, mes, zona horaria, agencia, asesor, línea, meta de ventas, objetivo de prospectos, prospectos generados, brecha con signo, faltantes, acción y parámetros utilizados. Cada registro es una revisión; no deben sumarse las capturas sucesivas como si fueran prospectos adicionales.

Se previenen doble clic y reintentos duplicados mediante un ID; los guardados simultáneos usan bloqueo. La acción e identificación se guardan como texto para evitar fórmulas. Si falla el guardado, se conserva la captura y se puede reintentar.

## Ayudas de prospección

Contienen las seis acciones aprobadas: reactivar cartera, pedir referidos, explorar renovación, coordinar con Servicio, trabajar leads digitales y activar alianzas locales. No envían mensajes ni crean tareas.

Fuente metodológica: Data_IN_Modelo de Ejecución Comercial, páginas 3–8 y 25; calibración acordada en conversación. Referencias externas consultadas para adaptar las ayudas:

- DealerSocket: https://dealersocket.com/wp-content/uploads/downloads/pdf/list-builder-success-guide.pdf
- VinSolutions: https://www.vinsolutions.com/resources/blog/may-2020/key-crm-actions-to-maximize-current-leads/
- Cox Automotive: https://www.coxautoinc.com/retail/resources/super-charging-your-dealerships-marketing-programs/
- automotiveMastermind: https://www.automotivemastermind.com/maximize-service-drive-sales/

Identidad: logotipo recuperado del paquete Radar 3D basado en LOGO-AW-BRANDING.pdf. Paleta #7564DA, #212B44 y #E2E9F3.

## Validación

Pruebas locales aprobadas: objetivos, campos vacíos, cero, negativos y fracciones; cambios de línea; brecha y cumplimiento; validación de identidad, mes y versión; guardado simulado, duplicados y sintaxis del cliente. El guardado real y la revisión visual en navegador quedan pendientes en el entorno de Google. No se ha publicado desde esta conversación.
