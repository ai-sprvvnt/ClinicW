# Especificación técnica  
## Sistema de Expediente Clínico Electrónico – MVP normativo

**Base normativa principal:** NOM-004-SSA3-2012 y NOM-024-SSA3-2012. La NOM-004 define el contenido mínimo del expediente clínico, sus notas y otros documentos; la NOM-024 exige que los SIRES manejen información estructurada, seguridad, trazabilidad, autenticación por usuario, autorización por roles y datos mínimos de identificación de personas. 

---

## 1. Objetivo del sistema
Desarrollar un sistema que permita:

- registrar pacientes y abrir su expediente clínico;
- capturar documentos clínicos obligatorios;
- asegurar confidencialidad, integridad, disponibilidad y trazabilidad;
- mantener documentos estructurados y cerrados tras firma;
- conservar el expediente por al menos 5 años desde el último acto médico.

---

## 2. Alcance del MVP
El MVP incluye:

- alta de paciente;
- apertura de expediente;
- historia clínica;
- nota de evolución;
- consentimiento informado;
- hoja de enfermería;
- reporte de auxiliares de diagnóstico y tratamiento;
- usuarios, roles y bitácora de auditoría.

No incluye en la primera fase:
- interoperabilidad HL7/CDA real;
- integración con RENAPO;
- firma electrónica avanzada con certificado externo;
- módulos quirúrgicos completos, urgencias y hospitalización avanzada, aunque sí queda preparado el modelo para soportarlos.

---

## 3. Requisitos funcionales

### RF-01. Alta de paciente
El sistema deberá permitir capturar y almacenar los datos mínimos de identificación de personas exigidos por la NOM-024:

- CURP
- primer apellido
- segundo apellido
- nombre
- fecha de nacimiento
- entidad de nacimiento
- sexo
- nacionalidad
- folio interno
- entidad de residencia
- municipio de residencia
- localidad de residencia

La CURP será el identificador único para intercambio y no deberá ser autogenerada por el sistema.

### RF-02. Apertura de expediente
El sistema deberá permitir abrir un expediente por paciente y establecimiento. Dentro de un mismo establecimiento deberá existir un solo expediente clínico por paciente, integrando todos los documentos generados en su atención.

### RF-03. Historia clínica
El sistema deberá capturar una historia clínica con los apartados mínimos:

- ficha de identificación;
- antecedentes heredo-familiares;
- antecedentes personales patológicos;
- antecedentes personales no patológicos;
- padecimiento actual;
- interrogatorio por aparatos y sistemas;
- exploración física;
- resultados previos y actuales de estudios;
- diagnósticos o problemas clínicos;
- pronóstico;
- indicación terapéutica.

### RF-04. Nota de evolución
El sistema deberá permitir registrar notas de evolución con:

- evolución y actualización del cuadro clínico;
- signos vitales, cuando corresponda;
- resultados relevantes;
- diagnósticos o problemas clínicos;
- pronóstico;
- tratamiento e indicaciones, incluyendo dosis, vía y periodicidad cuando haya medicamentos.

### RF-05. Consentimiento informado
El sistema deberá permitir capturar consentimiento informado con:

- institución y establecimiento;
- título del documento;
- lugar y fecha;
- acto autorizado;
- riesgos y beneficios esperados;
- autorización para contingencias;
- nombre y firma del paciente o representante;
- nombre y firma del médico;
- nombre y firma de testigos.

### RF-06. Hoja de enfermería
El sistema deberá permitir registrar:

- habitus exterior;
- gráfica/signos vitales;
- ministración de medicamentos;
- procedimientos realizados;
- observaciones.

### RF-07. Servicios auxiliares de diagnóstico y tratamiento
El sistema deberá permitir registrar:

- fecha y hora del estudio;
- identificación del solicitante;
- estudio solicitado;
- problema clínico en estudio;
- resultados;
- incidentes o accidentes;
- identificación del personal que realizó el estudio;
- nombre completo y firma de quien informa.

