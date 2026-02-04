# AKN Communication: A New Document Type for Inter-Institutional Messages

**Fecha**: 04/02/2026
**Autor**: Parlamento.ai
**Estado**: Propuesta (borrador)

---

## Contexto

Este documento es la tercera y ultima propuesta de tipos nuevos para Akoma Ntoso, despues de `citation` (agendas parlamentarias, documentado en `research/2026-02-03/citation-type-proposal.md`) y `question` (preguntas escritas e interpelaciones, documentado en `research/2026-02-04/question-type-proposal.md`).

De las tres propuestas, esta es la mas debil en terminos de urgencia. Los tipos `citation` y `question` resuelven gaps claros donde el tipo `doc` de AKN es insuficiente para queries automaticos. El tipo `communication` resuelve un gap mas sutil: la falta de representacion de los **mensajes formales entre instituciones** que mueven la legislacion de un lugar a otro.

Incluimos esta propuesta porque la investigacion demostro que estos documentos son universales, publicados, y estructuralmente consistentes — pero reconocemos que muchas implementaciones podrian vivir con `doc` para este caso sin sufrir demasiado.

---

## Parte 1: Que son las comunicaciones inter-institucionales

### El sistema postal del legislativo

Cuando el Senado aprueba un proyecto de ley, no aparece magicamente en la Camara de Diputados. Alguien tiene que mandarlo formalmente. Ese envio es un **oficio**: un documento numerado, firmado y publicado que dice "el Senado ha aprobado el Proyecto 16.245-07 con las siguientes modificaciones, y lo remite a la Camara para su consideracion".

Estos documentos son el **tejido conectivo** del proceso legislativo. Sin ellos, puedes ver los documentos individuales (bill, debate, amendment, act) pero no puedes ver *como se movieron entre instituciones*. El oficio es lo que te dice "este proyecto paso del Senado a la Camara el 3 de febrero" o "el Presidente solicito urgencia inmediata el 5 de febrero".

### Los subtipos

Las comunicaciones inter-institucionales tienen varios subtipos, pero comparten una estructura comun: **emisor → receptor → accion → documento referenciado**.

#### Entre camaras

| Subtipo | Ejemplo | Descripcion |
|---------|---------|-------------|
| Transmision | Oficio de ley | El Senado envia proyecto aprobado a la Camara |
| Devolucion con enmiendas | Oficio de vuelta | La Camara devuelve proyecto con modificaciones |
| Desacuerdo | Oficio de rechazo | La Camara rechaza las enmiendas del Senado |
| Informe de comision mixta | Oficio de CMP | La comision mixta envia su propuesta a ambas camaras |

#### Del ejecutivo al legislativo

| Subtipo | Ejemplo | Descripcion |
|---------|---------|-------------|
| Mensaje presidencial | Mensaje del Presidente | El Presidente envia un proyecto de ley con su fundamentacion |
| Solicitud de urgencia | Oficio de urgencia | El Presidente pide tramitacion urgente (simple, suma, inmediata) |
| Retiro de urgencia | Oficio de retiro | El Presidente retira la urgencia |
| Veto | Observaciones del Presidente | El Presidente objeta un proyecto aprobado |
| Promulgacion | Decreto promulgatorio | El Presidente promulga la ley (este es mas bien un `act`) |

#### Del legislativo al ejecutivo

| Subtipo | Ejemplo | Descripcion |
|---------|---------|-------------|
| Notificacion de aprobacion | Oficio al Ejecutivo | El Congreso notifica al Presidente que aprobo el proyecto |
| Insistencia | Oficio de insistencia | El Congreso rechaza el veto e insiste con 2/3 |

#### Del legislativo al judicial

| Subtipo | Ejemplo | Descripcion |
|---------|---------|-------------|
| Control preventivo | Requerimiento | El Congreso envia ley organica al Tribunal Constitucional |
| Impugnacion | Requerimiento de inconstitucionalidad | Legisladores impugnan constitucionalidad de un proyecto |

### Como funciona en cada pais

