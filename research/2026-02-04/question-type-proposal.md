# AKN Question: A New Document Type for Parliamentary Questions and Interpellations

**Fecha**: 04/02/2026
**Autor**: Parlamento.ai
**Estado**: Propuesta (borrador)

---

## Contexto

Este documento es parte de una investigacion mas amplia sobre los gaps del formato Akoma Ntoso (AKN) cuando se intenta usar como formato universal para el trabajo parlamentario. El primer gap identificado fue la **citacion** (agenda/order paper), para el cual ya diseñamos un tipo nuevo documentado en `research/2026-02-03/citation-type-proposal.md`.

Al diseñar el tipo `citation`, nos preguntamos si estabamos abriendo la caja de Pandora — si al crear un tipo nuevo, ibamos a descubrir que necesitabamos diez mas. Para responder esto, lanzamos cinco investigaciones paralelas cubriendo documentos procedimentales, comites, comunicaciones inter-institucionales, transparencia/fiscalizacion, y procedimientos presupuestarios, analizando parlamentos de Chile, España, Francia, Alemania, Reino Unido, Estados Unidos, Argentina, Mexico, Brasil y la Union Europea.

El resultado fue que **no es la caja de Pandora**, pero tampoco es una sola caja. Identificamos tres gaps reales. La citacion era el primero. Este documento aborda el segundo: **las preguntas parlamentarias escritas y las interpelaciones**.

---

## Parte 1: Por que las preguntas escritas son un gap

### Que son

Una pregunta parlamentaria escrita es un documento formal en el que un legislador pide informacion o explicaciones a un ministro o al gobierno, por escrito, fuera de cualquier sesion plenaria. El ministro esta obligado a responder dentro de un plazo legal.

Esto NO es una pregunta oral hecha durante un debate (esas ya estan cubiertas por el elemento `<questions>` dentro de `<debate>` en AKN). Es un documento autonomo con su propio ciclo de vida:

```
Legislador redacta la pregunta
    → Mesa califica y publica
    → Se envia al ministerio correspondiente
    → El ministerio asigna internamente
    → El ministerio responde por escrito
    → La respuesta se publica
    → (Opcionalmente) se corrige si la respuesta fue erronea
```

La pregunta y su respuesta nunca aparecen en una transcripcion de debate. Existen como documentos independientes.

### Las interpelaciones

Las interpelaciones son la version politicamente mas pesada de las preguntas. Son una demanda formal de explicacion al gobierno que puede desencadenar un debate plenario e incluso un voto de confianza.

En Chile, las interpelaciones requieren la aprobacion de un tercio de los diputados. En Alemania existen cuatro variantes: Grosse Anfrage (interpelacion mayor, desencadena debate), Kleine Anfrage (interpelacion menor, respuesta escrita en 14 dias), Schriftliche Fragen (preguntas escritas), y Mundliche Fragen (preguntas orales).

Estructuralmente, las interpelaciones siguen el mismo patron que las preguntas escritas: pregunta → respuesta, con actores especificos, plazos y estados. La diferencia es la gravedad politica y las consecuencias procedimentales.

### El volumen es enorme

Este no es un tipo de documento marginal. Es uno de los mas voluminosos que produce cualquier parlamento:

| Pais | Volumen | Fuente |
|------|---------|--------|
| Francia | 20.066 preguntas escritas en 2015 (vs 3.700 en 1959) | Journal Officiel |
| España | ~90 preguntas escritas por dia (desde dic 2019) | Congreso de los Diputados |
| Reino Unido | Miles por sesion, con API dedicada | questions-statements-api.parliament.uk |
| Alemania | Publicadas como Drucksachen con IDs unicos | DIP API (search.dip.bundestag.de) |
| Chile | Interpelaciones publicadas como documentos autonomos | camara.cl/fiscalizacion |
| Union Europea | Miles por termino parlamentario | europarl.europa.eu |

