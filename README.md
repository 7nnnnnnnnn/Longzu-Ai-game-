# 龙族模拟器 · Netlify + DeepSeek API 接入版

这是 Netlify 版，不需要 Vercel。手机打开 Netlify 生成的网址即可玩。

## 文件结构

```txt
index.html
style.css
game.js
cover.svg
package.json
netlify.toml
netlify/
  functions/
    dm.js
README.md
```

## 需要设置的环境变量

在 Netlify 项目里添加：

```txt
DEEPSEEK_API_KEY=你的 token
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
```

想用 pro 可以改成：

```txt
DEEPSEEK_MODEL=deepseek-v4-pro
```

## Netlify 部署步骤

1. 登录 netlify.com
2. Add new project
3. Import an existing project
4. 选择 GitHub
5. 选择你的仓库
6. Build command 留空
7. Publish directory 填 `.`
8. 添加环境变量
9. Deploy
