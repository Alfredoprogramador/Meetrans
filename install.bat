@echo off
echo ============================================
echo   Meetrans - Inicializacao Completa
echo ============================================
echo.

echo [1/4] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
	echo ERRO: Node.js nao encontrado!
	echo Por favor, instale Node.js em: https://nodejs.org/
	pause
	exit /b 1
)
node --version
npm --version
echo.

echo [2/4] Instalando dependencias do backend...
call npm install
if errorlevel 1 (
	echo ERRO: Falha ao instalar dependencias do backend
	pause
	exit /b 1
)
echo.

echo [3/4] Instalando dependencias do frontend...
cd client
call npm install
if errorlevel 1 (
	echo ERRO: Falha ao instalar dependencias do frontend
	pause
	exit /b 1
)
cd ..
echo.

echo [4/4] Tudo pronto!
echo.
echo ============================================
echo   Instalacao Concluida com Sucesso!
echo ============================================
echo.
echo Para iniciar a aplicacao, execute:
echo   - Backend:  npm start
echo   - Frontend: cd client ^&^& npm start
echo.
echo Ou execute start.bat para iniciar ambos automaticamente
echo.
pause
