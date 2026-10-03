const PROSPECCION={version:'AW-PROS-2',salesTarget:8,holidays:['2026-11-16','2026-12-25','2027-01-01','2027-02-01','2027-03-15'],workdays:[1,2,3,4,5,6],lines:{nuevos:{label:'Nuevos',conversion:0.25},seminuevos:{label:'Seminuevos',conversion:0.25}}};
const DIRECTORIO_COLS={id:'No. empleado',nombre:'Nombre completo',agencia:'Unidad de negocio',linea:'Línea',puesto:'Puesto',estatus:'Estatus',correo:'Correo'};
const CAP_HEADERS=['captura_id','fecha','mes','asesor_id','nombre','agencia','linea','prospectos_dia','acumulado_mes','meta_ventas','conversion','objetivo_prospectos','dia_habil','dias_habiles_mes','esperado_hoy','ritmo_pct','semaforo','faltantes','por_dia','accion','creado_en','actualizado_en','version_parametros'];
const SOL_HEADERS=['fecha','tipo','asesor_id','nombre','unidad_negocio','linea','detalle','solicitado_por','estatus'];
let LOGIC_INSTANCE;
function logic_(){if(!LOGIC_INSTANCE){const src=include_('Logic').replace(/^\s*<script>\s*/,'').replace(/\s*<\/script>\s*$/,'');LOGIC_INSTANCE=new Function(src+'; return Prospecting;')();}return LOGIC_INSTANCE;}
function include_(name){return HtmlService.createHtmlOutputFromFile(name).getContent();}
function doGet(){return HtmlService.createTemplateFromFile('Index').evaluate().setTitle('Calculadora de Prospección | AUTOCOM WAY').addMetaTag('viewport','width=device-width, initial-scale=1');}
function props_(){return PropertiesService.getScriptProperties();}
function today_(){return Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'yyyy-MM-dd');}
function hash_(s){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,s,Utilities.Charset.UTF_8).map(b=>('0'+((b+256)%256).toString(16)).slice(-2)).join('');}
function configKey_(){return hash_(JSON.stringify(PROSPECCION));}
function getContext(){const today=today_();return {today,month:today.slice(0,7),config:PROSPECCION,configKey:configKey_(),allowedDates:logic_().allowedDates(today,PROSPECCION)};}
function norm_(v){return String(v==null?'':v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/\s+/g,' ');}
function clean_(v){return String(v==null?'':v).trim().replace(/\s+/g,' ');}
function text_(v,label,max){if(typeof v!=='string'||!v.trim()||v.trim().length>max)throw new Error('Revisa '+label+' (máximo '+max+' caracteres).');return clean_(v);}
function safeText_(v){return /^[=+@\-\t\r]/.test(String(v))?"'"+v:v;}
function lock_(fn){const l=LockService.getScriptLock();l.waitLock(20000);try{return fn();}finally{l.releaseLock();}}
// Solo el propietario autenticado puede ejecutar utilidades administrativas; no el visitante anónimo.
function admin_(){const a=Session.getActiveUser().getEmail(),e=Session.getEffectiveUser().getEmail();if(!a||a!==e)throw new Error('Ejecuta esta función desde el editor como propietario del proyecto.');}
function book_(){const id=props_().getProperty('PROSPECCION_SHEET_ID');if(!id)throw new Error('Falta configurar la hoja de la calculadora. Contacta al administrador.');return SpreadsheetApp.openById(id);}
function ensureSheet_(book,name,headers){
 const s=book.getSheetByName(name)||book.insertSheet(name);
 if(s.getMaxColumns()<headers.length)s.insertColumnsAfter(s.getMaxColumns(),headers.length-s.getMaxColumns());
 if(!s.getLastRow()){s.getRange(1,1,1,headers.length).setValues([headers]);s.setFrozenRows(1);}
 else if(s.getRange(1,1,1,headers.length).getDisplayValues()[0].some((v,i)=>v!==headers[i]))throw new Error('Encabezados incorrectos en '+name+'. No se modificaron los registros.');
 return s;
}
function sheets_(book,create){
 if(create)return {cap:ensureSheet_(book,'Capturas',CAP_HEADERS),sol:ensureSheet_(book,'Solicitudes',SOL_HEADERS)};
 const cap=book.getSheetByName('Capturas'),sol=book.getSheetByName('Solicitudes');
 if(!cap||!sol)throw new Error('Ejecuta configurar desde el editor antes de utilizar la calculadora.');
 [[cap,CAP_HEADERS],[sol,SOL_HEADERS]].forEach(pair=>{const actual=pair[0].getRange(1,1,1,pair[1].length).getDisplayValues()[0];if(pair[1].some((h,i)=>h!==actual[i]))throw new Error('Revisa los encabezados de '+pair[0].getName()+'. No se modificaron los registros.');});
 return {cap,sol};
}
function configurar(){admin_();return lock_(()=>{const active=SpreadsheetApp.getActiveSpreadsheet();if(!props_().getProperty('PROSPECCION_SHEET_ID')){if(!active)throw new Error('Abre el proyecto desde la hoja de destino.');props_().setProperty('PROSPECCION_SHEET_ID',active.getId());}sheets_(book_(),true);return 'Capturas y Solicitudes listas. Prospeccion no se modificó.';});}
function dirKey_(){return 'AWDIR2-'+hash_((props_().getProperty('DIRECTORIO_SHEET_ID')||'')+'|'+(props_().getProperty('DIRECTORIO_TAB')||'Directorio')+JSON.stringify(DIRECTORIO_COLS)).slice(0,30);}
function directory_(fresh){
 const id=props_().getProperty('DIRECTORIO_SHEET_ID');if(!id)throw new Error('El directorio aún no está configurado. El administrador debe ejecutar crearDirectorioPrueba o establecer DIRECTORIO_SHEET_ID.');
 const cache=CacheService.getScriptCache(),key=dirKey_();if(!fresh){const hit=cache.get(key);if(hit){try{return JSON.parse(hit);}catch(e){}}}
 const sheet=SpreadsheetApp.openById(id).getSheetByName(props_().getProperty('DIRECTORIO_TAB')||'Directorio');if(!sheet)throw new Error('No se encontró la pestaña del directorio. Revisa DIRECTORIO_TAB.');
 const values=sheet.getDataRange().getDisplayValues(),headers=(values[0]||[]).map(norm_),idx={};
 Object.keys(DIRECTORIO_COLS).forEach(k=>{idx[k]=headers.indexOf(norm_(DIRECTORIO_COLS[k]));if(idx[k]<0)throw new Error('Falta la columna «'+DIRECTORIO_COLS[k]+'» en el directorio.');});
 const records=[],ids={};
 values.slice(1).forEach((row,i)=>{if(row.every(x=>!clean_(x)))return;const nombre=clean_(row[idx.nombre]),agencia=clean_(row[idx.agencia]);if(!nombre||!agencia)throw new Error('Falta nombre o unidad de negocio en la fila '+(i+2)+' del directorio.');
  let asesor_id=clean_(row[idx.id]);if(!asesor_id){asesor_id='N-'+hash_(norm_(nombre)+'|'+norm_(agencia)).slice(0,16);console.log('Directorio fila '+(i+2)+': ID de respaldo '+asesor_id);}
  const linea=norm_(row[idx.linea]),activo=norm_(row[idx.estatus])==='activo';
  if(activo&&!Object.prototype.hasOwnProperty.call(PROSPECCION.lines,linea))throw new Error('Línea inválida en directorio, fila '+(i+2)+': '+row[idx.linea]);
  if(ids[asesor_id])throw new Error('No. empleado duplicado en directorio: '+asesor_id);ids[asesor_id]=true;
  records.push({asesor_id,nombre,agencia,linea,activo});
 });
 const json=JSON.stringify(records);if(Utilities.newBlob(json).getBytes().length<95000)cache.put(key,json,600);return records;
}
function solicitudes_(s){return s.getLastRow()>1?s.getRange(2,1,s.getLastRow()-1,9).getValues().map((v,i)=>({row:i+2,v})):[];}
function temporary_(sol){return solicitudes_(sol).filter(x=>x.v[1]==='alta'&&x.v[8]==='pendiente').map(x=>({asesor_id:String(x.v[2]),nombre:String(x.v[3]),agencia:String(x.v[4]),linea:String(x.v[5]),activo:true,temporal:true}));}
function resolve_(id,dir,sol){
 id=text_(id,'identificador',160);let p=dir.find(x=>x.asesor_id===id);
 if(p){if(!p.activo)throw new Error('Este asesor está dado de baja. Selecciona otro perfil o consulta al responsable del directorio.');return p;}
 const request=solicitudes_(sol).find(x=>String(x.v[2])===id&&x.v[1]==='alta');
 if(request){if(request.v[8]==='pendiente')return {asesor_id:id,nombre:String(request.v[3]),agencia:String(request.v[4]),linea:String(request.v[5]),activo:true,temporal:true};
  try{const linked=JSON.parse(String(request.v[6]));p=dir.find(x=>x.asesor_id===linked.vinculadoA);if(p&&p.activo)return p;}catch(e){}
 }
 throw new Error('No encontramos este asesor activo. Vuelve a elegir tu agencia y nombre.');
}
function listAgencias(){const dir=directory_(),sol=sheets_(book_()).sol;return [...new Set(dir.filter(x=>x.activo).concat(temporary_(sol)).map(x=>x.agencia))].sort((a,b)=>a.localeCompare(b,'es'));}
function listAsesores(agencia){agencia=text_(agencia,'agencia',180);const dir=directory_(),sol=sheets_(book_()).sol;return dir.filter(x=>x.activo).concat(temporary_(sol)).filter(x=>norm_(x.agencia)===norm_(agencia)).map(x=>({asesor_id:x.asesor_id,nombre:x.nombre})).sort((a,b)=>a.nombre.localeCompare(b.nombre,'es'));}
function dayValue_(v){return v instanceof Date?Utilities.formatDate(v,Session.getScriptTimeZone(),'yyyy-MM-dd'):String(v);}
// Solo 8 columnas para sumar; las fotos históricas nunca se suman.
function rowsMonth_(cap,month,id){if(cap.getLastRow()<2)return [];return cap.getRange(2,1,cap.getLastRow()-1,8).getValues().map((v,i)=>({v,row:i+2})).filter(x=>String(x.v[2])===month&&String(x.v[3])===id);}
function profileMonth_(profile,cap,today){
 const rows=rowsMonth_(cap,today.slice(0,7),profile.asesor_id).sort((a,b)=>dayValue_(a.v[1]).localeCompare(dayValue_(b.v[1]))),seen={};
 const captures=rows.map(x=>{const fecha=dayValue_(x.v[1]);if(seen[fecha])throw new Error('Hay capturas duplicadas para este asesor; el administrador debe revisarlas.');seen[fecha]=true;return {fecha,prospectos:Number(x.v[7])};});
 const sum=captures.reduce((n,x)=>n+x.prospectos,0),todayRow=rows.find(x=>dayValue_(x.v[1])===today);
 return {perfil:profile,today,month:today.slice(0,7),config:PROSPECCION,configKey:configKey_(),allowedDates:logic_().allowedDates(today,PROSPECCION),capturas:captures,ultimaCaptura:captures.length?captures[captures.length-1]:null,acumulado:sum,capturaHoy:captures.find(x=>x.fecha===today)||null,accionHoy:todayRow?String(cap.getRange(todayRow.row,20).getValue()||''):'',resultado:logic_().calculate(PROSPECCION,profile.linea,sum,today)};
}
function getAsesorMes(asesorId){const dir=directory_(),s=sheets_(book_());return profileMonth_(resolve_(asesorId,dir,s.sol),s.cap,today_());}
function register_(p,dir,sol){
 const nombre=text_(p&&p.nombre,'nombre',120),agencia=text_(p&&p.agencia,'unidad de negocio',180),linea=p.linea;
 if(!Object.prototype.hasOwnProperty.call(PROSPECCION.lines,linea))throw new Error('Selecciona una línea válida.');
 const matches=dir.filter(x=>norm_(x.nombre)===norm_(nombre)&&norm_(x.agencia)===norm_(agencia));
 if(matches.length>1)throw new Error('Hay nombres coincidentes en el directorio. Solicita al responsable que verifique tu registro.');
 if(matches.length){if(!matches[0].activo)throw new Error('Tu registro está dado de baja. Solicita su revisión al responsable del directorio.');return matches[0];}
 const pending=temporary_(sol).find(x=>norm_(x.nombre)===norm_(nombre)&&norm_(x.agencia)===norm_(agencia));if(pending)return pending;
 let id;const used=new Set(solicitudes_(sol).map(x=>String(x.v[2])).concat(dir.map(x=>x.asesor_id)));do{id='T-'+Utilities.getUuid().replace(/-/g,'').slice(0,6).toUpperCase();}while(used.has(id));
 sol.appendRow([new Date(),'alta',id,safeText_(nombre),safeText_(agencia),linea,'Solicitud de alta desde la calculadora',id,'pendiente']);
 return {asesor_id:id,nombre,agencia,linea,activo:true,temporal:true};
}
function registrarAsesor(p){const dir=directory_();return lock_(()=>{const s=sheets_(book_()),profile=register_(p,dir,s.sol);SpreadsheetApp.flush();return profileMonth_(profile,s.cap,today_());});}
function checkRequest_(p,today){
 if(!p||p.month!==today.slice(0,7)||p.version!==PROSPECCION.version||p.configKey!==configKey_())throw new Error('Cambió el mes o la configuración. Recarga la calculadora.');
 if(p.today!==today)throw new Error('Cambió el día. Recarga para revisar el ritmo de hoy.');
 if(typeof p.requestId!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(p.requestId))throw new Error('Registro inválido. Recarga e intenta nuevamente.');
 if(!logic_().allowedDates(today,PROSPECCION).includes(p.fecha))throw new Error('Solo puedes capturar hoy o los últimos 3 días hábiles, dentro del mes actual.');
 if(typeof p.prospectosDia!=='number'||!Number.isSafeInteger(p.prospectosDia)||p.prospectosDia<0||p.prospectosDia>1000000)throw new Error('Captura un número entero de prospectos, igual o mayor a cero.');
}
function upsert_(p,profile,cap,today){
 checkRequest_(p,today);
 const rows=rowsMonth_(cap,today.slice(0,7),profile.asesor_id),existing=rows.filter(x=>dayValue_(x.v[1])===p.fecha);if(existing.length>1)throw new Error('Hay filas duplicadas para esta fecha. Contacta al administrador.');
 const row=existing[0];let requests=[];
 if(row){try{requests=JSON.parse(cap.getRange(row.row,1).getNote()||'[]');}catch(e){throw new Error('No se pudo validar el registro previo. Contacta al administrador.');}if(requests.includes(p.requestId))return profileMonth_(profile,cap,today);}
 const total=rows.reduce((n,x)=>n+(dayValue_(x.v[1])===p.fecha?0:Number(x.v[7])),0)+p.prospectosDia;
 const result=logic_().calculate(PROSPECCION,profile.linea,total,today),action=result.semaforo==='verde'?'':(typeof p.accion==='string'?p.accion.trim():'');
 if(result.semaforo!=='verde'&&!action)throw new Error('Escribe qué vas a hacer hoy para recuperar el ritmo.');if(action.length>1000)throw new Error('La acción debe tener hasta 1000 caracteres.');
 const created=row?cap.getRange(row.row,21).getValue():new Date(),captureId=row?String(row.v[0]):Utilities.getUuid();
 const values=[captureId,p.fecha,p.fecha.slice(0,7),profile.asesor_id,safeText_(profile.nombre),safeText_(profile.agencia),profile.linea,p.prospectosDia,total,PROSPECCION.salesTarget,PROSPECCION.lines[profile.linea].conversion,result.objetivo,result.diaHabilActual,result.diasHabilesMes,result.esperadoHoy,result.ritmo*100,result.semaforo,result.faltantes,result.porDia,safeText_(action),created,new Date(),PROSPECCION.version];
 const dest=row?row.row:cap.getLastRow()+1;
 cap.getRange(dest,2,1,3).setNumberFormat('@');cap.getRange(dest,1,1,CAP_HEADERS.length).setValues([values]);
 requests.push(p.requestId);cap.getRange(dest,1).setNote(JSON.stringify(requests));SpreadsheetApp.flush();return profileMonth_(profile,cap,today);
}
function saveCaptura(p){const dir=directory_();return lock_(()=>{const s=sheets_(book_()),profile=resolve_(p&&p.asesorId,dir,s.sol);return upsert_(p,profile,s.cap,today_());});}
function vincularTemporal(idTemporal,noEmpleado){
 admin_();text_(idTemporal,'ID temporal',160);text_(noEmpleado,'No. empleado',160);if(!/^T-[A-Z0-9]{6}$/.test(idTemporal))throw new Error('ID temporal inválido.');const dir=directory_(true),target=dir.find(x=>x.asesor_id===noEmpleado&&x.activo);if(!target)throw new Error('Primero registra al asesor activo en el directorio externo.');
 return lock_(()=>{const s=sheets_(book_()),request=solicitudes_(s.sol).find(x=>x.v[1]==='alta'&&String(x.v[2])===idTemporal);if(!request)throw new Error('Solicitud temporal no encontrada.');
  if(request.v[8]==='aplicada'){const detail=JSON.parse(String(request.v[6]));if(detail.vinculadoA===noEmpleado)return 'Ya vinculado.';throw new Error('Este temporal ya se vinculó con otra persona.');}
  if(norm_(request.v[3])!==norm_(target.nombre)||norm_(request.v[4])!==norm_(target.agencia))throw new Error('Nombre o unidad no coinciden. Revisa la identidad antes de vincular.');
  const all=s.cap.getLastRow()>1?s.cap.getRange(2,1,s.cap.getLastRow()-1,8).getValues():[],targetDates=new Set(all.filter(v=>String(v[3])===noEmpleado).map(v=>dayValue_(v[1]))),source=all.map((v,i)=>({v,row:i+2})).filter(x=>String(x.v[3])===idTemporal);
  if(source.some(x=>targetDates.has(dayValue_(x.v[1]))))throw new Error('Ambos IDs tienen capturas para la misma fecha. Resuelve el duplicado en Capturas antes de vincular; no se sumaron ni borraron registros.');
  source.forEach(x=>s.cap.getRange(x.row,4).setNumberFormat('@').setValue(noEmpleado));
  s.sol.getRange(request.row,7).setValue(JSON.stringify({vinculadoA:noEmpleado}));s.sol.getRange(request.row,9).setValue('aplicada');SpreadsheetApp.flush();CacheService.getScriptCache().remove(dirKey_());return 'Vinculado. Capturas reasignadas: '+source.length;
 });
}
function crearDirectorioPrueba(){admin_();return lock_(()=>{
 if(props_().getProperty('DIRECTORIO_SHEET_ID'))throw new Error('Ya hay un directorio configurado; no se reemplazó.');
 const book=SpreadsheetApp.create('AW · Directorio de PRUEBA'),s=book.getSheets()[0];s.setName('Directorio');
 const rows=[Object.values(DIRECTORIO_COLS)];for(let i=1;i<=12;i++)rows.push([i===12?'':'DEMO-'+String(i).padStart(3,'0'),'Asesor Demo '+i,'Unidad Demo '+Math.ceil(i/4),i%2?' NUEVOS ':'Seminuevos','Asesor de ventas',i===11?'Baja':'Activo','']);
 s.getRange(1,1,rows.length,7).setNumberFormat('@').setValues(rows);s.setFrozenRows(1);props_().setProperties({DIRECTORIO_SHEET_ID:book.getId(),DIRECTORIO_TAB:'Directorio'});console.log(book.getUrl());return book.getUrl();
 });}
