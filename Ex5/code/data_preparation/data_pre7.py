import json
from collections import defaultdict

CS_SUBCATEGORIES = [
    "cs.AI", "cs.LG", "cs.CC", "cs.LO", "cs.MA",
    "cs.CL", "cs.IR", "cs.PL", "cs.CG", "cs.GR",
    "cs.RO", "cs.DB", "cs.IT", "cs.NE", "cs.DS",
    "cs.DL", "cs.SE", "cs.CE", "cs.MS", "cs.SC",
    "cs.DC", "cs.CV"
]

if __name__ == "__main__":
    input_path = "arxiv_cs_data\\processed_papers.json"
    output_path = "output_stats.json"

    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    grouped = defaultdict(lambda: {
        "total_word_count": 0,
        "total_num_images": 0,
        "total_num_pages": 0,
        "module_sums": defaultdict(int),
        "count": 0
    })

    for paper in data:
        year = paper["published"][:4]
        for cat in paper["categories"]:
            if cat in CS_SUBCATEGORIES:
                key = (year, cat)
                grouped[key]["total_word_count"] += paper.get("word_count", 0)
                grouped[key]["total_num_images"] += paper.get("num_images", 0)
                grouped[key]["total_num_pages"] += paper.get("num_pages", 0)
                for m, v in paper.get("modules", {}).items():
                    grouped[key]["module_sums"][m] += v
                grouped[key]["count"] += 1

    results = []
    for (year, cat), info in grouped.items():
        c = info["count"]
        if c == 0:
            continue
        avg_modules = {m: round(v / c, 2) for m, v in info["module_sums"].items()}
        results.append({
            "year": year,
            "category": cat,
            "avg_word_count": round(info["total_word_count"] / c, 2),
            "avg_num_images": round(info["total_num_images"] / c, 2),
            "avg_num_pages": round(info["total_num_pages"] / c, 2),
            "modules": avg_modules
        })

    with open(output_path, "w", encoding="utf-8") as out:
        json.dump(results, out, ensure_ascii=False, indent=2)

    print("处理完成，结果已输出至 output_stats.json")