(function () {
  // 设置图表的尺寸和边距
  const margin = { top: 20, right: 20, bottom: 50, left: 40 };
  const container = document.getElementById('yearly-totals-chart-container');
  const width = container.clientWidth - margin.left - margin.right;
  const barChartHeight = 100; // 固定柱状图高度为100px
  const lineChartHeight = container.clientHeight - barChartHeight - margin.top - margin.bottom - 70; // 调整折线图高度
  const totalHeight = lineChartHeight + barChartHeight + margin.top + margin.bottom + 50;

  // 创建SVG画布
  const svg = d3.select("#yearly-totals-chart-container")
    .append("svg")
    .attr("id", "yearly-totals-chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", totalHeight)
    .append("g")
    .attr("transform", `translate(${margin.left - 20},${margin.top+20})`);
  
  svg.append("text")
    .attr("x", width / 2)
    .attr("y",-20) // 根据需要调整标题的垂直位置
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("筛选面板");

  // 创建提示框
  const tooltip = d3.select("#yearly-totals-chart-container")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background-color", "rgba(0,0,0,0.7)")
    .style("color", "#fff")
    .style("padding", "6px 8px")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("visibility", "hidden")
    .style("pointer-events", "none");

  // 定义自定义事件调度器
  const dispatch = d3.dispatch('squareClicked', 'yearRangeChanged', 'categoriesChanged',"categorySelected");
  // 暴露到全局
  window.leftChartDispatch = dispatch;

  // 变量来保存选定的年份和类别
  let selectedYears = [];
  let selectedCategories = window.selectedCategoriesRight ? window.selectedCategoriesRight.slice() : [];

  // 加载并绘制折线图
  Promise.all([
    d3.json('arxiv_cs_data/yearly_totals.json'),
    d3.json('arxiv_cs_data/processed_data.json')
  ]).then(([data, processedData]) => {
    data.forEach(d => {
      d.year = +d.year;
      d.total_count = +d.total_count;
    });

    const allYears = [...new Set(data.map(d => d.year))].sort((a, b) => a - b);
    const minYear = d3.min(allYears);
    const maxYear = d3.max(allYears);
    let year_start = minYear;
    let year_end = maxYear;

    const xScale = d3.scaleLinear()
      .domain([minYear, maxYear])
      .range([0, width]);

    const yMax = d3.max(data, d => d.total_count);
    const yScale = d3.scaleLinear()
      .domain([0, yMax * 1.1])
      .range([lineChartHeight, 0]);

    const line = d3.line()
      .x(d => xScale(d.year))
      .y(d => yScale(d.total_count))
      .curve(d3.curveMonotoneX);

    // 绘制整条线
    svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#1f77b4")
      .attr("stroke-width", 2)
      .attr("opacity", 0.3)
      .attr("d", line);

    // 初始选定范围
    let selectedStartYear = minYear;
    let selectedEndYear = maxYear;
    let selectedData = data.filter(d => d.year >= selectedStartYear && d.year <= selectedEndYear);

    // 绘制选定范围内的线
    const pathSelected = svg.append("path")
      .datum(selectedData)
      .attr("fill", "none")
      .attr("stroke", "#1f77b4")
      .attr("stroke-width", 2)
      .attr("d", line);

    // X轴
    const tickValues = [1990, 2000, 2014, 2024];
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d3.format("d"))
      .tickValues(tickValues);

    svg.append("g")
      .attr("transform", `translate(0,${lineChartHeight})`)
      .attr("class", "x-axis")
      .call(xAxis)
      .style('-webkit-user-select', 'none')
        .style('-ms-user-select', 'none')
        .style('pointer-events', 'none'); // 防止事件触发

    // 拖拽
    const drag = d3.drag().on("drag", dragged);
    const dragAreaWidth = 5;

    let startX = xScale(selectedStartYear);
    let endX = xScale(selectedEndYear);

    const dragAreaStart = svg.append("rect")
      .attr("class", "drag-area start")
      .attr("x", startX - dragAreaWidth / 2)
      .attr("y", 0)
      .attr("width", dragAreaWidth)
      .attr("height", lineChartHeight)
      .style("fill", "transparent")
      .style("cursor", "ew-resize")
      .call(drag);


    const dragAreaEnd = svg.append("rect")
      .attr("class", "drag-area end")
      .attr("x", endX - dragAreaWidth / 2)
      .attr("y", 0)
      .attr("width", dragAreaWidth)
      .attr("height", lineChartHeight)
      .style("fill", "transparent")
      .style("cursor", "ew-resize")
      .call(drag);


// 在矩形上方添加左侧的小圆圈
const circleStart = svg.append("circle")
  .attr("class", "drag-circle start")
  .attr("cx", startX)  // 圆心x坐标与矩形的x坐标一致
  .attr("cy", -5)  // 向上偏移5px
  .attr("r", 5)  // 圆的半径
  .style("fill", "#ffe4c4")  // 圆的填充颜色
  .style("stroke", "#888")  // 灰色边框
  .style("stroke-width", 2)  // 边框宽度为2px
  .style("cursor", "pointer")  // 鼠标悬停时的光标样式
  .call(drag);

// 在矩形上方添加右侧的圆圈
const circleEnd = svg.append("circle")
  .attr("class", "drag-circle end")
  .attr("cx", endX)  // 圆心x坐标与矩形的x坐标一致
  .attr("cy", -5)  // 向上偏移5px
  .attr("r", 5)  // 圆的半径
  .style("fill", "#ffe4c4")  // 圆的填充颜色
  .style("stroke", "#888")  // 灰色边框
  .style("stroke-width", 2)  // 边框宽度为2px
  .style("cursor", "pointer")  // 鼠标悬停时的光标样式
  .call(drag);

      

    const brushStart = svg.append("line")
      .attr("x1", startX)
      .attr("y1", 0)
      .attr("x2", startX)
      .attr("y2", lineChartHeight)
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2);

    const brushEnd = svg.append("line")
      .attr("x1", endX)
      .attr("y1", 0)
      .attr("x2", endX)
      .attr("y2", lineChartHeight)
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2);

    // 获取所有类别，定义颜色比例尺
    const categories = processedData.map(d => d.category);
    const colorScale = d3.scaleOrdinal(d3.schemeSet2)
      .domain(categories);

    // 创建柱状图容器，调整位置上移
    const barChartYStart = lineChartHeight + margin.bottom + 10; // 上移柱状图
    const barSvg = svg.append("g")
      .attr("transform", `translate(0,${barChartYStart})`);

    const barXScale = d3.scaleBand()
      .range([0, width])
      .padding(0.2); // 使用稍大的间距，使柱形稍细

    const barYScale = d3.scaleLinear()
      .range([barChartHeight, 0]);

    // 更新柱状图
    updateBarChart(selectedStartYear, selectedEndYear, processedData);

    // 拖拽事件处理函数
function dragged(event) {
  const x = Math.max(0, Math.min(width, event.x));
  const thisElement = d3.select(this);

  if (thisElement.classed('start')) {
    startX = x;
    brushStart.attr("x1", startX).attr("x2", startX);
    dragAreaStart.attr('x', startX - dragAreaWidth / 2);
    circleStart.attr('cx', startX);  // 同步更新圆的位置
  } else if (thisElement.classed('end')) {
    endX = x;
    brushEnd.attr("x1", endX).attr("x2", endX);
    dragAreaEnd.attr('x', endX - dragAreaWidth / 2);
    circleEnd.attr('cx', endX);  // 同步更新圆的位置
  }

  let minX = Math.min(startX, endX);
  let maxX = Math.max(startX, endX);
  selectedStartYear = Math.round(xScale.invert(minX));
  selectedEndYear = Math.round(xScale.invert(maxX));

  selectedStartYear = Math.max(minYear, selectedStartYear);
  selectedEndYear = Math.min(maxYear, selectedEndYear);

  selectedData = data.filter(d => d.year >= selectedStartYear && d.year <= selectedEndYear);
  pathSelected.datum(selectedData).attr("d", line);

  selectedYears = allYears.filter(y => y >= selectedStartYear && y <= selectedEndYear);
  dispatch.call("yearRangeChanged", null, [selectedStartYear, selectedEndYear]);

  // 更新输入框的值
  d3.select('#startYearInput').property('value', selectedStartYear);
  d3.select('#endYearInput').property('value', selectedEndYear);

  // 更新柱状图
  updateBarChart(selectedStartYear, selectedEndYear, processedData);
}

    // 添加显示年份范围的输入框
    svg.append('foreignObject')
      .attr('x', 0)
      .attr('y', lineChartHeight + margin.bottom - 20)
      .attr('width', width)
      .attr('height', 30)
      .append('xhtml:div')
      .style('text-align', 'center')
      .html(`
        <input type="text" id="startYearInput" value="${selectedStartYear}" style="width: 80px; height: 20px; border: none; text-align: right;"/> 
        <span style="margin: 0 5px;">-</span>
        <input type="text" id="endYearInput" value="${selectedEndYear}" style="width: 80px; height: 20px; border: none; text-align: left;"/>
      `);

    
// 监听起始年份输入框变化
d3.select('#startYearInput').on('change', function () {
  const input = this.value.trim();
  const year = +input;
  if (!isNaN(year) && year >= minYear && year < selectedEndYear) {
    selectedStartYear = year;
    startX = xScale(selectedStartYear);
    
    // 更新矩形位置
    brushStart.attr("x1", startX).attr("x2", startX);
    dragAreaStart.attr('x', startX - dragAreaWidth / 2);
    
    // 更新圆的位置
    circleStart.attr("cx", startX);
    
    selectedData = data.filter(d => d.year >= selectedStartYear && d.year <= selectedEndYear);
    pathSelected.datum(selectedData).attr("d", line);
    selectedYears = allYears.filter(y => y >= selectedStartYear && y <= selectedEndYear);
    dispatch.call("yearRangeChanged", null, [selectedStartYear, selectedEndYear]);

    // 更新柱状图
    updateBarChart(selectedStartYear, selectedEndYear, processedData);
  } else {
    // 输入不合法，恢复原值
    d3.select('#startYearInput').property('value', selectedStartYear);
  }
});

// 监听终止年份输入框变化
d3.select('#endYearInput').on('change', function () {
  const input = this.value.trim();
  const year = +input;
  if (!isNaN(year) && year > selectedStartYear && year <= maxYear) {
    selectedEndYear = year;
    endX = xScale(selectedEndYear);
    
    // 更新矩形位置
    brushEnd.attr("x1", endX).attr("x2", endX);
    dragAreaEnd.attr('x', endX - dragAreaWidth / 2);
    
    // 更新圆的位置
    circleEnd.attr("cx", endX);
    
    selectedData = data.filter(d => d.year >= selectedStartYear && d.year <= selectedEndYear);
    pathSelected.datum(selectedData).attr("d", line);
    selectedYears = allYears.filter(y => y >= selectedStartYear && y <= selectedEndYear);
    dispatch.call("yearRangeChanged", null, [selectedStartYear, selectedEndYear]);

    // 更新柱状图
    updateBarChart(selectedStartYear, selectedEndYear, processedData);
  } else {
    // 输入不合法，恢复原值
    d3.select('#endYearInput').property('value', selectedEndYear);
  }
});
barSvg.append("text")
.attr("x", width / 2)
.attr("y", 20) // 根据需要调整标题的垂直位置
.attr("text-anchor", "middle")
.style("font-size", "16px")
.style("font-weight", "bold")
.text("论文数量top7");
    function updateBarChart(startYear, endYear, data) {
      // 计算每个类别在选定年份范围内的总数
      const categoryCounts = data.map(category => {
        const total = category.values
          .filter(d => d.year >= startYear && d.year <= endYear)
          .reduce((sum, d) => sum + d.count, 0);
        return { category: category.category, count: total };
      });

      // 排序并取前七
      const topCategories = categoryCounts.sort((a, b) => b.count - a.count).slice(0, 7);

      // 更新尺度
      barXScale.domain(topCategories.map(d => d.category));
      barYScale.domain([0, d3.max(topCategories, d => d.count) * 1.1]);

      // 首先移除之前的柱形和标签
      barSvg.selectAll(".bar-group").remove();
      
  // 添加标题
  

      // 创建一个分组，将柱形和对应的标签一起放入
      const barGroups = barSvg.selectAll(".bar-group")
        .data(topCategories, d => d.category)
        .enter()
        .append("g")
        .attr("class", "bar-group")
        .attr("transform", d => `translate(${barXScale(d.category)},0)`);

      // 添加柱形
      const bars = barGroups.append("rect")
        .attr("class", "bar")
        .attr("x", barXScale.bandwidth() * 0.15)
        .attr("y", d => barYScale(d.count)) // 初始位置
        .attr("width", barXScale.bandwidth() * 0.7)
        .attr("height", d => barChartHeight - barYScale(d.count)) // 初始高度
        .attr("rx", (barXScale.bandwidth() * 0.7) / 4)
        .attr("ry", (barXScale.bandwidth() * 0.7) / 4)
        .attr("fill", d => colorScale(d.category))
        .style("opacity", 0); // 初始透明度为0

      // 过渡动画，使柱形从透明变为不透明
      bars.transition()
        .duration(500)
        .style("opacity", 1);

      // 在过渡结束后绑定事件处理程序
      bars.on("mouseover", (event, d) => {
          // 显示提示框
          tooltip.style("visibility", "visible")
            .text(`${d.category.replace('cs.', '')}: ${d.count}`);
        })
        .on("mousemove", (event) => {
          // 更新提示框位置
          tooltip.style("top", (event.pageY - 10) + "px")
            .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", () => {
          // 隐藏提示框
          tooltip.style("visibility", "hidden");
        });

      //    加文本标签
      barGroups.append("text")
        .attr("class", "bar-label")
        .attr("x", barXScale.bandwidth() / 2)
        .attr("y", barChartHeight + 15) // 调整以将标签放在柱形下方
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("fill", "#333")
        .style("pointer-events", "none") // 防止文本阻挡鼠标事件
        .style('user-select', 'none')
        .style('-webkit-user-select', 'none')
        .style('-ms-user-select', 'none')
        
        
        .text(d => d.category.replace('cs.', ''))
        .each(function (d) {
          // 如果标签超出柱形宽度，进行截断
          const self = d3.select(this);
          let text = self.text();
          let textLength = self.node().getComputedTextLength();
          const maxWidth = barXScale.bandwidth();
          while (textLength > maxWidth && text.length > 0) {
            text = text.slice(0, -1);
            self.text(text + '…');
            textLength = self.node().getComputedTextLength();
          }
        });
    }
  })
    .catch(error => {
      console.error("加载数据时出错:", error);
      d3.select("#yearly-totals-chart-container").append("p")
        .text(`加载数据时出错: ${error.message}`)
        .style("color", "red");
    });
})();
