/**
 * 数据管理模块
 * 负责加载、缓存、查询房价数据和宏观数据
 * 支持嵌入数据模式（微信兼容）、fetch 模式（本地服务器）和在线模式（GitHub Pages）
 */

class DataManager {
    constructor() {
        this.citiesData = null;        // 所有城市数据
        this.macroData = null;         // 宏观数据
        this.citiesMetaData = null;    // 城市元数据（ID、名称、省份）
        this.cachePrefix = 'housing_price_';
        this.cacheExpiry = 24 * 60 * 60 * 1000; // 缓存24小时
        this.useEmbeddedData = false;    // 是否使用嵌入数据模式
        this.useOnlineData = false;     // 是否使用在线数据（GitHub Pages）- 默认关闭
        this.forceOnlineData = false;    // 不强制使用在线数据（优先使用嵌入数据）
        this.onlineDataUrl = 'https://zzq889527.github.io/housing-price-data/cities.json';
    }

    /**
     * 初始化数据管理模块
     */
    async init() {
        console.log('📂 DataManager: 初始化中...');
        
        try {
            // 检测数据加载模式
            this._detectDataMode();
            
            if (this.useEmbeddedData) {
                console.log('📦 DataManager: 使用嵌入数据模式（微信兼容）');
                await this._loadEmbeddedData();
            } else if (this.useOnlineData) {
                console.log('🌐 DataManager: 使用在线数据模式（GitHub Pages）');
                await this._loadOnlineData();
            } else {
                // 本地服务器模式：加载城市列表（轻量级元数据）
                await this.loadCitiesMetaData();
                
                // 加载宏观数据
                await this.loadMacroData();
            }
            
            console.log('✅ DataManager: 初始化完成');
            return true;
        } catch (error) {
            console.error('❌ DataManager: 初始化失败', error);
            
            // 如果在线数据加载失败，尝试使用缓存
            if (this.useOnlineData) {
                console.log('⚠️ 在线数据加载失败，尝试使用缓存...');
                const cached = this.getCachedData('online_cities');
                if (cached) {
                    console.log('📦 使用缓存的在线数据');
                    this.citiesData = cached.cities;
                    this.citiesMetaData = cached.meta;
                    return true;
                }
            }
            
            throw error;
        }
    }

    _detectDataMode() {
        // 检查是否配置了在线数据URL
        const hasOnlineUrl = this.onlineDataUrl && this.onlineDataUrl.length > 0;
        
        // 强制使用在线数据模式（忽略协议检测）
        if (this.forceOnlineData && hasOnlineUrl) {
            this.useOnlineData = true;
            this.useEmbeddedData = false;
            console.log('🌐 强制使用在线数据模式（forceOnlineData=true）');
            return;
        }
        
        // 以下是自动检测逻辑（当 forceOnlineData=false 时）
        
        // 检查是否在微信浏览器中
        const ua = navigator.userAgent.toLowerCase();
        const isWechat = ua.indexOf('micromessenger') !== -1;
        
        // 检查是否使用 file:// 协议
        const isFileProtocol = window.location.protocol === 'file:';
        
        // 检查是否有嵌入数据
        const hasEmbeddedData = typeof window.EmbeddedData !== 'undefined';
        
        if ((isWechat || isFileProtocol) && hasEmbeddedData) {
            this.useEmbeddedData = true;
            this.useOnlineData = false;
            console.log('📱 检测到微信浏览器或本地文件，使用嵌入数据模式');
        } else if (hasOnlineUrl && !isFileProtocol) {
            // 非file协议，且配置了在线URL，使用在线数据
            this.useOnlineData = true;
            this.useEmbeddedData = false;
            console.log('🌐 检测到在线数据URL，使用在线数据模式');
        } else {
            this.useEmbeddedData = false;
            this.useOnlineData = false;
            console.log('🖥️ 使用本地服务器模式');
        }
    }

