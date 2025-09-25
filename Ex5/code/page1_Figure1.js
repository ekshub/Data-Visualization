// 定义右侧图表的范围和尺寸
const marginRight = { top: 50, right: 0, bottom: 40, left: 70 };
const svgWidthRight = 350;
const svgHeightRight = 300;
const widthRight = svgWidthRight - marginRight.left - marginRight.right;
const heightRight = svgHeightRight - marginRight.top - marginRight.bottom;

// 暴露选择的类别到全局
window.selectedCategoriesRight = [];

const svgRight = d3.select("#chart")
  .attr("width", svgWidthRight)
  .attr("height", svgHeightRight)
  .append("g")
  .attr("transform", `translate(${marginRight.left},${marginRight.top})`);

const tooltipRight = d3.select("#tooltip");
let currentModeRight = 1;

// 定义类别的全称
const categoryFullNames = {
  "cs.AI": "人工智能",
  "cs.AR": "硬件架构",
  "cs.CC": "计算复杂性",
  "cs.CE": "计算工程、金融与科学",
  "cs.CG": "计算几何",
  "cs.CL": "计算与语言",
  "cs.CR": "密码学与安全",
  "cs.CV": "计算机视觉与模式识别",
  "cs.CY": "计算机与社会",
  "cs.DB": "数据库",
  "cs.DC": "分布式、并行与集群计算",
  "cs.DL": "数字图书馆",
  "cs.DM": "离散数学",
  "cs.DS": "数据结构与算法",
  "cs.ET": "新兴技术",
  "cs.FL": "形式语言与自动机理论",
  "cs.GL": "通用文献",
  "cs.GR": "图形学",
  "cs.GT": "博弈论",
  "cs.HC": "人机交互",
  "cs.IR": "信息检索",
  "cs.IT": "信息论",
  "cs.LG": "机器学习",
  "cs.LO": "计算机科学中的逻辑",
  "cs.MA": "多智能体系统",
  "cs.MM": "多媒体",
  "cs.MS": "数学软件",
  "cs.NA": "数值分析",
  "cs.NE": "神经与进化计算",
  "cs.NI": "网络与互联网架构",
  "cs.OH": "其他计算机科学",
  "cs.OS": "操作系统",
  "cs.PF": "性能",
  "cs.PL": "编程语言",
  "cs.RO": "机器人学",
  "cs.SC": "符号计算",
  "cs.SD": "声音",
  "cs.SE": "软件工程",
  "cs.SI": "社会与信息网络",
  "cs.SY": "系统与控制"
};

