@echo off
echo Cleaning up heavy directories...

echo Removing frontend/.next directory...
if exist "frontend\.next" (
    rmdir /s /q "frontend\.next"
    echo ✓ Removed .next directory
) else (
    echo ℹ .next directory doesn't exist
)

echo Removing frontend/node_modules directory...
if exist "frontend\node_modules" (
    rmdir /s /q "frontend\node_modules"
    echo ✓ Removed node_modules directory
) else (
    echo ℹ node_modules directory doesn't exist
)

echo Removing backend __pycache__ directories...
for /d /r backend %%d in (__pycache__) do (
    if exist "%%d" (
        rmdir /s /q "%%d"
        echo ✓ Removed %%d
    )
)

echo Removing backend *.pyc files...
del /s /q "backend\*.pyc" 2>nul

echo.
echo ✓ Cleanup complete! Your project should now be much smaller.
echo.
echo To restore dependencies, run:
echo   cd frontend && npm install
echo.
pause