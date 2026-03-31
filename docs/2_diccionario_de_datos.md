# Diccionario de datos  
## Sistema de Expediente Clínico Electrónico – MVP normativo

Este documento resume las entidades, campos principales, propósito funcional y reglas generales del modelo de datos propuesto para el sistema.

---

## 1. Entidades principales

### `establecimientos`
Representa la unidad médica o consultorio donde se presta la atención.

Campos principales:
- id_establecimiento
- clues
- tipo_establecimiento_id
- nombre_establecimiento
- institucion
- razon_social
- domicilio
- telefono
- activo
- created_at
- updated_at

### `pacientes`
Representa a la persona atendida y sus datos mínimos de identificación.

Campos principales:
- id_paciente
- curp
- primer_apellido
- segundo_apellido
- nombre
- fecha_nacimiento
- edonac
- sexo
- nacionalidad
- folio_interno
- edo_residencia
- mun_residencia
- loc_residencia
- domicilio
- telefono
- correo
- activo
- created_at
- updated_at

### `expedientes`
Representa el expediente clínico de un paciente dentro de un establecimiento.

Campos principales:
- id_expediente
- id_paciente
- id_establecimiento
- numero_expediente
- fecha_apertura
- fecha_ultimo_acto_medico
- estado
- observaciones
- created_at
- updated_at

### `usuarios`
Representa a las personas autenticadas que usan el sistema.

Campos principales:
- id_usuario
- nombre_completo
- cedula_profesional
- nombre_usuario
- password_hash
- email
- activo
- ultimo_acceso
- created_at
- updated_at

### `roles`
Define los perfiles de acceso del sistema.

Campos principales:
- id_rol
- clave
- nombre
- descripcion

### `usuario_rol`
Relaciona usuarios con roles y opcionalmente con un establecimiento.

Campos principales:
- id_usuario_rol
- id_usuario
- id_rol
- id_establecimiento
- created_at

### `documentos_clinicos`
Tabla madre que concentra los metadatos de todos los documentos clínicos.

Campos principales:
- id_documento
- id_expediente
- tipo_documento
- fecha_hora_creacion
- fecha_hora_cierre
- elaborado_por_usuario_id
- firmado_por_usuario_id
- nombre_responsable
- cedula_responsable
- estatus_documento
- bloqueado_edicion
- version
- documento_padre_id
- hash_integridad
- created_at
- updated_at

### `auditoria_eventos`
Bitácora para trazabilidad de acciones críticas.

Campos principales:
- id_evento
- id_usuario
- id_paciente
- id_expediente
- id_documento
- accion
- detalle
- ip_origen
- user_agent
- fecha_hora

---

## 2. Entidades clínicas específicas

### `historia_clinica`
Detalle del documento de historia clínica.

Campos principales:
- id_documento
- ficha_identificacion_json
- grupo_etnico
- antecedentes_heredo_familiares
- antecedentes_personales_patologicos
- antecedentes_personales_no_patologicos
- padecimiento_actual
- interrogatorio_aparatos_sistemas
- habitus_exterior
- temperatura
- tension_arterial
- frecuencia_cardiaca
- frecuencia_respiratoria
- peso
- talla
- exploracion_cabeza
- exploracion_cuello
- exploracion_torax
- exploracion_abdomen
- exploracion_miembros
- exploracion_genitales
- resultados_previos_actuales
- diagnosticos
- pronostico
- indicacion_terapeutica

### `notas_evolucion`
Detalle del documento de nota de evolución.

Campos principales:
- id_documento
- evolucion_cuadro_clinico
- signos_vitales_json
- resultados_relevantes
- diagnosticos
- pronostico
- tratamiento_indicaciones

### `interconsultas`
Detalle del documento de interconsulta.

Campos principales:
- id_documento
- criterio_diagnostico
- plan_estudios
- sugerencias_diagnosticas
- tratamiento_sugerido
- motivo_consulta

### `referencias_traslados`
Detalle del documento de referencia o traslado.

Campos principales:
- id_documento
- establecimiento_envia
- establecimiento_receptor
- motivo_envio
- impresion_diagnostica
- terapeutica_empleada

### `hojas_enfermeria`
Detalle del documento de enfermería.

Campos principales:
- id_documento
- habitus_exterior
- grafica_signos_vitales_json
- ministracion_medicamentos_json
- procedimientos_realizados
- valoracion_dolor
- nivel_riesgo_caidas
- observaciones

### `auxiliares_diagnostico`
Detalle del reporte de estudios auxiliares.

Campos principales:
- id_documento
- fecha_hora_estudio
- identificacion_solicitante
- estudio_solicitado
- problema_clinico_estudio
- resultados_estudio
- incidentes_accidentes
- identificacion_realizador
- nombre_informante

### `consentimientos_informados`
Detalle del consentimiento informado.

Campos principales:
- id_documento
- nombre_institucion
- nombre_establecimiento
- titulo_documento
- lugar_emision
- fecha_emision
- acto_autorizado
- riesgos_beneficios
- autorizacion_contingencias
- otorgante_nombre
- otorgante_tipo
- otorgante_firma_ref
- medico_nombre
- medico_firma_ref
- testigo_1_nombre
- testigo_1_firma_ref
- testigo_2_nombre
- testigo_2_firma_ref

---

## 3. Catálogos mínimos

### `cat_tipo_establecimiento`
Catálogo para clasificar el tipo de establecimiento.

### `cat_tipo_documento`
Catálogo para clasificar el tipo documental.

### `cat_estatus_documento`
Catálogo para el estatus de los documentos:
- BORRADOR
- FIRMADO
- ANULADO
- VERSIONADO

### `cat_sexo`
Catálogo base:
- M
- H

### `cat_entidad_federativa`
Catálogo geográfico de entidades.

### `cat_municipio`
Catálogo geográfico de municipios.

### `cat_localidad`
Catálogo geográfico de localidades.

### `cat_nacionalidad`
Catálogo de nacionalidades.

---

## 4. Reglas globales del modelo

- Un paciente no puede tener más de un expediente activo en el mismo establecimiento.
- Todo documento clínico debe guardar fecha, hora, autor y firma.
- Los documentos firmados deben quedar bloqueados para edición directa.
- Las correcciones se manejan por versión o addendum.
- Toda acción sensible debe registrarse en auditoría.
- El expediente debe conservarse al menos 5 años desde el último acto médico.
- El acceso a la información debe controlarse por usuario y rol.
- Los catálogos geográficos y de identificación deben validarse.
