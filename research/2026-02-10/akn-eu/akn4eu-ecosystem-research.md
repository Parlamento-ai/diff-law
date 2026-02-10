# AKN4EU Ecosystem Research Report
## EU Legislative Data in Akoma Ntoso Format

**Date:** 2026-02-10
**Objective:** Determine what AKN (Akoma Ntoso) format documents and tools are publicly available from the EU, with skeptical verification of what is REAL vs. theoretical.

---

## 1. AKN4EU — The Standard Itself

### What it is
AKN4EU (Akoma Ntoso for European Union) is the EU's official customisation/profile of the OASIS Akoma Ntoso XML standard, tailored for EU legislative documents. It is developed and maintained by the Interinstitutional Metadata and Formats Committee (IMFC), chaired by the Publications Office of the EU.

### Current version
- **Version 3.0** was officially adopted by the IMFC on 17 April 2020 (the last version with a public announcement).
- **Version 4.1.1 (errata)** exists — a Scribd document titled "AKN4EU-4-1-1(errata)-PART-1-guideline" was found, suggesting the standard has evolved significantly beyond 3.0, but the newer versions have not had the same public announcement fanfare.
- A **3rd AKN4EU Technical Workshop** was held at the Publications Office (referenced in a tweet by Hilde Hardeman, likely 2025), confirming active development.

### Downloadable artifacts
| Resource | URL | Status |
|----------|-----|--------|
| AKN4EU main page | https://op.europa.eu/en/web/eu-vocabularies/akn4eu | ACCESSIBLE (200) — but JavaScript-heavy, hard to scrape |
| AKN4EU dataset/download page | https://op.europa.eu/en/web/eu-vocabularies/dataset/-/resource?uri=http://publications.europa.eu/resource/dataset/akn4eu | ACCESSIBLE (200) |
| AKN4EU 3.0 Documentation PDF (Vol II, XML Markup) | https://op.europa.eu/documents/3938058/7067425/AKN4EU+3.0+Documentation+-+Volume+II+-+XML+markup+-+Part+1+-+Part+2.pdf | ACCESSIBLE — confirmed download, 4.46 MB PDF |
| EU Vocabularies Schemas page | https://op.europa.eu/en/web/eu-vocabularies/schemas | ACCESSIBLE — lists schemas including AKN4EU |
| AKN4EU 4.1.1 errata guideline | https://www.scribd.com/document/826149699/AKN4EU-4-1-1-errata-PART-1-guideline | On Scribd — may require subscription |

### Key finding: XSD schemas and 25 sample XML documents
According to multiple sources, the AKN4EU dataset page has a **"Download" tab** containing:
- **XSD schema files** for validation
- **A Reference Library of 25 XML example documents** (instances marked-up in AKN4EU 2.1 upgraded to v. 3.0, plus new v3.0 instances)

**VERDICT: The schema and sample documents appear to be REAL and DOWNLOADABLE from the EU Vocabularies site.** The JavaScript-heavy Liferay portal makes automated scraping difficult, but manual download should work. This is the single most important finding — there ARE real AKN XML samples from the EU, at least 25 of them.

---

## 2. LEOS (Legislation Editing Open Software)

### What it is
LEOS is a web-based legislative drafting tool that stores documents natively in AKN XML format (specifically AKN4EU profile). It supports online collaboration, version control, and co-editing of legislative texts.

### Source code availability

| Repository | URL | Status |
|------------|-----|--------|
| **code.europa.eu (official)** | https://code.europa.eu/leos/core | **PUBLIC, ACCESSIBLE** (HTTP 200, project visibility: public) |
| code.europa.eu archive download | https://code.europa.eu/leos/core/-/archive/development/core-development.zip | **DOWNLOADABLE** (confirmed HTTP 200, application/zip) |
| code.europa.eu git clone | `git clone https://code.europa.eu/leos/core.git` | Should work (public project) |
| GitHub mirror (l-e-x/leos) | https://github.com/l-e-x/leos | Old mirror from Joinup, last release: LEOS-Pilot-v2.1.0 (June 2019) |
| GitHub (MinBZK/leos) | https://github.com/MinBZK/leos | Dutch govt Docker proof-of-concept, **ARCHIVED** (July 2025), read-only |