### RF-08. Metadatos obligatorios de notas
Toda nota o documento clínico deberá almacenar:

- nombre del paciente;
- edad;
- sexo;
- número de expediente o cama cuando aplique;
- fecha;
- hora;
- nombre completo del elaborador;
- firma autógrafa, electrónica o digital según aplique.

### RF-09. Seguridad y trazabilidad
El sistema deberá:

- autenticar usuarios con nombre de usuario y contraseña;
- operar con autorización basada en roles;
- registrar bitácora de auditoría;
- permitir trazabilidad de accesos y cambios;
- implementar mecanismos de autenticación, cifrado y firma para intercambio cuando aplique.

### RF-10. Conservación
El expediente deberá conservarse por un mínimo de 5 años contados desde el último acto médico.

---

## 4. Requisitos no funcionales

### RNF-01. Integridad documental
Los documentos clínicos deberán almacenarse como documentos electrónicos estructurados e inalterables. La implementación recomendada es:

- estado `BORRADOR` mientras se edita;
- estado `FIRMADO` al cerrar;
- una vez firmado, no se actualiza el registro clínico base;
- cualquier corrección se hace mediante nueva versión o addendum.

### RNF-02. Confidencialidad
La información clínica y los datos personales no deberán divulgarse salvo en los casos permitidos por la norma y disposiciones aplicables.

### RNF-03. Legibilidad y consistencia
Las notas deben capturarse en lenguaje técnico-médico, sin abreviaturas, sin tachaduras ni enmendaduras. En sistema esto se traduce en validaciones, bloqueo de edición tras firma y manejo de versiones.

### RNF-04. Catálogos
El sistema deberá usar catálogos para sexo, nacionalidad, entidades, municipios, localidades, tipo de documento, roles y estatus de documento. La NOM-024 exige uso y actualización de catálogos fundamentales.

---

## 5. Arquitectura lógica de datos

## 5.1 Entidades principales

### 5.1.1 `establecimientos`
Representa la unidad médica o consultorio.

Campos:
- `id_establecimiento` UUID PK
- `clues` varchar(20) null
- `tipo_establecimiento_id` FK
- `nombre_establecimiento` varchar(150) not null
- `institucion` varchar(150) null
- `razon_social` varchar(150) null
- `domicilio` text not null
- `telefono` varchar(30) null
- `activo` boolean default true
- `created_at` timestamp
- `updated_at` timestamp

### 5.1.2 `pacientes`
Representa la persona atendida.

Campos:
- `id_paciente` UUID PK
- `curp` varchar(18) not null unique
- `primer_apellido` varchar(50) not null
- `segundo_apellido` varchar(50) null
- `nombre` varchar(50) not null
- `fecha_nacimiento` date not null
- `edonac` varchar(2) not null
- `sexo` char(1) not null
- `nacionalidad` varchar(3) not null
- `folio_interno` varchar(18) not null
- `edo_residencia` varchar(2) not null
- `mun_residencia` varchar(3) not null
- `loc_residencia` varchar(4) not null
- `domicilio` text null
- `telefono` varchar(30) null
- `correo` varchar(120) null
- `activo` boolean default true
- `created_at` timestamp
- `updated_at` timestamp

### 5.1.3 `expedientes`
Representa el expediente clínico del paciente en un establecimiento.

Campos:
- `id_expediente` UUID PK
- `id_paciente` UUID FK not null
- `id_establecimiento` UUID FK not null
- `numero_expediente` varchar(30) not null
- `fecha_apertura` timestamp not null
- `fecha_ultimo_acto_medico` timestamp null
- `estado` varchar(20) not null default 'ACTIVO'
- `observaciones` text null
- `created_at` timestamp
- `updated_at` timestamp

Restricción:
- índice único lógico por `id_paciente + id_establecimiento + estado='ACTIVO'`.

### 5.1.4 `usuarios`
Representa usuarios autenticados del sistema.

