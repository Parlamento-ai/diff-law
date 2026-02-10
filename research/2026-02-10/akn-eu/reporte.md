# Reporte: Estado real de los datos legislativos de la Unión Europea para conversión a AKN

**Fecha:** 10 de febrero de 2026
**Objetivo:** Verificar empíricamente qué datos existen en la UE, en qué formato están, y qué tan viable es convertirlos a AKN 3.0 con AKN Diff.

---

## Resumen ejecutivo

**La Unión Europea NO tiene documentos legislativos públicos en formato Akoma Ntoso**, a pesar de haber invertido significativamente en el estándar AKN4EU (actualmente en versión 4.1.1). Lo que SÍ tiene es **Formex 4**, un formato XML estructurado propio con ~6.9 millones de manifestaciones, que cubre la totalidad de la legislación publicada en el Diario Oficial desde los años 50.

Sin embargo, la UE tiene tres ventajas enormes que Chile no tiene:

1. **Un editor legislativo open-source (LEOS)** que produce AKN nativamente, con código fuente en code.europa.eu
2. **25 documentos AKN4EU de ejemplo** descargables oficialmente desde op.europa.eu
3. **Una API REST del Parlamento Europeo** con 54 endpoints (MEPs, votaciones, procedimientos, discursos) en JSON-LD bajo licencia CC BY 4.0

La viabilidad de conversión es **media-alta pero más compleja que Chile**. El gap principal es que Formex → AKN requiere un conversor (FMX2AK existe internamente en la UE pero no es público), mientras que Chile ya tenía 34,936 documentos en AKN 2.0 listos para upgrade. El impacto comunicacional de la UE sería mucho mayor: ~194,632 actos legislativos en 24 idiomas.

---

## 1. EUR-Lex y CELLAR — Formex 4 XML (VERIFICADO Y FUNCIONAL)

### Acceso

| Recurso | URL | Notas |
|---------|-----|-------|
| NOTICE XML (metadata) | `https://eur-lex.europa.eu/legal-content/EN/TXT/XML/?uri=CELEX:{celex}` | Retorna metadata CELLAR, NO el documento |
| HTML | `https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:{celex}` | Texto completo renderizado |
| Formex directo (OJ) | `http://publications.europa.eu/resource/oj/{oj_ref}.{LANG}.fmx4.{filename}.xml` | Documento Formex real |
| SPARQL | `https://publications.europa.eu/webapi/rdf/sparql` | Metadata RDF, funcional |
| CELLAR | `http://publications.europa.eu/resource/cellar/{uuid}` | Content negotiation, requiere Accept header específico |

**Autenticación:** Ninguna requerida. **Formato principal:** Formex 4 (NO es AKN).

### Hallazgo crítico: EUR-Lex NO sirve AKN

Se intentó content negotiation con `Accept: application/akn+xml` en el CELLAR API. **Resultado: HTTP 400 — "Illegal accept header: Invalid media type(s) 'application/akn+xml'"**. EUR-Lex solo acepta: `application/xml;type=fmx4`, `application/pdf`, `application/zip`, `application/rdf+xml`.

### Documentos descargados

**GDPR — Formex 4** — [gdpr-formex4-direct.xml](samples/gdpr-formex4-direct.xml) — 428 KB
```xml
<ACT xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:fmx="http://opoce"
     xsi:noNamespaceSchemaLocation="http://formex.publications.europa.eu/schema/formex-05.55-20141201.xd">
  <BIB.INSTANCE>
    <DOCUMENT.REF FILE="L_2016119EN.01000101.doc.xml">
      <COLL>L</COLL><NO.OJ>119</NO.OJ><YEAR>2016</YEAR><LG.OJ>EN</LG.OJ>
    </DOCUMENT.REF>
    <DATE ISO="20160427">20160427</DATE>
    <LG.DOC>EN</LG.DOC>
    <NO.DOC FORMAT="YN" TYPE="OJ"><NO.CURRENT>679</NO.CURRENT><YEAR>2016</YEAR><COM>EU</COM></NO.DOC>
  </BIB.INSTANCE>
  <TITLE><TI><P><HT TYPE="UC">Regulation</HT> (EU) 2016/679
    <HT TYPE="UC">of the European Parliament and of the Council</HT></P>
    <P>of 27 April 2016</P>
    <P>on the protection of natural persons with regard to the processing of personal data...</P>
  </TI></TITLE>
  <PREAMBLE>
    <PREAMBLE.INIT>THE EUROPEAN PARLIAMENT AND THE COUNCIL OF THE EUROPEAN UNION,</PREAMBLE.INIT>
    <GR.VISA><!-- 6 VISAs (base legal, propuesta CE, etc.) --></GR.VISA>
    <GR.CONSID><!-- 173 CONSIDs (considerandos) --></GR.CONSID>
    <PREAMBLE.FINAL>HAVE ADOPTED THIS REGULATION:</PREAMBLE.FINAL>
  </PREAMBLE>
  <ENACTING.TERMS>
    <!-- 11 DIVISIONs (capítulos), 99 ARTICLEs -->
    <!-- Elementos: ARTICLE, PARAG, NP, ALINEA, ITEM, LIST, NOTE -->
  </ENACTING.TERMS>
  <FINAL><SIGNATURE><!-- Firmantes: M. Schulz (EP), J.A. Hennis-Plasschaert (Consejo) --></SIGNATURE></FINAL>
</ACT>
```