### Por que AKN no las cubre

AKN tiene un elemento `<questions>` pero vive **dentro de `<debate>`** como una subseccion del debate. Es para preguntas orales hechas durante una sesion ("Question Time" en el parlamento britanico). Las preguntas escritas nunca tocan una transcripcion de debate — tienen su propio ciclo de vida completamente independiente.

La unica alternativa en AKN es el tipo `doc` — el tipo generico para todo lo que no encaja. Pero `doc` tiene el mismo problema que tenia con las citaciones: si tienes 20.000 archivos `doc` por año, no puedes hacer queries como "muestrame todas las preguntas sin responder al Ministerio de Hacienda esta semana". No hay campo para el cuerpo que responde, no hay campo para el estado (respondida/sin responder), no hay campo para el plazo.

### Es universal

Cada parlamento investigado tiene preguntas escritas como una categoria de documento distinta:

| Pais | Nombre | Particularidades |
|------|--------|-----------------|
| Chile | Pregunta escrita / Interpelacion | Interpelacion requiere 1/3 de diputados |
| España | Pregunta escrita / Interpelacion | ~42 dias promedio de respuesta, sistema "Cortesia" |
| Francia | Question ecrite | Si no se responde en 2 meses, se convierte en oral (Art. 135) |
| Alemania | Kleine Anfrage / Grosse Anfrage / Schriftliche Fragen | 14 dias para responder Kleine Anfrage |
| Reino Unido | Written Question | API dedicada, sistema UIN (Unique Identification Number) |
| Estados Unidos | No tiene equivalente formal | Las preguntas se hacen via cartas de comites |
| Argentina | Pedido de informes | Plazo de respuesta |
| Union Europea | Written Question | Publicadas con numeros de referencia |

Nota: Estados Unidos es la excepcion — no tiene un sistema formal de preguntas escritas al ejecutivo. La fiscalizacion se hace via audiencias de comites (hearings) y cartas de oversight. Esto no invalida el tipo: 11 de 12 parlamentos investigados lo tienen.

---

## Parte 2: Diseño del tipo `question`

### Principios de diseño

1. **Consistencia con AKN**: Mismas convenciones FRBR, mismas referencias TLC, mismos patrones de eId.
2. **Auto-descriptivo**: Un archivo `question` contiene toda la informacion para ser filtrado y consultado sin contexto externo.
3. **Ciclo de vida explicito**: El estado del documento (sin responder, respondida, corregida) es un campo computable, no texto libre.
4. **Par pregunta-respuesta**: El formato modela ambos lados en un solo documento, porque la respuesta es inseparable de la pregunta (no tiene sentido la respuesta sin la pregunta).
5. **Linked**: Cada pregunta referencia al legislador que pregunta, al cuerpo que responde, y opcionalmente a la legislacion o tema relacionado.

### Elementos nuevos

| Elemento | Proposito |
|----------|-----------|
| `<question>` | Tipo raiz del documento (como `<debate>`, `<act>`, `<bill>`) |
| `<questionBody>` | Contenedor del cuerpo (como `<debateBody>`, `<judgmentBody>`) |
| `<questionContent>` | El texto de la pregunta |
| `<answerContent>` | El texto de la respuesta (cuando existe) |
| `<questionStatus>` | Metadata del ciclo de vida |

### Estructura completa

