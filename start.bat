@echo off
echo ============================================
echo   Meetrans - Iniciando Aplicacao
echo ============================================
echo.

echo Iniciando Backend (porta 5000)...
start "Meetrans Backend" cmd /k "npm start"
timeout /t 3 /nobreak >nul

echo Iniciando Frontend (porta 3000)...
cd client
start "Meetrans Frontend" cmd /k "npm start"
cd ..

echo.
echo ============================================
echo   Meetrans Iniciado!
echo ============================================
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Dois terminais foram abertos.
echo Aguarde o navegador abrir automaticamente...
echo.
echo Para parar a aplicacao, feche ambos os terminais.
echo.
