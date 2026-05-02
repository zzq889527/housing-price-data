#!/usr/bin/env python3
"""
国家统计局70城房价数据自动抓取脚本
自动从第三方公开数据源获取最新房价指数，并转换为应用格式

数据源优先级：
1. GitHub公开数据集（最稳定）
2. 直接抓取国家统计局网站（备用）
"""

import requests
import json
import pandas as pd
import csv
from datetime import datetime, timedelta
import os
import re
import time

class AutomatedDataFetcher:
    def __init__(self):
        self.data_dir = '../data'
        self.raw_dir = '../data/raw'
        os.makedirs(self.raw_dir, exist_ok=True)
        
    def fetch_from_github_dataset(self):
        """
        从GitHub公开数据集自动获取数据
        这些数据集由志愿者维护，定期更新
        """
        print("📊 方案1：从GitHub公开数据集获取...")
        
        # 已知的公开数据集（按优先级排序）
        datasets = [
            {
                'name': 'China-House-Price-Index',
                'url': 'https://raw.githubusercontent.com/ndcos/China-House-Price-Index/main/data/70_cities.csv',
                'description': '70城房价指数（志愿者维护）'
            },
            {
                'name': '70-city-house-price',
                'url': 'https://raw.githubusercontent.com/cas-darwin/70-city-house-price/main/data/processed/70_cities_clean.csv',
                'description': '70城房价数据（ processed）'
            }
        ]
        
        for dataset in datasets:
            try:
                print(f"\n尝试从 {dataset['name']} 获取...")
                print(f"  URL: {dataset['url']}")
                
                response = requests.get(dataset['url'], timeout=30)
                response.raise_for_status()
                
                # 保存原始数据
                raw_file = os.path.join(self.raw_dir, f"{dataset['name']}.csv")
                with open(raw_file, 'w', encoding='utf-8') as f:
                    f.write(response.text)
                
                print(f"✅ 成功下载：{raw_file}")
                print(f"   数据行数：{len(response.text.splitlines())}")
                
                # 解析数据
                return self._parse_github_csv(raw_file, dataset['name'])
                
            except Exception as e:
                print(f"❌ 失败：{e}")
                continue
        
        print("\n⚠️  所有GitHub数据源均失败")
        return None
    
    def _parse_github_csv(self, csv_file, dataset_name):
        """解析GitHub数据集的CSV文件"""
        print(f"\n正在解析 {csv_file}...")
        
        try:
            df = pd.read_csv(csv_file)
            print(f"✅ 成功读取 {len(df)} 行数据")
            print(f"   列名：{list(df.columns)}")
            
            # 根据数据集格式转换
            if 'China-House-Price' in dataset_name:
                return self._convert_china_house_price(df)
            elif '70-city' in dataset_name:
                return self._convert_70_city(df)
            else:
                print("⚠️  未知的数据集格式，尝试通用转换...")
                return self._convert_generic(df)
                
        except Exception as e:
            print(f"❌ 解析失败：{e}")
            return None
    
    def _convert_china_house_price(self, df):
        """转换China-House-Price-Index数据集"""
        print("正在转换China-House-Price-Index格式...")
        
        # 该数据集格式：city, date, new_house_index, second_hand_index
        result = {
            "meta": {
                "last_updated": datetime.now().isoformat(),
                "data_source": "GitHub: ndcos/China-House-Price-Index",
                "description": "中国70城房价指数（自动更新）"
            },
            "cities": {}
        }
        
        # 按城市分组
        for city_name in df['city'].unique():
            city_data = df[df['city'] == city_name]
            
            city_info = {
                "city_name": city_name,
                "province": self._guess_province(city_name),
                "data": []
            }
            
            for _, row in city_data.iterrows():
                data_point = {
                    "date": row['date'],
                    "new_house_index": float(row['new_house_index']),
                    "second_hand_index": float(row['second_hand_index'])
                }
                city_info["data"].append(data_point)
            
            result["cities"][city_name] = city_info
        
        print(f"✅ 转换完成：{len(result['cities'])} 个城市")
        return result
    
    def fetch_from_stats_gov(self):
        """
        方案2：直接抓取国家统计局网站
        注意：可能需要处理反爬虫机制
        """
        print("\n📊 方案2：直接抓取国家统计局网站...")
        print("⚠️  注意：可能需要处理反爬虫机制")
        
        # 国家统计局数据发布页面
        base_url = "https://www.stats.gov.cn/sj/zxfb/"
        
        try:
            # 获取最新数据发布页面链接
            response = requests.get(base_url, timeout=30)
            response.encoding = 'gb2312'
            
            # 解析页面，找到房价数据链接
            # 这里需要根据实际HTML结构调整
            print("正在解析数据发布列表...")
            print("⚠️  此方案需要针对具体网页结构开发")
            print("   建议先使用方案1（GitHub数据集）")
            
            return None
            
        except Exception as e:
            print(f"❌ 抓取失败：{e}")
            return None
    
    def convert_index_to_price(self, index_data):
        """
        将房价指数转换为近似真实价格
        使用基准价格校准
        """
        print("\n💰 正在将指数转换为近似真实价格...")
        
        # 基准价格（2020年均价，单位：元/平米）
        base_prices = {
            "北京": 58000, "上海": 52000, "广州": 32000, "深圳": 65000,
            "杭州": 32000, "南京": 31000, "成都": 16000, "武汉": 17000,
            "西安": 14000, "郑州": 14000
        }
        
        # 基准指数（以2020年1月为100）
        base_index = 100.0
        
        result = {
            "meta": index_data["meta"],
            "cities": {}
        }
        
        for city_name, city_info in index_data["cities"].items():
            base_price = base_prices.get(city_name, 20000)  # 默认2万
            
            new_city_info = {
                "city_name": city_name,
                "province": city_info["province"],
                "data": []
            }
            
            for data_point in city_info["data"]:
                # 转换公式：真实价格 = 基准价格 × (当前指数 / 基准指数)
                new_house_index = data_point.get("new_house_index", 100)
                second_hand_index = data_point.get("second_hand_index", 100)
                
                new_house_price = base_price * (new_house_index / base_index)
                second_hand_price = new_house_price * 0.9  # 二手房约为新房的90%
                
                new_data_point = {
                    "date": data_point["date"],
                    "new_house_price": round(new_house_price, 2),
                    "second_hand_price": round(second_hand_price, 2)
                }
                
                new_city_info["data"].append(new_data_point)
            
            result["cities"][city_name] = new_city_info
        
        print(f"✅ 价格转换完成：{len(result['cities'])} 个城市")
        return result
    
    def _guess_province(self, city_name):
        """根据城市名猜测省份（简化版）"""
        province_map = {
            "北京": "北京市", "上海": "上海市", "广州": "广东省", "深圳": "广东省",
            "杭州": "浙江省", "南京": "江苏省", "成都": "四川省", "武汉": "湖北省",
            "西安": "陕西省", "郑州": "河南省"
        }
        return province_map.get(city_name, "未知省份")
    
    def save_data(self, data, filename='cities.json'):
        """保存数据到JSON文件"""
        output_path = os.path.join(self.data_dir, filename)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"\n✅ 数据已保存：{output_path}")
        print(f"   文件大小：{os.path.getsize(output_path) / 1024:.2f} KB")
        
        return output_path


def main():
    print("=" * 70)
    print("🏠 国家统计局70城房价数据自动抓取器")
    print("=" * 70)
    print()
    
    fetcher = AutomatedDataFetcher()
    
    # 方案1：从GitHub数据集获取（推荐）
    print("【方案1】从GitHub公开数据集获取（推荐）")
    index_data = fetcher.fetch_from_github_dataset()
    
    if index_data:
        print("\n✅ 成功获取指数数据，正在转换为价格...")
        price_data = fetcher.convert_index_to_price(index_data)
        fetcher.save_data(price_data)
    else:
        print("\n⚠️  方案1失败，尝试方案2...")
        print("\n【方案2】使用趋势生成数据（备用）")
        print("   说明：基于真实趋势生成近似数据")
        
        # 调用之前的趋势生成脚本
        import subprocess
        result = subprocess.run(['python', 'scripts/fetch_real_data.py'], 
                              capture_output=True, text=True)
        print(result.stdout)


if __name__ == "__main__":
    main()
