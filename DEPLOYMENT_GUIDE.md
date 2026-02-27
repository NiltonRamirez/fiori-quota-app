# 🚀 Guía de Deployment a BTP (Test/Producción)

## 📋 Requisitos Previos

### 1. **Herramientas necesarias**
- [x] Cloud Foundry CLI instalado: https://docs.cloudfoundry.org/cf-cli/install-go-cli.html
- [x] MBT (Cloud MTA Build Tool): `npm install -g mbt`
- [x] Node.js y npm instalados

### 2. **Accesos necesarios**
- [x] Usuario con rol **Space Developer** en la subcuenta de BTP
- [x] Access a la organización y space de BTP del cliente
- [x] Client Secret del destination `dest_int_s` (OAuth2ClientCredentials)

### 3. **Servicios en BTP que se crearán automáticamente**
- HTML5 Application Repository (app-host)
- Destination Service (lite)
- Authorization & Trust Management (XSUAA - application plan)

---

## 🔧 Configuración Inicial

### **Paso 1: Editar archivo de configuración de deployment**

1. Abre el archivo `deployment-config.mtaext`
2. Reemplaza `TU_CLIENT_SECRET_AQUI` con el **Client Secret real** del destination
3. **NO SUBAS ESTE ARCHIVO A GIT** (ya está en .gitignore)

```yaml
clientSecret: "a1b2c3d4e5f6g7h8i9j0..." # Tu secreto real aquí
```

### **Paso 2: Login a Cloud Foundry**

```bash
# Conectar a la API de Cloud Foundry
cf login -a https://api.cf.us10-001.hana.ondemand.com

# Seleccionar:
# - Org: [nombre-org-cliente]
# - Space: test (o el nombre del space de test)
```

Verificar conexión:
```bash
cf target
```

---

## 🚀 Deployment

### **Opción A: Usar el script automatizado (Recomendado)**

#### En Windows (PowerShell):
```powershell
.\deploy.ps1
```

#### En Linux/Mac/BAS:
```bash
chmod +x deploy.sh
./deploy.sh
```

### **Opción B: Deployment manual paso a paso**

```bash
# 1. Instalar dependencias
npm ci

# 2. Build UI5
npm run build

# 3. Build MTA
mbt build -t ./mta_archives

# 4. Deploy a Cloud Foundry
cf deploy mta_archives/fiori-quota-app_1.0.0.mtar -e deployment-config.mtaext
```

---

## 📦 Qué se desplegará

El deployment creará:

1. **HTML5 Application** 
   - Nombre: `comccbquota`
   - Subida al HTML5 Apps Repository

2. **Servicios BTP**:
   - `fiori-quota-app-html5-srv` (HTML5 Apps Repo)
   - `fiori-quota-app-destination-service` (Destination Service con dest_int_s)
   - `fiori-quota-app-xsuaa` (XSUAA para autenticación)

3. **Destination automático**: `dest_int_s` con configuración OAuth2

---

## 🔒 Configuración Post-Deployment

### **1. Asignar roles a usuarios**

En BTP Cockpit:
1. Ir a **Security > Role Collections**
2. Buscar **QuotaManagementUser**
3. Click en **Edit**
4. Agregar usuarios que tendrán acceso a la app

### **2. Agregar app al Launchpad**

#### **Opción A: Site Manager (Recomendado)**

1. Ir a **Instances and Subscriptions**
2. Abrir **Launchpad Service**
3. En **Content Manager**:
   - Click **Content Explorer**
   - Seleccionar **HTML5 Apps**
   - Buscar **Gestión de Cupos**
   - Click **Add to My Content**
4. Crear o editar un **Group**:
   - Agregar los tiles:
     - "Asignación de Cupos"
     - "Mis Cupos Asignados"
5. Asignar el Group a un **Site**

#### **Opción B: Configuración manual de tiles**

**Tile 1: Asignación de Cupos**
```json
{
  "title": "Asignación de Cupos",
  "subtitle": "Solicitar cupos semanales",
  "icon": "sap-icon://calendar",
  "semanticObject": "QuotaApp",
  "action": "display"
}
```

