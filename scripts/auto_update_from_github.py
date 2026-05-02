#!/usr/bin/env python3
"""
自动从GitHub获取70城房价数据并转换格式
数据源：techkang/house-price-viewer (国家统计局官方数据)
"""

import json
import requests
from datetime import datetime
import os
import time

# 基准价格（2023年均价，单位：元/平米）
# 用于将数据校准为近似真实价格
BASE_PRICES = {
    "北京": 58000, "上海": 52000, "广州": 32000, "深圳": 65000,
    "杭州": 32000, "南京": 31000, "成都": 16000, "武汉": 17000,
    "西安": 14000, "郑州": 14000, "天津": 25000, "苏州": 28000,
    "重庆": 15000, "长沙": 12000, "沈阳": 10000, "青岛": 22000,
    "大连": 15000, "厦门": 45000, "福州": 25000, "济南": 18000,
    "合肥": 20000, "南昌": 15000, "南宁": 12000, "海口": 18000,
    "贵阳": 10000, "昆明": 13000, "兰州": 12000, "西宁": 10000,
    "银川": 8000, "乌鲁木齐": 9000, "呼和浩特": 11000,
    "太原": 12000, "石家庄": 15000, "哈尔滨": 10000, "长春": 10000,
    "唐山": 9000, "秦皇岛": 9500, "包头": 8500, "丹东": 7000,
    "锦州": 7500, "吉林": 8500, "牡丹江": 7000, "无锡": 18000,
    "扬州": 14000, "徐州": 13000, "温州": 22000, "金华": 16000,
    "蚌埠": 9500, "安庆": 9000, "泉州": 14000, "九江": 8500,
    "赣州": 10000, "烟台": 13000, "济宁": 12000, "洛阳": 11000,
    "平顶山": 9000, "宜昌": 9500, "襄阳": 10000, "岳阳": 8500,
    "常德": 8000, "惠州": 13000, "湛江": 11000, "韶关": 8500,
    "桂林": 9000, "北海": 7500, "三亚": 28000, "泸州": 8500,
    "南充": 9000, "遵义": 8000, "大理": 10000
}

DATA_URL = "https://raw.githubusercontent.com/techkang/house-price-viewer/main/all_stats.json"


