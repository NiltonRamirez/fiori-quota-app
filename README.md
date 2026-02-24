# Gestión de Cupos - SAP Fiori Application

Aplicación SAP Fiori para la gestión de cupos de guardería, diseñada para desplegarse en SAP Business Technology Platform (BTP).

## 📋 Descripción

Esta aplicación permite a los colaboradores:
- Asignar cupos de guardería para sus hijos menores de 6 años
- Ver y gestionar sus asignaciones existentes
- Manejar listas de espera cuando no hay cupos disponibles
- Consultar disponibilidad por semana

## 🏗️ Arquitectura

### Tecnologías
- **Frontend**: SAPUI5 1.120+
- **Diseño**: SAP Fiori (sap.m library)
- **Autenticación**: SAP Identity Authentication Service (IAS)
- **Backend**: Servicios REST vía SAP BTP Destination
- **Deployment**: SAP BTP Cloud Foundry

### Estructura del Proyecto
```
fiori-quota-app/
├── webapp/
│   ├── controller/          # Controladores de vistas
│   ├── view/                # Vistas XML
│   ├── model/               # Formatters y modelos
│   ├── service/             # Capa de servicios REST
│   ├── i18n/                # Textos internacionales
│   ├── css/                 # Estilos personalizados
│   ├── manifest.json        # Descriptor de aplicación
│   ├── index.html           # Página principal
│   ├── Component.js         # Componente raíz
│   └── xs-app.json          # Configuración de routing
├── package.json             # Dependencias npm
├── ui5.yaml                 # Configuración UI5
└── manifest.yml             # Configuración Cloud Foundry
```

## 🔐 Configuración del Destination

La aplicación utiliza el destination `dest_int_s` en SAP BTP con los siguientes detalles:

- **Nombre**: dest_int_s
- **Tipo**: HTTP
- **Autenticación**: OAuth2ClientCredentials
- **URL Base**: https://ccb-is-dev-5v6vds1v.it-cpi034-rt.cfapps.us10-002.hana.ondemand.com

### Configuración en SAP BTP Cockpit

1. Navegar a: Connectivity > Destinations
2. Verificar que el destination `dest_int_s` esté configurado con:
   - Client ID
   - Client Secret
   - Token Service URL

## 🚀 Endpoints Utilizados

### 1. Obtener Overview de Cupos
```
POST /http/api/quota/overview
Body: {
  "x-user-id": "00200240",
  "weekStartDate": "2026-02-16T00:00:00.000"
}
```

### 2. Guardar Asignaciones
```
POST /http/saveAssignments
Body: {
  "employeeId": "00200241",
  "assignments": [...]
}
```

### 3. Consultar Mis Asignaciones
```
GET /http/myAssignments?employeeId=00200241&weekStartDate=2026-02-16
```

### 4. Cancelar Asignaciones
```
POST /http/cancelAssignments
Body: {
  "employeeId": "00200241",
  "cancellations": [...]
}
```

## 💻 Desarrollo Local

### Prerequisitos
- Node.js 18+ 
- npm 8+
- SAP UI5 CLI (`@ui5/cli`)

### Instalación
```bash
# Navegar al directorio del proyecto
cd fiori-quota-app

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start
```

La aplicación estará disponible en: http://localhost:8080

### Configuración Local del Destination

Para desarrollo local, necesitas configurar un proxy al destination. Esto se puede hacer mediante:

1. **SAP Business Application Studio**: El destination se resuelve automáticamente
2. **Visual Studio Code con SAP Fiori Tools**: Configurar en `ui5.yaml`
3. **Proxy local**: Configurar variables de entorno

## 📦 Build y Deployment

### Build de la Aplicación
```bash
npm run build
```

Esto genera la carpeta `dist/` con los assets optimizados.

### Deployment en SAP BTP

#### Opción 1: Cloud Foundry CLI
```bash
# Login a SAP BTP
cf login -a <api-endpoint>

# Deploy
cf push
```

#### Opción 2: MTA Build Tool
```bash
# Instalar mbt
npm install -g mbt

# Build MTA
mbt build

# Deploy
cf deploy mta_archives/fiori-quota-app_1.0.0.mtar
```

#### Opción 3: SAP BTP Cockpit
1. Navegar a SAP BTP Cockpit
2. HTML5 Applications
3. Upload `dist/` folder

## 🔧 Configuración de Autenticación (IAS)

La aplicación obtiene automáticamente el ID del usuario autenticado mediante el User API de SAP BTP:

```javascript
/services/userapi/currentUser
```

Asegúrate de que:
1. La aplicación esté vinculada a un servicio XSUAA
2. El trust esté configurado con SAP IAS
3. Los usuarios tengan acceso asignado

## 📱 Características Principales

### Vista 1: Asignación de Cupo
- Selección de semana (navegación)
- Listado de hijos menores de 6 años
- Visualización de disponibilidad por día
- Selección múltiple de días
- Indicadores visuales:
  - ✅ Disponible
  - ⚠️ Lista de espera (sin cupo)
  - 🚫 No disponible (festivo/ausentismo)
  - ✔️ Ya asignado
- Guardar asignaciones

### Vista 2: Mis Cupos
- Listado de asignaciones existentes
- Filtrado por semana
- Selección múltiple para cancelación
- Estados:
  - Confirmado
  - Lista de Espera
  - Cancelado

## 🎨 Diseño Fiori

La aplicación sigue los principios de diseño SAP Fiori:
- **Responsive**: Funciona en desktop, tablet y móvil
- **Accesible**: Cumple con estándares de accesibilidad
- **Consistente**: Usa controles estándar sap.m
- **Intuitivo**: Navegación clara y mensajes descriptivos

## 📝 Validaciones y Reglas de Negocio

1. **Sin hijos menores de 6 años**: Se muestra mensaje informativo y se bloquea la interfaz
2. **Día sin cupo (NO_QUOTA)**: Se permite selección pero advierte sobre lista de espera
3. **Festivo**: No se permite selección
4. **Ausentismo**: No se permite selección
5. **Ya asignado**: No se permite selección adicional

## 🐛 Troubleshooting

### Error: "No se pudo obtener información del usuario"
- Verificar que el servicio XSUAA esté vinculado
- Verificar trust con IAS en SAP BTP

### Error: "Error al cargar la información de cupos"
- Verificar que el destination `dest_int_s` esté configurado correctamente
- Verificar credenciales OAuth2
- Revisar logs del servicio backend

### Error: "CORS policy"
- Verificar configuración de `xs-app.json`
- Verificar que el destination permita el origen

## 📄 Licencia

Copyright © 2026 Cámara de Comercio de Bogotá

## 👥 Soporte

Para soporte técnico o preguntas, contactar al equipo de desarrollo.
