#!/usr/bin/env python3
"""
数据聚合脚本
合并多个数据源：国家统计局、贝壳、房管局等
生成统一的JSON格式供前端使用
"""

import json
import pandas as pd
from datetime import datetime
import os

class DataAggregator:
    def __init__(self):
        self.merged_data = {
            'meta': {
                'last_updated': datetime.now().isoformat(),
                'data_source': '混合数据源（国家统计局 + 贝壳 + 房管局）',
                'description': '中国主要城市房价数据（2000年至今）'
            },
            'cities': {}
        }
    
    def load_stats_gov_data(self, filepath):
        """加载国家统计局数据"""
        print(f"正在加载国家统计局数据: {filepath}")
        
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # 转换为统一格式
        for item in data:
            year = item['year']
            month = item['month']
            date_key = f"{year}-{month:02d}"
            
            for city_name, city_data in item['cities'].items():
                if city_name not in self.merged_data['cities']:
                    self.merged_data['cities'][city_name] = {
                        'city_name': city_name,
                        'data': {}
                    }
                
                # 添加数据
                if 'price_index' not in self.merged_data['cities'][city_name]['data']:
                    self.merged_data['cities'][city_name]['data']['price_index'] = {}
                
                self.merged_data['cities'][city_name]['data']['price_index'][date_key] = city_data.get('new_house_index')
        
        print(f"✅ 国家统计局数据加载完成")
    
    def load_beike_data(self, filepath):
        """加载贝壳网数据"""
        print(f"正在加载贝壳数据: {filepath}")
        
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # 贝壳数据格式转换
        for city_code, city_info in data.items():
            city_name = city_info['city_name']
            
            if city_name not in self.merged_data['cities']:
                self.merged_data['cities'][city_name] = {
                    'city_name': city_name,
                    'data': {}
                }
            
            # 添加真实成交价
            for item in city_info['data']:
                date_key = f"{item['year']}-{item['month']:02d}"
                
                if 'real_price' not in self.merged_data['cities'][city_name]['data']:
                    self.merged_data['cities'][city_name]['data']['real_price'] = {}
                
                self.merged_data['cities'][city_name]['data']['real_price'][date_key] = item.get('price')
        
        print(f"✅ 贝壳数据加载完成")
    
    def interpolate_missing_data(self):
        """插值缺失数据"""
        print("正在进行数据插值...")
        
        for city_name, city_data in self.merged_data['cities'].items():
            if 'price_index' in city_data['data']:
                df = pd.DataFrame.from_dict(city_data['data']['price_index'], orient='index')
                
                # 线性插值
                df_interpolated = df.interpolate(method='linear')
                
                # 更新回原数据结构
                for date, value in df_interpolated[0].items():
                    city_data['data']['price_index'][date] = value
        
        print("✅ 数据插值完成")
    
    def convert_to_unified_format(self):
        """转换为前端需要的统一格式"""
        print("正在转换为统一格式...")
        
        output = {
            'meta': self.merged_data['meta'],
            'cities': {}
        }
        
        for city_name, city_data in self.merged_data['cities'].items():
            # 转换为数组格式
            data_array = []
            
            if 'real_price' in city_data['data']:
                for date, price in city_data['data']['real_price'].items():
                    data_array.append({
                        'date': date,
                        'new_house_price': price,
                        'second_hand_price': None  # 可能需要另外获取
                    })
            
            output['cities'][city_name] = {
                'city_name': city_name,
                'data': data_array
            }
        
        print("✅ 格式转换完成")
        return output
    
    def save_to_json(self, data, filename):
        """保存为JSON"""
        filepath = f"data/{filename}"
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"✅ 数据已保存到 {filepath}")
        
        # 也保存一个带时间戳的版本
        timestamp = datetime.now().strftime("%Y%m%d")
        backup_filepath = f"data/cities_{timestamp}.json"
        with open(backup_filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"✅ 备份已保存到 {backup_filepath}")


def main():
    aggregator = DataAggregator()
    
    # 加载各数据源（需要先运行爬虫脚本）
    data_dir = 'data'
    
    # 查找最新的数据文件
    files = os.listdir(data_dir)
    
    for file in files:
        if file.startswith('price_index_') and file.endswith('.json'):
            aggregator.load_stats_gov_data(os.path.join(data_dir, file))
        
        if file.startswith('beike_data_') and file.endswith('.json'):
            aggregator.load_beike_data(os.path.join(data_dir, file))
    
    # 插值缺失数据
    aggregator.interpolate_missing_data()
    
    # 转换为统一格式
    unified_data = aggregator.convert_to_unified_format()
    
    # 保存
    aggregator.save_to_json(unified_unified_data, 'cities.json')


if __name__ == "__main__":
    main()
