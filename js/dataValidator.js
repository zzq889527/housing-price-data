/**
 * 数据验证脚本
 * 用于验证 cities.json 和 macro.json 的数据格式是否正确
 * 
 * 使用方法：
 * 1. 在浏览器控制台中运行此脚本
 * 2. 或创建一个测试页面引入此脚本
 */

const DataValidator = {
    /**
     * 验证 cities.json 数据格式
     * @param {Object} data - cities.json 的解析结果
     * @returns {Object} 验证结果 {valid: boolean, errors: []}
     */
    validateCitiesData(data) {
        const errors = [];
        
        // 1. 检查顶层结构
        if (!data.meta) errors.push('缺少 meta 字段');
        if (!data.cities || !Array.isArray(data.cities)) {
            errors.push('缺少 cities 数组');
            return { valid: false, errors };
        }
        
        // 2. 检查每个城市数据
        data.cities.forEach((city, index) => {
            const prefix = `cities[${index}] (${city.cityName || '未知'})`;
            
            if (!city.cityId) errors.push(`${prefix}: 缺少 cityId`);
            if (!city.cityName) errors.push(`${prefix}: 缺少 cityName`);
            if (!city.data || !Array.isArray(city.data)) {
                errors.push(`${prefix}: 缺少 data 数组`);
                return;
            }
            
            // 3. 检查每个月份数据
            city.data.forEach((month, mIndex) => {
                const mPrefix = `${prefix}.data[${mIndex}] (${month.date || '未知日期'})`;
                
                if (!month.date) errors.push(`${mPrefix}: 缺少 date 字段`);
                if (typeof month.newHousePrice !== 'number') errors.push(`${mPrefix}: newHousePrice 必须是数字`);
                if (typeof month.secondHandPrice !== 'number') errors.push(`${mPrefix}: secondHandPrice 必须是数字`);
                if (typeof month.monthlyOpen !== 'number') errors.push(`${mPrefix}: monthlyOpen 必须是数字`);
                if (typeof month.monthlyClose !== 'number') errors.push(`${mPrefix}: monthlyClose 必须是数字`);
                if (typeof month.monthlyHigh !== 'number') errors.push(`${mPrefix}: monthlyHigh 必须是数字`);
                if (typeof month.monthlyLow !== 'number') errors.push(`${mPrefix}: monthlyLow 必须是数字`);
                
                // 4. 检查数据逻辑（最高价 >= 最低价）
                if (month.monthlyHigh < month.monthlyLow) {
                    errors.push(`${mPrefix}: monthlyHigh < monthlyLow，数据逻辑错误`);
                }
                
                // 5. 检查日期格式（YYYY-MM）
                if (month.date && !/^\d{4}-\d{2}$/.test(month.date)) {
                    errors.push(`${mPrefix}: date 格式错误，应为 YYYY-MM`);
                }
            });
            
            // 6. 检查日期连续性（可选）
            if (city.data.length > 1) {
                for (let i = 1; i < city.data.length; i++) {
                    const prev = city.data[i-1].date;
                    const curr = city.data[i].date;
                    // 简化检查：确保日期递增
                    if (prev >= curr) {
                        errors.push(`${prefix}: 日期不连续，第 ${i} 条数据 (${curr}) 早于或等于前一条 (${prev})`);
                    }
                }
            }
        });
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    },
    
    /**
     * 验证 macro.json 数据格式
     * @param {Object} data - macro.json 的解析结果
     * @returns {Object} 验证结果 {valid: boolean, errors: []}
     */
    validateMacroData(data) {
        const errors = [];
        
        // 1. 检查顶层结构
        if (!data.meta) errors.push('缺少 meta 字段');
        if (!data.monthlyData || !Array.isArray(data.monthlyData)) {
            errors.push('缺少 monthlyData 数组');
            return { valid: false, errors };
        }
        
        // 2. 检查每个月份数据
        const validIndicators = ['GDP_YoY', 'CPI_YoY', 'M2_YoY', 'interestRate_10Y', 'realEstateInvestment_YoY'];
        
        data.monthlyData.forEach((month, index) => {
            const prefix = `monthlyData[${index}] (${month.date || '未知日期'})`;
            
            if (!month.date) errors.push(`${prefix}: 缺少 date 字段`);
            
            // 3. 检查宏观指标（允许 null 或 number）
            validIndicators.forEach(indicator => {
                if (month[indicator] !== null && typeof month[indicator] !== 'number') {
                    errors.push(`${prefix}: ${indicator} 必须是数字或 null`);
                }
            });
            
            // 4. 检查日期格式
            if (month.date && !/^\d{4}-\d{2}$/.test(month.date)) {
                errors.push(`${prefix}: date 格式错误，应为 YYYY-MM`);
            }
        });
        
        // 5. 检查事件数据（可选）
        if (data.events && Array.isArray(data.events)) {
            data.events.forEach((event, index) => {
                const prefix = `events[${index}]`;
                if (!event.date) errors.push(`${prefix}: 缺少 date 字段`);
                if (!event.event) errors.push(`${prefix}: 缺少 event 字段`);
                if (!event.impact) errors.push(`${prefix}: 缺少 impact 字段`);
            });
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    },
    
    /**
     * 运行完整验证
     */
    async validateAll() {
        console.log('🔍 开始数据验证...');
        
        const results = {};
        
        // 1. 加载并验证 cities.json
        try {
            const response = await fetch('data/cities.json');
            const citiesData = await response.json();
            results.cities = this.validateCitiesData(citiesData);
            console.log(`${results.cities.valid ? '✅' : '❌'} cities.json 验证${results.cities.valid ? '通过' : '失败'}`);
            if (!results.cities.valid) {
                results.cities.errors.forEach(err => console.error(`  - ${err}`));
            }
        } catch (error) {
            results.cities = { valid: false, errors: [`加载 cities.json 失败: ${error.message}`] };
            console.error('❌ 加载 cities.json 失败:', error);
        }
        
        // 2. 加载并验证 macro.json
        try {
            const response = await fetch('data/macro.json');
            const macroData = await response.json();
            results.macro = this.validateMacroData(macroData);
            console.log(`${results.macro.valid ? '✅' : '❌'} macro.json 验证${results.macro.valid ? '通过' : '失败'}`);
            if (!results.macro.valid) {
                results.macro.errors.forEach(err => console.error(`  - ${err}`));
            }
        } catch (error) {
            results.macro = { valid: false, errors: [`加载 macro.json 失败: ${error.message}`] };
            console.error('❌ 加载 macro.json 失败:', error);
        }
        
        // 3. 总结
        const allValid = Object.values(results).every(r => r.valid);
        console.log(`\n📊 验证总结: ${allValid ? '✅ 所有数据验证通过' : '❌ 存在数据格式错误，请修正后重试'}`);
        
        return results;
    }
};

// 导出到全局（浏览器环境）
if (typeof window !== 'undefined') {
    window.DataValidator = DataValidator;
    console.log('💡 数据验证工具已加载，运行 DataValidator.validateAll() 开始验证');
}

// Node.js 环境导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataValidator;
}
