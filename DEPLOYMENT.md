# Guía de Despliegue - Aplicación Gestión de Cupos

## 🎯 Prerequisitos

### Software Requerido
- [ ] Node.js 18.x o superior
- [ ] npm 8.x o superior  
- [ ] Cloud Foundry CLI 8.x o superior
- [ ] MBT (Multi-Target Application Builder) 1.2.x o superior (opcional)
- [ ] SAP UI5 CLI 3.x

### Accesos SAP BTP
- [ ] Acceso a SAP BTP Cockpit
- [ ] Subaccount con Cloud Foundry habilitado
- [ ] Space de desarrollo/producción
- [ ] Permisos para crear destinations
- [ ] Permisos para crear servicios (XSUAA, Destination, HTML5 Apps Repo)

### Servicios SAP BTP
- [ ] SAP Identity Authentication Service (IAS) configurado
- [ ] Trust configurado entre BTP y IAS
- [ ] Destination `dest_int_s` creado y configurado

## 📋 Checklist Pre-Deployment

### 1. Verificar Destination
```bash
# En SAP BTP Cockpit
Connectivity > Destinations > dest_int_s
```

Verificar:
- ✅ Name: `dest_int_s`
- ✅ Type: HTTP
- ✅ URL: https://ccb-is-dev-5v6vds1v.it-cpi034-rt.cfapps.us10-002.hana.ondemand.com
- ✅ Authentication: OAuth2ClientCredentials
- ✅ Client ID configurado
- ✅ Client Secret configurado
- ✅ Token Service URL configurado

### 2. Verificar Configuración IAS
```bash
# En SAP BTP Cockpit
Security > Trust Configuration
```

Verificar:
- ✅ IAS tenant configurado como Identity Provider
- ✅ User Attribute `employeeId` o `userId` mapeado

### 3. Preparar Variables de Entorno
```bash
# Crear archivo .env (NO commitear a git)
DESTINATION_NAME=dest_int_s
CLIENT_SECRET=<client_secret_from_destination>
```

## 🚀 Métodos de Despliegue

### Método 1: Despliegue Manual con CF CLI (Rápido)

#### Paso 1: Build
```bash
cd fiori-quota-app
npm ci
npm run build
```

#### Paso 2: Login a Cloud Foundry
```bash
cf login -a https://api.cf.us10-002.hana.ondemand.com
# Ingresar usuario y contraseña
# Seleccionar org y space
```

#### Paso 3: Crear Servicios (Primera vez)
```bash
# Crear servicio XSUAA
cf create-service xsuaa application fiori-quota-app-xsuaa -c xs-security.json

# Crear servicio HTML5 Apps Repository
cf create-service html5-apps-repo app-host fiori-quota-app-html5-srv

# Verificar servicios
cf services
```

#### Paso 4: Deploy
```bash
cf push fiori-quota-app -p dist -m 256M --random-route
```

#### Paso 5: Bind Servicios
```bash
cf bind-service fiori-quota-app fiori-quota-app-xsuaa
cf bind-service fiori-quota-app fiori-quota-app-html5-srv
cf restage fiori-quota-app
```

#### Paso 6: Obtener URL
```bash
cf apps
# Copiar la URL de fiori-quota-app
```

---

### Método 2: Despliegue con MTA (Recomendado para Producción)

#### Paso 1: Instalar MBT
```bash
npm install -g mbt
```

#### Paso 2: Configurar Client Secret
```bash
# Editar mta.yaml y reemplazar ((dest_int_s_client_secret))
# O configurar como variable de entorno
export dest_int_s_client_secret="<client_secret>"
```

#### Paso 3: Build MTA
```bash
cd fiori-quota-app
mbt build -t ./mta_archives
```

Esto genera: `mta_archives/fiori-quota-app_1.0.0.mtar`

#### Paso 4: Login a Cloud Foundry
```bash
cf login -a https://api.cf.us10-002.hana.ondemand.com
```

#### Paso 5: Deploy MTA
```bash
cf deploy mta_archives/fiori-quota-app_1.0.0.mtar
```

Este comando:
- ✅ Crea todos los servicios necesarios
- ✅ Despliega la aplicación
- ✅ Configura el destination
- ✅ Vincula los servicios
- ✅ Configura roles y permisos

#### Paso 6: Verificar Deployment
```bash
cf apps
cf services
```

---

### Método 3: Despliegue desde SAP Business Application Studio

#### Paso 1: Abrir BAS
1. Navegar a SAP Business Application Studio
2. Abrir workspace con el proyecto

#### Paso 2: Build
```bash
npm ci
npm run build
```

#### Paso 3: Deploy
1. Click derecho en `mta.yaml`
2. Seleccionar "Build MTA Project"
3. Esperar a que termine el build
4. Click derecho en el archivo `.mtar` generado
5. Seleccionar "Deploy MTA Archive"
6. Seleccionar target (org/space)
7. Confirmar deployment

