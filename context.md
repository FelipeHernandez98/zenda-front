# Análisis del Proyecto Shipments Front

## Descripción General del Proyecto

Este proyecto es una aplicación frontend desarrollada en React utilizando el template "Material Dashboard 2" de Creative Tim. Se trata de un dashboard administrativo con componentes de Material-UI (MUI), que incluye temas claro/oscuro, RTL support, y una estructura modular de componentes reutilizables. El proyecto está configurado con React Router para navegación, y utiliza Create React App como base.

### Estructura Actual

- **Tecnologías principales**: React 18, Material-UI 5, React Router DOM, Chart.js para gráficos.
- **Estructura de carpetas**:
  - `src/components/`: Componentes reutilizables (MDAlert, MDAvatar, etc.)
  - `src/layouts/`: Layouts principales (dashboard, tables, authentication, etc.)
  - `src/examples/`: Componentes de ejemplo (Sidenav, Navbars, etc.)
  - `src/assets/`: Temas, imágenes y estilos.
- **Rutas existentes**: Dashboard, Tables, Billing, RTL, Notifications, Profile, Sign-In, Sign-Up.
- **Estado actual**: Template funcional sin integración con backend específico.

## Análisis de las APIs (Backend)

Basado en la colección de Postman y el archivo swagger.yaml, el backend proporciona las siguientes funcionalidades:

### 1. Autenticación de Usuarios

- **POST /api/user/login**: Inicio de sesión con username y password. Retorna token JWT.
- **GET /api/user/check-status**: Verifica estado de autenticación (requiere token).
- **GET /api/user/findById**: Obtiene datos del usuario autenticado (requiere token).

### 2. Gestión de Usuarios (CRUD)

- **POST /api/user**: Crear nuevo usuario.
- **GET /api/user**: Listar todos los usuarios (requiere token).
- **GET /api/user/id/{id}**: Obtener usuario por ID.
- **PATCH /api/user/{id}**: Actualizar usuario.
- **DELETE /api/user/{id}**: Eliminar usuario.

### 3. Gestión de Clientes (CRUD)

- **POST /api/client**: Crear nuevo cliente.
- **GET /api/client**: Listar todos los clientes (requiere token).
- **GET /api/client/{id}**: Obtener cliente por número de documento.
- **PATCH /api/client/{id}**: Actualizar cliente.
- **DELETE /api/client/{id}**: Eliminar cliente.

### 4. Gestión de Envíos (CRUD)

- **POST /api/shipment**: Crear nuevo envío (requiere token).
- **GET /api/shipment**: Listar todos los envíos (requiere token).
- **GET /api/shipment/{id}**: Obtener envío por ID.
- **PATCH /api/shipment/{id}**: Actualizar envío.
- **DELETE /api/shipment/{id}**: Eliminar envío.
- **GET /api/shipment/location/{location}**: Buscar envíos por ubicación.

### Consideraciones Técnicas de las APIs

- Autenticación basada en JWT (Bearer token).
- Endpoints protegidos requieren header `Authorization: Bearer {token}`.
- Respuestas en JSON.
- Manejo de errores con códigos HTTP estándar (400, 401, 404, etc.).

## Planificación Paso a Paso para la Implementación

## Estado de avance

- ✅ Fase 1: Configuración de Autenticación y Base de la Aplicación (realizada)
- ✅ Fase 2: Implementación del Panel de Dashboard con Login (realizada)
- ✅ Fase 3: Implementación del CRUD de Usuarios (realizada)
- ✅ Fase 4: Implementación del CRUD de Clientes (realizada)
- ✅ Fase 5: Implementación del CRUD de Envíos (realizada)
- ✅ Fase 6: Integración y Mejoras Generales (realizada)
- ✅ Fase 7: Rediseño Visual y Branding Zenda (realizada)
- ✅ Fase 8: Rediseño de Formularios CRUD (realizada)
- ✅ Fase 9: Refinamiento UX/UI de Flujos CRUD (realizada)
- ✅ Fase 10: QA Visual, Accesibilidad y Ajuste Final (realizada)

### Fase 1: Configuración de Autenticación y Base de la Aplicación

1. **Instalar dependencias adicionales**:
   - Axios o Fetch para peticiones HTTP (recomendado Axios para mejor manejo de interceptores).
   - React Context o Redux para manejo de estado global (autenticación, usuario actual).
   - Formik y Yup para manejo de formularios (ya instalado Yup).

2. **Crear contexto de autenticación**:
   - Crear `src/context/AuthContext.js` para manejar login, logout, token storage.
   - Implementar persistencia del token en localStorage.
   - Crear hook `useAuth` para acceder al contexto.

