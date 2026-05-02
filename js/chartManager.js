/**
 * 图表管理模块
 * 封装 ECharts 实例管理，提供统一的图表渲染接口
 */

class ChartManager {
    constructor(containerId) {
        this.containerId = containerId;
        this.chartInstance = null;
        this.currentOptions = null;    // 保存当前图表配置（用于更新）
        this.currentCoordType = 'linear'; // 当前坐标类型
        
        this.init(containerId);
    }

    /**
     * 初始化 ECharts 实例
     * @param {string} containerId - 图表容器ID
     */
    init(containerId) {
        console.log(`📊 ChartManager: 初始化图表实例 (${containerId})...`);
        
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`未找到图表容器: #${containerId}`);
        }

        // 如果已存在实例，先销毁
        if (this.chartInstance) {
            this.chartInstance.dispose();
        }

        // 创建新的 ECharts 实例
        this.chartInstance = echarts.init(container, null, {
            renderer: 'canvas',  // 使用 canvas 渲染（性能更好）
            devicePixelRatio: window.devicePixelRatio || 1
        });

        // 监听窗口大小变化，自动 resize
        this._resizeHandler = () => this.resize();
        window.addEventListener('resize', this._resizeHandler);

        console.log('✅ ChartManager: 图表实例初始化完成');
    }

    /**
     * 渲染基础线图（用于走势图视图）
     * @param {Object} config - 图表配置
     * @param {Array} config.cities - 城市数据数组
     * @param {string} config.dataType - 数据类型 ('newHouse' | 'secondHand' | 'both')
     * @param {string} config.coordType - 坐标类型 ('linear' | 'log')
     * @param {Object} config.dateRange - 日期范围 {start, end}
     */
    renderLineChart(config) {
        console.log('📈 ChartManager: 渲染线图...', config);
        
        const { cities, dataType = 'newHouse', coordType = 'linear', dateRange = null } = config;

        // 1. 准备 X轴数据（日期）
        const allDates = this._getAllDates(cities);
        const filteredDates = dateRange ? 
            allDates.filter(d => d >= dateRange.start && d <= dateRange.end) : 
            allDates;

        // 2. 准备系列数据（每个城市一个系列）
        const series = [];

        cities.forEach((cityData, index) => {
            const cityName = cityData.cityName;
            const color = this._getCityColor(index);

            // 新房价格曲线
            if (dataType === 'newHouse' || dataType === 'both') {
                const data = filteredDates.map(date => {
                    const item = cityData.data.find(d => d.date === date);
                    return item ? item.newHousePrice : null;
                });

                series.push({
                    name: `${cityName} (新房)`,
                    type: 'line',
                    data: data,
                    smooth: true,
                    symbol: 'circle',
                    symbolSize: 4,
                    lineStyle: { width: 2 },
                    itemStyle: { color: color }
                });
            }

            // 二手房价格曲线
            if (dataType === 'secondHand' || dataType === 'both') {
                const data = filteredDates.map(date => {
                    const item = cityData.data.find(d => d.date === date);
                    return item ? item.secondHandPrice : null;
                });

                series.push({
                    name: `${cityName} (二手房)`,
                    type: 'line',
                    data: data,
                    smooth: true,
                    symbol: 'diamond',
                    symbolSize: 4,
                    lineStyle: { width: 2, type: 'dashed' },
                    itemStyle: { color: color }
                });
            }
        });

        // 3. 组装 ECharts 配置项
        const options = {
            title: {
                text: '房价走势图',
                left: 'center',
                textStyle: { fontSize: 18, color: '#1a365d' }
            },
            tooltip: {
                trigger: 'axis',
                formatter: (params) => {
                    let html = `<strong>${params[0].axisValue}</strong><br/>`;
                    params.forEach(param => {
                        html += `${param.seriesName}: <strong>${param.value ? param.value.toFixed(2) : '-'} 元/㎡</strong><br/>`;
                    });
                    return html;
                }
            },
            legend: {
                data: series.map(s => s.name),
                top: 30,
                type: 'scroll'
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                top: 80,
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: filteredDates,
                axisLabel: {
                    rotate: 45,
                    fontSize: 10
                }
            },
            yAxis: {
                type: coordType === 'log' ? 'log' : 'value',
                name: '价格 (元/㎡)',
                nameTextStyle: { fontSize: 12 },
                axisLabel: {
                    formatter: (value) => {
                        if (value >= 10000) {
                            return (value / 10000).toFixed(1) + '万';
                        }
                        return value;
                    }
                }
            },
            series: series,
            dataZoom: [
                {
                    type: 'slider',
                    xAxisIndex: 0,
                    start: 0,
                    end: 100,
                    bottom: 20,
                    height: 20,
                    borderColor: 'transparent',
                    backgroundColor: '#f0f0f0',
                    fillerColor: 'rgba(49, 130, 206, 0.2)',
                    handleSize: '80%',
                    handleStyle: {
                        color: '#3182ce',
                        borderColor: '#3182ce'
                    }
                },
                {
                    type: 'inside',
                    xAxisIndex: 0,
                    zoomOnMouseWheel: false,    // 禁用鼠标滚轮缩放
                    moveOnMouseMove: false,      // 禁用鼠标移动拖拽
                    moveOnMouseWheel: false      // 禁用鼠标滚轮移动
                }
            ],
            toolbox: {
                feature: {
                    saveAsImage: { title: '保存为图片' },
                    dataZoom: { title: { zoom: '缩放', back: '还原' } },
                    restore: { title: '还原' }
                },
                right: 20
            }
        };

        // 4. 渲染图表
        this.chartInstance.setOption(options, true);  // true 表示不合并，完全替换
        this.currentOptions = options;
        this.currentCoordType = coordType;

        console.log('✅ ChartManager: 线图渲染完成');
    }

    /**
     * 渲染K线图（蜡烛图）
     * @param {Object} config - 图表配置
     * @param {Array} config.cities - 城市数据数组
     * @param {string} config.coordType - 坐标类型 ('linear' | 'log')
     * @param {Object} config.dateRange - 日期范围 {start, end}
     * @param {Array} config.maPeriods - 移动平均线周期数组 (如 [5, 10, 20])
     */
    renderCandlestickChart(config) {
        console.log('📊 ChartManager: 渲染K线图...', config);
        
        const { cities, coordType = 'linear', dateRange = null, maPeriods = [5, 10] } = config;

        // 1. 准备 X轴数据（日期）
        const allDates = this._getAllDates(cities);
        const filteredDates = dateRange ? 
            allDates.filter(d => d >= dateRange.start && d <= dateRange.end) : 
            allDates;

        // 2. 准备系列数据
        const series = [];

        cities.forEach((cityData, index) => {
            const cityName = cityData.cityName;
            const color = this._getCityColor(index);

            // 转换K线图数据格式: [开盘, 收盘, 最低, 最高]
            const candlestickData = filteredDates.map(date => {
                const item = cityData.data.find(d => d.date === date);
                if (!item) return null;
                return [item.monthlyOpen, item.monthlyClose, item.monthlyLow, item.monthlyHigh];
            });

            // 添加K线图系列
            series.push({
                name: cityName,
                type: 'candlestick',
                data: candlestickData,
                itemStyle: {
                    color: '#ef5350',      // 上涨颜色（红色，中国股市惯例）
                    color0: '#26a69a',     // 下跌颜色（绿色）
                    borderColor: '#ef5350',
                    borderColor0: '#26a69a'
                },
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowOffsetY: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            });

            // 添加移动平均线
            if (maPeriods && maPeriods.length > 0) {
                maPeriods.forEach(period => {
                    const maData = Calculator.calculateMA(cityData.data, period);
                    const filteredMA = filteredDates.map((date, idx) => {
                        const item = cityData.data.find(d => d.date === date);
                        if (!item) return null;
                        const dataIndex = cityData.data.findIndex(d => d.date === date);
                        return dataIndex >= period - 1 ? maData[dataIndex] : null;
                    });

                    series.push({
                        name: `${cityName} MA${period}`,
                        type: 'line',
                        data: filteredMA,
                        smooth: true,
                        symbol: 'none',
                        lineStyle: {
                            width: 1,
                            type: 'solid'
                        },
                        itemStyle: {
                            color: color
                        }
                    });
                });
            }
        });

        // 3. 组装 ECharts 配置项
        const options = {
            title: {
                text: '房价K线图',
                left: 'center',
                textStyle: { fontSize: 18, color: '#1a365d' }
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross'
                },
                formatter: (params) => {
                    const date = params[0].axisValue;
                    let html = `<strong>${date}</strong><br/>`;
                    
                    params.forEach(param => {
                        if (param.seriesType === 'candlestick') {
                            const values = param.value;
                            html += `<br/><strong>${param.seriesName}</strong><br/>`;
                            html += `开盘: ${values[0]}<br/>`;
                            html += `收盘: ${values[1]}<br/>`;
                            html += `最低: ${values[2]}<br/>`;
                            html += `最高: ${values[3]}<br/>`;
                        } else if (param.seriesType === 'line') {
                            html += `<br/>${param.seriesName}: ${param.value ? param.value.toFixed(2) : '-'}<br/>`;
                        }
                    });
                    
                    return html;
                }
            },
            legend: {
                data: series.map(s => s.name),
                top: 30,
                type: 'scroll'
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '15%',
                top: 80,
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: filteredDates,
                axisLabel: {
                    rotate: 45,
                    fontSize: 10
                }
            },
            yAxis: {
                type: coordType === 'log' ? 'log' : 'value',
                name: '价格 (元/㎡)',
                nameTextStyle: { fontSize: 12 },
                axisLabel: {
                    formatter: (value) => {
                        if (value >= 10000) {
                            return (value / 10000).toFixed(1) + '万';
                        }
                        return value;
                    }
                }
            },
            series: series,
            dataZoom: [
                {
                    type: 'slider',
                    xAxisIndex: 0,
                    start: 0,
                    end: 100,
                    bottom: 20,
                    height: 20
                },
                {
                    type: 'inside',
                    xAxisIndex: 0
                }
            ],
            toolbox: {
                feature: {
                    saveAsImage: { title: '保存为图片' },
                    dataZoom: { title: { zoom: '缩放', back: '还原' } },
                    restore: { title: '还原' }
                },
                right: 20
            }
        };

        // 4. 渲染图表
        this.chartInstance.setOption(options, true);
        this.currentOptions = options;
        this.currentCoordType = coordType;

        console.log('✅ ChartManager: K线图渲染完成');
    }

    /**
     * 渲染宏观数据图表（基本面分析视图）
     * @param {Object} config - 图表配置
     * @param {Array} config.cities - 城市数据数组
     * @param {Object} config.macroData - 宏观数据对象
     * @param {Array} config.selectedIndicators - 选中的宏观指标数组
     * @param {string} config.coordType - 坐标类型 ('linear' | 'log')
     * @param {Object} config.dateRange - 日期范围 {start, end}
     */
    renderMacroChart(config) {
        console.log('📊 ChartManager: 渲染宏观数据图表...', config);
        
        const { cities, macroData, selectedIndicators = ['GDP_YoY', 'CPI_YoY', 'M2_YoY'], coordType = 'linear', dateRange = null } = config;
        
        if (!macroData || !macroData.monthlyData) {
            console.error('宏观数据无效');
            return;
        }

        // 1. 准备 X轴数据（日期）
        const allDates = this._getAllDates(cities);
        const macroDates = macroData.monthlyData.map(item => item.date).sort();
        const filteredDates = dateRange ? 
            allDates.filter(d => d >= dateRange.start && d <= dateRange.end) : 
            allDates;

        // 2. 准备系列数据
        const series = [];
        const legendData = [];

        // 2.1 添加房价数据（左Y轴）
        cities.forEach((cityData, index) => {
            const cityName = cityData.cityName;
            const color = this._getCityColor(index);

            // 新房价格
            const newHouseData = filteredDates.map(date => {
                const item = cityData.data.find(d => d.date === date);
                return item ? item.newHousePrice : null;
            });

            series.push({
                name: `${cityName} (新房)`,
                type: 'line',
                yAxisIndex: 0,  // 左Y轴（房价）
                data: newHouseData,
                smooth: true,
                symbol: 'circle',
                symbolSize: 4,
                lineStyle: { width: 2 },
                itemStyle: { color: color }
            });
            legendData.push(`${cityName} (新房)`);

            // 二手房价格
            const secondHandData = filteredDates.map(date => {
                const item = cityData.data.find(d => d.date === date);
                return item ? item.secondHandPrice : null;
            });

            series.push({
                name: `${cityName} (二手房)`,
                type: 'line',
                yAxisIndex: 0,  // 左Y轴（房价）
                data: secondHandData,
                smooth: true,
                symbol: 'diamond',
                symbolSize: 4,
                lineStyle: { width: 2, type: 'dashed' },
                itemStyle: { color: color }
            });
            legendData.push(`${cityName} (二手房)`);
        });

        // 2.2 添加宏观指标数据（右Y轴）
        const indicatorColors = ['#f39c12', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6'];
        selectedIndicators.forEach((indicator, index) => {
            const indicatorData = filteredDates.map(date => {
                const item = macroData.monthlyData.find(d => d.date === date);
                return item ? item[indicator] : null;
            });

            const indicatorName = this._getIndicatorName(indicator);
            const color = indicatorColors[index % indicatorColors.length];

            series.push({
                name: indicatorName,
                type: 'line',
                yAxisIndex: 1,  // 右Y轴（宏观指标）
                data: indicatorData,
                smooth: true,
                symbol: 'triangle',
                symbolSize: 4,
                lineStyle: { width: 1.5, type: 'dotted' },
                itemStyle: { color: color }
            });
            legendData.push(indicatorName);
        });

        // 2.3 添加事件标记（垂直参考线）
        const markLines = [];
        if (macroData.events && macroData.events.length > 0) {
            macroData.events.forEach(event => {
                if (filteredDates.includes(event.date)) {
                    markLines.push({
                        xAxis: event.date,
                        label: {
                            formatter: event.event,
                            position: 'start',
                            fontSize: 10
                        },
                        lineStyle: {
                            type: 'dashed',
                            color: event.impact === 'positive' ? '#26a69a' : '#ef5350',
                            width: 2
                        }
                    });
                }
            });
        }

        if (markLines.length > 0) {
            // 添加一个隐藏系列用于显示事件线
            series.push({
                name: '政策事件',
                type: 'line',
                yAxisIndex: 0,
                data: filteredDates.map(() => null),
                markLine: {
                    silent: true,
                    symbol: 'none',
                    data: markLines,
                    lineStyle: {
                        type: 'dashed'
                    }
                },
                lineStyle: { opacity: 0 },
                itemStyle: { opacity: 0 }
            });
            legendData.push('政策事件');
        }

        // 3. 组装 ECharts 配置项
        const options = {
            title: {
                text: '房价与宏观数据分析',
                left: 'center',
                textStyle: { fontSize: 18, color: '#1a365d' }
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross'
                },
                formatter: (params) => {
                    let html = `<strong>${params[0].axisValue}</strong><br/>`;
                    params.forEach(param => {
                        if (param.seriesName === '政策事件') return;
                        
                        const value = param.value;
                        const unit = param.seriesType === 'line' && param.yAxisIndex === 0 ? ' 元/㎡' : '%';
                        
                        html += `${param.seriesName}: <strong>${value ? value.toFixed(2) : '-'}${unit}</strong><br/>`;
                    });
                    return html;
                }
            },
            legend: {
                data: legendData,
                top: 30,
                type: 'scroll',
                textStyle: { fontSize: 10 }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                top: 80,
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: filteredDates,
                axisLabel: {
                    rotate: 45,
                    fontSize: 10
                },
                axisPointer: {
                    type: 'shadow'
                }
            },
            yAxis: [
                {
                    type: coordType === 'log' ? 'log' : 'value',
                    name: '房价 (元/㎡)',
                    nameTextStyle: { fontSize: 12 },
                    axisLabel: {
                        formatter: (value) => {
                            if (value >= 10000) {
                                return (value / 10000).toFixed(1) + '万';
                            }
                            return value;
                        }
                    },
                    position: 'left'
                },
                {
                    type: 'value',
                    name: '宏观指标 (%)',
                    nameTextStyle: { fontSize: 12 },
                    axisLabel: {
                        formatter: '{value}%'
                    },
                    position: 'right'
                }
            ],
            series: series,
            dataZoom: [
                {
                    type: 'slider',
                    xAxisIndex: 0,
                    start: 0,
                    end: 100,
                    bottom: 20,
                    height: 20,
                    borderColor: 'transparent',
                    backgroundColor: '#f0f0f0',
                    fillerColor: 'rgba(49, 130, 206, 0.2)',
                    handleSize: '80%',
                    handleStyle: {
                        color: '#3182ce',
                        borderColor: '#3182ce'
                    }
                },
                {
                    type: 'inside',
                    xAxisIndex: 0,
                    zoomOnMouseWheel: false,
                    moveOnMouseMove: false,
                    moveOnMouseWheel: false
                }
            ],
            toolbox: {
                feature: {
                    saveAsImage: { title: '保存为图片' },
                    dataZoom: { title: { zoom: '缩放', back: '还原' } },
                    restore: { title: '还原' }
                },
                right: 20
            }
        };

        // 4. 渲染图表
        this.chartInstance.setOption(options, true);
        this.currentOptions = options;
        this.currentCoordType = coordType;

        console.log('✅ ChartManager: 宏观数据图表渲染完成');
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
     * 渲染城市对比图表（归一化对比视图）
     * @param {Object} config - 图表配置
     * @param {Array} config.cities - 城市数据数组
     * @param {string} config.baseDate - 基准日期
     * @param {string} config.method - 归一化方法 ('base100' | 'percentChange' | 'ranking')
     * @param {string} config.coordType - 坐标类型 ('linear' | 'log')
     * @param {Object} config.dateRange - 日期范围 {start, end}
     */
    renderComparisonChart(config) {
        console.log('📊 ChartManager: 渲染城市对比图表...', config);
        
        const { cities, baseDate, method = 'base100', coordType = 'linear', dateRange = null } = config;

        if (!cities || cities.length === 0) {
            console.error('城市数据无效');
            return;
        }

        // 1. 准备 X轴数据（日期）
        const allDates = this._getAllDates(cities);
        const filteredDates = dateRange ? 
            allDates.filter(d => d >= dateRange.start && d <= dateRange.end) : 
            allDates;

        // 2. 准备系列数据（对每个城市进行归一化）
        const series = [];
        const legendData = [];

        cities.forEach((cityData, index) => {
            const cityName = cityData.cityName;
            const color = this._getCityColor(index);

            // 归一化处理
            const normalizedData = Calculator.normalize(cityData.data, baseDate, method);
            
            if (normalizedData.length === 0) {
                console.warn(`城市 ${cityName} 的归一化数据为空，跳过`);
                return;
            }

            // 提取归一化后的值
            const data = filteredDates.map(date => {
                const item = normalizedData.find(d => d.date === date);
                return item ? item.value : null;
            });

            // 确定Y轴名称
            let yAxisName = '';
            let seriesName = '';
            if (method === 'base100') {
                yAxisName = '指数 (基准=100)';
                seriesName = `${cityName} (基准${baseDate})`;
            } else if (method === 'percentChange') {
                yAxisName = '涨跌幅 (%)';
                seriesName = `${cityName} (相对${baseDate})`;
            }

            series.push({
                name: seriesName,
                type: 'line',
                data: data,
                smooth: true,
                symbol: 'circle',
                symbolSize: 4,
                lineStyle: { width: 2 },
                itemStyle: { color: color }
            });

            legendData.push(seriesName);
        });

        // 3. 组装 ECharts 配置项
        let titleText = '城市房价对比 - ';
        if (method === 'base100') {
            titleText += '基准点法';
        } else if (method === 'percentChange') {
            titleText += '涨跌幅法';
        }

        let yAxisName = '';
        if (method === 'base100') {
            yAxisName = '指数 (基准=100)';
        } else if (method === 'percentChange') {
            yAxisName = '涨跌幅 (%)';
        }

        const options = {
            title: {
                text: titleText,
                left: 'center',
                textStyle: { fontSize: 18, color: '#1a365d' }
            },
            tooltip: {
                trigger: 'axis',
                formatter: (params) => {
                    let html = `<strong>${params[0].axisValue}</strong><br/>`;
                    params.forEach(param => {
                        const unit = method === 'percentChange' ? '%' : '';
                        html += `${param.seriesName}: <strong>${param.value ? param.value.toFixed(2) : '-'}${unit}</strong><br/>`;
                    });
                    return html;
                }
            },
            legend: {
                data: legendData,
                top: 30,
                type: 'scroll'
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                top: 80,
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: filteredDates,
                axisLabel: {
                    rotate: 45,
                    fontSize: 10
                }
            },
            yAxis: {
                type: coordType === 'log' ? 'log' : 'value',
                name: yAxisName,
                nameTextStyle: { fontSize: 12 }
            },
            series: series,
            dataZoom: [
                {
                    type: 'slider',
                    xAxisIndex: 0,
                    start: 0,
                    end: 100,
                    bottom: 20,
                    height: 20,
                    borderColor: 'transparent',
                    backgroundColor: '#f0f0f0',
                    fillerColor: 'rgba(49, 130, 206, 0.2)',
                    handleSize: '80%',
                    handleStyle: {
                        color: '#3182ce',
                        borderColor: '#3182ce'
                    }
                },
                {
                    type: 'inside',
                    xAxisIndex: 0,
                    zoomOnMouseWheel: false,
                    moveOnMouseMove: false,
                    moveOnMouseWheel: false
                }
            ],
            toolbox: {
                feature: {
                    saveAsImage: { title: '保存为图片' },
                    dataZoom: { title: { zoom: '缩放', back: '还原' } },
                    restore: { title: '还原' }
                },
                right: 20
            }
        };

        // 4. 渲染图表
        this.chartInstance.setOption(options, true);
        this.currentOptions = options;
        this.currentCoordType = coordType;

        console.log('✅ ChartManager: 城市对比图表渲染完成');
    }

    /**
     * 切换坐标类型（linear / log）
     * @param {string} type - 坐标类型 ('linear' | 'log')
     */
    switchCoordinate(type) {
        if (!this.currentOptions) {
            console.warn('ChartManager: 没有可更新的图表');
            return;
        }

        console.log(`📊 ChartManager: 切换到 ${type} 坐标...`);
        
        // 更新左Y轴类型（房价轴）
        if (this.currentOptions.yAxis && this.currentOptions.yAxis[0]) {
            this.currentOptions.yAxis[0].type = type === 'log' ? 'log' : 'value';
        } else {
            this.currentOptions.yAxis.type = type === 'log' ? 'log' : 'value';
        }
        
        this.currentCoordType = type;

        this.chartInstance.setOption({
            yAxis: this.currentOptions.yAxis
        }, false);  // false 表示合并更新
    }

    /**
     * 更新图表数据（不重新创建图表）
     * @param {Object} newConfig - 新配置
     */
    updateChart(newConfig) {
        console.log('🔄 ChartManager: 更新图表...', newConfig);
        this.renderLineChart(newConfig);
    }

    /**
     * 调整图表大小（响应窗口变化）
     */
    resize() {
        if (this.chartInstance) {
            this.chartInstance.resize();
        }
    }

    /**
     * 销毁图表实例
     */
    dispose() {
        console.log('🗑️ ChartManager: 销毁图表实例...');
        
        if (this.chartInstance) {
            this.chartInstance.dispose();
            this.chartInstance = null;
        }

        if (this._resizeHandler) {
            window.removeEventListener('resize', this._resizeHandler);
            this._resizeHandler = null;
        }

        this.currentOptions = null;
    }

    /**
     * 获取当前图表配置（用于导出或分享）
     */
    getCurrentOptions() {
        return this.currentOptions;
    }

    // ========== 私有辅助方法 ==========

    /**
     * 获取所有城市的日期并集
     */
    _getAllDates(cities) {
        const dateSet = new Set();
        cities.forEach(city => {
            city.data.forEach(item => {
                dateSet.add(item.date);
            });
        });
        return Array.from(dateSet).sort();
    }

    /**
     * 根据索引获取城市颜色
     */
    _getCityColor(index) {
        const colors = [
            '#3182ce',  // 蓝色
            '#dd6b20',  // 橙色
            '#38a169',  // 绿色
            '#805ad5',  // 紫色
            '#d69e2e',  // 黄色
            '#e53e3e',  // 红色
            '#0987a0',  // 青色
            '#6b46c1'   // 深紫色
        ];
        return colors[index % colors.length];
    }
}

// 创建单例实例并导出
// 延迟到 app.js 的 DOMContentLoaded 中初始化
// const chartManager = new ChartManager('chartContainer');

// 浏览器环境导出 - 将类引用暴露给 app.js 进行延迟实例化
if (typeof window !== 'undefined') {
    window.ChartManagerConstructor = ChartManager;
}

// Node.js 环境导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChartManager;
}