---

## 🔧 Post-Deployment

### 1. Asignar Roles a Usuarios
```bash
# En SAP BTP Cockpit
Security > Role Collections > QuotaManagementUser
```

1. Agregar usuarios que necesitan acceso
2. Guardar cambios

### 2. Verificar Destination
```bash
# En SAP BTP Cockpit
Connectivity > Destinations
```

Verificar que `dest_int_s` esté accesible desde la aplicación

### 3. Probar la Aplicación
1. Abrir la URL de la aplicación
2. Login con usuario de IAS
3. Verificar que carga la vista de asignación
4. Probar flujo completo:
   - Ver cupos disponibles
   - Asignar cupos
   - Ver mis asignaciones
   - Cancelar asignaciones

### 4. Verificar Logs
```bash
# Ver logs de la aplicación
cf logs fiori-quota-app --recent

# Ver logs en tiempo real
cf logs fiori-quota-app
```

## 🐛 Troubleshooting

### Error: "No route to destination"
**Solución:**
```bash
# Verificar que la app tenga una ruta
cf routes

# Mapear una ruta si no existe
cf map-route fiori-quota-app cfapps.us10-002.hana.ondemand.com --hostname fiori-quota-app-<random>
```

### Error: "Destination dest_int_s not found"
**Solución:**
1. Verificar en BTP Cockpit que el destination existe
2. Verificar que el nombre sea exactamente `dest_int_s`
3. Verificar que el destination sea accesible desde el space

### Error: "Authentication failed"
**Solución:**
1. Verificar que XSUAA service esté vinculado
2. Verificar trust con IAS
3. Re-bind el servicio:
```bash
cf unbind-service fiori-quota-app fiori-quota-app-xsuaa
cf bind-service fiori-quota-app fiori-quota-app-xsuaa
cf restage fiori-quota-app
```

### Error: "CORS policy"
**Solución:**
1. Verificar `xs-app.json` tiene las rutas correctas
2. Verificar que el destination permita el origen
3. Agregar headers en el destination:
   - `sap-client: <client>`
   - `Use default JDK truststore: true`

### Error: Build falla en MTA
**Solución:**
```bash
# Limpiar cache y rebuild
rm -rf node_modules package-lock.json
npm cache clean --force
npm ci
mbt build -t ./mta_archives
```

## 📊 Monitoreo

### Verificar Estado
```bash
# Estado de la app
cf app fiori-quota-app

# Uso de recursos
cf app fiori-quota-app --guid
cf curl /v3/processes/<guid>/stats
```

### Ver Métricas
```bash
# En SAP BTP Cockpit
Applications > fiori-quota-app > Metrics
```

### Alertas
Configurar alertas para:
- CPU > 80%
- Memory > 90%
- Crashes > 0
- Response time > 3s

## 🔄 Actualización de la Aplicación

### Update Manual
```bash
cd fiori-quota-app
git pull origin main
npm ci
npm run build
cf push fiori-quota-app -p dist
```

### Update con MTA
```bash
cd fiori-quota-app
git pull origin main
mbt build -t ./mta_archives
cf deploy mta_archives/fiori-quota-app_1.0.0.mtar
```

### Blue-Green Deployment (Cero downtime)
```bash
# Deploy nueva versión
cf push fiori-quota-app-new -p dist -m 256M

# Probar nueva versión
curl https://fiori-quota-app-new.cfapps.us10-002.hana.ondemand.com

# Intercambiar rutas
cf map-route fiori-quota-app-new cfapps.us10-002.hana.ondemand.com --hostname fiori-quota-app
cf unmap-route fiori-quota-app cfapps.us10-002.hana.ondemand.com --hostname fiori-quota-app

# Eliminar versión antigua
cf delete fiori-quota-app -f

# Renombrar nueva versión
cf rename fiori-quota-app-new fiori-quota-app
```

## 📝 Checklist Final

- [ ] Aplicación desplegada y accesible
- [ ] Usuarios pueden hacer login
- [ ] Destination funciona correctamente
- [ ] Se cargan los datos de cupos
- [ ] Se pueden asignar cupos
- [ ] Se pueden ver asignaciones
- [ ] Se pueden cancelar asignaciones
- [ ] Logs no muestran errores críticos
- [ ] Roles asignados a usuarios
- [ ] Documentación actualizada
- [ ] Backup de configuración realizado

## 🆘 Soporte

Para problemas durante el despliegue:
1. Revisar logs: `cf logs fiori-quota-app --recent`
2. Verificar servicios: `cf services`
3. Verificar variables de entorno: `cf env fiori-quota-app`
4. Contactar al equipo de desarrollo

---

**Última actualización:** Febrero 2026
