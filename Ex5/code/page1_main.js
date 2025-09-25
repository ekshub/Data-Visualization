// 修改后的 page4_main.js
window.loadRelationChart = function() {(function() {
    if (typeof d3 === 'undefined') {
        console.error('D3.js 未加载。');
        return;
    }

    const container = document.getElementById('ball-animation-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    const svg = d3.select('#ball-animation-container')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    const color = d3.scaleOrdinal(d3.schemeSet2);

    const areaScale = d3.scaleLinear()
        .range([100, 2500]); // 100 ~ 2500

    let selectedYears = window.selectedYears && window.selectedYears.length === 2 ? window.selectedYears.slice() : [1997, 2024];

    function roundToOneSignificantDigit(num) {
        if (num === 0) return 0;
        const d = Math.floor(Math.log10(Math.abs(num)));
        const factor = Math.pow(10, d);
        return Math.round(num / factor) * factor;
    }

    Promise.all([
        d3.json('arxiv_cs_data/correlation.json'),
        d3.json('arxiv_cs_data/processed_data.json')
    ]).then(([correlationData, processedData]) => {
        const allYearsSet = new Set();
        processedData.forEach(category => {
            category.values.forEach(yearData => {
                allYearsSet.add(yearData.year);
            });
        });
        const allYears = Array.from(allYearsSet).sort();
        if (!selectedYears || selectedYears.length !== 2) {
            selectedYears = [d3.min(allYears), d3.max(allYears)];
        }

        const nodesSet = new Set();
        correlationData.forEach(d => {
            nodesSet.add(d.source);
            nodesSet.add(d.target);
        });
        const nodes = Array.from(nodesSet).map(name => ({
            id: name,
            count: 0
        }));
        const allLinks = correlationData
            .filter(d => d.value !== 0) // 过滤掉相关度为 0 的连线
            .map(d => ({
                source: d.source,
                target: d.target,
                value: d.value
            }));

        let categoryCounts = calculateCategoryCounts();
        updateAreaScaleDomain();

        nodes.forEach(node => {
            node.count = categoryCounts[node.id] || 0;
        });

        let mainNodes = [];
        let currentLinks = [];

        const linkWidthScale = d3.scaleLinear()
            .domain(d3.extent(allLinks, d => d.value))
            .range([1, 8]); // 修改最大宽度为 8

        const linkColorScale = d3.scaleLinear()
            .domain(d3.extent(allLinks, d => d.value))
            .range(['#ccc', '#000']);

        const linkGroup = svg.append('g')
            .attr('class', 'links');

        const nodeGroup = svg.append('g')
            .attr('class', 'nodes');

        const labelGroup = svg.append('g')
            .attr('class', 'labels');

        let link = linkGroup.selectAll('line')
            .data(currentLinks)
            .enter()
            .append('line')
            .attr('class', 'link')
            .attr('stroke-width', d => linkWidthScale(d.value))
            .attr('stroke', d => linkColorScale(d.value));

        let node = nodeGroup.selectAll('circle')
            .data(nodes)
            .enter()
            .append('circle')
            .attr('class', 'node')
            .attr('r', d => Math.sqrt(areaScale(d.count)))
            .attr('fill', d => color(d.id))
            .on('click', nodeClicked)
            .call(d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended));

        let label = labelGroup.selectAll('text')
            .data(nodes)
            .enter()
            .append('text')
            .attr('class', 'label')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .attr('fill', '#fff')
            .text(d => d.id.replace('cs.', ''))
            .style('user-select', 'none')
            .style('-webkit-user-select', 'none')
            .style('-ms-user-select', 'none')
            .style('pointer-events', 'none');

        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(currentLinks).id(d => d.id).distance(200))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(d => Math.sqrt(areaScale(d.count))))
            .on('tick', ticked);

        function ticked() {
            node.each(d => {
                const r = Math.sqrt(areaScale(d.count));
                d.x = Math.max(r, Math.min(width - r, d.x));
                d.y = Math.max(r, Math.min(height - r, d.y));
            });

            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            node
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);

            label
                .attr('x', d => d.x)
                .attr('y', d => d.y);
        }

        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

        function nodeClicked(event, clickedNode) {
            const index = mainNodes.indexOf(clickedNode);
            if (index !== -1) {
                mainNodes.splice(index, 1);
                clickedNode.fx = null;
                clickedNode.fy = null;
                currentLinks = currentLinks.filter(d => {
                    if (linkIncludesNode(d, clickedNode.id)) {
                        const otherNodeId = d.source.id === clickedNode.id ? d.target.id : d.source.id;
                        return isMainNode(otherNodeId);
                    }
                    return true;
                });
                updateLinks();
                positionMainNodes();
            } else {
                mainNodes.push(clickedNode);
                const newNodeLinks = allLinks.filter(d => {
                    if (linkIncludesNode(d, clickedNode.id)) {
                        const otherNodeId = d.source === clickedNode.id ? d.target : d.source.id;
                        return isMainNode(otherNodeId) || !mainNodes.includes(getNodeById(otherNodeId));
                    }
                    return false;
                });
                currentLinks = currentLinks.concat(newNodeLinks);
                updateLinks();
                positionMainNodes();
            }
            simulation.alpha(1).restart();
        }

        function isMainNode(nodeId) {
            return mainNodes.some(node => node.id === nodeId);
        }

        function getNodeById(nodeId) {
            return nodes.find(node => node.id === nodeId);
        }

        function linkIncludesNode(link, nodeId) {
            return (link.source.id === nodeId || link.target.id === nodeId) ||
                   (link.source === nodeId || link.target === nodeId);
        }

        function updateLinks() {
            simulation.force('link').links(currentLinks);
            link = linkGroup.selectAll('line')
                .data(currentLinks, d => {
                    const nodeIds = [d.source.id || d.source, d.target.id || d.target];
                    nodeIds.sort();
                    return nodeIds.join('-');
                });
            link.exit().remove();
            const linkEnter = link.enter().append('line')
                .attr('class', 'link')
                .attr('stroke-width', d => linkWidthScale(d.value))
                .attr('stroke', d => linkColorScale(d.value));
            link = linkEnter.merge(link);
        }

        function calculateCategoryCounts() {
            const counts = {};
            processedData.forEach(category => {
                const total = category.values.reduce((sum, yearData) => {
                    if (yearData.year >= selectedYears[0] && yearData.year <= selectedYears[1]) {
                        return sum + yearData.count;
                    }
                    return sum;
                }, 0);
                counts[category.category] = total;
            });
            return counts;
        }

        function updateAreaScaleDomain() {
            const counts = Object.values(categoryCounts);
            if (counts.length > 0) {
                areaScale.domain([d3.min(counts), d3.max(counts)]);
            } else {
                areaScale.domain([0, 1]);
            }
        }

        function positionMainNodes() {
            const centerX = width / 2;
            const centerY = height / 2;
            const r = Math.min(width, height) / 4;
            const N = mainNodes.length;

            if (N === 1) {
                const node = mainNodes[0];
                node.fx = centerX;
                node.fy = centerY;
            } else {
                for (let i = 0; i < N; i++) {
                    const angle = i * (2 * Math.PI / N);
                    const x = centerX + r * Math.cos(angle);
                    const y = centerY + r * Math.sin(angle);
                    mainNodes[i].fx = x;
                    mainNodes[i].fy = y;
                }
            }
        }

        function updateCategoryCountsAndNodeSizes() {
            categoryCounts = calculateCategoryCounts();
            updateAreaScaleDomain();
            nodes.forEach(node => {
                node.count = categoryCounts[node.id] || 0;
            });
            node.transition()
                .duration(500)
                .attr('r', d => Math.sqrt(areaScale(d.count)));
            simulation.force('collision').radius(d => Math.sqrt(areaScale(d.count)));
            simulation.alpha(1).restart();
            updateLegend();
        }

        function addLegend() {
            const values = Object.values(categoryCounts);
            const minValue = values.length ? d3.min(values) : 0;
            const maxValue = values.length ? d3.max(values) : 1;
            const rMin = Math.sqrt(areaScale(minValue));
            const rMax = Math.sqrt(areaScale(maxValue));

            const legend = svg.append('g')
                .attr('class', 'legend')
                .attr('transform', `translate(${width - 100},${height - 160})`);

            legend.append('text')
                .attr('class', 'legend-title')
                .attr('x', 0)
                .attr('y', 0)
                .text('论文数量')
                .attr('font-size', '14px')
                .attr('fill', '#000')
                .attr('text-anchor', 'start');

            // 第一个圆及文字
            const circleGroup1 = legend.append('g')
                .attr('transform', `translate(0, 30)`);

            circleGroup1.append('circle')
                .attr('cx', 0)
                .attr('cy', 0)
                .attr('r', rMin)
                .attr('fill', 'none')
                .attr('stroke', '#000')
                .attr('stroke-width', 1);

            circleGroup1.append('text')
                .attr('x', rMin + 8)
                .attr('y', 3)
                .text(minValue)
                .attr('font-size', '12px');

            // 第二个圆及文字，向下迁移更多
            const circleGroup2 = legend.append('g')
                .attr('transform', `translate(0, 100)`); // 原先为80，改为100

            circleGroup2.append('circle')
                .attr('cx', 0)
                .attr('cy', 0)
                .attr('r', rMax)
                .attr('fill', 'none')
                .attr('stroke', '#000')
                .attr('stroke-width', 1);

            circleGroup2.append('text')
                .attr('x', rMax + 8)
                .attr('y', 3)
                .text(maxValue)
                .attr('font-size', '12px');
        }

        function updateLegend() {
            const legend = svg.select('.legend');
            const values = Object.values(categoryCounts);
            const minValue = values.length ? d3.min(values) : 0;
            const maxValue = values.length ? d3.max(values) : 1;
            const rMin = Math.sqrt(areaScale(minValue));
            const rMax = Math.sqrt(areaScale(maxValue));

            if (legend.empty()) {
                addLegend();
            } else {
                legend.select('.legend-title')
                    .text('论文数量');

                // 更新第一个圆与文字
                legend.selectAll('.legend g:nth-child(2) circle')
                    .attr('r', rMin);
                legend.selectAll('.legend g:nth-child(2) text')
                    .attr('x', rMin + 8)
                    .text(minValue);

                // 更新第二个圆与文字
                legend.selectAll('.legend g:nth-child(3) circle')
                    .attr('r', rMax);
                legend.selectAll('.legend g:nth-child(3) text')
                    .attr('x', rMax + 8)
                    .text(maxValue);
            }
        }

        function addLinkWidthLegend() {
            const [minLinkValue, maxLinkValue] = d3.extent(allLinks, d => d.value);
            const lineMinWidth = linkWidthScale(minLinkValue);
            const lineMaxWidth = linkWidthScale(maxLinkValue);

            // 在容器左侧底部放置连线图例
            const linkLegend = svg.append('g')
                .attr('class', 'link-legend')
                .attr('transform', `translate(20,${height - 100})`); // 坐标可根据需要微调

            linkLegend.append('text')
                .attr('class', 'link-legend-title')
                .attr('x', 0)
                .attr('y', 0)
                .text('相关度')
                .attr('font-size', '14px')
                .attr('fill', '#000')
                .attr('text-anchor', 'start');

            // 最小线宽示例
            const lineGroup1 = linkLegend.append('g')
                .attr('transform', `translate(0, 25)`);

            lineGroup1.append('line')
                .attr('x1', 0).attr('y1', 0)
                .attr('x2', 40).attr('y2', 0)
                .attr('stroke', '#666') // 使用灰色线
                .attr('stroke-width', lineMinWidth);

            lineGroup1.append('text')
                .attr('x', 45)
                .attr('y', 4)
                .attr('font-size', '12px')
                .text(minLinkValue.toFixed(2));

            // 最大线宽示例
            const lineGroup2 = linkLegend.append('g')
                .attr('transform', `translate(0, 60)`);

            lineGroup2.append('line')
                .attr('x1', 0).attr('y1', 0)
                .attr('x2', 40).attr('y2', 0)
                .attr('stroke', '#666') // 使用灰色线
                .attr('stroke-width', lineMaxWidth);

            lineGroup2.append('text')
                .attr('x', 45)
                .attr('y', 4)
                .attr('font-size', '12px')
                .text(maxLinkValue.toFixed(2));
        }

        addLegend();
        addLinkWidthLegend();

        window.leftChartDispatch.on('yearRangeChanged.mainChart', function(newSelectedYears) {
            if (newSelectedYears.length === 2) {
                selectedYears = newSelectedYears.slice();
                updateCategoryCountsAndNodeSizes();
            }
        });

        window.leftChartDispatch.on('categoriesChanged.mainChart', function(newSelectedCategories) {
            // 自行添加逻辑
        });

    }).catch(error => {
        console.error('加载数据时出错:', error);
    });
})();
};