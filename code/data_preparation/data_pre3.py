import json
from collections import defaultdict

def compute_yearly_totals(input_path, output_path):
    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # 初始化每年论文总量的存储结构
    yearly_totals = defaultdict(int)

    # 遍历数据，统计每年论文总量
    for category_data in data:
        for entry in category_data["values"]:
            year = entry["year"]
            count = entry["count"]
            yearly_totals[year] += count

    # 转换为列表形式，便于保存为 JSON
    results = [{"year": year, "total_count": count} for year, count in sorted(yearly_totals.items())]

    # 写入输出文件
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    input_json = "arxiv_cs_data/processed_data.json"
    output_json = "arxiv_cs_data/yearly_totals.json"
    compute_yearly_totals(input_json, output_json)
    print("Yearly totals data has been saved to", output_json)