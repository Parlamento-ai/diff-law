# Endpoints para reconstruir un procedimiento legislativo EU

**Fecha:** 10 de febrero de 2026
**Objetivo:** Mapear los endpoints necesarios para recopilar todos los datos de un procedimiento legislativo EU y replicar el PoC paella-valenciana con datos reales.

---

## Resumen

Para reconstruir un procedimiento legislativo completo (propuesta → enmiendas → acto final), necesitamos 3 fuentes:

1. **EUR-Lex** — timeline del procedimiento + texto de cada documento en HTML y Formex 4
2. **EP API v2** — datos estructurados del Parlamento (eventos, votaciones, documentos EP)
3. **CELLAR SPARQL** — metadata RDF, búsqueda de documentos relacionados, acceso a Formex XML

Ninguna requiere autenticación. EP API tiene rate limit de 500 req/5 min. Todo bajo CC BY 4.0.

---

## 1. Obtener el timeline del procedimiento

### EUR-Lex procedure page (lo más completo)

```
GET https://eur-lex.europa.eu/procedure/EN/{YEAR}_{NUMBER}
```

Ejemplo GDPR:
```
GET https://eur-lex.europa.eu/procedure/EN/2012_11
```
- **Status:** HTTP 200 ✅
- **Retorna:** HTML con todas las etapas, todos los CELEX, documentos de trabajo del Consejo (ST numbers), fechas, rapporteurs, comisarios
- **Alternativa:** `https://eur-lex.europa.eu/legal-content/EN/HIS/?uri=CELEX:32016R0679` (tab "history" de cualquier documento del procedimiento)

### EP API v2 (lo más estructurado, JSON-LD)

```
GET https://data.europarl.europa.eu/api/v2/procedures/{process-id}
GET https://data.europarl.europa.eu/api/v2/procedures/{process-id}/events
```

Ejemplo GDPR (nota: usa guiones, no slash):
```
GET https://data.europarl.europa.eu/api/v2/procedures/2012-0011
GET https://data.europarl.europa.eu/api/v2/procedures/2012-0011/events
```
- **Status:** HTTP 200 ✅
- **Retorna:** JSON-LD con tipos de actividad, URIs de etapas, IDs de documentos vinculados, resultados de votaciones
- **Tipos de actividad encontrados:** `REFERRAL`, `PLENARY_ADOPT_POSITION`, `PLENARY_APPROVE_COUNCIL_POSITION`, `PLENARY_VOTE_RESULTS`, `SIGNATURE`, `PUBLICATION_OFFICIAL_JOURNAL`
- **Etapas:** URIs como `http://publications.europa.eu/resource/authority/procedure-phase/RDG1` (1ª lectura), `RDG2` (2ª lectura)
- **Documentos vinculados:** `A-7-2013-0402` (informe comisión), `A-8-2016-0139` (recomendación 2ª lectura), `TA-8-2016-0125` (texto adoptado), `PV-7-2014-03-12-VOT-ITM-005` (acta de votación)
- **Limitación:** Solo incluye etapas del EP, NO del Consejo ni de la Comisión

### OEIL — Observatorio Legislativo (overview humano)

```
GET https://oeil.europarl.europa.eu/oeil/en/procedure-file?reference=2012/0011(COD)
```
- **Status:** HTTP 200 ✅ (después de redirect 301)
- **Retorna:** HTML con timeline completo, rapporteur, shadow rapporteurs, comisiones asignadas, referencia al acto final

---

## 2. Documentos de cada etapa — Caso GDPR (2012/0011(COD))

### Sistema CELEX

Prefijos: `5` = actos preparatorios, `3` = legislación adoptada.
Sufijos: `PC` = propuesta COM, `AP` = posición adoptada EP, `AG` = posición común Consejo, `AE` = opinión CESE, `AR` = opinión CdR.

### Etapas del GDPR

| Etapa | CELEX | Tipo | Fecha | Equivalente paella-valenciana |
|-------|-------|------|-------|-------------------------------|
| Propuesta Comisión | `52012PC0011` | COM(2012)11 | 2012-01-25 | `bill/paella-reform-2024.xml` |
| Opinión EDPS | `52012XX0630(01)` | Opinión consultiva | 2012-03-07 | — |
| Opinión CESE | `52012AE1303` | Opinión consultiva | 2012-05-23 | — |
| Opinión CdR | `52012AR0625` | Opinión consultiva | 2012-10-10 | — |
| **Posición EP 1ª lectura** | `52014AP0212` | Posición con enmiendas | 2014-03-12 | amendments del bill |
| Comunicación Comisión | `52016PC0214` | Posición sobre enmiendas EP | 2016-04-11 | — |
| **Posición Consejo** | `52016AG0006(01)` + `(02)` | Posición común | 2016-04-08 | — |
| Aprobación EP 2ª lectura | `52016AP0125` | Aprobación sin enmienda | 2016-04-14 | — |
| **Acto final** | `32016R0679` | Reglamento | 2016-04-27 | `act/recipe-amended.xml` |
| Corrigendas | `32016R0679R(01)`, `R(02)`, `R(03)` | Correcciones | varios | — |

