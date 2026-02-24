# Script para subir el proyecto a GitHub
# Uso: .\push-to-github.ps1 -Username "tu-usuario" -RepoName "fiori-quota-app"

param(
    [Parameter(Mandatory=$true)]
    [string]$Username,
    
    [Parameter(Mandatory=$false)]
    [string]$RepoName = "fiori-quota-app",
    
    [Parameter(Mandatory=$false)]
    [string]$Branch = "main",
    
    [Parameter(Mandatory=$false)]
    [switch]$UseSSH = $false
)

Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  GitHub Push Script - Fiori Quota App" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio correcto
$currentDir = Get-Location
if (-not (Test-Path ".\webapp\manifest.json")) {
    Write-Host "❌ Error: No estás en el directorio del proyecto" -ForegroundColor Red
    Write-Host "Por favor ejecuta: cd C:\Users\Public\Documents\fiori-quota-app" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Directorio correcto: $currentDir" -ForegroundColor Green
Write-Host ""

# Verificar que Git está instalado
try {
    $gitVersion = git --version
    Write-Host "✅ Git instalado: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git no está instalado. Por favor instala Git desde: https://git-scm.com/" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Verificar estado del repositorio
Write-Host "📊 Estado del repositorio:" -ForegroundColor Cyan
git status --short
Write-Host ""

# Construir URL del repositorio
if ($UseSSH) {
    $repoUrl = "git@github.com:$Username/$RepoName.git"
    Write-Host "🔐 Usando SSH: $repoUrl" -ForegroundColor Cyan
} else {
    $repoUrl = "https://github.com/$Username/$RepoName.git"
    Write-Host "🔗 Usando HTTPS: $repoUrl" -ForegroundColor Cyan
}
Write-Host ""

# Verificar si el remote ya existe
$existingRemote = git remote get-url origin 2>$null
if ($existingRemote) {
    Write-Host "⚠️  Remote 'origin' ya existe: $existingRemote" -ForegroundColor Yellow
    $response = Read-Host "¿Deseas reemplazarlo? (s/n)"
    if ($response -eq "s" -or $response -eq "S") {
        Write-Host "🔄 Eliminando remote existente..." -ForegroundColor Yellow
        git remote remove origin
        Write-Host "✅ Remote eliminado" -ForegroundColor Green
    } else {
        Write-Host "❌ Operación cancelada" -ForegroundColor Red
        exit 1
    }
}

# Agregar remote
Write-Host "📌 Agregando remote origin..." -ForegroundColor Cyan
try {
    git remote add origin $repoUrl
    Write-Host "✅ Remote agregado exitosamente" -ForegroundColor Green
} catch {
    Write-Host "❌ Error al agregar remote: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Verificar remotes
Write-Host "📡 Remotes configurados:" -ForegroundColor Cyan
git remote -v
Write-Host ""

# Renombrar branch a main si es necesario
$currentBranch = git branch --show-current
if ($currentBranch -ne $Branch) {
    Write-Host "🔄 Renombrando branch de '$currentBranch' a '$Branch'..." -ForegroundColor Cyan
    git branch -M $Branch
    Write-Host "✅ Branch renombrado" -ForegroundColor Green
    Write-Host ""
}

# Confirmar antes de push
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "  IMPORTANTE: Asegúrate de haber creado el repositorio en GitHub" -ForegroundColor Yellow
Write-Host "  URL: https://github.com/new" -ForegroundColor Yellow
Write-Host "  Nombre: $RepoName" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

$confirmPush = Read-Host "¿Has creado el repositorio en GitHub y deseas hacer push? (s/n)"
if ($confirmPush -ne "s" -and $confirmPush -ne "S") {
    Write-Host "❌ Push cancelado" -ForegroundColor Red
    Write-Host "💡 Cuando estés listo, ejecuta: git push -u origin $Branch" -ForegroundColor Cyan
    exit 0
}

# Push
Write-Host ""
Write-Host "🚀 Subiendo código a GitHub..." -ForegroundColor Cyan
Write-Host ""

try {
    git push -u origin $Branch
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "  ✅ ¡ÉXITO! Código subido a GitHub" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Ver repositorio en:" -ForegroundColor Cyan
    Write-Host "   https://github.com/$Username/$RepoName" -ForegroundColor White
    Write-Host ""
    Write-Host "📝 Próximos pasos:" -ForegroundColor Cyan
    Write-Host "   1. Configurar descripción y topics en GitHub" -ForegroundColor White
    Write-Host "   2. Agregar colaboradores (si aplica)" -ForegroundColor White
    Write-Host "   3. Configurar branch protection para 'main'" -ForegroundColor White
    Write-Host "   4. Crear release v1.0.0" -ForegroundColor White
    Write-Host ""
    Write-Host "🎉 ¡Todo listo!" -ForegroundColor Green
    
} catch {
    Write-Host ""
    Write-Host "❌ Error al hacer push: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Posibles soluciones:" -ForegroundColor Yellow
    Write-Host "   - Verifica que el repositorio existe en GitHub" -ForegroundColor White
    Write-Host "   - Verifica tus credenciales de GitHub" -ForegroundColor White
    Write-Host "   - Si usas HTTPS, necesitas un Personal Access Token" -ForegroundColor White
    Write-Host "   - Si usas SSH, verifica tu SSH key" -ForegroundColor White
    Write-Host ""
    Write-Host "📚 Ver guía completa: GITHUB_SETUP.md" -ForegroundColor Cyan
    exit 1
}
