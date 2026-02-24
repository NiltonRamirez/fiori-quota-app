# Guía de Desarrollo Local

## 🖥️ Setup Inicial

### 1. Clonar el Repositorio
```bash
git clone <repository-url>
cd fiori-quota-app
```

### 2. Instalar Dependencias
```bash
# Instalar dependencias de la aplicación
npm install

# Instalar dependencias del mock server
cd mock-server
npm install --package-lock-only
npm install --production=false express cors
cd ..
```

### 3. Configurar Variables de Entorno
Crear archivo `.env` en la raíz del proyecto:
```env
# Development
NODE_ENV=development
MOCK_SERVER_PORT=5000
UI5_VERSION=1.120.1

# BTP Configuration (optional for local)
DESTINATION_NAME=dest_int_s
```

## 🚀 Ejecutar en Local

### Opción 1: Con Mock Server (Recomendado)

**Terminal 1 - Mock Server:**
```bash
node mock-server.js
```
Esto inicia el mock server en `http://localhost:5000`

**Terminal 2 - UI5 App:**
```bash
npm start
```
Esto inicia la aplicación en `http://localhost:8080`

**Navegar a:**
```
http://localhost:8080/index.html
```

### Opción 2: Conectar a Backend Real

Modificar `ui5.yaml`:
```yaml
server:
  customMiddleware:
    - name: fiori-tools-proxy
      afterMiddleware: compression
      configuration:
        ignoreCertError: false
        backend:
          - path: /destinations
            url: https://ccb-is-dev-5v6vds1v.it-cpi034-rt.cfapps.us10-002.hana.ondemand.com
            destination: dest_int_s
```

Luego ejecutar:
```bash
npm start
```

### Opción 3: SAP Business Application Studio

1. Abrir el proyecto en BAS
2. Ejecutar desde la terminal:
```bash
npm install
npm start
```
3. BAS automáticamente resuelve los destinations

## 🧪 Testing

### Datos de Prueba

**Usuarios:**
- `10000` - Usuario con 2 hijos
- `00200240` - Usuario con hijos
- `99999` - Usuario sin hijos (error 404)

**Semanas de Prueba:**
- `2026-02-16` - Semana con disponibilidad variada
- `2026-02-23` - Semana con asignaciones

### Escenarios de Prueba

#### 1. Usuario con Hijos
1. Login con user `10000`
2. Ver lista de hijos y disponibilidad
3. Seleccionar días disponibles
4. Guardar asignaciones
5. Ver asignaciones guardadas en "Mis Cupos"

#### 2. Usuario sin Hijos
1. Login con user `99999`
2. Ver mensaje "No tiene Hijos Menores a 6 Años"
3. Interfaz deshabilitada

#### 3. Día sin Cupo (Lista de Espera)
1. Seleccionar miércoles 18/02 (NO_QUOTA)
2. Ver advertencia de lista de espera
3. Confirmar selección
4. Guardar
5. Verificar status "WAITING_LIST" en respuesta

#### 4. Cancelar Asignaciones
1. Ir a "Mis Cupos"
2. Seleccionar asignaciones
3. Cancelar
4. Verificar que desaparecen de la lista

## 🔍 Debugging

### Browser DevTools

**Chrome/Edge:**
```
F12 → Sources → webapp/controller/
```

**Breakpoints en:**
- `QuotaAssignment.controller.js` línea `_loadQuotaOverview`
- `QuotaService.js` línea `_callService`

### UI5 Inspector

Instalar extensión: [UI5 Inspector](https://chrome.google.com/webstore/detail/ui5-inspector/)

**Funciones útiles:**
- Ver árbol de controles
- Ver modelos y bindings
- Ver propiedades de controles
- Tracking de performance

### Console Logs

Habilitar logs de UI5:
```javascript
// En browser console
sap.ui.log.setLevel(5);
```

Ver logs del mock server en la terminal donde se ejecuta.

## 🛠️ Herramientas de Desarrollo

### VS Code Extensions (Recomendadas)

1. **SAP Fiori Tools**
   - Extension Pack para desarrollo Fiori
   - Includes Application Generator, XML Toolkit, etc.

2. **XML Tools**
   - Formateo y validación de XML

3. **ESLint**
   - Linting de JavaScript

4. **Prettier**
   - Formateo de código

### SAP Business Application Studio

Workspace preconfigurado con:
- UI5 CLI
- Cloud Foundry CLI
- Destinations automáticos
- Live reload

## 📝 Modificar la Aplicación

### Agregar Nueva Vista

1. Crear archivo XML:
```bash
webapp/view/NewView.view.xml
```

2. Crear controlador:
```bash
webapp/controller/NewView.controller.js
```

3. Agregar ruta en `manifest.json`:
```json
"routes": [
  {
    "name": "RouteNewView",
    "pattern": "newview",
    "target": ["TargetNewView"]
  }
]
```

### Agregar Nuevo Endpoint

1. Modificar `QuotaService.js`:
```javascript
getNewData: function() {
  return this._callService("/newEndpoint", "GET", {});
}
```

2. Agregar endpoint en mock server:
```javascript
app.get('/http/newEndpoint', (req, res) => {
  res.json({ data: "mock data" });
});
```

### Modificar Estilos

Editar `webapp/css/style.css`:
```css
.myNewClass {
  color: blue;
}
```

### Agregar Textos i18n

Editar `webapp/i18n/i18n.properties`:
```properties
newLabel=Nuevo Texto
```

Usar en XML:
```xml
<Text text="{i18n>newLabel}" />
```

## 🐛 Problemas Comunes

### App no Carga
```bash
# Limpiar cache y reinstalar
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Error CORS en Local
Verificar que mock server esté corriendo y tenga CORS habilitado:
```javascript
app.use(cors());
```

### Cambios no se Reflejan
```bash
# Hard refresh en browser
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

### Mock Server no Responde
```bash
# Verificar puerto ocupado
netstat -ano | findstr :5000  # Windows
lsof -i :5000                 # Mac/Linux

# Matar proceso
taskkill /PID <PID> /F        # Windows
kill -9 <PID>                 # Mac/Linux
```

## 📊 Performance

### Análisis de Bundle
```bash
npm run build
# Analizar carpeta dist/
```

### Lazy Loading
Considerar lazy loading de vistas:
```json
"async": true
```

### Minificación
Build automáticamente minifica:
```bash
npm run build
```

## 🔐 Seguridad en Desarrollo

⚠️ **NUNCA commitear:**
- `.env` files
- Credenciales
- Client secrets
- Tokens de acceso

✅ **Siempre:**
- Usar `.gitignore`
- Rotar secrets después de desarrollo
- Usar variables de entorno
- Revisar código antes de commit

## 📚 Recursos

### Documentación Oficial
- [SAPUI5 Documentation](https://sapui5.hana.ondemand.com/)
- [SAP Fiori Design Guidelines](https://experience.sap.com/fiori-design/)
- [SAP BTP Documentation](https://help.sap.com/viewer/product/BTP/)

### Tutoriales
- [SAPUI5 Walkthrough](https://sapui5.hana.ondemand.com/#/topic/3da5f4be63264db99f2e5b04c5e853db)
- [Fiori Elements](https://sapui5.hana.ondemand.com/#/topic/03265b0408e2432c9571d6b3feb6b1fd)

### Comunidad
- [SAP Community](https://community.sap.com/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/sapui5)

---

**Happy Coding! 🎉**
