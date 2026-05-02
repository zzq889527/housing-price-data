const fs = require('fs');
const path = require('path');

// 读取cities.json
const dataPath = path.join(__dirname, 'data/cities.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// 直接使用原始数据格式（与dataManager.js期望的格式一致）
const embeddedData = {
  meta: data.meta,
  cities: data.cities  // 保持原始格式
};

// 生成JS文件
const jsContent = `// 嵌入数据 - 由脚本自动生成
window.EmbeddedData = ${JSON.stringify(embeddedData, null, 2)};
`;

const outputPath = path.join(__dirname, 'js/embeddedData.js');
fs.writeFileSync(outputPath, jsContent, 'utf8');

console.log('✅ 已生成 js/embeddedData.js');
console.log('📊 城市数量:', Object.keys(embeddedData.cities).length);
console.log('📂 文件大小:', (fs.statSync(outputPath).size / 1024).toFixed(2), 'KB');
