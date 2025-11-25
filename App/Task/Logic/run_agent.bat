@echo off
cd /d "%~dp0"

:: Set your API Keys here or ensure they are set in the system environment
:: set API_OPENROUTER=YOUR_OPENROUTER_KEY_HERE
:: set LOGIC_API_KEY=HLasrn5gAagnjbNxVvfrljLeayQQdjWL
:: set API_LOGIC_URL=http://glorybuilder.local/

:: Check if API_OPENROUTER is set
if "%API_OPENROUTER%"=="" (
    echo Error: API_OPENROUTER is not set. Please edit this batch file or set the environment variable.
    exit /b 1
)

echo Running Logic Agent...
node run_agent.js
pause