| Pais | Nombre | Particularidades |
|------|--------|-----------------|
| Chile | Oficio / Mensaje | Oficios numerados, mensajes presidenciales con fundamentacion extensa |
| España | Comunicacion | Publicadas en el Boletin Oficial de las Cortes Generales (BOCG) |
| Francia | Transmission du texte | La "petite loi" (texto aprobado) se transmite con documento de portada |
| Alemania | Zuleitung | Transmisiones formales entre Bundestag y Bundesrat. Einspruch (objecion) del Bundesrat |
| Reino Unido | Messages | Mensajes formales entre Commons y Lords. "Reasons" cuando Commons rechaza enmiendas de Lords |
| Estados Unidos | Messages from the Senate/House | Registrados en el Congressional Record y Journal. Engrossed bill transmitido fisicamente |
| Argentina | Mensaje del Poder Ejecutivo | Mensajes presidenciales acompañando proyectos |
| Mexico | Iniciativa del Ejecutivo | Publicada en la Gaceta Parlamentaria |
| Brasil | Mensagem Presidencial | Numeradas, publicadas en el Diario Oficial |
| Union Europea | Positions / Communications | Posiciones del Parlamento y Consejo en primera y segunda lectura. Sistema altamente formalizado |

---

## Parte 2: Por que es un gap en AKN (y por que es el mas debil de los tres)

### El caso a favor

Las comunicaciones inter-institucionales son:

1. **Universales**: Existen en todos los sistemas bicamerales y en todos los sistemas con separacion de poderes
2. **Publicadas**: Son documentos formales, numerados, firmados, publicados en boletines oficiales
3. **Estructuralmente consistentes**: Siempre tienen emisor, receptor, accion, y documento referenciado
4. **Direccionales**: Tienen un sentido (de A hacia B) que ningun tipo AKN captura

### El caso en contra (por que es el mas debil)

A diferencia de `citation` y `question`, las comunicaciones:

1. **No requieren queries complejas**: Rara vez necesitas "muestrame todos los oficios del Senado a la Camara este mes". Normalmente encuentras un oficio cuando estas siguiendo un proyecto especifico.
2. **Son relativamente simples**: Un oficio es basicamente una carta con metadata. El contenido sustantivo (el texto del proyecto, las enmiendas) ya esta en otro documento AKN (el bill, el amendment).
3. **Pueden vivir en `doc`**: Un `<doc name="oficio">` con buenas referencias FRBR pierde algo de semantica pero no impide el trabajo.
4. **Son accesorias**: A nadie le importa el oficio por si mismo — le importa el proyecto que el oficio transmite.

### Por que lo incluimos de todas formas

A pesar de ser el gap mas debil, lo incluimos porque:

1. **Completa la vision**: Si la meta es que una carpeta de archivos AKN pueda reconstruir todo el proceso legislativo, los oficios son los links que conectan los nodos. Sin ellos, sabes que un proyecto "estuvo en el Senado" y "estuvo en la Camara", pero no sabes *cuando paso de uno a otro*.
2. **Trazabilidad**: El oficio registra la fecha exacta de transmision, lo cual es critico para calcular plazos constitucionales (urgencias, plazos de promulgacion).
3. **Mensajes presidenciales son sustantivos**: A diferencia de un oficio entre camaras (que es basicamente una carta de portada), un mensaje presidencial contiene una fundamentacion extensa que explica *por que* el ejecutivo propone la ley. Esa fundamentacion no vive en ningun otro lugar.

---

## Parte 3: Diseño del tipo `communication`

### Principios de diseño

1. **Consistencia con AKN**: Mismas convenciones FRBR, TLC, eId.
2. **Direccionalidad explicita**: Emisor y receptor son campos de primer nivel, no texto libre.
3. **Accion tipada**: El tipo de comunicacion (transmision, urgencia, veto, etc.) es un campo computable.
4. **Referencial**: Siempre apunta al documento que se transmite o sobre el cual se actua.
5. **Ligero**: El contenido sustantivo se mantiene minimo — el peso esta en la metadata y en las referencias.

### Elementos nuevos

| Elemento | Proposito |
|----------|-----------|
| `<communication>` | Tipo raiz del documento |
| `<communicationBody>` | Contenedor del cuerpo |
| `<transmission>` | Metadata de la comunicacion: quien, a quien, que, por que |
| `<rationale>` | Fundamentacion (usado en mensajes presidenciales y vetos) |

### Estructura completa — Ejemplo 1: Oficio entre camaras

