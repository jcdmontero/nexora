@echo off
echo ========================================
echo NEXORA - Setup Database PostgreSQL
echo ========================================
echo.

echo [1/5] Limpiando cache de Laravel...
php artisan config:clear
php artisan route:clear
php artisan view:clear

echo.
echo [2/5] Verificando PostgreSQL...
psql --version

echo.
echo [3/5] Creando base de datos 'nexora'...
psql -U postgres -c "DROP DATABASE IF EXISTS nexora;"
psql -U postgres -c "CREATE DATABASE nexora;"

echo.
echo [4/5] Ejecutando migraciones...
php artisan migrate:fresh --seed

echo.
echo [5/5] Verificando conexión...
php artisan db:show

echo.
echo ========================================
echo Setup completado!
echo ========================================
pause
