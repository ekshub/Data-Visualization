# PaperDownloaf.py
import sys
import os
import re
import json
import requests
from pdfminer.high_level import extract_text
from collections import Counter
import xml.etree.ElementTree as ET

def fetch_arxiv_info(paper_id):
    """Fetches paper information from arXiv API."""
    api_url = f'http://export.arxiv.org/api/query?id_list={paper_id}'
    try:
        response = requests.get(api_url, timeout=10)
        if response.status_code != 200:
            return {'error': f'无法通过 arXiv API 获取信息，状态码：{response.status_code}'}
        
        # Parse XML response
        root = ET.fromstring(response.text)
        ns = {'atom': 'http://www.w3.org/2005/Atom'}

        entry = root.find('atom:entry', ns)
        if entry is None:
            return {'error': '未找到对应的 arXiv 条目'}

        # Extract title
        title = entry.find('atom:title', ns).text.strip().replace('\n', ' ')

        # Extract authors
        authors = [author.find('atom:name', ns).text.strip() for author in entry.findall('atom:author', ns)]

        # Extract categories
        categories = [category.attrib['term'] for category in entry.findall('atom:category', ns)]

        # Extract abstract
        abstract = entry.find('atom:summary', ns).text.strip().replace('\n', ' ')

        # Extract published date
        published = entry.find('atom:published', ns).text.strip()

        return {
            'title': title,
            'authors': authors,
            'categories': categories,
            'abstract': abstract,
            'published': published
        }

    except Exception as e:
        return {'error': '通过 arXiv API 获取信息时发生错误'}

def main():
    if len(sys.argv) != 2:
        print(json.dumps({'error': '缺少论文编号参数'}))
        sys.exit(1)
    
    paper_id = sys.argv[1].strip()
    if not paper_id:
        print(json.dumps({'error': '论文编号不能为空'}))
        sys.exit(1)
    
    PAPERS_DIR = os.path.join(os.path.dirname(__file__), 'papers')
    os.makedirs(PAPERS_DIR, exist_ok=True)
    
    pdf_url = f'https://arxiv.org/pdf/{paper_id}.pdf'
    pdf_path = os.path.join(PAPERS_DIR, f'{paper_id}.pdf')
    
    try:
        # 下载 PDF 文件
        response = requests.get(pdf_url, stream=True, timeout=20)
        if response.status_code != 200:
            print(json.dumps({'error': f'无法下载 PDF，状态码：{response.status_code}'}))
            sys.exit(1)
        
        with open(pdf_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
        
        # 提取文本
        text = extract_text(pdf_path)
        if not text:
            print(json.dumps({'error': '无法从 PDF 中提取文本'}))
            sys.exit(1)
        
        # 统计字数
        words = re.findall(r'\w+', text)
        word_count = len(words)
        
        # 增加停用词表，排除阿拉伯数字、英文数字和单个字母
        stop_words = set([
            "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't",
            "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by",
            "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't",
            "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have",
            "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself",
            "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into",
            "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my",
            "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our",
            "ours", "ourselves", "out", "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's",
            "should", "shouldn't", "so", "some", "such", "than", "that", "that's", "the", "their", "theirs",
            "them", "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll", "they're",
            "they've", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was",
            "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when",
            "when's", "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with",
            "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours",
            "yourself", "yourselves",
            "use", "used", "using", "uses", "utilize", "utilizes", "utilized", "utilizing",
            "apply", "applies", "applied", "applying",
            "implement", "implements", "implemented", "implementing",
            "develop", "develops", "developed", "developing",
            "conduct", "conducts", "conducted", "conducting",
            "provide", "provides", "provided", "providing",
            "make", "makes", "made", "making",
            "take", "takes", "taken", "taking",
            "get", "gets", "got", "getting",
            "increase", "increases", "increased", "increasing",
            "enhance", "enhances", "enhanced", "enhancing",
            "perform", "performs", "performed", "performing",
            "create", "creates", "created", "creating",
            "enable", "enables", "enabled", "enabling",
            "extract", "extracts", "extracted", "extracting",
            "train", "trains", "trained", "training",
            "evaluate", "evaluates", "evaluated", "evaluating",
            "analyze", "analyzes", "analyzed", "analyzing",
            "find", "finds", "found", "finding",
            "also", "very", "really", "extremely", "highly", "significantly", "mainly", "often",
            "frequently", "usually", "generally", "primarily", "specifically", "simply",
            "data", "dataset", "datasets", "information", "information-based",
            "algorithm", "algorithms", "model", "models", "system", "systems",
            "approach", "approaches", "method", "methods", "technique", "techniques",
            "process", "processes", "implementation", "implementations", "implement",
            "implementation", "usage", "utilization", "usage", "performance",
            "optimization", "optimizations", "optimizer", "optimizers", "regularization",
            "regularizations", "regularizing", "regularized", "overfitting", "underfitting",
            "bias", "biases", "variance", "variance", "fairness", "debiasing",
            "defenses", "defence", "robustness", "defending", "defend", "attack",
            "attacks", "adversaries", "attacker", "exploiting", "vulnerability",
            "vulnerabilities", "backdoors", "malicious", "privacy", "detecting",
            "privacypreserving", "threat", "secure", "security", "svm", "svms",
            "ensemble", "ensembles", "boosting", "boosted", "adaboost", "bagging",
            "boost", "dropout", "lasso", "loss", "regression", "predictable",
            "descent", "minimize", "minimized", "stochastic", "iteration",
            "approximating", "binarypredicate", "embeddingbased", "wordembeddings",
            "gnn", "relu", "latent", "variational", "simultaneously",
            "empirical", "neurocomputing", "geometry", "kernels", "maxpooling",
            "densegpu", "voxelwise", "normalized", "uncertainty",
            "based", "study", "studies", "studied", "studying", "research", "researches",
            "researched", "researching", "findings", "related", "relate", "relates",
            "relating", "features", "feature", "results", "result", "resulting",
            "similar", "similarity", "similarities", "significant", "significantly",
            "significance", "significances", "different", "differently", "difference",
            "differences", "comparison", "comparisons", "compare", "compares",
            "comparing", "compared", "some", "somewhat", "somehow", "sometimes",
            "someplace", "something", "sometime", "somewhere"
        ])
        
        filtered_words = [
            word.lower() for word in words 
            if word.lower() not in stop_words and not word.isdigit() and len(word) > 1 and not re.fullmatch(r'[a-zA-Z]', word)
        ]
        word_frequencies = Counter(filtered_words).most_common(50)
        
        # 准备词云数据
        word_cloud_data = [{'text': word, 'size': freq} for word, freq in word_frequencies]
        
        # 获取论文的基本信息
        arxiv_info = fetch_arxiv_info(paper_id)
        if 'error' in arxiv_info:
            print(json.dumps(arxiv_info))
            sys.exit(1)
        
        paper_info = {
            'title': arxiv_info.get('title', '未知标题'),
            'authors': arxiv_info.get('authors', []),
            'categories': arxiv_info.get('categories', []),
            'abstract': arxiv_info.get('abstract', ''),
            'published': arxiv_info.get('published', ''),
            'wordCount': word_count,
            'wordCloudData': word_cloud_data
        }
        
        print(json.dumps(paper_info, ensure_ascii=False))
        sys.exit(0)
    
    except Exception as e:
        print(json.dumps({'error': f'下载或处理 PDF 失败: {str(e)}'}))
        sys.exit(1)

if __name__ == '__main__':
    main()