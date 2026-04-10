@echo off
setlocal
cd /d "%~dp0"

echo Starting Red Dragon Bot...

REM Check whether Lavalink.jar exists
if not exist "C:\Lavalink\Lavalink.jar" (
    echo [ERROR] C:\Lavalink\Lavalink.jar not found.
    echo [ERROR] Place Lavalink.jar in C:\Lavalink and try again.
    pause
    exit /b 1
)

REM Check whether the youtube plugin exists in the plugins folder
if not exist "C:\Lavalink\plugins\youtube-plugin-1.18.0.jar" (
    echo [WARN] Plugin not found at C:\Lavalink\plugins\youtube-plugin-1.18.0.jar
    echo [WARN] Create C:\Lavalink\plugins\ and place youtube-plugin-1.18.0.jar there.
)

REM Start Lavalink in the background from C:\Lavalink
echo Starting Lavalink in C:\Lavalink...
start "Lavalink" /D "C:\Lavalink" java -Dconfig.location="%~dp0lavalink\application.yml" -jar Lavalink.jar

REM Wait for Lavalink to start
echo Waiting for Lavalink to start (15s)...
ping -n 16 127.0.0.1 > nul

REM Register Discord slash commands
echo Registering slash commands...
node scripts/deploy-commands.js
if errorlevel 1 (
    echo [ERROR] Failed to register commands.
    pause
    exit /b 1
)

REM Wait for services to stabilize before starting the bot
echo Waiting for stabilization (5s)...
ping -n 6 127.0.0.1 > nul

REM Start the bot
echo Starting bot...
node src/index.js

pause