```xml
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0">
  <communication name="oficio-senado-camara-2026-234">

    <!-- ============================================================ -->
    <!-- METADATA                                                     -->
    <!-- ============================================================ -->
    <meta>
      <identification source="#secretaria-senado">

        <FRBRWork>
          <FRBRthis value="/akn/cl/communication/senado/2026-234"/>
          <FRBRuri value="/akn/cl/communication/senado/2026-234"/>
          <FRBRdate date="2026-02-03" name="transmission"/>
          <FRBRauthor href="#senado"/>
          <FRBRcountry value="cl"/>
        </FRBRWork>

        <FRBRExpression>
          <FRBRthis value="/akn/cl/communication/senado/2026-234/esp@2026-02-03"/>
          <FRBRuri value="/akn/cl/communication/senado/2026-234/esp@2026-02-03"/>
          <FRBRdate date="2026-02-03" name="transmission"/>
          <FRBRlanguage language="esp"/>
        </FRBRExpression>

        <FRBRManifestation>
          <FRBRthis value="/akn/cl/communication/senado/2026-234/esp@2026-02-03/main.xml"/>
          <FRBRformat value="application/akn+xml"/>
        </FRBRManifestation>

      </identification>

      <references source="#secretaria-senado">
        <!-- Emisor -->
        <TLCOrganization eId="senado" href="/org/cl/senado"
                         showAs="Senado de la Republica"/>
        <!-- Receptor -->
        <TLCOrganization eId="camara" href="/org/cl/camara"
                         showAs="Camara de Diputadas y Diputados"/>
        <!-- Firmante -->
        <TLCPerson eId="presidente-senado" href="/persona/cl/presidente-senado"
                   showAs="Presidente del Senado"/>
        <TLCPerson eId="secretaria-senado" href="/persona/cl/secretaria-senado"
                   showAs="Secretario del Senado"/>
      </references>
    </meta>


    <!-- ============================================================ -->
    <!-- PREFACE                                                      -->
    <!-- ============================================================ -->
    <preface>
      <p class="title">Oficio N. 234/SEC/2026</p>
      <p class="subtitle">Del Senado a la Camara de Diputadas y Diputados</p>
    </preface>


    <!-- ============================================================ -->
    <!-- COMMUNICATION BODY                                           -->
    <!-- ============================================================ -->
    <communicationBody>

      <!--
        TRANSMISSION: metadata de la comunicacion.
        Quien envia, a quien, que tipo de accion, sobre que documento.
      -->
      <transmission eId="trans_1"
                    from="#senado"
                    to="#camara"
                    type="bill-transmission"
                    signedBy="#presidente-senado"
                    date="2026-02-03"
                    refersTo="/akn/cl/bill/16245-07"
                    stage="second-reading"/>

      <!--
        CONTENT: el texto del oficio.
        Generalmente breve y formulaico.
      -->
      <content eId="content_1">
        <p>Tengo a honra comunicar a Vuestra Excelencia que el Senado
           ha dado su aprobacion al siguiente proyecto de ley, iniciado
           en Mensaje de S.E. el Presidente de la Republica:</p>

        <p>Proyecto de ley que moderniza el sistema tributario
           (Boletin N. 16.245-07).</p>

        <p>Lo que comunico a Vuestra Excelencia en respuesta a su
           oficio N. 19.432, de fecha 15 de enero de 2026.</p>

        <p>Acompaño la totalidad de los antecedentes.</p>
      </content>

    </communicationBody>

  </communication>
</akomaNtoso>
```

### Estructura completa — Ejemplo 2: Mensaje presidencial

