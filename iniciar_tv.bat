@echo off
chcp 65001 >nul
title Blender Web Preview - Servidor TV
color 0A

echo.
echo ========================================================
echo    BLENDER WEB PREVIEW - Servidor para Smart TV
echo ========================================================
echo.

:: Obtener la IP local
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4"') do (
    set IP=%%a
)
set IP=%IP: =%

echo    Tu pagina esta activa en:
echo.
echo    Desde tu PC:
echo      http://localhost:8000
echo.
echo    Desde tu Smart TV (misma WiFi):
echo      http://%IP%:8000
echo.
echo    Pagina directa para TV:
echo      http://%IP%:8000/tv.html
echo.
echo --------------------------------------------------------
echo    Abre esa direccion en el navegador de tu Smart TV
echo    Presiona Ctrl+C para detener el servidor
echo --------------------------------------------------------
echo.

cd /d "%~dp0"
python start_server.py

pause
