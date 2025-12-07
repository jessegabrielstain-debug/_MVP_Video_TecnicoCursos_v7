@echo off
REM ============================================
REM  MVP Video TecnicoCursos v7 - Iniciar App
REM ============================================
REM  Clique duplo neste arquivo para iniciar!
REM ============================================

echo.
echo ========================================
echo   MVP Video TecnicoCursos v7
echo   Iniciando servidor de desenvolvimento...
echo ========================================
echo.

cd /d "%~dp0estudio_ia_videos"

echo [1/2] Verificando dependencias...
call npm install --silent 2>nul

echo [2/2] Iniciando Next.js...
echo.
echo  Acesse: http://localhost:3000
echo  Pressione Ctrl+C para parar
echo.

call npm run dev

pause
