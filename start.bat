@echo off
setlocal
cd /d "%~dp0"

echo Iniciando Red Dragon Bot...

REM Verificar se o Lavalink.jar existe
if not exist "C:\Lavalink\Lavalink.jar" (
    echo [ERRO] C:\Lavalink\Lavalink.jar nao encontrado.
    echo [ERRO] Coloque o Lavalink.jar em C:\Lavalink e tente novamente.
    pause
    exit /b 1
)

REM Verificar se o youtube-plugin existe na pasta plugins
if not exist "C:\Lavalink\plugins\youtube-plugin-1.18.0.jar" (
    echo [AVISO] Plugin nao encontrado em C:\Lavalink\plugins\youtube-plugin-1.18.0.jar
    echo [AVISO] Crie a pasta C:\Lavalink\plugins\ e coloque o youtube-plugin-1.18.0.jar la.
)

REM Iniciar Lavalink em background a partir de C:\Lavalink
echo Iniciando Lavalink em C:\Lavalink...
start "Lavalink" /D "C:\Lavalink" java -Dconfig.location="%~dp0lavalink\application.yml" -jar Lavalink.jar

REM Aguardar Lavalink iniciar
echo Aguardando Lavalink iniciar (15s)...
timeout /t 15 /nobreak > nul

REM Registrar comandos no Discord
echo Registrando comandos slash...
node scripts/deploy-commands.js
if errorlevel 1 (
    echo [ERRO] Falha ao registrar comandos.
    pause
    exit /b 1
)

REM Iniciar o bot
echo Iniciando bot...
node src/index.js

pause
