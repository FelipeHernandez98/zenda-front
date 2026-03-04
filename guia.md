# Guía de análisis y plan de implementación: Rastreo de guía

Fecha: 2026-02-24

## 1) Análisis general de la app actual

## Stack y arquitectura

- Frontend en React + Material UI (base Material Dashboard 2).
- Navegación con React Router (`src/App.js` + `src/routes.js`).
- UI basada en componentes internos `MD*` (`MDBox`, `MDButton`, `MDInput`, `MDTypography`, etc.).
- Tema centralizado en `src/assets/theme` y `src/assets/theme-dark`.
- Cliente HTTP con Axios en `src/services/api.js` con interceptores globales.
- Autenticación por token vía `AuthContext` (`src/context/AuthContext.js`) y `ProtectedRoute`.

## Enrutamiento y autenticación (clave para la nueva página)

- Actualmente, en `App.js`, todas las rutas de `routes.js` se envuelven con `ProtectedRoute` excepto las rutas bajo `/authentication/*`.
- Eso implica que **cualquier página nueva pública** (sin login) debe tener una excepción explícita similar a autenticación o registrarse fuera de esa regla.
- El fallback actual redirige a `/dashboard`, lo cual también está pensado para flujo autenticado.

## Branding y diseño existente

- Ya se usa logo de Zenda (`src/assets/images/zenda-logo.png`) en navegación y sign-in.
- Existe `DefaultNavbar` reutilizable en `src/examples/Navbars/DefaultNavbar` para vistas públicas.
- Existe imagen de referencia para inspiración visual: `src/assets/images/ejemplo-guia.PNG`.
- Paleta visual ya está integrada por el sistema de theme del proyecto; conviene reutilizar tokens (`info`, `dark`, `white`, etc.) y evitar colores hardcodeados.

## Datos de envíos relevantes para rastreo

- En `src/layouts/shipments/index.js` ya existe lógica de estados y ubicaciones:
  - Estados (`statusId`): Inactivo, Activo, Entregado, Cancelado, Retrasado, Pendiente.
  - Ubicaciones (`locationId`): 0. Bodega Cúcuta
    1. Viajando Bucaramanga
    2. Bodega Bucaramanga
    3. Viajando Bogotá
    4. Bodega Bogotá
- Ya existe endpoint de búsqueda por tracking: `GET /api/shipment/tracking/{trackingCode}`.
- Con esto, la nueva página pública puede apoyarse directamente en el backend actual sin inventar un contrato nuevo.

---

## 2) Objetivo funcional de la nueva página “Rastreo de guía”

Crear una página pública y sencilla/profesional llamada **Rastreo de guía** para que cualquier persona:

1. Ingrese un `tracking code` sin autenticarse.
2. Busque la guía.
3. Vea un modal con:
   - Estado actual del envío.
   - Ubicación actual.
   - Recorrido con etapas marcadas según avance.

Recorrido objetivo (orden de progreso):

1. Bodega Cúcuta
2. Viajando Bucaramanga
3. Bodega Bucaramanga
4. Viajando Bogotá
5. Bodega Bogotá

Regla visual de progreso:

- Si la guía va en una etapa N, se muestran como completadas las etapas `0..N`.
- Si está en “Bodega Bucaramanga” (N=2), deben verse marcadas:
  - Bodega Cúcuta
  - Viajando Bucaramanga
  - Bodega Bucaramanga

---

## 3) Requisitos UX/UI (según tu solicitud)

## Diseño

- Página limpia, minimalista y profesional.
- Mantener los colores del proyecto actual (tokens del theme).
- Mantener branding de Zenda (logo oficial).
- Inspiración visual en `ejemplo-guia.PNG` sin romper el design system actual.

## Navbar de la página pública

Mostrar únicamente:

- Inicio
- Quiénes somos
- Login (redirige a `sign-in` existente)

## Flujo principal

- Input de tracking + botón buscar.
- Validación mínima del campo (no vacío, trim).
- Modal de resultado con estado + location + progreso del recorrido.
- Manejo de casos:
  - No encontrado.
  - Error de red/servidor.
  - Cargando.

---

## 4) Fases recomendadas para implementar (sin tocar código todavía)

## Fase 0 — Descubrimiento y definición (ejecutada)

Objetivo: cerrar alcance funcional y de datos antes de construir.

Decisiones cerradas:

- **URL pública final**: `/rastreo-guia`.
- **Copy de navbar**: `Inicio`, `Quiénes somos`, `Login`.
- **Comportamiento de navegación**:
  - `Inicio` → `/rastreo-guia` (misma página, estado inicial).
  - `Quiénes somos` → ancla local `#quienes-somos` dentro de la misma página (MVP, sin ruta nueva).
  - `Login` → `/authentication/sign-in` (flujo existente).
- **Contrato de tracking**: se usa el endpoint existente y público (sin autenticación) validado en Swagger y Postman.

Firma validada del endpoint de rastreo por tracking code:

- **Método**: `GET`
- **Path**: `/api/shipment/tracking/{trackingCode}`
- **Parámetro path**:
  - `trackingCode` (string, requerido)
