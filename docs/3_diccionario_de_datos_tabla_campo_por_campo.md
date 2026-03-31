# Diccionario de datos en tabla campo por campo  
## Sistema de Expediente Clínico Electrónico – MVP normativo

---

# 1) Tabla: `establecimientos`

| Campo | Tipo SQL sugerido | Longitud | Nulo | PK/FK | Default | Regla / validación | Descripción funcional |
|---|---:|---:|---|---|---|---|---|
| id_establecimiento | UUID | — | No | PK | gen_random_uuid() | único | Identificador interno del establecimiento |
| clues | VARCHAR | 20 | Sí | — | null | opcional, único si se usa | Clave CLUES del establecimiento |
| tipo_establecimiento_id | UUID | — | No | FK | — | debe existir en catálogo | Tipo de unidad médica / consultorio |
| nombre_establecimiento | VARCHAR | 150 | No | — | — | no vacío | Nombre del establecimiento |
| institucion | VARCHAR | 150 | Sí | — | null | opcional | Institución a la que pertenece |
| razon_social | VARCHAR | 150 | Sí | — | null | opcional | Razón o denominación social |
| domicilio | TEXT | — | No | — | — | no vacío | Domicilio del establecimiento |
| telefono | VARCHAR | 30 | Sí | — | null | formato libre controlado | Teléfono de contacto |
| activo | BOOLEAN | — | No | — | true | booleano | Estatus lógico |
| created_at | TIMESTAMP | — | No | — | now() | automático | Fecha de creación |
| updated_at | TIMESTAMP | — | No | — | now() | automático | Fecha de actualización |

---

# 2) Tabla: `pacientes`

| Campo | Tipo SQL sugerido | Longitud | Nulo | PK/FK | Default | Regla / validación | Descripción funcional |
|---|---:|---:|---|---|---|---|---|
| id_paciente | UUID | — | No | PK | gen_random_uuid() | único | Identificador interno del paciente |
| curp | VARCHAR | 18 | No | — | — | único, 18 caracteres, no autogenerar | CURP del paciente |
| primer_apellido | VARCHAR | 50 | No | — | — | no vacío | Primer apellido |
| segundo_apellido | VARCHAR | 50 | Sí | — | null | opcional | Segundo apellido |
| nombre | VARCHAR | 50 | No | — | — | no vacío | Nombre(s) |
| fecha_nacimiento | DATE | — | No | — | — | fecha válida | Fecha de nacimiento |
| edonac | CHAR | 2 | No | — | — | catálogo entidad/NE/00 | Entidad de nacimiento |
| sexo | CHAR | 1 | No | — | — | catálogo M/H según implementación base | Sexo |
| nacionalidad | VARCHAR | 3 | No | — | — | catálogo | Nacionalidad |
| folio_interno | VARCHAR | 18 | No | — | — | no vacío | Folio interno de la institución |
| edo_residencia | CHAR | 2 | No | — | — | catálogo | Entidad de residencia |
| mun_residencia | CHAR | 3 | No | — | — | catálogo | Municipio de residencia |
| loc_residencia | CHAR | 4 | No | — | — | catálogo | Localidad de residencia |
| domicilio | TEXT | — | Sí | — | null | opcional | Domicilio del paciente |
| telefono | VARCHAR | 30 | Sí | — | null | opcional | Teléfono |
| correo | VARCHAR | 120 | Sí | — | null | email si se captura | Correo electrónico |
| activo | BOOLEAN | — | No | — | true | booleano | Estatus lógico |
| created_at | TIMESTAMP | — | No | — | now() | automático | Fecha de creación |
| updated_at | TIMESTAMP | — | No | — | now() | automático | Fecha de actualización |

---

# 3) Tabla: `expedientes`