**Dublin III Regulation — Formex 4** — [dublin3-formex4.xml](samples/dublin3-formex4.xml) — 142 KB
- Schema: `formex-05.21-20110601.xd` (Formex 5.21, más antiguo)
- Contenido: Regulation (EU) No 604/2013 completa con capítulos y artículos

**AI Act (Reg. 2024/903) — Formex 4** — extraído de [aiact-formex4.zip](samples/aiact-formex4.zip) — 4 archivos:
- `L_202400903EN.000101.fmx.xml` (124 KB) — cuerpo principal `<ACT>`
- `L_202400903EN.002601.fmx.xml` (1.9 KB) — `<ANNEX>` (anexo)
- `L_202400903EN.doc.fmx.xml` (1.9 KB) — `<DOC>` (metadata wrapper)
- `L_202400903EN.toc.fmx.xml` (1.0 KB) — `<PUBLICATION>` (tabla de contenido)
- Schema: `formex-06.00-20210715.xd` (Formex 6.0, la versión más nueva observada)

**Nota importante:** El CELEX `32024R0903` corresponde al **Interoperable Europe Act**, no al AI Act (que es `32024R1689`). El nombre del archivo es un error mío en la query, pero el Formex descargado es válido y representativo.

**GDPR versión española** — [gdpr-formex4-es.xml](samples/gdpr-formex4-es.xml) — 467 KB
- Confirma disponibilidad multiidioma: `<LG.DOC>ES</LG.DOC>`
- Contenido: "Reglamento (UE) 2016/679 del Parlamento Europeo y del Consejo..."

**GDPR versión consolidada** — [gdpr-consolidated-formex.zip](samples/gdpr-consolidated-formex.zip) → `gdpr-consolidated/CL2016R0679EN0000020.0001.xml` (262 KB)
- Raíz: `<CONS.ACT>` (diferente de `<ACT>` normal)
- Contiene: `<INFO.CONSLEG>`, `<FAM.COMP>` (familia de actos componentes), `<GR.CORRIG>` (correcciones aplicadas)
- Schema: `formex-05.56-20160701.xd`

**GDPR HTML** — [gdpr-xhtml.html](samples/gdpr-xhtml.html) — 809 KB

### Estructura Formex vs AKN — Mapeo de elementos

| Elemento Formex | Cantidad (GDPR) | Equivalente AKN |
|-----------------|-----------------|-----------------|
| `ARTICLE` | 99 | `<article>` |
| `PARAG` / `NO.PARAG` | 372 | `<paragraph>` / `<num>` |
| `NP` / `NO.P` / `TXT` | 558 | `<point>` / `<num>` / `<content>` |
| `ALINEA` | 397 | `<intro>` o `<content>` |
| `ITEM` | 389 | `<point>` (sub-puntos) |
| `LIST` | 66 | `<list>` |
| `DIVISION` | 26 | `<chapter>` / `<section>` |
| `CONSID` | 173 | `<recital>` |
| `VISA` | 6 | `<citation>` |
| `NOTE` | 21 | `<authorialNote>` |
| `HT` (highlighting) | 95 | `<i>`, `<b>`, etc. |

### Versiones de Formex observadas