Campos:
- `id_usuario` UUID PK
- `nombre_completo` varchar(150) not null
- `cedula_profesional` varchar(30) null
- `nombre_usuario` varchar(50) unique not null
- `password_hash` varchar(255) not null
- `email` varchar(120) null
- `activo` boolean default true
- `ultimo_acceso` timestamp null
- `created_at` timestamp
- `updated_at` timestamp

### 5.1.5 `roles`
Campos:
- `id_rol` UUID PK
- `clave` varchar(30) unique not null
- `nombre` varchar(80) not null

Valores iniciales:
- ADMIN
- MEDICO
- ENFERMERIA
- LABORATORIO
- RECEPCION
- AUDITOR

### 5.1.6 `usuario_rol`
Campos:
- `id_usuario_rol` UUID PK
- `id_usuario` UUID FK not null
- `id_rol` UUID FK not null
- `id_establecimiento` UUID FK null
- `created_at` timestamp

### 5.1.7 `documentos_clinicos`
Tabla madre de todos los documentos clínicos.

Campos:
- `id_documento` UUID PK
- `id_expediente` UUID FK not null
- `tipo_documento` varchar(40) not null
- `fecha_hora_creacion` timestamp not null
- `fecha_hora_cierre` timestamp null
- `elaborado_por_usuario_id` UUID FK not null
- `firmado_por_usuario_id` UUID FK null
- `nombre_responsable` varchar(150) not null
- `cedula_responsable` varchar(30) null
- `estatus_documento` varchar(20) not null default 'BORRADOR'
- `bloqueado_edicion` boolean default false
- `version` integer default 1
- `documento_padre_id` UUID null
- `hash_integridad` varchar(128) null
- `created_at` timestamp
- `updated_at` timestamp

Valores sugeridos para `tipo_documento`:
- HISTORIA_CLINICA
- NOTA_EVOLUCION
- CONSENTIMIENTO_INFORMADO
- HOJA_ENFERMERIA
- AUX_DIAGNOSTICO
- INTERCONSULTA
- REFERENCIA_TRASLADO
- NOTA_URGENCIAS
- NOTA_INGRESO
- NOTA_EGRESO

### 5.1.8 `auditoria_eventos`
Bitácora de trazabilidad.

Campos:
- `id_evento` UUID PK
- `id_usuario` UUID FK not null
- `id_paciente` UUID null
- `id_expediente` UUID null
- `id_documento` UUID null
- `accion` varchar(50) not null
- `detalle` jsonb null
- `ip_origen` varchar(64) null
- `user_agent` text null
- `fecha_hora` timestamp not null

Acciones mínimas:
- LOGIN
- LOGOUT
- CREAR_PACIENTE
- ACTUALIZAR_PACIENTE
- ABRIR_EXPEDIENTE
- CREAR_DOCUMENTO
- EDITAR_DOCUMENTO
- FIRMAR_DOCUMENTO
- VER_DOCUMENTO
- EXPORTAR_DOCUMENTO
- ANEXAR_VERSION

## 5.2 Tablas clínicas específicas

### 5.2.1 `historia_clinica`
PK/FK: `id_documento`

Campos:
- `ficha_identificacion_json` jsonb not null
- `grupo_etnico` varchar(100) null
- `antecedentes_heredo_familiares` text not null
- `antecedentes_personales_patologicos` text not null
- `antecedentes_personales_no_patologicos` text not null
- `padecimiento_actual` text not null
- `interrogatorio_aparatos_sistemas` text not null
- `habitus_exterior` text null
- `temperatura` numeric(4,1) null
- `tension_arterial` varchar(15) null
- `frecuencia_cardiaca` integer null
- `frecuencia_respiratoria` integer null
- `peso` numeric(5,2) null
- `talla` numeric(4,2) null
- `exploracion_cabeza` text null
- `exploracion_cuello` text null
- `exploracion_torax` text null
- `exploracion_abdomen` text null
- `exploracion_miembros` text null
- `exploracion_genitales` text null
- `resultados_previos_actuales` text null
- `diagnosticos` text not null
- `pronostico` text not null
- `indicacion_terapeutica` text not null

