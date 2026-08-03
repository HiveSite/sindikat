@echo off
cd /d %~dp0
if not exist .env copy .env.example .env >nul
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22 nije instaliran. Instalirajte Node.js 22 LTS i pokrenite ponovo.
  pause
  exit /b 1
)
start "MTH Browser" http://localhost:3000
node server.mjs
pause
