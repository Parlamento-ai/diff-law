# Reporte: Estado real de los datos legislativos chilenos para conversión a AKN

**Fecha:** 10 de febrero de 2026
**Objetivo:** Verificar empíricamente qué datos existen, en qué formato están, y qué tan viable es convertirlos a AKN 3.0 con AKN Diff.

---

## Resumen ejecutivo

**Chile ya tiene 34,936 documentos en Akoma Ntoso 2.0**, activamente mantenidos por la Biblioteca del Congreso Nacional (BCN), con el más reciente del 30 de enero de 2026. No son solo diarios de sesión históricos — incluyen versiones de proyectos de ley (`<bill>`), informes de comisión (`<debateReport>`), oficios (`<doc>`), mociones parlamentarias, mensajes presidenciales, sentencias del Tribunal Constitucional, y más de 20 tipos distintos.

Adicionalmente, tanto el Senado como la Cámara de Diputados tienen APIs XML funcionales con datos estructurados de tramitación y votaciones nominales (voto por voto de cada parlamentario).

La viabilidad de conversión a AKN 3.0 es alta. El gap principal no es de datos sino de **integración**: los datos existen en tres silos (BCN AKN, Senado XML, Cámara XML) que no se hablan entre sí.

---

## 1. BCN datos.bcn.cl — Documentos AKN 2.0 (VERIFICADO Y FUNCIONAL)

### Acceso

| Recurso | URL |
|---------|-----|
| SPARQL Endpoint | `https://datos.bcn.cl/sparql` |
| Documento AKN por ID | `http://datos.bcn.cl/recurso/cl/documento/{id}.xml` |
| RDF de metadatos | `https://datos.bcn.cl/recurso/cl/documento/{id}` (header `Accept: application/rdf+xml`) |
| Texto plano | `http://datos.bcn.cl/recurso/cl/documento/{id}.txt` |

### Datos clave

- **Total documentos AKN:** 34,936
- **Rango de fechas:** 1965 → 30 de enero de 2026 (activo, no abandonado)
- **Formato:** AKN 2.0 (namespace `http://www.akomantoso.org/2.0`)
- **Schema:** Custom BCN (`akomantoso20_BCN.xsd`)
- **Autenticación:** Ninguna requerida

### 20+ tipos de documentos verificados

| Tipo BCN | Elemento AKN | Período |
|----------|-------------|---------|
| `DiarioDeSesion` | `<debate>` | 1965-2026 |
| `Oficio` | `<doc name="Oficio">` | hasta ene 2026 |
| `InformeComisionLegislativa` | `<debateReport name="InformeDeComision">` | hasta ene 2026 |
| `VersionProyectoDeLey` | `<bill>` | hasta 2021 |
| `EnmiendasVersionProyectoDeLey` | — | 1960s-1970s |
| `MocionParlamentaria` | `<doc name="MocionParlamentaria">` | activo |
| `Mensaje` | `<doc name="Mensaje">` | activo |
| `BoletinIndicaciones` | `<doc>` | activo |
| `InformeComisionMixta` | `<doc>` | activo |
| `InformeFinanciero` | `<doc>` | activo |
| `InformeComisionMixtaDePresupuestos` | `<doc>` | activo |
| `AcuerdosDeComite` | `<doc>` | activo |
| `InformeComisionInvestigadora` | `<doc>` | activo |
| `DocumentoBitacora` | `<doc>` | activo |
| `TipoDocumentoAcusacionConstitucional` | `<doc>` | activo |
| `InformeComplementario` | `<doc>` | activo |
| `Informe` | `<doc>` | activo |

### Ejemplos reales descargados

