@echo off
title MLAM Studio Pro - Supabase Admin setup
pushd "%~dp0"
echo MLAM STUDIO PRO - ADMINISTRATION
echo Enter the confirmed email address you use with Supabase.
echo This sets the one email allowed to manage the website.
echo You will still sign in with your existing Supabase password.
echo.
set "MLAM_SETUP_NODE=C:\Users\mlamo\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not exist "%MLAM_SETUP_NODE%" set "MLAM_SETUP_NODE=node"
"%MLAM_SETUP_NODE%" scripts\setup-admin.mjs
echo.
if errorlevel 1 (echo Setup did not finish. No administrator access was enabled.) else (echo Restart the website, then open http://127.0.0.1:4180/admin/login)
pause
popd
