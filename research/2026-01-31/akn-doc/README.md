# Akoma Ntoso / LegalDocML — Documentación oficial

## Qué es

Akoma Ntoso ("corazones enlazados" en Akan) es el estándar internacional XML para representar documentos parlamentarios, legislativos y judiciales. Fue ratificado como **OASIS Standard** en agosto 2018 bajo el nombre formal "LegalDocML".

- Namespace XML: `http://docs.oasis-open.org/legaldocml/ns/akn/3.0`
- Editores principales: Monica Palmirani, Fabio Vitali (U. Bologna), Roger Sperberg, Grant Vergottini

## Versionado (confuso pero importante)

Hay dos numeraciones paralelas que generan confusión:

| Concepto | Versión | Fecha | Estado |
|----------|---------|-------|--------|
| **OASIS Standard** (el estándar formal) | v1.0 | Agosto 2018 | Vigente |
| **XML Schema** (el .xsd dentro del estándar) | AKN 3.0 | Marzo 2017 | En uso |
| **Committee Specification Draft** (nuevo) | CSD13 / AKN 3.0 | Junio 2025 | Draft, no publicado aún |

El estándar OASIS v1.0 usa internamente el schema XML llamado "akomantoso30.xsd". El "3.0" del schema es la versión del vocabulario XML, no del estándar OASIS. En junio 2025 se aprobó un Committee Specification Draft para una nueva release del schema 3.0, pero aún no está publicado en docs.oasis-open.org.

## Contenido de esta carpeta

```
akn-doc/
├── README.md                          ← Este archivo
├── v1.0-standard/                     ← OASIS Standard v1.0 (agosto 2018) — VIGENTE
│   ├── akn-core-v1.0-os-part1-vocabulary.pdf    Part 1: XML Vocabulary (narrativo)
│   ├── akn-core-v1.0-os-part1-vocabulary.html   Part 1: versión HTML
│   ├── akn-core-v1.0-os-part2-specs.html        Part 2: Specifications (técnico)
│   ├── schemas/
│   │   ├── akomantoso30.xsd           ← EL schema principal
│   │   └── xml.xsd                    Schema auxiliar
│   └── examples/                      Ejemplos oficiales de distintos países
│       ├── cl_Sesion56_2.xml          Chile: sesión parlamentaria
│       ├── eu_COM-2013-0619_EN-8.xml  UE: documento COM
│       ├── it_senato_ddl_2013.xml     Italia: proyecto de ley del Senado
│       ├── ke_Debate_Bungeni_2011.xml Kenya: debate parlamentario
│       ├── uk_pga-2014-27-enacted.xml UK: ley promulgada
│       ├── us_Act_2011-11-29.xml      USA: acto legislativo
│       ├── us_Title9-Chap3-eng.xml    USA: título del US Code
│       ├── uy_bill_2010-09-27.xml     Uruguay: proyecto de ley
│       ├── za_Judgement_2008.xml       Sudáfrica: sentencia judicial
│       └── za_bill_2006-12-23.xml     Sudáfrica: proyecto de ley
├── naming-convention/                 ← Naming Convention v1.0 (febrero 2019)
│   ├── akn-nc-v1.0-os.html           Cómo construir URIs e identificadores
│   └── akn-nc-v1.0-os.pdf            Versión PDF
├── v3.0-draft/                        ← AKN 3.0 CSD13 (junio 2025) — AÚN NO PUBLICADO
│   └── (vacío — el draft fue aprobado pero no publicado en docs.oasis-open.org)
└── github-repo/                       ← Clon del repo OASIS en GitHub (desactualizado, 2017)
```

## URLs oficiales

### Documentación vigente (v1.0 OASIS Standard)

- Part 1 (Vocabulary): https://docs.oasis-open.org/legaldocml/akn-core/v1.0/os/part1-vocabulary/akn-core-v1.0-os-part1-vocabulary.html
- Part 2 (Specs): https://docs.oasis-open.org/legaldocml/akn-core/v1.0/os/part2-specs/akn-core-v1.0-os-part2-specs.html
- Naming Convention: https://docs.oasis-open.org/legaldocml/akn-nc/v1.0/os/akn-nc-v1.0-os.html
- Schema XSD: https://docs.oasis-open.org/legaldocml/akn-core/v1.0/os/part2-specs/schemas/akomantoso30.xsd
- Ejemplos: https://docs.oasis-open.org/legaldocml/akn-core/v1.0/os/part2-specs/examples/

### TC y comunidad

- OASIS TC home: https://www.oasis-open.org/committees/tc_home.php?wg_abbrev=legaldocml
- GitHub repo: https://github.com/oasis-open/legaldocml-akomantoso
- Sitio informativo: http://akomantoso.info/

### Draft v3.0 (en progreso)

- Namespace: https://docs.oasis-open.org/legaldocml/ns/akn/3.0/
- Minuta de aprobación CSD13 (junio 2025): https://groups.oasis-open.org/discussion/minutes-committee-specification-draft-release-akn-akoma-ntoso-30-11-june-2025-uploaded

## Perfiles nacionales derivados de AKN

| Perfil | País | Relación con AKN |
|--------|------|------------------|
| CLML | UK | Formato propio, convierte dinámicamente a AKN 3.0 |
| USLM | USA | "Second generation" derivado de AKN |
| LegalDocML.de | Alemania | Subesquema restrictivo de AKN, obligatorio desde 2027 |
| LexML-BR | Brasil | Derivado con elementos en portugués, no interoperable directo |
| AKN4EU | UE | Perfil en desarrollo (work in progress) |
| Monalisa | Francia (Sénat) | Usa AKN directamente desde 2019 |
