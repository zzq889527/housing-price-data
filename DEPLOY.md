# 部署到 GitHub Pages（免费托管 + 微信可访问）

## 🚀 快速部署步骤

### 第一步：创建 GitHub 仓库

1. 访问 https://github.com/new
2. 填写仓库名：`housing-price-chart`
3. 选择 **Public**（必须，否则 GitHub Pages 需要付费）
4. 点击 **Create repository**

### 第二步：上传文件

#### 方法 A：使用 Git 命令行（推荐）

```bash
# 1. 进入项目目录
cd "C:\Users\zzqo\WorkBuddy\20260501201853\housing-price-chart"

# 2. 初始化 Git 仓库
git init

# 3. 添加所有文件
git add .

# 4. 提交
git commit -m "初始提交：房价走势分析"

# 5. 添加远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/你的用户名/housing-price-chart.git

# 6. 推送到 GitHub
git push -u origin main
```

#### 方法 B：直接上传（适合不熟悉 Git 的用户）

1. 在 GitHub 仓库页面，点击 **Add file** → **Upload files**
2. 将 `housing-price-chart` 文件夹中的所有文件拖拽到页面
3. 点击 **Commit changes**

### 第三步：启用 GitHub Pages

1. 在 GitHub 仓库页面，点击 **Settings**
2. 左侧菜单找到 **Pages**
3. **Source** 选择 **Deploy from a branch**
4. **Branch** 选择 **main** 和 **/ (root)**
5. 点击 **Save**

等待 1-2 分钟，GitHub 会给你一个链接：
```
https://你的用户名.github.io/housing-price-chart/
```

### 第四步：在微信中打开

1. 打开链接：`https://你的用户名.github.io/housing-price-chart/index-cdn.html`
2. 页面加载成功后，点击浏览器右上角 **...**
3. 选择 **"在微信中打开"** 或 **"分享到微信"**

---

## 🔧 使用方法 B（无需 Git）

### 1. 下载 GitHub Desktop（图形化工具）

- 下载：https://desktop.github.com/
- 安装后登录你的 GitHub 账号

### 2. 克隆仓库

1. 点击 **File** → **Clone repository**
2. 选择你刚创建的 `housing-price-chart` 仓库
3. 选择本地路径

### 3. 复制文件

将 `housing-price-chart` 文件夹中的所有文件复制到克隆的仓库目录

### 4. 提交并推送

1. GitHub Desktop 会自动检测到文件变化
2. 在左下角填写提交信息（如"添加房价走势分析页面"）
3. 点击 **Commit to main**
4. 点击 **Push origin**

---

## 📱 微信中打开的注意事项

### 问题 1：GitHub Pages 链接被微信屏蔽？

**解决方案**：使用 **Vercel** 部署（不会被屏蔽）

1. 访问 https://vercel.com/
2. 使用 GitHub 账号登录
3. 点击 **New Project**
4. 选择 `housing-price-chart` 仓库
5. 点击 **Deploy**

Vercel 会给你一个链接：`https://housing-price-chart.vercel.app`

### 问题 2：CDN 加载失败？

**解决方案**：确保 `index-cdn.html` 中的 ECharts CDN 地址可访问：
```html
<script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>
```

如果 cdn.jsdelivr.net 被屏蔽，可替换为：
```html
<script src="https://cdn.bootcdn.net/ajax/libs/echarts/5.4.3/echarts.min.js"></script>
```

---

## 🎉 完成！

部署成功后，你就可以：
1. ✅ 在微信中直接打开链接
2. ✅ 分享给朋友
3. ✅ 添加到微信收藏
4. ✅ 每次打开都显示最新数据（运行 `update_data.py` 更新数据后，重新上传即可）

---

## 📞 需要帮助？

如果遇到问题，请告诉我：
1. 你使用的是 **方法 A（Git 命令行）** 还是 **方法 B（GitHub Desktop）**？
2. 在哪个步骤遇到了问题？
3. 错误信息是什么？

我会帮你解决！
