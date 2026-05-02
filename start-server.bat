@echo off
echo ================================
echo 房价走势分析 - 本地服务器启动脚本
echo ================================
echo.

REM 检查Python是否安装
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ 检测到 Python，使用 Python 启动服务器...
    echo 📂 服务目录: %cd%\housing-price-chart
    echo 🌐 访问地址: <ADDRESS_REMOVED>
    echo 🛑 停止服务器: 按 Ctrl+C
    echo.
    cd housing-price-chart
    python -m http.server 8000
    exit /b
)

REM 检查Node.js是否安装
node --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ 检测到 Node.js，使用 npx 启动服务器...
    echo 📂 服务目录: %cd%\housing-price-chart
    echo 🌐 访问地址: <ADDRESS_REMOVED>
    echo 🛑 停止服务器: 按 Ctrl+C
    echo.
    cd housing-price-chart
    npx http-server -p 8000
    exit /b
)

echo ❌ 未检测到 Python 或 Node.js
echo 请安装 Python 或 Node.js，或使用其他HTTP服务器
pause
