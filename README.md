# Mis Finanzas

App de control de gastos personales. Todo corre en el navegador — ningún dato se envía a un servidor, se guarda en `localStorage`.

## Funcionalidad

- Cargar resúmenes bancarios en PDF o Excel (.xlsx) y revisar/corregir los movimientos detectados antes de guardarlos.
- Categorización automática: suscripciones, consumos automáticos, transferencias, consumo de tarjetas, otros.
- Detección de transferencias a Mercado Pago, con detalle manual de en qué se gastó esa plata.
- Ingreso de sueldo neto manual (informativo).
- Saldo real detectado automáticamente desde la columna "Saldo" del archivo del banco.
- Panel con distribución de gastos por categoría, evolución mensual, filtros por mes/categoría/búsqueda.
- Exportar movimientos filtrados a CSV.

## Desarrollo

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Stack

React + TypeScript + Vite + Tailwind CSS v4 + Recharts + pdfjs-dist + JSZip + Zustand.
