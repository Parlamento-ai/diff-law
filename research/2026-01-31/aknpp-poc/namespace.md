# AKN++ Proof of Concept — Namespace y convenciones

## Extensión propuesta: `changeSet`

El elemento `changeSet` es la extensión AKN++ al estándar Akoma Ntoso. Se agrega como hijo
directo del documento (`bill` o `amendment`) y contiene los cambios computables.

### Namespace

- AKN estándar: `http://docs.oasis-open.org/legaldocml/ns/akn/3.0`
- Extensión AKN++: `http://parlamento.ai/ns/aknpp/1.0`

### Atributos de `changeSet`

- `base`: URI FRBR del documento base (el estado anterior)
- `result`: URI FRBR del documento resultante (el estado nuevo)

### Elementos dentro de `changeSet`

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
```
