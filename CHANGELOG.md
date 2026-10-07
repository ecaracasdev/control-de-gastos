# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## [Unreleased]

### Added
- Taxonomía de categoría + subcategoría (Comida, Transporte, Salud, Servicios y suscripciones, Compras, Transferencias a personas, Pago de tarjeta de crédito, Otros), en preparación para importar Mercado Pago.
- Se puede importar el resumen de cuenta en pesos de Mercado Pago (PDF) como una fuente más al cargar un documento, con categorización automática (delivery, restaurantes/QR, peajes, farmacia, transferencias a personas, etc.).
- Al hacer clic en una categoría del gráfico de torta, el detalle ahora muestra también el desglose por subcategoría (para las categorías que tienen: Comida, Transporte, Salud, Servicios y suscripciones, Otros).
- La app ahora es instalable como PWA: se puede agregar a la pantalla de inicio en Android/iOS, funciona offline (service worker con precache, incluye el worker de PDF) y avisa cuando hay una versión nueva para actualizar.
- Exportar/restaurar un backup completo de todos los datos (movimientos, ingresos, saldo) en un archivo JSON, desde "Movimientos" → "Archivos importados".
- Deploy automático a GitHub Pages en cada cambio a `main`.
- Se puede cargar el detalle de consumos de la tarjeta de crédito (Excel "Últimos consumos" de Santander): se vincula automáticamente con el pago que ya aparece en los movimientos y muestra el detalle real de cada compra (con cuotas y montos en dólares) en vez de solo el pago en bloque.

- Desglose del mes en el Panel: cómo se reparte tu ingreso entre gastos fijos, comida, transporte, compras y tarjeta, personas y otros, con lo que te queda, cuánto son fijos + comida como % del ingreso, y cuánto podés gastar libremente sin tocar tu objetivo de ahorro en USD.

- Un selector de subcategoría en Movimientos, además del de categoría.

### Changed
- Los consumos de la tarjeta de crédito ya no quedan como detalle anidado debajo del pago en bloque: cada consumo pasa a ser su propio movimiento, categorizado automáticamente (una suscripción cargada en la tarjeta cae en "Servicios y suscripciones", no en un bloque genérico "Pago de tarjeta de crédito"), y editable desde Movimientos como cualquier otro. El pago en bloque del banco se excluye del gasto cuando ya está vinculado, para no contarlo dos veces.
- Los movimientos ya guardados se migran automáticamente a la taxonomía nueva (no se pierde nada de lo cargado antes).
- `categorize()` ahora también informa qué tan confiable es la categorización detectada, para que los casos más ambiguos (ej. pagos vía EBANX, un "Pago con QR" genérico) se marquen para revisar en vez de darlos por buenos.
- El aviso de "anotá a mano en qué se gastó" de una transferencia a Mercado Pago ya no aparece cuando esa transferencia tiene su contraparte real importada (el detalle real ya está disponible en otros movimientos).

### Fixed
- Con la app recién instalada (0 movimientos), "Movimientos" no mostraba "Archivos importados", así que no había forma de restaurar un backup. Ahora el botón de restaurar está disponible incluso sin movimientos cargados.
- El parseo de montos en PDF no reconocía negativos con el signo pegado después del símbolo de moneda (formato `$ -1.000,00`, como en los resúmenes de Mercado Pago).
- Al importar el banco y Mercado Pago para el mismo período, una transferencia entre ambos se contaba dos veces (gasto del lado del banco + ingreso del lado de Mercado Pago). Ahora se detecta el par y se excluye del ingreso/gasto del hogar.
- "¿Cierra con tu banco?" mezclaba el detalle de gastos dentro de Mercado Pago, que nunca toca la cuenta bancaria. Ahora esa comparación usa solo movimientos del banco.
