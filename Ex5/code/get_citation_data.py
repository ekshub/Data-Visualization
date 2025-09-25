#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import json
import requests
import xml.etree.ElementTree as ET
import re
from collections import Counter
import nltk
from nltk.corpus import stopwords

def get_arxiv_metadata(arxiv_id):
    # 去掉版本号（如果有）
    arxiv_id = arxiv_id.split('v')[0]
    url = f'http://export.arxiv.org/api/query?id_list={arxiv_id}'
    response = requests.get(url)
    
    if response.status_code != 200:
        return {'error': f'无法获取 arXiv ID {arxiv_id} 的数据'}
    
    root = ET.fromstring(response.content)
    entry = root.find('{http://www.w3.org/2005/Atom}entry')
    
    if entry is None:
        return {'error': f'未找到 arXiv ID {arxiv_id} 的条目'}
    
    namespaces = {'atom': 'http://www.w3.org/2005/Atom'}
    
    # 获取标题
    title_elem = entry.find('atom:title', namespaces)
    title = title_elem.text.strip() if title_elem is not None else 'N/A'
    
    # 获取作者列表
    authors = [author.find('atom:name', namespaces).text.strip()
               for author in entry.findall('atom:author', namespaces)]
    
    # 获取学科分类
    categories = [category.attrib.get('term', 'N/A')
                  for category in entry.findall('atom:category', namespaces)]
    
    # 获取摘要
    abstract_elem = entry.find('atom:summary', namespaces)
    abstract = abstract_elem.text.strip() if abstract_elem is not None else 'N/A'
    
    metadata = {
        'title': title,
        'authors': authors,
        'categories': categories,
        'abstract': abstract  # 包含摘要
    }
    
    return metadata

def process_abstract(abstract):
    # 下载停用词列表（如果尚未下载）
    nltk.download('stopwords', quiet=True)
    stop_words = set(stopwords.words('english'))
    
    # 对摘要进行分词
    words = re.findall(r'\b\w+\b', abstract.lower())
    
    # 过滤停用词和长度小于等于2的词
    words = [word for word in words if word not in stop_words and len(word) > 2]
    
    # 统计词频
    word_counts = Counter(words)
    
    # 获取前50个高频词
    top_words = word_counts.most_common(50)
    
    # 将结果转换为列表字典
    word_cloud_data = [{'text': word, 'size': count} for word, count in top_words]
    
    return word_cloud_data

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': '未提供 arXiv ID'}))
        return
    
    arxiv_id = sys.argv[1]
    
    # 获取 arXiv 元数据
    arxiv_metadata = get_arxiv_metadata(arxiv_id)
    if 'error' in arxiv_metadata:
        print(json.dumps(arxiv_metadata, ensure_ascii=False))
        return
    
    # 处理摘要，获取词云数据
    word_cloud_data = process_abstract(arxiv_metadata.get('abstract', ''))
    
    # 将词云数据添加到元数据中
    arxiv_metadata['wordCloudData'] = word_cloud_data
    
    # 输出结果为 JSON 格式
    print(json.dumps(arxiv_metadata, ensure_ascii=False))
    
if __name__ == '__main__':
    main()
