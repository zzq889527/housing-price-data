#!/usr/bin/env python3
"""
国家统计局房价数据爬虫
从国家统计局网站获取70个大中城市的房价指数数据
"""

import requests
from bs4 import BeautifulSoup
import json
import pandas as pd
from datetime import datetime
import re

class StatsGovCrawler:
    def __init__(self):
        self.base_url = "https://www.stats.gov.cn/sj/zxfb/"
        self.data = {}
    
    def fetch_price_index(self, year, month):
        """
        获取指定年月的房价指数
        国家统计局公布的是同比/环比指数，需要转换为真实价格
        """
        # 构造URL（国家统计局的URL格式）
        # 示例: https://www.stats.gov.cn/sj/zxfb/202408/t20240815_1955978.html
        url = f"{self.base_url}{year}{month:02d}/"
        
        try:
            response = requests.get(url, timeout=10)
            response.encoding = 'gb2312'
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # 解析表格数据
            table = soup.find('table')
            if not table:
                print(f"未找到数据表格: {year}-{month}")
                return None
            
            # 提取数据
            data = self._parse_table(table, year, month)
            return data
            
        except Exception as e:
            print(f"获取数据时出错: {e}")
            return None
    
    def _parse_table(self, table, year, month):
        """解析HTML表格，提取房价指数"""
        data = {
            'year': year,
            'month': month,
            'cities': {}
        }
        
        rows = table.find_all('tr')
        for row in rows[1:]:  # 跳过表头
            cols = row.find_all('td')
            if len(cols) < 3:
                continue
            
            city_name = cols[0].text.strip()
            
            # 提取新建商品住宅价格指数（同比）
            try:
                new_house_index = float(cols[1].text.strip())
                data['cities'][city_name] = {
                    'new_house_index': new_house_index,
                    'second_hand_index': None  # 需要解析更多列
                }
            except:
                continue
        
        return data
    
    def fetch_historical_data(self, start_year=2005):
        """
        获取历史数据（从start_year到现在）
        注意：国家统计局网站结构调整过，早期数据可能不可用
        """
        print(f"开始获取 {start_year} 年至今的房价指数数据...")
        
        current_year = datetime.now().year
        current_month = datetime.now().month
        
        all_data = []
        
        for year in range(start_year, current_year + 1):
            start_month = 1 if year > start_year else 1
            end_month = 12 if year < current_year else current_month
            
            for month in range(start_month, end_month + 1):
                print(f"正在获取 {year}年{month}月 数据...")
                data = self.fetch_price_index(year, month)
                if data:
                    all_data.append(data)
        
        return all_data
    
    def convert_index_to_price(self, index_data, base_prices):
        """
        将房价指数转换为近似真实价格
        
        参数:
        - index_data: 爬取的指数数据
        - base_prices: 基准价格字典 {city_name: {year: xxx, price: xxx}}
        
        返回:
        - 真实价格数据
        """
        print("将房价指数转换为真实价格...")
        
        # 这里需要基准价格来校准
        # 基准价格可以从贝壳/链家获取，或者手动设置
        
        result = {}
        
        for item in index_data:
            year = item['year']
            month = item['month']
            key = f"{year}-{month:02d}"
            
            result[key] = {
                'year': year,
                'month': month,
                'cities': {}
            }
            
            for city_name, city_data in item['cities'].items():
                if city_name in base_prices:
                    base = base_prices[city_name]
                    # 计算真实价格（简化公式）
                    # 真实价格 = 基准价格 × (当前指数 / 基准指数)
                    current_index = city_data['new_house_index']
                    base_index = base['index']
                    base_price = base['price']
                    
                    real_price = base_price * (current_index / base_index)
                    
                    result[key]['cities'][city_name] = {
                        'new_house_price': round(real_price, 2),
                        'price_index': current_index
                    }
        
        return result


def main():
    crawler = StatsGovCrawler()
    
    # 获取历史数据
    data = crawler.fetch_historical_data(start_year=2005)
    
    # 保存原始指数数据
    with open('data/price_index_2005_2026.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ 数据已保存到 data/price_index_2005_2026.json")
    print(f"共获取 {len(data)} 个月的数据")


if __name__ == "__main__":
    main()