### 5.2.2 `notas_evolucion`
PK/FK: `id_documento`

Campos:
- `evolucion_cuadro_clinico` text not null
- `signos_vitales_json` jsonb null
- `resultados_relevantes` text null
- `diagnosticos` text not null
- `pronostico` text not null
- `tratamiento_indicaciones` text not null

### 5.2.3 `consentimientos_informados`
PK/FK: `id_documento`

Campos:
- `nombre_institucion` varchar(150) null
- `nombre_establecimiento` varchar(150) not null
- `titulo_documento` varchar(150) not null
- `lugar_emision` varchar(120) not null
- `fecha_emision` timestamp not null
- `acto_autorizado` text not null
- `riesgos_beneficios` text not null
- `autorizacion_contingencias` text not null
- `otorgante_nombre` varchar(150) not null
- `otorgante_tipo` varchar(30) not null
- `otorgante_firma_ref` varchar(255) null
- `medico_nombre` varchar(150) not null
- `medico_firma_ref` varchar(255) null
- `testigo_1_nombre` varchar(150) null
- `testigo_1_firma_ref` varchar(255) null
- `testigo_2_nombre` varchar(150) null
- `testigo_2_firma_ref` varchar(255) null

### 5.2.4 `hojas_enfermeria`
PK/FK: `id_documento`

Campos:
- `habitus_exterior` text null
- `grafica_signos_vitales_json` jsonb null
- `ministracion_medicamentos_json` jsonb null
- `procedimientos_realizados` text null
- `observaciones` text null

### 5.2.5 `auxiliares_diagnostico`
PK/FK: `id_documento`

Campos:
- `fecha_hora_estudio` timestamp not null
- `identificacion_solicitante` varchar(150) not null
- `estudio_solicitado` varchar(200) not null
- `problema_clinico_estudio` text not null
- `resultados_estudio` text not null
- `incidentes_accidentes` text null
- `identificacion_realizador` varchar(150) not null
- `nombre_informante` varchar(150) not null

---

## 6. Catálogos mínimos

### `cat_sexo`
- `M` Mujer
- `H` Hombre

### `cat_entidad_federativa`
Catálogo INEGI.

### `cat_municipio`
Relacionado a entidad.

### `cat_localidad`
Relacionado a municipio.

### `cat_nacionalidad`
Catálogo RENAPO.

### `cat_tipo_documento`
Valores del sistema.

### `cat_estatus_documento`
- BORRADOR
- FIRMADO
- CANCELADO
- ANULADO_POR_VERSION

---

## 7. Reglas de negocio

### RN-01
No se permitirá abrir un segundo expediente activo para el mismo paciente en el mismo establecimiento.

### RN-02
Toda nota o documento clínico deberá llevar:
- fecha,
- hora,
- nombre completo del autor,
- firma,
- referencia al expediente.

### RN-03
Los documentos clínicos firmados se bloquearán para edición directa. Las correcciones se harán mediante:
- nueva versión vinculada a `documento_padre_id`, o
- addendum.

### RN-04
Toda lectura, modificación, firma o exportación de documento generará registro en `auditoria_eventos`.

### RN-05
La información solo será visible según rol asignado. Ejemplo:
- recepción: alta de paciente y apertura de expediente;
- médico: historia clínica, evolución, consentimiento;
- enfermería: hoja de enfermería;
- laboratorio/diagnóstico: auxiliares;
- auditor: solo consulta trazable;
- admin: configuración y usuarios.

### RN-06
La aplicación validará:
- CURP longitud 18;
- FECNAC en formato de fecha válido;
- sexo según catálogo;
- residencia/nacimiento según catálogos;
- campos obligatorios por formulario.