| Campo | Tipo SQL sugerido | Longitud | Nulo | PK/FK | Default | Regla / validación | Descripción funcional |
|---|---:|---:|---|---|---|---|---|
| id_expediente | UUID | — | No | PK | gen_random_uuid() | único | Identificador interno del expediente |
| id_paciente | UUID | — | No | FK | — | debe existir en pacientes | Paciente titular del expediente |
| id_establecimiento | UUID | — | No | FK | — | debe existir en establecimientos | Establecimiento dueño del expediente |
| numero_expediente | VARCHAR | 30 | No | — | — | único por establecimiento | Número visible del expediente |
| fecha_apertura | TIMESTAMP | — | No | — | now() | automático | Fecha de apertura |
| fecha_ultimo_acto_medico | TIMESTAMP | — | Sí | — | null | se actualiza con cada atención | Base para conservación |
| estado | VARCHAR | 20 | No | — | 'ACTIVO' | catálogo recomendado | Estado del expediente |
| observaciones | TEXT | — | Sí | — | null | opcional | Observaciones administrativas |
| created_at | TIMESTAMP | — | No | — | now() | automático | Fecha de creación |
| updated_at | TIMESTAMP | — | No | — | now() | automático | Fecha de actualización |

---

# 4) Tabla: `usuarios`

| Campo | Tipo SQL sugerido | Longitud | Nulo | PK/FK | Default | Regla / validación | Descripción funcional |
|---|---:|---:|---|---|---|---|---|
| id_usuario | UUID | — | No | PK | gen_random_uuid() | único | Identificador interno |
| nombre_completo | VARCHAR | 150 | No | — | — | no vacío | Nombre del usuario |
| cedula_profesional | VARCHAR | 30 | Sí | — | null | opcional | Cédula profesional |
| nombre_usuario | VARCHAR | 50 | No | — | — | único | Usuario de acceso |
| password_hash | VARCHAR | 255 | No | — | — | hash obligatorio | Contraseña cifrada/hash |
| email | VARCHAR | 120 | Sí | — | null | email válido | Correo del usuario |
| activo | BOOLEAN | — | No | — | true | booleano | Estatus lógico |
| ultimo_acceso | TIMESTAMP | — | Sí | — | null | automático | Último acceso |
| created_at | TIMESTAMP | — | No | — | now() | automático | Fecha de creación |
| updated_at | TIMESTAMP | — | No | — | now() | automático | Fecha de actualización |

---

# 5) Tabla: `roles`

| Campo | Tipo SQL sugerido | Longitud | Nulo | PK/FK | Default | Regla / validación | Descripción funcional |
|---|---:|---:|---|---|---|---|---|
| id_rol | UUID | — | No | PK | gen_random_uuid() | único | Identificador del rol |
| clave | VARCHAR | 30 | No | — | — | único | Clave técnica del rol |
| nombre | VARCHAR | 80 | No | — | — | no vacío | Nombre visible del rol |
| descripcion | TEXT | — | Sí | — | null | opcional | Descripción funcional |

---

# 6) Tabla: `usuario_rol`

| Campo | Tipo SQL sugerido | Longitud | Nulo | PK/FK | Default | Regla / validación | Descripción funcional |
|---|---:|---:|---|---|---|---|---|
| id_usuario_rol | UUID | — | No | PK | gen_random_uuid() | único | Identificador interno |
| id_usuario | UUID | — | No | FK | — | debe existir en usuarios | Usuario asignado |
| id_rol | UUID | — | No | FK | — | debe existir en roles | Rol asignado |
| id_establecimiento | UUID | — | Sí | FK | null | opcional | Alcance por establecimiento |
| created_at | TIMESTAMP | — | No | — | now() | automático | Fecha de asignación |

---

# 7) Tabla: `documentos_clinicos`