    /**
     * 从 GitHub Pages 加载在线数据
     */
    async _loadOnlineData() {
        const cached = this.getCachedData('online_cities');
        
        // 检查缓存是否存在且未过期
        if (cached) {
            console.log('📦 DataManager: 从缓存加载在线数据');
            this.citiesData = cached.cities;
            this.citiesMetaData = cached.meta;
            return;
        }
        
        console.log('🌐 DataManager: 从 GitHub Pages 加载数据...');
        console.log(`📡 URL: ${this.onlineDataUrl}`);
        
        const response = await fetch(this.onlineDataUrl);
        if (!response.ok) {
            throw new Error(`加载在线数据失败: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // 解析数据
        this.citiesMetaData = [];
        this.citiesData = {};
        
        for (const [cityName, cityInfo] of Object.entries(data.cities)) {
            // 构建城市元数据
            this.citiesMetaData.push({
                cityId: cityName,
                cityName: cityName,
                province: cityInfo.province || '未知'
            });
            
            // 构建城市数据
            this.citiesData[cityName] = {
                cityId: cityName,
                cityName: cityName,
                data: cityInfo.data
            };
        }
        
        // 缓存数据
        this.cacheData('online_cities', {
            cities: this.citiesData,
            meta: this.citiesMetaData,
            lastUpdated: data.meta.last_updated
        });
        
        console.log(`✅ 已加载 ${this.citiesMetaData.length} 个城市（在线模式）`);
    }

    /**
     * 加载嵌入数据
     */
    async _loadEmbeddedData() {
        const data = window.EmbeddedData;
        
        // 检查数据格式，支持两种格式
        if (data.citiesMeta && data.citiesData) {
            // 新格式：直接使用
            this.citiesMetaData = data.citiesMeta;
            this.citiesData = data.citiesData;
            this.macroData = data.macroData;
        } else if (data.cities) {
            // 原始格式：需要转换（和_loadOnlineData一样的逻辑）
            this.citiesMetaData = [];
            this.citiesData = {};
            
            for (const [cityName, cityInfo] of Object.entries(data.cities)) {
                // 构建城市元数据
                this.citiesMetaData.push({
                    cityId: cityName,
                    cityName: cityName,
                    province: cityInfo.province || '未知'
                });
                
                // 构建城市数据
                this.citiesData[cityName] = {
                    cityId: cityName,
                    cityName: cityName,
                    data: cityInfo.data
                };
            }
            
            // 宏观数据
            this.macroData = data.meta || null;
        } else {
            throw new Error('嵌入数据格式错误：无法识别的数据结构');
        }
        
        console.log(`✅ 已加载 ${this.citiesMetaData.length} 个城市（嵌入模式）`);
    }

    /**
     * 加载城市元数据（ID、名称、省份）
     */
    async loadCitiesMetaData() {
        const cached = this.getCachedData('cities_meta');
        if (cached) {
            console.log('📦 DataManager: 从缓存加载城市元数据');
            this.citiesMetaData = cached;
            return cached;
        }

        console.log('🔍 DataManager: 从JSON文件加载城市元数据...');
        const response = await fetch('data/cities.json');
        if (!response.ok) {
            throw new Error(`加载 cities.json 失败: ${response.statusText}`);
        }
        
        const data = await response.json();
        this.citiesMetaData = data.cities.map(city => ({
            cityId: city.cityId,
            cityName: city.cityName,
            province: city.province
        }));

        // 缓存元数据
        this.cacheData('cities_meta', this.citiesMetaData);
        
        return this.citiesMetaData;
    }

    /**
     * 加载单个城市数据（懒加载）
     * @param {string} cityId - 城市ID
     */
    async loadCityData(cityId) {
        // 嵌入数据模式或在线模式：直接返回
        if ((this.useEmbeddedData || this.useOnlineData) && this.citiesData && this.citiesData[cityId]) {
            return this.citiesData[cityId];
        }
        
        // 服务器模式：检查是否已加载
        if (this.citiesData && this.citiesData[cityId]) {
            return this.citiesData[cityId];
        }

        const cached = this.getCachedData(`city_${cityId}`);
        if (cached) {
            console.log(`📦 DataManager: 从缓存加载 ${cityId} 数据`);
            if (!this.citiesData) this.citiesData = {};
            this.citiesData[cityId] = cached;
            return cached;
        }

        console.log(`🔍 DataManager: 从JSON文件加载 ${cityId} 数据...`);
        
        // 加载完整 cities.json，然后提取指定城市数据
        const response = await fetch('data/cities.json');
        if (!response.ok) {
            throw new Error(`加载 cities.json 失败: ${response.statusText}`);
        }
        
        const data = await response.json();
        const cityData = data.cities.find(c => c.cityId === cityId);
        
        if (!cityData) {
            throw new Error(`未找到城市数据: ${cityId}`);
        }

        // 缓存该城市数据
        if (!this.citiesData) this.citiesData = {};
        this.citiesData[cityId] = cityData;
        this.cacheData(`city_${cityId}`, cityData);
        
        return cityData;
    }

    /**
     * 加载多个城市数据
     * @param {Array<string>} cityIds - 城市ID数组
     */
    async loadCities(cityIds) {
        // 嵌入数据模式或在线模式：直接返回所有数据
        if ((this.useEmbeddedData || this.useOnlineData) && this.citiesData) {
            const results = {};
            cityIds.forEach(id => {
                if (this.citiesData[id]) {
                    results[id] = this.citiesData[id];
                }
            });
            return results;
        }
        
        const results = {};
        for (const cityId of cityIds) {
            results[cityId] = await this.loadCityData(cityId);
        }
        return results;
    }

    /**
     * 加载宏观数据
     */
    async loadMacroData() {
        // 嵌入数据模式：直接使用已加载的数据
        if (this.useEmbeddedData && this.macroData) {
            console.log('📦 DataManager: 使用嵌入的宏观数据');
            return this.macroData;
        }

        const cached = this.getCachedData('macro_data');
        if (cached) {
            console.log('📦 DataManager: 从缓存加载宏观数据');
            this.macroData = cached;
            return cached;
        }

        console.log('🔍 DataManager: 从JSON文件加载宏观数据...');
        const response = await fetch('data/macro.json');
        if (!response.ok) {
            throw new Error(`加载 macro.json 失败: ${response.statusText}`);
        }
        
        this.macroData = await response.json();
        
        // 缓存宏观数据
        this.cacheData('macro_data', this.macroData);
        
        return this.macroData;
    }

    /**
     * 获取指定城市在指定时间范围的数据
     * @param {string} cityId - 城市ID
     * @param {string} startDate - 开始日期 (YYYY-MM)
     * @param {string} endDate - 结束日期 (YYYY-MM)
     */
    getCityData(cityId, startDate = null, endDate = null) {
        if (!this.citiesData || !this.citiesData[cityId]) {
            console.warn(`DataManager: 城市数据未加载: ${cityId}`);
            return null;
        }

        let data = this.citiesData[cityId].data;

        // 按日期范围过滤
        if (startDate) {
            data = data.filter(d => d.date >= startDate);
        }
        if (endDate) {
            data = data.filter(d => d.date <= endDate);
        }

        return {
            cityId: cityId,
            cityName: this.citiesData[cityId].cityName,
            data: data
        };
    }

    /**
     * 搜索城市（按名称或省份）
     * @param {string} keyword - 搜索关键词
     */
    searchCities(keyword) {
        if (!this.citiesMetaData) {
            console.warn('DataManager: 城市元数据未加载');
            return [];
        }

        const lowerKeyword = keyword.toLowerCase();
        return this.citiesMetaData.filter(city =>
            city.cityName.toLowerCase().includes(lowerKeyword) ||
            city.province.toLowerCase().includes(lowerKeyword)
        );
    }

    /**
     * 获取所有城市元数据
     */
    getAllCities() {
        return this.citiesMetaData || [];
    }

    /**
     * 获取宏观数据（可指定时间范围）
     * @param {string} startDate - 开始日期 (YYYY-MM)
     * @param {string} endDate - 结束日期 (YYYY-MM)
     */
    getMacroData(startDate = null, endDate = null) {
        if (!this.macroData) {
            console.warn('DataManager: 宏观数据未加载');
            return null;
        }

        let data = this.macroData.monthlyData;

        if (startDate) {
            data = data.filter(d => d.date >= startDate);
        }
        if (endDate) {
            data = data.filter(d => d.date <= endDate);
        }

        return {
            meta: this.macroData.meta,
            events: this.macroData.events,
            monthlyData: data
        };
    }

    /**
     * 获取数据来源信息
     */
    getDataSource() {
        if (this.useOnlineData) {
            return 'GitHub Pages (在线数据)';
        }
        if (this.macroData && this.macroData.meta) {
            return this.macroData.meta.dataSource;
        }
        return '未知来源';
    }

    /**
     * 获取最后更新时间
     */
    getLastUpdated() {
        if (this.useOnlineData) {
            const cached = this.getCachedData('online_cities');
            if (cached && cached.lastUpdated) {
                return cached.lastUpdated;
            }
        }
        if (this.macroData && this.macroData.meta) {
            return this.macroData.meta.lastUpdated;
        }
        return '--';
    }

    /**
     * 缓存数据到 LocalStorage
     * @param {string} key - 缓存键
     * @param {any} data - 缓存数据
     */
    cacheData(key, data) {
        try {
            const item = {
                data: data,
                timestamp: Date.now(),
                expiry: Date.now() + this.cacheExpiry
            };
            localStorage.setItem(this.cachePrefix + key, JSON.stringify(item));
        } catch (error) {
            console.warn('DataManager: 缓存数据失败', error);
        }
    }

    /**
     * 从 LocalStorage 读取缓存
     * @param {string} key - 缓存键
     */
    getCachedData(key) {
        try {
            const itemStr = localStorage.getItem(this.cachePrefix + key);
            if (!itemStr) return null;

            const item = JSON.parse(itemStr);
            
            // 检查是否过期
            if (Date.now() > item.expiry) {
                localStorage.removeItem(this.cachePrefix + key);
                return null;
            }

            return item.data;
        } catch (error) {
            console.warn('DataManager: 读取缓存失败', error);
            return null;
        }
    }

    /**
     * 清除所有缓存
     */
    clearCache() {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(this.cachePrefix)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log('🗑️ DataManager: 已清除所有缓存');
    }
}

// 创建单例实例并导出
const dataManager = new DataManager();

// 浏览器环境导出到全局（小写，表示实例）
if (typeof window !== 'undefined') {
    window.dataManager = dataManager;
}

// Node.js 环境导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataManager;
}
