# Script para crear MTAR manualmente (alternativa a mbt build)
Write-Host "📦 Creando MTAR manualmente..." -ForegroundColor Cyan

# Crear directorios temporales
$buildDir = ".\.build"
$mtarDir = ".\mta_archives"

if (Test-Path $buildDir) { Remove-Item $buildDir -Recurse -Force }
if (!(Test-Path $mtarDir)) { New-Item -ItemType Directory -Path $mtarDir | Out-Null }

New-Item -ItemType Directory -Path $buildDir -Force | Out-Null
New-Item -ItemType Directory -Path "$buildDir\META-INF" -Force | Out-Null

# Copiar archivos necesarios
Copy-Item ".\mta.yaml" "$buildDir\META-INF\mta.yaml"
Copy -Item ".\dist\comccbquota.zip" "$buildDir\comccbquota.zip"

# Crear archivo MTAR (es un ZIP)
$mtarPath = "$mtarDir\fiori-quota-app_1.0.0.mtar"
if (Test-Path $mtarPath) { Remove-Item $mtarPath -Force }

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($buildDir, $mtarPath)

Write-Host "✅ MTAR creado: $mtarPath" -ForegroundColor Green
Write-Host "📊 Tamaño: $((Get-Item $mtarPath).Length) bytes" -ForegroundColor Gray

# Limpiar
Remove-Item $buildDir -Recurse -Force
