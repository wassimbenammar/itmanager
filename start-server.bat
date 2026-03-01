@echo off
cd /d C:\Users\bawas\.local\bin\itmanager
set NODE_ENV=production
node server\index.js >> server.log 2>&1
