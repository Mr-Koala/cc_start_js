@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
set "NODE_ENTRY=%SCRIPT_DIR%bin\cc-start.js"

where node >nul 2>&1
if errorlevel 1 (
    echo Error: node is required but not found in PATH.
    exit /b 1
)

if not exist "%NODE_ENTRY%" (
    echo Error: Node entry not found: %NODE_ENTRY%
    exit /b 1
)

node "%NODE_ENTRY%" %*