3. **Configurar Axios con interceptores**:
   - Crear instancia de Axios con base URL del backend.
   - Interceptor de request para agregar token automáticamente.
   - Interceptor de response para manejar errores 401 (token expirado).

4. **Modificar rutas protegidas**:
   - Crear componente `ProtectedRoute` que verifique autenticación.
   - Actualizar `routes.js` para proteger rutas que requieren login.
   - Redirigir a login si no autenticado.

### Fase 2: Implementación del Panel de Dashboard con Login

1. **Mejorar página de Sign-In**:
   - Modificar `layouts/authentication/sign-in` para integrar con API de login.
   - Agregar validación de formulario con Yup.
   - Manejar errores de login (credenciales inválidas).
   - Al login exitoso, guardar token y redirigir a dashboard.

2. **Crear página de Dashboard principal**:
   - Modificar `layouts/dashboard` para mostrar estadísticas relevantes (número de usuarios, clientes, envíos).
   - Integrar gráficos con Chart.js para métricas.
   - Agregar cards de resumen.

3. **Implementar logout**:
   - Agregar funcionalidad de logout en navbar/sidenav.
   - Limpiar token y redirigir a login.

### Fase 3: Implementación del CRUD de Usuarios

1. **Crear layout para gestión de usuarios**:
   - Crear `layouts/users/index.js` como página principal.
   - Incluir tabla de usuarios con DataTable existente.

2. **Funcionalidades CRUD**:
   - **Listar usuarios**: Petición GET /api/user, mostrar en tabla con paginación.
   - **Crear usuario**: Modal/formulario con campos (name, lastname, username, phoneNumber, password).
   - **Editar usuario**: Modal con datos precargados, PATCH /api/user/{id}.
   - **Eliminar usuario**: Confirmación y DELETE /api/user/{id}.

3. **Componentes necesarios**:
   - Formulario reutilizable para crear/editar.
   - Tabla con acciones (editar, eliminar).
   - Manejo de estados de carga y errores.

### Fase 4: Implementación del CRUD de Clientes

1. **Crear layout para gestión de clientes**:
   - Similar a usuarios: `layouts/clients/index.js`.
   - Tabla de clientes.

2. **Funcionalidades CRUD**:
   - **Listar clientes**: GET /api/client.
   - **Crear cliente**: POST /api/client con campos apropiados (basado en swagger).
   - **Editar cliente**: PATCH /api/client/{id}.
   - **Eliminar cliente**: DELETE /api/client/{id}.

3. **Campos típicos de cliente** (basado en swagger):
   - Nombre, apellido, documento, dirección, teléfono, email, etc.

### Fase 5: Implementación del CRUD de Envíos

1. **Crear layout para gestión de envíos**:
   - `layouts/shipments/index.js`.
   - Tabla de envíos con filtros (por ubicación, estado, etc.).

2. **Funcionalidades CRUD**:
   - **Listar envíos**: GET /api/shipment.
   - **Crear envío**: POST /api/shipment con campos (origen, destino, cliente, fecha, etc.).
   - **Editar envío**: PATCH /api/shipment/{id}.
   - **Eliminar envío**: DELETE /api/shipment/{id}.

3. **Funcionalidades adicionales**:
   - Búsqueda por ubicación: GET /api/shipment/location/{location}.
   - Estados de envío (pendiente, en tránsito, entregado).

### Fase 6: Integración y Mejoras Generales

1. **Actualizar navegación (Sidenav)**:
   - Agregar nuevas rutas: Users, Clients, Shipments.
   - Organizar en secciones lógicas.

2. **Manejo de errores global**:
   - Componente de notificaciones para errores/success (usar MDAlert existente).
   - Manejo de errores de red, timeouts.

3. **Validaciones y UX**:
   - Validaciones en formularios con Yup.
   - Estados de carga (spinners) durante peticiones.
   - Confirmaciones para acciones destructivas.

4. **Testing y validación**:
   - Probar todas las funcionalidades con Postman primero.
   - Manejar casos edge: token expirado, permisos, etc.

### Análisis de Diseño Global (estado actual)

1. **Identidad visual inconsistente con marca**:
   - El aplicativo aún usa recursos visuales del template base (logo y estilo general).
   - Falta alinear marca en navegación, login y encabezados con identidad Zenda.

2. **Formularios CRUD funcionales pero genéricos**:
   - Estructura correcta (Formik + Yup), pero visualmente plana para operaciones críticas.
   - Jerarquía visual limitada: poca diferenciación entre campos clave, secundarios y metadatos.
   - Falta consistencia en layout de formularios entre Users, Clients y Shipments.

