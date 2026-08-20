# SaDuck · 考公知识库

面向 **陕西 / 西安考区** 的免费备考知识库，覆盖 **国考、省考、事业编** 三大考试与 **申论、面试** 专题。

## 快速开始

```bash
# 1. 构建站点（生成 site/ 目录）
node build.mjs

# 或一键构建并打开
npm run start
```

构建完成后，**双击打开 `site/index.html`** 即可在浏览器中浏览。纯静态、零依赖、无需服务器。

## 项目结构

```
saDuck/
├── build.mjs           # Node 构建脚本（Markdown → HTML）
├── nav.json            # 站点导航与页面结构配置
├── package.json
├── templates/
│   └── layout.html     # 页面外壳模板（侧边栏/搜索/主题）
├── assets/
│   ├── style.css       # 全局样式（深色/浅色主题）
│   ├── app.js          # 交互脚本（搜索/主题/移动端菜单）
│   └── search-data.js  # 构建时自动生成（搜索索引）
├── content/            # ★ Markdown 内容源（增删改都在这里）
│   ├── index.md        # 首页
│   ├── guokao/         # 国考（8 篇）
│   ├── shengkao/       # 省考（8 篇）
│   ├── shiye/          # 事业编（9 篇）
│   ├── shenlun/        # 申论专题（9 篇）
│   └── mianshi/        # 面试专题（5 篇）
└── site/               # ★ 构建产物（打开它浏览）
```

## 如何新增/修改内容

1. 在 `content/<模块>/` 下新建或修改 `.md` 文件，文件头部用 frontmatter 声明元信息：

```markdown
---
title: 页面标题
description: 用于 SEO 与搜索索引的简介
keywords: 关键词,逗号分隔
---

# 正文标题

支持 **粗体**、`代码`、表格、引用、列表等 Markdown 语法。
```

2. 在 `nav.json` 对应的 section.pages 里添加一行 `{ "file": "文件名(不含.md)", "title": "侧边栏显示名" }`。

3. 重新运行 `node build.mjs`，页面自动生成、侧边栏/搜索自动更新。

## 支持的扩展语法

- **提示框**（Obsidian 风格）：`> [!note] 标题` / `> [!tip]` / `> [!warn]` / `> [!key]` / `> [!info]`
- **容器块**：`:::类名` … `:::` 支持嵌套，如 `:::cards`、`:::card`、`:::stat-grid`、`:::timeline`、`:::flow`、`:::hero`
- **管道表格**、**粗体/斜体/行内代码/链接/删除线** 常规 Markdown

## 内容信息说明

- 所有考试信息（时间节点、招录人数、科目设置）整理自公开渠道，**更新至 2026 年 8 月**。
- 每年考情会变，请以国家公务员局、陕西省公务员局、陕西人事考试网等**官方最新公告**为准。
- 本知识库仅供学习参考，不构成任何报考承诺。

## 参考信息源

国家公务员局 / 陕西人事考试网（www.sxrsks.cn）/ 陕西省人民政府门户网站 / 各地市人社局 / 各招录单位官网 / 公开媒体整理。
