# 部署指南：让手机/外网访问

站点是**纯静态网页**，可以部署到任意静态托管平台。按「国内访问速度」和「操作难度」推荐三种方案：

## 三方案对比

| 方案 | 网址形态 | 国内访问 | 操作难度 | 是否免费 | 说明 |
| --- | --- | --- | --- | --- | --- |
| **Gitee Pages** | `你的账号.gitee.io/仓库名` | ⚡ 最快 | 中（需实名） | 免费 | 国内访问最快，但需实名认证，改内容后需手动「更新部署」 |
| **GitHub Pages** | `你的账号.github.io/仓库名` | 一般（偶不稳定） | 中（用 git） | 免费 | 最通用、可自动部署；国内直连可能慢，可后续接 CDN/域名 |
| **Cloudflare Pages** | `项目名.pages.dev` | 一般（偶不稳定） | 低（免 git） | 免费 | 免 git、拖拽/一条命令即可上线；海外访问最快 |

> [!warn] 国内访问提示
> GitHub、Cloudflare 默认域名在国内**直连可能慢或偶发打不开**。想要「秒开」体验：
> - 方案一用 **Gitee Pages**（服务器在国内）；
> - 或上线后再绑定**自有域名**并套 CDN 加速。
> 若只是自己平时用、能接受偶尔慢，GitHub/Cloudflare 免费方案完全够用。

---

## 方案 A：Gitee Pages（国内最快，推荐首选）

> [!key] 本地已就绪
> `site/` 目录已经初始化为 git 仓库（分支 `main`，43 个文件已提交）。发布仓库的**根目录就是站点**，Gitee Pages 托管 `/` 即可，无需选目录。

### 方式 1：git 推送（推荐，更新方便）

1. 注册/登录 [Gitee](https://gitee.com)（需手机号 + **实名认证**）。
2. 新建仓库 → 名称如 `saduck`，设为**公开**，**不要**勾选「使用 Readme 初始化」。
3. 本地终端把 `site/` 仓库关联到 Gitee 并推送（把 `<你的账号>` 换成你的 Gitee 用户名）：

```bash
cd /d/saDuck/site
git remote add origin https://gitee.com/<你的账号>/saduck.git
git push -u origin main
```

> 推送时提示输入 Gitee 账号密码（或私人令牌）。也可以在对话里输入 `! git push -u origin main`，把命令交给本会话执行，输出会直接显示在这里。

4. 回到仓库页 → 服务 → **Gitee Pages** → 部署分支选 `main`、部署目录 `/` → 启动。
5. 生成网址：`https://<你的账号>.gitee.io/saduck/`，手机 4G/5G 打开即可。

> 以后更新内容：`node build.mjs` 重新生成后，在 `site/` 里 `git add -A && git commit -m "更新" && git push`，再到 Gitee Pages 点「**更新**」。

### 方式 2：网页上传（免 git）

1. 注册/登录 [Gitee](https://gitee.com)（需手机号 + 实名认证）。
2. 新建仓库 → 名称如 `saduck`，公开仓库。
3. 仓库首页 → 「+」→ 上传文件 → 选择 `site/` 目录下**全部 43 个文件**（保留 `assets/`、各模块子目录结构）→ 提交。
4. 仓库页 → 服务 → **Gitee Pages** → 部署分支 `main`、目录 `/` → 启动。
5. 网址：`https://<你的账号>.gitee.io/saduck/`。

> [!warn] 免费 Gitee Pages 提示
> Gitee Pages 需**实名认证**后才能开通；首次启动可能进入人工审核，等待通过后即生效。若页面提示「服务暂未开通」，属正常流程，等待审核即可。

## 方案 B：GitHub Pages（自动部署，git 已就绪）

1. 注册/登录 [GitHub](https://github.com)。
2. 新建仓库，名称如 `saduck`（公开仓库）。
3. 本地终端执行（我会帮你确认命令）：

```bash
cd /d/saDuck
git init
git add .
git commit -m "init: SaDuck 考公知识库"
git branch -M main
git remote add origin https://github.com/<你的账号>/saduck.git
git push -u origin main
```

4. 推送后，`.github/workflows/deploy-pages.yml` 会自动构建并部署。
5. 仓库 → Settings → Pages → Source 选 **GitHub Actions**（首次需确认）。
6. 网址：`https://<你的账号>.github.io/saduck/`。

> 以后改内容：`git add . && git commit -m "..." && git push`，几分钟后自动更新。

## 方案 C：Cloudflare Pages（免 git，最快上手）

1. 注册/登录 [Cloudflare](https://dash.cloudflare.com)（邮箱即可，无需实名）。
2. Workers & Pages → **创建** → Pages → 上传资源（上传 `site/` 目录内全部文件）→ 部署。
3. 网址：`https://<项目名>.pages.dev/`。
   - 或者用 CLI：`npx wrangler login` 后 `npx wrangler pages deploy site --project-name saduck-kaogong`。

---

## 上线后绑定自有域名（可选）

如果你有 `saduck.top` 或其他域名，可在托管平台「自定义域 / Custom domains」中绑定：

- **国内服务器/需要备案**：如果域名解析到国内主机（Gitee、腾讯云、阿里云），需先完成 **ICP 备案**。
- **海外托管（GitHub/Cloudflare）**：用 Cloudflare 托管 DNS 可免备案，但国内访问速度取决于网络环境。

## 本地预览确认

部署前建议先在本地再确认一遍效果：

```bash
node build.mjs            # 重新构建
start site/index.html     # 本地打开检查
```

> 已为你准备好 `wrangler.toml`（方案 C）和 GitHub Actions 工作流（方案 B）。选定方案后告诉我，我帮你执行本地命令（如 git 初始化/推送）。
