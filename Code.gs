// Parámetros iniciales de planeación aprobados; derivados de ejemplos, no tasas observadas.
const PROSPECCION = {version:'AW-PROS-1', salesTarget:8, lines:{nuevos:{label:'Nuevos',prospects:40,appointments:28,sales:8},seminuevos:{label:'Seminuevos',prospects:12,appointments:6,sales:2}}};
const HEADERS = ['registro_id','guardado_en','mes','zona_horaria','agencia','asesor','linea','meta_ventas','objetivo_prospectos','prospectos_generados','brecha','faltantes','accion','version_parametros','base_prospectos','base_citas','base_ventas'];
function configurar(){
 const ss=SpreadsheetApp.getActiveSpreadsheet();
 if(!ss) throw new Error('Abre Apps Script desde la hoja de destino: Extensiones → Apps Script.');
 PropertiesService.getScriptProperties().setProperty('PROSPECCION_SHEET_ID',ss.getId());
 const lock=LockService.getScriptLock();lock.waitLock(15000);
 try{sheet_();}finally{lock.releaseLock();}
}
function doGet(){return HtmlService.createTemplateFromFile('Index').evaluate().setTitle('Calculadora de Prospección | AUTOCOM WAY').addMetaTag('viewport','width=device-width, initial-scale=1');}
function include_(name){return HtmlService.createHtmlOutputFromFile(name).getContent();}
function month_(){return Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'yyyy-MM');}
function getContext(){return {month:month_(),config:PROSPECCION};}
function sheet_(){
 const id=PropertiesService.getScriptProperties().getProperty('PROSPECCION_SHEET_ID');
 if(!id) throw new Error('Falta configurar la hoja de destino. Contacta al administrador.');
 const ss=SpreadsheetApp.openById(id),s=ss.getSheetByName('Prospeccion')||ss.insertSheet('Prospeccion');
 if(s.getMaxColumns()<HEADERS.length)s.insertColumnsAfter(s.getMaxColumns(),HEADERS.length-s.getMaxColumns());
 if(s.getLastRow()===0){s.getRange(1,1,1,HEADERS.length).setValues([HEADERS]);s.setFrozenRows(1);}
 else if(s.getRange(1,1,1,HEADERS.length).getValues()[0].some((v,i)=>v!==HEADERS[i]))throw new Error('Los encabezados de Prospeccion no coinciden. Revisa la hoja antes de guardar.');
 return s;
}
function safeText_(v){return /^[=+@\-\t\r]/.test(v)?"'"+v:v;}
function saveProspection(p){
 if(!p || !/^[a-zA-Z0-9-]{16,80}$/.test(p.id||''))throw new Error('Registro inválido. Recarga la página.');
 if(p.month!==month_() || p.version!==PROSPECCION.version)throw new Error('Cambió el mes o la configuración. Recarga la calculadora.');
 const agency=typeof p.agency==='string'?p.agency.trim():'',advisor=typeof p.advisor==='string'?p.advisor.trim():'';
 if(!agency || !advisor || agency.length>120 || advisor.length>120)throw new Error('Completa agencia y nombre del asesor (máximo 120 caracteres).');
 if(!Object.prototype.hasOwnProperty.call(PROSPECCION.lines,p.line))throw new Error('Selecciona Nuevos o Seminuevos.');
 if(typeof p.generated!=='number'||!Number.isSafeInteger(p.generated)||p.generated<0||p.generated>1000000)throw new Error('Captura una cantidad entera de prospectos, igual o mayor a cero.');
 const basis=PROSPECCION.lines[p.line],target=Math.ceil(PROSPECCION.salesTarget*basis.prospects/basis.sales),gap=p.generated-target,missing=Math.max(-gap,0);
 const action=missing&&typeof p.action==='string'?p.action.trim():'';
 if(missing&&!action)throw new Error('Escribe una acción para generar los prospectos faltantes.');
 if(action.length>1000)throw new Error('Escribe una acción de hasta 1000 caracteres.');
 const lock=LockService.getScriptLock();lock.waitLock(15000);
 try{
  const s=sheet_();
  if(s.getLastRow()>1&&s.getRange(2,1,s.getLastRow()-1,1).createTextFinder(p.id).matchEntireCell(true).findNext())return {saved:true};
  s.appendRow([p.id,new Date(),p.month,Session.getScriptTimeZone(),safeText_(agency),safeText_(advisor),basis.label,PROSPECCION.salesTarget,target,p.generated,gap,missing,safeText_(action),PROSPECCION.version,basis.prospects,basis.appointments,basis.sales]);SpreadsheetApp.flush();return {saved:true};
 }finally{lock.releaseLock();}
}