### RN-07
El expediente se conservará como mínimo 5 años desde `fecha_ultimo_acto_medico`.

---

## 8. Especificación de formularios

## 8.1 Formulario: Alta de paciente

**Código:** FRM-PAC-001  
**Tabla principal:** `pacientes`  
**Rol autorizado:** RECEPCION, MEDICO, ADMIN

### Campos
- CURP — texto 18 — obligatorio
- Primer apellido — texto 50 — obligatorio
- Segundo apellido — texto 50 — opcional
- Nombre(s) — texto 50 — obligatorio
- Fecha de nacimiento — fecha — obligatoria
- Entidad de nacimiento — catálogo — obligatoria
- Sexo — catálogo — obligatorio
- Nacionalidad — catálogo — obligatoria
- Folio interno — texto 18 — obligatorio
- Entidad de residencia — catálogo — obligatoria
- Municipio de residencia — catálogo — obligatorio
- Localidad de residencia — catálogo — obligatoria
- Domicilio — texto largo — opcional
- Teléfono — texto 30 — opcional
- Correo — texto 120 — opcional

### Validaciones
- CURP única;
- no autogenerar CURP;
- campos obligatorios no vacíos;
- dependencia de catálogos geográficos.

## 8.2 Formulario: Apertura de expediente

**Código:** FRM-EXP-001  
**Tabla principal:** `expedientes`  
**Rol autorizado:** RECEPCION, MEDICO, ADMIN

### Campos
- Paciente — selector — obligatorio
- Establecimiento — selector — obligatorio
- Número de expediente — texto 30 — obligatorio
- Fecha de apertura — datetime — obligatorio
- Observaciones — texto — opcional

### Validaciones
- no duplicar expediente activo por paciente y establecimiento.

## 8.3 Formulario: Historia clínica

**Código:** FRM-HCL-001  
**Tabla principal:** `historia_clinica` + `documentos_clinicos`  
**Rol autorizado:** MEDICO

### Secciones
1. Ficha de identificación  
2. Antecedentes heredo-familiares  
3. Antecedentes personales patológicos  
4. Antecedentes personales no patológicos  
5. Padecimiento actual  
6. Interrogatorio por aparatos y sistemas  
7. Exploración física  
8. Resultados de estudios  
9. Diagnósticos o problemas clínicos  
10. Pronóstico  
11. Indicación terapéutica

### Metadatos automáticos
- fecha y hora creación
- usuario elaborador
- número de expediente
- nombre del paciente

### Acciones
- Guardar borrador
- Firmar y cerrar

## 8.4 Formulario: Nota de evolución

**Código:** FRM-NEV-001  
**Tabla principal:** `notas_evolucion` + `documentos_clinicos`  
**Rol autorizado:** MEDICO

### Campos
- Evolución y actualización del cuadro clínico
- Signos vitales
- Resultados relevantes
- Diagnósticos
- Pronóstico
- Tratamiento e indicaciones
- Medicamentos: dosis, vía, periodicidad

### Reglas
- una o varias por expediente;
- siempre ligada a un expediente activo;
- puede generarse versión nueva, no sobreescritura post-firma.

## 8.5 Formulario: Consentimiento informado

**Código:** FRM-CIN-001  
**Tabla principal:** `consentimientos_informados` + `documentos_clinicos`  
**Rol autorizado:** MEDICO

### Campos
- Institución
- Establecimiento
- Título
- Lugar y fecha
- Acto autorizado
- Riesgos y beneficios
- Autorización para contingencias
- Otorgante
- Médico
- Testigos 1 y 2

### Regla funcional
Debe poder generarse más de un consentimiento por expediente, porque la norma indica que se elaboran tantos consentimientos como eventos médicos lo ameriten.

## 8.6 Formulario: Hoja de enfermería

**Código:** FRM-HEN-001  
**Tabla principal:** `hojas_enfermeria` + `documentos_clinicos`  
**Rol autorizado:** ENFERMERIA