**Debate del Senado (1973)** — [bcn-akn-584541.xml](samples/bcn-akn-584541.xml) — 447 KB
```xml
<akomaNtoso xmlns="http://www.akomantoso.org/2.0">
  <debate>
    <meta>
      <identification source="#org254">
        <FRBRWork>
          <FRBRthis value="http://datos.bcn.cl/recurso/cl/documento/584541"/>
          <FRBRdate date="1973-01-02" name="workDate"/>
          <FRBRcountry value="cl"/>
        </FRBRWork>
      </identification>
      <references>
        <TLCPerson id="per38" showAs="mireya baltra moreno"
                   href="http://datos.bcn.cl/recurso/persona/1553"/>
      </references>
    </meta>
    <debateBody>
      <!-- 93 <speech> elements con intervenciones identificadas -->
    </debateBody>
  </debate>
</akomaNtoso>
```

**Versión Proyecto de Ley (2021)** — [bcn-akn-version-proyecto-2021.xml](samples/bcn-akn-version-proyecto-2021.xml) — 76 KB
```xml
<akomaNtoso xmlns="http://www.akomantoso.org/2.0">
  <bill>
    <meta>
      <identification>
        <FRBRWork>
          <FRBRthis value="http://datos.bcn.cl/recurso/cl/documento/695681"/>
          <FRBRdate date="2021-11-08" name="workDate"/>
        </FRBRWork>
      </identification>
      <analysis>
        <bcn:AtributosInformeComision
          bcn:uriProyectoLey="#PL_AUT_MARCAJE_id_14002-13"
          bcn:uriTramiteConstitucional="#Tramite-Finalizacion"/>
      </analysis>
    </meta>
    <!-- Cuerpo del proyecto con artículos -->
  </bill>
</akomaNtoso>
```

**Oficio de Ley al Ejecutivo (30 ene 2026)** — [bcn-akn-oficio-ley-2026.xml](samples/bcn-akn-oficio-ley-2026.xml) — 282 KB
```xml
<akomaNtoso xmlns="http://www.akomantoso.org/2.0">
  <doc name="Oficio">
    <meta>
      <identification>
        <FRBRWork>
          <FRBRthis value="http://datos.bcn.cl/recurso/cl/documento/709541"/>
          <FRBRdate date="2026-01-30" name="workDate"/>
        </FRBRWork>
      </identification>
      <references>
        <TLCOrganization id="org0" showAs="Cámara de Diputados"
          href="http://datos.bcn.cl/recurso/cl/organismo/camara-de-diputados"/>
      </references>
    </meta>
  </doc>
</akomaNtoso>
```

**Informe Comisión Hacienda (20 ene 2026)** — [bcn-akn-informe-comision-2026.xml](samples/bcn-akn-informe-comision-2026.xml) — 787 KB
```xml
<akomaNtoso xmlns="http://www.akomantoso.org/2.0">
  <debateReport name="InformeDeComision">
    <meta>
      <identification>
        <FRBRWork>
          <FRBRthis value="http://datos.bcn.cl/recurso/cl/documento/709469"/>
          <FRBRdate date="2026-01-20" name="workDate"/>
          <FRBRauthor href="#org5"/>
        </FRBRWork>
      </identification>
      <!-- Nota al pie con links a transmisiones TV Senado de enero 2026 -->
    </meta>
  </debateReport>
</akomaNtoso>
```

### SPARQL queries útiles

```sparql
-- Contar total de documentos AKN
SELECT (COUNT(?doc) AS ?total) WHERE {
  ?doc <http://datos.bcn.cl/ontologies/bcn-resources#tieneDocumentoAkomaNtoso> ?akn
}
-- Resultado: 34,936

-- Documentos más recientes con URLs de descarga
SELECT ?doc ?akn ?label ?date WHERE {
  ?doc <http://datos.bcn.cl/ontologies/bcn-resources#tieneDocumentoAkomaNtoso> ?akn .
  ?doc <http://www.w3.org/2000/01/rdf-schema#label> ?label .
  ?doc <http://purl.org/dc/elements/1.1/date> ?date
} ORDER BY DESC(?date) LIMIT 20

-- Buscar por tipo
SELECT ?doc ?akn ?label WHERE {
  ?doc <http://datos.bcn.cl/ontologies/bcn-resources#tieneDocumentoAkomaNtoso> ?akn .
  ?doc a <http://datos.bcn.cl/ontologies/bcn-resources#VersionProyectoDeLey> .
  ?doc <http://www.w3.org/2000/01/rdf-schema#label> ?label
} ORDER BY DESC(?date) LIMIT 10

-- Todos los tipos
SELECT DISTINCT ?type WHERE {
  ?doc <http://datos.bcn.cl/ontologies/bcn-resources#tieneDocumentoAkomaNtoso> ?akn .
  ?doc a ?type
}

-- Documentos de 2026
SELECT ?doc ?akn ?label ?date WHERE {
  ?doc <http://datos.bcn.cl/ontologies/bcn-resources#tieneDocumentoAkomaNtoso> ?akn .
  ?doc <http://www.w3.org/2000/01/rdf-schema#label> ?label .
  ?doc <http://purl.org/dc/elements/1.1/date> ?date .
  FILTER(?date > '2026-01-01'^^xsd:date)
} ORDER BY DESC(?date) LIMIT 20
```

