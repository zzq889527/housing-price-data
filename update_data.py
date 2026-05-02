"""
数据更新脚本 - 更新 embeddedData.js
用于定期更新房价数据到最新月份

使用方法：
1. 准备最新数据（CSV或手动编辑）
2. 运行此脚本：python update_data.py
3. 脚本会自动更新 js/embeddedData.js
"""

import json
import os
from datetime import datetime

# 配置
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
EMBEDDED_DATA_FILE = os.path.join(PROJECT_DIR, 'js', 'embeddedData.js')

def generate_monthly_data(start_year=2000, end_year=None):
    """
    生成模拟的月度房价数据
    实际使用时，应该从真实数据源（API、CSV等）读取
	"""
    if end_year is None:
        end_year = datetime.now().year
        # 如果当前月份未过完，使用上一个月
        current_month = datetime.now().month
        end_month = current_month - 1 if current_month > 1 else 12
        if current_month == 1:
            end_year -= 1
    else:
        end_month = 12
    
    # 示例：为北京生成数据
    # 实际使用时，这里应该从真实数据源读取
    data = []
    
    base_price = 4500  # 2000年基准价格
    yearly_growth = 0.08  # 年均增长率 8%
    
    for year in range(start_year, end_year + 1):
        months = 12
        if year == end_year:
            months = end_month
        
        for month in range(1, months + 1):
            date_str = f"{year}-{month:02d}"
            
            # 计算价格（简化模型：指数增长 + 季节性波动 + 随机噪声）
            years_passed = (year - start_year) + (month - 1) / 12
            trend_price = base_price * ((1 + yearly_growth) ** years_passed)
            
            # 季节性波动（春节影响）
            seasonal_factor = 0.98 if month == 2 else 1.0
            
            # 随机噪声（±2%）
            import random
            noise_factor = 1 + random.uniform(-0.02, 0.02)
            
            new_house_price = int(trend_price * seasonal_factor * noise_factor)
            second_hand_price = int(new_house_price * 0.85)  # 二手房为新房85%
            
            # 生成K线数据（开盘、收盘、最低、最高）
            monthly_open = int(new_house_price * random.uniform(0.98, 1.02))
            monthly_close = new_house_price
            monthly_low = int(min(monthly_open, monthly_close) * random.uniform(0.97, 0.99))
            monthly_high = int(max(monthly_open, monthly_close) * random.uniform(1.01, 1.03))
            
            data.append({
                'date': date_str,
                'newHousePrice': new_house_price,
                'secondHandPrice': second_hand_price,
                'monthlyOpen': monthly_open,
                'monthlyClose': monthly_close,
                'monthlyLow': monthly_low,
                'monthlyHigh': monthly_high
            })
    
    return data

def update_embedded_data():
    """更新 embeddedData.js 文件"""
    print("📊 开始更新房价数据...")
    
    # 读取现有数据（保留城市元数据和宏观数据）
    if os.path.exists(EMBEDDED_DATA_FILE):
        print(f"📖 读取现有文件: {EMBEDDED_DATA_FILE}")
        with open(EMBEDDED_DATA_FILE, 'r', encoding='utf-8') as f:
            content = f.read()
            # 提取现有数据（简单处理，实际应使用AST解析）
            # 这里我们直接生成新数据
    else:
        print("⚠️ embeddedData.js 不存在，将创建新文件")
    
    # 生成新数据（示例：更新所有城市）
    cities = ['beijing', 'shanghai', 'guangzhou', 'shenzhen', 'hangzhou']
    cities_data = {}
    
    for city_id in cities:
        print(f"  生成 {city_id} 的数据...")
        data = generate_monthly_data(2000)
        cities_data[city_id] = {
            'cityId': city_id,
            'cityName': {'beijing': '北京', 'shanghai': '上海', 'guangzhou': '广州', 'shenzhen': '深圳', 'hangzhou': '杭州'}[city_id],
            'province': {'beijing': '北京', 'shanghai': '上海', 'guangzhou': '广东', 'shenzhen': '广东', 'hangzhou': '浙江'}[city_id],
            'data': data
        }
    
    # 生成宏观数据（简化）
    macro_data = {
        'meta': {
            'dataSource': "示例数据 - 实际部署时请替换为真实数据",
            'lastUpdated': datetime.now().strftime('%Y-%m-%d'),
            'description': "中国宏观经济指标数据（月度）"
        },
        'monthlyData': generate_macro_data(2000),
        'events': [
            {'date': '2008-11', 'event': '四万亿刺激计划出台', 'impact': 'positive'},
            {'date': '2010-04', 'event': '国十条出台', 'impact': 'negative'},
            {'date': '2014-09', 'event': '930新政', 'impact': 'positive'},
            {'date': '2016-10', 'event': '930调控潮', 'impact': 'negative'},
            {'date': '2020-08', 'event': '三道红线政策', 'impact': 'negative'},
            {'date': '2022-11', 'event': '金融16条', 'impact': 'positive'}
        ]
    }
    
    # 构建新的 embeddedData.js 内容
    output = f"""/**
 * 嵌入式城市数据模块
 * 数据最后更新: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
 * 自动生成 - 请勿手动编辑
 */

const EmbeddedData = {{
    // 城市元数据
    citiesMeta: [
        {{ cityId: 'beijing', cityName: '北京', province: '北京' }},
        {{ cityId: 'shanghai', cityName: '上海', province: '上海' }},
        {{ cityId: 'guangzhou', cityName: '广州', province: '广东' }},
        {{ cityId: 'shenzhen', cityName: '深圳', province: '广东' }},
        {{ cityId: 'hangzhou', cityName: '杭州', province: '浙江' }}
    ],
    
    // 完整的城市房价数据（月度）
    citiesData: {json.dumps(cities_data, ensure_ascii=False, indent=8)},
    
    // 宏观数据
    macroData: {json.dumps(macro_data, ensure_ascii=False, indent=4)}
}};

// 导出到全局（浏览器环境）
if (typeof window !== 'undefined') {{
    window.EmbeddedData = EmbeddedData;
}}

// Node.js 环境导出
if (typeof module !== 'undefined' && module.exports) {{
    module.exports = EmbeddedData;
}}
"""
    
    # 写入文件
    with open(EMBEDDED_DATA_FILE, 'w', encoding='utf-8') as f:
        f.write(output)
    
    print(f"✅ 数据更新完成！文件已保存: {EMBEDDED_DATA_FILE}")
    print(f"   数据时间范围: 2000-01 至 {datetime.now().strftime('%Y-%m')}")

def generate_macro_data(start_year=2000):
    """生成模拟的宏观数据"""
    import random
    
    data = []
    end_year = datetime.now().year
    end_month = datetime.now().month - 1 if datetime.now().month > 1 else 12
    
    if datetime.now().month == 1:
        end_year -= 1
    
    for year in range(start_year, end_year + 1):
        months = 12
        if year == end_year:
            months = end_month
        
        for month in range(1, months + 1):
            date_str = f"{year}-{month:02d}"
            
            # 模拟宏观数据（简化）
            data.append({
                'date': date_str,
                'GDP_YoY': round(random.uniform(5.0, 12.0), 1),
                'CPI_YoY': round(random.uniform(0.5, 5.0), 1),
                'M2_YoY': round(random.uniform(8.0, 25.0), 1),
                'interestRate_10Y': round(random.uniform(2.5, 4.5), 2),
                'realEstateInvestment_YoY': round(random.uniform(-10.0, 35.0), 1)
            })
    
    return data

if __name__ == '__main__':
    update_embedded_data()