### Campos
- Habitus exterior
- Signos vitales
- Medicamentos administrados
- Procedimientos realizados
- Observaciones

## 8.7 Formulario: Auxiliares de diagnóstico

**Código:** FRM-AUX-001  
**Tabla principal:** `auxiliares_diagnostico` + `documentos_clinicos`  
**Rol autorizado:** LABORATORIO, MEDICO

### Campos
- Fecha y hora
- Solicitante
- Estudio solicitado
- Problema clínico
- Resultados
- Incidentes/accidentes
- Realizador
- Informante

---

## 9. Flujo operativo básico

### Flujo 1. Alta inicial
1. Usuario inicia sesión.
2. Captura paciente.
3. Sistema valida CURP y catálogos.
4. Se abre expediente.
5. Se registra historia clínica.
6. Médico firma historia clínica.
7. Sistema bloquea edición y genera evento de auditoría.

### Flujo 2. Atención subsecuente
1. Usuario médico abre expediente.
2. Crea nota de evolución.
3. Guarda borrador o firma.
4. Se actualiza `fecha_ultimo_acto_medico`.
5. Se registra auditoría.

### Flujo 3. Procedimiento con consentimiento
1. Médico genera consentimiento.
2. Captura acto autorizado y riesgos.
3. Se registran otorgante, médico y testigos.
4. Se firma/cierra documento.
5. Se relaciona al expediente.

---

## 10. API mínima sugerida

### Pacientes
- `POST /api/pacientes`
- `GET /api/pacientes/:id`
- `GET /api/pacientes?curp=`
- `PUT /api/pacientes/:id`

### Expedientes
- `POST /api/expedientes`
- `GET /api/expedientes/:id`
- `GET /api/expedientes?paciente_id=`

### Documentos
- `POST /api/documentos/historia-clinica`
- `POST /api/documentos/nota-evolucion`
- `POST /api/documentos/consentimiento`
- `POST /api/documentos/hoja-enfermeria`
- `POST /api/documentos/auxiliares`
- `POST /api/documentos/:id/firmar`
- `POST /api/documentos/:id/version`

### Seguridad
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/usuarios/me`

### Auditoría
- `GET /api/auditoria?expediente_id=`
- `GET /api/auditoria?paciente_id=`

---

## 11. Criterios de aceptación

### CA-01
No se puede crear paciente sin CURP, nombre y primer apellido.

### CA-02
No se puede firmar historia clínica si faltan diagnósticos, pronóstico o indicación terapéutica.

### CA-03
No se puede firmar nota de evolución si falta tratamiento e indicaciones.

### CA-04
No se puede editar un documento firmado; solo crear nueva versión o addendum.

### CA-05
Toda acción de consulta y modificación queda auditada.

### CA-06
La exportación o entrega de información debe quedar trazada.

---

## 12. Prioridad de implementación

### Sprint 1
- catálogos
- usuarios/roles
- pacientes
- expedientes
- auditoría base

### Sprint 2
- historia clínica
- nota de evolución

### Sprint 3
- consentimiento informado
- hoja de enfermería
- auxiliares de diagnóstico

### Sprint 4
- versionado documental
- bloqueo por firma
- exportación controlada
- reportes de cumplimiento

---

## 13. Recomendación de desarrollo
Para arrancar sin sobrecomplicar:

- **BD recomendada:** PostgreSQL
- **Backend:** Node.js + NestJS o Express
- **ORM:** Prisma o TypeORM
- **Frontend:** React
- **Autenticación:** JWT + refresh token
- **Auditoría:** tabla dedicada + middleware
- **Archivos de firma:** almacenamiento seguro separado

---

## 14. Decisión técnica clave
La decisión más importante es esta:

**No modelar el expediente como una sola tabla gigante.**  
Debe modelarse como:

- paciente,
- expediente,
- documento clínico madre,
- tablas detalle por tipo documental,
- seguridad,
- auditoría.