### Observaciones sobre la calidad del AKN

1. **Es AKN 2.0**, no 3.0 — el namespace correcto sería `http://docs.oasis-open.org/legaldocml/ns/akn/3.0`
2. **FRBR completo** en cada documento (Work/Expression/Manifestation con URIs resolvibles)
3. **TLCPerson/TLCOrganization** con `href` apuntando a URIs de datos.bcn.cl
4. **Extensiones BCN** en namespace `bcn:` para metadata de trámite constitucional y reglamentario
5. **La mayoría usa `<doc name="...">` genérico** en vez de tipos AKN nativos — solo `<bill>`, `<debate>`, y `<debateReport>` usan tipos nativos
6. **Los debates históricos tienen 93+ `<speech>` elements** con intervenciones identificadas por persona

---

## 2. Senado — API XML de tramitación (VERIFICADO Y FUNCIONAL)

### Acceso

| Endpoint | URL |
|----------|-----|
| Boletín | `https://tramitacion.senado.cl/wspublico/tramitacion.php?boletin={num}` |
| Votaciones | `https://tramitacion.senado.cl/wspublico/votaciones.php?boletin={num}` |
| Actividad por fecha | `https://tramitacion.senado.cl/wspublico/tramitacion.php?fecha={dd/mm/yyyy}` |

**Autenticación:** Ninguna. **Formato:** XML propietario (NO es AKN).

### Ejemplo descargado: Boletín 16621 (Ley Tributaria 21.713)

[senado-boletin-16621.xml](samples/senado-boletin-16621.xml) — 40 KB

```xml
<proyectos><proyecto>
  <descripcion>
    <boletin>16621-05</boletin>
    <titulo>Dicta normas para asegurar el cumplimiento de las obligaciones tributarias...</titulo>
    <fecha_ingreso>29/01/2024</fecha_ingreso>
    <iniciativa>Mensaje</iniciativa>
    <camara_origen>C.Diputados</camara_origen>
    <etapa>Tramitación terminada</etapa>
    <leynro>Ley N° 21.713</leynro>
    <diariooficial>24/10/2024</diariooficial>
    <estado>Publicado</estado>
  </descripcion>
  <tramitacion>
    <tramite>
      <SESION>138/371</SESION>
      <FECHA>29/01/2024</FECHA>
      <DESCRIPCIONTRAMITE>Cuenta de proyecto. Pasa a Comisión de Hacienda.</DESCRIPCIONTRAMITE>
      <ETAPDESCRIPCION>Primer trámite constitucional</ETAPDESCRIPCION>
      <CAMARATRAMITE>C.Diputados</CAMARATRAMITE>
    </tramite>
    <!-- ~80 trámites para este boletín -->
  </tramitacion>
</proyecto></proyectos>
```

### Votaciones del Senado — voto por voto

[senado-votaciones-16621.xml](samples/senado-votaciones-16621.xml) — 160 KB

