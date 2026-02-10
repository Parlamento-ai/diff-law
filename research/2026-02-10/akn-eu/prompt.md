# Prompt: Investigación de datos legislativos de la Unión Europea para conversión a AKN

Copia y pega todo lo que sigue en un nuevo chat:

---

Lee atentamente el README del proyecto en `/Users/lb/work/diff-law/README.md` para entender el contexto completo. También lee el reporte que hicimos para Chile en `/Users/lb/work/diff-law/research/2026-02-10/akn-chile/reporte.md` — ese es el estándar de calidad y formato que espero para este reporte.

## Contexto

Somos Parlamento.ai. Estamos investigando cómo convertir datos legislativos existentes al formato Akoma Ntoso (AKN) 3.0 con nuestra extensión AKN Diff (que agrega `changeSet` computables para comparados de leyes). Ya hicimos una investigación empírica para Chile y descubrimos que tienen 34,936 documentos AKN 2.0 reales en datos.bcn.cl, APIs XML funcionales en Senado y Cámara, y 347,000 normas en LeyChile.

Ahora quiero hacer lo mismo para la **Unión Europea** (Parlamento Europeo, Consejo, Comisión, EUR-Lex, Oficina de Publicaciones). El objetivo es evaluar qué tan viable sería convertir los datos existentes de la UE a AKN 3.0 + AKN Diff para mostrarlos en nuestra plataforma. Aunque la UE es más compleja, el impacto comunicacional sería mucho mayor.

## Lo que necesito que hagas

Crea la carpeta `/Users/lb/work/diff-law/research/2026-02-10/akn-eu/samples/` y genera un reporte empírico verificando qué datos existen realmente. **No me des información teórica — descarga ejemplos reales y muéstrame qué contienen.**

### 1. Verificar EUR-Lex y CELLAR

EUR-Lex es el portal de legislación de la UE. CELLAR es su repositorio de contenido. Necesito que:

- Intentes descargar documentos legislativos reales de EUR-Lex en distintos formatos (HTML, XML, Formex, AKN si existe)
- La API REST de EUR-Lex usa CELLAR. Prueba endpoints como:
  - `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:{celex_number}` (HTML)
  - `https://eur-lex.europa.eu/legal-content/EN/TXT/XML/?uri=CELEX:{celex_number}` (XML)
  - El SPARQL endpoint: `https://publications.europa.eu/webapi/rdf/sparql`
- Prueba con documentos conocidos como:
  - `32016R0679` (GDPR)
  - `32024R0903` (AI Act)
  - `32012R0604` (Dublin III Regulation)
- Guarda los samples descargados en `samples/`

### 2. Verificar AKN4EU

La UE tiene su propio perfil de AKN llamado AKN4EU. Necesito que:

- Busques si existen documentos AKN4EU descargables públicamente
- Verifiques el estado del proyecto LEOS (Legislation Editing Open Software) que usa AKN4EU
- Busques el conversor FMX2AK (Formex to Akoma Ntoso)
- Intentes acceder al esquema AKN4EU en `https://op.europa.eu/` o repositorios de GitHub
- Verifica si hay documentos AKN reales accesibles o si es solo un proyecto interno

### 3. Verificar el SPARQL endpoint de la Oficina de Publicaciones

- Endpoint: `https://publications.europa.eu/webapi/rdf/sparql`
- Haz queries para descubrir qué tipos de documentos existen, qué formatos, qué metadata
- Busca si hay propiedades que apunten a documentos AKN/Formex
- Intenta contar documentos y ver el rango de fechas

### 4. Verificar datos del Parlamento Europeo específicamente

- `https://www.europarl.europa.eu/` tiene datos de sesiones plenarias, votaciones, enmiendas
- Busca si hay APIs abiertas para:
  - Votaciones nominales (roll-call votes)
  - Enmiendas a legislación
  - Textos de debates plenarios
  - Informes de comisiones
- Verifica `https://data.europarl.europa.eu/` si existe

### 5. Verificar datos del Consejo de la UE

- `https://www.consilium.europa.eu/`
- Busca si hay APIs o datos abiertos de:
  - Posiciones del Consejo
  - Votaciones en el Consejo
  - Textos legislativos en tramitación

### 6. Verificar Open Data Portal de la UE

- `https://data.europa.eu/`
- Busca datasets legislativos disponibles

## Formato del reporte

Escribe el reporte en `/Users/lb/work/diff-law/research/2026-02-10/akn-eu/reporte.md` con la misma estructura que el de Chile:

1. **Resumen ejecutivo** — qué encontraste, cuántos datos hay, en qué formato, qué tan viable es
2. **Sección por cada fuente** — con URLs verificadas, ejemplos XML descargados, qué contiene y qué no
3. **SPARQL queries útiles** — las que funcionaron, copiables
4. **Mapa de lo que existe vs lo que falta** — diagrama ASCII como el de Chile
5. **Propuesta de POC** — qué documento/regulación sería el mejor candidato para un primer proof of concept
6. **Tabla de archivos descargados** — con nombre, fuente, formato, tamaño, contenido
7. **Conclusión** — evaluación honesta de viabilidad vs Chile

## Cosas importantes

- **Sé escéptico.** No asumas que algo funciona porque un paper dice que existe. Descárgalo y veríficalo.
- **Descarga ejemplos reales** y guárdalos en `samples/`. Quiero ver el XML crudo.
- **Si algo no funciona** (API caída, 403, 404, formato distinto al esperado), repórtalo honestamente.
- **La UE tiene 24 idiomas** — enfócate en inglés y español si hay opción.
- **Compara con Chile** — al final, necesito saber: ¿es más fácil o más difícil que Chile? ¿Qué tiene la UE que Chile no tiene? ¿Qué le falta?
- **El objetivo final** es poder tomar una directiva o reglamento de la UE, y mostrar en nuestra plataforma: el texto original, las enmiendas del Parlamento, las modificaciones del Consejo, y un comparado computable (changeSet) de lo que cambió en cada paso.
