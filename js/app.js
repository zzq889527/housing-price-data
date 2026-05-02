/**
 * 房价走势分析 - 主应用入口
 * 负责初始化各个模块和协调它们的工作
 */

// 等待 DOM 加载完成
document.addEventListener('DOMContentLoaded', async function() {
    console.log('📈 房价走势分析应用启动中...');
    
    // 显示加载指示器
    showLoading();
    
    try {
        // 1. 初始化数据管理模块
        console.log('正在初始化数据管理模块...');
        await dataManager.init();
        
        // 2. 初始化图表管理模块
        console.log('正在初始化图表管理模块...');
        const chartManagerInstance = new ChartManagerConstructor('chartContainer');
        window.ChartManager = chartManagerInstance;
        
        // 3. 初始化计算引擎
        console.log('正在初始化计算引擎...');
        // Calculator 是静态类，无需初始化
        
        // 4. 初始化 UI 控制器
        console.log('正在初始化 UI 控制器...');
        uiController.init();
        
        // 5. 加载默认数据（北京、上海、广州、深圳、杭州）
        console.log('正在加载默认城市数据...');
        const defaultCities = ['北京', '上海', '广州', '深圳', '杭州'];
        console.log('📊 默认城市:', defaultCities);
        await dataManager.loadCities(defaultCities);
        console.log('✅ 城市数据加载完成');
        
        // 6. 渲染默认图表（走势图 + 线性坐标）
        console.log('正在渲染默认图表...');
        console.log('📈 ChartManager实例:', window.ChartManager);
        uiController.switchView('trend');
        console.log('✅ 图表渲染完成');
        
        // 7. 更新数据来源标注
        updateDataSourceInfo();
        
        console.log('✅ 应用启动完成！');
        
    } catch (error) {
        console.error('❌ 应用启动失败:', error);
        alert('应用启动失败，请刷新页面重试。错误信息：' + error.message);
    } finally {
        // 隐藏加载指示器
        hideLoading();
    }
});

/**
 * 显示加载指示器
 */
function showLoading() {
    const loading = document.getElementById('loadingIndicator');
    if (loading) {
        loading.style.display = 'block';
    }
}

/**
 * 隐藏加载指示器
 */
function hideLoading() {
    const loading = document.getElementById('loadingIndicator');
    if (loading) {
        loading.style.display = 'none';
    }
}

/**
 * 更新数据来源标注
 */
function updateDataSourceInfo() {
    const dataSourceEl = document.getElementById('dataSource');
    const lastUpdatedEl = document.getElementById('lastUpdated');
    
    if (dataSourceEl) {
        dataSourceEl.textContent = dataManager.getDataSource() || '未知来源';
    }
    
    if (lastUpdatedEl) {
        lastUpdatedEl.textContent = dataManager.getLastUpdated() || '--';
    }
}

/**
 * 工具函数：显示通知消息
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型 (info, success, error)
 */
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'error' ? '#f56565' : type === 'success' ? '#48bb78' : '#4299e1'};
        color: white;
        border-radius: 5px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // 3秒后自动移除
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// 导出全局函数（供其他模块调用）
window.showNotification = showNotification;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