```xml
<votaciones>
  <votacion>
    <SESION>39/372</SESION>
    <FECHA>30/07/2024</FECHA>
    <TEMA>...APROBADO.</TEMA>
    <SI>33</SI><NO>4</NO><ABSTENCION>0</ABSTENCION>
    <QUORUM>Q.C.</QUORUM>
    <TIPOVOTACION>Discusión general</TIPOVOTACION>
    <DETALLE_VOTACION>
      <VOTO><PARLAMENTARIO>Latorre R., Juan Ignacio</PARLAMENTARIO><SELECCION>Si</SELECCION></VOTO>
      <VOTO><PARLAMENTARIO>Castro P., Juan</PARLAMENTARIO><SELECCION>No</SELECCION></VOTO>
      <!-- Todos los senadores -->
    </DETALLE_VOTACION>
  </votacion>
</votaciones>
```

**Contiene:** Metadata completa del proyecto, historial de tramitación paso a paso (~80 trámites), votaciones nominales por senador, links a PDFs de informes/comparados.

**No contiene:** Texto de la ley, contenido de debates, estructura articulada.

---

## 3. Cámara de Diputados — API XML (VERIFICADO Y FUNCIONAL)

### Acceso

| Endpoint | URL |
|----------|-----|
| Votaciones por boletín | `https://opendata.camara.cl/wscamaradiputados.asmx/getVotaciones_Boletin?prmBoletin={num}` |
| Detalle votación | `https://opendata.camara.cl/wscamaradiputados.asmx/getVotacion_Detalle?prmVotacionID={id}` |
| Legislaturas | `https://opendata.camara.cl/wscamaradiputados.asmx/getLegislaturas` |
| Sesiones | `https://opendata.camara.cl/wscamaradiputados.asmx/getSesiones?prmLegislaturaID={id}` |

**Autenticación:** Ninguna. **Formato:** XML con namespace `http://tempuri.org/` (ASP.NET).

### Ejemplo descargado: Votación detalle (ID 41219)

[camara-votacion-detalle-41219.xml](samples/camara-votacion-detalle-41219.xml)

```xml
<Votacion xmlns="http://tempuri.org/">
  <ID>41219</ID>
  <Fecha>2024-09-25T14:00:12</Fecha>
  <Resultado Codigo="1">Aprobado</Resultado>
  <Quorum Codigo="1">Quorum Simple</Quorum>
  <Boletin>16621-05</Boletin>
  <Articulo>Propuesta del Senado para agregar los numerales 3 y 4...</Articulo>
  <TotalAfirmativos>123</TotalAfirmativos>
  <TotalNegativos>17</TotalNegativos>
  <Votos>
    <Voto>
      <Diputado>
        <DIPID>1097</DIPID>
        <Nombre>Eric</Nombre>
        <Apellido_Paterno>Aedo</Apellido_Paterno>
        <Apellido_Materno>Jeldres</Apellido_Materno>
      </Diputado>
      <Opcion Codigo="1">Afirmativo</Opcion>
    </Voto>
    <!-- ~140 votos individuales -->
  </Votos>
</Votacion>
```

**Contiene:** Votaciones por diputado con ID, nombre completo, y opción de voto. Legislaturas históricas desde 1990.

**No contiene:** Texto de debates, contenido de proyectos.

---

## 4. LeyChile — API XML de normas (VERIFICADO CON LIMITACIONES)

### Acceso

| Recurso | URL | Notas |
|---------|-----|-------|
| XML de norma | `https://www.leychile.cl/Consulta/obtxml?opt=7&idNorma={id}` | **Requiere header User-Agent** |
| Versión histórica | `https://www.leychile.cl/Navegar?idNorma={id}&idVersion={YYYY-MM-DD}` | Retorna 401 sin UA |

**Formato:** XML propietario, schema: `http://www.leychile.cl/esquemas/EsquemaIntercambioNorma-v1-0.xsd`

### Ejemplo descargado: Norma 243302

[leychile-norma-243302.xml](samples/leychile-norma-243302.xml) — 2.4 KB

