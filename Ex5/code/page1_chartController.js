// chartController.js
(function() {
    const relationChartBtn = document.getElementById('relationChartBtn');
    const overviewChartBtn = document.getElementById('overviewChartBtn');
    const container = document.getElementById('ball-animation-container');

    function clearContainer() {
        container.innerHTML = '';
    }

    function loadScript(url) {
        return new Promise((resolve, reject) => {
            const existingScript = document.querySelector(`script[src="${url}"]`);
            if (!existingScript) {
                const script = document.createElement('script');
                script.src = url;
                script.onload = resolve;
                script.onerror = reject;
                document.body.appendChild(script);
            } else {
                resolve();
            }
        });
    }

    async function loadRelationChart() {
        try {
            await loadScript('page4_main.js');
            if (typeof window.loadRelationChart === 'function') {
                window.loadRelationChart();
            }
        } catch {
            console.error('加载 page4_main.js 失败');
        }
    }

    async function loadOverviewChart() {
        try {
            await loadScript('page4_main2.js');
            if (typeof window.loadOverviewChart === 'function') {
                window.loadOverviewChart();
            }
        } catch {
            console.error('加载 page4_main2.js 失败');
        }
    }

    relationChartBtn.addEventListener('click', () => {
        clearContainer();
        loadRelationChart();
    });

    overviewChartBtn.addEventListener('click', () => {
        clearContainer();
        loadOverviewChart();
    });

    // 默认加载关系图
    relationChartBtn.click();
})();
overviewChartBtn.click();
relationChartBtn.click();