| Campo | Tipo SQL sugerido | Longitud | Nulo | PK/FK | Default | Regla / validación | Descripción funcional |
|---|---:|---:|---|---|---|---|---|
| id_documento | UUID | — | No | PK | gen_random_uuid() | único | Identificador del documento |
| id_expediente | UUID | — | No | FK | — | debe existir en expedientes | Expediente al que pertenece |
| tipo_documento | VARCHAR | 40 | No | — | — | catálogo | Tipo documental |
| fecha_hora_creacion | TIMESTAMP | — | No | — | now() | automático | Fecha/hora de creación |
| fecha_hora_cierre | TIMESTAMP | — | Sí | — | null | al firmar/cerrar | Fecha/hora de cierre |
| elaborado_por_usuario_id | UUID | — | No | FK | — | debe existir en usuarios | Usuario que elabora |
| firmado_por_usuario_id | UUID | — | Sí | FK | null | opcional hasta firma | Usuario que firma/cierra |
| nombre_responsable | VARCHAR | 150 | No | — | — | no vacío | Nombre visible del responsable |
| cedula_responsable | VARCHAR | 30 | Sí | — | null | opcional | Cédula del responsable |
| nombre_paciente_snapshot | VARCHAR | 150 | No | — | — | no vacío | Nombre del paciente al momento del documento |
| edad_snapshot | INTEGER | — | No | — | — | >= 0 | Edad calculada al momento del documento |
| sexo_snapshot | CHAR | 1 | No | — | — | catálogo | Sexo al momento del documento |
| numero_expediente_snapshot | VARCHAR | 30 | No | — | — | no vacío | Número de expediente visible |
| numero_cama | VARCHAR | 20 | Sí | — | null | opcional | Número de cama cuando aplique |
| estatus_documento | VARCHAR | 20 | No | — | 'BORRADOR' | catálogo | Borrador / firmado / anulado |
| bloqueado_edicion | BOOLEAN | — | No | — | false | true al firmar | Control de inalterabilidad |
| version | INTEGER | — | No | — | 1 | >= 1 | Versión del documento |
| documento_padre_id | UUID | — | Sí | FK | null | opcional | Referencia a versión previa |
| hash_integridad | VARCHAR | 128 | Sí | — | null | recomendado | Hash para integridad |
| created_at | TIMESTAMP | — | No | — | now() | automático | Fecha de inserción |
| updated_at | TIMESTAMP | — | No | — | now() | automático | Fecha de actualización |

---

# 8) Tabla: `auditoria_eventos`

| Campo | Tipo SQL sugerido | Longitud | Nulo | PK/FK | Default | Regla / validación | Descripción funcional |
|---|---:|---:|---|---|---|---|---|
| id_evento | UUID | — | No | PK | gen_random_uuid() | único | Identificador del evento |
| id_usuario | UUID | — | No | FK | — | debe existir en usuarios | Usuario que ejecutó la acción |
| id_paciente | UUID | — | Sí | FK | null | opcional | Paciente relacionado |
| id_expediente | UUID | — | Sí | FK | null | opcional | Expediente relacionado |
| id_documento | UUID | — | Sí | FK | null | opcional | Documento relacionado |
| accion | VARCHAR | 50 | No | — | — | catálogo técnico | Acción realizada |
| detalle | JSONB | — | Sí | — | null | opcional | Payload del evento |
| ip_origen | VARCHAR | 64 | Sí | — | null | opcional | IP de origen |
| user_agent | TEXT | — | Sí | — | null | opcional | Dispositivo/navegador |
| fecha_hora | TIMESTAMP | — | No | — | now() | automático | Momento del evento |

---

# 9) Tabla: `historia_clinica`

