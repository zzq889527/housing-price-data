/**
 * UI 控制器基础
 * 负责视图切换、城市选择、控件交互等 UI 逻辑
 */

class UIController {
    constructor() {
        this.currentView = 'trend';      // 当前视图 (trend/candlestick/fundamental/comparison)
        this.selectedCities = ['beijing', 'shanghai', 'guangzhou', 'shenzhen', 'hangzhou']; // 默认选中的城市
        this.currentCoordType = 'linear'; // 当前坐标类型
        this.isMobile = window.innerWidth < 768;
    }

    /**
     * 初始化 UI 控制器
     */
    init() {
        console.log('🎨 UIController: 初始化中...');
        
        // 1. 绑定事件监听器
        this.bindEvents();
        
        // 2. 渲染城市列表
        this.renderCityList();
        
        // 3. 设置默认日期范围
        this.setDefaultDateRange();
        
        // 4. 监听窗口大小变化，更新移动端状态
        window.addEventListener('resize', () => {
            this.isMobile = window.innerWidth < 768;
        });
        
        console.log('✅ UIController: 初始化完成');
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 1. 视图切换标签
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.switchView(view);
            });
        });

        // 2. 城市搜索
        const citySearch = document.getElementById('citySearch');
        if (citySearch) {
            citySearch.addEventListener('input', (e) => {
                this.filterCityList(e.target.value);
            });
        }

        // 3. 坐标类型切换
        const coordBtns = document.querySelectorAll('.coord-btn');
        coordBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const coordType = e.target.dataset.coord;
                this.toggleCoordinateType(coordType);
            });
        });

        // 4. 移动端控件面板切换
        const mobileToggle = document.getElementById('mobileControlToggle');
        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => {
                this.toggleMobilePanel();
            });
        }

        // 5. 时间范围选择器（变化时重新渲染图表）
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');
        if (startDate && endDate) {
            const updateChart = () => this.renderCurrentView();
            startDate.addEventListener('change', updateChart);
            endDate.addEventListener('change', updateChart);
        }

        // 6. 均线配置复选框（K线图视图）
        const maCheckboxes = document.querySelectorAll('#maSettings input[type="checkbox"]');
        maCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                if (this.currentView === 'candlestick') {
                    this.renderCurrentView();
                }
            });
        });
    }

    /**
     * 渲染城市列表
     */
    renderCityList() {
        const cityListEl = document.getElementById('cityList');
        if (!cityListEl) return;

        const allCities = dataManager.getAllCities();
        
        let html = '';
        allCities.forEach(city => {
            const isChecked = this.selectedCities.includes(city.cityId) ? 'checked' : '';
            html += `
                <div class="city-item">
                    <input type="checkbox" id="city_${city.cityId}" value="${city.cityId}" ${isChecked}>
                    <label for="city_${city.cityId}">${city.cityName}</label>
                </div>
            `;
        });

        cityListEl.innerHTML = html;

        // 绑定复选框事件
        cityListEl.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.toggleCity(e.target.value, e.target.checked);
            });
        });
    }

    /**
     * 过滤城市列表（搜索功能）
     * @param {string} keyword - 搜索关键词
     */
    filterCityList(keyword) {
        const cityItems = document.querySelectorAll('.city-item');
        const lowerKeyword = keyword.toLowerCase();

        cityItems.forEach(item => {
            const label = item.querySelector('label').textContent.toLowerCase();
            if (label.includes(lowerKeyword)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    /**
     * 切换城市选择状态
     * @param {string} cityId - 城市ID
     * @param {boolean} isSelected - 是否选中
     */
    toggleCity(cityId, isSelected) {
        if (isSelected) {
            if (!this.selectedCities.includes(cityId)) {
                this.selectedCities.push(cityId);
            }
        } else {
            this.selectedCities = this.selectedCities.filter(id => id !== cityId);
        }

        // 重新渲染当前视图
        this.renderCurrentView();
    }

    /**
     * 切换视图
     * @param {string} viewName - 视图名称 (trend/candlestick/fundamental/comparison)
     */
    switchView(viewName) {
        console.log(`🎨 UIController: 切换到 ${viewName} 视图`);
        
        this.currentView = viewName;

        // 1. 更新标签样式
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.dataset.view === viewName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // 2. 显示/隐藏对应的控件面板
        this.updateControlPanelVisibility(viewName);

        // 3. 渲染对应视图的图表
        this.renderCurrentView();
    }

    /**
     * 更新控件面板可见性（根据当前视图）
     * @param {string} viewName - 视图名称
     */
    updateControlPanelVisibility(viewName) {
        // 均线设置（仅K线图视图显示）
        const maSettings = document.getElementById('maSettings');
        if (maSettings) {
            maSettings.style.display = viewName === 'candlestick' ? 'block' : 'none';
        }

        // 宏观指标选择（仅基本面分析视图显示）
        const macroSettings = document.getElementById('macroSettings');
        if (macroSettings) {
            macroSettings.style.display = viewName === 'fundamental' ? 'block' : 'none';
        }

        // 归一化设置（仅城市对比视图显示）
        const normalizeSettings = document.getElementById('normalizeSettings');
        if (normalizeSettings) {
            normalizeSettings.style.display = viewName === 'comparison' ? 'block' : 'none';
        }

        // 分析面板（基本面分析和城市对比视图显示）
        const analysisPanel = document.getElementById('analysisPanel');
        if (analysisPanel) {
            analysisPanel.style.display = 
                (viewName === 'fundamental' || viewName === 'comparison') ? 'block' : 'none';
        }

        const fundamentalPanel = document.getElementById('fundamentalPanel');
        const comparisonPanel = document.getElementById('comparisonPanel');
        
        if (fundamentalPanel) {
            fundamentalPanel.style.display = viewName === 'fundamental' ? 'block' : 'none';
        }
        
        if (comparisonPanel) {
            comparisonPanel.style.display = viewName === 'comparison' ? 'block' : 'none';
        }
    }

    /**
     * 渲染当前视图
     */
    async renderCurrentView() {
        console.log(`🎨 UIController: 渲染 ${this.currentView} 视图...`);
        
        showLoading();
        
        try {
            // 加载选中的城市数据
            const cityData = await dataManager.loadCities(this.selectedCities);

            switch (this.currentView) {
                case 'trend':
                    this.renderTrendView(cityData);
                    break;
                case 'candlestick':
                    this.renderCandlestickView(cityData);
                    break;
                case 'fundamental':
                    this.renderFundamentalView(cityData);
                    break;
                case 'comparison':
                    this.renderComparisonView(cityData);
                    break;
            }
        } catch (error) {
            console.error('❌ 渲染视图失败:', error);
            showNotification('渲染图表失败: ' + error.message, 'error');
        } finally {
            hideLoading();
        }
    }

    /**
     * 渲染走势图视图（基础线图）
     * @param {Object} cityData - 城市数据
     */
    renderTrendView(cityData) {
        const citiesArray = Object.values(cityData);
        
        window.ChartManager.renderLineChart({
            cities: citiesArray,
            dataType: 'both',  // 同时显示新房和二手房
            coordType: this.currentCoordType,
            dateRange: this.getDateRange()
        });
    }

    /**
     * 渲染K线图视图
     * @param {Object} cityData - 城市数据
     */
    async renderCandlestickView(cityData) {
        console.log('📊 UIController: 渲染K线图视图...');
        
        const citiesArray = Object.values(cityData);
        const maPeriods = this.getSelectedMAPeriods();
        
        window.ChartManager.renderCandlestickChart({
            cities: citiesArray,
            coordType: this.currentCoordType,
            dateRange: this.getDateRange(),
            maPeriods: maPeriods
        });
    }

    /**
     * 获取选中的均线周期
     * @returns {Array<number>} 选中的周期数组
     */
    getSelectedMAPeriods() {
        const checkboxes = document.querySelectorAll('#maSettings input[type="checkbox"]:checked');
        return Array.from(checkboxes).map(cb => parseInt(cb.value));
    }

    /**
     * 渲染基本面分析视图（宏观数据分析）
     * @param {Object} cityData - 城市数据
     */
    async renderFundamentalView(cityData) {
        console.log('📊 UIController: 渲染基本面分析视图...');
        
        try {
            // 1. 加载宏观数据
            const macroData = await dataManager.loadMacroData();
            
            // 2. 获取用户选择的宏观指标
            const selectedIndicators = this.getSelectedMacroIndicators();
            
            // 3. 调用ChartManager渲染宏观数据图表
            const citiesArray = Object.values(cityData);
            
            window.ChartManager.renderMacroChart({
                cities: citiesArray,
                macroData: macroData,
                selectedIndicators: selectedIndicators,
                coordType: this.currentCoordType,
                dateRange: this.getDateRange()
            });
            
            // 4. 计算并显示相关性分析
            this.renderCorrelationAnalysis(cityData, macroData, selectedIndicators);
            
        } catch (error) {
            console.error('❌ 渲染基本面分析视图失败:', error);
            showNotification('加载宏观数据失败: ' + error.message, 'error');
            
            // 降级处理：显示普通走势图
            this.renderTrendView(cityData);
        }
    }

    /**
     * 获取用户选择的宏观指标
     * @returns {Array<string>} 选中的指标代码数组
     */
    getSelectedMacroIndicators() {
        const checkboxes = document.querySelectorAll('#macroSettings input[type="checkbox"]:checked');
        if (!checkboxes || checkboxes.length === 0) {
            // 默认选中前3个指标
            return ['GDP_YoY', 'CPI_YoY', 'M2_YoY'];
        }
        return Array.from(checkboxes).map(cb => cb.value);
    }

    /**
     * 渲染相关性分析面板
     * @param {Object} cityData - 城市数据
     * @param {Object} macroData - 宏观数据
     * @param {Array} selectedIndicators - 选中的宏观指标
     */
    renderCorrelationAnalysis(cityData, macroData, selectedIndicators) {
        console.log('📊 UIController: 计算相关性分析...');
        
        const analysisPanel = document.getElementById('fundamentalPanel');
        if (!analysisPanel) return;
        
        let html = '<h3>📊 相关性分析</h3>';
        html += '<div class="analysis-content">';
        
        // 对每个选中的城市和每个宏观指标计算相关性
        Object.values(cityData).forEach(city => {
            html += `<h4>${city.cityName} 房价与宏观指标相关性</h4>`;
            html += '<table class="correlation-table">';
            html += '<tr><th>宏观指标</th><th>相关系数</th><th>相关性强弱</th></tr>';
            
            selectedIndicators.forEach(indicator => {
                // 提取有效数据对
                const pairs = [];
                const cityPrices = city.data;
                
                cityPrices.forEach(item => {
                    const macroItem = macroData.monthlyData.find(d => d.date === item.date);
                    if (macroItem && macroItem[indicator] !== undefined && item.newHousePrice) {
                        pairs.push({
                            x: macroItem[indicator],
                            y: item.newHousePrice
                        });
                    }
                });
                
                if (pairs.length > 10) {  // 至少需要10个数据点
                    const correlation = Calculator.calculateCorrelation(
                        pairs.map(p => p.x),
                        pairs.map(p => p.y)
                    );
                    
                    const strength = this._getCorrelationStrength(correlation);
                    const indicatorName = this._getIndicatorName(indicator);
                    
                    html += `<tr>
                        <td>${indicatorName}</td>
                        <td class="correlation-value">${correlation.toFixed(4)}</td>
                        <td class="correlation-strength ${strength.class}">${strength.text}</td>
                    </tr>`;
                }
            });
            
            html += '</table>';
        });
        
        html += '</div>';
        analysisPanel.innerHTML = html;
    }

    /**
     * 根据相关系数判断相关性强弱
     * @param {number} corr - 相关系数
     * @returns {Object} {text, class}
     */
    _getCorrelationStrength(corr) {
        const absCorr = Math.abs(corr);
        if (absCorr >= 0.8) {
            return { text: '强相关', class: 'strong' };
        } else if (absCorr >= 0.5) {
            return { text: '中等相关', class: 'moderate' };
        } else if (absCorr >= 0.3) {
            return { text: '弱相关', class: 'weak' };
        } else {
            return { text: '几乎无关', class: 'none' };
        }
    }

    /**
     * 获取宏观指标的中文名称
     * @param {string} indicator - 指标代码
     * @returns {string} 指标中文名
     */
    _getIndicatorName(indicator) {
        const nameMap = {
            'GDP_YoY': 'GDP同比增长',
            'CPI_YoY': 'CPI同比增长',
            'M2_YoY': 'M2同比增长',
            'interestRate_10Y': '10年期国债收益率',
            'realEstateInvestment_YoY': '房地产开发投资增长'
        };
        return nameMap[indicator] || indicator;
    }

    /**
     * 渲染城市对比视图
     * @param {Object} cityData - 城市数据
     */
    async renderComparisonView(cityData) {
        console.log('📊 UIController: 渲染城市对比视图...');
        
        try {
            // 1. 获取归一化设置
            const baseDate = this.getBaseDate();
            const method = this.getNormalizeMethod();
            
            // 2. 调用ChartManager渲染对比图表
            const citiesArray = Object.values(cityData);
            
            window.ChartManager.renderComparisonChart({
                cities: citiesArray,
                baseDate: baseDate,
                method: method,
                coordType: this.currentCoordType,
                dateRange: this.getDateRange()
            });
            
            // 3. 计算并显示城市排名
            this.renderCityRanking(citiesArray);
            
        } catch (error) {
            console.error('❌ 渲染城市对比视图失败:', error);
            showNotification('渲染对比图表失败: ' + error.message, 'error');
            
            // 降级处理：显示普通走势图
            this.renderTrendView(cityData);
        }
    }

    /**
     * 获取基准日期
     * @returns {string} 基准日期 (YYYY-MM)
     */
    getBaseDate() {
        const baseDateInput = document.getElementById('baseDate');
        if (baseDateInput && baseDateInput.value) {
            return baseDateInput.value;
        }
        
        // 默认使用第一个数据点的日期
        return '2000-01';
    }

    /**
     * 获取归一化方法
     * @returns {string} 归一化方法 ('base100' | 'percentChange' | 'ranking')
     */
    getNormalizeMethod() {
        const methodSelect = document.getElementById('normalizeMethod');
        if (methodSelect) {
            return methodSelect.value;
        }
        
        // 默认使用基准点法
        return 'base100';
    }

    /**
     * 渲染城市排名表格
     * @param {Array} citiesArray - 城市数据数组
     */
    renderCityRanking(citiesArray) {
        console.log('📊 UIController: 计算城市排名...');
        
        const rankingPanel = document.getElementById('comparisonPanel');
        if (!rankingPanel) return;
        
        // 计算各项指标排名
        const cumulativeReturnRanking = Calculator.calculateRanking(citiesArray, 'cumulativeReturn');
        const annualizedReturnRanking = Calculator.calculateRanking(citiesArray, 'annualizedReturn');
        const maxDrawdownRanking = Calculator.calculateRanking(citiesArray, 'maxDrawdown');
        
        // 渲染排名表格
        let html = '<h3>📊 城市强弱分析</h3>';
        
        // 累计涨幅排名
        html += '<h4>累计涨幅排名</h4>';
        html += '<table class="rank-table">';
        html += '<tr><th>排名</th><th>城市</th><th>累计涨幅</th><th>年化收益</th><th>最大回撤</th></tr>';
        
        cumulativeReturnRanking.forEach(item => {
            const annualizedReturn = annualizedReturnRanking.find(r => r.cityId === item.cityId);
            const maxDrawdown = maxDrawdownRanking.find(r => r.cityId === item.cityId);
            
            html += `<tr>
                <td>${item.rank}</td>
                <td>${item.cityName}</td>
                <td>${(item.value * 100).toFixed(2)}%</td>
                <td>${annualizedReturn ? ((annualizedReturn.value * 100).toFixed(2) + '%') : '-'}</td>
                <td class="drawdown">${maxDrawdown ? ((maxDrawdown.value * 100).toFixed(2) + '%') : '-'}</td>
            </tr>`;
        });
        
        html += '</table>';
        rankingPanel.innerHTML = html;
    }

    /**
     * 切换坐标类型
     * @param {string} coordType - 坐标类型 ('linear' | 'log')
     */
    toggleCoordinateType(coordType) {
        console.log(`🎨 UIController: 切换到 ${coordType} 坐标`);
        
        this.currentCoordType = coordType;

        // 更新按钮样式
        document.querySelectorAll('.coord-btn').forEach(btn => {
            if (btn.dataset.coord === coordType) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // 显示/隐藏对数坐标提示
        const coordHint = document.getElementById('coordHint');
        if (coordHint) {
            coordHint.style.display = coordType === 'log' ? 'block' : 'none';
        }

        // 重新渲染当前视图
        this.renderCurrentView();
    }

    /**
     * 设置默认日期范围
     */
    setDefaultDateRange() {
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');
        
        if (startDate && !startDate.value) {
            startDate.value = '2000-01';  // 默认从2000年1月开始
        }
        
        if (endDate && !endDate.value) {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            endDate.value = `${year}-${month}`;
        }
    }

    /**
     * 获取当前日期范围
     * @returns {Object|null} {start, end} 或 null
     */
    getDateRange() {
        const startDate = document.getElementById('startDate')?.value;
        const endDate = document.getElementById('endDate')?.value;
        
        if (startDate && endDate) {
            return { start: startDate, end: endDate };
        }
        return null;
    }

    /**
     * 切换移动端控件面板显示/隐藏
     */
    toggleMobilePanel() {
        const controlPanel = document.getElementById('controlPanel');
        if (controlPanel) {
            controlPanel.classList.toggle('active');
        }
    }

    /**
     * 显示加载指示器
     */
    showLoading() {
        const loading = document.getElementById('loadingIndicator');
        if (loading) {
            loading.style.display = 'block';
        }
    }

    /**
     * 隐藏加载指示器
     */
    hideLoading() {
        const loading = document.getElementById('loadingIndicator');
        if (loading) {
            loading.style.display = 'none';
        }
    }
}

// 创建单例实例并导出
const uiController = new UIController();

// 浏览器环境导出到全局（小写，表示实例）
if (typeof window !== 'undefined') {
    window.uiController = uiController;
}

// Node.js 环境导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIController;
}
