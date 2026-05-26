@echo off
rem ------------------------------------------------------------------------------
rem ONE Cafe ^& Restaurant POS startup script for Windows
rem ------------------------------------------------------------------------------

echo ==========================================================
echo       ONE Cafe ^& Restaurant - Starting POS Suite
echo ==========================================================

rem Detect package manager
where bun >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  set PKG_MANAGER=bun
  set INSTALL_CMD=call bun install
  set BUILD_CMD=call bun run build
  set START_CMD=call bunx concurrently -k -n "WEB,PRINT" -c "cyan,magenta" "bun run preview" "bun print-server/src/index.ts"
  echo [OK] Bun detected as the package manager.
  goto :install
)

where npm >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  set PKG_MANAGER=npm
  set INSTALL_CMD=call npm install
  set BUILD_CMD=call npm run build
  set START_CMD=call npx concurrently -k -n "WEB,PRINT" -c "cyan,magenta" "npm run preview" "npm run start --prefix print-server"
  echo [OK] Node.js/NPM detected as the package manager.
  goto :install
)

echo [ERROR] Neither Bun nor Node.js/NPM was found on this system.
echo Please install Bun (https://bun.sh) or Node.js (https://nodejs.org) to run this application.
pause
exit /b 1

:install
rem Check and install root dependencies if missing
if not exist node_modules (
  echo Root node_modules not found. Installing dependencies...
  %INSTALL_CMD%
) else if not exist node_modules\concurrently (
  echo Required package 'concurrently' missing. Installing dependencies...
  %INSTALL_CMD%
) else if not exist node_modules\vinxi (
  echo Required package 'vinxi' missing. Installing dependencies...
  %INSTALL_CMD%
)

rem Check and install print-server dependencies if missing
if not exist print-server\node_modules (
  echo Print server node_modules not found. Installing dependencies...
  cd print-server
  if "%PKG_MANAGER%"=="bun" (
    call bun install
  ) else (
    call npm install
  )
  cd ..
)

rem Build production bundle
echo Building production frontend and server bundles...
%BUILD_CMD%

rem Start concurrent servers
echo Launching main POS Web app and Print Server...
echo ==========================================================
echo [NOTE] If you see a "not a valid Win32 application" error,
echo please close this and run "fix-windows.bat" to fix it.
echo ==========================================================
%START_CMD%
