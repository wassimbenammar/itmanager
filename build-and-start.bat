@echo off
cd /d "%~dp0"
echo Build du client React...
npm run build
if errorlevel 1 (
  echo Echec du build.
  pause
  exit /b 1
)
echo Démarrage du serveur en production...
set NODE_ENV=production
node server/index.js