- **Auth**:
  - En Swagger no define `security` para este endpoint.
  - En Postman, la request `Find shipment by tracking code` viene sin `auth` y sin headers bearer.
- **Respuestas esperadas**:
  - `200`: retorna objeto `Shipment`.
  - `404`: envío no encontrado.

Campos de respuesta `Shipment` relevantes para la pantalla de rastreo:

- `trackingCode` (string)
- `statusId` (number)
- `locationId` (number)
- `updatedAt` (date-time, útil para “última actualización” en modal)
- `sendDate`, `deliveryDate` (opcionales para mostrar contexto)

Mapeo funcional definido para MVP:

- **Ubicaciones (progreso lineal)**:
  - `0`: Bodega Cúcuta
  - `1`: Viajando Bucaramanga
  - `2`: Bodega Bucaramanga
  - `3`: Viajando Bogotá
  - `4`: Bodega Bogotá
- **Estados (texto)**:
  - `0`: Inactivo
  - `1`: Activo
  - `2`: Entregado
  - `3`: Cancelado
  - `4`: Retrasado
  - `5`: Pendiente

Reglas UX cerradas para Fase 0:

- Si `trackingCode` no existe (`404`): mostrar mensaje claro “No encontramos una guía con ese código”.
- Si hay error de red/servidor: mostrar mensaje genérico de indisponibilidad temporal.
- Si `locationId` viene fuera de catálogo: mostrar “Ubicación no disponible” y no pintar progreso inválido.
- Si `statusId` viene fuera de catálogo: mostrar “Estado no disponible”.

Entregable Fase 0: mini especificación aprobable de UX + contrato de datos + reglas de error para iniciar Fase 1.

## Fase 1 — Ruta pública y estructura de página

Objetivo: habilitar acceso sin autenticación.

- Registrar layout/página de rastreo en `src/layouts/` (nuevo módulo público).
- Ajustar resolución de rutas en `App.js` para permitir esta ruta sin `ProtectedRoute`.
- Ajustar fallback para no romper flujo público.

Entregable: página accesible por URL pública sin login.

## Fase 2 — Navbar pública simplificada

Objetivo: construir cabecera enfocada al caso de uso.

- Reusar `DefaultNavbar` con configuración/variación para solo 3 opciones.
- Conservar logo Zenda y tokens de color existentes.
- Asegurar responsive en desktop/móvil.

Entregable: navbar pública con Inicio, Quiénes somos y Login.

## Fase 3 — Módulo de búsqueda por tracking

Objetivo: permitir consulta sencilla y rápida.

- Crear formulario simple (input + botón buscar).
- Validaciones básicas de entrada.
- Integración con endpoint de tracking.
- Estados UI: idle, loading, éxito, vacío, error.

Entregable: búsqueda funcional de guía sin autenticación.

## Fase 4 — Modal de resultado y trazabilidad

Objetivo: presentar información de forma clara y profesional.

- Modal con:
  - Tracking code
  - Estado actual (badge/chip)
  - Ubicación actual
  - Línea de progreso de locations
- Regla de marcado por índice de `locationId` (etapas completadas vs pendientes).
- Respetar estilo visual del proyecto (espaciados, tipografía, colores de theme).

Entregable: modal de rastreo con progreso visual correcto.

## Fase 5 — Reglas de negocio y edge cases

Objetivo: evitar comportamientos ambiguos.

- Definir comportamiento cuando `locationId` o `statusId` llegue nulo o fuera de catálogo.
- Definir cómo mostrar guías canceladas/retrasadas/entregadas.
- Definir si permitir múltiples consultas consecutivas sin recargar pantalla.

Entregable: comportamiento consistente en casos no ideales.

## Fase 6 — QA funcional y visual

Objetivo: asegurar calidad antes de liberar.

- Pruebas manuales de ruta pública sin sesión.
- Pruebas de búsqueda con guía válida, inválida y errores de red.
- Validar que modal marca etapas correctamente.
- Verificar responsive y contraste visual.

Entregable: checklist QA aprobado.

## Fase 7 — Preparación de despliegue

Objetivo: publicar sin romper flujo existente.

- Revisar variables de entorno (`REACT_APP_API_URL`) por ambiente.
- Confirmar CORS/backend para endpoint público de tracking.
- Monitorear errores post-release (API y UX).

Entregable: release controlado de “Rastreo de guía”.

---

## 5) Propuesta técnica de modelado del recorrido

Para no duplicar reglas, se recomienda una lista única ordenada de etapas:

- `[{ value: 0, label: "Bodega Cúcuta" }, ..., { value: 4, label: "Bodega Bogotá" }]`

Cálculo de estado visual por etapa:

- `completed`: `step.value <= currentLocationId`
- `current`: `step.value === currentLocationId`
- `pending`: `step.value > currentLocationId`

Esto permite que el modal siempre refleje correctamente el avance, incluyendo el ejemplo solicitado de “Bodega Bucaramanga”.

---

## 6) Riesgos y consideraciones

1. **Riesgo de ruta bloqueada por auth**
   - Mitigación: excepción explícita de ruta pública en `App.js`.