| Schema | Año | Documento |
|--------|-----|-----------|
| formex-05.21 | 2011 | Dublin III (2013) |
| formex-05.55 | 2014 | GDPR original (2016) |
| formex-05.56 | 2016 | GDPR consolidado |
| formex-06.00 | 2021 | Interoperable Europe Act (2024) |

---

## 2. AKN4EU — El estándar EU de Akoma Ntoso (VERIFICADO, PARCIALMENTE DESCARGABLE)

### Estado del proyecto

AKN4EU es el perfil oficial de la UE para Akoma Ntoso. Es desarrollado por el Comité Interinstitucional de Metadatos y Formatos (IMFC), presidido por la Oficina de Publicaciones.

| Versión | Fecha | Notas |
|---------|-------|-------|
| AKN4EU 3.0 | Abril 2020 | Adoptado oficialmente por IMFC |
| AKN4EU 4.1.1 (errata) | ~2025 | Documento en Scribd, desarrollo continuo |
| 3er Workshop AKN4EU | ~2025 | Confirmado via tweet de Hilde Hardeman |

### Recursos descargables

| Recurso | URL | Status |
|---------|-----|--------|
| Página principal AKN4EU | `https://op.europa.eu/en/web/eu-vocabularies/akn4eu` | ✅ Accesible (JavaScript-heavy) |
| Dataset/descargas | `https://op.europa.eu/en/web/eu-vocabularies/dataset/-/resource?uri=http://publications.europa.eu/resource/dataset/akn4eu` | ✅ Accesible |
| Documentación PDF (Vol II) | `https://op.europa.eu/documents/3938058/7067425/AKN4EU+3.0+Documentation+-+Volume+II+-+XML+markup+-+Part+1+-+Part+2.pdf` | ✅ 4.46 MB |
| **25 documentos AKN de ejemplo** | Tab "Download" en la página del dataset | ✅ Disponible |
| **XSD schemas AKN4EU** | Tab "Download" en la página del dataset | ✅ Disponible |
| Schema OASIS AKN 3.0 base | `https://github.com/oasis-open/legaldocml-akomantoso` | ✅ GitHub público |

### Los 25 documentos de ejemplo

Según la documentación oficial, el dataset AKN4EU contiene una **"Reference Library"** de 25 documentos XML de ejemplo, incluyendo:
- Instancias AKN4EU 2.1 actualizadas a v3.0
- Nuevas instancias v3.0

**VEREDICTO:** Los 25 samples AKN existen y son descargables desde el portal EU Vocabularies. El portal es JavaScript-heavy (Liferay), lo que dificulta el scraping automático, pero la descarga manual funciona. **Estos son los únicos documentos AKN reales de legislación EU que existen públicamente.**

### LEOS — Legislation Editing Open Software (VERIFICADO Y ACTIVO)

| Recurso | URL | Status |
|---------|-----|--------|
| **Código fuente** | `https://code.europa.eu/leos/core` | ✅ Público, descargable |
| Archivo ZIP | `https://code.europa.eu/leos/core/-/archive/development/core-development.zip` | ✅ HTTP 200 |
| Joinup | `https://interoperable-europe.ec.europa.eu/collection/justice-law-and-security/solution/leos-open-source-software-editing-legislation` | ✅ Activo |
| GitHub mirror (viejo) | `https://github.com/l-e-x/leos` | Última release: 2019 |
| GitHub (MinBZK, Holanda) | `https://github.com/MinBZK/leos` | Archivado julio 2025 |

- **Licencia:** EUPL 1.2
- **Tech stack:** JavaScript (54.5%), Java (36.5%), HTML, CSS, XSLT
- **Produce AKN nativamente** — diseñado específicamente para "draft and edit legal texts in AkomaNtoso XML format"
- **Versión actual:** LEOS 4.0.1, con proyecto "Augmented LEOS" financiado por Digital Europe Programme
- **FOSDEM 2024:** Presentación confirmando desarrollo activo

**VEREDICTO:** LEOS es REAL, ACTIVO y PÚBLICO. Es la herramienta open-source de edición AKN más madura de cualquier gobierno. Potencialmente contiene lógica de conversión Formex→AKN en su código fuente.

### FMX2AK — Conversor Formex a AKN (INTERNO, NO PÚBLICO)

- Mencionado en documentación ISA2 "Digitising EU law production"
- Convierte de Formex V4 a AKN4EU
- **No se encontró código fuente público** en GitHub, code.europa.eu, ni como descarga
- Probablemente parte del toolchain interno de la Oficina de Publicaciones