| Campo | Tipo SQL sugerido | Longitud | Nulo | PK/FK | Default | Regla / validación | Descripción funcional |
|---|---:|---:|---|---|---|---|---|
| id_documento | UUID | — | No | PK/FK | — | debe existir en documentos_clinicos | Documento base |
| ficha_identificacion_json | JSONB | — | No | — | — | estructura válida | Datos de identificación clínica |
| grupo_etnico | VARCHAR | 100 | Sí | — | null | opcional | Grupo étnico si aplica |
| antecedentes_heredo_familiares | TEXT | — | No | — | — | no vacío | Antecedentes heredo-familiares |
| antecedentes_personales_patologicos | TEXT | — | No | — | — | no vacío | APP |
| antecedentes_personales_no_patologicos | TEXT | — | No | — | — | no vacío | APNP |
| padecimiento_actual | TEXT | — | No | — | — | no vacío | Padecimiento actual |
| interrogatorio_aparatos_sistemas | TEXT | — | No | — | — | no vacío | Interrogatorio por aparatos y sistemas |
| habitus_exterior | TEXT | — | Sí | — | null | opcional | Habitus exterior |
| temperatura | NUMERIC | 4,1 | Sí | — | null | rango clínico | Temperatura |
| tension_arterial | VARCHAR | 15 | Sí | — | null | formato controlado | Tensión arterial |
| frecuencia_cardiaca | INTEGER | — | Sí | — | null | >= 0 | FC |
| frecuencia_respiratoria | INTEGER | — | Sí | — | null | >= 0 | FR |
| peso | NUMERIC | 5,2 | Sí | — | null | >= 0 | Peso |
| talla | NUMERIC | 4,2 | Sí | — | null | >= 0 | Talla |
| exploracion_cabeza | TEXT | — | Sí | — | null | opcional | Exploración cabeza |
| exploracion_cuello | TEXT | — | Sí | — | null | opcional | Exploración cuello |
| exploracion_torax | TEXT | — | Sí | — | null | opcional | Exploración tórax |
| exploracion_abdomen | TEXT | — | Sí | — | null | opcional | Exploración abdomen |
| exploracion_miembros | TEXT | — | Sí | — | null | opcional | Exploración miembros |
| exploracion_genitales | TEXT | — | Sí | — | null | opcional | Exploración genitales |
| resultados_previos_actuales | TEXT | — | Sí | — | null | opcional | Resultados de laboratorio/gabinete |
| diagnosticos | TEXT | — | No | — | — | no vacío | Diagnósticos o problemas clínicos |
| pronostico | TEXT | — | No | — | — | no vacío | Pronóstico |
| indicacion_terapeutica | TEXT | — | No | — | — | no vacío | Indicación terapéutica |

---

# 10) Tabla: `notas_evolucion`

| Campo | Tipo SQL sugerido | Longitud | Nulo | PK/FK | Default | Regla / validación | Descripción funcional |
|---|---:|---:|---|---|---|---|---|
| id_documento | UUID | — | No | PK/FK | — | debe existir en documentos_clinicos | Documento base |
| evolucion_cuadro_clinico | TEXT | — | No | — | — | no vacío | Evolución clínica |
| signos_vitales_json | JSONB | — | Sí | — | null | estructura válida | Signos vitales del momento |
| resultados_relevantes | TEXT | — | Sí | — | null | opcional | Resultados relevantes |
| diagnosticos | TEXT | — | No | — | — | no vacío | Diagnósticos o problemas clínicos |
| pronostico | TEXT | — | No | — | — | no vacío | Pronóstico |
| tratamiento_indicaciones | TEXT | — | No | — | — | no vacío | Tratamiento e indicaciones |

---

# 11) Tabla: `interconsultas`

| Campo | Tipo SQL sugerido | Longitud | Nulo | PK/FK | Default | Regla / validación | Descripción funcional |
|---|---:|---:|---|---|---|---|---|
| id_documento | UUID | — | No | PK/FK | — | debe existir en documentos_clinicos | Documento base |
| criterio_diagnostico | TEXT | — | No | — | — | no vacío | Criterio diagnóstico |
| plan_estudios | TEXT | — | Sí | — | null | opcional | Plan de estudios |
| sugerencias_diagnosticas | TEXT | — | Sí | — | null | opcional | Sugerencias diagnósticas |
| tratamiento_sugerido | TEXT | — | Sí | — | null | opcional | Sugerencias terapéuticas |
| motivo_consulta | TEXT | — | Sí | — | null | opcional | Motivo de interconsulta |

---

# 12) Tabla: `referencias_traslados`

