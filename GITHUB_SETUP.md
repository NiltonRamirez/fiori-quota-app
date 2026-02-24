# 📤 Guía para Subir a GitHub

## ✅ Estado Actual

El repositorio Git local está inicializado y listo:
- ✅ Git inicializado
- ✅ 30 archivos agregados
- ✅ Commit inicial creado
- ✅ Branch: `master`
- ✅ Commit: `a290e63 - Initial commit - SAP Fiori Quota Management Application v1.0.0`

## 🚀 Paso 1: Crear Repositorio en GitHub

### Opción A: Desde GitHub Web (Recomendado)

1. **Ir a GitHub:**
   - Navegar a: https://github.com/new
   - O click en "+" → "New repository"

2. **Configurar el Repositorio:**
   ```
   Repository name: fiori-quota-app
   Description: SAP Fiori application for childcare quota management
   Visibility: [Private o Public]
   
   ⚠️ NO marcar:
   - Add a README file
   - Add .gitignore
   - Choose a license
   ```

3. **Click "Create repository"**

4. **Copiar la URL del repositorio:**
   ```
   https://github.com/TU-USUARIO/fiori-quota-app.git
   ```

### Opción B: Con GitHub CLI (Si lo tienes instalado)

```powershell
# Instalar GitHub CLI primero
winget install --id GitHub.cli

# Login
gh auth login

# Crear repositorio
gh repo create fiori-quota-app --private --source=. --remote=origin --push
```

## 🔗 Paso 2: Conectar Repositorio Local con GitHub

Una vez creado el repositorio en GitHub, ejecutar estos comandos en PowerShell:

```powershell
# Asegurarse de estar en el directorio correcto
cd C:\Users\Public\Documents\fiori-quota-app

# Agregar el remote (reemplazar TU-USUARIO con tu usuario de GitHub)
git remote add origin https://github.com/TU-USUARIO/fiori-quota-app.git

# Verificar el remote
git remote -v

# Renombrar branch a main (opcional, siguiendo estándar actual)
git branch -M main

# Subir el código
git push -u origin main
```

### Si prefieres usar SSH en lugar de HTTPS:

```powershell
# Agregar remote con SSH
git remote add origin git@github.com:TU-USUARIO/fiori-quota-app.git

# Push
git push -u origin main
```

## 📋 Comandos Completos (Copy-Paste)

Reemplaza `TU-USUARIO` con tu usuario de GitHub:

```powershell
# Navegar al proyecto
cd C:\Users\Public\Documents\fiori-quota-app

# Configurar usuario Git (si no lo has hecho)
git config user.name "Tu Nombre"
git config user.email "tu.email@example.com"

# Agregar remote
git remote add origin https://github.com/TU-USUARIO/fiori-quota-app.git

# Renombrar branch a main
git branch -M main

# Push
git push -u origin main
```

## 🔐 Autenticación

### Primera vez subiendo a GitHub

GitHub pedirá autenticación. Opciones:

1. **Personal Access Token (Recomendado):**
   - Ir a: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Seleccionar scopes: `repo`, `workflow`
   - Copiar el token
   - Usarlo como contraseña cuando Git lo pida

2. **GitHub Desktop:**
   - Descargar: https://desktop.github.com/
   - Login y agregar repositorio existente
   - Push desde la interfaz

3. **SSH Key:**
   ```powershell
   # Generar SSH key
   ssh-keygen -t ed25519 -C "tu.email@example.com"
   
   # Agregar a GitHub
   # https://github.com/settings/keys
   ```

## ✅ Verificación

Después del push exitoso, verifica:

1. **En la terminal:**
   ```powershell
   git remote -v
   git branch -a
   git log --oneline
   ```

2. **En GitHub:**
   - Ir a: https://github.com/TU-USUARIO/fiori-quota-app
   - Verificar que aparezcan los 30 archivos
   - Ver el README.md renderizado

