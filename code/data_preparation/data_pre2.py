import json
import itertools

CS_SUBCATEGORIES = [
    "cs.AI", "cs.LG", "cs.CC", "cs.LO", "cs.MA",
    "cs.CL", "cs.IR", "cs.PL", "cs.CG", "cs.GR",
    "cs.RO", "cs.DB", "cs.IT", "cs.NE", "cs.DS",
    "cs.DL", "cs.SE", "cs.CE", "cs.MS", "cs.SC",
    "cs.DC", "cs.CV"
]

def compute_correlations(input_path, output_path):
    with open(input_path, "r", encoding="utf-8") as f:
        papers = json.load(f)

    # 初始化相关度（共现次数）存储结构
    correlation_data = {}

    # 为每对子领域统计共现次数
    for subcat1, subcat2 in itertools.combinations(CS_SUBCATEGORIES, 2):
        pair_key = f"{subcat1}__{subcat2}"
        correlation_data[pair_key] = 0

    # 遍历论文，统计共现
    for paper in papers:
        cats = paper.get("categories", [])
        for subcat1, subcat2 in itertools.combinations(CS_SUBCATEGORIES, 2):
            if subcat1 in cats and subcat2 in cats:
                pair_key = f"{subcat1}__{subcat2}"
                correlation_data[pair_key] += 1

    # 将结果转换为列表形式，便于可视化
    results = []
    for pair, count in correlation_data.items():
        sc1, sc2 = pair.split("__")
        results.append({
            "source": sc1,
            "target": sc2,
            "value": count
        })

    # 写入输出文件
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    input_json = "arxiv_cs_data/all_papers.json"
    output_json = "arxiv_cs_data/correlation.json"
    compute_correlations(input_json, output_json)
    print("Correlation data has been saved to", output_json)