**VEREDICTO:** FMX2AK es una herramienta INTERNA. Si queremos convertir Formex→AKN, tendríamos que: (a) construir nuestro propio conversor, (b) buscar lógica de conversión en el código de LEOS, o (c) esperar que lo publiquen.

---

## 3. SPARQL — Oficina de Publicaciones (VERIFICADO Y FUNCIONAL)

### Endpoint
`https://publications.europa.eu/webapi/rdf/sparql` — POST con `Accept: application/sparql-results+json`

### Resultados clave

#### Actos legislativos por tipo

| Tipo | Cantidad |
|------|----------|
| REG (Reglamentos) | 144,920 |
| DEC (Decisiones) | 23,863 |
| REG_IMPL (Reglamentos de implementación) | 14,593 |
| DIR (Directivas) | 7,724 |
| REG_DEL (Reglamentos delegados) | 3,382 |
| DIR_IMPL (Directivas de implementación) | 150 |
| **Total actos legislativos** | **194,632** |

#### Formatos disponibles en el sistema

| Formato | Manifestaciones | Notas |
|---------|----------------|-------|
| xhtml | 7,356,486 | El más común |
| **fmx4** | **6,921,004** | **Formex 4 — formato XML principal** |
| pdf (variantes) | ~11,700,000 | pdf, pdfa1a, pdfa1b, pdfa2a |
| xml | 499,460 | Genérico |
| **act** | **25,050** | Posiblemente relacionado con AKN |
| **ATTO** | **1,709** | Formato del editor de autoría EU |
| **DIFFREPORT** | **1,643** | Reportes de diferencias/comparación |
| SCHEMA_AKN4EU | (bajo) | Schema AKN4EU — no en top 50 |
| RULES_AKN4EU | (bajo) | Reglas de negocio AKN4EU |
| SCHEMA_AKN | (bajo) | Schema OASIS AKN base |

**Hallazgo importante:** Existen 3 tipos de formato AKN en el sistema (`SCHEMA_AKN4EU`, `RULES_AKN4EU`, `SCHEMA_AKN`), pero son definiciones de schema, no documentos legislativos. Los documentos legislativos reales están en `fmx4`.

#### Reglamentos por año (muestra)

| Año | Cantidad |
|-----|----------|
| 2026 | 56 (parcial, al 10 feb) |
| 2025 | 564 |
| 2024 | 535 |
| 2023 | 524 |
| 2016 | 589 |
| 2010 | 1,533 |
| 2007 | 1,933 |

#### GDPR — disponible en 24 idiomas

Cada idioma tiene exactamente 3 formatos: `fmx4`, `xhtml`, `pdfa1a`. Confirmado para: BUL, CES, DAN, DEU, ELL, ENG, EST, FIN, FRA, GLE, HRV, HUN, ITA, LAV, LIT, MLT, NLD, POL, POR, RON, SLK, SLV, SPA, SWE.

#### Quirk del CDM (ontología CELLAR)

Las propiedades en la ontología CDM usan dirección inversa:
- ✅ `cdm:expression_belongs_to_work` (no `cdm:work_has_expression`)
- ✅ `cdm:manifestation_manifests_expression` (no `cdm:expression_manifested_by_manifestation`)

### SPARQL queries útiles

