// page4_Figure4.js
(function() {
    if (!window.leftChartDispatch) {
        window.leftChartDispatch = d3.dispatch('squareClicked', 'yearRangeChanged', 'categoriesChanged', 'categorySelected');
    }

    if (window.leftChartDispatch && typeof window.leftChartDispatch.on === 'function') {

        // 监听方块点击事件
        window.leftChartDispatch.on('squareClicked.wordcloud', function(squareData) {
            const selectedYear = squareData.year;
            const selectedCategory = squareData.category;

            loadAndRenderWordCloud(selectedYear, selectedCategory);
        });

        // 初始渲染（显示2024年AI领域的词云）
        loadAndRenderWordCloud(2024, 'cs.AI');

        // 加载并渲染词云的函数
        function loadAndRenderWordCloud(selectedYear, selectedCategory) {
            if (!selectedYear || !selectedCategory) {
                updateWordCloud({});
                return;
            }

            const filename = `keywords/${selectedYear}_${selectedCategory}.json`;

            d3.json(filename).then(function(freqObj) {
                updateWordCloud(freqObj, selectedYear, selectedCategory);
            }).catch(function(error) {
                console.error(`Error loading ${filename}:`, error);
                // 如果文件不存在或有错误，显示占位
                updateWordCloud({}, selectedYear, selectedCategory);
            });
        }

        // 更新词云的函数
        function updateWordCloud(frequencies, selectedYear, selectedCategory) {
            let wordsArray = [];
            for (let word in frequencies) {
                wordsArray.push({ text: word, count: frequencies[word] });
            }

            // 按频率排序并取前 N 个词
            const maxWords = 100;  // 根据需要调整
            wordsArray.sort((a, b) => b.count - a.count);
            wordsArray = wordsArray.slice(0, maxWords);

            // 获取词云容器的实际宽度和高度
            const wordCloudDiv = document.getElementById('word-cloud');
            const width = wordCloudDiv.clientWidth || 500;
            const height = wordCloudDiv.clientHeight - 20 || 500;

            // 移除现有的 SVG 或占位符
            d3.select('#word-cloud').selectAll('*').remove();

            // 移除现有的标题
            d3.select('#word-cloud-title').remove();

            if (wordsArray.length === 0) {
                // 如果没有数据，显示占位消息
                d3.select('#word-cloud').append('div')
                    .attr('id', 'word-cloud-placeholder')
                    .text('所选年份和类别没有可用的数据。')
                    .style('text-align', 'center')
                    .style('padding-top', '50px')
                    .style('color', '#666');
                return;
            }

            // 插入新的标题
            d3.select('#word-cloud-container').insert('h2', '#word-cloud')
                .attr('id', 'word-cloud-title')
                .text(`${selectedYear}年${selectedCategory.replace(/^cs\./, '')}类论文词云`)
                .style('text-align', 'center')
                .style('margin', '0')
                .style('height', '20px')
                .style('line-height', '20px');

            // 绘制词云
            drawWordCloud(wordsArray, width, height);
        }

        // 绘制词云的函数
        function drawWordCloud(wordsArray, width, height) {
            // 定义边距
            const margin = { top: 25, right: 5, bottom: 20, left: 5 };
            const svgWidth = width - margin.left - margin.right;
            const svgHeight = height - margin.top - margin.bottom;

            // 创建基于词频的字体大小比例尺
            const maxCount = d3.max(wordsArray, d => d.count);
            const minCount = d3.min(wordsArray, d => d.count);

            const fontSizeScale = d3.scaleSqrt()
                .domain([minCount, maxCount])
                .range([15, 50]); // 根据需要调整字体大小范围

            // 配置布局
            const layout = d3.layout.cloud()
                .size([svgWidth, svgHeight])
                .words(wordsArray.map(function(d) {
                    return { text: d.text, size: fontSizeScale(d.count) };
                }))
                .padding(5) // 增加间距以减少重叠
                .rotate(0) // 为简单起见，不旋转
                .font('Impact')
                .fontSize(function(d) { return d.size; })
                .spiral('archimedean') // 使用“阿基米德”螺旋以获得更好的布局
                .random(() => 0.5) // 保持布局的一致性
                .on('end', draw);

            layout.start();

            function draw(words) {
                // 移除现有的 SVG
                d3.select('#word-cloud-svg').remove();

                // 创建一个响应式的 SVG
                const svg = d3.select('#word-cloud').append('svg')
                    .attr('id', 'word-cloud-svg')
                    .attr('width', width)
                    .attr('height', height)
                    .attr('viewBox', `0 0 ${width} ${height}`)
                    .attr('preserveAspectRatio', 'xMidYMid meet');

                const g = svg.append('g')
                    .attr('transform', `translate(${margin.left + svgWidth / 2},${margin.top + svgHeight / 2})`);

                // 绘制词语
                g.selectAll('text')
                    .data(words)
                    .enter().append('text')
                    .style('font-size', d => `${d.size}px`)
                    .style('font-family', 'Impact')
                    .style('fill', '#666') // 设置为灰色
                    .attr('text-anchor', 'middle')
                    .attr('transform', d => `translate(${d.x},${d.y}) rotate(${d.rotate})`)
                    .text(d => d.text)
                    .style('-webkit-user-select', 'none')
                    .style('-ms-user-select', 'none')
                    .style('pointer-events', 'none'); // 防止事件触发；

                // 计算词语的边界框
                const bbox = g.node().getBBox();

                // 计算缩放因子以适应容器
                const scale = Math.min(
                    (svgWidth - 10) / bbox.width,  // 10px 的内边距
                    (svgHeight - 10) / bbox.height
                );

                // 如果需要，应用缩放
                if (scale < 1) {
                    g.attr('transform', `translate(${margin.left + svgWidth / 2},${margin.top + svgHeight / 2}) scale(${scale})`);
                }

                // 添加 "more>>>" 链接
                svg.append('text')
                    .attr('id', 'more-link')
                    .text('more>>>')
                    .style('font-size', '10px')
                    .attr('text-anchor', 'end')
                    .attr('x', width - 5) // 距右边框 5px
                    .attr('y', height - 5) // 距下边框 5px
                    .style('cursor', 'pointer')
                    .on('click', function() {
                        window.location.href = 'page2.html';
                    });
            }
        }

        const categoryLinesRight = d3.selectAll('.category-line-right'); // 修改为实际的选择器

        // 检查是否选择到元素
        categoryLinesRight.on("mousemove", function(event, d) {
            const mouseX = d3.pointer(event)[0];
            const yearScale = xScaleRight.invert(mouseX);
            const closestYear = Math.round(yearScale);
            const yearData = d.values.find(v => v.year === closestYear);
            if (yearData) {
                tooltipRight.transition().duration(200).style("opacity", 0.9);
                tooltipRight.html(
                    `<strong>类别:</strong> ${d.category}<br/>
                    <strong>年份:</strong> ${yearData.year}<br/>
                    <strong>数量:</strong> ${yearData.count}`
                )
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 28) + "px");
            }
        })
        .on("mouseout", function() {
            tooltipRight.transition().duration(500).style("opacity", 0);
        });

    } else {
        console.error('leftChartDispatch not defined');
    }
})();