```xml
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0">
  <communication name="mensaje-presidente-2026-089">

    <meta>
      <identification source="#presidencia">

        <FRBRWork>
          <FRBRthis value="/akn/cl/communication/presidente/2026-089"/>
          <FRBRuri value="/akn/cl/communication/presidente/2026-089"/>
          <FRBRdate date="2026-01-10" name="submission"/>
          <FRBRauthor href="#presidente"/>
          <FRBRcountry value="cl"/>
        </FRBRWork>

        <FRBRExpression>
          <FRBRthis value="/akn/cl/communication/presidente/2026-089/esp@2026-01-10"/>
          <FRBRuri value="/akn/cl/communication/presidente/2026-089/esp@2026-01-10"/>
          <FRBRdate date="2026-01-10" name="submission"/>
          <FRBRlanguage language="esp"/>
        </FRBRExpression>

        <FRBRManifestation>
          <FRBRthis value="/akn/cl/communication/presidente/2026-089/esp@2026-01-10/main.xml"/>
          <FRBRformat value="application/akn+xml"/>
        </FRBRManifestation>

      </identification>

      <references source="#presidencia">
        <TLCPerson eId="presidente" href="/persona/cl/presidente-republica"
                   showAs="Presidente de la Republica"/>
        <TLCOrganization eId="camara" href="/org/cl/camara"
                         showAs="Camara de Diputadas y Diputados"/>
        <TLCOrganization eId="min-hacienda" href="/org/cl/gobierno/ministerio/hacienda"
                         showAs="Ministerio de Hacienda"/>
      </references>
    </meta>

    <preface>
      <p class="title">Mensaje de S.E. el Presidente de la Republica N. 089-374</p>
      <p class="subtitle">Proyecto de ley que moderniza el sistema tributario</p>
    </preface>

    <communicationBody>

      <transmission eId="trans_1"
                    from="#presidente"
                    to="#camara"
                    type="bill-submission"
                    signedBy="#presidente"
                    date="2026-01-10"
                    refersTo="/akn/cl/bill/16245-07"
                    cosignedBy="#min-hacienda"/>

      <!--
        RATIONALE: la fundamentacion del mensaje presidencial.
        Este es el contenido sustantivo que no vive en ningun otro lugar.
        Explica POR QUE el Presidente propone la ley.
      -->
      <rationale eId="rationale_1">
        <section eId="sec_antecedentes">
          <heading>I. Antecedentes</heading>
          <p>El sistema tributario vigente presenta deficiencias
             estructurales que afectan la recaudacion fiscal y
             la equidad horizontal del sistema...</p>
          <p>Diversos estudios, incluyendo el informe de la OCDE
             de 2024, han señalado la necesidad de modernizar
             los mecanismos de fiscalizacion y ampliar la base
             imponible...</p>
        </section>

        <section eId="sec_objetivos">
          <heading>II. Objetivos del Proyecto</heading>
          <p>El presente proyecto tiene por objeto:</p>
          <p>1. Simplificar el sistema de declaracion de impuestos
                para personas naturales y PYMES.</p>
          <p>2. Fortalecer las facultades del Servicio de Impuestos
                Internos en materia de fiscalizacion digital.</p>
          <p>3. Crear incentivos tributarios para la inversion en
                investigacion y desarrollo.</p>
        </section>

        <section eId="sec_contenido">
          <heading>III. Contenido del Proyecto</heading>
          <p>El proyecto se estructura en cuatro titulos...</p>
        </section>

        <section eId="sec_fiscal">
          <heading>IV. Impacto Fiscal</heading>
          <p>Segun el informe financiero de la Direccion de
             Presupuestos que se acompaña, el proyecto tendra
             un costo fiscal estimado de $45.000 millones
             anuales a regimen...</p>
          <ref href="/akn/cl/doc/informe-financiero/dipres/2026-089">
            Informe Financiero N. 089</ref>
        </section>
      </rationale>

    </communicationBody>

  </communication>
</akomaNtoso>
```

### Estructura completa — Ejemplo 3: Solicitud de urgencia

```xml
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0">
  <communication name="urgencia-presidente-2026-012">

    <meta>
      <identification source="#presidencia">
        <FRBRWork>
          <FRBRthis value="/akn/cl/communication/presidente/urgencia/2026-012"/>
          <FRBRuri value="/akn/cl/communication/presidente/urgencia/2026-012"/>
          <FRBRdate date="2026-02-01" name="request"/>
          <FRBRauthor href="#presidente"/>
          <FRBRcountry value="cl"/>
        </FRBRWork>
        <FRBRExpression>
          <FRBRthis value="/akn/cl/communication/presidente/urgencia/2026-012/esp@2026-02-01"/>
          <FRBRuri value="/akn/cl/communication/presidente/urgencia/2026-012/esp@2026-02-01"/>
          <FRBRdate date="2026-02-01" name="request"/>
          <FRBRlanguage language="esp"/>
        </FRBRExpression>
        <FRBRManifestation>
          <FRBRthis value="/akn/cl/communication/presidente/urgencia/2026-012/esp@2026-02-01/main.xml"/>
          <FRBRformat value="application/akn+xml"/>
        </FRBRManifestation>
      </identification>

      <references source="#presidencia">
        <TLCPerson eId="presidente" href="/persona/cl/presidente-republica"
                   showAs="Presidente de la Republica"/>
        <TLCOrganization eId="senado" href="/org/cl/senado"
                         showAs="Senado de la Republica"/>
        <TLCConcept eId="suma-urgencia" href="/ontology/urgency/extreme"
                    showAs="Suma Urgencia"/>
      </references>
    </meta>

    <preface>
      <p class="title">Oficio de Urgencia N. 012/2026</p>
    </preface>

    <communicationBody>

      <transmission eId="trans_1"
                    from="#presidente"
                    to="#senado"
                    type="urgency-request"
                    signedBy="#presidente"
                    date="2026-02-01"
                    refersTo="/akn/cl/bill/16245-07"
                    urgency="#suma-urgencia"
                    stage="second-reading"/>

      <content eId="content_1">
        <p>Hago presente la urgencia, calificandola de suma,
           para el despacho del proyecto de ley que moderniza
           el sistema tributario (Boletin N. 16.245-07),
           en el tramite indicado.</p>
      </content>

    </communicationBody>

  </communication>
</akomaNtoso>
```