3. **Experiencia de creación/edición mejorable**:
   - El usuario no recibe una sensación de “flujo guiado” (sección de datos personales, contacto, trazabilidad, etc.).
   - Botones y acciones principales pueden destacarse mejor según contexto (crear vs actualizar).

4. **Sistema de color sin personalización de marca**:
   - Actualmente predominan colores del tema base Material Dashboard.
   - Con base en `src/assets/images/zenda-logo.png`, el color dominante identificado es azul profundo (`#051D4D` y variantes cercanas).

### Propuesta de Paleta Nueva (basada en Zenda)

> Esta paleta se propone para implementación posterior en las fases nuevas (no aplicada aún).

1. **Colores base de marca (extraídos/derivados del logo)**:
   - `brandPrimary`: `#051D4D` (principal)
   - `brandPrimaryHover`: `#041A45`
   - `brandPrimarySoft`: `#0D2B66`

2. **Colores complementarios generados para UI moderna**:
   - `brandAccent`: `#1E88E5` (acciones secundarias y focos)
   - `brandSuccess`: `#2E7D32`
   - `brandWarning`: `#ED6C02`
   - `brandError`: `#D32F2F`

3. **Neutros para fondos y tipografía**:
   - `neutralBg`: `#F6F8FC`
   - `neutralCard`: `#FFFFFF`
   - `neutralBorder`: `#D9E1EE`
   - `neutralText`: `#22314D`
   - `neutralTextSoft`: `#5B6B85`

### Fase 7: Rediseño Visual y Branding Zenda

1. **Branding global**:
   - Reemplazar logos actuales por `src/assets/images/zenda-logo.png` en Sidenav y vistas de autenticación.
   - Ajustar tamaño, padding y contraste del logo para modo claro/oscuro.

2. **Sistema de color de marca**:
   - Implementar nueva paleta en `src/assets/theme/base/colors.js` y su equivalente dark theme.
   - Mapear colores de acciones (`info`, `success`, `warning`, `error`) a la propuesta Zenda.

3. **Tokens visuales unificados**:
   - Definir reglas de uso para fondos, bordes, estados hover/focus y tipografía en formularios.

### Fase 8: Rediseño de Formularios CRUD

1. **Users (crear/editar)**:
   - Reorganizar campos por secciones (datos personales, acceso, contacto).
   - Mejorar títulos, subtítulos y ayudas contextuales por campo.

2. **Clients (crear/editar)**:
   - Estructurar formulario en bloques (identificación, contacto, ubicación).
   - Mejorar inputs de documento/teléfono/correo con feedback visual consistente.

3. **Shipments (crear/editar)**:
   - Separar visualmente remitente, destinatario, usuario creador y detalle del paquete.
   - Mejorar UX de autocompletados (labels claros + chips/indicadores de selección).

4. **Consistencia transversal**:
   - Estandarizar espaciados, tamaños de campos, jerarquía de botones y estados de validación.

### Fase 9: Refinamiento UX/UI de Flujos CRUD

1. **Acciones primarias y secundarias**:
   - Mejorar jerarquía de botones “Crear/Actualizar/Cancelar”.
   - Homologar comportamiento visual de acciones destructivas.

2. **Mensajes y microinteracciones**:
   - Unificar copy de errores/éxitos en tono profesional y claro.
   - Mejorar feedback durante cargas y guardado de formularios.

3. **Diálogos y confirmaciones**:
   - Ajustar modales para lectura rápida y prevención de errores de usuario.

### Fase 10: QA Visual, Accesibilidad y Ajuste Final

1. **QA visual completo**:
   - Revisar consistencia en desktop y móvil (layouts, formularios y modales).

2. **Accesibilidad**:
   - Validar contraste de color, estados focus visibles y legibilidad.

3. **Cierre de diseño**:
   - Documentar decisiones de branding y componentes para futuras iteraciones.
   - Aprobar checklist final antes de pasar a ajustes funcionales adicionales.

### Consideraciones Adicionales

- **Seguridad**: Nunca almacenar passwords en frontend. Usar HTTPS en producción.
- **Performance**: Implementar lazy loading para rutas, paginación en listas grandes.
- **Responsive**: Asegurar que las tablas y formularios funcionen en móvil.
- **Internacionalización**: Si necesario, preparar para múltiples idiomas.
- **Deployment**: Configurar variables de entorno para URLs de backend (desarrollo/producción).

Esta planificación proporciona una ruta clara para transformar el template actual en una aplicación funcional integrada con el backend de shipments.