**Tile 2: Mis Cupos Asignados**
```json
{
  "title": "Mis Cupos Asignados",
  "subtitle": "Ver y cancelar asignaciones",
  "icon": "sap-icon://appointment",
  "semanticObject": "QuotaApp",
  "action": "myAssignments"
}
```

### **3. Verificar Destination (si no usaste .mtaext)**

Si NO usaste el archivo `deployment-config.mtaext`, configura manualmente:

1. Ir a **Connectivity > Destinations**
2. Crear **New Destination**:
   - Name: `dest_int_s`
   - Type: `HTTP`
   - URL: `https://ccb-is-dev-5v6vds1v.it-cpi034-rt.cfapps.us10-002.hana.ondemand.com`
   - Proxy Type: `Internet`
   - Authentication: `OAuth2ClientCredentials`
   - Token Service URL: `https://ccb-is-dev-5v6vds1v.authentication.us10.hana.ondemand.com/oauth/token`
   - Client ID: `sb-929514f2-7649-4f9b-9d7a-33c735214f2d!b514001|it-rt-ccb-is-dev-5v6vds1v!b410334`
   - Client Secret: `[TU_SECRETO]`

---

## 🔍 Verificar Deployment

### **Ver estado de la aplicación**
```bash
cf apps
```

Deberías ver:
- `fiori-quota-app-destination-content` (stopped - normal)
- `comccbquota` (stopped - normal, es HTML5)

### **Ver servicios creados**
```bash
cf services
```

Deberías ver:
- `fiori-quota-app-html5-srv`
- `fiori-quota-app-destination-service`
- `fiori-quota-app-xsuaa`

### **Acceder a la aplicación**

1. Ir a **HTML5 Applications** en BTP Cockpit
2. Buscar **Gestión de Cupos**
3. Click para abrir

O desde el **Launchpad** configurado.

---

## 🔄 Re-deployment (Actualizaciones)

Para actualizar la aplicación después de cambios:

```bash
# 1. Pull de cambios del repo
git pull origin main

# 2. Re-ejecutar deployment
.\deploy.ps1
# o
./deploy.sh
```

El MTA sobrescribirá la app existente sin afectar los servicios.

---

## 🐛 Troubleshooting

### **Error: "clientSecret" required**
- Solución: Edita `deployment-config.mtaext` con el secreto real

### **Error: "Service already exists"**
- Solución: Elimina el servicio existente o usa `--delete-services`
```bash
cf delete-service fiori-quota-app-destination-service
cf deploy mta_archives/fiori-quota-app_1.0.0.mtar -e deployment-config.mtaext
```

### **App no aparece en HTML5 Apps**
- Espera 5-10 minutos (propagación)
- Refresca el navegador con Ctrl+F5
- Verifica que el deployment completó sin errores

### **Error 403 en llamadas al backend**
- Verifica que CSRF token está habilitado en CPI
- Verifica las credenciales OAuth2 del destination
- Revisa logs: `cf logs comccbquota --recent`

### **Usuarios no pueden acceder**
- Verifica que tienen asignado el role collection **QuotaManagementUser**
- Verifica que el tile está en un Group asignado al Site

---

## 📞 URLs Importantes

- **BTP Cockpit**: https://cockpit.us10-001.hana.ondemand.com/
- **CF API**: https://api.cf.us10-001.hana.ondemand.com
- **GitHub Repo**: https://github.com/NiltonRamirez/fiori-quota-app

---

## 📝 Notas Importantes

⚠️ **SEGURIDAD**:
- El archivo `deployment-config.mtaext` contiene secretos - **NUNCA lo subas a Git**
- Ya está agregado al `.gitignore`
- En producción, considera usar **BTP Credential Store** en lugar de hardcodear secretos

✅ **BUENAS PRÁCTICAS**:
- Usa diferentes subcuentas para Dev, Test y Prod
- Mantén separados los destinations para cada ambiente
- Documenta cambios en `CHANGELOG.md` antes de deployar