d3.json("arxiv_cs_data/processed_data.json").then(function(data) {
  const categories = data.map(d => d.category);
  const allYears = Array.from(new Set(data.flatMap(d => d.values.map(v => v.year)))).sort((a, b) => a - b);

  data.forEach(function(d) {
    const yearSet = new Set(d.values.map(v => v.year));
    allYears.forEach(function(year) {
      if (!yearSet.has(year)) {
        d.values.push({ year: year, count: 0 });
      }
    });
    d.values.sort((a, b) => a.year - b.year);
  });

  // 初始时将所有类别添加到 selectedCategoriesRight
  window.selectedCategoriesRight = categories.slice();

  let xScaleRight = d3.scaleLinear()
    .domain(d3.extent(allYears))
    .range([0, widthRight]);

  const yMaxRight = d3.max(data, d => d3.max(d.values, v => v.count));
  let yScaleRight = d3.scaleLinear()
    .domain([0, yMaxRight])
    .range([heightRight, 0])
    .nice();

  const colorScaleRight = d3.scaleOrdinal()
    .domain(categories)
    .range(d3.schemeSet2);

  const lineRight = d3.line()
    .x(d => xScaleRight(d.year))
    .y(d => yScaleRight(d.count))
    .curve(d3.curveMonotoneX);

  const linesGroupRight = svgRight.append("g").attr("class", "lines");

  const categoryLinesRight = linesGroupRight.selectAll(".line-group")
    .data(data)
    .enter()
    .append("g")
    .attr("class", "line-group");

  categoryLinesRight.append("path")
    .attr("class", "line")
    .attr("d", d => lineRight(d.values))
    .attr("stroke", d => colorScaleRight(d.category))
    .attr("fill", "none")
    .attr("stroke-width", 2)
    .style("opacity", d => window.selectedCategoriesRight.includes(d.category) ? 1 : 0);

  const xAxisRight = svgRight.append("g")
    .attr("transform", `translate(0,${heightRight})`)
    .call(d3.axisBottom(xScaleRight).tickFormat(d3.format("d")).ticks(5));

  const yAxisRight = svgRight.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(yScaleRight));

  // 添加图表标题
  svgRight.append("text")
    .attr("class", "chart-title")
    .attr("x", widthRight / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("论文数量变化趋势");

  // 添加坐标轴标签
  svgRight.append("text")
    .attr("class", "x axis-label")
    .attr("x", widthRight / 2)
    .attr("y", heightRight + marginRight.bottom - 10)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("年份");

  svgRight.append("text")
    .attr("class", "y axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -heightRight / 2)
    .attr("y", -marginRight.left + 15)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("论文数量");

  // 分割图例数据
  const halfwayIndex = Math.ceil(data.length / 2);
  const leftData = data.slice(0, halfwayIndex);
  const rightData = data.slice(halfwayIndex);

  // 选取左右图例容器
  const legendContainerLeft = d3.select("#left-legend");
  const legendContainerRight = d3.select("#right-legend");

  data.forEach(d => (d.active = true));
  let selectedYearRange = [d3.min(allYears), d3.max(allYears)];

  // 通用绘制图例函数
  function createLegendItems(container, legendData) {
    const legendItems = container.selectAll(".legend-item")
      .data(legendData)
      .enter()
      .append("div")
      .attr("class", "legend-item")
      .on("click", function(event, d) {
        d.active = !d.active;
        d3.select(this).select(".legend-color").style("opacity", d.active ? 1 : 0.3);
        updateSelectedCategories();
        updateChart();
      })
      .on("mouseover", function(event, d) {
        tooltipRight.transition().duration(200).style("opacity", 0.9);
        tooltipRight.html(`<strong>全称:</strong> ${categoryFullNames[d.category]}`)
          .style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        tooltipRight.transition().duration(500).style("opacity", 0);
      });

    legendItems.append("div")
      .attr("class", "legend-color")
      .style("background-color", d => colorScaleRight(d.category));

    legendItems.append("div")
      .text(d => d.category.replace("cs.", ""));
  }

  // 调用函数绘制左右图例
  createLegendItems(legendContainerLeft, leftData);
  createLegendItems(legendContainerRight, rightData);

  const showAllCheckboxRight = d3.select("#showAll");
  showAllCheckboxRight.on("change", function() {
    currentModeRight = this.checked ? 1 : 2;
    if (currentModeRight === 1) {
      data.forEach(d => (d.active = true));
    } else {
      data.forEach(d => (d.active = false));
    }
    updateSelectedCategories();
    updateChart();
  });

  window.leftChartDispatch.on("yearRangeChanged.rightChart", function(yearRange) {
    selectedYearRange = yearRange;
    updateChart();
  });
  
  function updateSelectedCategories() {
    window.selectedCategoriesRight = data.filter(d => d.active).map(d => d.category);
  }

  function updateChart() {
    categoryLinesRight.select(".line").attr("d", null);

    const [selectedStartYear, selectedEndYear] = selectedYearRange;
    const activeData = data.filter(d => window.selectedCategoriesRight.includes(d.category));
    const allFilteredValues = activeData.flatMap(d =>
      d.values.filter(v => v.year >= selectedStartYear && v.year <= selectedEndYear)
    );
    const yMaxForRange = d3.max(allFilteredValues, v => v.count) || 0;

    xScaleRight.domain([selectedStartYear, selectedEndYear]);
    yScaleRight.domain([0, yMaxForRange]).nice();

    xAxisRight
      .transition()
      .duration(500)
      .call(d3.axisBottom(xScaleRight).tickFormat(d3.format("d")).ticks(5));

    yAxisRight
      .transition()
      .duration(500)
      .call(d3.axisLeft(yScaleRight));

    categoryLinesRight.select(".line")
      .transition()
      .duration(0)
      .attr("d", function(d) {
        if (!window.selectedCategoriesRight.includes(d.category)) return null;
        const filteredValues = d.values.filter(
          v => v.year >= selectedStartYear && v.year <= selectedEndYear
        );
        return lineRight(filteredValues);
      })
      .style("opacity", d => (window.selectedCategoriesRight.includes(d.category) ? 1 : 0))
      .end()
      .then(() => {
        categoryLinesRight.each(function(d) {
          if (!window.selectedCategoriesRight.includes(d.category)) return;
          const path = d3.select(this).select(".line");
          const totalLength = path.node().getTotalLength() || 0;
          path
            .attr("stroke-dasharray", `${totalLength},${totalLength}`)
            .attr("stroke-dashoffset", totalLength)
            .transition()
            .duration(1000)
            .ease(d3.easeLinear)
            .attr("stroke-dashoffset", 0);
        });
      });
  }

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
  
  // 初始绘制图表
  updateChart();

}).catch(function(error) {
  console.error("加载数据时出错:", error);
  d3.select("body").append("p")
    .text("加载数据时出错，请检查数据文件路径和格式。")
    .style("color", "red");
});