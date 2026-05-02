/**
 * 计算引擎模块
 * 提供各种金融计算函数（移动平均线、相关系数、年化收益等）
 */

class Calculator {
    /**
     * 计算移动平均线 (Simple Moving Average)
     * @param {Array} data - 价格数据数组（每个元素包含 monthlyClose 字段）
     * @param {number} period - 移动平均周期
     * @returns {Array} 移动平均线数据（长度与 data 相同，前 period-1 个为 null）
     */
    static calculateMA(data, period) {
        if (!Array.isArray(data) || data.length === 0) {
            console.warn('Calculator: 计算MA失败，数据为空');
            return [];
        }

        if (typeof period !== 'number' || period <= 0) {
            console.warn('Calculator: 计算MA失败，周期参数错误');
            return [];
        }

        const result = [];

        for (let i = 0; i < data.length; i++) {
            if (i < period - 1) {
                // 数据不足，无法计算
                result.push(null);
            } else {
                // 计算平均值
                let sum = 0;
                for (let j = 0; j < period; j++) {
                    const value = data[i - j].monthlyClose;
                    if (typeof value !== 'number') {
                        console.warn(`Calculator: 第 ${i} 条数据的 monthlyClose 不是数字`);
                        result.push(null);
                        continue;
                    }
                    sum += value;
                }
                result.push(sum / period);
            }
        }

        return result;
    }

    /**
     * 数据归一化（用于城市对比）
     * @param {Array} data - 价格数据数组
     * @param {string} baseDate - 基准日期 (YYYY-MM)
     * @param {string} method - 归一化方法 ('base100' | 'percentChange' | 'ranking')
     * @returns {Array} 归一化后的数据
     */
    static normalize(data, baseDate, method = 'base100') {
        if (!Array.isArray(data) || data.length === 0) {
            console.warn('Calculator: 归一化失败，数据为空');
            return [];
        }

        // 找到基准日期的数据
        const baseItem = data.find(d => d.date === baseDate);
        if (!baseItem) {
            console.warn(`Calculator: 未找到基准日期 ${baseDate} 的数据`);
            return [];
        }

        const baseValue = baseItem.monthlyClose;  // 使用月末收盘价作为基准

        switch (method) {
            case 'base100':
                // 基准点法：基准日期 = 100
                return data.map(item => ({
                    date: item.date,
                    value: (item.monthlyClose / baseValue) * 100
                }));

            case 'percentChange':
                // 涨跌幅法
                return data.map(item => ({
                    date: item.date,
                    value: ((item.monthlyClose - baseValue) / baseValue) * 100
                }));

            case 'ranking':
                // 排名法（需要所有城市数据，此函数暂不实现）
                console.warn('Calculator: ranking 方法需要多城市数据，请使用 calculateRanking()');
                return [];

            default:
                console.warn(`Calculator: 未知的归一化方法 ${method}`);
                return [];
        }
    }

    /**
     * 计算相关系数 (Pearson Correlation Coefficient)
     * @param {Array<number>} x - 数组X
     * @param {Array<number>} y - 数组Y
     * @returns {number} 相关系数（-1 到 1）
     */
    static calculateCorrelation(x, y) {
        if (!Array.isArray(x) || !Array.isArray(y) || x.length !== y.length || x.length === 0) {
            console.warn('Calculator: 计算相关系数失败，数据无效');
            return 0;
        }

        const n = x.length;

        // 计算均值
        const meanX = x.reduce((sum, val) => sum + val, 0) / n;
        const meanY = y.reduce((sum, val) => sum + val, 0) / n;

        // 计算协方差和方差
        let cov = 0;
        let varX = 0;
        let varY = 0;

        for (let i = 0; i < n; i++) {
            const dx = x[i] - meanX;
            const dy = y[i] - meanY;
            cov += dx * dy;
            varX += dx * dx;
            varY += dy * dy;
        }

        // 避免除以零
        if (varX === 0 || varY === 0) {
            return 0;
        }

        return cov / Math.sqrt(varX * varY);
    }

