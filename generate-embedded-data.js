const fs = require('fs');
const path = require('path');

// 读取cities.json
const dataPath = path.join(__dirname, 'cities.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// 构建嵌入数据格式
const embeddedData = {
  citiesMeta: [],
  citiesData: {},
  macroData: null
};

// 城市元数据
for (const [cityName, cityInfo] of Object.entries(data.cities)) {
  embeddedData.citiesMeta.push({
    cityId: cityName,
    cityName: cityName,
    province: cityInfo.province || '未知'
  });
  
  // 城市数据
  embeddedData.citiesData[cityName] = {
    cityId: cityName,
    cityName: cityName,
    data: cityInfo.data
  };
}

// 生成JS文件
const jsContent = `// 嵌入数据 - 由脚本自动生成
window.EmbeddedData = ${JSON.stringify(embeddedData, null, 2)};
`;

const outputPath = path.join(__dirname, 'embedded-data.js');
fs.writeFileSync(outputPath, jsContent, 'utf8');

console.log('✅ 已生成 embedded-data.js');
console.log('📊 城市数量:', embeddedData.citiesMeta.length);
console.log('📂 文件大小:', (fs.statSync(outputPath).size / 1024).toFixed(2), 'KB');
