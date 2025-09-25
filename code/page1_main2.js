window.loadOverviewChart = function() {
  // 读取数据并在回调中执行图表绘制
  d3.json("arxiv_cs_data/processed_data.json").then(function(processedData) {
    // 1. 构建category-year对应count的字典
    const catYearCount = {};
    let maxCount = 0;
    processedData.forEach(catObj => {
      catYearCount[catObj.category] = {};
      catObj.values.forEach(v => {
        catYearCount[catObj.category][v.year] = v.count;
        if (v.count > maxCount) maxCount = v.count;
      });
    });

    // 全局变量用于保存被点击的种类
    window.globalDispatcher = window.globalDispatcher || d3.dispatch("categorySelected");
    const CS_SUBCATEGORIES = [
      "cs.AI","cs.LG","cs.CC","cs.LO","cs.MA","cs.CL","cs.IR","cs.PL",
      "cs.CG","cs.GR","cs.RO","cs.DB","cs.IT","cs.NE","cs.DS","cs.DL",
      "cs.SE","cs.CE","cs.MS","cs.SC","cs.DC","cs.CV"
    ];

    // 画布尺寸
    const width = 600, height = 600;
    const margin = 20;
    const radius = Math.min(width, height) / 2 - margin;
    const innerRadius = radius * 0.9;
    const outerRadius = radius;
    const svg = d3.select("#ball-animation-container")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2-60}, ${height / 2-50}) scale(0.8)`);

    const pie = d3.pie().value(() => 1)(CS_SUBCATEGORIES);
    const color = d3.scaleOrdinal(d3.schemeSet2);
    const stackColor = d3.scaleOrdinal(d3.schemeSet3);

    // 绘制主圆弧
    const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);
    svg.selectAll("path")
      .data(pie)
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", d => color(d.data))
      .attr("stroke", "#fff")
      .style("stroke-width", "2px")
      .style("cursor", "pointer")
      .attr("data-category", d => d.data)
      .on("click", (event, d) => {
        window.selectedCategoriesRight = [d.data];
        window.globalDispatcher.call("categorySelected", null, d.data);
      })
      .on("mouseover", function(event, d) {
        d3.select(this)
          .transition().duration(200)
          .attr("fill", d3.rgb(color(d.data)).brighter(0.5));
      })
      .on("mouseout", function(event, d) {
        svg.selectAll(".stacked-bar path")
          .filter(b => b.data.category === d.data)
          .transition().duration(200)
          .attr("fill", (_, i) => stackColor(modulesList[i]));
        d3.select(this)
          .transition().duration(200)
          .attr("transform", "translate(0,0)")
          .attr("fill", color(d.data));
      });

    // 标签
    svg.selectAll("text")
      .data(pie)
      .enter()
      .append("text")
      .attr("transform", d => {
        const [x, y] = arc.centroid(d);
        const angle = (d.startAngle + d.endAngle) / 2 * (180 / Math.PI);
        return `translate(${x}, ${y}) rotate(${angle > 90 && angle < 270 ? angle + 180 : angle})`;
      })
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", "#fff")
      .style("user-select", "none")
      .text(d => d.data.replace(/^cs\./, ''));

    const modulesList = [
      "method","result","experiment","introduction",
      "discussion","conclusion","reference","background"
    ];

    // 从 JSON 获取数据并计算每个类别对应的平均模块值
    d3.json("arxiv_cs_data\\output_stats.json").then(rawData => {
      const grouped = d3.groups(rawData, d => d.category);
      const avgData = grouped.map(([cat, items]) => {
        const sums = {}, counts = {};
        modulesList.forEach(m => { sums[m]=0; counts[m]=0; });
        items.forEach(r => {
          if(r.modules){
            modulesList.forEach(m => {
              if(r.modules[m] !== undefined){
                sums[m] += r.modules[m];
                counts[m]++;
              }
            });
          }
        });
        const avgModules = {};
        modulesList.forEach(m => {
          avgModules[m] = counts[m] ? sums[m]/counts[m] : 0;
        });
        return { category: cat, modules: avgModules };
      });

      // 设置堆叠布局
      const stack = d3.stack()
        .keys(modulesList)
        .value((d, key) => d.modules[key])(avgData);

      // 新的堆叠柱起始半径
      const barStart = radius * 0.1;
      const moduleScale = d3.scaleSqrt()
        .domain([0, d3.max(stack, layer => d3.max(layer, d => d[1]))])
        .range([0, radius * 0.4 - barStart]);

      const arcStack = d3.arc()
        .startAngle((d, i) => (i * 2 * Math.PI) / avgData.length)
        .endAngle((d, i) => ((i + 1) * 2 * Math.PI) / avgData.length)
        .innerRadius(d => barStart + moduleScale(d[0]))
        .outerRadius(d => barStart + moduleScale(d[1]));

      // 绘制堆叠柱状图并添加类名
      svg.append("g")
        .selectAll("g")
        .data(stack)
        .enter()
        .append("g")
        .attr("class", "stacked-bar")
        .attr("fill", (_, i) => stackColor(modulesList[i]))
        .selectAll("path")
        .data(d => d)
        .enter()
        .append("path")
        .attr("d", arcStack)
        .attr("data-category", d => d.data.category); // 添加数据属性
    });

    // 外部参考线圆
    svg.append("circle")
      .attr("r", radius * 0.4 + 4)
      .attr("fill", "none")
      .attr("stroke", "grey")
      .attr("stroke-width", 2);
    svg.append("circle")
      .attr("r", radius * 0.9 - 4)
      .attr("fill", "none")
      .attr("stroke", "grey")
      .attr("stroke-width", 2);

    // 年份圆环数据
    const startYear = 1990;
    const endYear = 2024;
    const totalYears = endYear - startYear + 1;
    const innerGreyRadius = radius * 0.4 + 4;
    const outerGreyRadius = radius * 0.9 - 4;
    const ringThickness = (outerGreyRadius - innerGreyRadius) / totalYears;

    const yearArc = d3.arc()
      .innerRadius(d => innerGreyRadius + d.yearIndex * ringThickness)
      .outerRadius(d => innerGreyRadius + (d.yearIndex + 1) * ringThickness)
      .startAngle(d => (d.categoryIndex * 2 * Math.PI) / CS_SUBCATEGORIES.length)
      .endAngle(d => ((d.categoryIndex + 1) * 2 * Math.PI) / CS_SUBCATEGORIES.length)
      .padAngle(0.01)
      .padRadius(innerGreyRadius);

    const yearsData = [];
    for (let i = 0; i < totalYears; i++) {
      for (let j = 0; j < CS_SUBCATEGORIES.length; j++) {
        yearsData.push({
          year: startYear + i,
          yearIndex: i,
          category: CS_SUBCATEGORIES[j],
          categoryIndex: j
        });
      }
    }

    // 绘制年环，使用渐变
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("padding", "6px 12px")
      .style("background", "rgba(0,0,0,0.7)")
      .style("color", "#fff")
      .style("border-radius", "4px")
      .style("pointer-events", "none")
      .style("opacity", 0);


    // 修改 "yearly-rings" 部分，添加论文数量到工具提示
    svg.append("g")
      .attr("class", "yearly-rings")
      .selectAll("path")
      .data(yearsData)
      .enter()
      .append("path")
      .attr("d", yearArc)
      .attr("fill", d => {
        const count = catYearCount[d.category][d.year] || 0;
        const ratio = count / maxCount;
        // 由浅到深（0时较浅，数量越多越深）
        return d3.interpolateLab(
          d3.rgb(color(d.category)).brighter(1),
          d3.rgb(color(d.category))
        )(ratio);
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.5)
      .style("opacity", 0.7)
      .on("mouseover", function(event, d) {
        const count = catYearCount[d.category][d.year] || 0;
        d3.select(this)
          .transition().duration(200)
          .style("opacity", 1)
          .attr("stroke-width", 1.5);
        tooltip.transition().duration(200).style("opacity", 1);
        tooltip.html(`Year: ${d.year}<br>Category: ${d.category.replace(/^cs\./, '')}<br>Number of papers: ${count}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        d3.select(this)
          .transition().duration(200)
          .style("opacity", 0.7)
          .attr("stroke-width", 0.5);
        tooltip.transition().duration(200).style("opacity", 0);
      });


    // 添加论文数量图例（左下角）
    const paperCountLegend = d3.select("#ball-animation-container svg")
    .append("g")
    .attr("class", "legend-paper-count")
    .attr("transform", `translate(30, ${height - 60})`);
  
  // 图例标题
  paperCountLegend.append("text")
    .text("颜色-论文数量")
    .attr("x", 0)
    .attr("y", -10)
    .attr("font-size", "12px")
    .attr("fill", "#333");
  
  // 使用 cs.PL 对应颜色的渐变
  const csPLColor = color("cs.PL");
  const legendBlocks = d3.range(5);
  const blockSize = 12;
  legendBlocks.forEach((d, i) => {
    paperCountLegend.append("rect")
      .attr("x", i * (blockSize + 2))
      .attr("y", 0)
      .attr("width", blockSize)
      .attr("height", blockSize)
      .attr("fill", d3.interpolateLab(d3.rgb(csPLColor).brighter(1), d3.rgb(csPLColor))(i / (legendBlocks.length - 1)));
  });
    // 计算每个图例块对应的论文数量
    const legendLabels = legendBlocks.map(i => Math.round((maxCount / (legendBlocks.length - 1)) * i));

    // 仅为第1、3、5个图例块添加标签
    const labelsToShow = legendLabels.filter((d, i) => i % 2 === 0); // 0, 2, 4

    // 添加标签到指定的图例块下方
    paperCountLegend.selectAll("text.legend-label")
      .data(labelsToShow)
      .enter()
      .append("text")
      .attr("class", "legend-label")
      .attr("x", (d, i) => (i * 2) * (blockSize + 2) + blockSize / 2) // 对应原始索引位置
      .attr("y", blockSize + 15) // 调整y位置以放置在块下方
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("fill", "#333")
      .text(d => d);

    // 添加年份标签（中间）
