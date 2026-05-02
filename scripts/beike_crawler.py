#!/usr/bin/env python3
"""
贝壳网房价数据爬虫
获取21个主要城市的真实成交价格
支持城市：北京、上海、广州、深圳、成都、杭州、重庆、武汉、西安、苏州、
南京、天津、长沙、沈阳、青岛、郑州、大连、东莞、宁波、昆明、合肥
"""

import requests
import json
import time
from datetime import datetime, timedelta
import re

class BeikeCrawler:
    def __init__(self):
        # 贝壳网API端点（需要根据实际情况调整）
        self.base_url = "https://m.ke.com"
        self.cities = {
            'bj': '北京', 'sh': '上海', 'gz': '广州', 'sz': '深圳',
            'cd': '成都', 'hz': '杭州', 'cq': '重庆', 'wh': '武汉',
            'xa': '西安', 'su': '苏州', 'nj': '南京', 'tj': '天津',
            'cs': '长沙', 'sy': '沈阳', 'qd': '青岛', 'zz': '郑州',
            'dl': '大连', 'dg': '东莞', 'nb': '宁波', 'km': '昆明', 'hf': '合肥'
        }
        
    def fetch_city_data(self, city_code, start_date, end_date):
        """
        获取指定城市的成交数据
        注意：贝壳网可能需要模拟浏览器行为
        """
        print(f"正在获取 {self.cities[city_code]} 的数据...")
        
        # 构造请求URL（示例，实际需要根据贝壳网的API调整）
        # 贝壳网的成交数据通常在 /chengjiao/ 路径下
        url = f"{self.base_url}/{city_code}/chengjiao/"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': self.base_url
        }
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                # 解析HTML（需要使用BeautifulSoup）
                # 这里只是框架，实际需要详细解析
                data = self._parse_chengjiao(response.text, city_code)
                return data
            else:
                print(f"请求失败: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"获取数据时出错: {e}")
            return None
    
    def _parse_chengjiao(self, html, city_code):
        """解析成交页面"""
        # 这里需要使用BeautifulSoup解析
        # 示例返回结构
        return {
            'city_code': city_code,
            'city_name': self.cities[city_code],
            'data': []
        }
    
    def fetch_historical_data(self, city_codes=None, months=12):
        """
        获取历史成交数据
        
        参数:
        - city_codes: 城市代码列表，None表示所有城市
        - months: 获取最近N个月的数据
        """
        if city_codes is None:
            city_codes = list(self.cities.keys())
        
        print(f"开始获取 {len(city_codes)} 个城市最近 {months} 个月的数据...")
        
        all_data = {}
        current_date = datetime.now()
        
        for city_code in city_codes:
            city_data = []
            
            # 获取最近N个月的数据
            for i in range(months):
                date = current_date - timedelta(days=30*i)
                year_month = f"{date.year}-{date.month:02d}"
                
                data = self.fetch_city_data(city_code, year_month, year_month)
                if data:
                    city_data.append(data)
                
                # 友好延迟，避免被封
                time.sleep(1)
            
            all_data[city_code] = {
                'city_name': self.cities[city_code],
                'data': city_data
            }
        
        return all_data
    
    def save_to_json(self, data, filename):
        """保存数据到JSON文件"""
        with open(f"data/{filename}", 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"✅ 数据已保存到 data/{filename}")


def main():
    crawler = BeikeCrawler()
    
    # 获取最近12个月的数据
    data = crawler.fetch_historical_data(months=12)
    
    # 保存数据
    timestamp = datetime.now().strftime("%Y%m%d")
    crawler.save_to_json(data, f"beike_data_{timestamp}.json")


if __name__ == "__main__":
    main()
