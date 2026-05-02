@echo off
chcp 65001 > nul
echo ===============================
echo    房价数据更新工具
echo ===============================
echo.

:: 检查 Python 是否安装
python --version > nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Python！
    echo.
    echo 请先安装 Python：
    echo 1. 访问 https://www.python.org/downloads/
    echo 2. 下载并安装 Python（勾选"Add Python to PATH"）
    echo 3. 重新运行此脚本
    echo.
    pause
    exit /b 1
)

echo [1/3] 正在更新房价数据...
python update_data.py

if %errorlevel% neq 0 (
    echo [错误] 数据更新失败！
    pause
    exit /b 1
)

echo.
echo [2/3] 数据更新完成！
echo.
echo [3/3] 正在打开使用说明...
timeout /t 2 > nul

:: 打开 README.md（使用默认编辑器）
if exist README.md (
    start notepad README.md
) else (
    echo 使用说明文件不存在
)

echo.
echo ===============================
echo  完成！现在可以打开 index.html 查看最新数据
echo ===============================
echo.
pause
