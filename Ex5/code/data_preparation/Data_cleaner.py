import json
import re
import os
import glob
from collections import defaultdict
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

def download_nltk_resources():
    """
    下载必要的NLTK资源。
    """
    import nltk
    nltk.download('punkt')
    nltk.download('wordnet')
    nltk.download('omw-1.4')
    nltk.download('stopwords')

def initialize_stopwords():
    """
    初始化并返回合并后的停用词集合，包括通用停用词和机器学习领域特定停用词。
    """
    ml_stopwords = set([
        "model", "models", "learning", "learn", "learns", "learned", "learningbased",
        "data", "datas", "datasets", "feature", "features", "training", "train",
        "test", "testing", "accuracy", "performance", "algorithm", "algorithms",
        "network", "networks", "deep", "machine", "ml", "prediction", "predictions",
        "predict", "predicting", "predictionbased", "modeling", "optimizer",
        "optimizers", "optimization", "optimizing", "optimize", "optimizations",
        "parallelization", "parallelizations", "backpropagation", "gradient",
        "gradients", "regularization", "regularizing", "regularizers", "regularized",
        "overfitting", "bias", "biases", "unbiased", "fairness", "debiasing",
        "biasnet", "biased", "defenses", "defence", "robustness", "defending",
        "defend", "attack", "attacks", "adversaries", "attacker", "exploiting",
        "vulnerability", "backdoors", "malicious", "privacy", "detecting",
        "privacypreserving", "threat", "secure", "security", "vulnerabilities",
        "svm", "svms", "ensemble", "ensembles", "boosting", "boosted", "adaboost",
        "bagging", "boost", "dropout", "lasso", "loss", "regression", "predictable",
        "descent", "minimize", "minimized", "stochastic", "iteration", "approximating",
        "binarypredicate", "embeddingbased", "wordembeddings", "gnn", "relu",
        "latent", "variational", "simultaneously", "empirical", "neurocomputing",
        "geometry", "kernels", "optimizing", "maxpooling", "densegpu", "voxelwise",
        "normalized", "robustness", "uncertainty", "latent", "optimizer",
        "svm", "svms", "ensemble", "ensemblebased", "boosting", "boosted", "adaboost",
        "bagging", "boost", "dropout", "lasso", "loss", "regression", "predictable",
        "descent", "minimize", "minimized", "stochastic", "iteration", "approximating",
        "binarypredicate", "embeddingbased", "wordembeddings", "gnn", "relu",
        "latent", "variational", "simultaneously", "empirical", "neurocomputing",
        "geometry", "kernels", "optimizing", "maxpooling", "densegpu", "voxelwise",
        "normalized", "robustness", "uncertainty"
        # 您可以根据需要进一步扩展此列表
    ])
    
    nltk_stopwords = set(stopwords.words('english'))
    combined_stopwords = ml_stopwords.union(nltk_stopwords)
    return combined_stopwords

def initialize_lemmatizer():
    """
    初始化并返回WordNet词形还原器。
    """
    return WordNetLemmatizer()

def clean_word(word, lemmatizer):
    """
    清洗单个词汇：
    - 转为小写
    - 去除非字母字符
    - 词形还原
    """
    word = word.lower()
    word = re.sub(r'[^a-z]', '', word)  # 去除非字母字符
    word = lemmatizer.lemmatize(word)
    return word

def load_data(file_path):
    """
    从JSON文件加载数据
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data

def save_data(data, file_path):
    """
    将数据保存为JSON文件
    """
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

def clean_data(raw_data, stopwords_set, lemmatizer):
    """
    清洗原始词频数据
    """
    cleaned_freq = defaultdict(int)
    for word, freq in raw_data.items():
        cleaned_word = clean_word(word, lemmatizer)
        if cleaned_word and cleaned_word not in stopwords_set:
            cleaned_freq[cleaned_word] += freq
    return dict(cleaned_freq)

def process_file(input_file, output_file, stopwords_set, lemmatizer):
    """
    处理单个文件：加载、清洗并保存
    """
    try:
        raw_data = load_data(input_file)
        cleaned_data = clean_data(raw_data, stopwords_set, lemmatizer)
        # 可选：按频率降序排序
        sorted_cleaned_data = dict(sorted(cleaned_data.items(), key=lambda item: item[1], reverse=True))
        save_data(sorted_cleaned_data, output_file)
        print(f"处理完成：{input_file} -> {output_file}")
    except Exception as e:
        print(f"处理 {input_file} 时出错：{e}")

def main():
    # 下载NLTK资源
    download_nltk_resources()
    
    # 初始化停用词和词形还原器
    stopwords_set = initialize_stopwords()
    lemmatizer = initialize_lemmatizer()
    
    # 定义年份范围
    years = range(2010, 2025)  # 包含2010到2024
    
    # 遍历每个年份，处理对应的文件
    for year in years:
        input_filename = f"{year}_keywords.json"
        output_filename = f"{year}_cleaned_keywords.json"
        
        # 检查输入文件是否存在
        if not os.path.isfile(input_filename):
            print(f"文件不存在：{input_filename}，跳过。")
            continue
        
        process_file(input_filename, output_filename, stopwords_set, lemmatizer)
    
    print("所有文件处理完成。")

if __name__ == "__main__":
    main()