## 📝 Comandos Git Útiles

### Verificar estado
```powershell
git status
git log --oneline --graph
git remote -v
```

### Hacer cambios futuros
```powershell
# Agregar cambios
git add .

# Commit
git commit -m "Descripción del cambio"

# Push
git push
```

### Ver diferencias
```powershell
git diff
git diff --staged
```

### Crear branches
```powershell
# Crear y cambiar a nuevo branch
git checkout -b feature/nueva-funcionalidad

# Push del nuevo branch
git push -u origin feature/nueva-funcionalidad
```

## 🏷️ Tags y Releases

### Crear tag para la versión 1.0.0
```powershell
git tag -a v1.0.0 -m "Release v1.0.0 - Initial release"
git push origin v1.0.0
```

### Crear release en GitHub
1. Ir a: https://github.com/TU-USUARIO/fiori-quota-app/releases
2. Click "Create a new release"
3. Tag: `v1.0.0`
4. Title: `v1.0.0 - Initial Release`
5. Description: Copiar contenido de CHANGELOG.md
6. Click "Publish release"

## 🔄 Workflow Recomendado

### Para desarrollo individual:
```
main branch → desarrollo directo → commits → push
```

### Para equipo:
```
main (protegido)
  ↓
develop
  ↓
feature/nombre-feature → PR → merge a develop → PR → merge a main
```

## 📊 GitHub Settings Recomendados

Una vez creado el repositorio:

1. **Settings → General:**
   - ✅ Issues
   - ✅ Projects
   - ✅ Wiki (opcional)

2. **Settings → Branches:**
   - Agregar regla para `main`:
     - ✅ Require pull request before merging
     - ✅ Require status checks to pass

3. **Settings → Secrets:**
   - Agregar secrets para CI/CD:
     - `BTP_USERNAME`
     - `BTP_PASSWORD`
     - `CF_API_ENDPOINT`

4. **About Section:**
   - Description: "SAP Fiori application for childcare quota management"
   - Website: (URL de la app en BTP)
   - Topics: `sapui5`, `fiori`, `sap-btp`, `nodejs`, `cloudFoundry`

## 🎨 Personalizar el Repositorio

### Agregar badges al README
```markdown
![SAP](https://img.shields.io/badge/SAP-Fiori-0FAAFF?logo=sap)
![SAPUI5](https://img.shields.io/badge/SAPUI5-1.120-0FAAFF)
![Node](https://img.shields.io/badge/Node-18+-339933?logo=node.js)
![License](https://img.shields.io/badge/License-Proprietary-red)
```

### Agregar GitHub Actions (CI/CD)
Crear `.github/workflows/deploy.yml` para deployment automático

## 🐛 Troubleshooting

### Error: "remote origin already exists"
```powershell
git remote remove origin
git remote add origin https://github.com/TU-USUARIO/fiori-quota-app.git
```

### Error: "failed to push some refs"
```powershell
# Pull primero
git pull origin main --allow-unrelated-histories

# Luego push
git push -u origin main
```

### Error: Authentication failed
- Verificar Personal Access Token
- O usar GitHub Desktop
- O configurar SSH key

### Archivos grandes
Si tienes archivos > 100MB, usar Git LFS:
```powershell
git lfs install
git lfs track "*.mtar"
```

## 📚 Recursos

- [GitHub Docs](https://docs.github.com/)
- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)
- [GitHub CLI](https://cli.github.com/)
- [GitHub Desktop](https://desktop.github.com/)

## ✅ Checklist Final

- [ ] Repositorio creado en GitHub
- [ ] Remote agregado localmente
- [ ] Push exitoso
- [ ] Archivos visibles en GitHub
- [ ] README.md se ve correctamente
- [ ] Repositorio configurado (descripción, topics)
- [ ] Colaboradores agregados (si aplica)
- [ ] Branch protection configurado (para producción)

---

**¡Listo para colaborar! 🎉**