```sparql
-- Contar actos legislativos por tipo
PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
SELECT ?type (COUNT(?work) AS ?count) WHERE {
  VALUES ?type {
    <http://publications.europa.eu/resource/authority/resource-type/REG>
    <http://publications.europa.eu/resource/authority/resource-type/DIR>
    <http://publications.europa.eu/resource/authority/resource-type/DEC>
    <http://publications.europa.eu/resource/authority/resource-type/REG_IMPL>
    <http://publications.europa.eu/resource/authority/resource-type/REG_DEL>
    <http://publications.europa.eu/resource/authority/resource-type/DIR_IMPL>
  }
  ?work cdm:work_has_resource-type ?type .
} GROUP BY ?type ORDER BY DESC(?count)
-- Resultado: 194,632 total

-- Buscar formatos AKN
PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
SELECT DISTINCT ?format WHERE {
  ?manif cdm:manifestation_type ?format .
  FILTER(CONTAINS(LCASE(STR(?format)), "akn"))
} LIMIT 20
-- Resultado: SCHEMA_AKN4EU, RULES_AKN4EU, SCHEMA_AKN

-- Idiomas y formatos del GDPR
PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
SELECT ?lang ?format WHERE {
  ?work cdm:resource_legal_id_celex "32016R0679"^^<http://www.w3.org/2001/XMLSchema#string> .
  ?expr cdm:expression_belongs_to_work ?work .
  ?expr cdm:expression_uses_language ?lang .
  OPTIONAL {
    ?manif cdm:manifestation_manifests_expression ?expr .
    ?manif cdm:manifestation_type ?format .
  }
} ORDER BY ?lang

-- Reglamentos por año
PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
SELECT ?year (COUNT(?work) AS ?count) WHERE {
  ?work cdm:work_has_resource-type <http://publications.europa.eu/resource/authority/resource-type/REG> .
  ?work cdm:work_date_document ?date .
  BIND(YEAR(?date) AS ?year)
} GROUP BY ?year ORDER BY DESC(?year) LIMIT 20

-- Todos los formatos del sistema
PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
SELECT DISTINCT ?format (COUNT(?manif) AS ?count) WHERE {
  ?manif cdm:manifestation_type ?format .
} GROUP BY ?format ORDER BY DESC(?count) LIMIT 50
```

---

## 4. Parlamento Europeo — API REST (VERIFICADO Y FUNCIONAL)

### data.europarl.europa.eu — API v2

| Recurso | URL | Status |
|---------|-----|--------|
| Portal Open Data | `https://data.europarl.europa.eu/` | ✅ Accesible |
| API v2 (OpenAPI) | `https://data.europarl.europa.eu/api/v2/` | ✅ Funcional |
| Datasets | `https://data.europarl.europa.eu/en/datasets` | ✅ Accesible |
| GitHub beta testing | `https://github.com/europarl/open-data-beta-testing` | ✅ Activo (updated Dec 2025) |

**Licencia:** CC BY 4.0
**Formato:** JSON-LD, RDF
**54 endpoints API** en 10 categorías:

| Categoría | Contenido |
|-----------|-----------|
| **MEPS** | Datos de eurodiputados, membresías |
| **MEPS DOCUMENTS** | Documentos por eurodiputado |
| **EP BODIES** | Órganos del Parlamento |
| **EP EVENTS** | Eventos parlamentarios |
| **EP MEETINGS** | Reuniones de comisiones y plenarias |
| **EP SPEECHES** | Intervenciones en debate |
| **EP PROCEDURES** | Procedimientos legislativos |
| **EP DOCUMENTS** | Documentos parlamentarios |
| **EXTERNAL DOCUMENTS** | Documentos externos |
| **EP VOCABULARIES** | Vocabularios controlados |

### Votaciones del Parlamento Europeo

| Fuente | URL | Formato | Notas |
|--------|-----|---------|-------|
| API v1 (votes) | `https://data.europarl.europa.eu/api/v1/plenary-documents?...` | JSON | Votaciones por MEP |
| HowTheyVote.eu | `https://howtheyvote.eu/` | JSON, CSV | Actualizado semanalmente |
| GitHub HowTheyVote | `https://github.com/HowTheyVote/data` | JSON/CSV | Updated 7 Feb 2026 |

### OEIL — Observatorio Legislativo

- URL: `https://oeil.europarl.europa.eu/`
- Fichas de procedimiento accesibles: `oeil/en/procedure-file?reference=2022/0047(COD)` → HTTP 200 (164 KB HTML)
- Contiene tracking completo de procedimientos legislativos desde la propuesta hasta la adopción

**Contiene:** MEPs con datos biográficos, votaciones roll-call, discursos en plenaria, procedimientos legislativos completos, documentos.
**No contiene:** Texto de leyes en formato estructurado (para eso hay que ir a EUR-Lex/Formex).

---

## 5. Consejo de la UE — Datos parcialmente abiertos (VERIFICACIÓN MIXTA)

### Recursos

| Recurso | URL | Status |
|---------|-----|--------|
| Búsqueda de votaciones | `https://www.consilium.europa.eu/en/.../voting-results/` | ⚠️ 403 (requiere navegador) |
| SPARQL endpoint | `https://data.consilium.europa.eu/sparql` | Documentado, requiere prueba |
| API REST | `https://www.consilium.europa.eu/api/VotingResults/search?...` | ⚠️ 403 (Cloudflare) |
| Open data portal | `https://data.consilium.europa.eu/` | Documentado en búsquedas |

