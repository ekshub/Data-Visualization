const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const urlModule = require('url');

// 定义服务器端口
const PORT = 3000;

// 设置 Python 可执行路径
const pythonExecutable = "\\Users\\19368\\.conda\\envs\\web_env\\python.exe"; // 根据实际路径修改

// 创建 HTTP 服务器
const server = http.createServer((req, res) => {
    console.log(`收到请求: ${req.method} ${req.url}`);

    // 解析请求URL
    const parsedUrl = urlModule.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // 处理根路径，默认返回 index.html
    let filePath = '.' + pathname;
    if (pathname === '/' || pathname === '') {
        filePath = './index.html';
    }

    // 处理获取论文信息的请求
    if (pathname === '/getPaperInfo' && req.method === 'GET') {
        // 获取查询参数中的论文编号
        const paperId = parsedUrl.query.paperId;

        if (paperId) {
            console.log(`调用 PaperDownload.py 处理论文编号: ${paperId}`);
            // 调用 PaperDownload.py，传入论文编号
            const pythonProcess = spawn(pythonExecutable, [path.join(__dirname, 'PaperDownload.py'), paperId]);

            let dataString = '';
            let errorString = '';

            pythonProcess.stdout.on('data', (data) => {
                dataString += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                errorString += data.toString();
                console.error(`Python 错误: ${data}`);
            });

            pythonProcess.on('close', (code) => {
                console.log(`PaperDownload.py 进程退出，代码：${code}`);
                if (code === 0) {
                    try {
                        const jsonData = JSON.parse(dataString);
                        res.writeHead(200, { 
                            'Content-Type': 'application/json; charset=utf-8',
                            'Access-Control-Allow-Origin': '*' // 根据需要设置
                        });
                        res.end(JSON.stringify(jsonData));
                    } catch (parseError) {
                        console.error('JSON 解析错误:', parseError);
                        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                        res.end(JSON.stringify({ error: '服务器返回无效的 JSON 数据' }));
                    }
                } else {
                    console.error(`Python 脚本错误输出: ${errorString}`);
                    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ error: `服务器内部错误，无法处理请求: ${errorString}` }));
                }
            });
        } else {
            res.writeHead(400, { 
                'Content-Type': 'application/json; charset=utf-8',
                'Access-Control-Allow-Origin': '*' // 根据需要设置
            });
            res.end(JSON.stringify({ error: '缺少论文编号参数' }));
        }
        return;
    }

    // 获取文件扩展名
    const extname = String(path.extname(filePath)).toLowerCase();

    // 设置 MIME 类型
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.gif': 'image/gif',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'font/otf',
        '.wasm': 'application/wasm'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    // 读取文件
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // 如果文件未找到，返回 404 页面
                fs.readFile('./404.html', (err, data) => {
                    if (err) {
                        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                        res.end('404 未找到', 'utf-8');
                    } else {
                        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                        res.end(data, 'utf-8');
                    }
                });
            } else {
                // 其他服务器错误
                res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end(`服务器错误: ${error.code}`);
            }
        } else {
            // 成功读取文件，返回内容
            res.writeHead(200, { 'Content-Type': contentType + '; charset=utf-8' });
            res.end(content, 'utf-8');
        }
    });
});

// 启动服务器
server.listen(PORT, () => {
    console.log(`服务器已启动，访问地址: http://localhost:${PORT}/`);
});