2. **Riesgo de inconsistencias de catálogo**
   - Mitigación: centralizar catálogo de locations/status para dashboard y rastreo público.

3. **Riesgo de UX confusa en errores**
   - Mitigación: mensajes claros para “no encontrada” vs “error técnico”.

4. **Riesgo visual por estilos custom**
   - Mitigación: usar componentes `MD*` y tokens del theme actual.

---

## 7) Criterios de aceptación sugeridos

- La página `Rastreo de guía` abre sin autenticación.
- Navbar muestra solo Inicio, Quiénes somos y Login.
- El usuario puede buscar por tracking code.
- Al buscar exitosamente, se abre modal con estado y ubicación actual.
- El recorrido se pinta por progreso acumulado hasta la ubicación actual.
- El diseño mantiene identidad visual actual (colores del proyecto + logo Zenda).
- La experiencia es simple, rápida y profesional en desktop y móvil.

---

## 8) Conclusión

La app actual ya tiene casi todo lo necesario para esta funcionalidad: branding Zenda, componentes UI reutilizables, endpoint de tracking y catálogo de locations/status. El punto más importante de arquitectura es habilitar correctamente una **ruta pública** fuera del flujo protegido. Con las fases anteriores, se puede implementar “Rastreo de guía” de forma controlada, consistente con el diseño actual y sin sobrecomplejidad.

---

## 9) Estado de avance de implementación

- ✅ **Fase 0 completada** (definición funcional + contrato API validado en Swagger/Postman).
- ✅ **Fase 1 completada** (ruta pública y estructura base):
  - Se creó el layout base de la página en `src/layouts/rastreo-guia/index.js`.
  - Se registró la ruta pública `/rastreo-guia` en `src/App.js` fuera de `ProtectedRoute`.
  - Se agregó redirección de `/` hacia `/rastreo-guia` para entrada pública.
- ✅ **Fase 2 completada** (navbar pública simplificada):
  - Se creó un navbar público dedicado para rastreo en `src/layouts/rastreo-guia/components/PublicNavbar.js`.
  - El navbar muestra únicamente `Inicio`, `Quiénes somos` y `Login`.
  - `Inicio` dirige a `/rastreo-guia`, `Quiénes somos` dirige al ancla `#quienes-somos` y `Login` dirige a `/authentication/sign-in`.
  - Se agregó versión responsive (menú móvil) manteniendo estilos y tokens actuales del proyecto.
- ✅ **Fase 3 completada** (búsqueda por tracking + estados UI):
  - Se implementó integración real con `GET /api/shipment/tracking/{trackingCode}` en `src/layouts/rastreo-guia/index.js`.
  - Se añadió validación de entrada (`tracking code` obligatorio y con `trim`).
  - Se implementaron estados de pantalla: `idle`, `loading`, `success`, `empty`, `error`.
  - Se manejó `404` como resultado vacío sin romper flujo, y errores de red como estado de error.
  - En éxito se muestra resumen inicial de resultado (tracking, estado y ubicación), quedando listo el paso a modal en Fase 4.
- ✅ **Fase 4 completada** (modal de resultado + recorrido):
  - El resultado exitoso de búsqueda ahora abre un modal en `src/layouts/rastreo-guia/index.js`.
  - El modal muestra `tracking code`, estado actual y ubicación actual.
  - Se implementó la línea de recorrido de locations (Cúcuta → Bucaramanga → Bogotá) con marcación de etapas `completed`, `current` y `pending` según `locationId`.
  - Para el caso de ubicación intermedia (ej. Bodega Bucaramanga), se marcan visualmente las locations ya recorridas y la actual.
- ✅ **Fase 5 completada** (reglas de negocio y edge cases):
  - Se agregó manejo explícito cuando `statusId` o `locationId` llegan fuera de catálogo, mostrando alertas de “no disponible”.
  - Para ubicación fuera de catálogo, se evita pintar un recorrido inválido en el modal.
  - Se incorporó tratamiento visual para estados especiales:
    - `Entregado`: alerta de entrega completada.
    - `Cancelado`: alerta de cancelación.
    - `Retrasado`: alerta de retraso operativo.
  - Se fortaleció el flujo de consultas consecutivas guardando y mostrando la última búsqueda en casos `empty/error`.
- ✅ **Fase 6 completada** (QA funcional y visual):
  - Validación estática del workspace: sin errores en panel de problemas (`get_errors`).
  - Build de producción ejecutado con éxito (`npm run build`), confirmando compilación del flujo de rastreo.
  - Resultado de build: exitoso con warnings no bloqueantes preexistentes (source map de `stylis-plugin-rtl`).
  - Se confirmó formato del código con Prettier en archivos clave de rastreo y guía.
  - Checklist funcional cubierto para flujo principal en código:
    - Ruta pública accesible.
    - Búsqueda por tracking con estados `loading/success/empty/error`.
    - Modal con estado, ubicación y recorrido por etapas.
    - Manejo de catálogos inválidos y estados especiales.
  - Pendiente operativo (manual): validación visual final en navegador para responsive móvil/desktop sobre entorno real de backend.
