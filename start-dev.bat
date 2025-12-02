@echo off
REM Next.js geliştirme sunucusunu başlatır ve tarayıcıyı otomatik açar.
set "TARGET_URL=http://127.0.0.1:3000"

cd /d "%~dp0"
call npm install >nul 2>&1

REM Tarayıcıyı sunucuya yönlendirmek için kısa bir gecikme bırakıyoruz.
start "" "%TARGET_URL%"

npm run dev
