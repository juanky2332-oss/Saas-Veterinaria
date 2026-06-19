// ⚠️ Archivo generado por scripts/gen-consent-plantillas.mjs a partir de la
// investigación legal. Plantillas ORIENTATIVAS de consentimiento informado
// (España): Ley 41/2002, RGPD/LOPDGDD y normativa sectorial. Deben ser
// revisadas por un asesor jurídico antes de su uso real.

export interface ConsentVariable { clave: string; label: string }
export interface PlantillaConsentimiento {
  id: string;
  /** Clave de especialidad (coincide con el vertical para recomendar). 'rgpd' = transversal. */
  especialidad: string;
  especialidadLabel: string;
  titulo: string;
  cuerpoHtml: string;
  variables: ConsentVariable[];
  marcoLegal: string[];
  aviso: string;
}

export const PLANTILLAS_CONSENTIMIENTO: PlantillaConsentimiento[] = [
  {
    "id": "estetica",
    "especialidad": "estetica",
    "especialidadLabel": "Estética",
    "titulo": "Documento de Consentimiento Informado para Tratamiento de Medicina Estética",
    "cuerpoHtml": "<p>DOCUMENTO DE CONSENTIMIENTO INFORMADO PARA TRATAMIENTO DE MEDICINA ESTÉTICA</p>\n<p>(Conforme a la Ley 41/2002, de 14 de noviembre, básica reguladora de la autonomía del paciente)</p>\n<p>1. IDENTIFICACIÓN<br>Centro sanitario: {{org_nombre}} — NIF: {{org_nif}}<br>Domicilio del centro: {{org_direccion}}<br>Médico responsable: Dr./Dra. {{profesional}} — Nº de colegiado: {{num_colegiado}}</p>\n<p>Paciente: D./Dña. {{paciente_nombre}}, con DNI/NIE {{paciente_dni}}.<br>(En su caso) Representante legal: D./Dña. {{representante_nombre}}, con DNI/NIE {{representante_dni}}, en su condición de {{representante_relacion}}.</p>\n<p>2. TRATAMIENTO PROPUESTO<br>Se me ha propuesto el siguiente tratamiento de medicina estética: {{tratamiento}}.<br>Zona/s a tratar: {{zona_tratamiento}}.<br>Producto/técnica a emplear: {{producto}}.<br>Número de sesiones previstas: {{num_sesiones}}.</p>\n<p>Declaro que se me ha explicado, en lenguaje comprensible, la naturaleza y finalidad de este tratamiento, así como su carácter VOLUNTARIO y ESTÉTICO (no curativo ni médicamente necesario).</p>\n<p>3. NATURALEZA VOLUNTARIA Y OBLIGACIÓN DE MEDIOS<br>Entiendo que se trata de un tratamiento de medicina satisfactiva, cuyo objetivo es la mejora estética, y que el profesional asume una obligación de MEDIOS y no de resultado: pondrá a mi disposición todos los medios técnicos y la diligencia adecuados conforme al estado de la ciencia, pero NO se garantiza ni asegura la obtención de un resultado concreto, dado que la respuesta depende de factores individuales.</p>\n<p>4. RESULTADOS ESPERABLES<br>Se me ha informado de los beneficios razonablemente esperables: {{beneficios}}.<br>Comprendo que el resultado puede variar entre pacientes y que, en su caso, el efecto es de carácter temporal y puede requerir tratamientos de mantenimiento o repetición.</p>\n<p>5. CONSECUENCIAS SEGURAS Y CUIDADOS<br>Se me ha informado de las consecuencias que el procedimiento origina con seguridad o alta probabilidad (p. ej. enrojecimiento, inflamación, sensibilidad o hematomas transitorios en la zona tratada) y de los cuidados previos y posteriores que debo seguir: {{cuidados_postratamiento}}.</p>\n<p>6. RIESGOS Y COMPLICACIONES<br>Como ocurre con todo acto médico, este tratamiento conlleva riesgos. Se me han explicado de forma detallada y reforzada, propia de la medicina estética voluntaria:<br>- Riesgos frecuentes/leves: {{riesgos_frecuentes}}.<br>- Riesgos poco frecuentes o graves: {{riesgos_graves}}.<br>- Riesgos relacionados con mis circunstancias personales: {{riesgos_personalizados}}.<br>Entiendo que pueden existir riesgos excepcionales o imprevisibles y que ningún procedimiento está totalmente exento de complicaciones.</p>\n<p>7. CONTRAINDICACIONES<br>Declaro haber informado verazmente sobre mi estado de salud, antecedentes, alergias, medicación, embarazo o lactancia y cualquier circunstancia relevante. Se me han explicado las contraindicaciones del tratamiento: {{contraindicaciones}}.</p>\n<p>8. PRODUCTO EMPLEADO<br>Se me ha informado de que el producto utilizado ({{producto}}) está autorizado/registrado conforme a la normativa aplicable (medicamento sujeto a prescripción médica con su ficha técnica, o producto sanitario con marcado CE, según corresponda) y será aplicado por un médico en un centro sanitario autorizado.</p>\n<p>9. ALTERNATIVAS<br>Se me han explicado las alternativas terapéuticas disponibles, así como la posibilidad de NO realizar el tratamiento, y sus consecuencias.</p>\n<p>10. PREGUNTAS Y REFLEXIÓN<br>Manifiesto que he podido formular cuantas preguntas he considerado y que me han sido resueltas satisfactoriamente, y que he dispuesto de tiempo suficiente para reflexionar antes de firmar.</p>\n<p>11. REVOCACIÓN<br>Conozco mi derecho a revocar libremente este consentimiento, por escrito y en cualquier momento, sin necesidad de expresar la causa y sin que ello suponga perjuicio en mi asistencia.</p>\n<p>12. PROTECCIÓN DE DATOS (RGPD UE 2016/679 y LOPDGDD 3/2018)<br>Responsable del tratamiento: {{org_nombre}} (NIF {{org_nif}}), {{org_direccion}}.<br>Finalidad: prestación de asistencia sanitaria, gestión clínica y administrativa del tratamiento.<br>Legitimación: consentimiento explícito del interesado (art. 9.2.a RGPD) y prestación de asistencia sanitaria por profesional sujeto a secreto (art. 9.2.h RGPD). Los datos de salud son categoría especial y se tratan con las máximas garantías.<br>Conservación: durante el tiempo legalmente exigible para la historia clínica (mínimo 5 años desde el alta de cada proceso, conforme a la normativa aplicable).<br>Destinatarios: no se cederán datos a terceros salvo obligación legal.<br>Derechos: puede ejercer los derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad dirigiéndose a {{org_email_datos}}, y reclamar ante la Agencia Española de Protección de Datos (www.aepd.es).<br>[ ] Consiento el tratamiento de mis datos de salud para las finalidades indicadas.</p>\n<p>13. USO DE IMÁGENES (consentimiento específico y separado — marque lo que proceda)<br>[ ] Autorizo la toma de fotografías/imágenes clínicas y su incorporación a mi historia clínica con fines de seguimiento del tratamiento.<br>[ ] Autorizo, de forma adicional y voluntaria, el uso de mis imágenes con fines docentes/científicos de manera anonimizada.<br>[ ] Autorizo, de forma adicional y voluntaria, el uso de mis imágenes (antes/después) con fines comerciales o de difusión por {{org_nombre}}.<br>Estas autorizaciones son independientes y revocables en cualquier momento.</p>\n<p>14. PRESUPUESTO<br>Se me ha informado del coste del tratamiento: {{presupuesto}}.</p>\n<p>15. DECLARACIÓN DE CONFORMIDAD<br>Declaro que he leído y comprendido este documento, que he recibido información suficiente, veraz y comprensible, y que presto mi consentimiento de forma LIBRE, VOLUNTARIA Y CONSCIENTE para la realización del tratamiento descrito. Recibo una copia del presente documento.</p>\n<p>En {{lugar}}, a {{fecha}}.</p>\n<p>Firma del paciente (o representante legal):                 Firma del médico responsable:</p>\n<p>_______________________________                         _______________________________<br>{{paciente_nombre}} — DNI {{paciente_dni}}                Dr./Dra. {{profesional}} — Col. {{num_colegiado}}</p>\n<p>REVOCACIÓN DEL CONSENTIMIENTO (a cumplimentar solo en caso de revocación)<br>D./Dña. {{paciente_nombre}}, con DNI/NIE {{paciente_dni}}, REVOCO el consentimiento prestado para el tratamiento descrito.<br>En {{lugar}}, a __________________.  Firma: _______________________________</p>",
    "variables": [
      {
        "clave": "org_nombre",
        "label": "Nombre del centro / clínica"
      },
      {
        "clave": "org_nif",
        "label": "NIF del centro"
      },
      {
        "clave": "org_direccion",
        "label": "Domicilio del centro sanitario"
      },
      {
        "clave": "org_email_datos",
        "label": "Correo para ejercicio de derechos (protección de datos)"
      },
      {
        "clave": "profesional",
        "label": "Médico responsable (nombre y apellidos)"
      },
      {
        "clave": "num_colegiado",
        "label": "Número de colegiado del médico"
      },
      {
        "clave": "paciente_nombre",
        "label": "Nombre del paciente"
      },
      {
        "clave": "paciente_dni",
        "label": "DNI/NIE del paciente"
      },
      {
        "clave": "representante_nombre",
        "label": "Nombre del representante legal (si aplica)"
      },
      {
        "clave": "representante_dni",
        "label": "DNI/NIE del representante legal (si aplica)"
      },
      {
        "clave": "representante_relacion",
        "label": "Relación del representante con el paciente"
      },
      {
        "clave": "tratamiento",
        "label": "Tratamiento estético propuesto"
      },
      {
        "clave": "zona_tratamiento",
        "label": "Zona/s anatómica/s a tratar"
      },
      {
        "clave": "producto",
        "label": "Producto o técnica a emplear (p. ej. toxina botulínica, ácido hialurónico, láser)"
      },
      {
        "clave": "num_sesiones",
        "label": "Número de sesiones previstas"
      },
      {
        "clave": "beneficios",
        "label": "Beneficios o resultados esperables"
      },
      {
        "clave": "cuidados_postratamiento",
        "label": "Cuidados previos y posteriores"
      },
      {
        "clave": "riesgos_frecuentes",
        "label": "Riesgos frecuentes o leves"
      },
      {
        "clave": "riesgos_graves",
        "label": "Riesgos poco frecuentes o graves"
      },
      {
        "clave": "riesgos_personalizados",
        "label": "Riesgos según circunstancias personales del paciente"
      },
      {
        "clave": "contraindicaciones",
        "label": "Contraindicaciones del tratamiento"
      },
      {
        "clave": "presupuesto",
        "label": "Coste / presupuesto del tratamiento"
      },
      {
        "clave": "lugar",
        "label": "Lugar de firma"
      },
      {
        "clave": "fecha",
        "label": "Fecha de firma"
      }
    ],
    "marcoLegal": [
      "Ley 41/2002, de 14 de noviembre, básica reguladora de la autonomía del paciente y de derechos y obligaciones en materia de información y documentación clínica (arts. 4, 8, 9 y 10): regula el derecho a la información asistencial y el consentimiento informado; exige forma ESCRITA en procedimientos invasores y en los que suponen riesgos de notoria y previsible repercusión negativa sobre la salud.",
      "Reglamento (UE) 2016/679 (RGPD), art. 6 y especialmente art. 9: los datos de salud son categoría especial de datos. Su tratamiento requiere base de legitimación reforzada (consentimiento explícito del paciente y/o finalidad de asistencia/diagnóstico/tratamiento sanitario por profesional sujeto a secreto, art. 9.2.h).",
      "Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD): desarrolla en España el RGPD; relevante el deber de información (art. 11), tratamiento de datos de salud (DA 17ª) y conservación de la historia clínica.",
      "Doctrina del Tribunal Supremo sobre medicina satisfactiva/voluntaria (entre otras SSTS 250/2016 y 463/2013): la obligación del profesional es de medios (no de resultado, salvo garantía expresa), pero el DEBER DE INFORMACIÓN es REFORZADO/INTENSIFICADO al ser un acto no curativo y voluntario; debe informarse incluso de riesgos infrecuentes que puedan influir en la decisión.",
      "Reglamento (UE) 2017/745 de productos sanitarios (MDR) y su Anexo XVI / Reglamento de ejecución (UE) 2022/2346 sobre especificaciones comunes: aplicable a rellenos dérmicos inyectables con finalidad estética; deben cumplir marcado CE. Supervisión por la AEMPS (registro de implantes de relleno con finalidad estética).",
      "Real Decreto Legislativo 1/2015 (texto refundido Ley de garantías y uso racional de medicamentos): la toxina botulínica es un MEDICAMENTO sujeto a prescripción médica; su uso debe ajustarse a la ficha técnica autorizada por la AEMPS.",
      "Ley 14/1986 General de Sanidad y Ley 44/2003 de ordenación de las profesiones sanitarias: la indicación y aplicación de toxina botulínica y rellenos es acto médico, reservado a médicos colegiados (o odontólogos en su ámbito competencial).",
      "Real Decreto 1090/2015 y normativa autonómica de centros sanitarios: obligación de que el tratamiento se realice en centro sanitario debidamente autorizado e inscrito.",
      "Ley 1/1982 de protección del derecho al honor, a la intimidad y a la propia imagen: aplicable al uso de fotografías clínicas (antes/después), que requiere consentimiento específico y separado."
    ],
    "aviso": "Este documento es ORIENTATIVO y de carácter general, elaborado a partir de fuentes públicas (Ley 41/2002, RGPD UE 2016/679, LOPDGDD 3/2018, normativa de la AEMPS y doctrina del Tribunal Supremo sobre medicina satisfactiva). No constituye asesoramiento jurídico. Antes de su uso debe ser revisado y adaptado por un asesor jurídico colegiado y por el profesional sanitario responsable, ajustándolo al tratamiento concreto, al producto empleado (según su ficha técnica o marcado CE), a la normativa autonómica del centro y a las circunstancias de cada paciente. La validez del consentimiento exige además información verbal previa, tiempo de reflexión y entrega de copia al paciente."
  },
  {
    "id": "dental",
    "especialidad": "dental",
    "especialidadLabel": "Dental / Odontología",
    "titulo": "Documento de Consentimiento Informado para Tratamiento Odontológico",
    "cuerpoHtml": "<p>DOCUMENTO DE CONSENTIMIENTO INFORMADO PARA TRATAMIENTO ODONTOLÓGICO</p>\n<p>(Conforme a la Ley 41/2002, de 14 de noviembre, básica reguladora de la autonomía del paciente)</p>\n<p>1. DATOS DE LA CLÍNICA Y DEL PROFESIONAL<br>Clínica / Responsable del tratamiento: {{org_nombre}}<br>NIF: {{org_nif}}<br>Domicilio: {{org_direccion}}<br>Profesional que informa y realiza el tratamiento: {{profesional}}<br>Nº de colegiado/a: {{num_colegiado}}</p>\n<p>2. DATOS DEL PACIENTE<br>Nombre y apellidos: {{paciente_nombre}}<br>DNI / NIE: {{paciente_dni}}<br>(En caso de menor de edad o persona con la capacidad modificada, cumplimentar representación)<br>Representante legal: {{representante_nombre}}  DNI: {{representante_dni}}<br>En calidad de: {{representante_relacion}}</p>\n<p>3. INFORMACIÓN SOBRE EL TRATAMIENTO PROPUESTO<br>Tratamiento odontológico que se propone realizar: {{tratamiento}}<br>Diagnóstico que lo justifica: {{diagnostico}}<br>Piezas dentales / zona a tratar: {{piezas_zona}}</p>\n<p>Descripción y finalidad del procedimiento: {{descripcion_procedimiento}}<br>El/la profesional me ha explicado de forma verbal y comprensible, con antelación suficiente y antes de firmar este documento, en qué consiste el tratamiento, su finalidad y la forma en que se llevará a cabo.</p>\n<p>4. BENEFICIOS ESPERADOS<br>Con este tratamiento se persiguen los siguientes beneficios: {{beneficios}}<br>Comprendo que la odontología es una obligación de medios y no de resultados, por lo que el profesional pone a mi disposición los conocimientos y la técnica adecuados, sin que pueda garantizarse de forma absoluta el resultado final.</p>\n<p>5. RIESGOS Y COMPLICACIONES<br>Riesgos generales de cualquier acto odontológico: dolor, inflamación, hematoma, sangrado, infección, reacciones a la anestesia local o a medicamentos, y molestias durante o después del procedimiento.</p>\n<p>Riesgos específicos del tratamiento propuesto ({{tratamiento}}): {{riesgos_especificos}}<br>A título orientativo, según el procedimiento, estos riesgos pueden incluir: en EXTRACCIONES: fractura de la pieza o de la cortical ósea, parestesia o lesión nerviosa (labio, lengua, mentón), comunicación bucosinusal, alveolitis e infección; en IMPLANTES: fracaso de la osteointegración, pérdida del implante, lesión de estructuras nerviosas o del seno maxilar, dehiscencia, necesidad de injerto óseo y peri-implantitis; en ENDODONCIA: fractura de instrumentos, perforación radicular, sobreobturación, persistencia de molestias o necesidad de retratamiento o cirugía apical, fractura de la pieza tratada; en ORTODONCIA: reabsorción radicular, descalcificaciones y caries por mala higiene, recidiva, problemas de articulación temporomandibular y necesidad de retención prolongada.</p>\n<p>Riesgos personalizados por mis circunstancias particulares (antecedentes médicos, alergias, medicación, tabaquismo u otros): {{riesgos_personalizados}}<br>Contraindicaciones relevantes: {{contraindicaciones}}</p>\n<p>6. CONSECUENCIAS Y ALTERNATIVAS<br>Consecuencias previsibles del tratamiento: {{consecuencias}}<br>Alternativas terapéuticas disponibles: {{alternativas}}<br>Consecuencias de NO realizar el tratamiento: {{consecuencias_no_tratamiento}}<br>Se me ha informado de que puedo optar por no someterme al tratamiento.</p>\n<p>7. CUIDADOS POSTERIORES Y SEGUIMIENTO<br>Indicaciones y cuidados posteriores, así como las revisiones necesarias: {{cuidados_posteriores}}<br>Me comprometo a seguir las instrucciones del profesional y a acudir a las revisiones indicadas, siendo consciente de que su incumplimiento puede comprometer el resultado.</p>\n<p>8. INFORMACIÓN ECONÓMICA<br>La prestación tiene carácter {{tipo_prestacion}} y, en su caso, se corresponde con el presupuesto previamente facilitado y aceptado.</p>\n<p>9. DECLARACIÓN DE CONSENTIMIENTO<br>Declaro que he leído y comprendido la información de este documento, que se me ha explicado en un lenguaje claro, que he tenido la oportunidad de realizar todas las preguntas que he considerado y que han sido respondidas satisfactoriamente. Comprendo que la medicina y la odontología no son ciencias exactas y que pueden producirse resultados imprevisibles.</p>\n<p>En consecuencia, presto LIBRE, VOLUNTARIA y CONSCIENTEMENTE mi consentimiento para que se me realice el tratamiento descrito, así como para las maniobras complementarias o variaciones del mismo que resulten necesarias durante su ejecución por causas justificadas.</p>\n<p>10. REVOCACIÓN DEL CONSENTIMIENTO<br>Sé que puedo revocar este consentimiento en cualquier momento, por escrito y sin necesidad de expresar la causa, antes de la realización del tratamiento, sin que ello suponga perjuicio en la asistencia que recibo.</p>\n<p>11. PROTECCIÓN DE DATOS (RGPD y LOPDGDD)<br>Responsable del tratamiento: {{org_nombre}}, NIF {{org_nif}}, domicilio {{org_direccion}}. Contacto: {{org_email}}.<br>Finalidad: prestación de asistencia odontológica, gestión de la historia clínica y de la relación asistencial y administrativa.<br>Base jurídica: ejecución de la relación asistencial y cumplimiento de obligaciones legales (art. 6 RGPD) y, respecto de los datos de salud, el art. 9.2.h del RGPD (asistencia de tipo sanitario prestada por profesional sujeto a deber de secreto), así como la Ley 41/2002 y la LOPDGDD.<br>Destinatarios: no se cederán datos a terceros salvo obligación legal o cuando sea necesario para la asistencia; los proveedores que traten datos por cuenta de la clínica actuarán como encargados con contrato conforme al art. 28 RGPD.<br>Conservación: durante el tiempo que exige la normativa sanitaria sobre conservación de la historia clínica.<br>Derechos: puede ejercer los derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad dirigiéndose a la clínica, y reclamar ante la Agencia Española de Protección de Datos (www.aepd.es).<br>[He sido informado/a y, en su caso, consiento expresamente los siguientes usos adicionales, marcando la casilla correspondiente:]<br>( ) Consiento el envío de comunicaciones y recordatorios de citas por medios electrónicos.<br>( ) Consiento el tratamiento de imágenes/fotografías clínicas con fines asistenciales y de seguimiento.</p>\n<p>12. FIRMAS<br>En {{lugar}}, a {{fecha}}.</p>\n<p>Firma del paciente (o representante legal):                Firma del profesional / odontólogo:<br>{{paciente_nombre}}                                        {{profesional}} (Col. nº {{num_colegiado}})</p>\n<p>REVOCACIÓN (a cumplimentar solo si el paciente revoca el consentimiento):<br>D./Dña. {{paciente_nombre}}, con DNI {{paciente_dni}}, REVOCO el consentimiento prestado para el tratamiento descrito.<br>Fecha: ____________   Firma: ____________</p>",
    "variables": [
      {
        "clave": "org_nombre",
        "label": "Nombre de la clínica / Responsable del tratamiento"
      },
      {
        "clave": "org_nif",
        "label": "NIF de la clínica"
      },
      {
        "clave": "org_direccion",
        "label": "Domicilio de la clínica"
      },
      {
        "clave": "org_email",
        "label": "Email de contacto de la clínica (protección de datos)"
      },
      {
        "clave": "profesional",
        "label": "Nombre del profesional / odontólogo"
      },
      {
        "clave": "num_colegiado",
        "label": "Número de colegiado/a del profesional"
      },
      {
        "clave": "paciente_nombre",
        "label": "Nombre y apellidos del paciente"
      },
      {
        "clave": "paciente_dni",
        "label": "DNI / NIE del paciente"
      },
      {
        "clave": "representante_nombre",
        "label": "Nombre del representante legal (si aplica)"
      },
      {
        "clave": "representante_dni",
        "label": "DNI del representante legal (si aplica)"
      },
      {
        "clave": "representante_relacion",
        "label": "Relación del representante con el paciente"
      },
      {
        "clave": "tratamiento",
        "label": "Tratamiento odontológico propuesto"
      },
      {
        "clave": "diagnostico",
        "label": "Diagnóstico que justifica el tratamiento"
      },
      {
        "clave": "piezas_zona",
        "label": "Piezas dentales o zona a tratar"
      },
      {
        "clave": "descripcion_procedimiento",
        "label": "Descripción y finalidad del procedimiento"
      },
      {
        "clave": "beneficios",
        "label": "Beneficios esperados"
      },
      {
        "clave": "riesgos_especificos",
        "label": "Riesgos específicos del tratamiento"
      },
      {
        "clave": "riesgos_personalizados",
        "label": "Riesgos personalizados según el paciente"
      },
      {
        "clave": "contraindicaciones",
        "label": "Contraindicaciones"
      },
      {
        "clave": "consecuencias",
        "label": "Consecuencias previsibles del tratamiento"
      },
      {
        "clave": "alternativas",
        "label": "Alternativas terapéuticas disponibles"
      },
      {
        "clave": "consecuencias_no_tratamiento",
        "label": "Consecuencias de no realizar el tratamiento"
      },
      {
        "clave": "cuidados_posteriores",
        "label": "Cuidados posteriores y seguimiento"
      },
      {
        "clave": "tipo_prestacion",
        "label": "Tipo de prestación / información económica"
      },
      {
        "clave": "lugar",
        "label": "Lugar de firma"
      },
      {
        "clave": "fecha",
        "label": "Fecha de firma"
      }
    ],
    "marcoLegal": [
      "Ley 41/2002, de 14 de noviembre, básica reguladora de la autonomía del paciente y de derechos y obligaciones en materia de información y documentación clínica (BOE-A-2002-22188). Artículos clave: art. 2 (principios básicos), art. 3 (definiciones de consentimiento e información clínica), art. 4 (derecho a la información asistencial), art. 5 (titular del derecho a la información), art. 8 (consentimiento informado; exigencia de forma ESCRITA en intervención quirúrgica, procedimientos diagnósticos/terapéuticos invasores y procedimientos con riesgos de notoria y previsible repercusión negativa — caso típico de implantes, extracciones quirúrgicas y endodoncias), art. 9 (límites del consentimiento y consentimiento por representación en menores e incapaces), art. 10 (información básica obligatoria: consecuencias seguras y relevantes, riesgos personalizados según circunstancias del paciente, riesgos probables en condiciones normales y contraindicaciones), art. 11 (instrucciones previas)",
      "Reglamento (UE) 2016/679 (RGPD). Base jurídica del tratamiento de datos: art. 6.1.b (ejecución del contrato de asistencia) y art. 6.1.c (obligación legal de la documentación clínica); para los datos de salud, categoría especial del art. 9, la base principal es el art. 9.2.h (fines de asistencia o tratamiento de tipo sanitario prestado por profesional sujeto a deber de secreto), no siendo necesario el consentimiento explícito del art. 9.2.a salvo para usos secundarios (marketing, fines distintos de la asistencia). Aplican además los arts. 12-22 (información y derechos), art. 32 (seguridad) y art. 30 (registro de actividades de tratamiento)",
      "Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD). Art. 9 (categorías especiales de datos), disposición adicional decimoséptima (tratamientos de datos de salud) y régimen del delegado de protección de datos cuando proceda",
      "Ley 44/2003, de 21 de noviembre, de ordenación de las profesiones sanitarias (competencia y responsabilidad del odontólogo/estomatólogo)",
      "Ley 14/1986, General de Sanidad (derechos del paciente, marco general) y normativa autonómica de desarrollo en materia de derechos del paciente e historia clínica",
      "Real Decreto 1090/2015 y normativa específica si el tratamiento se enmarca en investigación/ensayos (no habitual en consulta odontológica ordinaria)",
      "Código de Ética y Deontología del Consejo General de Dentistas de España; modelos y guías de consentimiento informado de los Colegios profesionales (p. ej. los 10 consentimientos informados del COEM por tipo de tratamiento: obturación, blanqueamiento, endodoncia, extracción, implante, periodoncia, prótesis fija, prótesis removible, ortodoncia y odontopediatría)"
    ],
    "aviso": "Este documento es ORIENTATIVO y se ofrece como plantilla base. No constituye asesoramiento jurídico. Antes de su uso debe ser revisado y validado por un asesor jurídico y adaptado a las circunstancias concretas de la clínica, al tratamiento específico, a la normativa autonómica aplicable y a los modelos y recomendaciones del Colegio profesional correspondiente (p. ej. Consejo General de Dentistas o el Colegio autonómico). El consentimiento debe ser específico para cada tratamiento e individualizado para cada paciente; los modelos genéricos pueden ser insuficientes y generar responsabilidad. Verifique siempre la versión vigente de la Ley 41/2002, el RGPD y la LOPDGDD."
  },
  {
    "id": "fisioterapia",
    "especialidad": "fisioterapia",
    "especialidadLabel": "Fisioterapia",
    "titulo": "Documento de Consentimiento Informado para Tratamiento de Fisioterapia y Rehabilitación",
    "cuerpoHtml": "<p>DOCUMENTO DE CONSENTIMIENTO INFORMADO<br>TRATAMIENTO DE FISIOTERAPIA Y REHABILITACIÓN</p>\n<p>(En cumplimiento de la Ley 41/2002, de 14 de noviembre, básica reguladora de la autonomía del paciente, del Reglamento (UE) 2016/679 (RGPD) y de la Ley Orgánica 3/2018 (LOPDGDD))</p>\n<p>1. DATOS DEL CENTRO Y DEL PROFESIONAL<br>Centro/Clínica: {{org_nombre}}<br>NIF: {{org_nif}}<br>Domicilio: {{org_direccion}}<br>Fisioterapeuta responsable: {{profesional}}<br>Nº de colegiado/a: {{num_colegiado}}</p>\n<p>2. DATOS DEL PACIENTE<br>Nombre y apellidos: {{paciente_nombre}}<br>DNI/NIE: {{paciente_dni}}<br>Fecha de nacimiento: {{paciente_fecha_nacimiento}}</p>\n<p>En caso de menor de edad o persona con capacidad modificada, datos del representante legal:<br>Nombre y apellidos: {{representante_nombre}}<br>DNI/NIE: {{representante_dni}}<br>En calidad de: {{representante_relacion}} (padre/madre/tutor/representante legal)</p>\n<p>3. INFORMACIÓN SOBRE EL TRATAMIENTO PROPUESTO<br>Se me ha informado de que, tras la correspondiente valoración fisioterápica, se me propone el siguiente tratamiento: {{tratamiento}}.</p>\n<p>La fisioterapia es una disciplina sanitaria que tiene como objetivo la prevención, el tratamiento y la recuperación de disfunciones o alteraciones físicas, mediante técnicas manuales y/o físicas. El plan de tratamiento propuesto podrá incluir, según mi valoración y evolución, una o varias de las siguientes técnicas, sobre las que se me ha informado específicamente:</p>\n<p>a) TERAPIA MANUAL Y EJERCICIO TERAPÉUTICO<br>Comprende técnicas de masoterapia, movilizaciones articulares, estiramientos, manipulaciones y ejercicio terapéutico supervisado.<br>- Beneficios: alivio del dolor, mejora de la movilidad y de la función, recuperación tras lesión.<br>- Riesgos y molestias: dolor o agujetas tras la sesión, aumento transitorio de los síntomas, mareo, en casos excepcionales lesión de partes blandas o vasculares/nerviosas en técnicas de manipulación de alta velocidad.</p>\n<p>b) PUNCIÓN SECA<br>Consiste en la introducción de una aguja de acero (tipo acupuntura) en el músculo para el tratamiento del dolor miofascial y los puntos gatillo.<br>- Beneficios: reducción del dolor miofascial, relajación del punto gatillo y mejora funcional.<br>- Riesgos y molestias frecuentes: dolor durante y después de la punción, contractura o espasmo muscular, hematomas, sangrado leve, mareo o síncope vasovagal, dermatitis de contacto.<br>- Riesgos poco frecuentes pero graves: en la punción de musculatura del tórax/cuello existe riesgo de NEUMOTÓRAX (entrada de aire en la cavidad pleural); lesión nerviosa o vascular; infección local.</p>\n<p>c) ELECTROTERAPIA Y AGENTES FÍSICOS (TENS, corrientes, ultrasonidos, termoterapia, etc.)<br>Consiste en la aplicación de corrientes eléctricas, ultrasonidos o calor/frío con finalidad analgésica, antiinflamatoria o de estimulación muscular.<br>- Beneficios: alivio del dolor, reducción de la inflamación, estimulación y recuperación muscular.<br>- Riesgos y molestias: irritación o enrojecimiento de la piel, en casos excepcionales quemaduras o úlceras cutáneas, sensación desagradable durante la aplicación.<br>- Importante: contraindicado o de uso precaución en portadores de marcapasos u otros dispositivos electrónicos implantados, implantes metálicos en la zona, embarazo (zona abdominal/lumbar), trombosis o hemorragias activas, alteraciones de la sensibilidad y procesos tumorales.</p>\n<p>4. CONTRAINDICACIONES Y DATOS RELEVANTES DE MI SALUD<br>Declaro haber informado al fisioterapeuta sobre mi estado de salud y, en particular, sobre la existencia o no de las siguientes circunstancias, que pueden contraindicar o modificar el tratamiento:<br>[ ] Embarazo o sospecha de embarazo<br>[ ] Portador/a de marcapasos o dispositivo electrónico implantado<br>[ ] Implantes o prótesis metálicas<br>[ ] Tratamiento anticoagulante o alteraciones de la coagulación<br>[ ] Inmunodepresión / enfermedades infecciosas<br>[ ] Alergias (látex, níquel, metales, etc.): {{alergias}}<br>[ ] Procesos tumorales, trombosis o problemas cardiovasculares<br>[ ] Otras circunstancias relevantes: {{observaciones_salud}}</p>\n<p>5. ALTERNATIVAS Y CARÁCTER VOLUNTARIO<br>Se me ha informado de que existen alternativas terapéuticas, así como de la posibilidad de NO realizar el tratamiento, y de las consecuencias que ello podría tener para mi salud. He podido formular cuantas preguntas he considerado oportunas, que me han sido respondidas de forma clara y comprensible.</p>\n<p>Comprendo que mi consentimiento es libre y voluntario y que puedo REVOCARLO en cualquier momento, sin necesidad de expresar la causa y sin que ello suponga perjuicio alguno en la atención que se me dispense.</p>\n<p>6. INFORMACIÓN BÁSICA SOBRE PROTECCIÓN DE DATOS (RGPD / LOPDGDD)<br>- Responsable del tratamiento: {{org_nombre}}, NIF {{org_nif}}, con domicilio en {{org_direccion}}.<br>- Finalidad: prestación de asistencia sanitaria de fisioterapia, gestión de la historia clínica, citas y facturación.<br>- Base jurídica: cumplimiento de obligaciones legales y tratamiento necesario para fines de asistencia o tratamiento de tipo sanitario por profesional sujeto a secreto (arts. 6.1 y 9.2.h RGPD; Ley 41/2002).<br>- Categorías de datos: datos identificativos y datos de salud (categoría especial).<br>- Conservación: durante el tiempo legalmente exigido para la historia clínica (mínimo 5 años desde el alta de cada proceso asistencial, según normativa estatal y autonómica aplicable).<br>- Destinatarios: no se cederán datos a terceros salvo obligación legal o necesidad asistencial; encargados del tratamiento debidamente contratados.<br>- Derechos: puede ejercer sus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad dirigiéndose a {{org_nombre}} ({{contacto_datos}}), así como reclamar ante la Agencia Española de Protección de Datos (www.aepd.es).</p>\n<p>7. DECLARACIÓN DE CONSENTIMIENTO<br>Yo, {{paciente_nombre}}, con DNI/NIE {{paciente_dni}} (o su representante legal arriba identificado), DECLARO que he leído y comprendido la información contenida en este documento, que he sido informado/a de forma satisfactoria por el fisioterapeuta {{profesional}}, y que CONSIENTO LIBRE Y VOLUNTARIAMENTE someterme al tratamiento de fisioterapia descrito.</p>\n<p>En ____________________, a {{fecha}}.</p>\n<p>Firma del paciente / representante legal:                 Firma y nº de colegiado del fisioterapeuta:</p>\n<p>_______________________________                          _______________________________<br>{{paciente_nombre}}                                       {{profesional}} — Col. nº {{num_colegiado}}</p>\n<p>8. REVOCACIÓN DEL CONSENTIMIENTO<br>Yo, {{paciente_nombre}}, con DNI/NIE {{paciente_dni}}, REVOCO el consentimiento prestado para el tratamiento descrito, sin que ello afecte a la asistencia recibida hasta la fecha.</p>\n<p>En ____________________, a ____________________.</p>\n<p>Firma del paciente / representante legal:</p>\n<p>_______________________________</p>\n<p>Este documento se incorpora a la historia clínica del paciente y se conserva conforme a la normativa vigente.</p>",
    "variables": [
      {
        "clave": "org_nombre",
        "label": "Nombre de la clínica/centro"
      },
      {
        "clave": "org_nif",
        "label": "NIF del centro"
      },
      {
        "clave": "org_direccion",
        "label": "Domicilio del centro"
      },
      {
        "clave": "profesional",
        "label": "Nombre del fisioterapeuta responsable"
      },
      {
        "clave": "num_colegiado",
        "label": "Número de colegiado del fisioterapeuta"
      },
      {
        "clave": "paciente_nombre",
        "label": "Nombre y apellidos del paciente"
      },
      {
        "clave": "paciente_dni",
        "label": "DNI/NIE del paciente"
      },
      {
        "clave": "paciente_fecha_nacimiento",
        "label": "Fecha de nacimiento del paciente"
      },
      {
        "clave": "representante_nombre",
        "label": "Nombre del representante legal (si procede)"
      },
      {
        "clave": "representante_dni",
        "label": "DNI/NIE del representante legal (si procede)"
      },
      {
        "clave": "representante_relacion",
        "label": "Relación/calidad del representante legal"
      },
      {
        "clave": "tratamiento",
        "label": "Tratamiento o técnica de fisioterapia propuesta"
      },
      {
        "clave": "alergias",
        "label": "Alergias del paciente"
      },
      {
        "clave": "observaciones_salud",
        "label": "Otras circunstancias relevantes de salud"
      },
      {
        "clave": "contacto_datos",
        "label": "Email/contacto para ejercicio de derechos de protección de datos"
      },
      {
        "clave": "fecha",
        "label": "Fecha de firma del consentimiento"
      }
    ],
    "marcoLegal": [
      "Ley 41/2002, de 14 de noviembre, básica reguladora de la autonomía del paciente y de derechos y obligaciones en materia de información y documentación clínica (arts. 2, 4, 5, 8, 9 y 10): regula el consentimiento informado, su forma verbal o escrita y el contenido mínimo de la información.",
      "Art. 8 Ley 41/2002: el consentimiento es verbal por regla general, pero DEBE constar por escrito en intervenciones quirúrgicas, procedimientos diagnósticos y terapéuticos invasivos y, en general, en técnicas que supongan riesgos o inconvenientes de notoria y previsible repercusión negativa sobre la salud (caso de la punción seca y la electroterapia).",
      "Art. 10 Ley 41/2002: información básica obligatoria previa al consentimiento escrito (consecuencias seguras, riesgos personalizados, riesgos probables en condiciones normales conforme a la experiencia y al estado de la ciencia, y contraindicaciones).",
      "Art. 9 Ley 41/2002: límites del consentimiento y consentimiento por representación (menores no emancipados, incapacitados, situaciones de urgencia y riesgo para la salud pública).",
      "Reglamento (UE) 2016/679 (RGPD): tratamiento de datos personales; los datos de salud son categoría especial (art. 9) con base de licitud específica para fines de asistencia sanitaria (art. 9.2.h) y deber de información (arts. 13 y 14).",
      "Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y Garantía de los Derechos Digitales (LOPDGDD): desarrolla el RGPD en España y refuerza el tratamiento de datos de salud.",
      "Ley 44/2003, de 21 de noviembre, de ordenación de las profesiones sanitarias (LOPS): reconoce la fisioterapia como profesión sanitaria titulada y regulada, con obligación de colegiación.",
      "Código Deontológico del Consejo General de Colegios de Fisioterapeutas de España y de los Colegios Profesionales autonómicos: deber de informar al paciente y de recabar su consentimiento.",
      "Normativa autonómica concordante sobre autonomía del paciente y documentación clínica (p. ej. Ley 21/2000 de Cataluña), aplicable de forma supletoria/complementaria según la comunidad autónoma."
    ],
    "aviso": "Este documento tiene carácter meramente orientativo y constituye una plantilla base elaborada a partir de la normativa española vigente (Ley 41/2002, RGPD y LOPDGDD) y de las recomendaciones de colegios profesionales de fisioterapia. No sustituye el asesoramiento jurídico profesional. Antes de utilizarlo, debe ser revisado y adaptado por un asesor jurídico y/o por el delegado/responsable de protección de datos, teniendo en cuenta la normativa autonómica aplicable, las técnicas concretas empleadas en cada centro y las circunstancias específicas de cada paciente. La clínica es responsable de conservar el documento firmado en la historia clínica, ya que la carga de la prueba de haber informado correctamente recae sobre el profesional/centro sanitario."
  },
  {
    "id": "psicologia",
    "especialidad": "psicologia",
    "especialidadLabel": "Psicología",
    "titulo": "Documento de Consentimiento Informado para la Intervención Psicológica (psicoterapia y/o evaluación)",
    "cuerpoHtml": "<p>DOCUMENTO DE CONSENTIMIENTO INFORMADO PARA LA INTERVENCIÓN PSICOLÓGICA</p>\n<p>Centro / Profesional: {{org_nombre}}<br>NIF: {{org_nif}}<br>Domicilio: {{org_direccion}}<br>Profesional responsable: {{profesional}} (psicólogo/a colegiado/a nº {{num_colegiado}} del {{colegio_oficial}})</p>\n<p>Persona usuaria: D./Dña. {{paciente_nombre}}, con DNI/NIE {{paciente_dni}}.<br>(En su caso) Representante legal: D./Dña. {{representante_nombre}}, con DNI/NIE {{representante_dni}}, en calidad de {{representante_relacion}} del/de la menor o persona representada.</p>\n<p>El presente documento tiene por objeto que usted reciba información clara, suficiente y comprensible sobre la intervención psicológica que va a iniciar, en cumplimiento de la Ley 41/2002, de autonomía del paciente, del Reglamento (UE) 2016/679 (RGPD) y de la Ley Orgánica 3/2018 (LOPDGDD), así como del Código Deontológico de la profesión. El consentimiento informado es un proceso de comunicación, no la mera firma de un papel; por ello, le animamos a leerlo con detenimiento y a preguntar cuanto necesite antes de firmarlo.</p>\n<p>1. NATURALEZA Y FINALIDAD DE LA INTERVENCIÓN<br>La intervención consiste en: {{tratamiento}}.<br>Su finalidad es la evaluación y/o el tratamiento psicológico de las dificultades por las que usted consulta, con los siguientes objetivos generales: {{objetivos}}.<br>El enfoque o modelo de trabajo utilizado es: {{enfoque}}.</p>\n<p>2. DESARROLLO DE LAS SESIONES<br>- Formato: {{formato}} (individual, de pareja, familiar o grupal).<br>- Modalidad: {{modalidad}} (presencial u online).<br>- Frecuencia y duración: las sesiones tendrán una duración aproximada de {{duracion_sesion}} y una periodicidad de {{frecuencia}}. La duración total de la intervención no puede garantizarse de antemano y se revisará de forma conjunta.</p>\n<p>3. BENEFICIOS ESPERABLES<br>La intervención psicológica busca mejorar su bienestar emocional, su funcionamiento personal, relacional y/o laboral, y dotarle de recursos para afrontar sus dificultades. No obstante, la psicología no es una ciencia exacta y NO puede garantizarse la consecución de un resultado concreto.</p>\n<p>4. RIESGOS Y MOLESTIAS<br>Durante el proceso es posible que experimente malestar emocional transitorio, afloramiento de recuerdos o emociones dolorosas o momentos de mayor sensibilidad. Estos efectos forman parte habitual del trabajo terapéutico. Si en algún momento siente que la intervención no le resulta beneficiosa, puede comunicarlo y se valorará su revisión, modificación o derivación.</p>\n<p>5. ALTERNATIVAS<br>Existen otras opciones, como no iniciar la intervención, optar por enfoques psicológicos distintos o ser derivado/a a otros recursos sanitarios (incluida la valoración médica o psiquiátrica cuando proceda). Usted es libre de elegir y de solicitar dicha derivación.</p>\n<p>6. CONFIDENCIALIDAD Y SECRETO PROFESIONAL<br>Toda la información que comparta está amparada por el secreto profesional y la normativa de protección de datos. Únicamente podrá levantarse la confidencialidad en los supuestos legalmente previstos: (a) riesgo grave e inminente para su vida o integridad o la de terceros; (b) requerimiento de la autoridad judicial; (c) situaciones de desprotección de menores o personas en situación de vulnerabilidad; y (d) en su caso, supervisión clínica del caso entre profesionales, manteniendo en todo momento su anonimato salvo que usted autorice lo contrario.</p>\n<p>7. PROTECCIÓN DE DATOS PERSONALES (RGPD y LOPDGDD)<br>Responsable del tratamiento: {{org_nombre}}, NIF {{org_nif}}, domicilio {{org_direccion}}, correo de contacto {{org_email}}.<br>Finalidad: prestación de asistencia psicológica y gestión de su historia clínica y administrativa.<br>Base jurídica: el tratamiento de sus datos de salud se legitima en la prestación de asistencia sanitaria por profesional sujeto a secreto (art. 9.2.h RGPD, en relación con el art. 9.3) y, para los usos no asistenciales que se indican más abajo, en su consentimiento explícito (art. 9.2.a RGPD).<br>Conservación: sus datos se conservarán durante la intervención y, posteriormente, durante los plazos legalmente exigibles de custodia de la historia clínica.<br>Destinatarios: no se cederán datos a terceros salvo obligación legal. Cuando intervengan proveedores tecnológicos (p. ej., plataforma de videollamada o de gestión clínica), actuarán como encargados de tratamiento con las debidas garantías.<br>Derechos: puede ejercer sus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad dirigiéndose a {{org_email}}, así como reclamar ante la Agencia Española de Protección de Datos (www.aepd.es).</p>\n<p>8. AUTORIZACIONES ESPECÍFICAS (marque lo que corresponda; son voluntarias y revocables)<br>[ ] SÍ  [ ] NO  Autorizo la grabación de sesiones con fines exclusivamente clínicos.<br>[ ] SÍ  [ ] NO  Autorizo el uso anonimizado del caso con fines de supervisión, docencia o investigación.<br>[ ] SÍ  [ ] NO  Autorizo las comunicaciones por medios electrónicos (correo, mensajería o teléfono) para gestiones relacionadas con la intervención.<br>La negativa a estas autorizaciones no condiciona ni afecta a la atención psicológica que recibirá.</p>\n<p>9. INTERVENCIÓN ONLINE (cuando proceda)<br>Si la intervención se realiza de forma telemática, se empleará la plataforma {{plataforma_online}} con medidas de seguridad razonables. No obstante, se le informa de que ningún medio electrónico está exento de riesgos y de las limitaciones propias de la atención a distancia.</p>\n<p>10. HONORARIOS Y POLÍTICA DE CANCELACIÓN<br>El importe de cada sesión es de {{honorarios}}, con la siguiente forma de pago: {{forma_pago}}. La cancelación de citas deberá comunicarse con una antelación mínima de {{antelacion_cancelacion}}; en caso contrario podrá aplicarse la siguiente política: {{politica_cancelacion}}.</p>\n<p>11. MENORES DE EDAD Y PERSONAS CON LA CAPACIDAD MODIFICADA<br>Cuando la persona usuaria sea menor de edad o tenga la capacidad judicialmente modificada, el consentimiento lo prestará su representante legal, garantizándose el derecho del menor maduro a ser oído y respetándose siempre su interés superior.</p>\n<p>12. VOLUNTARIEDAD Y REVOCACIÓN<br>Su participación es totalmente voluntaria. Puede revocar este consentimiento e interrumpir la intervención en cualquier momento, sin necesidad de justificación y sin que ello le suponga perjuicio alguno, comunicándolo al profesional.</p>\n<p>DECLARACIÓN Y FIRMA<br>Declaro que he leído y comprendido la información contenida en este documento, que se me ha ofrecido la oportunidad de plantear preguntas y que se han resuelto mis dudas. En consecuencia, presto libremente mi consentimiento para iniciar la intervención psicológica descrita y para el tratamiento de mis datos en los términos indicados. Recibo una copia de este documento.</p>\n<p>En {{lugar}}, a {{fecha}}.</p>\n<p>Firma de la persona usuaria / representante legal:                         Firma del profesional:</p>\n<p>D./Dña. {{paciente_nombre}}                                               {{profesional}}<br>DNI/NIE: {{paciente_dni}}                                                  Colegiado/a nº {{num_colegiado}}</p>\n<p>REVOCACIÓN DEL CONSENTIMIENTO (a cumplimentar solo en caso de revocación)<br>D./Dña. {{paciente_nombre}}, con DNI/NIE {{paciente_dni}}, revoco el consentimiento prestado con fecha {{fecha}} y solicito la interrupción de la intervención.<br>Fecha de revocación: __________     Firma: __________</p>",
    "variables": [
      {
        "clave": "org_nombre",
        "label": "Nombre del centro o profesional"
      },
      {
        "clave": "org_nif",
        "label": "NIF del centro o profesional"
      },
      {
        "clave": "org_direccion",
        "label": "Domicilio del centro"
      },
      {
        "clave": "org_email",
        "label": "Correo de contacto para protección de datos"
      },
      {
        "clave": "profesional",
        "label": "Nombre del psicólogo/a responsable"
      },
      {
        "clave": "num_colegiado",
        "label": "Número de colegiado/a"
      },
      {
        "clave": "colegio_oficial",
        "label": "Colegio Oficial de la Psicología"
      },
      {
        "clave": "paciente_nombre",
        "label": "Nombre de la persona usuaria"
      },
      {
        "clave": "paciente_dni",
        "label": "DNI/NIE de la persona usuaria"
      },
      {
        "clave": "representante_nombre",
        "label": "Nombre del representante legal (si aplica)"
      },
      {
        "clave": "representante_dni",
        "label": "DNI/NIE del representante legal (si aplica)"
      },
      {
        "clave": "representante_relacion",
        "label": "Relación o cargo del representante legal"
      },
      {
        "clave": "tratamiento",
        "label": "Descripción de la intervención (psicoterapia y/o evaluación)"
      },
      {
        "clave": "objetivos",
        "label": "Objetivos terapéuticos generales"
      },
      {
        "clave": "enfoque",
        "label": "Enfoque o modelo psicológico utilizado"
      },
      {
        "clave": "formato",
        "label": "Formato de las sesiones (individual, pareja, familiar, grupal)"
      },
      {
        "clave": "modalidad",
        "label": "Modalidad (presencial u online)"
      },
      {
        "clave": "duracion_sesion",
        "label": "Duración aproximada de cada sesión"
      },
      {
        "clave": "frecuencia",
        "label": "Frecuencia de las sesiones"
      },
      {
        "clave": "plataforma_online",
        "label": "Plataforma utilizada en intervención online"
      },
      {
        "clave": "honorarios",
        "label": "Importe por sesión"
      },
      {
        "clave": "forma_pago",
        "label": "Forma de pago"
      },
      {
        "clave": "antelacion_cancelacion",
        "label": "Antelación mínima para cancelar cita"
      },
      {
        "clave": "politica_cancelacion",
        "label": "Política de cancelación o no asistencia"
      },
      {
        "clave": "lugar",
        "label": "Lugar de firma"
      },
      {
        "clave": "fecha",
        "label": "Fecha de firma"
      }
    ],
    "marcoLegal": [
      "Ley 41/2002, de 14 de noviembre, básica reguladora de la autonomía del paciente y de derechos y obligaciones en materia de información y documentación clínica (arts. 2, 3, 4, 5, 8, 9 y 10): exige consentimiento libre, voluntario y consciente previa información adecuada sobre finalidad, naturaleza, riesgos y consecuencias de la intervención.",
      "Reglamento (UE) 2016/679 (RGPD): los datos de salud psíquica son categoría especial de datos (art. 9.1). El tratamiento se legitima por la prestación de asistencia sanitaria por profesional sujeto a secreto (art. 9.2.h, en relación con art. 9.3) y por consentimiento explícito (art. 9.2.a) para usos no asistenciales (grabaciones, docencia, supervisión, investigación). Información a la persona interesada conforme a los arts. 13 y 14, y derechos de los arts. 15 a 22.",
      "Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD): adapta el RGPD; tratamiento de datos de salud (art. 9), deber de confidencialidad (art. 5) y obligaciones del responsable.",
      "Código Deontológico del Consejo General de la Psicología de España / Colegios Oficiales de la Psicología (especialmente arts. 6, 8, 12, 25, 39 a 48): información sobre las características de la intervención, secreto profesional, confidencialidad y sus límites, y custodia de la documentación clínica.",
      "Ley 44/2003, de 21 de noviembre, de ordenación de las profesiones sanitarias (LOPS): el psicólogo en el ámbito clínico/sanitario es profesional sanitario sujeto a sus deberes de información y documentación.",
      "Ley 14/1986, de 25 de abril, General de Sanidad (art. 10) y Real Decreto 1093/2010 (conjunto mínimo de datos de la historia clínica), como normativa complementaria.",
      "Normativa autonómica sobre autonomía del paciente y documentación clínica que pueda resultar aplicable según la comunidad autónoma donde se preste el servicio.",
      "Código Civil (arts. 154, 156 y 162) y Ley Orgánica 1/1996 de Protección Jurídica del Menor, para el consentimiento por representación y el interés superior del menor."
    ],
    "aviso": "Esta plantilla y la información asociada tienen carácter meramente orientativo y no constituyen asesoramiento jurídico. Antes de su uso, el documento debe ser revisado y adaptado por un asesor jurídico o por el Colegio Oficial de la Psicología correspondiente, atendiendo a la normativa autonómica aplicable, al tipo concreto de servicio (psicoterapia, evaluación, intervención online, menores, peritaje, etc.) y a la organización de cada centro. El responsable del tratamiento debe verificar además el cumplimiento íntegro del RGPD y la LOPDGDD (registro de actividades, contratos con encargados de tratamiento, medidas de seguridad y, en su caso, evaluación de impacto)."
  },
  {
    "id": "veterinaria",
    "especialidad": "veterinaria",
    "especialidadLabel": "Veterinaria",
    "titulo": "Consentimiento Informado Veterinario y Aceptación de Prestación de Servicios",
    "cuerpoHtml": "<p>CONSENTIMIENTO INFORMADO VETERINARIO Y ACEPTACIÓN DE PRESTACIÓN DE SERVICIOS</p>\n<p>Centro veterinario: {{org_nombre}} — NIF/CIF: {{org_nif}}<br>Domicilio: {{org_direccion}}<br>Veterinario/a responsable del acto clínico: {{profesional}} — Nº de colegiado/a: {{num_colegiado}}</p>\n<p>1. DATOS DEL PROPIETARIO O RESPONSABLE DEL ANIMAL<br>D./Dña. {{paciente_nombre}}, mayor de edad, con DNI/NIF {{paciente_dni}}, domicilio en {{propietario_direccion}} y teléfono de contacto {{propietario_telefono}}, en calidad de propietario/a o responsable legal del animal que se identifica a continuación.<br>(En el supuesto de propietario menor de edad o con la capacidad modificada, el presente documento es firmado por su padre/madre o tutor/a legal.)</p>\n<p>2. DATOS DEL ANIMAL (PACIENTE)<br>Especie: {{animal_especie}} — Raza: {{animal_raza}} — Nombre: {{animal_nombre}}<br>Sexo: {{animal_sexo}} — Fecha de nacimiento/edad: {{animal_nacimiento}} — Nº de identificación (microchip): {{animal_microchip}}</p>\n<p>3. PROCEDIMIENTO PROPUESTO E INFORMACIÓN CLÍNICA<br>He sido informado/a de forma verbal y por escrito, en un lenguaje claro y comprensible, del estado de salud de mi animal y del siguiente procedimiento, prueba diagnóstica o tratamiento propuesto:</p>\n<p>Intervención / Acto clínico / Tratamiento: {{tratamiento}}<br>Finalidad y utilidad del procedimiento: {{finalidad}}</p>\n<p>Declaro haber comprendido la naturaleza, alcance y objetivo del procedimiento, así como los beneficios razonablemente esperados.</p>\n<p>4. RIESGOS, COMPLICACIONES Y EFECTOS SECUNDARIOS<br>He sido informado/a de que todo acto veterinario, médico, quirúrgico, anestésico o diagnóstico conlleva riesgos. Se me han explicado los riesgos típicos, frecuentes y previsibles, las posibles complicaciones y los efectos secundarios derivados del procedimiento escogido, incluidos los inherentes al estado clínico de mi animal:<br>{{riesgos}}</p>\n<p>Entiendo y acepto que la medicina veterinaria es una obligación de MEDIOS y no de RESULTADO, por lo que el centro y el/la veterinario/a se comprometen a aplicar los conocimientos y la diligencia profesional exigibles, pero NO pueden garantizar la curación ni un resultado concreto.</p>\n<p>5. ALTERNATIVAS<br>He sido informado/a de las distintas opciones terapéuticas o diagnósticas existentes para este tipo de patología, así como de la posibilidad de no realizar el procedimiento y de sus consecuencias. Autorizo la opción indicada por su idoneidad para las circunstancias específicas de mi animal.</p>\n<p>6. ANESTESIA Y PRUEBAS PREANESTÉSICAS<br>Autorizo la administración de la sedación y/o anestesia (local, regional o general) que, según criterio profesional, se estime necesaria, así como las modificaciones que durante el procedimiento resulten imprescindibles para preservar la salud o la vida del animal.<br>Con el fin de minimizar los riesgos anestésicos, autorizo la realización de las siguientes pruebas preanestésicas (marque lo que proceda):<br>[ ] Análisis de sangre   [ ] Radiografía   [ ] Electrocardiograma   [ ] Otras: ______________</p>\n<p>7. HOSPITALIZACIÓN<br>[ ] Autorizo la hospitalización del animal durante el tiempo que el/la veterinario/a estime necesario para su correcta atención.</p>\n<p>8. SITUACIONES DE URGENCIA<br>Comprendo que, en situaciones de urgencia en las que peligre la vida del animal y resulte imposible contactar conmigo para recabar mi consentimiento, el/la veterinario/a podrá prestar los cuidados que su criterio profesional dicte en interés del animal.</p>\n<p>9. EUTANASIA / NECROPSIA (cumplimentar solo si procede)<br>[ ] Solicito y autorizo expresamente la EUTANASIA del animal por las razones que me han sido explicadas, comprendiendo su carácter irreversible.<br>[ ] Autorizo la realización de NECROPSIA con fines diagnósticos.</p>\n<p>10. INFORMACIÓN ECONÓMICA<br>Importe estimado del procedimiento: {{importe_estimado}}    Provisión de fondos: {{provision_fondos}}<br>Me responsabilizo de los gastos y honorarios que generen las actuaciones realizadas y me comprometo a recoger al animal tras el alta facultativa. La falta de recogida en el plazo legalmente previsto y la normativa autonómica aplicable podrá considerarse abandono, adoptando el centro las medidas oportunas.</p>\n<p>11. USO DE IMÁGENES (autorización separada y voluntaria)<br>Autorizo el uso de imágenes o vídeos de mi animal obtenidos durante la asistencia, con fines científicos, docentes, de publicación o difusión, de forma anonimizada en lo relativo a mis datos:<br>[ ] SÍ   [ ] NO</p>\n<p>12. PROTECCIÓN DE DATOS (RGPD y LOPDGDD)<br>Responsable del tratamiento: {{org_nombre}} (NIF/CIF {{org_nif}}), con domicilio en {{org_direccion}}.<br>Finalidad: prestación del servicio veterinario y gestión administrativa, contable y fiscal derivada de la relación.<br>Legitimación: ejecución del contrato de prestación de servicios y cumplimiento de obligaciones legales.<br>Conservación: durante la vigencia de la relación y, posteriormente, durante los plazos legalmente exigibles (incluido el mínimo de cinco años de conservación de la historia clínica y elementos de diagnóstico).<br>Destinatarios: no se cederán datos a terceros salvo obligación legal o cuando sea necesario para la correcta prestación del servicio (p. ej., laboratorios o centros de referencia).<br>Derechos: puede ejercer los derechos de acceso, rectificación, supresión, limitación, portabilidad y oposición dirigiéndose a {{org_nombre}} en la dirección indicada, así como presentar una reclamación ante la Agencia Española de Protección de Datos (www.aepd.es).</p>\n<p>13. DECLARACIÓN Y CONSENTIMIENTO<br>Declaro que se me ha facilitado la información anterior en lenguaje comprensible, que he podido formular cuantas preguntas he considerado y que han sido resueltas satisfactoriamente. Comprendo que puedo REVOCAR este consentimiento en cualquier momento y por escrito, sin necesidad de justificación. En consecuencia, presto libre y voluntariamente mi CONSENTIMIENTO para la realización del procedimiento descrito.</p>\n<p>En ________________________, a {{fecha}}.</p>\n<p>Firma del propietario/responsable: ____________________    Firma y sello del veterinario/a: ____________________<br>(Se entrega una copia del presente documento al propietario/responsable.)</p>\n<p>— REVOCACIÓN DEL CONSENTIMIENTO —<br>Yo, {{paciente_nombre}}, revoco el consentimiento prestado para el procedimiento descrito.<br>Fecha: __ / __ / ____   Firma: ____________________</p>",
    "variables": [
      {
        "clave": "org_nombre",
        "label": "Nombre del centro veterinario"
      },
      {
        "clave": "org_nif",
        "label": "NIF/CIF del centro"
      },
      {
        "clave": "org_direccion",
        "label": "Domicilio del centro"
      },
      {
        "clave": "profesional",
        "label": "Veterinario/a responsable"
      },
      {
        "clave": "num_colegiado",
        "label": "Nº de colegiado/a"
      },
      {
        "clave": "paciente_nombre",
        "label": "Nombre del propietario/responsable"
      },
      {
        "clave": "paciente_dni",
        "label": "DNI/NIF del propietario"
      },
      {
        "clave": "propietario_direccion",
        "label": "Domicilio del propietario"
      },
      {
        "clave": "propietario_telefono",
        "label": "Teléfono del propietario"
      },
      {
        "clave": "animal_especie",
        "label": "Especie del animal"
      },
      {
        "clave": "animal_raza",
        "label": "Raza del animal"
      },
      {
        "clave": "animal_nombre",
        "label": "Nombre del animal"
      },
      {
        "clave": "animal_sexo",
        "label": "Sexo del animal"
      },
      {
        "clave": "animal_nacimiento",
        "label": "Fecha de nacimiento/edad del animal"
      },
      {
        "clave": "animal_microchip",
        "label": "Nº de identificación (microchip)"
      },
      {
        "clave": "tratamiento",
        "label": "Intervención/tratamiento propuesto"
      },
      {
        "clave": "finalidad",
        "label": "Finalidad y utilidad del procedimiento"
      },
      {
        "clave": "riesgos",
        "label": "Riesgos, complicaciones y efectos secundarios"
      },
      {
        "clave": "importe_estimado",
        "label": "Importe estimado"
      },
      {
        "clave": "provision_fondos",
        "label": "Provisión de fondos"
      },
      {
        "clave": "fecha",
        "label": "Fecha de firma"
      }
    ],
    "marcoLegal": [
      "Código Deontológico para el ejercicio de la profesión Veterinaria (Organización Colegial Veterinaria Española) — Art. 18 'Deber de información. El consentimiento informado' (obligación de informar en lenguaje comprensible del diagnóstico y opciones de tratamiento, y de solicitar y obtener consentimiento EXPRESO y ESCRITO antes de actos clínicos que supongan riesgo para el animal, eutanasia o necropsia) y Art. 20 (historia clínica y conservación de protocolos durante un mínimo de 5 años desde la última anotación).",
      "Ley 41/2002, de 14 de noviembre, básica reguladora de la autonomía del paciente y de derechos y obligaciones en materia de información y documentación clínica — NO es de aplicación directa a la veterinaria (regula al paciente humano); sus principios (información previa, comprensible, voluntariedad, comprensión, forma escrita en intervenciones de riesgo) se aplican POR ANALOGÍA a la relación veterinario-propietario, según doctrina y jurisprudencia.",
      "Reglamento (UE) 2016/679 (RGPD) — tratamiento de los datos personales del propietario/responsable (no del animal): bases de legitimación (ejecución del contrato de servicios y obligación legal), información del art. 13, principios de minimización y limitación de la conservación.",
      "Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD) — desarrollo nacional del RGPD; deber de información y derechos del interesado; reclamación ante la AEPD.",
      "Código Civil — responsabilidad contractual (arts. 1101 y ss.) y extracontractual (art. 1902); el contrato de prestación de servicios veterinarios es de medios (no de resultado) y la ausencia o deficiencia de consentimiento informado es generadora de responsabilidad civil del veterinario.",
      "Normativa estatal de protección y bienestar animal: Ley 7/2023, de 28 de marzo, de protección de los derechos y el bienestar de los animales (y Ley 50/1999 sobre animales potencialmente peligrosos cuando proceda).",
      "Normativa sectorial sobre medicamentos veterinarios y prescripción: Reglamento (UE) 2019/6 y RD 666/2023 (prescripción y dispensación de medicamentos veterinarios), relevante para la información sobre la terapia y la prescripción.",
      "Normativa autonómica de protección animal y de centros/establecimientos veterinarios (varía según la Comunidad Autónoma; p. ej. plazos por abandono del animal no recogido tras el alta), que debe verificarse en cada territorio."
    ],
    "aviso": "Este documento es una plantilla orientativa de carácter general, elaborada a partir del Código Deontológico de la profesión veterinaria (art. 18 y 20), de la aplicación por analogía de los principios de la Ley 41/2002 y de la normativa de protección de datos (RGPD y LOPDGDD). No constituye asesoramiento jurídico. La medicina veterinaria no se rige por una ley estatal específica de consentimiento informado equivalente a la Ley 41/2002 (que regula al paciente humano), por lo que el documento debe adaptarse a cada acto clínico concreto, a la normativa autonómica de protección animal y de centros veterinarios aplicable, y a la información específica de riesgos de cada procedimiento. Antes de su uso, debe ser revisado y validado por un asesor jurídico y por el colegio veterinario correspondiente."
  },
  {
    "id": "general",
    "especialidad": "general",
    "especialidadLabel": "Medicina general / Nutrición",
    "titulo": "Documento de Consentimiento Informado - Consulta de Medicina General y Nutrición",
    "cuerpoHtml": "<p>DOCUMENTO DE CONSENTIMIENTO INFORMADO<br>Consulta de Medicina General y Nutrición</p>\n<p>(Conforme a la Ley 41/2002, de 14 de noviembre, básica reguladora de la autonomía del paciente)</p>\n<p>1. DATOS DE IDENTIFICACIÓN</p>\n<p>Centro / organización sanitaria: {{org_nombre}}<br>NIF: {{org_nif}}<br>Domicilio: {{org_direccion}}</p>\n<p>Profesional responsable: {{profesional}}<br>N.º de colegiado / Colegio profesional: {{num_colegiado}}</p>\n<p>Paciente: {{paciente_nombre}}<br>DNI / NIE: {{paciente_dni}}</p>\n<p>Representante legal / familiar o allegado (cumplimentar solo si procede): {{representante_nombre}}<br>DNI / NIE del representante: {{representante_dni}}<br>Motivo de la representación: {{motivo_representacion}}</p>\n<p>2. INFORMACIÓN SOBRE EL ACTO O TRATAMIENTO PROPUESTO</p>\n<p>Se me ha informado de que el acto, valoración o tratamiento propuesto es:<br>{{tratamiento}}</p>\n<p>Naturaleza y descripción del procedimiento:<br>El profesional me ha explicado, en un lenguaje comprensible, en qué consiste el procedimiento o tratamiento propuesto en el ámbito de la medicina general y/o el abordaje nutricional, así como su forma de realización. {{descripcion_procedimiento}}</p>\n<p>Finalidad y beneficios esperados:<br>La finalidad del procedimiento es {{finalidad}}, esperándose los siguientes beneficios: {{beneficios}}.</p>\n<p>Consecuencias relevantes o seguras:<br>He sido informado/a de las consecuencias que con seguridad se derivan de su realización: {{consecuencias_seguras}}.</p>\n<p>Riesgos típicos o frecuentes:<br>Conforme al estado actual de la ciencia, los riesgos probables en condiciones normales son: {{riesgos_tipicos}}.</p>\n<p>Riesgos personalizados:<br>En atención a mis circunstancias personales o profesionales que he comunicado al profesional ({{circunstancias_personales}}), se me han explicado los siguientes riesgos específicos: {{riesgos_personalizados}}.</p>\n<p>Molestias y efectos secundarios previsibles:<br>{{efectos_secundarios}}</p>\n<p>Contraindicaciones:<br>{{contraindicaciones}}</p>\n<p>Alternativas:<br>Se me han explicado las alternativas razonables disponibles: {{alternativas}}, así como las consecuencias previsibles de no realizar el procedimiento propuesto: {{consecuencias_no_tratamiento}}.</p>\n<p>3. DECLARACIONES DEL PACIENTE</p>\n<p>Declaro que:<br>- He sido informado/a de forma clara, comprensible y suficiente sobre los aspectos anteriores.<br>- He podido formular todas las preguntas que he considerado oportunas y se me han aclarado todas mis dudas.<br>- He comprendido la información recibida y he dispuesto del tiempo necesario para reflexionar y tomar mi decisión.<br>- Soy consciente de que la medicina no es una ciencia exacta y de que no se me ha garantizado un resultado concreto.<br>- Conozco que puedo REVOCAR libremente este consentimiento en cualquier momento, sin necesidad de expresar la causa y sin que ello afecte a la calidad de mi asistencia futura.</p>\n<p>En consecuencia, DOY MI CONSENTIMIENTO LIBRE Y VOLUNTARIO para la realización del procedimiento o tratamiento descrito.</p>\n<p>Lugar y fecha: ___________________, {{fecha}}</p>\n<p>Firma del paciente:                          Firma del profesional:</p>\n<p>Firma del representante legal / familiar (si procede):</p>\n<p>4. INFORMACIÓN SOBRE PROTECCIÓN DE DATOS (RGPD y LOPDGDD)</p>\n<p>Responsable del tratamiento: {{org_nombre}} (NIF {{org_nif}}), con domicilio en {{org_direccion}}.<br>Delegado de Protección de Datos (si existe): {{contacto_dpd}}.<br>Finalidad: prestación de asistencia sanitaria, seguimiento clínico y nutricional, gestión administrativa, de facturación y, en su caso, cumplimiento de obligaciones legales.<br>Base jurídica: el tratamiento de sus datos de salud se basa en el artículo 9.2.h) del RGPD (fines de medicina preventiva, diagnóstico médico y prestación de asistencia sanitaria), en relación con el artículo 6 del RGPD, la Disposición adicional 17.ª de la LOPDGDD y la legislación sanitaria aplicable.<br>Destinatarios: sus datos no se cederán a terceros salvo obligación legal o cuando sea necesario para la asistencia (p. ej., entidades aseguradoras o mutuas que financien la prestación, laboratorios o profesionales que intervengan en su proceso). <br>Plazo de conservación: los datos de la historia clínica se conservarán durante el tiempo legalmente exigido, como mínimo cinco años desde la fecha de alta de cada proceso asistencial, sin perjuicio de plazos superiores establecidos por la normativa autonómica o de otra índole.<br>Derechos: puede ejercer sus derechos de acceso, rectificación, supresión, limitación del tratamiento, oposición y portabilidad dirigiéndose a {{org_nombre}} en la dirección indicada o en {{contacto_privacidad}}. Asimismo, tiene derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (www.aepd.es) si considera que el tratamiento no se ajusta a la normativa.</p>\n<p>Nota: este consentimiento sobre protección de datos es independiente del consentimiento informado asistencial recogido en los apartados anteriores.</p>\n<p>5. REVOCACIÓN DEL CONSENTIMIENTO</p>\n<p>Don/Doña {{paciente_nombre}}, con DNI/NIE {{paciente_dni}}, REVOCO el consentimiento prestado en el presente documento, sin necesidad de expresar la causa.</p>\n<p>Lugar y fecha: ___________________, _______________</p>\n<p>Firma del paciente / representante:                  Firma del profesional:</p>\n<p>He recibido una copia de este documento. El original se archivará en mi historia clínica.</p>",
    "variables": [
      {
        "clave": "{{org_nombre}}",
        "label": "Nombre del centro / organización sanitaria"
      },
      {
        "clave": "{{org_nif}}",
        "label": "NIF de la organización"
      },
      {
        "clave": "{{org_direccion}}",
        "label": "Domicilio del centro"
      },
      {
        "clave": "{{profesional}}",
        "label": "Nombre del profesional responsable"
      },
      {
        "clave": "{{num_colegiado}}",
        "label": "Número de colegiado y colegio profesional"
      },
      {
        "clave": "{{paciente_nombre}}",
        "label": "Nombre y apellidos del paciente"
      },
      {
        "clave": "{{paciente_dni}}",
        "label": "DNI / NIE del paciente"
      },
      {
        "clave": "{{representante_nombre}}",
        "label": "Nombre del representante legal o allegado (si procede)"
      },
      {
        "clave": "{{representante_dni}}",
        "label": "DNI / NIE del representante (si procede)"
      },
      {
        "clave": "{{motivo_representacion}}",
        "label": "Motivo de la representación (menor, incapacidad...)"
      },
      {
        "clave": "{{tratamiento}}",
        "label": "Acto, valoración o tratamiento propuesto"
      },
      {
        "clave": "{{descripcion_procedimiento}}",
        "label": "Descripción y naturaleza del procedimiento"
      },
      {
        "clave": "{{finalidad}}",
        "label": "Finalidad del procedimiento"
      },
      {
        "clave": "{{beneficios}}",
        "label": "Beneficios esperados"
      },
      {
        "clave": "{{consecuencias_seguras}}",
        "label": "Consecuencias seguras o relevantes"
      },
      {
        "clave": "{{riesgos_tipicos}}",
        "label": "Riesgos típicos o frecuentes"
      },
      {
        "clave": "{{circunstancias_personales}}",
        "label": "Circunstancias personales o profesionales comunicadas"
      },
      {
        "clave": "{{riesgos_personalizados}}",
        "label": "Riesgos personalizados según el paciente"
      },
      {
        "clave": "{{efectos_secundarios}}",
        "label": "Molestias y efectos secundarios previsibles"
      },
      {
        "clave": "{{contraindicaciones}}",
        "label": "Contraindicaciones"
      },
      {
        "clave": "{{alternativas}}",
        "label": "Alternativas disponibles"
      },
      {
        "clave": "{{consecuencias_no_tratamiento}}",
        "label": "Consecuencias de no realizar el procedimiento"
      },
      {
        "clave": "{{contacto_dpd}}",
        "label": "Datos de contacto del Delegado de Protección de Datos (si existe)"
      },
      {
        "clave": "{{contacto_privacidad}}",
        "label": "Canal para ejercer derechos de protección de datos"
      },
      {
        "clave": "{{fecha}}",
        "label": "Fecha de firma"
      }
    ],
    "marcoLegal": [
      "Ley 41/2002, de 14 de noviembre, básica reguladora de la autonomía del paciente y de derechos y obligaciones en materia de información y documentación clínica (arts. 2, 4, 5, 8, 9, 10 y 15). Es la norma estatal básica que regula el consentimiento informado.",
      "Ley 41/2002, art. 8: el consentimiento es por regla general verbal, pero se exige por ESCRITO en intervenciones quirúrgicas, procedimientos diagnósticos y terapéuticos invasores y, en general, procedimientos que suponen riesgos o inconvenientes de notoria y previsible repercusión negativa sobre la salud del paciente.",
      "Ley 41/2002, art. 10: información básica previa al consentimiento por escrito (consecuencias seguras y relevantes, riesgos por circunstancias personales o profesionales del paciente, riesgos probables en condiciones normales conforme al estado de la ciencia, y contraindicaciones).",
      "Ley 41/2002, art. 9: límites del consentimiento, renuncia a la información y consentimiento por representación (menores e incapaces).",
      "Reglamento (UE) 2016/679 (RGPD), arts. 6, 9 y 13: licitud del tratamiento, tratamiento de categorías especiales de datos (datos de salud) y deber de información al interesado. Base habilitante habitual en asistencia: art. 9.2.h (fines de medicina preventiva, diagnóstico y asistencia sanitaria) en relación con el art. 6.1.",
      "Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD), en particular su Disposición adicional 17.ª sobre tratamientos de datos de salud, y arts. 11 y siguientes sobre información y ejercicio de derechos.",
      "Normativa autonómica de aplicación: cada CCAA puede tener ley propia de derechos del paciente/consentimiento informado (p. ej. Ley catalana 21/2000, Ley gallega 3/2001, Ley 8/2003 de Castilla y León) que complementa, sin contradecir, la Ley 41/2002.",
      "Códigos deontológicos profesionales: Código de Deontología Médica de la OMC (consentimiento e información al paciente) y, para nutricionistas no médicos, el código deontológico del Consejo General de Colegios de Dietistas-Nutricionistas (CGCODN). Nota: el dietista-nutricionista no médico no prescribe medicamentos ni realiza actos médicos reservados.",
      "Real Decreto 1093/2010 (conjunto mínimo de datos de la historia clínica) y normativa de conservación de la historia clínica (mínimo 5 años desde el alta de cada proceso asistencial, art. 17 Ley 41/2002, sin perjuicio de plazos autonómicos superiores)."
    ],
    "aviso": "Esta plantilla y el análisis legal asociado tienen carácter meramente orientativo y educativo, y se basan en la Ley 41/2002, el RGPD (UE 2016/679) y la LOPDGDD (LO 3/2018) vigentes a la fecha de su elaboración. No constituyen asesoramiento jurídico. Antes de su uso en una clínica real debe ser revisada y adaptada por un asesor jurídico o un profesional del Derecho colegiado, teniendo en cuenta la normativa autonómica aplicable, los códigos deontológicos del colegio profesional correspondiente y las circunstancias concretas de cada procedimiento y paciente. Para procedimientos específicos se recomienda utilizar el modelo de consentimiento propio del colegio o sociedad científica de la especialidad."
  },
  {
    "id": "rgpd",
    "especialidad": "rgpd",
    "especialidadLabel": "Protección de datos e imágenes (RGPD)",
    "titulo": "Información y Consentimiento Informado para el Tratamiento de Datos Personales y Uso de Imágenes Clínicas (RGPD/LOPDGDD)",
    "cuerpoHtml": "<p>DOCUMENTO DE INFORMACIÓN Y CONSENTIMIENTO INFORMADO PARA EL TRATAMIENTO DE DATOS PERSONALES Y EL USO DE IMÁGENES CLÍNICAS</p>\n<p>En cumplimiento del Reglamento (UE) 2016/679 (RGPD), la Ley Orgánica 3/2018 (LOPDGDD), la Ley 41/2002 de autonomía del paciente y la Ley Orgánica 1/1982 sobre el derecho a la propia imagen.</p>\n<p>Lugar y fecha: {{fecha}}</p>\n<p>------------------------------------------------------------<br>1. RESPONSABLE DEL TRATAMIENTO<br>------------------------------------------------------------<br>Denominación: {{org_nombre}}<br>NIF/CIF: {{org_nif}}<br>Dirección: {{org_direccion}}<br>Correo electrónico de contacto: {{org_email}}<br>Teléfono: {{org_telefono}}<br>Delegado de Protección de Datos (DPD/DPO), si procede: {{dpo_contacto}}</p>\n<p>------------------------------------------------------------<br>2. DATOS DEL PACIENTE (O REPRESENTANTE LEGAL)<br>------------------------------------------------------------<br>Nombre y apellidos: {{paciente_nombre}}<br>DNI/NIE: {{paciente_dni}}<br>En caso de menor o persona con capacidad modificada, representante legal:<br>Nombre del representante: {{representante_nombre}}<br>DNI/NIE del representante: {{representante_dni}}<br>En calidad de: {{representante_relacion}}</p>\n<p>------------------------------------------------------------<br>3. INFORMACIÓN BÁSICA SOBRE PROTECCIÓN DE DATOS<br>------------------------------------------------------------<br>Le informamos de que los datos personales que nos facilita, así como los que se generen con motivo de la relación asistencial (incluidos datos de salud, datos biométricos e imágenes), serán tratados por {{org_nombre}} con las finalidades, bases jurídicas y plazos que se detallan a continuación. Los datos relativos a la salud y los datos biométricos tienen la consideración de categorías especiales de datos (art. 9 RGPD) y gozan de una protección reforzada.</p>\n<p>3.1. FINES DEL TRATAMIENTO Y BASE JURÍDICA (LEGITIMACIÓN)</p>\n<p>a) Prestación de asistencia sanitaria y elaboración de la historia clínica vinculada al tratamiento \"{{tratamiento}}\".<br>   Base jurídica: ejecución de la relación asistencial y art. 9.2.h) RGPD (fines de medicina preventiva, diagnóstico y prestación de asistencia sanitaria), en relación con la Ley 41/2002. Su consentimiento informado para el acto asistencial se recoge igualmente conforme a dicha ley.</p>\n<p>b) Gestión administrativa, contable, fiscal y de facturación de los servicios.<br>   Base jurídica: cumplimiento de obligaciones legales (art. 6.1.c RGPD) y ejecución de la relación contractual (art. 6.1.b RGPD).</p>\n<p>c) Comunicaciones operativas y recordatorios de citas y de tratamiento por teléfono, SMS, correo electrónico o mensajería.<br>   Base jurídica: ejecución de la relación asistencial e interés legítimo / consentimiento (art. 6.1.b y 6.1.a RGPD).</p>\n<p>d) Tratamiento de imágenes y fotografías clínicas (incluidas las de \"antes y después\") con FINES ASISTENCIALES, de seguimiento clínico y de documentación de la historia clínica.<br>   Base jurídica: consentimiento explícito (art. 9.2.a RGPD) y finalidad asistencial (art. 9.2.h RGPD).</p>\n<p>e) Uso y publicación de imágenes y fotografías clínicas (incluidas las de \"antes y después\") con FINES DIVULGATIVOS, FORMATIVOS, DE PROMOCIÓN O MARKETING de la clínica (web corporativa, redes sociales, material publicitario, etc.).<br>   Base jurídica: consentimiento explícito y separado del interesado (art. 9.2.a RGPD y Ley Orgánica 1/1982). Esta finalidad es VOLUNTARIA y su negativa no afectará en ningún caso a la asistencia prestada.</p>\n<p>3.2. DESTINATARIOS<br>Sus datos podrán comunicarse, cuando resulte necesario, a: entidades aseguradoras o mutuas con las que usted tenga cobertura; otros profesionales o centros sanitarios para la continuidad asistencial; laboratorios y centros de diagnóstico; Administraciones Públicas, Administración tributaria y entidades bancarias en cumplimiento de obligaciones legales; y proveedores que actúan como encargados del tratamiento bajo contrato (p. ej. soporte informático, gestoría), con las debidas garantías. No se realizan transferencias internacionales de datos fuera del Espacio Económico Europeo, salvo que se le informe expresamente y se adopten las garantías adecuadas.</p>\n<p>3.3. PLAZO DE CONSERVACIÓN<br>Los datos asistenciales y la historia clínica se conservarán durante el tiempo de la relación asistencial y, como mínimo, durante cinco (5) años desde la fecha del alta de cada proceso asistencial, conforme a la Ley 41/2002 y a la normativa autonómica aplicable, así como durante los plazos legales en materia fiscal, contable y de responsabilidad. Las imágenes utilizadas con fines divulgativos o de marketing se conservarán hasta que usted retire su consentimiento o solicite su supresión.</p>\n<p>3.4. DERECHOS DEL INTERESADO<br>Puede ejercer en cualquier momento sus derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad, así como retirar el consentimiento prestado (sin que ello afecte a la licitud del tratamiento previo), dirigiéndose a {{org_nombre}} en la dirección {{org_direccion}} o en el correo {{org_email}}, acreditando su identidad. Asimismo, tiene derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD, C/ Jorge Juan 6, 28001 Madrid, www.aepd.es) si considera que sus derechos no han sido debidamente atendidos.</p>\n<p>------------------------------------------------------------<br>4. CONSENTIMIENTOS (marque lo que proceda)<br>------------------------------------------------------------<br>Las siguientes autorizaciones son independientes entre sí. Su negativa a las opciones marcadas como voluntarias no afectará a la asistencia sanitaria que reciba.</p>\n<p>[ ] SÍ   [ ] NO   Consiento el tratamiento de mis datos personales y de salud para la prestación de la asistencia sanitaria relativa a \"{{tratamiento}}\" y la gestión de mi historia clínica. (Necesario para la asistencia.)</p>\n<p>[ ] SÍ   [ ] NO   Consiento recibir recordatorios de citas y comunicaciones operativas relacionadas con mi tratamiento.</p>\n<p>[ ] SÍ   [ ] NO   Consiento la captación y el tratamiento de imágenes/fotografías clínicas (incluidas \"antes y después\") con FINES ASISTENCIALES, de seguimiento clínico y documentación en mi historia clínica.</p>\n<p>[ ] SÍ   [ ] NO   (VOLUNTARIO) Consiento expresamente el uso y la publicación de mis imágenes/fotografías clínicas (incluidas \"antes y después\") con FINES DIVULGATIVOS, FORMATIVOS, DE PROMOCIÓN O MARKETING de {{org_nombre}}, en los siguientes soportes y canales: {{canales_difusion}}.<br>        Modo de publicación:  [ ] Identificable   [ ] De forma anonimizada / sin mostrar rostro ni rasgos identificativos<br>        Ámbito temporal: hasta la retirada de mi consentimiento.</p>\n<p>Declaro que se me ha informado de que las imágenes publicadas en internet o en redes sociales pueden ser objeto de difusión, copia o indexación por terceros, lo que puede limitar el control efectivo sobre ellas una vez publicadas, y de que puedo revocar este consentimiento en cualquier momento, procediendo la clínica a retirarlas de los soportes que estén bajo su control.</p>\n<p>------------------------------------------------------------<br>5. DECLARACIÓN Y FIRMA<br>------------------------------------------------------------<br>Declaro que he leído y comprendido la información anterior, que he tenido la oportunidad de formular preguntas y que estas han sido respondidas satisfactoriamente, y que presto mi consentimiento de forma libre, específica, informada e inequívoca para las finalidades marcadas.</p>\n<p>El/la paciente (o representante legal):</p>\n<p>Nombre: {{paciente_nombre}}     DNI/NIE: {{paciente_dni}}</p>\n<p>Firma: ____________________________     Fecha: {{fecha}}</p>\n<p>Por la clínica / profesional responsable:</p>\n<p>Profesional: {{profesional}}</p>\n<p>Firma y sello: ____________________________     Fecha: {{fecha}}</p>\n<p>------------------------------------------------------------<br>REVOCACIÓN DEL CONSENTIMIENTO<br>------------------------------------------------------------<br>Yo, {{paciente_nombre}}, con DNI/NIE {{paciente_dni}}, REVOCO el/los consentimiento(s) anteriormente prestado(s) con efectos desde la fecha de esta firma, sin que ello afecte a la licitud de los tratamientos realizados con anterioridad.</p>\n<p>Firma: ____________________________     Fecha: __________________</p>",
    "variables": [
      {
        "clave": "org_nombre",
        "label": "Nombre o razón social de la clínica (responsable del tratamiento)"
      },
      {
        "clave": "org_nif",
        "label": "NIF/CIF de la clínica"
      },
      {
        "clave": "org_direccion",
        "label": "Dirección postal de la clínica"
      },
      {
        "clave": "org_email",
        "label": "Correo electrónico de contacto para ejercicio de derechos"
      },
      {
        "clave": "org_telefono",
        "label": "Teléfono de contacto de la clínica"
      },
      {
        "clave": "dpo_contacto",
        "label": "Datos de contacto del Delegado de Protección de Datos (si procede)"
      },
      {
        "clave": "paciente_nombre",
        "label": "Nombre y apellidos del paciente"
      },
      {
        "clave": "paciente_dni",
        "label": "DNI/NIE del paciente"
      },
      {
        "clave": "representante_nombre",
        "label": "Nombre del representante legal (si el paciente es menor o tiene capacidad modificada)"
      },
      {
        "clave": "representante_dni",
        "label": "DNI/NIE del representante legal"
      },
      {
        "clave": "representante_relacion",
        "label": "Relación o calidad en que actúa el representante legal"
      },
      {
        "clave": "tratamiento",
        "label": "Tratamiento, procedimiento o servicio asistencial objeto del consentimiento"
      },
      {
        "clave": "canales_difusion",
        "label": "Soportes y canales concretos de difusión de las imágenes (web, redes sociales, material publicitario, etc.)"
      },
      {
        "clave": "profesional",
        "label": "Nombre del profesional sanitario responsable"
      },
      {
        "clave": "fecha",
        "label": "Fecha de firma del documento"
      }
    ],
    "marcoLegal": [
      "Reglamento (UE) 2016/679 (RGPD), arts. 4, 5, 6, 7, 9 (categorías especiales: datos de salud), 12, 13 (deber de información), 15-22 (derechos), 83 (régimen sancionador)",
      "Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD), arts. 6 (consentimiento), 7 (consentimiento de menores), 9 (categorías especiales de datos / datos de salud) y 11 (transparencia e información)",
      "Ley 41/2002, de 14 de noviembre, básica reguladora de la autonomía del paciente y de derechos y obligaciones en materia de información y documentación clínica, arts. 4, 8, 9 y 10 (consentimiento informado; por escrito en cirugía, procedimientos invasivos y de riesgo notoriamente previsible)",
      "Ley Orgánica 1/1982, de 5 de mayo, de protección civil del derecho al honor, a la intimidad personal y familiar y a la propia imagen (consentimiento expreso para captación, reproducción y publicación de la imagen)",
      "Ley Orgánica 1/1996, de 15 de enero, de Protección Jurídica del Menor (uso de imágenes de menores)",
      "Real Decreto 1720/2007 y normativa autonómica sanitaria aplicable (historia clínica), en lo no derogado o compatible con RGPD/LOPDGDD",
      "Directrices del Comité Europeo de Protección de Datos (EDPB/CEPD) y guías de la AEPD sobre consentimiento y deber de informar"
    ],
    "aviso": "Este documento es ORIENTATIVO y de carácter general. No constituye asesoramiento jurídico ni una plantilla validada para un caso concreto. Antes de su uso debe ser revisado y adaptado por un asesor jurídico o el Delegado de Protección de Datos de la organización, atendiendo a la actividad y especialidad concretas de la clínica, a la normativa autonómica sanitaria aplicable, al registro de actividades de tratamiento y al análisis de riesgos correspondiente. La clínica debe poder acreditar en todo momento el consentimiento obtenido (responsabilidad proactiva, art. 5.2 y 7.1 RGPD) y recabar consentimientos separados y específicos por cada finalidad, en especial para la publicación de imágenes con fines publicitarios; la AEPD ha sancionado a clínicas por publicar fotografías de \"antes y después\" sin un consentimiento explícito y diferenciado para dicha finalidad."
  }
];

/** Plantillas recomendadas para una especialidad/vertical (incluye las transversales RGPD). */
export function plantillasRecomendadas(vertical?: string | null): PlantillaConsentimiento[] {
  return PLANTILLAS_CONSENTIMIENTO.filter((p) => p.especialidad === vertical || p.especialidad === "rgpd");
}
