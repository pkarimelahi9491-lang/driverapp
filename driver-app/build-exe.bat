@echo off
chcp 65001 >nul
echo ========================================
echo   ساخت فایل EXE — اپ رانندگان آرمان انتخاب
echo ========================================
echo.

echo [1/3] در حال نصب وابستگی‌ها...
call npm install
if %errorlevel% neq 0 (
    echo خطا در نصب وابستگی‌ها!
    pause
    exit /b 1
)

echo.
echo [2/3] در حال ساخت فایل EXE...
call npm run build-win
if %errorlevel% neq 0 (
    echo خطا در ساخت EXE!
    pause
    exit /b 1
)

echo.
echo [3/3] ساخت با موفقیت انجام شد!
echo.
echo فایل EXE در پوشه release قرار دارد.
echo ========================================
pause
