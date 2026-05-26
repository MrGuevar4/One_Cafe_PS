@echo off
rem ------------------------------------------------------------------------------
rem ONE Cafe & Restaurant POS - Windows Dependency Fixer
rem Run this script if you see "ERR_DLOPEN_FAILED" or "is not a valid Win32 application"
rem ------------------------------------------------------------------------------

echo ==========================================================
echo   Fixing Windows Native Dependencies (better-sqlite3)
echo ==========================================================

echo.
echo This script will rebuild or reinstall dependencies to fix compatibility issues.
echo It is highly recommended if you copied the project from a Mac or Linux system.
echo.

where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] NPM is not installed or not in PATH. Please install Node.js.
  pause
  exit /b 1
)

echo [1] Rebuilding better-sqlite3 native binaries...
call npm rebuild better-sqlite3

if %ERRORLEVEL% EQU 0 (
  echo.
  echo [SUCCESS] Rebuild complete! Try running start.bat again.
) else (
  echo.
  echo [WARNING] Rebuild failed. Attempting a clean installation instead...
  echo Removing node_modules...
  rd /s /q node_modules
  rd /s /q print-server\node_modules
  
  echo Installing fresh dependencies for Windows...
  call npm install
  
  cd print-server
  call npm install
  cd ..
  
  echo.
  echo [SUCCESS] Clean installation complete! Try running start.bat again.
)

pause