function actualizarDirectorio(){admin_();CacheService.getScriptCache().remove(dirKey_());return directory_(true).filter(x=>x.activo).length+' asesores activos.';}
function testCalculos(){
 const config={version:'TEST',salesTarget:8,holidays:['2026-11-16'],workdays:[1,2,3,4,5,6],lines:{nuevos:{conversion:.25},seminuevos:{conversion:.25}}};
 const cases=[['A','2026-10-02',1,2,3,'rojo',31,26,2,27],['B','2026-10-15',16,13,16,'verde',16,15,2,27],['C','2026-10-15',13,13,16,'ambar',19,15,2,27],['D','2026-10-18',20,15,18,'verde',12,12,1,27],['E','2026-10-31',30,27,32,'ambar',2,1,2,27],['F','2026-10-31',35,27,32,'verde',0,1,0,27],['G','2026-11-16',10,12,16,'rojo',22,12,2,24]];
 let failures=0;cases.forEach(c=>{const r=logic_().calculate(config,'nuevos',c[2],c[1]),actual=[r.diaHabilActual,r.esperadoHoy,r.semaforo,r.faltantes,r.diasRestantes,r.porDia,r.diasHabilesMes],expected=c.slice(3),ok=JSON.stringify(actual)===JSON.stringify(expected)&&r.objetivo===32&&r.ritmo===c[2]/c[4];console.log((ok?'PASS ':'FAIL ')+c[0]+': '+JSON.stringify(r));if(!ok)failures++;});if(failures)throw new Error(failures+' casos fallaron.');return 'PASS: 7 casos.';
}
function testCapturas(){admin_();return lock_(()=>{
 const b=SpreadsheetApp.create('AW · Prueba aislada de capturas'),s=sheets_(b,true),dir=[];let failures=0;
 function check(name,fn){try{fn();console.log('PASS '+name);}catch(e){failures++;console.log('FAIL '+name+': '+e.message);}}
 const profile=register_({nombre:'Prueba Asesor',agencia:'Unidad de pruebas',linea:'nuevos'},dir,s.sol);
 const packet=(fecha,n,id)=>({asesorId:profile.asesor_id,fecha,prospectosDia:n,accion:'Acción de prueba',today:'2026-10-15',month:'2026-10',version:PROSPECCION.version,configKey:configKey_(),requestId:id});
 check('alta temporal',()=>{if(!profile.asesor_id.startsWith('T-'))throw new Error('Sin ID temporal');const again=register_({nombre:' PRUEBA  ASESOR ',agencia:'Unidad de pruebas',linea:'nuevos'},dir,s.sol);if(again.asesor_id!==profile.asesor_id)throw new Error('Alta duplicada');});
 [['2026-10-13',2,2],['2026-10-14',3,5],['2026-10-15',4,9]].forEach((v,i)=>check('día '+v[0],()=>{const r=upsert_(packet(v[0],v[1],'TEST-REQUEST-DAY-'+i),profile,s.cap,'2026-10-15');if(r.acumulado!==v[2])throw new Error('Acumulado '+r.acumulado);}));
 check('recaptura sin duplicados',()=>{const p=packet('2026-10-14',5,'TEST-REQUEST-EDIT-1');const r=upsert_(p,profile,s.cap,'2026-10-15');upsert_(p,profile,s.cap,'2026-10-15');if(r.acumulado!==11||s.cap.getLastRow()!==4)throw new Error('Duplicado o acumulado incorrecto');});
 check('rechazo fuera de rango',()=>{let rejected=false;try{upsert_(packet('2026-10-10',7,'TEST-REQUEST-INVALID'),profile,s.cap,'2026-10-15');}catch(e){rejected=true;}if(!rejected||profileMonth_(profile,s.cap,'2026-10-15').acumulado!==11)throw new Error('Cambió el acumulado');});
 console.log('Hoja de prueba: '+b.getUrl());if(failures)throw new Error(failures+' pruebas fallaron. Revisa '+b.getUrl());return 'PASS. Hoja de prueba: '+b.getUrl();
 });}
