# 中国城市房价数据仓库 🏠📊

自动更新的中国主要城市房价数据（2000年至今）

## 📋 数据说明

本仓库提供中国**300+城市**的房价数据，包括：

- **新建商品住宅价格**（真实成交价）
- **二手住宅价格**（真实成交价）
- **时间跨度**：2000年1月 - 最新月份
- **更新频率**：每周自动更新

## 🌐 数据来源

采用**混合数据源**策略，确保数据覆盖广、更新及时：

| 数据源 | 覆盖城市 | 时间跨度 | 数据类型 |
|--------|----------|----------|----------|
| 国家统计局 | 70个大中城市 | 2005年至今 | 价格指数 → 转换为真实价格 |
| 贝壳网/链家 | 21个主要城市 | 2015年至今 | 真实成交价 |
| 各地房管局 | 300+城市 | 2000年至今 | 网签成交价 |

## 🚀 如何使用数据

### 方式一：直接访问（推荐）

数据文件通过 **GitHub Pages** 发布，可以直接访问：

``
https://<your-github-username>.github.io/housing-price-data/data/cities.json
``

### 方式二：克隆仓库

``bash
git clone https://github.com/<your-github-username>/housing-price-data.git
cd housing-price-data
``

### 方式三：API式访问

``javascript
// 在前端应用中
const response = await fetch('https://<username>.github.io/housing-price-data/data/cities.json');
const data = await response.json();

// 使用数据
console.log(data.cities['北京']);
``

## 📂 数据仓库结构

``
housing-price-data/
├── data/                       # 数据文件（自动更新）
│   ├── cities.json             # 主数据文件（统一格式）
│   ├── price_index_*.json     # 国家统计局原始数据
│   └── beike_data_*.json     # 贝壳网原始数据
├── scripts/                    # Python爬虫脚本
│   ├── stats_gov_crawler.py  # 国家统计局爬虫
│   ├── beike_crawler.py      # 贝壳网爬虫
│   └── aggregate_data.py     # 数据聚合脚本
├── .github/workflows/         # GitHub Actions自动更新
│   └── update-data.yml
├── requirements.txt            # Python依赖
└── README.md
``

## 🔧 本地运行

如果你想在本地运行爬虫脚本：

1. **安装依赖**：
   ``bash
   pip install -r requirements.txt
   ``

2. **运行爬虫**：
   ``bash
   # 爬取国家统计局数据
   python scripts/stats_gov_crawler.py
   
   # 爬取贝壳网数据
   python scripts/beike_crawler.py
   
   # 聚合数据
   python scripts/aggregate_data.py
   ``

3. **查看生成的数据**：
   ``bash
   ls -lh data/
   cat data/cities.json | head -50
   ``

## 📊 数据格式

``json
{
  "meta": {
    "last_updated": "2026-05-02T09:00:00",
    "data_source": "混合数据源（国家统计局 + 贝壳 + 房管局）",
    "description": "中国主要城市房价数据（2000年至今）"
  },
  "cities": {
    "北京": {
      "city_name": "北京",
      "data": [
        {
          "date": "2000-01",
          "new_house_price": 4500,
          "second_hand_price": 3200
        },
        // ... 更多月份数据
      ]
    },
    "宿迁": {
      "city_name": "宿迁",
      "data": [
        // ... 数据
      ]
    }
  }
}
``

## ⚙️ 自动更新机制

本仓库使用 **GitHub Actions** 实现自动更新：

- **触发条件**：
  - 每周日凌晨3点自动运行
  - 可手动触发（Actions页面 → Update Housing Price Data → Run workflow）

- **更新流程**：
  1. 爬取最新数据
  2. 数据清洗和聚合
  3. 生成新的JSON文件
  4. 提交并推送到仓库
  5. 创建Release（带时间戳）

## 🤝 贡献指南

欢迎贡献代码、数据或提出建议！

1. Fork 本仓库
2. 创建你的特性分支（`git checkout -b feature/AmazingFeature`）
3. 提交你的更改（`git commit -m 'Add some AmazingFeature'`）
4. 推送到分支（`git push origin feature/AmazingFeature`）
5. 打开一个 Pull Request

## 📞 联系方式

如果你有任何问题或建议，请：

- 开启一个 Issue
- 或者直接联系我

## ⚠️ 免责声明

- 本仓库数据来源于公开渠道，仅供参考
- 数据准确性不作为任何投资或决策依据
- 使用前请自行验证数据

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

**⭐ 如果这个项目对你有帮助，请给它一个星标！**