| Campo | Tipo SQL sugerido | Longitud | Nulo | PK/FK | Default | Regla / validación | Descripción funcional |
|---|---:|---:|---|---|---|---|---|
| id_documento | UUID | — | No | PK/FK | — | debe existir en documentos_clinicos | Documento base |
| establecimiento_envia | VARCHAR | 150 | No | — | — | no vacío | Emisor |
| establecimiento_receptor | VARCHAR | 150 | No | — | — | no vacío | Receptor |
| motivo_envio | TEXT | — | No | — | — | no vacío | Motivo del envío |
| impresion_diagnostica | TEXT | — | No | — | — | no vacío | Impresión diagnóstica |
| terapeutica_empleada | TEXT | — | Sí | — | null | opcional | Terapéutica previa |

---

# 13) Tabla: `hojas_enfermeria`

| Campo | Tipo SQL sugerido | Longitud | Nulo | PK/FK | Default | Regla / validación | Descripción funcional |
|---|---:|---:|---|---|---|---|---|
| id_documento | UUID | — | No | PK/FK | — | debe existir en documentos_clinicos | Documento base |
| habitus_exterior | TEXT | — | Sí | — | null | opcional | Habitus exterior |
| grafica_signos_vitales_json | JSONB | — | Sí | — | null | estructura válida | Signos vitales seriados |
| ministracion_medicamentos_json | JSONB | — | Sí | — | null | estructura válida | Fecha, hora, vía, dosis, aplicador |
| procedimientos_realizados | TEXT | — | Sí | — | null | opcional | Procedimientos realizados |
| valoracion_dolor | VARCHAR | 50 | Sí | — | null | opcional | Localización y escala |
| nivel_riesgo_caidas | VARCHAR | 30 | Sí | — | null | opcional | Riesgo de caídas |
| observaciones | TEXT | — | Sí | — | null | opcional | Observaciones de enfermería |

---

# 14) Tabla: `auxiliares_diagnostico`

| Campo | Tipo SQL sugerido | Longitud | Nulo | PK/FK | Default | Regla / validación | Descripción funcional |
|---|---:|---:|---|---|---|---|---|
| id_documento | UUID | — | No | PK/FK | — | debe existir en documentos_clinicos | Documento base |
| fecha_hora_estudio | TIMESTAMP | — | No | — | — | obligatorio | Fecha y hora del estudio |
| identificacion_solicitante | VARCHAR | 150 | No | — | — | no vacío | Quién solicita |
| estudio_solicitado | VARCHAR | 200 | No | — | — | no vacío | Estudio solicitado |
| problema_clinico_estudio | TEXT | — | No | — | — | no vacío | Problema clínico en estudio |
| resultados_estudio | TEXT | — | No | — | — | no vacío | Resultados del estudio |
| incidentes_accidentes | TEXT | — | Sí | — | null | opcional | Incidentes si los hubo |
| identificacion_realizador | VARCHAR | 150 | No | — | — | no vacío | Quién realizó el estudio |
| nombre_informante | VARCHAR | 150 | No | — | — | no vacío | Quien informa resultados |

---

# 15) Tabla: `consentimientos_informados`