def download_data():
    """从GitHub下载70城房价数据"""
    print(f"📊 正在从GitHub下载数据...")
    print(f"   数据源：{DATA_URL}\n")
    
    try:
        response = requests.get(DATA_URL, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        print(f"✅ 下载成功")
        print(f"   城市数量：{len(data)}")
        
        # 检查数据范围
        if "北京" in data:
            beijing = data["北京"]
            if "new" in beijing:
                dates = sorted(beijing["new"].keys())
                print(f"   时间范围：{dates[0]} 至 {dates[-1]}")
        
        return data
        
    except Exception as e:
        print(f"❌ 下载失败：{e}")
        return None


def convert_to_our_format(raw_data):
    """将原始数据转换为我们的格式"""
    print(f"\n💾 正在转换数据格式...\n")
    
    result = {
        "meta": {
            "last_updated": datetime.now().isoformat(),
            "data_source": "国家统计局（通过 techkang/house-price-viewer 获取）",
            "description": "中国70城房价指数（自动更新）",
            "note": "价格为近似值，基于2023年均价校准"
        },
        "cities": {}
    }
    
    for city_name, city_data in raw_data.items():
        base_price = BASE_PRICES.get(city_name, 15000)
        
        # 获取新房数据
        new_data = city_data.get("new", {})
        second_data = city_data.get("secondhand", {})
        
        # 合并所有日期
        all_dates = set(new_data.keys()) | set(second_data.keys())
        all_dates = sorted(all_dates)
        
        converted_data = []
        prev_price = base_price  # 从基准价格开始
        
        for date_str in all_dates:
            # 新房价格
            if date_str in new_data:
                index_val = float(new_data[date_str])
                # 环比指数：100=持平，>100=上涨，<100=下跌
                # 计算真实价格：上一个月价格 × (指数 / 100)
                new_price = prev_price * (index_val / 100)
            else:
                new_price = None
            
            # 二手房价格
            if date_str in second_data:
                index_val = float(second_data[date_str])
                second_price = prev_price * 0.9 * (index_val / 100)  # 二手房约为新房的90%
            else:
                second_price = None
            
            if new_price or second_price:
                converted_data.append({
                    "date": date_str,
                    "new_house_price": round(new_price, 2) if new_price else None,
                    "second_hand_price": round(second_price, 2) if second_price else None
                })
                
                # 更新prev_price为当前新房价格（用于下一个月计算）
                if new_price:
                    prev_price = new_price
        
        if converted_data:
            result["cities"][city_name] = {
                "city_name": city_name,
                "province": guess_province(city_name),
                "data": converted_data
            }
    
    print(f"✅ 转换完成")
    print(f"   城市数量：{len(result['cities'])}")
    
    return result


def guess_province(city_name):
    """根据城市名猜测省份"""
    province_map = {
        "北京": "北京市", "上海": "上海市", "广州": "广东省", "深圳": "广东省",
        "杭州": "浙江省", "南京": "江苏省", "成都": "四川省", "武汉": "湖北省",
        "西安": "陕西省", "郑州": "河南省", "天津": "天津市", "苏州": "江苏省",
        "重庆": "重庆市", "长沙": "湖南省", "沈阳": "辽宁省", "青岛": "山东省",
        "大连": "辽宁省", "厦门": "福建省", "福州": "福建省", "济南": "山东省",
        "合肥": "安徽省", "南昌": "江西省", "南宁": "广西区", "海口": "海南省",
        "贵阳": "贵州省", "昆明": "云南省", "兰州": "甘肃省", "西宁": "青海省",
        "银川": "宁夏区", "乌鲁木齐": "新疆区", "呼和浩特": "内蒙古",
        "太原": "山西省", "石家庄": "河北省", "哈尔滨": "黑龙江省", "长春": "吉林省",
        "唐山": "河北省", "秦皇岛": "河北省", "包头": "内蒙古", "丹东": "辽宁省",
        "锦州": "辽宁省", "吉林": "吉林省", "牡丹江": "黑龙江省", "无锡": "江苏省",
        "扬州": "江苏省", "徐州": "江苏省", "温州": "浙江省", "金华": "浙江省",
        "蚌埠": "安徽省", "安庆": "安徽省", "泉州": "福建省", "九江": "江西省",
        "赣州": "江西省", "烟台": "山东省", "济宁": "山东省", "洛阳": "河南省",
        "平顶山": "河南省", "宜昌": "湖北省", "襄阳": "湖北省", "岳阳": "湖南省",
        "常德": "湖南省", "惠州": "广东省", "湛江": "广东省", "韶关": "广东省",
        "桂林": "广西区", "北海": "广西区", "三亚": "海南省", "泸州": "四川省",
        "南充": "四川省", "遵义": "贵州省", "大理": "云南省"
    }
    return province_map.get(city_name, "未知省份")


def save_data(data, output_path="../data/cities.json"):
    """保存数据到JSON文件"""
    print(f"\n💾 正在保存数据到 {output_path}...")
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    file_size = os.path.getsize(output_path) / 1024
    print(f"✅ 数据已保存")
    print(f"   文件路径：{output_path}")
    print(f"   文件大小：{file_size:.2f} KB")
    print(f"   城市数量：{len(data['cities'])} 个\n")


def main():
    print("=" * 70)
    print("🏠 国家统计局70城房价数据 - 自动更新脚本")
    print("=" * 70)
    print()
    
    # 1. 下载数据
    raw_data = download_data()
    if not raw_data:
        print("❌ 无法获取数据，退出")
        return
    
    # 2. 转换格式
    converted_data = convert_to_our_format(raw_data)
    
    # 3. 保存
    save_data(converted_data)
    
    print("=" * 70)
    print("✅ 自动更新完成！")
    print("=" * 70)
    print()
    print("下一步：")
    print("1. 运行 npm run generate-embedded 生成嵌入数据")
    print("2. 提交并推送到GitHub")
    print("3. GitHub Actions将每月自动运行此脚本")
    print()


if __name__ == "__main__":
    main()
