@echo off
REM ---------------------------------------------------------------------------
REM Claude Code essential skills installer - double-click entry point.
REM ASCII ONLY on purpose. Korean text in a .bat breaks it: cmd.exe shifts byte
REM alignment around chcp and turns comment lines into commands.
REM Verified 2026-07-26 - four scheduled runners died silently from exactly that.
REM ---------------------------------------------------------------------------
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js is required. Get the LTS build at https://nodejs.org
  echo   Install it, close this window, and double-click again.
  echo.
  pause
  exit /b 1
)
node install.mjs %*
echo.
pause
