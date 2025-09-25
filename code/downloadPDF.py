import sys
import requests

def download_pdf(paper_id):
    """
    根据传入的论文编号构造 URL，下载对应的 PDF 文件并保存到当前文件夹。
    参数：
        paper_id: 论文编号 (例如 '1206.5533v2')
    """
    pdf_url = f'https://arxiv.org/pdf/{paper_id}.pdf'
    try:
        response = requests.get(pdf_url, stream=True)
        response.raise_for_status()
        file_name = f'{paper_id.replace("/", "_")}.pdf'
        with open(file_name, 'wb') as f:
            for chunk in response.iter_content(chunk_size=1024):
                if chunk:
                    f.write(chunk)
        print(f"论文已成功下载为 {file_name}")
    except requests.exceptions.RequestException as e:
        print(f"下载过程中发生错误：{e}")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("请提供论文编号，例如：python downloadPDF.py 1206.5533v2")
    else:
        paper_id = sys.argv[1]
        download_pdf(paper_id)