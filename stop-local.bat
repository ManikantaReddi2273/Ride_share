@echo off
title Stop Ride Sharing Services
echo =======================================================================
echo          Stopping Smart Ride Sharing Services
echo =======================================================================
echo.

echo Terminating running services...
taskkill /F /FI "WINDOWTITLE eq Eureka Server*" /T 2>nul
taskkill /F /FI "WINDOWTITLE eq User Service*" /T 2>nul
taskkill /F /FI "WINDOWTITLE eq Ride Service*" /T 2>nul
taskkill /F /FI "WINDOWTITLE eq Payment Service*" /T 2>nul
taskkill /F /FI "WINDOWTITLE eq API Gateway*" /T 2>nul
taskkill /F /FI "WINDOWTITLE eq Frontend UI*" /T 2>nul

echo.
echo All services have been stopped.
echo =======================================================================
pause

