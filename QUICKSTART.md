# 🚀 Quick Start Guide

## ⚡ Inicio Rápido - 5 Minutos

### Prerrequisitos
- Node.js 18+
- npm 8+

### Pasos

#### 1️⃣ Instalar Dependencias
```bash
cd fiori-quota-app
npm install
```

#### 2️⃣ Iniciar Mock Server
```bash
# Terminal 1
node mock-server.js
```

**Output esperado:**
```
🚀 Mock server running on http://localhost:5000
📡 Available endpoints:
   POST http://localhost:5000/http/api/quota/overview
   POST http://localhost:5000/http/saveAssignments
   ...
```

#### 3️⃣ Iniciar Aplicación
```bash
# Terminal 2
npm start
```

**Output esperado:**
```
Server started: http://localhost:8080
```

#### 4️⃣ Abrir en Browser
```
http://localhost:8080/index.html
```

¡Listo! La aplicación está funcionando. 🎉

---

## 🧪 Probar Funcionalidades

### Escenario 1: Ver Cupos Disponibles
1. La app carga automáticamente
2. Ver semana actual
3. Ver lista de hijos (2 hijos de muestra)
4. Ver días con diferentes estados:
   - ✅ Disponible (Lunes, Martes, Jueves, Viernes)
   - ⚠️ Lista de espera (Miércoles - NO_QUOTA)
   - 🚫 Festivo (Miércoles hijo 2)
   - 🚫 Ausentismo (Viernes hijo 2)

### Escenario 2: Asignar Cupos
1. Marcar checkbox de días disponibles
2. Click "Seleccionar Todos" (opcional)
3. Click "Guardar Asignaciones"
4. Ver confirmación con status (Confirmado/Lista de Espera)

### Escenario 3: Ver Mis Cupos
1. Click botón "Mis Cupos" (icono calendario, arriba derecha)
2. Ver lista de asignaciones existentes
3. Ver estados: Confirmado / Lista de Espera

### Escenario 4: Cancelar Asignaciones
1. En vista "Mis Cupos"
2. Seleccionar asignaciones (checkboxes)
3. Click "Cancelar Seleccionados"
4. Confirmar cancelación
5. Ver que desaparecen de la lista

### Escenario 5: Navegación de Semanas
1. Usar flechas ← → para cambiar semana
2. Ver cómo cambian los datos

---

## 🎯 Usuarios de Prueba

| User ID | Escenario | Resultado |
|---------|-----------|-----------|
| 10000 | Normal | Ver 2 hijos con cupos |
| 99999 | Sin hijos | Ver mensaje "No tiene Hijos Menores a 6 Años" |

Para cambiar usuario, modificar `Component.js` línea 46:
```javascript
oAppModel.setProperty("/userId", "99999"); // Cambiar aquí
```

---

## 📁 Estructura Simplificada

```
fiori-quota-app/
├── webapp/
│   ├── view/              → Vistas XML (UI)
│   ├── controller/        → Lógica de vistas
│   ├── service/           → Llamadas a APIs
│   ├── model/             → Formatters
│   ├── css/               → Estilos
│   └── manifest.json      → Configuración
├── mock-server.js         → API mock local
├── package.json           → Dependencias
└── README.md              → Documentación completa
```

---

## 🔧 Comandos Útiles

```bash
# Instalar dependencias
npm install

# Iniciar mock server
node mock-server.js

# Iniciar app
npm start

# Build para producción
npm run build

# Deploy a BTP (requiere CF CLI)
npm run deploy
```

---

## 🐛 Problemas Comunes

### ❌ "Cannot GET /"
**Solución:** Navegar a `http://localhost:8080/index.html`

### ❌ "CORS Error"
**Solución:** Verificar que mock-server esté corriendo en Terminal 1

### ❌ "Port already in use"
**Solución:**
```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :8080
kill -9 <PID>
```

### ❌ Cambios no se reflejan
**Solución:** Hard refresh → `Ctrl + Shift + R`

---

## 📚 Siguientes Pasos

### Personalizar la App
1. Editar textos → `webapp/i18n/i18n.properties`
2. Cambiar estilos → `webapp/css/style.css`
3. Agregar lógica → `webapp/controller/*.controller.js`

### Conectar a Backend Real
1. Configurar destination en SAP BTP
2. Modificar `ui5.yaml` (ver DEV_GUIDE.md)
3. Reiniciar app

### Desplegar en BTP
1. Seguir DEPLOYMENT.md
2. Opción rápida:
```bash
npm run build
cf login
cf push
```

---

## 📖 Documentación Completa

- **README.md** - Overview del proyecto
- **DEPLOYMENT.md** - Guía de despliegue paso a paso
- **DEV_GUIDE.md** - Desarrollo local avanzado
- **API_GUIDE.md** - Documentación de APIs
- **PROJECT_SUMMARY.md** - Resumen ejecutivo

---

## 💡 Tips

### Desarrollo Rápido
- Usa 2 monitores (Terminal + Browser)
- Habilita Auto-save en VS Code
- Usa Browser DevTools (F12)

### Debugging
- Console.log en controllers
- UI5 Inspector extension
- Network tab para ver llamadas

### Performance
- Minimizar re-renders
- Usar bindings eficientes
- Build antes de medir performance

---

## ✅ Checklist Primera Ejecución

- [ ] Node.js instalado
- [ ] npm instalado
- [ ] Dependencias instaladas (`npm install`)
- [ ] Mock server corriendo (Terminal 1)
- [ ] App corriendo (Terminal 2)
- [ ] Browser abierto en `localhost:8080/index.html`
- [ ] Ver cupos disponibles
- [ ] Probar asignar cupos
- [ ] Probar cancelar cupos

---

## 🆘 Ayuda

### Documentación
- Ver `/docs` en el repositorio
- Leer README.md completo

### Comunidad
- SAP Community
- Stack Overflow (tag: sapui5)

### Soporte
- Contactar equipo de desarrollo
- Abrir issue en repositorio

---

**¿Todo funcionando? ¡Genial! Ahora puedes:**
- Explorar el código en `webapp/`
- Leer la documentación completa
- Modificar y personalizar
- Desplegar en SAP BTP

**Happy coding! 🎉**
