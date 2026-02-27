# ========================================
# Script de Deployment a BTP (Test/Prod)
# ========================================

Write-Host "🚀 Iniciando deployment de Fiori Quota App a BTP..." -ForegroundColor Green

# 1. Verificar que estás logueado en CF
Write-Host "📡 Verificando conexión a Cloud Foundry..." -ForegroundColor Cyan
cf target

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ No estás conectado a Cloud Foundry" -ForegroundColor Red
    Write-Host "Ejecuta: cf login -a https://api.cf.us10-002.hana.ondemand.com" -ForegroundColor Yellow
    exit 1
}

# 2. Instalar dependencias
Write-Host "📦 Instalando dependencias..." -ForegroundColor Cyan
npm ci

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error instalando dependencias" -ForegroundColor Red
    exit 1
}

# 3. Build de la aplicación UI5
Write-Host "🔨 Construyendo aplicación UI5..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en el build de UI5" -ForegroundColor Red
    exit 1
}

# 4. Build del MTA
Write-Host "📦 Construyendo MTA Archive..." -ForegroundColor Cyan
mbt build -t ./mta_archives

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en el build de MTA" -ForegroundColor Red
    exit 1
}

# 5. Deploy del MTA
Write-Host "🚀 Desplegando a Cloud Foundry..." -ForegroundColor Cyan

# Si existe deployment-config.mtaext, úsalo
if (Test-Path "deployment-config.mtaext") {
    Write-Host "✅ Usando configuración con secretos desde deployment-config.mtaext" -ForegroundColor Green
    cf deploy mta_archives/fiori-quota-app_1.0.0.mtar -e deployment-config.mtaext
} else {
    Write-Host "⚠️  No se encontró deployment-config.mtaext" -ForegroundColor Yellow
    Write-Host "Desplegando sin configuración de secretos..." -ForegroundColor Yellow
    cf deploy mta_archives/fiori-quota-app_1.0.0.mtar
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deployment exitoso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Próximos pasos:" -ForegroundColor Cyan
    Write-Host "1. Configurar el destination dest_int_s en BTP Cockpit si no usaste .mtaext"
    Write-Host "2. Asignar role collection 'QuotaManagementUser' a los usuarios"
    Write-Host "3. Agregar la app al Launchpad"
    Write-Host ""
    Write-Host "🔗 URL de la aplicación:" -ForegroundColor Cyan
    cf app fiori-quota-app
} else {
    Write-Host "❌ Error en el deployment" -ForegroundColor Red
    exit 1
}