```xml
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0">
  <question name="pregunta-16523">

    <!-- ============================================================ -->
    <!-- METADATA (identica estructura FRBR que todos los tipos AKN)  -->
    <!-- ============================================================ -->
    <meta>
      <identification source="#secretaria">

        <!-- Work: la pregunta como concepto abstracto -->
        <FRBRWork>
          <FRBRthis value="/akn/cl/question/camara/16523"/>
          <FRBRuri value="/akn/cl/question/camara/16523"/>
          <FRBRdate date="2026-01-15" name="tabling"/>
          <FRBRauthor href="#diputado-perez"/>
          <FRBRcountry value="cl"/>
        </FRBRWork>

        <!-- Expression: esta version (puede haber correcciones) -->
        <FRBRExpression>
          <FRBRthis value="/akn/cl/question/camara/16523/esp@2026-01-15"/>
          <FRBRuri value="/akn/cl/question/camara/16523/esp@2026-01-15"/>
          <FRBRdate date="2026-01-15" name="tabling"/>
          <FRBRlanguage language="esp"/>
        </FRBRExpression>

        <!-- Manifestation: el archivo fisico -->
        <FRBRManifestation>
          <FRBRthis value="/akn/cl/question/camara/16523/esp@2026-01-15/main.xml"/>
          <FRBRformat value="application/akn+xml"/>
        </FRBRManifestation>

      </identification>

      <!-- Ciclo de vida del documento -->
      <lifecycle source="#secretaria">
        <eventRef eId="evt_1" date="2026-01-15" type="generation"
                  source="#diputado-perez" refersTo="#tabling"/>
        <eventRef eId="evt_2" date="2026-01-16" type="amendment"
                  source="#mesa" refersTo="#publication"/>
        <eventRef eId="evt_3" date="2026-02-10" type="amendment"
                  source="#min-hacienda" refersTo="#answer"/>
      </lifecycle>

      <!-- Referencias a entidades -->
      <references source="#secretaria">
        <!-- Quien pregunta -->
        <TLCPerson eId="diputado-perez" href="/persona/cl/diputado/perez-garcia-juan"
                   showAs="Juan Perez Garcia"/>
        <!-- A que cuerpo se dirige -->
        <TLCOrganization eId="min-hacienda" href="/org/cl/gobierno/ministerio/hacienda"
                         showAs="Ministerio de Hacienda"/>
        <!-- Camara de origen -->
        <TLCOrganization eId="camara" href="/org/cl/camara"
                         showAs="Camara de Diputadas y Diputados"/>
        <!-- Mesa -->
        <TLCOrganization eId="mesa" href="/org/cl/camara/mesa"
                         showAs="Mesa de la Camara"/>
        <!-- Secretaria -->
        <TLCPerson eId="secretaria" href="/persona/cl/secretaria-camara"
                   showAs="Secretaria de la Camara"/>
        <!-- Quien responde (persona especifica, si se conoce) -->
        <TLCPerson eId="ministro-marcel" href="/persona/cl/ministro/marcel-mario"
                   showAs="Mario Marcel, Ministro de Hacienda"/>
        <!-- Conceptos del ciclo de vida -->
        <TLCEvent eId="tabling" href="/ontology/lifecycle/tabling"
                  showAs="Presentacion"/>
        <TLCEvent eId="publication" href="/ontology/lifecycle/publication"
                  showAs="Publicacion"/>
        <TLCEvent eId="answer" href="/ontology/lifecycle/answer"
                  showAs="Respuesta"/>
      </references>
    </meta>


    <!-- ============================================================ -->
    <!-- PREFACE                                                      -->
    <!-- ============================================================ -->
    <preface>
      <p class="title">Pregunta Escrita N. 16.523</p>
      <p class="subtitle">De Diputado Perez al Ministerio de Hacienda</p>
    </preface>


    <!-- ============================================================ -->
    <!-- QUESTION BODY                                                -->
    <!-- ============================================================ -->
    <questionBody>

      <!--
        STATUS: metadata del ciclo de vida.
        Hace queryable al documento: "todas las preguntas sin responder"
      -->
      <questionStatus eId="qstatus_1"
                      status="answered"
                      askedBy="#diputado-perez"
                      addressedTo="#min-hacienda"
                      dateTabled="2026-01-15"
                      datePublished="2026-01-16"
                      deadline="2026-02-14"
                      dateAnswered="2026-02-10"
                      answeredBy="#ministro-marcel"
                      type="written"/>

      <!--
        QUESTION CONTENT: el texto de la pregunta.
        Puede contener multiples preguntas numeradas.
      -->
      <questionContent eId="qcontent_1">
        <heading>Sobre la ejecucion presupuestaria del programa
                 de subsidios habitacionales</heading>

        <p>Señor Ministro, en virtud de lo dispuesto en el articulo 9
           de la Ley Organica Constitucional del Congreso Nacional,
           vengo en formular las siguientes preguntas:</p>

        <question eId="q_1" number="1">
          <p>¿Cual es el monto total ejecutado del presupuesto asignado
             al programa de subsidios habitacionales durante los años
             2024 y 2025, desglosado por region?</p>
        </question>

        <question eId="q_2" number="2">
          <p>¿Cuantos beneficiarios han recibido subsidios en cada region
             durante el mismo periodo?</p>
        </question>

        <question eId="q_3" number="3">
          <p>¿Existen recursos no ejecutados? En caso afirmativo,
             ¿cual es la razon de la subejecucion?</p>
        </question>

        <!-- Referencia opcional a legislacion relacionada -->
        <p>Lo anterior en relacion con la
           <ref href="/akn/cl/act/ley-21523">Ley 21.523</ref>
           sobre politica habitacional.</p>
      </questionContent>

      <!--
        ANSWER CONTENT: la respuesta del ministerio.
        Solo existe cuando status="answered".
        Si status="unanswered", este bloque no aparece.
      -->
      <answerContent eId="acontent_1">
        <heading>Respuesta del Ministerio de Hacienda</heading>
        <p>Ord. N. 2.847 de 10 de febrero de 2026</p>

        <answer eId="a_1" refersTo="#q_1">
          <p>Respecto a la primera consulta, el monto total ejecutado
             del programa de subsidios habitacionales fue el siguiente:</p>
          <p>Año 2024: $523.400 millones (87,2% del presupuesto asignado)</p>
          <p>Año 2025: $612.100 millones (91,5% del presupuesto asignado)</p>
          <p>El desglose regional se adjunta en Anexo 1.</p>
        </answer>

        <answer eId="a_2" refersTo="#q_2">
          <p>Durante 2024, un total de 45.230 familias recibieron subsidios.
             Durante 2025, fueron 52.180 familias. El desglose regional
             se incluye en Anexo 1.</p>
        </answer>

        <answer eId="a_3" refersTo="#q_3">
          <p>Efectivamente, durante 2024 se registro una subejecucion
             del 12,8%, atribuible principalmente a retrasos en la
             aprobacion de proyectos en las regiones de Atacama y
             Aysen. Se han adoptado medidas correctivas detalladas
             en Anexo 2.</p>
        </answer>
      </answerContent>

    </questionBody>

  </question>
</akomaNtoso>
```

