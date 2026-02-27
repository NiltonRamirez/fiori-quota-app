# ========================================
# Deployment simplificado para Windows (Sin MTA)
# ========================================

Write-Host "🚀 Iniciando deployment simplificado a BTP..." -ForegroundColor Green

# 1. Verificar conexión CF
Write-Host "📡 Verificando conexión..." -ForegroundColor Cyan
cf target
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ No estás conectado a Cloud Foundry" -ForegroundColor Red
    exit 1
}

# 2. Build UI5
Write-Host "🔨 Construyendo aplicación UI5..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en build" -ForegroundColor Red
    exit 1
}

# 3. Crear servicios necesarios
Write-Host "📦 Creando servicios BTP..." -ForegroundColor Cyan

# XSUAA Service
Write-Host "  - Creando XSUAA service..." -ForegroundColor Gray
cf create-service xsuaa application fiori-quota-app-xsuaa -c xs-security.json

# Destination Service
Write-Host "  - Creando Destination service..." -ForegroundColor Gray
cf create-service destination lite fiori-quota-app-destination

# HTML5 Apps Repo
Write-Host "  - Creando HTML5 Apps Repo..." -ForegroundColor Gray
cf create-service html5-apps-repo app-host fiori-quota-app-html5-repo

Write-Host "⏳ Esperando que los servicios estén listos (60 segundos)..." -ForegroundColor Yellow
Start-Sleep -Seconds 60

# 4. Deploy aplicación
Write-Host "🚀 Desplegando aplicación..." -ForegroundColor Cyan
cf push -f manifest.yml

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deployment exitoso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Próximos pasos:" -ForegroundColor Cyan
    Write-Host "1. Configurar destination dest_int_s en BTP Cockpit"
    Write-Host "2. Asignar role collection a usuarios"
    Write-Host "3. Agregar app al Launchpad"
} else {
    Write-Host "❌ Error en deployment" -ForegroundColor Red
    exit 1
}
