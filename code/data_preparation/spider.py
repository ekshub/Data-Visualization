

import requests
import xml.etree.ElementTree as ET
import json
import os
import time
from datetime import datetime

ARXIV_API_URL = "http://export.arxiv.org/api/query?"
CS_SUBCATEGORIES = [
    "cs.AI", "cs.LG", "cs.CC", "cs.LO", "cs.MA",
    "cs.CL", "cs.IR", "cs.PL", "cs.CG", "cs.GR",
    "cs.RO", "cs.DB", "cs.IT", "cs.NE", "cs.DS",
    "cs.DL", "cs.SE", "cs.CE", "cs.MS", "cs.SC",
    "cs.DC", "cs.HC", "cs.CV", "cs.NLP"
]
MAX_RESULTS_PER_REQUEST = 100
OUTPUT_FOLDER = "arxiv_cs_data"

def create_output_folder(folder_name):
    if not os.path.exists(folder_name):
        os.makedirs(folder_name)
    print(f"数据将保存到文件夹: {folder_name}")

def fetch_papers(query, start=0, max_results=MAX_RESULTS_PER_REQUEST):
    params = {
        "search_query": query,
        "start": start,
        "max_results": max_results,
        "sortBy": "submittedDate",
        "sortOrder": "ascending"
    }
    try:
        response = requests.get(ARXIV_API_URL, params=params, timeout=30)
        response.raise_for_status()
        return response.text
    except requests.exceptions.RequestException as e:
        print(f"请求错误: {e}")
        return None

def parse_arxiv_response(response_xml):
    root = ET.fromstring(response_xml)
    papers = []
    for entry in root.findall('{http://www.w3.org/2005/Atom}entry'):
        title_elem = entry.find('{http://www.w3.org/2005/Atom}title')
        title = title_elem.text.strip().replace('\n', ' ') if title_elem is not None else 'N/A'

        authors = []
        for author in entry.findall('{http://www.w3.org/2005/Atom}author'):
            name_elem = author.find('{http://www.w3.org/2005/Atom}name')
            if name_elem is not None:
                authors.append(name_elem.text.strip())

        summary_elem = entry.find('{http://www.w3.org/2005/Atom}summary')
        summary = summary_elem.text.strip().replace('\n', ' ') if summary_elem is not None else 'N/A'

        published_elem = entry.find('{http://www.w3.org/2005/Atom}published')
        published = published_elem.text.strip() if published_elem is not None else 'N/A'

        link_elem = entry.find('{http://www.w3.org/2005/Atom}id')
        link = link_elem.text.strip() if link_elem is not None else 'N/A'

        categories = [c.attrib.get('term', 'N/A') for c in entry.findall('{http://www.w3.org/2005/Atom}category')]

        papers.append({
            "title": title,
            "authors": authors,
            "summary": summary,
            "published": published,
            "link": link,
            "categories": categories
        })
    return papers

def save_papers_to_json(papers, file_path):
    # 若文件已存在，先读取旧数据
    existing_papers = []
    if os.path.exists(file_path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                existing_papers = json.load(f)
        except:
            existing_papers = []

    # 按链接去重
    existing_links = {p['link'] for p in existing_papers}
    new_papers = [p for p in papers if p['link'] not in existing_links]

    # 拼接后文件化存储
    merged_data = existing_papers + new_papers
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(merged_data, f, ensure_ascii=False, indent=4)
    print(f"{file_path} 保存完成: 本次新增 {len(new_papers)} 篇，总计 {len(merged_data)} 篇")

def get_all_papers(folder, start_year=1990, end_year=None):
    print("\n按年份循环抓取所有CS领域论文...")
    all_papers = []
    if end_year is None:
        end_year = datetime.now().year

    for category in CS_SUBCATEGORIES:
        for year in range(start_year, end_year + 1):
            query = f"cat:{category}+AND+submittedDate:[{year}0101+TO+{year}1231]"

            start = 0
            while True:
                response_xml = fetch_papers(query, start)
                if response_xml is None:
                    break
                papers = parse_arxiv_response(response_xml)
                if not papers:
                    break
                all_papers.extend(papers)
                print(f"{category}, {year}: 已累积 {len(all_papers)} 篇")
                if len(papers) < MAX_RESULTS_PER_REQUEST:
                    break
                start += MAX_RESULTS_PER_REQUEST
                time.sleep(3)
    save_papers_to_json(all_papers, os.path.join(folder, "all_papers.json"))

def filter_and_save_papers_by_year(all_papers_file, folder):
    try:
        with open(all_papers_file, 'r', encoding='utf-8') as f:
            all_papers = json.load(f)
    except Exception as e:
        print(f"加载失败: {e}")
        return

    papers_by_year = {}
    for paper in all_papers:
        try:
            y = datetime.strptime(paper['published'], "%Y-%m-%dT%H:%M:%SZ").year
        except ValueError:
            continue
        papers_by_year.setdefault(y, []).append(paper)

    for year, papers in papers_by_year.items():
        save_papers_to_json(papers, os.path.join(folder, f"{year}.json"))

def main():
    create_output_folder(OUTPUT_FOLDER)
    get_all_papers(OUTPUT_FOLDER, start_year=2015)  # 可根据需要调整起始年份
    filter_and_save_papers_by_year(os.path.join(OUTPUT_FOLDER, "all_papers.json"), OUTPUT_FOLDER)
    print("\n抓取任务完成。")

if __name__ == "__main__":
    main()