    /**
     * 计算年化收益率
     * @param {Array} data - 价格数据数组（包含 date 和 monthlyClose 字段）
     * @param {string} baseDate - 起始日期
     * @returns {number} 年化收益率（小数形式，如 0.08 表示 8%）
     */
    static calculateAnnualizedReturn(data, baseDate) {
        if (!Array.isArray(data) || data.length < 2) {
            console.warn('Calculator: 计算年化收益率失败，数据不足');
            return 0;
        }

        // 找到基准日期和最新日期的数据
        const baseItem = data.find(d => d.date === baseDate) || data[0];
        const latestItem = data[data.length - 1];

        const baseValue = baseItem.monthlyClose;
        const latestValue = latestItem.monthlyClose;

        // 计算年数
        const baseDateObj = new Date(baseItem.date + '-01');
        const latestDateObj = new Date(latestItem.date + '-01');
        const years = (latestDateObj - baseDateObj) / (1000 * 60 * 60 * 24 * 365.25);

        if (years <= 0) {
            return 0;
        }

        // 年化收益率 = (latest / base)^(1/years) - 1
        return Math.pow(latestValue / baseValue, 1 / years) - 1;
    }

    /**
     * 计算最大回撤
     * @param {Array} data - 价格数据数组（包含 monthlyClose 字段）
     * @returns {number} 最大回撤（小数形式，如 -0.2 表示 -20%）
     */
    static calculateMaxDrawdown(data) {
        if (!Array.isArray(data) || data.length < 2) {
            console.warn('Calculator: 计算最大回撤失败，数据不足');
            return 0;
        }

        let maxPrice = data[0].monthlyClose;  // 峰值
        let maxDrawdown = 0;  // 最大回撤

        for (let i = 0; i < data.length; i++) {
            const currentPrice = data[i].monthlyClose;

            // 更新峰值
            if (currentPrice > maxPrice) {
                maxPrice = currentPrice;
            }

            // 计算当前回撤
            const drawdown = (currentPrice - maxPrice) / maxPrice;

            // 更新最大回撤
            if (drawdown < maxDrawdown) {
                maxDrawdown = drawdown;
            }
        }

        return maxDrawdown;  // 负数或零
    }

    /**
     * 计算波动率（标准差）
     * @param {Array} data - 价格数据数组（包含 monthlyClose 字段）
     * @returns {number} 波动率（标准差）
     */
    static calculateVolatility(data) {
        if (!Array.isArray(data) || data.length < 2) {
            console.warn('Calculator: 计算波动率失败，数据不足');
            return 0;
        }

        // 计算月收益率
        const returns = [];
        for (let i = 1; i < data.length; i++) {
            const returnVal = (data[i].monthlyClose - data[i-1].monthlyClose) / data[i-1].monthlyClose;
            returns.push(returnVal);
        }

        // 计算平均收益率
        const meanReturn = returns.reduce((sum, val) => sum + val, 0) / returns.length;

        // 计算方差
        const variance = returns.reduce((sum, val) => sum + Math.pow(val - meanReturn, 2), 0) / returns.length;

        // 标准差 = 平方根(方差)
        return Math.sqrt(variance);
    }

    /**
     * 计算排名（用于城市对比）
     * @param {Array} citiesData - 多个城市的数据数组
     * @param {string} metric - 排名指标 ('cumulativeReturn' | 'annualizedReturn' | 'maxDrawdown')
     * @returns {Array} 排名结果 [{cityId, cityName, value, rank}, ...]
     */
    static calculateRanking(citiesData, metric = 'cumulativeReturn') {
        if (!Array.isArray(citiesData) || citiesData.length === 0) {
            console.warn('Calculator: 计算排名失败，数据无效');
            return [];
        }

        const results = citiesData.map(cityData => {
            const cityName = cityData.cityName;
            let value;

            switch (metric) {
                case 'cumulativeReturn':
                    // 累计涨幅
                    const firstPrice = cityData.data[0].monthlyClose;
                    const lastPrice = cityData.data[cityData.data.length - 1].monthlyClose;
                    value = (lastPrice - firstPrice) / firstPrice;
                    break;

                case 'annualizedReturn':
                    // 年化收益率
                    value = this.calculateAnnualizedReturn(cityData.data, cityData.data[0].date);
                    break;

                case 'maxDrawdown':
                    // 最大回撤（越小排名越前）
                    value = this.calculateMaxDrawdown(cityData.data);
                    break;

                default:
                    console.warn(`Calculator: 未知的排名指标 ${metric}`);
                    value = 0;
            }

            return {
                cityId: cityData.cityId,
                cityName: cityName,
                value: value
            };
        });

        // 排序（根据指标类型决定升序还是降序）
        const ascending = metric === 'maxDrawdown';  // 最大回撤越小越好
        results.sort((a, b) => ascending ? a.value - b.value : b.value - a.value);

        // 添加排名
        results.forEach((item, index) => {
            item.rank = index + 1;
        });

        return results;
    }
}

// 导出到全局（浏览器环境）
if (typeof window !== 'undefined') {
    window.Calculator = Calculator;
}

// Node.js 环境导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Calculator;
}
