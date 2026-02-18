# Diff by Parlamento.ai

Proyecto de investigación que explora cómo representar el **rito parlamentario completo** usando [Akoma Ntoso](http://www.akomantoso.org/) como base.

Partimos de un problema concreto: no existe una herramienta pública para ver qué cambió cuando se modifica una ley. Para resolverlo, propusimos `AKN Diff`, una extensión que agrega un `changeSet` computable al estándar AKN. Pero la investigación nos llevó más lejos: a explorar si AKN puede ser la base de datos de un parlamento entero, a diseñar los tipos de documentos que le faltan al estándar, y a prototipar un portal legislativo 100 % basado en estas primitivas.


## Changelog

---
**18/02/2026**

Aplicamos AKN Diff a legislación real por primera vez: la **Ley 21.735 — Reforma de Pensiones** (Boletín 15.480-13), probablemente la ley más compleja tramitada en Chile en la última década. 350 artículos en el mensaje original, 5 normas modificadas, votación nominal del Senado (40-7).

La reforma modifica explícitamente 13 normas existentes a través de sus artículos 67 a 79. Para cada una, descargamos la versión pre-reforma y post-reforma desde la API JSON de LeyChile (`nuevo.leychile.cl/servicios/Navegar/get_norma_json?idNorma=X&idVersion=YYYY-MM-DD`) y comparamos artículo por artículo:

```
  ┌──────────────────┬──────────────────────────────────────────┬───────────────────┐
  │ Art. Ley 21.735  │ Norma modificada                         │ Cambios detectados│
  ├──────────────────┼──────────────────────────────────────────┼───────────────────┤
  │ Art. 67          │ DL 3.500 (Sistema de Pensiones)           │ 18 artículos      │
  │ Art. 68          │ Ley 17.322 (Cobranza judicial)            │ 0 — no detectados │
  │ Art. 69          │ Ley 21.419                                │ 0 — no detectados │
  │ Art. 70          │ Ley 20.255                                │ 0 — no detectados │
  │ Art. 71          │ Ley 19.728 (Seguro de cesantía)           │ 0 — no detectados │
  │ Art. 72          │ DFL 5/2003 (Cooperativas)                 │ 2 artículos       │
  │ Art. 73          │ Ley 18.045 (Mercado de Valores)           │ 1 artículo        │
  │ Art. 74          │ DFL 28/1981 (Superintendencia AFP)        │ 2 artículos       │
  │ Art. 75          │ Ley 20.880 (Probidad pública)             │ 1 artículo        │
  │ Art. 76          │ Ley 20.712                                │ 0 — no detectados │
  │ Art. 77          │ Ley 18.833                                │ 0 — no detectados │
  │ Art. 78-79       │ Otras normas                              │ No descargadas    │
  └──────────────────┴──────────────────────────────────────────┴───────────────────┘
```

Solo 5 de las 11 normas descargadas mostraron diferencias de texto detectables entre la versión pre y post reforma. Para las otras 6, LeyChile posiblemente aún no había registrado la versión post-reforma al momento de la extracción, o los cambios eran de referencia cruzada sin impacto textual.

Para cada una de las 5 normas con cambios, generamos un timeline AKN completo de 7 documentos (ley original → mensaje → 1er trámite → 2do trámite → 3er trámite → TC → ley promulgada), con changeSets computados y votaciones nominales embebidas.

Adicionalmente, construimos un timeline del **boletín completo** (el proyecto de ley en sí), que muestra cómo el texto del proyecto evolucionó entre etapas:
- **Mensaje Presidencial** (2022): 423 artículos — proponía reemplazar el DL 3.500 por completo
- **1er Trámite** (Cámara, 2024): 151 artículos — la Cámara reestructuró todo el proyecto como modificaciones a leyes existentes
- **2do Trámite** (Senado, 2025): 129 artículos — el Senado refinó y redujo
- **Ley Promulgada** (2025): 129 artículos — texto final publicado en el Diario Oficial

Los documentos fuente (oficios, informes de comisión, JSONs de LeyChile, votaciones XML) y los AKN generados están organizados en `research/2026-02-18/ley-21735/`:

```
  research/2026-02-18/ley-21735/
  ├── oficios/      ← Textos del proyecto (.txt/.doc/.docx)
  ├── informes/     ← Informes de comisión y certificados
  ├── json/         ← Datos LeyChile pre/post (22 JSONs)
  ├── diff/         ← Diffs computados (5 changes + summary)
  ├── votes/        ← Votaciones XML (senado + cámara)
  └── akn/          ← XMLs AKN generados (lo que consume la app)
      ├── boletin/  ← 6 XMLs: timeline del proyecto de ley
      ├── dl-3500/  ← 7 XMLs: timeline DL 3.500
      ├── dfl-5-2003/
      ├── ley-18045/
      ├── dfl-28/
      └── ley-20880/
```

### Mapa: documento fuente → XML generado

**Textos del proyecto** (timeline del boletín)

```
  ┌───┬────────────────────────────┬─────────────────────────────────────────┬──────────────────────────────┐
  │ # │ Documento                  │ Fuente                                  │ Genera →                     │
  ├───┼────────────────────────────┼─────────────────────────────────────────┼──────────────────────────────┤
  │ 1 │ Mensaje Presidencial       │ oficios/mensaje.txt                     │ akn/boletin/01-act-original  │
  │ 2 │ Certificado Cámara (1er T) │ informes/02-informe-trabajo-camara-cert │ akn/boletin/02-bill          │
  │ 3 │ Oficio 2do Trámite         │ oficios/2do-tramite-oficio.txt          │ akn/boletin/03-amendment-1   │
  │ 4 │ Ley 21.735 publicada       │ json/ley-21735-post.json                │ akn/boletin/06-act-final     │
  └───┴────────────────────────────┴─────────────────────────────────────────┴──────────────────────────────┘
```

**Votaciones** (usadas por ambos scripts de generación)

```
  ┌───┬──────────────────────────────┬───────────────────────────┐
  │ # │ Documento                    │ Fuente                    │
  ├───┼──────────────────────────────┼───────────────────────────┤
  │ 5 │ Votación Senado (40-7)       │ votes/senado-votes.xml    │
  │ 6 │ Votación Cámara (84-64-3)    │ votes/camara-votes.xml    │
  └───┴──────────────────────────────┴───────────────────────────┘
```

**Normas pre/post reforma** (timelines por norma modificada)

```
  ┌───────┬─────────────┬───────────────────────┬────────────────────────┬────────────────────┐
  │   #   │ Norma       │ Pre                   │ Post                   │ Genera →           │
  ├───────┼─────────────┼───────────────────────┼────────────────────────┼────────────────────┤
  │  7-8  │ DL 3.500    │ json/dl-3500-pre.json │ json/dl-3500-post.json │ akn/dl-3500/ (7)   │
  │  9-10 │ DFL 5/2003  │ json/dfl-5-2003-*.json│ (ídem)                 │ akn/dfl-5-2003/ (7)│
  │ 11-12 │ Ley 18.045  │ json/ley-18045-*.json │ (ídem)                 │ akn/ley-18045/ (7) │
  │ 13-14 │ DFL 28      │ json/dfl-28-*.json    │ (ídem)                 │ akn/dfl-28/ (7)    │
  │ 15-16 │ Ley 20.880  │ json/ley-20880-*.json │ (ídem)                 │ akn/ley-20880/ (7) │
  └───────┴─────────────┴───────────────────────┴────────────────────────┴────────────────────┘
```

**Documentos de referencia** (no generan XMLs, pero son parte del expediente legislativo)

```
  ┌──────────────────────────────────────────────────────┬───────────────────────────────────────────┐
  │ Archivo                                              │ Contenido                                 │
  ├──────────────────────────────────────────────────────┼───────────────────────────────────────────┤
  │ oficios/mensaje.docx                                 │ Binario original del mensaje              │
  │ oficios/1er-tramite-oficio.doc/.txt                  │ Oficio 1er trámite (no se usa, ver cert.) │
  │ oficios/2do-tramite-oficio.doc                       │ Binario original 2do trámite              │
  │ oficios/comparado-trabajo.doc/.txt                   │ Comparado tabular — no parseado           │
  │ oficios/comparado-hacienda.doc/.txt                  │ Comparado tabular — no parseado           │
  │ informes/01-mensaje-presidencial.pdf                 │ PDF del mensaje presidencial              │
  │ informes/03-informe-trabajo-camara.docx/.txt         │ Informe discursivo (1.4M chars)           │
  │ informes/04-informe-hacienda-camara.pdf              │ PDF informe Hacienda Cámara               │
  │ informes/05-informe-trabajo-senado.doc/.txt          │ Informe discursivo (1.6M chars)           │
  │ informes/06-informe-hacienda-senado.doc/.txt         │ Informe discursivo (1.1M chars)           │
  │ informes/07-comparado-trabajo-senado.doc/.txt        │ Comparado tabular — no parseado           │
  │ informes/08-comparado-hacienda-senado.doc/.txt       │ Comparado tabular — no parseado           │
  │ diff/*.json (5 archivos)                             │ Diffs intermedios, usados por generate-akn│
  │ json/ (12 archivos extra)                            │ Normas sin cambios detectados             │
  └──────────────────────────────────────────────────────┴───────────────────────────────────────────┘
```

Los 12 JSONs extra corresponden a normas que se descargaron pero no tenían cambios entre versiones: Ley 21.419, Ley 20.255, Ley 19.728, Ley 17.322, Ley 20.712 y Ley 18.833.

### Ley 18.045 — Ley de Mercado de Valores (1981-2025)

Como segundo caso de uso, aplicamos AKN Diff a la **historia completa de versiones** de una ley chilena. A diferencia de la Ley 21.735 (donde rastreamos un proyecto de ley a través de sus trámites), aquí rastreamos una ley vigente a través de sus **32 versiones históricas** en 44 años.

La API JSON de LeyChile soporta versionamiento: `get_norma_json?idNorma=29472&idVersion=YYYY-MM-DD`. El campo `vigencias` en los metadatos contiene las fechas exactas de cada versión, lo que permitió automatizar la descarga completa.

```
  ┌─────┬────────────┬────────────────────────────────────┬─────────┬──────────────────────┐
  │  #  │ Fecha      │ Ley modificatoria                  │ Cambios │ Artículos resultantes│
  ├─────┼────────────┼────────────────────────────────────┼─────────┼──────────────────────┤
  │  1  │ 1981-10-22 │ Texto Original                     │    —    │  73                  │
  │  2  │ 1981-10-23 │ DL 3.538                           │    5    │  68                  │
  │  3  │ 1981-10-31 │ DFL 251                            │    7    │  61                  │
  │  4  │ 1981-12-31 │ DFL 3                              │    1    │  60                  │
  │  5  │ 1985-12-28 │ Ley 18.482                         │    1    │  59                  │
  │  6  │ 1987-10-20 │ Ley 18.660                         │    7    │  66                  │
  │  7  │ 1989-12-21 │ Ley 18.876                         │    1    │  65                  │
  │  8  │ 1989-12-30 │ Ley 18.899                         │    0    │  65                  │
  │  9  │ 1993-06-01 │ Ley 19.221                         │    1    │  64                  │
  │ 10  │ 1994-03-19 │ Ley 19.301 (gran reforma)          │   99    │ 139                  │
  │ 11  │ 1995-05-18 │ Ley 19.389                         │   13    │ 148                  │
  │ 12  │ 1997-07-30 │ Ley 19.506                         │    1    │ 148                  │
  │ 13  │ 1999-01-18 │ Ley 19.601 (OPA)                   │   16    │ 164                  │
  │ 14  │ 1999-08-26 │ Ley 19.623                         │    8    │ 170                  │
  │ 15  │ 2000-12-20 │ Ley 19.705 (OPA y gob. corporativo)│   47    │ 197                  │
  │ 16  │ 2001-11-07 │ Ley 19.768 (MK1)                   │   23    │ 216                  │
  │ 17  │ 2002-05-31 │ Ley 19.806                         │    0    │ 216                  │
  │ 18  │ 2007-06-05 │ Ley 20.190 (MK2)                   │   21    │ 216                  │
  │ 19  │ 2009-04-28 │ Ley 20.343                         │    1    │ 216                  │
  │ 20  │ 2010-01-01 │ Ley 20.382 (gob. corporativo)      │   49    │ 236                  │
  │ 21  │ 2010-09-06 │ Ley 20.345                         │    7    │ 236                  │
  │ 22  │ 2010-10-01 │ Ley 20.448 (MK3)                   │   13    │ 238                  │
  │ 23  │ 2012-02-01 │ Ley 20.552                         │    1    │ 238                  │
  │ 24  │ 2014-05-01 │ Ley 20.712                         │   22    │ 238                  │
  │ 25  │ 2014-10-10 │ Ley 20.720                         │    7    │ 238                  │
  │ 26  │ 2020-10-19 │ Ley 21.276                         │    1    │ 239                  │
  │ 27  │ 2021-04-13 │ Ley 21.314 (transparencia)         │   65    │ 239                  │
  │ 28  │ 2022-02-01 │ Ley 21.398                         │    1    │ 239                  │
  │ 29  │ 2022-06-13 │ Ley 21.455                         │    1    │ 239                  │
  │ 30  │ 2023-08-17 │ Ley 21.595 (delitos económicos)    │   10    │ 241                  │
  │ 31  │ 2023-12-30 │ Ley 21.641                         │    1    │ 241                  │
  │ 32  │ 2025-03-26 │ Ley 21.735 (reforma pensiones)     │    1    │ 241                  │
  ├─────┼────────────┼────────────────────────────────────┼─────────┼──────────────────────┤
  │     │            │ TOTAL                              │   431   │  73 → 241            │
  └─────┴────────────┴────────────────────────────────────┴─────────┴──────────────────────┘
```

Estructura de archivos generados:

```
  research/2026-02-18/ley-18045/
  ├── json/
  │   ├── versions-index.json       ← Índice con las 32 fechas de vigencia
  │   ├── v01-1981-10-22.json       ← Texto original desde LeyChile API
  │   ├── v02-1981-10-23.json
  │   ├── ...
  │   └── v32-2025-03-26.json       ← Última versión vigente
  └── akn/
      ├── 01-original.xml           ← Texto original (73 artículos)
      ├── 02-amendment-1.xml        ← DL 3.538 + changeSet v01→v02
      ├── ...
      ├── 32-amendment-31.xml       ← Ley 21.735 + changeSet v31→v32
      └── 33-final.xml              ← Versión vigente (241 artículos)
```

A diferencia de la reforma de pensiones, este caso no requirió recopilación manual de documentos: todo se obtiene automáticamente de la API de LeyChile. Esto hace que el proceso sea replicable para cualquier norma chilena con historial de versiones.


---
**10/02/2026**

Surgieron dos preguntas, qué quisimos responder:
1. ¿Cómo representar el hecho de que varios países nombran las cosas de forma distinta? ¿AKN tiene forma de representar eso?

> No necesitas "escribir todo en inglés y traducir en la interfaz". La solución de AKN es más elegante:
>
> 1. El XML usa elementos en inglés (forzado por el schema) — esto da interoperabilidad entre países
> 2. Los metadatos llevan los nombres locales (name, showAs, FRBRname) — esto da la localización
> 3. Tu interfaz simplemente lee el showAs para mostrar al usuario — no necesitas tabla de traducciones
> 
> Lo que AKN no resuelve (y que sería trabajo tuyo si lo necesitas): una ontología cross-jurisdicción que diga "Cámara de Diputados == House of Representatives == Camera dei Deputati". AKN te da el framework (TLCConcept con href apuntando a una ontología), pero no viene con el mapeo hecho. Si quieres que tu interfaz muestre "equivalencias" entre países, tendrías que construir esa ontología.

2. AKN solamente representa el dato como es. No comprende las reglas del rito parlamentario. ¿Habrá algún formato que nos permita transformar todo el proceso en algo fácil de leer por una máquina y un humano? Tal vez un formato para construir diagramas de decisiones o algo de ese estilo, que nos permita traducir las leyes legislativas de un país.

> 1. AKN = los documentos (qué se produjo)
> 2. BPMN = el proceso (cómo se mueven los documentos)
> 3. DMN = las reglas (por qué se toman las decisiones)
> Cada país tendría su modelo BPMN del rito parlamentario, con sus tablas DMN de reglas. Los nodos del proceso BPMN referenciarían los tipos de documentos AKN que se producen en cada paso. 

Después de investigar, llegamos a la conclusión de [este reporte](research/2026-02-10/bpmn-dmn-para-rito-parlamentario.md). La idea de poder representar los flujos legalmente a través de diagramas es totalmente factible y podría ser super interesante. Nos desvía un poco de la idea principal, por ende lo dejaremos en pausa por ahora. 



---
**04/02/2026**

La preocupacion de abrir la "caja de pandora" nos siguio dando vueltas por la cabeza. Decidimos ver que tan real era.

Despues de varias busquedas se llego a la conclucion que no seguia un effecto caja de pandora. Y que basicamente faltaban solo 2 tipos mas para englobar todo el rito parlamentario: `questions` y `comunications`.

`questions` es para las preguntas parlamentarias. Y `comunitactions` para la comunicacion oficial entre los organos.

No pasamos mucho tiempo diseñando cada tipo, priorisamos seguir avanzando en el experimento.

La próxima pregunta fue: ¿cómo podríamos rediseñar una página de un parlamento 100 % basado en las primitivas de AKN? En este caso, no estaríamos buscando re-inventar cómo funcionarían los links y todo eso, sino reemplazar lo existente y que funcione bastante similar. La única diferencia es que, atrás, todo está representado en AKN. 

![AKN Dashboard - Bills in Progress con links a documentos](research/2026-02-04/akn-full-dashboard-with-links.jpg)

El resultado fue nuevamente positivo. Navegar los distintos conceptos es bastante natural cuando todo esta bien conectado.

Lo que me sorprendio del POC es que podemos ver cuales boletines ya fueron citados para comission, es lo que se ve en el screenshot. Parece basico, pero no es como se ve muy comunmente.

Esto es gracias a que todo esta conectado por links como en la web. La citacion esta conectada al boletine mecanicamente.

La proxima pregunta es: que tan viable y juridicamente correctos son estos links.

![AKN Dashboard - Historial de documentos](research/2026-02-04/akn-dashboard-history.jpg)

Por ejemplo en este screenshot podemos ver el historial de un boletin, pero gracias a los links tambien marca las citaciones, mensages y debates.

De lo que vimos, al parecer no. El historial de un boletín es a título informativo. Y podríamos agregarle elementos a este historial, como las citaciones, o eventualmente cuando un boletín es mencionado.


---
**03/02/2026**

Viendo el buen resultado del proof of concept, rediseñamos toda la página para hacerla más accesible. Aún no lo publicamos abiertamente. El objetivo es crear un debate alrededor de estos temas.

También cambiamos el nombre a la extensión, ya no es AKN++ pero AKN Diff, porque se concentra únicamente en los cambios del comparado, nada más que eso. Y llamamos a este proyecto de research Diff by Parlamento.ai, de esa manera, englobamos todo bajo el nombre de "Diff".

Estamos agradablemente sorprendidos del formato Akoma Ntoso, se ve bastante completo y hecho con mucha dedicación para adaptarse a todos los tipos de parlamentos alrededor del mundo. 

Le vemos harto potencial. Incluso si el mundo decidió ignorarlo.

Se nos ocurrieron varias ideas que me gustaría explorar:
1. Tal vez los parlamentos deberían tener como base de datos un equivalente a S3 en vez de una DB relacional SQL, y que en ella se navigue como en la web, basada en links. Todo podía ser representado con AKN. En vez de tener `raws` y `columns` tiene archivos linkeados.
2. Podría usar el formato Git Para tener transparencia en las versiones y actualizaciones, en ese caso sería aún más simple que un S3 y sería una carpeta, con todo adentro. Se puede clonar por cualquiera. Serían básicamente archivos y carpetas, nada más.
3. Me gustaría hacer un visualizador de AKN online, algo donde podamos cargar estos archivos y poder visualizarlos de forma más bonita. Algo que englobe la totalidad del formato para poder explorar los tipos.
4. ¿Cómo podríamos convertir los datos actuales a este formato? Obviamente que con un trabajo manual monstruoso se podría hacer, pero eso no parece para nada viable. Habría que explorar workflows que combinen informática, inteligencia artificial y trabajo manual para reconstruir los datos.
5. Ver qué tan viable es AKN para ser el formato que englobe todo. A primera vista se ve bastante completo, pero tal vez, en realidad, es súper terco y difícil de trabajar y no se adapta a la realidad de los parlamentos. Explicaría el por qué nunca fue adaptado correctamente.

A raíz del punto 1 y 3 decidimos hacer un test de cómo podríamos hacer un visualizador en el cual podemos cliquear, como si fueran links, los distintos archivos AKN para poder navegar. El resultado es positivo: es agradable de navegar y el formato lo permite muy bien. Agregamos una nueva sección a la documentación para mostrar la versión renderizada y el XML bruto de cada uno de los tipos disponibles en AKN. 

![AKN Split View - Renderizado y XML](research/2026-02-03/xml-render-split.jpg)

Hicimos como si fuera un navegador web para ejemplificar aún más. En la imagen se puede ver la 'split view' en la que se ven el modo renderizado y el XML al mismo tiempo.

Siguiendo la misma idea, nos preguntamos cómo sería crear un portal web 100 % basado en AKN. Ver si un portal de algún parlamento, con todas sus distintas páginas y complejidades, podría ser representado con este formato solamente. 

Pienso esto para Parlamento.ai que necesita organización y queremos seguir varios parlamentos, pero también para crear un proyecto open source para cualquier parlamento que le gustaría tomar una interfaz ya trabajada y compatible con AKN.

Analizando cómo ver el problema, nos dimos cuenta de que no existía una forma ordenada de representar el "orden del día". La solución que propone el formato es hacer un documento genérico, que podría ser un reporte, una conclusión o una citación, pero no tiene un formato específico para la citación.

Investigamos un poco sobre por qué el formato no comprendía el concepto de "orden del día". La conclusión fue que AKN es un formato para archivar temas que son jurídicamente relevantes y que este concepto de citación vendría siendo algo de operación y no jurídico.

A raíz de esto, nos preguntamos si al querer embarcar el lado operativo del Parlamento, no estaríamos abriendo una caja de pandora de formatos y excepciones para cada Parlamento.

Pero después de reflexionar y buscar, vimos que la citación era el único concepto que realmente nos faltaba para cubrir todo el ritual legislativo. 

Decidimos no limitarnos por cómo funciona el formato AKN desde tan temprano. De todas formas, es un proyecto de búsqueda y exploración más que de implementación. Por ende, decidimos darle una oportunidad a nuestra idea de tipo "orden del día". 

Hicimos un primer test de cómo podría ser. [En este documento está detallado todo con las motivaciones](/Users/lb/work/diff-law/research/2026-02-03/citation-type-proposal.md), se nos ocurrió hacer un formato que también intente ser mecánicamente compatible con CalDAV, tal vez es un poco 'gadget', pero muestra la motivación a una máxima estandarización y compatibilidad.  

El formato aún merece revisión. 

---
**01/02/2026**

Con lo satisfactorio que se veía en el Proof of Concept, nos preguntamos por qué no abarcar más con este nuevo formato: ¿Cómo podríamos agregar la votación de cada cambio en la interfaz? Esto agregaría una nueva capa de visibilidad y transparencia.

El formato propuesto sería agregarle a nuestro `changeSet` el resultado final del voto, con los nombres. La razón de esto es porque, de la misma manera que los cambios, la votación en el formato actual simplemente es mencionada, pero en ningún momento se computa con un resultado final.

En el archivo `DEBATE.xml` solamente hacen el guión como en una pieza de teatro en la que dice "Senador Pérez: a favor". Pero en ningún momento se registra el voto final en el documento (e.g. `a-favor: 5, en-contra: 7`). 

Agregamos estos campos a nuestro `AKN Diff` formato, dentro del `changeSet`:

```md
  ┌─────────────────┬───────────────────────────────────────────────────────────────┐
  │    Elemento     │                           Propósito                           │
  ├─────────────────┼───────────────────────────────────────────────────────────────┤
  │ akndiff:vote    │ Consolida el resultado de la votación                         │
  ├─────────────────┼───────────────────────────────────────────────────────────────┤
  │ date            │ Cuándo se votó                                                │
  ├─────────────────┼───────────────────────────────────────────────────────────────┤
  │ result          │ approved, rejected, withdrawn, inadmissible, pending          │
  ├─────────────────┼───────────────────────────────────────────────────────────────┤
  │ source          │ Referencia al documento debate donde está el detalle completo │
  ├─────────────────┼───────────────────────────────────────────────────────────────┤
  │ akndiff:for     │ Lista de votantes a favor                                     │
  ├─────────────────┼───────────────────────────────────────────────────────────────┤
  │ akndiff:against │ Lista de votantes en contra                                   │
  ├─────────────────┼───────────────────────────────────────────────────────────────┤
  │ akndiff:abstain │ Lista de abstenciones (vacío si no hay)                       │
  ├─────────────────┼───────────────────────────────────────────────────────────────┤
  │ akndiff:voter   │ Cada persona, con href (ID único) y showAs (nombre legible)   │
  └─────────────────┴───────────────────────────────────────────────────────────────┘
```

El resultado en la interfaz es bastante atractivo:

![AKN Diff Votaciones](research/2026-02-01/akndiff-votes.png)


---
**31/01/2026**

Después de los descubrimientos bien pesimistas de ayer, decidimos irnos más en profundidad en este formato maravilla llamado *Akoma Ntoso* (AKN).

Es un formato bastante grande que engloba el ritual legislativo prácticamente por completo, basado en XML, siendo actualizado por un organismo de buena reputación en estándares.

Pero tiene dos problemas.

El primero es que nunca fue realmente adoptado y muchos países optaron por sus propias implementaciones basadas en XML.

El segundo problema es que, si bien es muy completo, no tiene el concepto de un comparado, solamente comprende el `AMENDMENT` que básicamente es el cambio escrito en lenguaje natural, pero que no es computable para generar un comparado de forma automática.

La razón por la cual no tiene un comparado como un tipo nativo es que, en realidad, el comparado no tiene lugar oficial en el ritual legislativo. Lo que cuenta es el `AMENDMENT`, y luego cada uno calcula el comparado por su lado, y tal vez esa es la raíz del problema.

Aquí un resumen que ejemplifica el problema:
```md
  La analogía: una receta de cocina

  Imagina que tienes una receta de cocina publicada en un libro (la ley vigente). Alguien propone cambiarla (el proyecto de ley). El proceso sería:

  1. La receta original (en el libro)     → ACT
     "Agregar 100g de azúcar"

  2. Alguien dice "hay que cambiarla"     → BILL
     "Propongo reemplazar 100g por 50g"

  3. La comisión de cocina la discute     → DEBATE
     "Juan dijo que 50g es muy poco..."

  4. Votan y aprueban con cambios         → AMENDMENT
     "Mejor que sean 75g"

  5. La receta actualizada (nuevo libro)  → ACT (nueva versión)
     "Agregar 75g de azúcar"

  El comparado sería una hoja que pone lado a lado:
  ┌────────────────────────┬───────────────────────┐
  │    Receta original     │     Receta nueva      │
  ├────────────────────────┼───────────────────────┤
  │ Agregar 100g de azúcar │ Agregar 75g de azúcar │
  └────────────────────────┴───────────────────────┘
  Esa hoja no existe como tipo de documento en AKN. Es algo que tú produces para que la gente entienda qué cambió.
```

Lo que se nos ocurrió es aumentar el formato AKN Para poder agregar los cambios computados. La primera idea fue crear un nuevo tipo `RED-LINE` dónde vivirían los comparados. La segunda idea que vino, que nos pareció mucho mejor, fue aumentar cada uno de los tipos para agregarles la manera de representar el cambio computado.

Decidimos llamarlo `AKN Diff`.

Este es un ejemplo del `AMENDMENT`, pero con el nuevo campo `changeSet`:

```xml
  <amendment>
    <!-- El "mensaje del commit" (lo que ya existe en AKN) -->
    <amendmentBody>
      <amendmentContent>
        <p>Reemplázase en el artículo 1 la frase "100g de azúcar"
           por "75g de azúcar"</p>
      </amendmentContent>
      <amendmentJustification>
        <p>Porque 100g es demasiado dulce.</p>
      </amendmentJustification>
    </amendmentBody>

    <!-- El "diff" (lo que NO existe en AKN y tú propones agregar) -->
    <changeSet
      base="/receta/v2"
      result="/receta/v3">
      <articleChange article="art_1">
        <old>Agregar 100g de azúcar</old>
        <new>Agregar 75g de azúcar</new>
      </articleChange>
    </changeSet>
  </amendment>
```

Este campo se le agregaría a cualquier tipo que pueda modificar la ley textualmente, como, por ejemplo el `BILL`.

Con este sistema podemos cargar un `AMENDMENT`, gracias a los links volver al inicio (`ACT`), y volver a construir todos los cambios computados para saber el comparado actual de forma automática.

En teoría, debería poder funcionar; si bien hay casos en los que se juntan varios cambios de una y se cambian de una forma un poco opaca. También está el caso donde deciden reemplazar toda una sección por una nueva o deciden reordenar los números de un artículo. El resultado no sería el más bonito o más práctico, pero sería algo.

Para esos casos, se podría complejizar un poco más el formato, agregando cambios por línea y cosas de ese estilo:

```xml
  <articleChange old="art_24" new="art_22" type="renumber+modify">
    <old>...</old>
    <new>...</new>
  </articleChange>
  <articleChange old="art_25" type="repeal"/>
  <articleChange new="art_23" type="insert"/>
```

A partir de ese formato, construimos un proof of concept que parece funcionar bastante bien.

![AKN Diff Proof of Concept](research/2026-01-31/akndiff-v0.1.png)

Realmente nos permite hacer un seguimiento mucho más agradable y comprensible. Ahora el ejemplo es una simple receta, no una verdadera ley. Faltaría ver cómo funciona con más datos.


---
**30/01/2026**

Lo primero que buscamos es explorar lo existente. Con un simple deep research ([primera búsqueda](research/2026-01-30/primera-busqueda.md)) vimos que hay muchas cosas existentes y que varían bastante de país en país. Decidimos hacer una búsqueda para cada país para tener mucho más detalle sobre las propuestas e implementaciones ya vigentes (ver [research por país](research/2026-01-30/country)).

Después de analizarlas, llegamos a una conclusión bastante similar a la que generó la AI:
> La conclusión transversal: **ningún país ofrece comparados legislativos en formato estructurado y legible por máquina**. Incluso UK y USA, que tienen la mejor infraestructura, mantienen sus herramientas de comparación como internas o limitadas a leyes ya promulgadas. El gap que motivó este proyecto es real y universal.

La segunda mala noticia después de esta primera búsqueda, es que **muchas herramientas no están abiertas al público**. ¿Tal vez son propuestas que quedaron en el aire y nunca se implementaron? O tal vez sí están bien implementadas, pero solo los miembros de los congresos tienen acceso y, por ende, no podemos verificar y probar esas implementaciones. Si al final del proceso el público solamente tiene acceso a un PDF, consideraríamos que no está implementado.

El tercer aprendizaje fue la existencia del formato `AKN/LegalDocML`, lo cual **parece ser exactamente la respuesta al problema**. Un formato universal basado en `XML` para el mundo legislativo. Pero prácticamente ningún Parlamento lo ha implementado correctamente, Y aun peor, cada uno implemento su propia version basada en `XML` alejándose del estándar.
