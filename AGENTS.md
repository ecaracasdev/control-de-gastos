# AGENTS.md

Pautas de trabajo para cualquier agente de IA (Claude, Copilot, Codex, etc.) que proponga o aplique cambios en este repositorio. Leer este archivo antes de empezar cualquier tarea.

Este archivo se va a ir ampliando con más pautas a medida que surjan. Cuando una pauta nueva se agregue, queda vigente para el resto del proyecto, no solo para la tarea puntual en la que se pidió.

## Reglas

1. **Comentarios en el código**: no agregar comentarios porque sí. Antes de escribir un comentario, avisar qué comentario se quiere agregar y en qué línea/archivo, y esperar autorización explícita antes de escribirlo.

2. **Chequeos obligatorios antes de dar un cambio por terminado**: correr `npm run check` (typecheck + lint + tests) y que pase limpio. Si se toca lógica de parseo/categorización, agregar o actualizar tests de esa lógica en el mismo cambio, no dejarlo para después.

3. **Lint/formato centralizado**: la única fuente de verdad de reglas de lint es `.oxlintrc.json`, y la configuración de editor vive en `.vscode/settings.json` (versionado, no ignorado) para que aplique igual sin importar la config personal de VS Code de quien lo abra. Si hace falta ajustar una regla, se edita ahí, no en el editor de cada uno.

4. **Ramas y entornos**: solo dos entornos, `dev` (integración/desarrollo) y `main` (producción). Ninguna rama de trabajo sale de `main` directamente ni se le pushea directo. Convención de nombres:
   - `feature/<slug>` — funcionalidad nueva
   - `fix/<slug>` — corrección de bug
   - `chore/<slug>` — configuración, tooling, tareas de mantenimiento
   Todas salen de `dev` y vuelven a `dev`. `dev` se promueve a `main` cuando se decide pasar a producción.

5. **Changelog**: todo cambio relevante para el usuario final (feature, fix, cambio de comportamiento) se registra en `CHANGELOG.md`, sección `[Unreleased]`, formato Keep a Changelog.

6. **Documentación**: la documentación funcional/técnica del proyecto se centraliza en `DOCS.md`. Se va completando a medida que hay algo real que documentar, no se anticipa contenido vacío o especulativo.
