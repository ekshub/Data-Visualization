
import json
import os

CS_SUBCATEGORIES = [
    "cs.AI", "cs.LG", "cs.CC", "cs.LO", "cs.MA",
    "cs.CL", "cs.IR", "cs.PL", "cs.CG", "cs.GR",
    "cs.RO", "cs.DB", "cs.IT", "cs.NE", "cs.DS",
    "cs.DL", "cs.SE", "cs.CE", "cs.MS", "cs.SC",
    "cs.DC", "cs.CV"
]

module_synonyms = {
    
    
    "background": ["background", "backgrounds", "background:", "background."],
    "method": [
        "method", "methods", "methodology", "methodologies", "method:", "method.",
        "methods:", "methods.", "methodology:", "methodology.", "methodologies:",
        "methodologies.", "approach", "approaches", "approach:", "approach.",
        "approaches:", "approaches."
    ],
    "experiment": ["experiment", "experiments", "experiment:", "experiment."],
    "result": ["result", "results", "result:", "result."],
    "discussion": ["discussion", "discussions", "discussion:", "discussion."],
    "conclusion": ["conclusion", "conclusions", "conclusion:", "conclusion."],
    "reference": ["reference", "references", "reference:", "reference.","references,","references."]
}

data_path = "arxiv_cs_data/processed_papers.json"
if not os.path.exists(data_path):
    print("processed_papers.json 文件未找到")
    exit(1)

with open(data_path, "r", encoding="utf-8") as f:
    papers = json.load(f)

# 每个分类的论文总数
papers_count = {cat: 0 for cat in CS_SUBCATEGORIES}
# 每个分类中每个标准模块名称出现的论文数量
module_counts = {
    cat: {mod: 0 for mod in module_synonyms.keys()}
    for cat in CS_SUBCATEGORIES
}

for paper in papers:
    cat_list = paper.get("categories", [])
    mods = set(paper.get("modules", []))  # 去重
    for c in cat_list:
        if c in CS_SUBCATEGORIES:
            papers_count[c] += 1
            for mod in mods:
                for std_module, syns in module_synonyms.items():
                    if mod in syns:
                        module_counts[c][std_module] += 1
                        break

# 计算出现频率 = 出现次数 / 论文总数
frequencies = {cat: {} for cat in CS_SUBCATEGORIES}
for cat in CS_SUBCATEGORIES:
    total_papers = papers_count[cat]
    for std_module in module_synonyms:
        if total_papers > 0:
            freq = module_counts[cat][std_module] / total_papers
        else:
            freq = 0
        frequencies[cat][std_module] = freq

# 保存结果
output_file = "module_frequencies.json"
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(frequencies, f, ensure_ascii=False, indent=4)

print(f"结果已存储到 {output_file}")