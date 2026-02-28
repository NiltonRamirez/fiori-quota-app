# Lecciones Aprendidas - Despliegue BTP Cloud Foundry

## CONCEPTO CRÍTICO: Cloud Foundry HTML5 Apps Repo requiere ZIP

**Cloud Foundry NO acepta carpetas sueltas para HTML5 Apps Repository. SIEMPRE requiere un archivo ZIP.**

### Estructura correcta del ZIP
```
comccbquota.zip
├── Component-preload.js
├── manifest.json
├── index.html
├── controller/
├── view/
├── model/
├── service/
├── css/
├── i18n/
└── (todos los archivos del build en la raíz del ZIP)
```

### ❌ ERROR COMÚN: Enviar carpeta en lugar de ZIP
```yaml
# INCORRECTO - MTA intentará enviar carpeta dist/
- name: comccbquota
  type: html5
  path: webapp
  build-parameters:
    builder: custom
    commands:
      - ui5 build --dest dist
```

### ✅ SOLUCIÓN: Script que crea ZIP desde dist/
```javascript
// create-zip.js
const archiver = require('archiver');
const fs = require('fs');

const output = fs.createWriteStream('./dist/comccbquota.zip');
const archive = archiver('zip', { zlib: { level: 9 } });

archive.pipe(output);
archive.directory('./dist/', false); // false = archivos en raíz del ZIP
archive.finalize();
```

---

## Configuración MTA Correcta (Después de 6+ iteraciones)

### 1. Módulo HTML5 App
```yaml
- name: comccbquota
  type: html5
  path: .                    # ← Punto CRUCIAL: raíz del proyecto (no "webapp")
  build-parameters:
    builder: custom
    commands:
      - npm run build:mta    # ← Script que ejecuta ui5 build Y crea ZIP
    supported-platforms: []
    build-result: dist       # Resultado del build está en carpeta dist/
```

**package.json debe tener:**
```json
{
  "scripts": {
    "build:mta": "ui5 build --dest dist && node create-zip.js"
  },
  "devDependencies": {
    "archiver": "^5.3.1"     // ← Dependencia necesaria
  }
}
```

### 2. Módulo App Content (HTML5 Repo Deployer)
```yaml
- name: fiori-quota-app-app-content
  type: com.sap.application.content
  path: .                          # ← Path obligatorio o usar no-source
  build-parameters:
    build-result: resources        # ← MTA copia dist/comccbquota.zip aquí
  requires:
    - name: comccbquota
      artifacts:
        - comccbquota.zip          # ← Nombre EXACTO del ZIP
      target-path: resources/
```

**IMPORTANTE:** MTA copia `dist/comccbquota.zip` → `resources/comccbquota.zip` antes de empaquetar el .mtar

### 3. Módulo Destination Content
```yaml
- name: fiori-quota-app-destination-content
  type: com.sap.application.content
  build-parameters:
    no-source: true        # ← OBLIGATORIO para módulos com.sap.application.content sin path
  requires:
    - name: fiori-quota-app-destination-service
      parameters:
        content-target: true
    - name: fiori-quota-app-xsuaa
      parameters:
        service-key:
          name: fiori-quota-app-xsuaa-key
```

---

## Manejo de Credenciales OAuth2

### ❌ NUNCA commitear credenciales en mta.yaml
```yaml
# NO HACER ESTO
- name: fiori-quota-app-destination-service
  parameters:
    config:
      init_data:
        instance:
          destinations:
            - Authentication: OAuth2ClientCredentials
              Name: BACKEND_DESTINATION
              clientId: sb-929514f2-xxxx        # ← PELIGRO
              clientSecret: 919238f2-xxxx       # ← PELIGRO
```

### ✅ USAR deployment-config.mtaext (excluido de git)
```yaml
# deployment-config.mtaext
_schema-version: '3.1'
ID: fiori-quota-app-config
extends: fiori-quota-app

modules:
  - name: fiori-quota-app-destination-content
    parameters:
      config:
        init_data:
          instance:
            destinations:
              - Authentication: OAuth2ClientCredentials
                Name: BACKEND_DESTINATION
                clientId: <REAL_CLIENT_ID>
                clientSecret: <REAL_CLIENT_SECRET>
                tokenServiceURL: https://xxx.authentication.us10.hana.ondemand.com/oauth/token
```

**.gitignore debe incluir:**
```
deployment-config.mtaext
*.mtar
.env
```

---

## Errores Comunes de MTA Build y Soluciones

### Error 1: "could not find path for module"
```
Error: Module 'fiori-quota-app-destination-content' of type 'com.sap.application.content' 
       must have a path or build-parameters.no-source set to true
```
**Solución:** Agregar `build-parameters: no-source: true`

### Error 2: "could not find /webapp/dist/comccbquota.zip"
**Causa:** `path: webapp` pero el build genera `dist/` en raíz
**Solución:** Cambiar a `path: .`

### Error 3: "Invalid file format, expected ZIP"
**Causa:** HTML5 Apps Repo recibió carpeta en lugar de ZIP
**Solución:** Crear create-zip.js y agregarlo al build:mta script

### Error 4: "could not find resources/comccbquota.zip"
**Causa:** app-content buscando *.zip en `resources/` pero build-result era `dist`
**Solución:** 
```yaml
build-parameters:
  build-result: resources    # ← MTA copiará dist/comccbquota.zip aquí
```

### Error 5: CSRF Token 403 en POST (runtime)
**Causa:** Backend CPI requiere X-CSRF-Token pero HEAD request falla con 500
**Solución:** Usar GET con header `X-CSRF-Token: Fetch` en lugar de HEAD

---

## Flujo de Build Completo

