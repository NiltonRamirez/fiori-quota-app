#!/bin/bash

# ========================================
# Script de Deployment a BTP (Test/Prod)
# ========================================

echo "🚀 Iniciando deployment de Fiori Quota App a BTP..."

# 1. Verificar que estás logueado en CF
echo "📡 Verificando conexión a Cloud Foundry..."
cf target

if [ $? -ne 0 ]; then
    echo "❌ No estás conectado a Cloud Foundry"
    echo "Ejecuta: cf login -a https://api.cf.us10-001.hana.ondemand.com"
    exit 1
fi

# 2. Instalar dependencias
echo "📦 Instalando dependencias..."
npm ci

# 3. Build de la aplicación UI5
echo "🔨 Construyendo aplicación UI5..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Error en el build de UI5"
    exit 1
fi

# 4. Build del MTA
echo "📦 Construyendo MTA Archive..."
mbt build -t ./mta_archives

if [ $? -ne 0 ]; then
    echo "❌ Error en el build de MTA"
    exit 1
fi

# 5. Deploy del MTA
echo "🚀 Desplegando a Cloud Foundry..."

# Si existe deployment-config.mtaext, úsalo
if [ -f "deployment-config.mtaext" ]; then
    echo "✅ Usando configuración con secretos desde deployment-config.mtaext"
    cf deploy mta_archives/fiori-quota-app_1.0.0.mtar -e deployment-config.mtaext
else
    echo "⚠️  No se encontró deployment-config.mtaext"
    echo "Desplegando sin configuración de secretos..."
    cf deploy mta_archives/fiori-quota-app_1.0.0.mtar
fi

if [ $? -eq 0 ]; then
    echo "✅ Deployment exitoso!"
    echo ""
    echo "📋 Próximos pasos:"
    echo "1. Configurar el destination dest_int_s en BTP Cockpit si no usaste .mtaext"
    echo "2. Asignar role collection 'QuotaManagementUser' a los usuarios"
    echo "3. Agregar la app al Launchpad"
    echo ""
    echo "🔗 URL de la aplicación:"
    cf app fiori-quota-app
else
    echo "❌ Error en el deployment"
    exit 1
fi