### Lo mínimo para replicar el PoC

Solo necesitamos 3 documentos:

1. **`52012PC0011`** — Propuesta de la Comisión (= el "bill")
2. **`52014AP0212`** — Posición EP con enmiendas (= los "amendments")
3. **`32016R0679`** — Acto final adoptado (= el "act" consolidado)

El `changeSet` AKN Diff lo generamos nosotros comparando 1 vs 3.

---

## 3. Descargar el texto de cada documento

### Opción A: HTML (lo más simple)

```
GET https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:{celex}
```

| CELEX | Tamaño | Status |
|-------|--------|--------|
| `52012PC0011` | 335 KB | ✅ |
| `52014AP0212` | 820 KB | ✅ |
| `52016AG0006(01)` | 652 KB | ✅ |
| `32016R0679` | 809 KB | ✅ |

Para español, cambiar `EN` por `ES`:
```
GET https://eur-lex.europa.eu/legal-content/ES/TXT/HTML/?uri=CELEX:32016R0679
```

### Opción B: Formex 4 XML (estructurado, con `<ARTICLE>`, `<PARAG>`, etc.)

El acceso a Formex requiere navegar CELLAR:

1. Obtener el CELLAR UUID vía SPARQL o NOTICE XML
2. Acceder a la manifestación Formex: `http://publications.europa.eu/resource/cellar/{uuid}.{lang_code}.{manif}/DOC_2`
3. O usar la URL directa OJ: `http://publications.europa.eu/resource/oj/{oj_ref}.{LANG}.fmx4.{filename}.xml`

Ejemplo GDPR:
```
GET http://publications.europa.eu/resource/oj/JOL_2016_119_R_0001.ENG.fmx4.L_2016119EN.01000101.xml
```
- Retorna: 428 KB Formex 4 XML con `<ACT>`, `<PREAMBLE>`, `<ENACTING.TERMS>`, 99 `<ARTICLE>`s

### Opción C: EP API (documentos del Parlamento)

```
GET https://data.europarl.europa.eu/api/v2/documents/{doc-id}
```

Retorna metadata FRBR (Work → Expression → Manifestation → Item) con URLs de descarga.

Descarga directa:
```
https://data.europarl.europa.eu/distribution/{collection}/{doc-id}/{doc-id}_{lang}.{format}
```

| Doc ID | Descripción | Formatos |
|--------|-------------|----------|
| `A-7-2013-0402` | Informe comisión LIBE (1ª lectura) | HTML (3.7 MB), XML (2.7 MB), PDF |
| `A-8-2016-0139` | Recomendación 2ª lectura | HTML, XML, PDF |
| `TA-8-2016-0125` | Texto adoptado EP | HTML, XML, PDF |

**Nota:** El XML del EP usa su propio schema, NO es Formex ni AKN.

---

## 4. SPARQL queries útiles

### Encontrar todos los documentos de un procedimiento

```sparql
PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
SELECT DISTINCT ?work ?celex ?date WHERE {
  ?work cdm:resource_legal_information_miscellaneous ?misc .
  FILTER(CONTAINS(?misc, "2012/0011"))
  ?work cdm:resource_legal_id_celex ?celex .
  OPTIONAL { ?work cdm:resource_legal_date_document ?date }
} ORDER BY ?date
```

**Nota:** Esta query solo encuentra docs que llevan el código de procedimiento en `resource_legal_information_miscellaneous`. No retorna las posiciones EP (`52014AP0212`) ni del Consejo (`52016AG0006`). Para esos, usar la query con CELEX explícitos.

### Buscar todos los docs por CELEX conocidos

```sparql
PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
SELECT DISTINCT ?work ?celex ?date WHERE {
  ?work cdm:resource_legal_id_celex ?celex .
  FILTER(REGEX(?celex, '^(52012PC0011|52014AP0212|52016AP0125|32016R0679|52016AG0006)'))
  OPTIONAL { ?work cdm:resource_legal_date_document ?date }
} ORDER BY ?date
```