```bash
# 1. Build de UI5 (genera dist/ con archivos transpilados)
ui5 build --dest dist

# 2. Crear ZIP desde dist/ (create-zip.js)
node create-zip.js
# → Genera dist/comccbquota.zip

# 3. Build de MTA
mbt build -e deployment-config.mtaext
# → MTA copia dist/comccbquota.zip a resources/comccbquota.zip
# → Genera mta_archives/fiori-quota-app_1.0.0.mtar

# 4. Deploy
cf deploy mta_archives/fiori-quota-app_1.0.0.mtar
```

---

## Migración de Regiones BTP

Si backend está en us10-002 pero BTP org está en us10-001:

**xs-security.json:**
```json
{
  "oauth2-configuration": {
    "redirect-uris": [
      "https://*.us10-001.hana.ondemand.com/**"   // ← Región del ORG, no del backend
    ]
  }
}
```

**deployment-config.mtaext:**
```yaml
tokenServiceURL: https://xxx.authentication.us10.hana.ondemand.com/oauth/token
# ← us10 sin región específica (funciona para ambas regiones)

URL: "https://ccb-is-dev-xxx.it-cpi034-rt.cfapps.us10-002.hana.ondemand.com"
# ← Backend sí puede estar en diferente región
```

---

## Checklist Pre-Deployment

### Información a recopilar del cliente:
- [ ] Client ID de OAuth2
- [ ] Client Secret de OAuth2
- [ ] Token Service URL (https://xxx.authentication.us10.hana.ondemand.com/oauth/token)
- [ ] Backend URL completa
- [ ] Organización BTP
- [ ] Espacio BTP
- [ ] Región API (cf api)

### Archivos a crear/modificar:
- [ ] `create-zip.js` (script de empaquetado)
- [ ] `deployment-config.mtaext` (credenciales - NO commitear)
- [ ] `mta.yaml` (configuración de módulos)
- [ ] `xs-security.json` (redirect-uris con región correcta)
- [ ] `package.json` (agregar script build:mta y dependencia archiver)
- [ ] `.gitignore` (excluir deployment-config.mtaext)

### Nombres que deben ser consistentes:
```
mta.yaml ID:                    fiori-quota-app
mta.yaml modules[].name:        comccbquota
create-zip.js output:           comccbquota.zip
manifest.json sap.app.id:       com.ccb.quota
package.json name:              fiori-quota-app
```

### Test local antes de deploy:
```bash
npm install              # Instalar archiver
npm run build:mta        # Verificar que genera dist/comccbquota.zip
unzip -l dist/comccbquota.zip  # Verificar contenido del ZIP
mbt build -e deployment-config.mtaext  # Verificar que genera .mtar sin errores
```

---

## Prompt para Agente en Futuro Despliegue

**"Necesito desplegar una app Fiori a BTP Cloud Foundry siguiendo la arquitectura de HTML5 Apps Repository. Revisar BTP_DEPLOYMENT_LESSONS.md para las lecciones aprendidas. Los puntos críticos son:**

**1. CF solo acepta ZIP para HTML5 Apps Repo (no carpetas)**
**2. Necesito script create-zip.js que empaquete dist/ en ZIP**
**3. mta.yaml debe tener path: "." y build-result: resources**
**4. Módulos com.sap.application.content requieren no-source: true**
**5. Credenciales OAuth2 van en deployment-config.mtaext (NO en git)**
**6. xs-security.json redirect-uris debe usar región del ORG BTP**

**Datos del backend:**
- Client ID: [PEGAR]
- Client Secret: [PEGAR]
- Token URL: [PEGAR]
- Backend URL: [PEGAR]

**Datos BTP:**
- API: https://api.cf.us10-001.hana.ondemand.com
- Org: [PEGAR]
- Espacio: [PEGAR]

**Ayúdame a configurar todos los archivos necesarios para el despliegue.**"

---

## Comandos Post-Deployment

```bash
# Verificar servicios creados
cf services

# Verificar apps (HTML5 apps NO aparecen en cf apps - esto es normal)
cf apps

# Ver logs si hay errores
cf logs fiori-quota-app-app-content --recent

# Si necesitas recrear servicios
cf delete-service fiori-quota-app-html5-srv -f
cf delete-service fiori-quota-app-destination-service -f
cf delete-service fiori-quota-app-xsuaa -f
```

### Configuración post-deployment en BTP Cockpit:
1. **HTML5 Applications** → Verificar que app aparece
2. **Security → Role Collections** → Asignar QuotaManagementUser a usuarios
3. **Launchpad Site Manager** → Content Manager → HTML5 Apps → Add to My Content
4. **Content Manager → My Content** → Create Group con tiles de la app
5. **Site Directory → [Tu Site]** → Asignar role collection al sitio

---

## Resumen Ejecutivo

**Para próximo despliegue similar, recordar:**

1. **ZIP obligatorio** - CF HTML5 Apps Repo siempre requiere ZIP, nunca carpetas
2. **Script de empaquetado** - create-zip.js con archiver para generar el ZIP desde dist/
3. **MTA path: "."** - Build en raíz del proyecto, no en webapp/
4. **no-source: true** - Para módulos com.sap.application.content sin código
5. **Credenciales fuera de git** - deployment-config.mtaext en .gitignore
6. **Consistencia de nombres** - Verificar que coincidan en mta.yaml, manifest.json, create-zip.js
7. **Test local primero** - npm run build:mta y mbt build antes de deploy
8. **CSRF con GET** - Si HEAD falla, usar GET con X-CSRF-Token: Fetch
9. **Región en redirect-uris** - Debe ser la región del ORG BTP, no del backend
10. **HTML5 apps invisibles** - Es normal que no aparezcan en `cf apps`
