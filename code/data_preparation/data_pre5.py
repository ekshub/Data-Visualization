import os
import json
import fitz  # PyMuPDF
import requests
import string
from tqdm import tqdm

input_file = "arxiv_cs_data/all_papers.json"
output_file = "arxiv_cs_data/processed_papers.json"
pdf_dir = "arxiv_cs_data/pdfs"
os.makedirs(pdf_dir, exist_ok=True)
batch_size = 1000

def download_pdf(url, pdf_path):
    try:
        response = requests.get(url, stream=True, timeout=30)
        if response.status_code == 200:
            with open(pdf_path, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
            return True
        else:
            print(f"下载失败: {url}，状态码: {response.status_code}")
            return False
    except Exception as e:
        print(f"下载错误: {url}，错误: {e}")
        return False

def extract_pdf_info(pdf_path):
    try:
        doc = fitz.open(pdf_path)
        num_pages = len(doc)
        num_images = 0
        text = ""
        for page in doc:
            num_images += len(page.get_images(full=True))
            text += page.get_text()
        word_count = len(text.split())

        modules = {}
        module_word_counts = {}
        module_synonyms = {
            "introduction": ["introduction", "introductions","introduction,","introduction."],
            "related work": ["related work", "related works", "related work:", "related work."],
            "background": ["background", "backgrounds", "background:", "background."],
            "method": ["method", "methods", "methodology", "methodologies", "method:", "method.", "methods:", "methods.", "methodology:", "methodology.", "approach", "approaches", "approach:", "approach.", "approaches:", "approaches."],
            "experiment": ["experiment", "experiments", "experiment:", "experiment."],
            "result": ["result", "results", "result:", "result."],
            "discussion": ["discussion", "discussions", "discussion:", "discussion."],
            "conclusion": ["conclusion", "conclusions", "conclusion:", "conclusion."],
            "reference": ["reference", "references", "reference:", "reference.","references,","references."],
        }

        for line in text.splitlines():
            cleaned_line = line.lower().translate(str.maketrans("", "", string.punctuation))
            words = cleaned_line.split()
            for module_name, synonyms in module_synonyms.items():
                if any(w in words for w in synonyms):
                    modules[module_name] = modules.get(module_name, 0) + len(words)
                    module_word_counts[module_name] = module_word_counts.get(module_name, 0) + len(cleaned_line.split())
                    break

        return {
            "word_count": word_count,
            "num_images": num_images,
            "num_pages": num_pages,
            "modules": modules,
            "module_word_counts": module_word_counts,
        }
    except Exception as e:
        print(f"解析 PDF 错误: {pdf_path}，错误: {e}")
        return None

def load_data(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)

def save_data(data, file_path):
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

def process_papers():
    papers = load_data(input_file)
    processed_papers = []
    total = len(papers)
    for i in tqdm(range(0, total, batch_size), desc="处理论文批次"):
        batch = papers[i:i+batch_size]
        
        # 下载PDF
        for index, paper in enumerate(tqdm(batch, desc=f"下载第 {i//batch_size +1} 批", leave=False)):
            try:
                pdf_url = paper["link"].replace("abs", "pdf")
                pdf_path = os.path.join(pdf_dir, f"paper_{i + index +1}.pdf")
                download_pdf(pdf_url, pdf_path)
            except Exception as e:
                print(f"下载论文错误: {paper.get('title', '未知标题')}，错误: {e}")

        # 处理PDF
        for index, paper in enumerate(tqdm(batch, desc=f"处理第 {i//batch_size +1} 批", leave=False)):
            try:
                pdf_path = os.path.join(pdf_dir, f"paper_{i + index +1}.pdf")
                pdf_info = extract_pdf_info(pdf_path)
                if not pdf_info:
                    continue

                paper.update(pdf_info)
                processed_papers.append(paper)
                os.remove(pdf_path)

            except Exception as e:
                print(f"处理论文错误: {paper.get('title', '未知标题')}，错误: {e}")

        save_data(processed_papers, output_file)
        print(f"已处理 {len(processed_papers)} 篇论文。")

    print(f"处理完成，共处理 {len(processed_papers)} 篇论文。")

if __name__ == "__main__":
    process_papers()