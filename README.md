# 龙族模拟器 · DeepSeek API 接入版

这是一个可以部署到 Vercel 的网页文字游戏。手机直接打开网址即可玩，不用 WPS，不用本地 HTML，不用跟 iPhone 文件系统打架，谢天谢地。

## 重要提醒

不要把 token 写进 `index.html`、`game.js` 或任何前端文件。

正确做法：把 token 放到 Vercel 环境变量：

```txt
DEEPSEEK_API_KEY=你的 token
```

## 使用的接口

后端接口文件在：

```txt
api/dm.js
```

默认调用：

```txt
https://api.deepseek.com/chat/completions
```

默认模型：

```txt
deepseek-v4-flash
```

如果你想换模型，在 Vercel 环境变量里设置：

```txt
DEEPSEEK_MODEL=deepseek-v4-pro
```

## 部署到 Vercel 的步骤

### 1. 准备 GitHub

把这个文件夹上传到一个 GitHub 仓库。

文件结构应是：

```txt
longzu-ai-game/
├── api/
│   └── dm.js
├── index.html
├── style.css
├── game.js
├── cover.svg
├── package.json
├── vercel.json
└── README.md
```

### 2. 打开 Vercel

进入 Vercel，新建项目，导入你的 GitHub 仓库。

### 3. 设置环境变量

在 Vercel 项目设置里找到 Environment Variables，添加：

```txt
DEEPSEEK_API_KEY=你的 token
```

可选：

```txt
DEEPSEEK_MODEL=deepseek-v4-flash
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

### 4. Deploy

点 Deploy。成功后会得到一个网址。

手机打开这个网址，就能玩 AI DM 版。

## 本地测试

需要 Node.js 和 Vercel CLI：

```bash
npm i -g vercel
vercel dev
```

然后打开本地地址。

## 常见问题

### 点按钮后提示 Missing DEEPSEEK_API_KEY

说明你没有设置环境变量。不要把 token 填进前端，去 Vercel 设置里填。

### AI 返回很慢

正常。它在生成剧情，不是在算 1+1。可以把模型换成 flash。

### 选项很怪

这是文字模拟器，不是人生导师。可以在自由行动里直接输入你想做的事，AI 会继续判断。