| Campo | Tipo SQL sugerido | Longitud | Nulo | PK/FK | Default | Regla / validación | Descripción funcional |
|---|---:|---:|---|---|---|---|---|
| id_documento | UUID | — | No | PK/FK | — | debe existir en documentos_clinicos | Documento base |
| nombre_institucion | VARCHAR | 150 | Sí | — | null | opcional | Institución a la que pertenece |
| nombre_establecimiento | VARCHAR | 150 | No | — | — | no vacío | Nombre o razón social del establecimiento |
| titulo_documento | VARCHAR | 150 | No | — | — | no vacío | Título del documento |
| lugar_emision | VARCHAR | 120 | No | — | — | no vacío | Lugar de emisión |
| fecha_emision | TIMESTAMP | — | No | — | — | obligatorio | Fecha y hora |
| acto_autorizado | TEXT | — | No | — | — | no vacío | Procedimiento autorizado |
| riesgos_beneficios | TEXT | — | No | — | — | no vacío | Riesgos y beneficios esperados |
| autorizacion_contingencias | TEXT | — | No | — | — | no vacío | Autorización para contingencias |
| otorgante_nombre | VARCHAR | 150 | No | — | — | no vacío | Paciente o representante |
| otorgante_tipo | VARCHAR | 30 | No | — | — | paciente/representante/tutor/familiar | Tipo de otorgante |
| otorgante_firma_ref | VARCHAR | 255 | Sí | — | null | opcional | Ruta o referencia de firma |
| medico_nombre | VARCHAR | 150 | No | — | — | no vacío | Médico que informa/recaba |
| medico_firma_ref | VARCHAR | 255 | Sí | — | null | opcional | Ruta o referencia de firma |
| testigo_1_nombre | VARCHAR | 150 | Sí | — | null | recomendable | Testigo 1 |
| testigo_1_firma_ref | VARCHAR | 255 | Sí | — | null | opcional | Firma testigo 1 |
| testigo_2_nombre | VARCHAR | 150 | Sí | — | null | recomendable | Testigo 2 |
| testigo_2_firma_ref | VARCHAR | 255 | Sí | — | null | opcional | Firma testigo 2 |

---

# 16) Catálogos mínimos recomendados

## `cat_tipo_establecimiento`
| Campo | Tipo | Regla |
|---|---|---|
| id_tipo_establecimiento | UUID PK | único |
| clave | VARCHAR(30) | único |
| nombre | VARCHAR(100) | no vacío |

## `cat_tipo_documento`
| Campo | Tipo | Regla |
|---|---|---|
| id_tipo_documento | UUID PK | único |
| clave | VARCHAR(40) | único |
| nombre | VARCHAR(120) | no vacío |

## `cat_estatus_documento`
| Campo | Tipo | Regla |
|---|---|---|
| id_estatus_documento | UUID PK | único |
| clave | VARCHAR(20) | único |
| nombre | VARCHAR(80) | no vacío |

## `cat_sexo`
| Campo | Tipo | Regla |
|---|---|---|
| clave | CHAR(1) PK | M / H según catálogo base |
| nombre | VARCHAR(20) | no vacío |

## `cat_entidad_federativa`
| Campo | Tipo | Regla |
|---|---|---|
| clave | CHAR(2) PK | catálogo oficial |
| nombre | VARCHAR(120) | no vacío |

## `cat_municipio`
| Campo | Tipo | Regla |
|---|---|---|
| clave_entidad | CHAR(2) | FK |
| clave_municipio | CHAR(3) | PK compuesta |
| nombre | VARCHAR(120) | no vacío |

## `cat_localidad`
| Campo | Tipo | Regla |
|---|---|---|
| clave_entidad | CHAR(2) | FK |
| clave_municipio | CHAR(3) | FK |
| clave_localidad | CHAR(4) | PK compuesta |
| nombre | VARCHAR(150) | no vacío |

## `cat_nacionalidad`
| Campo | Tipo | Regla |
|---|---|---|
| clave | VARCHAR(3) PK | catálogo oficial |
| nombre | VARCHAR(80) | no vacío |

---

# 17) Reglas transversales del diccionario

| Regla | Aplicación |
|---|---|
| No puede existir más de un expediente activo por paciente en el mismo establecimiento | `expedientes` |
| Toda nota/documento debe guardar fecha, hora, autor y firma | `documentos_clinicos` + tablas hijas |
| Documento firmado = documento bloqueado para edición directa | `documentos_clinicos` |
| Correcciones por nueva versión o addendum | `documentos_clinicos` |
| Toda consulta, creación, edición, firma o exportación debe auditarse | `auditoria_eventos` |
| El expediente debe conservarse al menos 5 años desde el último acto médico | `expedientes` |
| La información clínica debe manejarse con confidencialidad y control de acceso | `usuarios`, `roles`, `usuario_rol`, `auditoria_eventos` |
