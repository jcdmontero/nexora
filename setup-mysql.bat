@echo off
echo ========================================
echo NEXORA - Setup MySQL Database
echo ========================================
echo.

echo [1/4] Creando base de datos 'nexora' en MySQL...
C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe -u root -e "DROP DATABASE IF EXISTS nexora; CREATE DATABASE nexora CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

echo.
echo [2/4] Limpiando cache de Laravel...
php artisan config:clear

echo.
echo [3/4] Ejecutando migraciones...
php artisan migrate:fresh --seed

echo.
echo [4/4] Verificando conexión...
php artisan db:show

echo.
echo ========================================
echo Setup completado!
echo Credenciales: admin@nexora.com / admin123
echo ========================================
pause
