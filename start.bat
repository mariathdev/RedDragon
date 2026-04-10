@echo off
setlocal
cd /d "%~dp0"

echo Starting Red Dragon Bot...

if not exist "%~dp0node_modules\discord.js" (
    echo Installing Node.js dependencies...
    if exist "%~dp0package-lock.json" (
        call npm ci
    ) else (
        call npm install
    )
    if errorlevel 1 (
        echo [ERROR] Failed to install Node.js dependencies.
        pause
        exit /b 1
    )
)

if not exist "C:\Lavalink\Lavalink.jar" (
    echo [ERROR] C:\Lavalink\Lavalink.jar not found.
    echo [ERROR] Place Lavalink.jar in C:\Lavalink and try again.
    pause
    exit /b 1
)

if not exist "C:\Lavalink\plugins\youtube-plugin-1.18.0.jar" (
    echo [WARN] Plugin not found at C:\Lavalink\plugins\youtube-plugin-1.18.0.jar
    echo [WARN] Create C:\Lavalink\plugins\ and place youtube-plugin-1.18.0.jar there.
)

for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":2333" ^| findstr "LISTENING"') do (
    echo Stopping existing process on port 2333 PID %%P...
    taskkill /PID %%P /F > nul 2>&1
)

if not exist "%~dp0lavalink\application.yml" (
    echo [ERROR] %~dp0lavalink\application.yml not found.
    pause
    exit /b 1
)

echo Syncing Lavalink configuration...
copy /Y "%~dp0lavalink\application.yml" "C:\Lavalink\application.yml" > nul
if errorlevel 1 (
    echo [ERROR] Failed to sync Lavalink configuration.
    pause
    exit /b 1
)

echo Starting Lavalink in C:\Lavalink...
start "Lavalink" /D "C:\Lavalink" java -jar Lavalink.jar

echo Waiting for Lavalink to start (15s)...
ping -n 16 127.0.0.1 > nul

echo Registering slash commands...
node scripts/deploy-commands.js
if errorlevel 1 (
    echo [ERROR] Failed to register commands.
    pause
    exit /b 1
)

echo Waiting for stabilization (5s)...
ping -n 6 127.0.0.1 > nul

echo Starting bot...
node src/index.js

pause
