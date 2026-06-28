@echo off
chcp 65001 >nul
echo ========================================
echo   硬件信息管理工具 - 启动中...
echo ========================================
echo.
cd /d "%~dp0"
npm.cmd run dev
pause
