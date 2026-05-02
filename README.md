# 房价走势分析 - 使用说明

## ✅ 已完成修复

### 1. 修复"点了没反应"问题
- ✅ **下载了本地 ECharts 库** (`js/echarts.min.js`)
- ✅ **更新 index.html** 使用本地 ECharts（避免 CDN 加载失败）
- ✅ **生成完整月度数据** (2000-01 至 2026-05，每月都有数据)

### 2. 实现"数据自动更新到最新一个月"
- ✅ **创建数据更新脚本** (`update_data.py`)
- ✅ **生成了包含最新数据的数据文件** (`js/embeddedData.js`)

---

## 📖 使用方法

### 方法一：直接打开（推荐）
1. 双击打开 `index.html`（或用浏览器打开）
2. 页面会自动加载嵌入数据，无需服务器

**注意**：如果在微信中打开，请确保：
- 将整个 `housing-price-chart` 文件夹上传到服务器（如 GitHub Pages、腾讯云 COS 等）
- 然后通过链接在微信中打开

### 方法二：本地服务器（调试用）
1. 双击运行 `start-server.bat`
2. 浏览器访问 `http://localhost:8000`

### 方法三：调试模式
1. 打开 `debug.html`
2. 点击"运行所有测试"
3. 查看测试结果，找出问题所在

---

## 🔄 如何更新数据（到最新一个月）

### 自动更新（推荐）
1. **安装 Python**（如果还没有）
   - 下载：https://www.python.org/downloads/
   - 安装时勾选"Add Python to PATH"

2. **运行更新脚本**
   - 双击运行 `update_data.py`（Windows）
   - 或在命令行执行：`python update_data.py`

3. **脚本会自动**：
   - 生成从 2000-01 到上个月的数据
   - 更新 `js/embeddedData.js` 文件
   - 显示"✅ 数据更新完成！"

### 手动更新（高级）
如果你想使用**真实数据**而不是模拟数据：

1. 准备真实数据源（CSV 文件或 API）
2. 修改 `update_data.py` 中的 `generate_monthly_data()` 函数
3. 运行脚本更新数据

---

## 📱 微信中使用

由于微信浏览器限制，不能直接打开本地 HTML 文件。你需要：

### 方案 A：使用在线托管（推荐）
1. 将 `housing-price-chart` 文件夹上传到：
   - **GitHub Pages**（免费）
   - **腾讯云 COS**（对象存储）
   - **Vercel**（免费）
2. 获取在线链接
3. 在微信中打开链接

### 方案 B：发送到微信文件传输助手
1. 将 `index.html` 发送到微信文件传输助手
2. 在微信中点击文件，选择"用其他应用打开"
3. 选择浏览器打开

**注意**：此方法可能因微信版本不同而有所差异

---

## 🐛 调试指南

如果页面仍然"点了没反应"，请按以下步骤调试：

### 步骤 1：打开浏览器开发者工具
- **Chrome/Edge**：按 `F12` 或 `Ctrl+Shift+I`
- **Firefox**：按 `F12` 或 `Ctrl+Shift+K`
- **Safari**：按 `Cmd+Option+I`

### 步骤 2：查看控制台（Console）错误
- 红色错误信息会显示在这里
- 常见错误：
  - `echarts is not defined` → ECharts 库未正确加载
  - `EmbeddedData is not defined` → embeddedData.js 未正确加载
  - `DataManager is not defined` → dataManager.js 未正确加载

### 步骤 3：运行调试页面
- 打开 `debug.html`
- 点击"运行所有测试"
- 查看哪个测试失败

### 步骤 4：检查文件路径
确保文件结构如下：
```
housing-price-chart/
├── index.html              ✅
├── debug.html             ✅
├── update_data.py         ✅
├── js/
│   ├── echarts.min.js     ✅ (本地 ECharts 库)
│   ├── embeddedData.js    ✅ (数据文件)
│   ├── dataManager.js     ✅
│   ├── calculator.js      ✅
│   ├── chartManager.js    ✅
│   ├── uiController.js    ✅
│   └── app.js            ✅
└── css/
    └── main.css          ✅
```

---

## 📊 数据说明

### 当前数据范围
- **时间范围**：2000-01 至 2026-05（每月都有数据）
- **城市数量**：5 个（北京、上海、广州、深圳、杭州）
- **数据类型**：
  - 新房价格 (`newHousePrice`)
  - 二手房价格 (`secondHandPrice`)
  - K线数据（`monthlyOpen`, `monthlyClose`, `monthlyLow`, `monthlyHigh`）

### 数据来源
- **当前**：模拟数据（基于指数增长模型）
- **建议**：替换为真实数据（国家统计局、安居客、链家等）

### 如何添加更多城市
1. 打开 `js/embeddedData.js`
2. 在 `citiesMeta` 中添加城市元数据
3. 在 `citiesData` 中添加该城市的数据
4. 运行 `update_data.py` 重新生成数据（或手动编辑）

---

## 🔧 高级配置

### 修改默认选中的城市
编辑 `js/uiController.js`，找到：
```javascript
this.selectedCities = ['beijing', 'shanghai', 'guangzhou', 'shenzhen', 'hangzhou'];
```
修改为你想默认显示的城市 ID。

### 修改默认日期范围
编辑 `js/uiController.js`，找到：
```javascript
startDate.value = '2000-01';
```
修改为你想要的起始日期。

### 使用真实数据 API
如果你有后端 API，可以修改 `js/dataManager.js`：
1. 将 `useEmbeddedData` 设置为 `false`
2. 修改 `loadCitiesMetaData()` 和 `loadCityData()` 方法，使用 `fetch` 从你的 API 加载数据

---

## 📞 常见问题（FAQ）

### Q1：为什么图表显示不正常？
**A**：可能原因：
1. 数据格式错误 → 运行 `update_data.py` 重新生成数据
2. ECharts 库未加载 → 检查 `js/echarts.min.js` 是否存在
3. 浏览器缓存 → 按 `Ctrl+F5` 强制刷新

### Q2：如何在微信中直接打开？
**A**：需要将文件上传到在线服务器（参见"微信中使用"章节）

### Q3：数据更新后，页面没有变化？
**A**：浏览器可能缓存了旧数据。解决方法：
1. 按 `Ctrl+F5` 强制刷新
2. 清除浏览器缓存
3. 在 `index.html` 中添加版本号（如 `embeddedData.js?v=2`）

### Q4：如何添加自己的数据？
**A**：
1. 准备 CSV 文件（格式：date, newHousePrice, secondHandPrice）
2. 修改 `update_data.py`，从 CSV 读取数据
3. 运行脚本更新 `embeddedData.js`

---

## 📝 更新日志

### 2026-05-01
- ✅ 修复"点了没反应"问题（下载本地 ECharts）
- ✅ 生成完整月度数据（2000-01 至 2026-05）
- ✅ 创建数据更新脚本 (`update_data.py`)
- ✅ 创建调试页面 (`debug.html`)
- ✅ 更新使用说明文档 (`README.md`)

---

## 🚀 下一步计划

- [ ] 添加更多城市数据
- [ ] 集成真实数据源 API
- [ ] 添加数据导出功能（CSV、Excel）
- [ ] 添加分享功能（生成截图或链接）
- [ ] 优化移动端体验
- [ ] 添加更多技术指标（RSI、MACD 等）

---

**如有问题，请查看 `debug.html` 的测试结果，或打开浏览器开发者工具查看错误信息。**