### Detalle de cada elemento

#### `<question>` (raiz)

El elemento raiz del documento, al mismo nivel que `<act>`, `<bill>`, `<debate>`, `<citation>`. Atributo `name` como identificador legible.

#### `<questionBody>`

El contenedor del cuerpo. Sigue la convencion AKN:

| Tipo | Body |
|------|------|
| `act` | `<body>` |
| `debate` | `<debateBody>` |
| `judgment` | `<judgmentBody>` |
| `citation` | `<citationBody>` |
| **`question`** | **`<questionBody>`** |

#### `<questionStatus>`

La metadata del ciclo de vida que hace el documento queryable. Cada atributo responde a una pregunta concreta:

| Atributo | Tipo | Pregunta que responde |
|----------|------|----------------------|
| `status` | enum | "¿Esta respondida?" |
| `askedBy` | ref (#eId) | "¿Quien pregunto?" |
| `addressedTo` | ref (#eId) | "¿A que ministerio?" |
| `dateTabled` | date | "¿Cuando se presento?" |
| `datePublished` | date | "¿Cuando se publico?" |
| `deadline` | date | "¿Cuando vence el plazo?" |
| `dateAnswered` | date | "¿Cuando respondieron?" |
| `answeredBy` | ref (#eId) | "¿Quien firmo la respuesta?" |
| `type` | enum | "¿Escrita u oral convertida?" |

Valores de `status`:

| Valor | Significado |
|-------|-------------|
| `tabled` | Presentada pero no publicada aun |
| `published` | Publicada, en espera de respuesta |
| `unanswered` | Plazo vencido sin respuesta |
| `answered` | Respondida dentro de plazo |
| `answered-late` | Respondida fuera de plazo |
| `corrected` | Respuesta corregida |
| `withdrawn` | Retirada por el autor |
| `converted` | Convertida a pregunta oral (Art. 135 Francia) |

Valores de `type`:

| Valor | Descripcion |
|-------|-------------|
| `written` | Pregunta escrita (el caso mas comun) |
| `interpellation` | Interpelacion formal |
| `major-interpellation` | Grosse Anfrage (Alemania) — desencadena debate |
| `minor-interpellation` | Kleine Anfrage (Alemania) — respuesta escrita |
| `information-request` | Pedido de informes (Argentina) |

#### `<questionContent>`

El texto de la pregunta. Contiene:

- `<heading>`: Titulo/tema de la pregunta
- `<p>`: Parrafos introductorios o de contexto
- `<question>`: Cada pregunta individual numerada (porque un documento puede contener multiples preguntas)
- `<ref>`: Referencias a legislacion relacionada

El atributo `number` en `<question>` permite la correspondencia pregunta-respuesta via `refersTo`.

#### `<answerContent>`

La respuesta del ministerio/gobierno. Solo aparece cuando `status` es `answered`, `answered-late`, o `corrected`. Contiene:

- `<heading>`: Identificacion de la respuesta (ordinario/numero)
- `<p>`: Texto introductorio
- `<answer>`: Cada respuesta individual, con `refersTo` apuntando al `<question>` correspondiente

El atributo `refersTo` en `<answer>` crea un link explicito entre cada respuesta y su pregunta, permitiendo renderizado lado a lado.

### Convencion de eId

| Elemento | Patron eId | Ejemplos |
|----------|-----------|----------|
| `questionStatus` | `qstatus_[numero]` | `qstatus_1` |
| `questionContent` | `qcontent_[numero]` | `qcontent_1` |
| `answerContent` | `acontent_[numero]` | `acontent_1` |
| `question` (individual) | `q_[numero]` | `q_1`, `q_2` |
| `answer` (individual) | `a_[numero]` | `a_1`, `a_2` |

### Convencion de URI

```
Work:          /akn/[pais]/question/[camara]/[numero]
Expression:    /akn/[pais]/question/[camara]/[numero]/[idioma]@[fecha]
Manifestation: /akn/[pais]/question/[camara]/[numero]/[idioma]@[fecha]/main.xml
```

Ejemplos:

```
/akn/cl/question/camara/16523
/akn/cl/question/senado/8901
/akn/es/question/congreso/184-032456
/akn/de/question/bundestag/20-4523          (Kleine Anfrage)
/akn/fr/question/assemblee/17-12345         (Question ecrite)
/akn/gb/question/commons/2026-01-15.234     (Written Question, UIN)
```

Para interpelaciones, el `type` en `<questionStatus>` las distingue. La URI sigue el mismo patron:

```
/akn/cl/question/camara/interpelacion-2026-01
/akn/de/question/bundestag/grosse-anfrage-20-89
```

---

## Parte 3: Cross-linking con otros tipos AKN

### Question → Bill/Act (la pregunta referencia legislacion)

```xml
<!-- Dentro de questionContent -->
<p>En relacion con la <ref href="/akn/cl/act/ley-21523">Ley 21.523</ref>
   sobre politica habitacional...</p>
```

### Question → Debate (la interpelacion desencadena un debate)

Cuando una interpelacion lleva a un debate plenario:

```xml
<!-- En la question -->
<questionStatus type="major-interpellation"
                debate="/akn/cl/debate/camara/2026-02-20"/>

<!-- En el debate -->
<meta>
  <references>
    <TLCEvent eId="interpelacion" href="/akn/cl/question/camara/interpelacion-2026-01"
              showAs="Interpelacion al Ministro de Hacienda"/>
  </references>
</meta>
```

### Question → Citation (la pregunta aparece en la agenda)

Si una interpelacion esta agendada en una sesion:

```xml
<!-- En la citation -->
<agendaItem eId="agitem_5" status="pending">
  <heading>Interpelacion al Ministro de Hacienda</heading>
  <ref href="/akn/cl/question/camara/interpelacion-2026-01">
    Interpelacion N. 2026-01</ref>
  <step type="interpellation"/>
</agendaItem>
```

---

## Parte 4: Queries habilitadas por el tipo

Con una carpeta de archivos `question`, estas queries se vuelven triviales:

| Query | Como se resuelve |
|-------|-----------------|
| "Todas las preguntas sin responder" | Filtrar `questionStatus@status = "unanswered" OR "published"` |
| "Preguntas al Ministerio de Hacienda" | Filtrar `questionStatus@addressedTo = "#min-hacienda"` |
| "Preguntas con plazo vencido" | `questionStatus@deadline < hoy AND status != "answered"` |
| "Preguntas del Diputado Perez" | Filtrar `questionStatus@askedBy = "#diputado-perez"` |
| "Interpelaciones de este año" | Filtrar `questionStatus@type = "interpellation"` |
| "Tiempo promedio de respuesta" | Calcular `dateAnswered - dateTabled` para todos |
| "Ministerios que mas tardan" | Agrupar por `addressedTo`, promediar tiempo de respuesta |
| "Preguntas sobre la Ley 21.523" | Buscar `ref@href` conteniendo `/akn/cl/act/ley-21523` |

Ninguna de estas queries es posible con el tipo `doc`.

---

## Parte 5: Variaciones por pais

El formato esta diseñado para acomodar las variaciones sin forzar un modelo unico:

### Francia — Conversion automatica a oral

En Francia, si una pregunta escrita no se responde en 2 meses, se convierte automaticamente en pregunta oral (Art. 135). El `status="converted"` captura esto. El `<lifecycle>` registra el evento de conversion.

### Alemania — Cuatro tipos en uno

Los cuatro tipos de preguntas alemanas (Grosse Anfrage, Kleine Anfrage, Schriftliche Fragen, Mundliche Fragen) se diferencian por el atributo `type` en `<questionStatus>`. La Grosse Anfrage que desencadena debate se linkea al debate resultante via el atributo `debate`.

### España — Preguntas con debate

En España, las preguntas orales en pleno y en comision son variantes que se discuten durante sesiones. Estas siguen siendo `<questions>` dentro de `<debate>`. Solo las preguntas escritas (que no pasan por sesion) usan el tipo `question`.

### Reino Unido — Named Day Questions

El sistema britanico distingue entre "ordinary written questions" (respuesta en plazo razonable) y "named day questions" (el diputado especifica la fecha de respuesta). El atributo `deadline` en `<questionStatus>` captura ambos casos.

### Chile — Interpelaciones con quorum

Las interpelaciones chilenas requieren aprobacion de un tercio de los diputados. Esto se puede representar con metadata adicional en el `<lifecycle>`:

```xml
<eventRef eId="evt_approval" date="2026-01-20" type="generation"
          source="#camara" refersTo="#interpellation-approval"/>
```

---

## Parte 6: Nota sobre compatibilidad con AKN

Al igual que el tipo `citation`, el tipo `question` **rompe el estandar oficial de Akoma Ntoso**. AKN v1.0 no define un tipo de documento para preguntas parlamentarias escritas. El elemento `<questions>` que existe en AKN es una subseccion dentro de `<debate>`, diseñada para preguntas orales durante sesiones.

La justificacion para este quiebre es la misma que para `citation`: el tipo `doc` no permite queries automaticas sobre el contenido, y las preguntas escritas son un tipo de documento lo suficientemente importante (por volumen, universalidad, y unicidad estructural) como para merecer reconocimiento semantico propio.

Este tipo fue diseñado como parte de la extension AKN Diff de Parlamento.ai, que tambien incluye `changeSet` (para comparados legislativos), `akndiff:vote` (para resultados de votaciones), y `citation` (para agendas parlamentarias).

---

## Parte 7: Sobre la caja de Pandora

### Por que este tipo no abre la caja

La preocupacion legitima es: si creamos `citation` y ahora `question`, ¿que viene despues? ¿Estamos en una pendiente resbaladiza?

La investigacion de cinco busquedas paralelas demostro que no. De todas las categorias de documentos investigadas, solo tres justifican tipos nuevos (citation, question, y communication — documentado aparte). El resto encaja en tipos existentes:

- Mociones sustantivas (EDMs, Antrage): encajan en `doc` con subtipo
- Informes de impacto fiscal: encajan en `doc` como anexo al bill
- Actas de comision: encajan en `debate` resumido o `doc`
- Peticiones: encajan en `doc`
- Informes de auditoria: encajan en `doc`
- Declaraciones/resoluciones: AKN ya tiene `statement`
- Legislacion delegada: encaja en `act`
- Textos consolidados: son una Expression FRBR del `act` original

### Por que este tipo SI se justifica

Las preguntas escritas cumplen los cuatro criterios que establecimos:

1. **Universales**: Existen en todos los parlamentos investigados excepto EEUU
2. **Estructuralmente unicas**: Son un par pregunta-respuesta con ciclo de vida, no una narrativa ni una norma
3. **Faltan en AKN**: El `<questions>` de AKN es para preguntas orales en debate, no para preguntas escritas autonomas
4. **Importantes para el trabajo diario**: El volumen (20.000+/año en Francia, 90/dia en España) las hace imposibles de ignorar

Ademas, son el tipo de documento con mayor potencial de transparencia: permiten medir cuanto tarda cada ministerio en responder, que temas generan mas preguntas, y que legisladores son mas activos en fiscalizacion.

---

## Referencias

### Sistemas de preguntas parlamentarias
- [UK Written Questions API](https://questions-statements-api.parliament.uk/index.html)
- [UK Parliament — Written Questions](https://www.parliament.uk/about/how/business/written-questions/)
- [Spain — El Diario investigacion sobre preguntas parlamentarias](https://www.eldiario.es/politica/cara-oculta-preguntas-parlamentarias-tramite-ocasiones-acaba-limbo_1_10153880.html)
- [France — Assemblee nationale, preguntas escritas](https://questions.assemblee-nationale.fr/)
- [Germany — Bundestag instruments of scrutiny](https://www.bundestag.de/en/parliament/function/scrutiny/instruments_scrutiny-245710)
- [Germany — DIP API](https://search.dip.bundestag.de/api/v1/)
- [Chile — Interpelaciones Camara de Diputados](https://www.camara.cl/fiscalizacion/interpelaciones/interpelaciones.aspx)
- [EU Parliament — Parliamentary Questions](https://www.europarl.europa.eu/plenary/en/parliamentary-questions.html)

### Estandares
- [Akoma Ntoso v1.0 — XML Vocabulary (OASIS)](https://docs.oasis-open.org/legaldocml/akn-core/v1.0/akn-core-v1.0-part1-vocabulary.html)

### Investigacion previa
- [Citation Type Proposal](../2026-02-03/citation-type-proposal.md)