### Detalle de cada elemento

#### `<communication>` (raiz)

Elemento raiz. Atributo `name` como identificador legible.

#### `<communicationBody>`

Contenedor del cuerpo:

| Tipo | Body |
|------|------|
| `act` | `<body>` |
| `debate` | `<debateBody>` |
| `citation` | `<citationBody>` |
| `question` | `<questionBody>` |
| **`communication`** | **`<communicationBody>`** |

#### `<transmission>`

La metadata direccional que hace unico a este tipo. Es el equivalente de `<session>` en `citation` y `<questionStatus>` en `question`:

| Atributo | Tipo | Pregunta que responde |
|----------|------|----------------------|
| `eId` | string | Referencia interna |
| `from` | ref (#eId) | "¿Quien envia?" |
| `to` | ref (#eId) | "¿A quien?" |
| `type` | enum | "¿Que tipo de comunicacion?" |
| `signedBy` | ref (#eId) | "¿Quien firma?" |
| `cosignedBy` | ref (#eId) | "¿Quien copatrocina?" (para mensajes con ministro) |
| `date` | date | "¿Cuando se envio?" |
| `refersTo` | URI | "¿Sobre que documento?" |
| `stage` | enum | "¿En que tramite?" |
| `urgency` | ref (#eId) | "¿Que tipo de urgencia?" (solo para urgency-request) |

Valores de `type`:

| Valor | Descripcion | Direccion tipica |
|-------|-------------|-----------------|
| `bill-submission` | Presentacion de proyecto de ley | Ejecutivo → Legislativo |
| `bill-transmission` | Transmision de proyecto aprobado | Camara → Camara |
| `bill-return` | Devolucion con enmiendas | Camara → Camara |
| `bill-rejection` | Rechazo de enmiendas | Camara → Camara |
| `mixed-committee-report` | Informe de comision mixta | Com. Mixta → ambas Camaras |
| `urgency-request` | Solicitud de urgencia | Ejecutivo → Legislativo |
| `urgency-withdrawal` | Retiro de urgencia | Ejecutivo → Legislativo |
| `veto` | Veto / observaciones del Presidente | Ejecutivo → Legislativo |
| `override` | Insistencia (rechazo de veto) | Legislativo → Ejecutivo |
| `approval-notification` | Notificacion de aprobacion | Legislativo → Ejecutivo |
| `constitutional-referral` | Envio a Tribunal Constitucional | Legislativo → Judicial |
| `constitutional-challenge` | Impugnacion de constitucionalidad | Legisladores → Judicial |
| `promulgation-request` | Solicitud de promulgacion | Legislativo → Ejecutivo |
| `general-message` | Comunicacion general | Cualquiera → Cualquiera |

Valores de `stage` (en que tramite constitucional esta el proyecto):

| Valor | Descripcion |
|-------|-------------|
| `first-reading` | Primer tramite constitucional |
| `second-reading` | Segundo tramite |
| `third-reading` | Tercer tramite |
| `conference` | Comision mixta |
| `promulgation` | Promulgacion |
| `constitutional-review` | Control de constitucionalidad |

#### `<content>`

El texto del oficio. Generalmente breve y formulaico para oficios entre camaras y urgencias. Puede contener `<p>` y `<ref>`.

#### `<rationale>`

La fundamentacion, usada principalmente en mensajes presidenciales y vetos. Contiene `<section>` con `<heading>` y `<p>`, siguiendo la misma estructura que un `<doc>` de AKN. Este es el elemento que justifica tener un tipo separado para mensajes presidenciales en vez de usar `doc`: la fundamentacion es extensa, sustantiva, y tiene una estructura reconocible (Antecedentes, Objetivos, Contenido, Impacto Fiscal).

---

## Parte 4: Convencion de URI

```
Work:          /akn/[pais]/communication/[emisor]/[numero-o-id]
Expression:    /akn/[pais]/communication/[emisor]/[numero-o-id]/[idioma]@[fecha]
Manifestation: /akn/[pais]/communication/[emisor]/[numero-o-id]/[idioma]@[fecha]/main.xml
```

Ejemplos:

```
/akn/cl/communication/senado/2026-234                    (oficio entre camaras)
/akn/cl/communication/presidente/2026-089                (mensaje presidencial)
/akn/cl/communication/presidente/urgencia/2026-012       (urgencia)
/akn/cl/communication/presidente/veto/2026-003           (veto)
/akn/cl/communication/camara/2026-19432                  (oficio de la Camara)
/akn/cl/communication/congreso/tc/2026-001               (requerimiento al TC)
/akn/es/communication/congreso/senado/2026-456           (comunicacion entre camaras España)
/akn/fr/communication/assemblee/senat/2026-789           (transmission Francia)
/akn/de/communication/bundesrat/bundestag/einspruch-2026 (objecion Bundesrat)
```

---

## Parte 5: Cross-linking

### Communication → Bill (el oficio transmite un proyecto)

El atributo `refersTo` en `<transmission>` apunta directamente al bill:

```xml
<transmission refersTo="/akn/cl/bill/16245-07" .../>
```

### Communication → Debate (el mensaje se lee en sesion)

Cuando un oficio se lee en una sesion plenaria, el debate lo referencia:

```xml
<!-- En el debate -->
<debateSection eId="dbsect_cuenta" name="reading-of-messages">
  <heading>Cuenta</heading>
  <narrative>
    <p>El señor Secretario da lectura al
       <ref href="/akn/cl/communication/senado/2026-234">
       Oficio N. 234/SEC/2026 del Senado</ref>.</p>
  </narrative>
</debateSection>
```

### Communication → Citation (el oficio se agendó)

Cuando la lectura de un oficio esta en la agenda:

```xml
<!-- En la citation -->
<agendaSection eId="agsect_cuenta" name="reading-of-messages">
  <heading>Cuenta</heading>
  <agendaItem eId="agitem_1">
    <heading>Oficio del Senado</heading>
    <ref href="/akn/cl/communication/senado/2026-234">Oficio N. 234</ref>
  </agendaItem>
</agendaSection>
```

### Communication → Communication (cadena de oficios)

Los oficios a menudo referencian oficios previos ("en respuesta a su oficio N. 19.432"):

```xml
<content>
  <p>Lo que comunico a Vuestra Excelencia en respuesta a su
     <ref href="/akn/cl/communication/camara/2026-19432">
     oficio N. 19.432</ref>, de fecha 15 de enero de 2026.</p>
</content>
```

Esto crea una **cadena de comunicaciones** que reconstruye el ping-pong entre camaras.

---

## Parte 6: Queries habilitadas

| Query | Como se resuelve |
|-------|-----------------|
| "Todas las urgencias vigentes" | `transmission@type = "urgency-request"` sin `urgency-withdrawal` posterior |
| "Proyectos enviados del Senado a la Camara este mes" | `transmission@from = "#senado" AND @to = "#camara" AND @date en rango` |
| "Vetos presidenciales de esta legislatura" | `transmission@type = "veto"` |
| "Historial de comunicaciones del Proyecto 16.245-07" | Todos los archivos donde `transmission@refersTo` contiene el URI del bill |
| "Cuanto tarda un proyecto entre camaras" | Calcular diferencia entre fechas de `bill-transmission` consecutivos |
| "Mensajes presidenciales con fundamentacion fiscal" | `communication` con `rationale` que contiene `sec_fiscal` |

---

## Parte 7: Sobre la caja de Pandora

### Por que este tipo no abre la caja

Este es el tercer y ultimo tipo nuevo propuesto. La investigacion demostro que, de las decenas de categorias de documentos parlamentarios analizadas, solo tres justifican tipos nuevos:

1. **Citation**: Gap operacional/de agenda. Urgencia alta.
2. **Question**: Gap de fiscalizacion/transparencia. Urgencia media-alta.
3. **Communication**: Gap de trazabilidad/conectividad. Urgencia media-baja.

Todo lo demas encaja en tipos AKN existentes:

| Categoria | Tipo AKN existente |
|-----------|-------------------|
| Mociones sustantivas | `doc` con subtipo |
| Informes de impacto fiscal | `doc` como anexo |
| Actas de comision | `debate` resumido o `doc` |
| Peticiones | `doc` |
| Informes de auditoria | `doc` |
| Declaraciones/resoluciones | `statement` |
| Legislacion delegada | `act` con subtipo |
| Textos consolidados | `act` (Expression FRBR) |
| Registros de votacion | `rollCall` dentro de `debate` |

### Por que este tipo SI se justifica (con reservas)

Las comunicaciones cumplen tres de los cuatro criterios:

1. **Universales**: Si — existen en todos los sistemas bicamerales y presidenciales
2. **Estructuralmente consistentes**: Si — siempre tienen emisor, receptor, accion, documento referenciado
3. **Faltan en AKN**: Si — ningun tipo captura la direccionalidad
4. **Importantes para el trabajo diario**: **Parcialmente** — son importantes para reconstruir la tramitacion, pero rara vez son el foco del trabajo cotidiano

Es por esto que esta propuesta viene con la advertencia explicita de que es la mas debil de las tres. Si Parlamento.ai decide implementar solo `citation` y `question`, las comunicaciones pueden vivir razonablemente en `doc` con buenas convenciones de metadata. Si decide implementar las tres, el beneficio es una reconstruccion completa del proceso legislativo como una cadena de documentos interlinkeados, desde el mensaje presidencial hasta la promulgacion.

### El scope completo

Con los tres tipos nuevos, el total de tipos AKN Diff seria:

| # | Tipo | Origen | Proposito |
|---|------|--------|-----------|
| 1-12 | act, bill, debate, amendment, judgment, doc, documentCollection, officialGazette, debateReport, statement, amendmentList, portion | AKN original | Documentos legislativos archivados |
| 13 | citation | AKN Diff | Agendas / convocatorias |
| 14 | question | AKN Diff | Preguntas escritas / interpelaciones |
| 15 | communication | AKN Diff | Oficios / mensajes inter-institucionales |

Mas las extensiones dentro de tipos existentes:
- `changeSet` (dentro de amendment/bill): Comparados legislativos computables
- `akndiff:vote` (dentro de changeSet): Resultados de votaciones

Esto cubre todo el ciclo legislativo, desde la planificacion (citation) hasta el resultado (act), pasando por la fiscalizacion (question) y la conectividad (communication).

---

## Referencias

### Sistemas de comunicaciones parlamentarias
- [Chile — Tramitacion Senado](https://tramitacion.senado.cl/)
- [Chile — BCN Formacion Civica](https://www.bcn.cl/formacioncivica/)
- [Spain — Boletin Oficial de las Cortes Generales](https://www.congreso.es/es/publicaciones/boletines)
- [France — Dossiers legislatifs](https://www.assemblee-nationale.fr/dyn/documents-parlementaires)
- [Germany — Bundestag Drucksachen](https://www.bundestag.de/dokumente/drucksachen)
- [UK — Parliamentary Messages (Erskine May)](https://erskinemay.parliament.uk/)
- [US — Congressional Record](https://www.govinfo.gov/app/collection/crec)
- [Argentina — Tramite Parlamentario](https://www.congreso.gob.ar/)
- [EU — Legislative Observatory](https://oeil.secure.europarl.europa.eu/oeil/home/home.do)

### Estandares
- [Akoma Ntoso v1.0 — XML Vocabulary (OASIS)](https://docs.oasis-open.org/legaldocml/akn-core/v1.0/akn-core-v1.0-part1-vocabulary.html)

### Investigacion previa
- [Citation Type Proposal](../2026-02-03/citation-type-proposal.md)
- [Question Type Proposal](./question-type-proposal.md)
