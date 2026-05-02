#!/usr/bin/env python3
"""
生成示例房价数据
用于测试和开发
"""

import json
import random
from datetime import datetime, timedelta

def generate_sample_data():
    """生成2000-2026年的示例数据"""
    
    # 城市列表（包括三线城市）
    cities = {
        '北京': {'base_price': 4500, 'growth_rate': 0.08, 'province': '北京市'},
        '上海': {'base_price': 4800, 'growth_rate': 0.085, 'province': '上海市'},
        '广州': {'base_price': 3500, 'growth_rate': 0.075, 'province': '广东省'},
        '深圳': {'base_price': 5000, 'growth_rate': 0.09, 'province': '广东省'},
        '杭州': {'base_price': 3200, 'growth_rate': 0.08, 'province': '浙江省'},
        '南京': {'base_price': 3000, 'growth_rate': 0.075, 'province': '江苏省'},
        '苏州': {'base_price': 2800, 'growth_rate': 0.08, 'province': '江苏省'},
        '宿迁': {'base_price': 1200, 'growth_rate': 0.06, 'province': '江苏省'},
        '连云港': {'base_price': 1300, 'growth_rate': 0.055, 'province': '江苏省'},
        '成都': {'base_price': 2500, 'growth_rate': 0.07, 'province': '四川省'},
        '武汉': {'base_price': 2400, 'growth_rate': 0.072, 'province': '湖北省'},
        '西安': {'base_price': 2200, 'growth_rate': 0.065, 'province': '陕西省'}
    }
    
    result = {
        'meta': {
            'last_updated': datetime.now().isoformat(),
            'data_source': '示例数据（用于测试）',
            'description': '中国主要城市房价数据（2000-2026）'
        },
        'cities': {}
    }
    
    # 生成每个城市的数据
    for city_name, info in cities.items():
        city_data = {
            'city_name': city_name,
            'province': info['province'],
            'data': []
        }
        
        base_price = info['base_price']
        growth_rate = info['growth_rate']
        
        # 生成2000-01到2026-04的数据
        current = datetime(2000, 1, 1)
        end = datetime(2026, 4, 1)
        
        while current <= end:
            # 计算价格（复合增长 + 随机波动）
            months_elapsed = (current.year - 2000) * 12 + current.month - 1
            price_multiplier = (1 + growth_rate) ** (months_elapsed / 12)
            base_calculated = base_price * price_multiplier
            
            # 添加随机波动（-5% 到 +5%）
            random_factor = 1 + random.uniform(-0.05, 0.05)
            new_house_price = round(base_calculated * random_factor, 2)
            
            # 二手房价格通常是新房的70-85%
            second_hand_price = round(new_house_price * random.uniform(0.70, 0.85), 2)
            
            city_data['data'].append({
                'date': current.strftime('%Y-%m'),
                'new_house_price': new_house_price,
                'second_hand_price': second_hand_price
            })
            
            # 下一个月
            if current.month == 12:
                current = datetime(current.year + 1, 1, 1)
            else:
                current = datetime(current.year, current.month + 1, 1)
        
        result['cities'][city_name] = city_data
        print(f"✅ 生成 {city_name} 的数据：{len(city_data['data'])} 个月")
    
    return result

def main():
    print("正在生成示例房价数据...")
    data = generate_sample_data()
    
    # 保存为JSON
    with open('data/cities.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ 数据已保存到 data/cities.json")
    print(f"   共 {len(data['cities'])} 个城市")
    print(f"   时间跨度：2000-01 至 2026-04")

if __name__ == '__main__':
    main()
