import json
from collections import defaultdict
from datetime import datetime

# 输入文件路径
input_file = 'arxiv_cs_data/all_papers.json'
# 输出文件路径
output_file = 'arxiv_cs_data/processed_data.json'

# 需要处理的子类别
CS_SUBCATEGORIES = [
    "cs.AI", "cs.LG", "cs.CC", "cs.LO", "cs.MA",
    "cs.CL", "cs.IR", "cs.PL", "cs.CG", "cs.GR",
    "cs.RO", "cs.DB", "cs.IT", "cs.NE", "cs.DS",
    "cs.DL", "cs.SE", "cs.CE", "cs.MS", "cs.SC",
    "cs.DC", "cs.CV"
]
def process_data(input_file, output_file):
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"读取文件时发生错误: {e}")
        return

    # 初始化数据结构
    papers_by_year_and_category = defaultdict(lambda: defaultdict(int))
    all_years = set()

    # 处理数据
    for paper in data:
        try:
            year = datetime.strptime(paper['published'], "%Y-%m-%dT%H:%M:%SZ").year
            all_years.add(year)
        except ValueError:
            continue

        categories = [cat for cat in paper['categories'] if cat in CS_SUBCATEGORIES]

        for category in categories:
            papers_by_year_and_category[category][year] += 1

    # 确保每个子类别在每一年都有数据
    all_years = sorted(all_years)
    processed_data = []
    for category in CS_SUBCATEGORIES:
        category_data = {
            'category': category,
            'values': [{'year': year, 'count': papers_by_year_and_category[category][year]} for year in all_years]
        }
        processed_data.append(category_data)

    # 保存处理后的数据
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(processed_data, f, ensure_ascii=False, indent=4)
        print(f"数据已成功保存到 {output_file}")
    except Exception as e:
        print(f"保存文件时发生错误: {e}")

if __name__ == "__main__":
    process_data(input_file, output_file)