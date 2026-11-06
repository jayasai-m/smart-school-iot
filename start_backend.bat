@echo off
cd /d "%~dp0smart-school-iot\backend"
echo ========================================================
echo   Starting SmartSchoolIoT FastAPI Backend (MySQL)
echo ========================================================
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
pause