const yearLabel = d3.select("#ball-animation-container svg")
.append("g")
.attr("class", "legend-year")
.attr("transform", `translate(${width / 2 - 90}, ${height - 60})`);

yearLabel.append("text")
.text("半径-年份")
.attr("x", 0)
.attr("y", -10)
.attr("font-size", "12px")
.attr("fill", "#333");

yearLabel.append("text")
.text("1990-2024")
.attr("x", 0)
.attr("y", 20)
.attr("font-size", "12px")
.attr("fill", "#333");

    // 添加论文结构图例（右下角）
    const moduleLegend = d3.select("#ball-animation-container svg")
      .append("g")
      .attr("class", "legend-modules")
      .attr("transform", `translate(${width - 220}, ${height - 120})`);

    // 图例标题
    moduleLegend.append("text")
      .text("圆心-论文结构")
      .attr("x", 0)
      .attr("y", -10)
      .attr("font-size", "12px")
      .attr("fill", "#333");

    // 使用 modulesList 显示不同模块的配色
    modulesList.forEach((m, i) => {
      moduleLegend.append("rect")
        .attr("x", 0)
        .attr("y", i * (blockSize + 2))
        .attr("width", blockSize)
        .attr("height", blockSize)
        .attr("fill", stackColor(m));

      moduleLegend.append("text")
        .attr("x", blockSize + 5)
        .attr("y", i * (blockSize + 2) + blockSize - 2)
        .attr("font-size", "10px")
        .attr("fill", "#333")
        .text(m);
    });
  });

};