### Obtener CELLAR UUID de un CELEX

```sparql
PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
SELECT ?work WHERE {
  ?work cdm:resource_legal_id_celex "32016R0679"^^<http://www.w3.org/2001/XMLSchema#string> .
}
```

### Obtener manifestaciones (formatos) de un documento

```sparql
PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
SELECT ?lang ?format ?manif WHERE {
  ?work cdm:resource_legal_id_celex "32016R0679"^^<http://www.w3.org/2001/XMLSchema#string> .
  ?expr cdm:expression_belongs_to_work ?work .
  ?expr cdm:expression_uses_language ?lang .
  ?manif cdm:manifestation_manifests_expression ?expr .
  ?manif cdm:manifestation_type ?format .
  FILTER(?format = "fmx4")
} LIMIT 30
```

---

## 5. Mapeo al PoC paella-valenciana

```
paella-valenciana/                          →  gdpr-procedure/
├── act/valencian-paella-recipe.xml  (ACT)  →  32016R0679 (Formex → AKN)
├── bill/paella-reform-2024.xml     (BILL)  →  52012PC0011 (propuesta COM → AKN)
│   └── akndiff:changeSet                   →  diff computado entre propuesta y acto final
├── debate/camara-plenary.xml               →  EP API speeches (opcional)
├── _index.json                             →  EUR-Lex procedure/2012_11 parseado
└── _parliament.json                        →  estructura EP/Consejo/Comisión
```

### Flujo progresivo de carga

```
1. Usuario ingresa referencia: "2012/0011(COD)" o "GDPR"
   │
2. GET EP API → /procedures/2012-0011
   │  → timeline de eventos EP (JSON-LD)
   │
3. GET EUR-Lex → /procedure/EN/2012_11
   │  → timeline completo con TODOS los CELEX
   │
4. Para cada CELEX clave, descargar HTML:
   │  GET /legal-content/EN/TXT/HTML/?uri=CELEX:52012PC0011  (propuesta)
   │  GET /legal-content/EN/TXT/HTML/?uri=CELEX:52014AP0212  (enmiendas EP)
   │  GET /legal-content/EN/TXT/HTML/?uri=CELEX:32016R0679   (acto final)
   │
5. Opcionalmente, descargar Formex para conversión AKN:
   │  GET CELLAR → manifestación fmx4 de cada documento
   │
6. Generar changeSet AKN Diff comparando:
   │  propuesta (52012PC0011) vs acto final (32016R0679)
   │  posición EP (52014AP0212) vs acto final (32016R0679)
   │
7. Visualizar en la plataforma
```

---

## 6. Comparación con Chile

| Concepto | Chile | UE |
|----------|-------|-----|
| ID de procedimiento | Boletín (ej: 12345-07) | Referencia: `2012/0011(COD)` |
| Tracker del procedimiento | Senado/Cámara tramitación | EUR-Lex procedure page, OEIL |
| Etapas | 1er/2do trámite, comisión mixta | 1ª/2ª lectura, conciliación |
| Documentos por etapa | Mociones, informes, oficios | Propuestas COM, posiciones EP, posiciones Consejo |
| API estructurada | Senado API (XML) | EP API v2 (JSON-LD), CELLAR SPARQL |
| Texto del documento | BCN AKN 2.0, HTML | EUR-Lex HTML, CELLAR Formex 4 XML |
| IDs únicos | Boletín + trámite | CELEX numbers |
| Votaciones nominales | Senado/Cámara API (XML) | EP API + HowTheyVote.eu (JSON/CSV) |

---

## 7. ELI — European Legislation Identifier

Cada acto legislativo tiene un ELI URI:
```
http://publications.europa.eu/resource/eli/reg/2016/679/oj
```

- Existe como identificador persistente en el grafo RDF (`owl:sameAs`)
- **No funciona bien como endpoint REST** — retorna 404 con content negotiation (`Accept: application/json`)
- Mejor usarlo como referencia, no como punto de acceso
- Para acceder al documento, usar CELEX vía EUR-Lex o CELLAR UUID

---

## 8. Próximos pasos

1. **Descargar los 3 documentos clave del GDPR** en HTML y Formex
2. **Parsear el EUR-Lex procedure page** para extraer el timeline completo
3. **Llamar EP API** para obtener datos estructurados de votaciones y eventos
4. **Construir la página** tipo paella-valenciana con datos reales
5. **Convertir Formex → AKN** (usando lo aprendido de LEOS)
6. **Generar changeSet** comparando propuesta vs acto final