### Lo que encontramos

- **Votaciones del Consejo** existen en formato RDF/CSV/JSON según la documentación
- El modelo sigue un enfoque "data cube"
- **Acceso programático bloqueado:** Los endpoints del Consejo retornan 403 (protección Cloudflare/WAF), requieren navegador real
- El SPARQL endpoint de data.consilium.europa.eu debería funcionar para queries de votaciones

**Contiene:** Votaciones del Consejo sobre actos legislativos (desde 2009), posiciones adoptadas.
**No contiene:** Texto de las modificaciones del Consejo en formato estructurado.

---

## 6. Open Data Portal de la UE — data.europa.eu (VERIFICADO)

| Recurso | URL | Status |
|---------|-----|--------|
| Portal principal | `https://data.europa.eu/` | ✅ Accesible |
| SPARQL endpoint | `https://data.europa.eu/sparql` | ✅ Accesible (200) |
| Dataset Council votes | `https://data.europa.eu/data/datasets/council-votes-on-legislative-acts` | ✅ Accesible (200) |

El portal agrega datasets de todas las instituciones EU. Contiene datasets legislativos incluyendo las votaciones del Consejo.

---

## 7. Mapa de lo que existe vs lo que falta

```
┌─────────────────────────────────────────────────────────────────────┐
│            FORMEX 4 — FORMATO XML PRINCIPAL DE LA UE               │
│              (~6.9 millones de manifestaciones)                     │
├─────────────────────────────────────────────────────────────────────┤
│ ✅ Reglamentos (144,920 works)                                     │
│ ✅ Decisiones (23,863)                                             │
│ ✅ Directivas (7,724)                                              │
│ ✅ Reglamentos de implementación (14,593)                          │
│ ✅ Reglamentos delegados (3,382)                                   │
│ ✅ Versiones consolidadas (73,210 CONS_TEXT)                       │
│ ✅ Corrigendums (28,619)                                           │
│ ✅ 24 idiomas por documento                                        │
│ ✅ Texto completamente estructurado (artículos, párrafos, listas)  │
│ ✅ Cross-references (REF.DOC.OJ)                                   │
│ ✅ Historial desde años 50 hasta feb 2026                          │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│              AKN4EU — EXISTE PERO NO EN PRODUCCIÓN                  │
├─────────────────────────────────────────────────────────────────────┤
│ 🔄 25 documentos AKN de ejemplo (descargables de op.europa.eu)     │
│ 🔄 XSD schemas AKN4EU (descargables)                               │
│ 🔄 LEOS produce AKN nativamente (código open-source)               │
│ 🔄 FMX2AK conversor existe internamente (NO público)               │
│ 🔄 SCHEMA_AKN4EU registrado en CELLAR (schema, no docs)            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│             DATOS PARLAMENTARIOS — APIs FUNCIONALES                 │
├─────────────────────────────────────────────────────────────────────┤
│ ✅ EP: 54 endpoints API v2 (MEPs, votaciones, discursos, docs)     │
│ ✅ EP: Roll-call votes en JSON/CSV (HowTheyVote.eu)                │
│ ✅ EP: OEIL tracking de procedimientos legislativos                 │
│ ⚠️ Consejo: Votaciones en RDF/SPARQL (acceso WAF)                 │
│ ⚠️ Consejo: Web scraping bloqueado por Cloudflare                 │
│ ✅ data.europa.eu: Portal agregador con SPARQL                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                  LO QUE FALTA / NO EXISTE                          │
├─────────────────────────────────────────────────────────────────────┤
│ ❌ EUR-Lex NO sirve AKN (solo Formex, XHTML, PDF)                  │
│ ❌ FMX2AK conversor NO es público                                   │
│ ❌ No hay corpus público de legislación EU en AKN                   │
│ ❌ No hay enmiendas en formato XML estructurado público             │
│ ❌ changeSet / AKN Diff (lo que propone este proyecto)              │
│ ❌ Comparado computable entre versiones de directivas/reglamentos   │
│ ❌ Links mecánicos entre votaciones EP/Consejo y texto legislativo  │
│ ❌ Texto de modificaciones del Consejo en formato estructurado      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 8. Propuesta de POC: GDPR (Regulation 2016/679)

### Por qué el GDPR

1. **El reglamento más conocido de la UE** — máximo impacto comunicacional
2. **Ya descargado en Formex** en inglés y español (428 KB y 467 KB)
3. **99 artículos, 173 considerandos** — suficiente complejidad
4. **Versión consolidada disponible** — permite mostrar diferencias entre original y consolidado
5. **Disponible en 24 idiomas** — demuestra capacidad multilingüe
6. **Historial legislativo rastreable** — propuesta de la Comisión → enmiendas EP → posición del Consejo → texto final

### Pasos del POC

1. Descargar Formex del GDPR (original + consolidado) ✅ ya hecho
2. Descargar los 25 samples AKN4EU de op.europa.eu
3. Examinar el código de LEOS para encontrar lógica de conversión Formex→AKN
4. Construir conversor Formex→AKN3.0 usando:
   - AKN4EU XSD como target schema
   - Mapeo de elementos documentado arriba
   - Samples AKN4EU como referencia de output esperado
5. Convertir GDPR Formex → AKN 3.0
6. Descargar propuesta original de la Comisión (COM(2012)11) en Formex
7. Descargar posición del EP en primera lectura
8. Generar `changeSet` AKN Diff entre versiones
9. Integrar votaciones del EP vía API (roll-call votes del GDPR)
10. Visualizar en la plataforma: original → enmiendas EP → posición Consejo → texto final

### Estimación de dificultad

| Tarea | Dificultad | % Automatizable |
|-------|-----------|-----------------|
| Descargar Formex (EUR-Lex) | Trivial | 100% script |
| Descargar samples AKN4EU | Trivial | 100% manual |
| Analizar código LEOS para conversión | Media | 0% — lectura de código |
| Construir conversor Formex→AKN | **Alta** | ~60% mecánico + XSLT |
| Convertir GDPR a AKN 3.0 | Media | ~80% con conversor |
| Rastrear historial legislativo | Alta | ~40% SPARQL + manual |
| Integrar votaciones EP | Media | ~70% API + script |
| Generar changeSet entre versiones | **Alta** | ~50% AI + revisión |

---

## 9. Archivos descargados

Todos en [samples/](samples/):

| Archivo | Fuente | Formato | Tamaño | Contenido |
|---------|--------|---------|--------|-----------|
| `gdpr-formex4-direct.xml` | CELLAR/OJ | **Formex 4** `<ACT>` | 428 KB | GDPR completo EN, 99 artículos |
| `gdpr-formex4-es.xml` | CELLAR/OJ | **Formex 4** `<ACT>` | 467 KB | GDPR completo ES |
| `gdpr-consolidated-formex.zip` | CELLAR | **Formex 4** `<CONS.ACT>` | 50 KB zip → 262 KB | GDPR consolidado |
| `gdpr-xhtml.html` | EUR-Lex | XHTML | 809 KB | GDPR renderizado HTML |
| `dublin3-formex4.xml` | CELLAR/OJ | **Formex 4** `<ACT>` | 142 KB | Dublin III Regulation |
| `aiact-formex4.zip` | CELLAR/OJ | **Formex 4** (4 files) | 32 KB zip → 129 KB | Interoperable Europe Act |
| `L_202400903EN.000101.fmx.xml` | Extraído del zip | **Formex 6.0** `<ACT>` | 124 KB | Cuerpo principal |
| `L_202400903EN.002601.fmx.xml` | Extraído del zip | **Formex 6.0** `<ANNEX>` | 1.9 KB | Anexo |
| `L_202400903EN.doc.fmx.xml` | Extraído del zip | **Formex 6.0** `<DOC>` | 1.9 KB | Metadata wrapper |
| `L_202400903EN.toc.fmx.xml` | Extraído del zip | **Formex 6.0** `<PUBLICATION>` | 1.0 KB | Tabla de contenidos |
| `eurlex-gdpr-32016R0679.xml` | EUR-Lex | **NOTICE XML** (metadata) | 1.8 MB | Metadata CELLAR del GDPR |
| `eurlex-aiact-32024R0903.xml` | EUR-Lex | **NOTICE XML** (metadata) | 1.3 MB | Metadata CELLAR del AI Act |
| `eurlex-dublin3-32012R0604.xml` | EUR-Lex | **NOTICE XML** (metadata) | 916 KB | Metadata CELLAR Dublin III |
| `eurlex-gdpr-32016R0679-es.xml` | EUR-Lex | **NOTICE XML** (metadata) | 1.8 MB | Metadata CELLAR GDPR ES |
| `eurlex-gdpr-32016R0679-formex.xml` | EUR-Lex | **NOTICE XML** (metadata) | 1.8 MB | Metadata CELLAR GDPR |

Reportes auxiliares generados:
- [akn4eu-ecosystem-research.md](akn4eu-ecosystem-research.md) — Investigación detallada de AKN4EU, LEOS, FMX2AK

---

## 10. Conclusión — UE vs Chile

### Comparación directa

| Aspecto | Chile | UE |
|---------|-------|-----|
| **Documentos AKN existentes** | **34,936 en AKN 2.0** ✅ | **0 públicos** (25 samples) ❌ |
| **Formato XML principal** | AKN 2.0 (BCN) + XML propietario (Senado/Cámara) | **Formex 4** (~6.9M manifestaciones) |
| **Actos legislativos totales** | ~347,000 normas (LeyChile) | **~194,632** actos (REG/DIR/DEC) |
| **Idiomas** | 1 (español) | **24** |
| **APIs funcionales** | 3 (BCN, Senado, Cámara) | **54 endpoints** EP + SPARQL + CELLAR |
| **Votaciones nominales** | ✅ Por senador/diputado | ✅ Por MEP (EP) + por país (Consejo) |
| **Editor AKN open-source** | No existe | **LEOS** (code.europa.eu) ✅ |
| **Conversor a AKN** | No necesario (ya es AKN) | FMX2AK existe pero es **interno** ❌ |
| **Versiones consolidadas** | Solo en LeyChile (XML propietario) | ✅ 73,210 textos consolidados en Formex |
| **FRBR / identificadores** | URIs resolvibles en datos.bcn.cl | **ELI** (European Legislation Identifier) ✅ |
| **SPARQL funcional** | ✅ datos.bcn.cl/sparql | ✅ publications.europa.eu/webapi/rdf/sparql |

### Evaluación honesta

**Chile es más fácil para un POC inmediato.** Ya tiene 34,936 documentos AKN reales. El trabajo es upgrade 2.0→3.0 + integración. Podrías tener algo mostrando en semanas.

**La UE requiere un paso extra crítico: construir el conversor Formex→AKN.** Esto es un proyecto en sí mismo. Sin embargo, una vez resuelto ese paso:
- La cantidad de datos es masiva (194K actos legislativos en 24 idiomas)
- La infraestructura de APIs es superior (EP tiene 54 endpoints profesionales)
- Las versiones consolidadas permiten generar changeSets directamente
- El impacto comunicacional es enormemente mayor

### Qué tiene la UE que Chile no tiene
1. **Multilingüismo** — 24 idiomas oficiales con traducciones paralelas
2. **ELI** — European Legislation Identifier, un sistema URI estandarizado para citar legislación
3. **LEOS** — un editor open-source que produce AKN nativamente
4. **Versiones consolidadas Formex** — permiten reconstruir el historial de cambios
5. **APIs modernas** — JSON-LD, OpenAPI, CC BY 4.0
6. **DIFFREPORT** — el sistema ya produce 1,643 reportes de diferencias (formato interno)

### Qué le falta a la UE que Chile sí tiene
1. **Documentos AKN reales** — Chile tiene 34,936; la UE tiene 25 samples
2. **Acceso directo al XML legislativo** — en Chile descargas AKN con un GET, en la UE necesitas navegar RDF→manifestación→item
3. **Simplicidad** — Chile tiene 3 fuentes de datos; la UE tiene una maraña de portales, ontologías y formatos

### Recomendación

**Hacer ambos POCs en paralelo:**
1. **Chile primero** — POC rápido con AKN 2.0→3.0 del Boletín 18036-05 (semanas)
2. **UE segundo** — POC del GDPR, empezando por clonar LEOS y estudiar su conversor Formex→AKN antes de construir el nuestro (meses)

El verdadero diferencial de valor para la UE sería: tomar el GDPR, reconstruir su historial legislativo completo (propuesta Comisión → enmiendas EP → posición Consejo → texto final), convertirlo todo a AKN 3.0, y mostrar en la plataforma el comparado (changeSet) de cada paso del proceso. **Eso no existe en ningún lugar del mundo hoy.**
