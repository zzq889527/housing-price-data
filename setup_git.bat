@echo off
echo ================================================
echo   Housing Price Data - Git 初始化脚本
echo ================================================
echo.

REM 检查是否在正确的目录
if not exist "data\cities.json" (
    echo [错误] 未找到 data\cities.json 文件！
    echo 请确保在 housing-price-data 目录中运行此脚本。
    pause
    exit /b 1
)

echo [1/5] 初始化 Git 仓库...
git init
if errorlevel 1 (
    echo [错误] Git 初始化失败！请确保已安装 Git。
    pause
    exit /b 1
)

echo.
echo [2/5] 添加文件到 Git...
git add .
git commit -m "Initial commit: 房价数据仓库（含示例数据）"
if errorlevel 1 (
    echo [错误] Git 提交失败！
    pause
    exit /b 1
)

echo.
echo [3/5] 创建 main 分支...
git branch -M main

echo.
echo [4/5] 添加远程仓库...
echo 请输入你的 GitHub 用户名 (zzq889527):
set /p username=
git remote add origin https://github.com/%username%/housing-price-data.git
if errorlevel 1 (
    echo [警告] 添加远程仓库失败，可能已存在。
)

echo.
echo [5/5] 推送到 GitHub...
echo.
echo ⚠️  注意：如果这是第一次推送，需要：
echo    1. 在 GitHub 上创建名为 housing-price-data 的仓库
echo    2. 不要初始化 README/LICENSE/.gitignore
echo.
echo 是否现在打开 GitHub 创建仓库？[Y/N]
set /p open_github=
if /i "%open_github%"=="Y" start https://github.com/new

echo.
echo 按任意键继续推送（请先创建 GitHub 仓库）...
pause > nul

git push -u origin main
if errorlevel 1 (
    echo.
    echo [错误] 推送失败！请检查：
    echo    1. 是否已创建 GitHub 仓库？
    echo    2. 是否已配置 GitHub 认证（用户名/密码 或 SSH密钥）？
    echo.
    echo 💡 提示：推荐使用 SSH 方式，避免每次输入密码
    echo    参见：https://docs.github.com/en/authentication/connecting-to-github-with-ssh
) else (
    echo.
    echo ✅ 成功推送到 GitHub！
    echo.
    echo 🌐 下一步：启用 GitHub Pages
    echo    1. 打开 https://github.com/%username%/housing-price-data/settings/pages
    echo    2. Source 选择 "GitHub Actions"
    echo    3. 保存后等待 1-2 分钟
    echo    4. 数据将通过以下 URL 访问：
    echo       https://%username%.github.io/housing-price-data/data/cities.json
    echo.
    echo 是否现在打开 GitHub Pages 设置页面？[Y/N]
    set /p open_pages=
    if /i "%open_pages%"=="Y" start https://github.com/%username%/housing-price-data/settings/pages
)

echo.
pause