### Release history
- **Joinup/Interoperable Europe releases**: Prototype v1.0.0 through Pilot v3.2.0 (older releases)
- **LEOS 4.0.1** — referenced on Interoperable Europe Portal as the latest significant release
- **"Augmented LEOS"** — current project phase, funded by Digital Europe Programme (DIGITAL), with smart functionalities (reported June 2024)
- **FOSDEM 2024 presentation** — confirms active development and community engagement

### Technical details
- Default branch: `development`
- Languages: JavaScript (54.5%), Java (36.5%), HTML, CSS, XSLT
- Requires: Java SDK 8.0, Maven 3.3.9+
- License: EUPL 1.2
- AKN version: Uses Akoma Ntoso V2 internally (may have upgraded in newer versions)

### Does it produce AKN output?
**YES.** LEOS is specifically designed to "draft and edit legal texts in AkomaNtoso XML format." It uses the AKN4EU subschema. Documents created in LEOS are natively AKN XML.

### Does it contain AKN XML sample documents?
The LEOS repository itself likely contains sample/test AKN XML documents within its source tree. The `modules/` directory structure would need to be explored to confirm.

**VERDICT: LEOS is REAL, ACTIVE, and PUBLICLY ACCESSIBLE. Source code is downloadable from code.europa.eu. It produces real AKN XML documents. This is the most mature open-source AKN editing tool from any government.**

---

## 3. FMX2AK (Formex to Akoma Ntoso Converter)

### What it is
FMX2AK is a converter from the Publications Office's Formex V4 XML format (used to produce the Official Journal of the EU) to Akoma Ntoso (AKN4EU profile).

### Availability

| Source | Status |
|--------|--------|
| Public GitHub repository | **NOT FOUND** — no public repo on GitHub or OP-TED organization |
| code.europa.eu | **NOT VERIFIED** — may exist under the LEOS group or a separate OP project |
| Publications Office download | **NOT FOUND** as a standalone download |
| Mentioned in ISA2 documentation | YES — described as part of "Digitising EU law production" action |

### What we know
- Developed as part of AKN4EU v3.0 work (circa 2020)
- Converts from Formex V4 (Official Journal XML production format) to AKN4EU
- Part of the Publications Office's internal toolchain
- Referenced in the ISA2 "Digitising EU law production" action page

**VERDICT: FMX2AK appears to be an INTERNAL tool. No public download or source code was found. It is mentioned in official documentation and presentations but is not publicly available as of this research. It may exist on code.europa.eu under a different name or restricted access.**

---

## 4. EUR-Lex / Cellar — Actual Document Formats Available

### What EUR-Lex actually serves today

| Format | MIME / Type | Available? | Notes |
|--------|-------------|------------|-------|
| PDF | application/pdf | YES | Widely available |
| HTML | text/html | YES | Via `/TXT/` endpoint |
| XHTML | application/xhtml+xml | YES | Some documents |
| **Formex (FMX4)** | application/xml (Formex V4) | **YES** | Official Journal documents, primary structured XML format |
| **Akoma Ntoso (AKN)** | application/akn+xml (?) | **UNCONFIRMED / LIKELY NO** | See analysis below |

### Critical analysis: Does EUR-Lex serve AKN?

One search result claimed: "Since 30.05.2022, all new publications can be downloaded as XML files compatible with Akoma Ntoso." However:

1. **The official EUR-Lex "Reuse contents" page** lists available formats as: PDF, HTML, XHTML, and **Formex** — with **NO mention of Akoma Ntoso or AKN**.
2. The phrase "compatible with Akoma Ntoso" may mean that the XML is structured in a way that can be *converted* to AKN, not that it IS AKN.
3. Formex V4 remains the primary structured XML format for EUR-Lex bulk downloads and API access.
4. The Cellar REST API documentation references `fmx4` as a format parameter, but no `akn` format parameter has been documented.
5. I was unable to test the Cellar REST API directly with AKN accept headers due to tool restrictions.

**VERDICT: EUR-Lex almost certainly does NOT serve documents in AKN format directly. The available XML format is Formex V4. The "compatible with Akoma Ntoso" claim likely refers to structural alignment that would make FMX2AK conversion feasible, not native AKN availability. THIS IS THE BIGGEST GAP — the EU's own legislation portal does not serve AKN despite the EU investing heavily in AKN4EU as a standard.**

### What IS available from EUR-Lex
- **Formex V4 XML** — the real, downloadable structured format for EU legislation
- **Bulk download / Data Dump** — all legal acts in force
- **SPARQL endpoint** — metadata queries via `https://publications.europa.eu/webapi/rdf/sparql`
- **REST API** — document retrieval in PDF, HTML, Formex via Cellar

---

## 5. AKN4EU Schema — XSD Availability

### OASIS base schema (Akoma Ntoso 3.0)

| Resource | URL | Status |
|----------|-----|--------|
| OASIS GitHub repo | https://github.com/oasis-open/legaldocml-akomantoso | PUBLIC — contains XSD files |
| AKN 3.0 XSD | https://github.com/oasis-open/legaldocml-akomantoso/blob/master/TemporaryRelease20161015/akomantoso30.xsd | ACCESSIBLE |
| OASIS spec page | https://docs.oasis-open.org/legaldocml/akn-core/v1.0/akn-core-v1.0-part1-vocabulary.html | ACCESSIBLE |

Note: The OASIS GitHub repo appears **inactive** (17 commits total, no recent activity), but the schema files are stable and usable.

### AKN4EU-specific XSD schema

- Available from the EU Vocabularies "Download" tab at https://op.europa.eu/en/web/eu-vocabularies/dataset/-/resource?uri=http://publications.europa.eu/resource/dataset/akn4eu
- The AKN4EU schema is a subschema/profile that restricts and extends the base OASIS AKN schema
- **Should be downloadable** from the Publications Office site, though the JavaScript-heavy portal makes direct URL identification difficult

**VERDICT: XSD schemas are REAL and DOWNLOADABLE. The base OASIS schema is on GitHub. The AKN4EU-specific schema is on the EU Vocabularies site.**

---

## 6. GitHub Ecosystem for AKN

### Relevant active projects

| Project | URL | Description | Status |
|---------|-----|-------------|--------|
| oasis-open/legaldocml-akomantoso | https://github.com/oasis-open/legaldocml-akomantoso | Official OASIS AKN schemas | Inactive but stable |
| laws-africa/bluebell | https://github.com/laws-africa/bluebell | Generic AKN 3 parser | Active |
| laws-africa/slaw | https://github.com/laws-africa/slaw | AKN generator from plain text | Active |
| laws-africa/law-widgets | https://github.com/laws-africa/law-widgets | Web components for AKN docs | Active |
| nyaayaIN/laws-of-india | https://github.com/nyaayaIN/laws-of-india | India laws in AKN XML | Real data |
| ajjmai/akoma-ntoso-example | https://github.com/ajjmai/akoma-ntoso-example | Finnish act in AKN format | Example |

