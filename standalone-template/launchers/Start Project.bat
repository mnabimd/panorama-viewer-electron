@echo off
title Panorama Viewer - Server Running
color 0A
echo.
echo ========================================
echo    Panorama Viewer is Starting...
echo ========================================
echo.
echo The panorama will open in your browser.
echo.
echo To STOP the server:
echo   - Close this window, or
echo   - Press Ctrl+C
echo.
echo ========================================
echo.

REM Try Python 3 first
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Starting server with Python...
    timeout /t 2 /nobreak >nul
    start http://127.0.0.1:8000
    python -m http.server 8000
    goto :end
)

REM Try Python3 command
where python3 >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Starting server with Python3...
    timeout /t 2 /nobreak >nul
    start http://127.0.0.1:8000
    python3 -m http.server 8000
    goto :end
)

REM Try Node.js
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Starting server with Node.js...
    timeout /t 2 /nobreak >nul
    start http://127.0.0.1:8000
    npx -y http-server -p 8000 -o
    goto :end
)

REM No server found
color 0C
echo.
echo ========================================
echo ERROR: No server software found!
echo ========================================
echo.
echo Please install Python from:
echo https://www.python.org/downloads/
echo.
echo Or install Node.js from:
echo https://nodejs.org/
echo.
pause
goto :end

:end
