<h1 align="center">Onepod</h1>

<p align="center"><code>onepod</code></p>

<p align="center"><em>「每天把海外科技播客，变成更快读完的中文判断」</em></p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black" />
  <img alt="Cloudflare Workers" src="https://img.shields.io/badge/Cloudflare-Workers-f38020" />
  <img alt="Feishu" src="https://img.shields.io/badge/Feishu-Wiki-3370ff" />
</p>

<p align="center">
  Private project · Node.js 20+ · onepod.site
</p>

Onepod 是一个面向中文读者的海外科技播客阅读站。它从飞书知识库读取已经整理好的播客文章，把 YouTube 封面、频道、嘉宾、时间、核心观点和原文内容渲染成一个适合浏览和分享的网站。

它不是再做一个播客播放器。它更像一份持续更新的“播客速读库”：先看非共识判断、金句和核心观点，再决定要不要进入详情页深读，或跳回 YouTube 看原视频。

后台同步由 Cloudflare Worker 定时读取飞书 Wiki 子文档，并写入 KV；前端优先读取 KV，保留本地 JSON 作为构建和开发兜底。站点目前只保留播客模块，日报模块已移除。

## Quick Start

```bash
npm install
npm run dev -- --port 3001
```

打开 [http://localhost:3001](http://localhost:3001) 查看本地页面。

## Sync Content

本地刷新飞书播客数据：

```bash
npm run sync:feishu
```

需要在 `.env.local` 提供：

```bash
FEISHU_APP_ID=...
FEISHU_APP_SECRET=...
```

## Deploy

部署主站：

```bash
npm run cf:deploy
```

部署飞书同步 Worker：

```bash
npm run cf:sync:deploy
```

Cloudflare 配置文件：

- `wrangler.deploy.jsonc`：Onepod 主站 Worker
- `wrangler.sync.jsonc`：飞书定时同步 Worker

## Capabilities

- 首页瀑布流展示播客卡片，支持 YouTube 封面、频道、创建时间和 100-200 字摘要。
- 详情页展示左侧目录、中间正文、播客元信息和飞书原文链接。
- 支持普通长图分享和小红书 3:4 切图分享。
- 信源页列出当前播客来源频道。
- Cloudflare KV 缓存飞书同步结果，减少线上实时请求飞书。

## Boundaries

- 飞书是内容源，网站只负责展示和分发；如果飞书应用没有某个文档权限，前端不会凭空读到它。
- YouTube 元信息是增强信息，获取失败时会回退到飞书文档里的正文和标题。
- `.env.local`、Cloudflare token、飞书 secret 都不要提交到仓库。