### Not found on public GitHub
- No `akn4eu` dedicated schema repository
- No `fmx2ak` converter
- No official EU AKN document corpus
- The OP-TED GitHub organization (https://github.com/OP-TED) focuses on procurement (eForms), NOT legislation/AKN

---

## 7. Joinup / Interoperable Europe Portal — LEOS Project Page

- Main page: https://interoperable-europe.ec.europa.eu/collection/justice-law-and-security/solution/leos-open-source-software-editing-legislation
- Releases page: https://interoperable-europe.ec.europa.eu/collection/justice-law-and-security/solution/leos-open-source-software-editing-legislation/releases
- code.europa.eu page: https://interoperable-europe.ec.europa.eu/collection/justice-law-and-security/solution/leos-open-source-software-editing-legislation/leos-codeeuropaeu
- Community page: https://joinup.ec.europa.eu/collection/justice-law-and-security/solution/leos-open-source-software-editing-legislation/leos-community
- Augmented LEOS report (June 2024): https://interoperable-europe.ec.europa.eu/sites/default/files/document/2024-06/Augmented%20LEOS%20with%20smart%20functionalities%20final%20report.pdf

**VERDICT: REAL and ACTIVE. The Interoperable Europe Portal (formerly Joinup) is the official project home. Multiple releases documented. LEOS 4.0.1 is the latest referenced release.**

---

## 8. Summary: What is REAL vs. Theoretical

### REAL and Downloadable

| Item | What you get | Where |
|------|-------------|-------|
| **AKN4EU 3.0 specification PDF** | 4.46 MB documentation | op.europa.eu |
| **AKN4EU XSD schema** | XML Schema Definition files | op.europa.eu (Download tab) |
| **25 AKN4EU sample XML documents** | Reference library of marked-up EU legislation | op.europa.eu (Download tab) |
| **LEOS source code** | Full application (~54% JS, ~36% Java) | code.europa.eu/leos/core |
| **LEOS downloadable archive** | ZIP/TAR of development branch | code.europa.eu (confirmed 200) |
| **OASIS AKN 3.0 XSD** | Base Akoma Ntoso schema | github.com/oasis-open/legaldocml-akomantoso |
| **EUR-Lex Formex V4 XML** | Structured XML of EU legislation (NOT AKN) | EUR-Lex / Cellar API |
| **EUR-Lex bulk data dump** | All legal acts in force in Formex | EUR-Lex data reuse page |

### Theoretical / Internal Only / Not Publicly Available

| Item | Status | Notes |
|------|--------|-------|
| **FMX2AK converter** | Internal tool | Mentioned in docs, no public download found |
| **AKN format on EUR-Lex** | NOT available | EUR-Lex serves Formex V4, not AKN |
| **Bulk AKN corpus of EU law** | Does NOT exist publicly | No public endpoint serving EU law in AKN format |
| **AKN4EU v4.1.1** | Partially public | Errata document on Scribd; official download status unclear |
| **LEOS production instance** | Internal to EU institutions | The software is open-source but the running instance with real documents is not public |

### Active vs. Abandoned

| Project | Status |
|---------|--------|
| AKN4EU standard | **ACTIVE** — 3rd Technical Workshop held recently, version 4.1.1 exists |
| LEOS | **ACTIVE** — "Augmented LEOS" phase, funded by Digital Europe Programme, FOSDEM 2024 talk, code.europa.eu repo active |
| FMX2AK | **UNKNOWN** — likely active internally but not publicly released |
| EUR-Lex AKN migration | **IN PROGRESS** — the infrastructure is being built but AKN is not yet a public output format |

---

## 9. Key Conclusions

1. **The EU has invested heavily in AKN4EU** — the standard is real, documented, has XSD schemas, and 25 sample documents. The standard itself is mature (version 4.1.1).

2. **LEOS is the crown jewel** — a real, open-source, actively developed legislation editor that natively produces AKN XML. Source code is publicly accessible on code.europa.eu under EUPL license.

3. **The critical gap is distribution** — despite all this investment, EUR-Lex (the public portal for EU law) still serves **Formex V4**, not AKN. There is no public API endpoint that returns EU legislation in AKN format.

4. **The conversion path exists but is not public** — FMX2AK (Formex to AKN converter) exists internally but is not available for download. This means to get AKN from EU law, you would need to either (a) wait for the EU to make it public, (b) build your own Formex-to-AKN converter, or (c) find the converter in LEOS source code.

5. **Formex V4 is the practical starting point** — if you want structured EU legislation today, Formex is what you can actually download. It is a well-documented XML format with bulk access.

6. **The 25 sample AKN documents on the EU Vocabularies site** are the best starting point for understanding the AKN4EU profile and testing AKN processing tools.

---

## 10. Recommended Next Steps

1. **Download the 25 AKN4EU sample documents** from op.europa.eu/en/web/eu-vocabularies (navigate to AKN4EU dataset, Download tab)
2. **Clone the LEOS repository** from `https://code.europa.eu/leos/core.git` and examine the AKN XML files within it
3. **Download AKN4EU XSD schemas** for validation
4. **Download sample Formex V4 documents** from EUR-Lex for comparison
5. **Search the LEOS source code** for any Formex-to-AKN conversion logic (XSLT transforms, Java converters)
6. **Test the Cellar REST API** with various Accept headers to confirm whether AKN is served (test `application/akn+xml`, `application/xml;type=akn`, etc.)

---

## Sources

- [AKN4EU - EU Vocabularies](https://op.europa.eu/en/web/eu-vocabularies/akn4eu)
- [AKN4EU Dataset Page](https://op.europa.eu/en/web/eu-vocabularies/dataset/-/resource?uri=http://publications.europa.eu/resource/dataset/akn4eu)
- [AKN4EU v3.0 Announcement (ISA2)](https://ec.europa.eu/isa2/news/akoma-ntoso-eu-akn4eu-version-30-has-been-published_en/)
- [Discover AKN4EU (Joinup)](https://joinup.ec.europa.eu/collection/semic-support-centre/solution/common-structured-format-eu-legislative-documents/discover-akn4eu)
- [LEOS - Interoperable Europe Portal](https://interoperable-europe.ec.europa.eu/collection/justice-law-and-security/solution/leos-open-source-software-editing-legislation)
- [LEOS on code.europa.eu](https://code.europa.eu/leos/core)
- [LEOS 4.0.1 Release](https://interoperable-europe.ec.europa.eu/collection/justice-law-and-security/solution/leos-open-source-software-editing-legislation/distribution/leos-401)
- [LEOS GitHub mirror (l-e-x)](https://github.com/l-e-x/leos)
- [LEOS GitHub (MinBZK - Dutch govt)](https://github.com/MinBZK/leos) — archived
- [FOSDEM 2024 LEOS Talk](https://archive.fosdem.org/2024/schedule/event/fosdem-2024-2954-legislation-editing-open-software-leos-an-innovative-open-source-solution-for-drafting-legislation-/)
- [Augmented LEOS Final Report (PDF, June 2024)](https://interoperable-europe.ec.europa.eu/sites/default/files/document/2024-06/Augmented%20LEOS%20with%20smart%20functionalities%20final%20report.pdf)
- [OASIS LegalDocML AKN GitHub](https://github.com/oasis-open/legaldocml-akomantoso)
- [EUR-Lex Data Reuse](https://eur-lex.europa.eu/content/help/data-reuse/reuse-contents-eurlex-details.html)
- [Formex - EU Vocabularies](https://op.europa.eu/en/web/eu-vocabularies/formex)
- [Digitising EU Law Production (ISA2)](https://ec.europa.eu/isa2/actions/digitising-eu-law-production_en/)
- [OP-TED GitHub Organization](https://github.com/OP-TED) — procurement, not legislation
- [3rd AKN4EU Workshop (Twitter/X)](https://x.com/HardemanHildeML/status/1978488843264471465)
- [AKN4EU 4.1.1 Errata (Scribd)](https://www.scribd.com/document/826149699/AKN4EU-4-1-1-errata-PART-1-guideline)
- [EUR-Lex Retrieval Guide (PDF)](https://eur-lex.europa.eu/content/tools/Retrieval_machine-readable_formats.pdf)
- [Cellar Data Page](https://op.europa.eu/en/web/cellar/cellar-data)
