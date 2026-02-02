# AKN Diff Proof of Concept — Namespace y convenciones

## Extensión propuesta: `changeSet` + `vote`

El elemento `changeSet` es la extensión AKN Diff al estándar Akoma Ntoso. Se agrega como hijo
directo del documento (`bill` o `amendment`) y contiene los cambios computables.

El elemento `vote` se agrega dentro de `changeSet` para representar de forma computable
el resultado de la votación parlamentaria, incluyendo los votantes individuales.

### Namespace

- AKN estándar: `http://docs.oasis-open.org/legaldocml/ns/akn/3.0`
- Extensión AKN Diff: `http://parlamento.ai/ns/akndiff/1.0`

### Atributos de `changeSet`

- `base`: URI FRBR del documento base (el estado anterior)
- `result`: URI FRBR del documento resultante (el estado nuevo)

### Elementos dentro de `changeSet`

- `vote`: resultado de la votación del changeSet
  - `@date`: fecha de la votación
  - `@result`: `approved` | `rejected` | `withdrawn` | `inadmissible` | `pending`
  - `@source`: URI FRBR del documento `debate` donde está el detalle completo
  - `<for>`: lista de votantes a favor
  - `<against>`: lista de votantes en contra
  - `<abstain>`: lista de abstenciones
  - Dentro de cada lista: `<voter href="..." showAs="..."/>`

- `articleChange`: un cambio a un artículo específico
  - `@article`: eId del artículo afectado
  - `@type`: `substitute` | `insert` | `repeal` | `renumber`
  - `<old>`: texto anterior (vacío para insert)
  - `<new>`: texto nuevo (vacío para repeal)

### Convención de URIs FRBR para este POC

```
/poc/receta/{nombre}                          → Work (la receta como concepto)
/poc/receta/{nombre}/esp@{fecha}              → Expression (versión en una fecha)
/poc/receta/{nombre}/esp@{fecha}/main.xml     → Manifestation (el archivo XML)

/poc/bill/{id}                                → Work (el proyecto)
/poc/bill/{id}/esp@{fecha}                    → Expression

/poc/amendment/{id}                           → Work (la enmienda)
/poc/amendment/{id}/esp@{fecha}               → Expression

/poc/debate/{id}                              → Work (la sesión de debate)
/poc/debate/{id}/esp@{fecha}                  → Expression
```
