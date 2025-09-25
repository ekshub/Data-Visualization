(function() {
  // 获取左侧边栏的第二个容器
  const containers = document.querySelectorAll('.left-sidebar .container');
  const squaresContainer = containers[1];
  const width = squaresContainer.clientWidth;
  const height = squaresContainer.clientHeight;

  // 创建SVG画布
  const svg = d3.select(squaresContainer)
      .append("svg")
      .attr("id", "yearly-squares-chart")
      .attr("width", width)
      .attr("height", height);

  // 创建提示框
  const tooltip = d3.select("#tooltip");

  // 全局变量，用于追踪选定的年份和类别
  let selectedYears = [];
  let selectedCategories = window.selectedCategoriesRight ? window.selectedCategoriesRight.slice() : [];

  // 初始化全局变量，用于存储点击的年份和类别
  window.selectedSquareData = null;

  // 小方格属性
  const squareSize = 7;
  const squarePadding = 2;
  let squaresGroup;

  // 定义子类别
  const CS_SUBCATEGORIES = [
    "cs.AI","cs.LG","cs.CC","cs.LO","cs.MA","cs.CL","cs.IR","cs.PL",
    "cs.CG","cs.GR","cs.RO","cs.DB","cs.IT","cs.NE","cs.DS","cs.DL",
    "cs.SE","cs.CE","cs.MS","cs.SC","cs.DC","cs.CV"
  ];

  // 加载 processed_data.json 并渲染方格
  d3.json("arxiv_cs_data/processed_data.json")
      .then(proData => {
          // 扁平化数据
          const flattened = [];
          proData.forEach(d => {
              d.values.forEach(v => {
                  flattened.push({ category: d.category, year: v.year, count: v.count });
              });
          });

          // 收集所有年份，用于后续判断显示
          const allYears = [...new Set(flattened.map(d => d.year))].sort((a, b) => a - b);
          // 初始时选中全部年份
          selectedYears = allYears.slice();

          // 定义颜色比例尺
          const colorScale = d3.scaleOrdinal()
              .domain(CS_SUBCATEGORIES)
              .range(d3.schemeSet2);

          // 在小方格上方增加标题
          svg.append("text")
              .attr("x", width / 2 - 10)
              .attr("y", 20) // 根据需要调整标题的垂直位置
              .attr("text-anchor", "middle")
              .style("font-size", "16px")
              .style("font-weight", "bold")
              .text("论文发表年份分布");

          // 创建分组，并应用平移变换
          squaresGroup = svg.append("g")
              .attr("class", "squares-chart")
              .attr("transform", "translate(9, 40)"); // 右移9像素，下移40像素（为标题留出空间）

          // 绘制方格（每行25个）
          squaresGroup.selectAll("rect")
              .data(flattened)
              .enter()
              .append("rect")
              .attr("width", squareSize)
              .attr("height", squareSize)
              .attr("x", (d, i) => {
                  d.x = (i % 25) * (squareSize + squarePadding);
                  return d.x;
              })
              .attr("y", (d, i) => {
                  d.y = Math.floor(i / 25) * (squareSize + squarePadding);
                  return d.y;
              })
              .attr("fill", d => colorScale(d.category))
              .attr("opacity", d => {
                  const inYears = selectedYears.includes(d.year);
                  const inCats = selectedCategories.length === 0 || selectedCategories.includes(d.category);
                  return (inYears && inCats) ? 1 : 0.2;
              })
              .style("cursor", "pointer")  // 设置鼠标形状为可点击
              .on("click", function(event, d) {
                  // 更新全局变量，存储当前点击的年份和类别
                  window.selectedSquareData = {
                      year: d.year,
                      category: d.category,
                      count: d.count
                  };
                  window.leftChartDispatch.call('squareClicked', this, { year:  d.year, category: d.category });
                  // 在控制台输出，供调试
                  console.log("Selected Square Data:", window.selectedSquareData);

                  // 此处可以添加其他逻辑，例如触发其他图表的更新
              })
              .on("mouseover", function(event, d) {
                  // 显示提示框
                  tooltip
                      .style("opacity", 0.9)
                      .html(
                          `<strong>类别:</strong> ${d.category}<br/>
                          <strong>年份:</strong> ${d.year}<br/>
                          <strong>数量:</strong> ${d.count}`
                      )
                      .style("left", (event.pageX + 10) + "px")
                      .style("top", (event.pageY - 25) + "px");

                  // 方格略微变大且位置不变
                  const scaleFactor = 1.2; // 放大系数
                  const newSize = squareSize * scaleFactor;
                  const sizeDiff = (newSize - squareSize) / 2;

                  d3.select(this)
                      .transition()
                      .duration(100)
                      .attr("x", d.x - sizeDiff)
                      .attr("y", d.y - sizeDiff)
                      .attr("width", newSize)
                      .attr("height", newSize);
              })
              .on("mouseout", function(event, d) {
                  // 隐藏提示框
                  tooltip.style("opacity", 0);

                  // 方格恢复原状
                  d3.select(this)
                      .transition()
                      .duration(100)
                      .attr("x", d.x)
                      .attr("y", d.y)
                      .attr("width", squareSize)
                      .attr("height", squareSize);
              });

          // 监听年份范围变化
          window.leftChartDispatch.on("yearRangeChanged.squaresChart", (yearRange) => {
              const [startYear, endYear] = yearRange;
              selectedYears = allYears.filter(y => y >= startYear && y <= endYear);
              updateSquares();
          });

          // 周期性检测以更新类别
          setInterval(() => {
              if (window.selectedCategoriesRight) {
                  selectedCategories = window.selectedCategoriesRight.slice();
              } else {
                  selectedCategories = [];
              }
              updateSquares();
          }, 500);

          function updateSquares() {
              squaresGroup.selectAll("rect")
                  .attr("opacity", d => {
                      const inYears = selectedYears.includes(d.year);
                      const inCats = selectedCategories.length === 0 || selectedCategories.includes(d.category);
                      return (inYears && inCats) ? 1 : 0.2;
                  });
          }
      })
      .catch(err => {
          console.error("加载 processed_data.json 数据时出错:", err);
          d3.select(squaresContainer)
              .append("p")
              .text(`加载 processed_data.json 时出错: ${err.message}`)
              .style("color", "red");
      });
})();