```xml
<Norma xmlns="http://www.leychile.cl/esquemas" normaId="243302"
       fechaVersion="2005-10-28" derogado="no derogado">
  <Identificador fechaPromulgacion="2005-09-28" fechaPublicacion="2005-10-28">
    <TiposNumeros>
      <TipoNumero><Tipo>Resolución</Tipo><Numero>3240 EXENTA</Numero></TipoNumero>
    </TiposNumeros>
    <Organismos>
      <Organismo>MINISTERIO DE ECONOMÍA</Organismo>
    </Organismos>
  </Identificador>
  <EstructurasFuncionales>
    <EstructuraFuncional tipoParte="Artículo" idParte="6545485">
      <Texto>Por resolución exenta N° 3.240...</Texto>
    </EstructuraFuncional>
  </EstructurasFuncionales>
</Norma>
```

**Contiene:** Texto completo de la norma vigente, estructura funcional (artículos, capítulos), versiones históricas, ~347,000 normas.

**No contiene:** No es AKN. No tiene FRBR ni TLC entities. No tiene cross-references.

---

## 5. Mapa de lo que existe vs lo que falta

```
┌─────────────────────────────────────────────────────────────────────┐
│                     YA ESTÁ EN AKN 2.0 (BCN)                       │
│                      (34,936 documentos)                            │
├─────────────────────────────────────────────────────────────────────┤
│ ✅ Debates / Diarios de sesión (1965-2026)                         │
│ ✅ Versiones de proyecto de ley (<bill>) — hasta 2021              │
│ ✅ Oficios entre cámaras — hasta ene 2026                          │
│ ✅ Informes de comisión legislativa — hasta ene 2026               │
│ ✅ Enmiendas a versiones — solo históricos 1960s-70s               │
│ ✅ Mociones parlamentarias                                         │
│ ✅ Mensajes presidenciales                                         │
│ ✅ Boletines de indicaciones                                       │
│ ✅ Informes comisión mixta                                         │
│ ✅ Informes financieros                                            │
│ ✅ Acuerdos de comité                                              │
│ ✅ Acusaciones constitucionales                                    │
│ ✅ Sentencias Tribunal Constitucional                              │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│               EN XML PROPIETARIO (necesita conversión)              │
├─────────────────────────────────────────────────────────────────────┤
│ 🔄 Tramitación de proyectos (Senado API) — metadata + timeline     │
│ 🔄 Votaciones Senado — por senador, por boletín                    │
│ 🔄 Votaciones Cámara — por diputado, por boletín                   │
│ 🔄 Sesiones Cámara — metadata de sesiones                          │
│ 🔄 Normas vigentes (LeyChile) — 347,000 normas con versiones       │
│ 🔄 Legislaturas y periodos (Cámara API)                            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    SOLO EN PDF (extracción + conversión)            │
├─────────────────────────────────────────────────────────────────────┤
│ ❌ Comparados (documentos de comparación de leyes)                  │
│ ❌ Algunos informes de comisión más antiguos                        │
│ ❌ Textos intermedios de proyectos durante tramitación              │
│ ❌ Indicaciones individuales de parlamentarios                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    NO EXISTE EN NINGÚN FORMATO                      │
├─────────────────────────────────────────────────────────────────────┤
│ ❌ changeSet / AKN Diff (lo que propone este proyecto)              │
│ ❌ Comparado computable entre versiones de ley                      │
│ ❌ Links mecánicos entre tramitación y documentos AKN               │
│ ❌ Votaciones integradas en el documento del debate                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. Propuesta de POC: Boletín 18036-05

### Por qué este boletín

Es el más reciente en el sistema AKN de BCN (enero 2026). Ya tiene múltiples documentos AKN generados que podemos usar como punto de partida:

| Documento | Fecha | ID BCN |
|-----------|-------|--------|
| Sentencia Tribunal Constitucional | 30 ene 2026 | 709540 |
| Oficio de Ley al Ejecutivo | 30 ene 2026 | 709541 |
| Oficio Aprobación Informe Comisión Mixta | 27 ene 2026 | 709515 |
| Oficio a Cámara Revisora | 21 ene 2026 | 709437 |
| Oficio al Tribunal Constitucional | 22 ene 2026 | 709539 |
| Oficio Consulta Facultad de Veto | 21 ene 2026 | 709538 |
| Informe Comisión de Hacienda | 20 ene 2026 | 709469 |

### Pasos del POC

1. Descargar todos los documentos AKN existentes del boletín 18036-05 via SPARQL
2. Descargar tramitación del Senado via API
3. Descargar votaciones de ambas cámaras
4. Upgrade AKN 2.0 → 3.0 (cambio de namespace + ajustes schema)
5. Integrar votaciones como `akndiff:vote`
6. Generar cross-links entre documentos
7. Si existe texto en LeyChile, generar `changeSet`
8. Visualizar en la plataforma

### Estimación de dificultad

| Tarea | Dificultad | % Automatizable |
|-------|-----------|-----------------|
| Descargar AKN existente (SPARQL) | Trivial | 100% script |
| Descargar tramitación/votaciones (APIs) | Trivial | 100% script |
| Upgrade AKN 2.0 → 3.0 | Media | ~80% mecánico |
| Integrar votaciones en AKN | Media | ~60% AI + reglas |
| Generar cross-links | Alta | ~50% AI + manual |
| Generar changeSet | Alta | ~70% AI + revisión |

---

## 7. Archivos descargados en este reporte

Todos en [samples/](samples/):

| Archivo | Fuente | Formato | Tamaño | Contenido |
|---------|--------|---------|--------|-----------|
| `bcn-akn-584541.xml` | BCN | **AKN 2.0** `<debate>` | 447 KB | Sesión Senado 1973, 93 speeches |
| `bcn-akn-oficio-ley-2026.xml` | BCN | **AKN 2.0** `<doc>` | 282 KB | Oficio de Ley, 30 ene 2026 |
| `bcn-akn-version-proyecto-2021.xml` | BCN | **AKN 2.0** `<bill>` | 76 KB | Proyecto 14002-13, 2021 |
| `bcn-akn-informe-comision-2026.xml` | BCN | **AKN 2.0** `<debateReport>` | 787 KB | Comisión Hacienda, 20 ene 2026 |
| `senado-boletin-16621.xml` | Senado API | XML propietario | 40 KB | Ley Tributaria 21.713 |
| `senado-boletin-8575.xml` | Senado API | XML propietario | 65 KB | Presupuesto 2013 |
| `senado-votaciones-16621.xml` | Senado API | XML propietario | 160 KB | Votaciones por senador |
| `camara-votaciones-16621.xml` | Cámara API | XML propietario | ~5 KB | Votaciones boletín |
| `camara-votacion-detalle-41219.xml` | Cámara API | XML propietario | ~15 KB | Voto por diputado |
| `camara-legislaturas.xml` | Cámara API | XML propietario | ~3 KB | Lista legislaturas |
| `leychile-norma-243302.xml` | LeyChile | XML propietario | 2.4 KB | Resolución MINECON |

---

## 8. Conclusión

El escepticismo era parcialmente justificado: los datos AKN no son perfectos (son versión 2.0, usan tipos genéricos `<doc>` en vez de nativos, y tienen extensiones propietarias BCN). Pero la realidad es **significativamente mejor de lo esperado**:

1. **34,936 documentos AKN reales y descargables**, activos hasta enero 2026
2. **20+ tipos de documentos**, no solo diarios de sesión
3. **APIs funcionales y abiertas** en Senado y Cámara con votaciones nominales
4. **URIs resolvibles** para personas y organismos
5. **FRBR completo** que permite navegar Work → Expression → Manifestation

El trabajo de conversión sería:
- **Upgrade 2.0 → 3.0** para los 34,936 docs existentes (mayormente mecánico)
- **Conversión de XML propietario → AKN** para tramitación, votaciones, y normas de LeyChile
- **Integración** de los tres silos en un grafo conectado
- **Generación del changeSet** (el diferencial de valor de AKN Diff)
