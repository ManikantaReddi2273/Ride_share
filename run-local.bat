@echo off
title Ride Sharing System Launcher
echo =======================================================================
echo          Smart Ride Sharing System - Local Environment Starter
echo =======================================================================
echo.
echo Checking prerequisite services...
echo Local PostgreSQL is running with databases: user_db, ride_db, payment_db
echo.

echo [1/6] Starting Eureka Server (Service Discovery) on port 8761...
start "Eureka Server [Port 8761]" cmd /k "cd /d %~dp0eureka-server && mvn spring-boot:run"

echo Waiting 15 seconds for Eureka Server to register itself...
timeout /t 15 /nobreak >nul

echo [2/6] Starting User Service on port 8081...
start "User Service [Port 8081]" cmd /k "cd /d %~dp0user-service && mvn spring-boot:run"

echo [3/6] Starting Ride Service on port 8082...
start "Ride Service [Port 8082]" cmd /k "cd /d %~dp0ride-service && mvn spring-boot:run"

echo [4/6] Starting Payment Service on port 8084...
start "Payment Service [Port 8084]" cmd /k "cd /d %~dp0payment-service && mvn spring-boot:run"

echo Waiting 15 seconds for microservices to register with Eureka...
timeout /t 15 /nobreak >nul

echo [5/6] Starting API Gateway on port 8080...
start "API Gateway [Port 8080]" cmd /k "cd /d %~dp0api-gateway-service && mvn spring-boot:run"

echo [6/6] Starting Frontend (React + Vite) on port 5173...
start "Frontend UI [Port 5173]" cmd /k "cd /d %~dp0fronted_ride_share && npm run dev"

echo.
echo =======================================================================
echo All services launched in separate terminal windows!
echo.
echo   * Frontend UI:       http://localhost:5173
echo   * API Gateway:      http://localhost:8080
echo   * Eureka Dashboard: http://localhost:8761
echo   * Default Admin:    admin2273@gmail.com / admin2273
echo =======================================================================
echo.
echo To stop services, run 'stop-local.bat' or close the opened terminal windows.
pause

