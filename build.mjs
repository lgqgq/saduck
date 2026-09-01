/**
 * SaDuck 考公知识库 — 静态站点构建脚本
 *
 * 用法： node build.mjs
 *
 * 内容源： content/ 下的 Markdown 文件（含 frontmatter）
 * 导航配置： nav.json
 * 构建产物： site/ 目录（可直接双击 index.html 浏览）
 *
 * 支持的 Markdown 语法：
 *   # H1  ~  ###### H6
 *   **粗体**、`行内代码`、[链接](url)、~~删除线~~、*斜体*
 *   无序列表 -、有序列表 1.
 *   引用 >，以及 Obsidian 风格提示框 > [!note|tip|warn|key|info]
 *   管道表格 | a | b | + |---| 分隔行
 *   --- 水平线
 *   frontmatter：---\ntitle / description / keywords\n---
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT = path.join(__dirname, 'content');
const NAV = JSON.parse(fs.readFileSync(path.join(__dirname, 'nav.json'), 'utf-8'));
const TEMPLATE = fs.readFileSync(path.join(__dirname, 'templates', 'layout.html'), 'utf-8');
const SITE = path.join(__dirname, 'site');

/* ---------------- Markdown 渲染器 ---------------- */

function esc(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderInline(text) {
  let out = '';
  let i = 0;
  const tokens = [];
  // 按内联标记拆分：**bold**, `code`, ~~del~~, [text](url), *italic*
  const re = /(\*\*.+?\*\*|`[^`]+`|~~.+?~~|\[[^\]]+\]\([^)]+\)|\*[^*\n]+\*)/g;
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    tokens.push({ text: text.slice(last, m.index), raw: false });
    tokens.push({ text: m[0], raw: true });
    last = m.index + m[0].length;
  }
  tokens.push({ text: text.slice(last), raw: false });
  for (const t of tokens) {
    if (!t.raw) {
      out += esc(t.text);
      continue;
    }
    const s = t.text;
    if (s.startsWith('**') && s.endsWith('**')) {
      out += '<strong>' + renderInline(s.slice(2, -2)) + '</strong>';
    } else if (s.startsWith('`') && s.endsWith('`')) {
      out += '<code>' + esc(s.slice(1, -1)) + '</code>';
    } else if (s.startsWith('~~') && s.endsWith('~~')) {
      out += '<del>' + renderInline(s.slice(2, -2)) + '</del>';
    } else if (s.startsWith('[')) {
      const mm = s.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (mm) out += `<a href="${esc(mm[2])}" target="_blank" rel="noopener">${renderInline(mm[1])}</a>`;
      else out += esc(s);
    } else if (s.startsWith('*')) {
      out += '<em>' + renderInline(s.slice(1, -1)) + '</em>';
    } else {
      out += esc(s);
    }
  }
  return out;
}

function renderTable(rows) {
  // rows: string[]，第一行为表头，第二行为分隔行
  const header = rows[0].split('|').slice(1, -1).map((c) => c.trim());
  const body = rows.slice(2).map((r) => r.split('|').slice(1, -1).map((c) => c.trim()));
  let html = '<div class="table-wrap"><table><thead><tr>';
  for (const h of header) html += `<th>${renderInline(h)}</th>`;
  html += '</tr></thead><tbody>';
  for (const r of body) {
    html += '<tr>';
    for (const c of r) html += `<td>${renderInline(c)}</td>`;
    html += '</tr>';
  }
  html += '</tbody></table></div>';
  return html;
}

function renderCallout(lines, type, title) {
  const body = lines.map((l) => l.replace(/^>\s?/, '')).join('\n');
  const cls = type || 'note';
  const label = title || { note: '提示', tip: '技巧', warn: '注意', key: '重点', info: '说明' }[cls] || '提示';
  return `<div class="callout callout-${cls}"><div class="callout-title">${esc(label)}</div><div class="callout-body">${renderBlocks(body)}</div></div>`;
}

function renderBlocks(md) {
  const lines = md.split('\n');
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 空行跳过
    if (!line.trim()) { i++; continue; }

    // 标题
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const lv = h[1].length;
      out.push(`<h${lv} id="${slugify(h[2])}">${renderInline(h[2])}</h${lv}>`);
      i++;
      continue;
    }

    // 水平线
    if (/^\s*(---|\*\*\*)\s*$/.test(line)) { out.push('<hr>'); i++; continue; }

    // 容器块 :::class（支持嵌套）
    if (/^:::([\w-]*)\s*$/.test(line)) {
      const cls = line.match(/^:::([\w-]*)\s*$/)[1] || '';
      const buf = [];
      i++;
      let depth = 1;
      while (i < lines.length) {
        const l = lines[i];
        if (/^:::[ \t]*$/.test(l)) {
          depth--;
          if (depth === 0) { i++; break; }
          buf.push(l);
        } else if (/^:::[a-zA-Z-]/.test(l)) {
          depth++;
          buf.push(l);
        } else {
          buf.push(l);
        }
        i++;
      }
      out.push(`<div class="${esc(cls)}">${renderBlocks(buf.join('\n'))}</div>`);
      continue;
    }

    // 引用块（含 callout）
    if (line.startsWith('>')) {
      const isCallout = /^>\s*\[!(\w+)\]\s*(.*)$/.test(line);
      if (isCallout) {
        const cm = line.match(/^>\s*\[!(\w+)\]\s*(.*)$/);
        const type = cm[1].toLowerCase();
        const title = cm[2].trim();
        const buf = [];
        i++;
        while (i < lines.length && lines[i].startsWith('>')) { buf.push(lines[i]); i++; }
        out.push(renderCallout(buf, type, title));
      } else {
        const buf = [];
        while (i < lines.length && lines[i].startsWith('>')) { buf.push(lines[i].replace(/^>\s?/, '')); i++; }
        out.push(`<blockquote>${renderBlocks(buf.join('\n'))}</blockquote>`);
      }
      continue;
    }

    // 表格
    if (line.trim().startsWith('|') && i + 1 < lines.length && /^\|[\s:|-]+\|?$/.test(lines[i + 1].trim()) && lines[i + 1].includes('-')) {
      const buf = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) { buf.push(lines[i].trim()); i++; }
      out.push(renderTable(buf));
      continue;
    }

    // 列表（无序 / 有序），支持两层缩进
    const listRe = /^(\s*)([-*+]|\d+\.)\s+(.*)$/;
    if (listRe.test(line)) {
      const buf = [];
      while (i < lines.length && (listRe.test(lines[i]) || /^\s{2,}\S/.test(lines[i]) || lines[i].trim() === '')) {
        if (lines[i].trim() === '' && i + 1 < lines.length && !listRe.test(lines[i + 1])) break;
        buf.push(lines[i]);
        i++;
      }
      out.push(renderList(buf));
      continue;
    }

    // 普通段落（连续非空行）
    const buf = [];
    while (i < lines.length && lines[i].trim() !== '') {
      if (listRe.test(lines[i]) || /^(#{1,6})\s/.test(lines[i]) || lines[i].startsWith('>')) break;
      buf.push(lines[i]);
      i++;
    }
    out.push(`<p>${renderInline(buf.join('\n'))}</p>`);
  }
  return out.join('\n');
}

function renderList(rawLines) {
  const items = [];
  let current = null;
  let sub = [];

  const pushSub = () => {
    if (current) {
      if (sub.length) {
        items[items.length - 1].sub = renderList(sub);
        sub = [];
      }
    }
  };

  for (const raw of rawLines) {
    if (raw.trim() === '') { pushSub(); continue; }
    const m = raw.match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
    if (m) {
      if (m[1].length >= 2) {
        sub.push(raw.replace(/^\s{2,}/, ''));
      } else {
        pushSub();
        const ordered = /\d+\./.test(m[2]);
        current = { ordered, text: m[3] };
        items.push({ ordered, text: m[3], sub: null });
      }
    } else {
      if (current) sub.push(raw.replace(/^\s{2,}/, ''));
    }
  }
  pushSub();

  let html = '';
  let lastTag = null;
  for (let k = 0; k < items.length; k++) {
    const it = items[k];
    if (lastTag !== it.ordered) {
      if (lastTag !== null) html += `</${lastTag === true ? 'ol' : 'ul'}>`;
      html += it.ordered ? '<ol>' : '<ul>';
      lastTag = it.ordered;
    }
    html += `<li>${renderInline(it.text)}${it.sub ? it.sub : ''}</li>`;
  }
  if (lastTag !== null) html += `</${lastTag === true ? 'ol' : 'ul'}>`;
  return html;
}

function slugify(s) {
  return s.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w一-龥-]/g, '');
}

/* ---------------- 页面元数据解析 ---------------- */

function parseFrontmatter(md) {
  const meta = { title: '', description: '', keywords: '' };
  let body = md;
  if (md.startsWith('---')) {
    const end = md.indexOf('\n---', 4);
    if (end !== -1) {
      const fm = md.slice(4, end).trim();
      for (const line of fm.split('\n')) {
        const mm = line.match(/^(\w+):\s*(.*)$/);
        if (mm) meta[mm[1]] = mm[2].trim();
      }
      body = md.slice(end + 4);
    }
  }
  return { meta, body };
}

/* ---------------- 导航 & 构建 ---------------- */

function depthOf(relPath) {
  return relPath.split('/').length - 1;
}

function relTo(depth, target) {
  return (depth === 0 ? './' : '../'.repeat(depth)) + target;
}

function computeSearchData() {
  const entries = [];
  for (const sec of NAV.sections) {
    for (const page of sec.pages) {
      const dir = sec.id === 'home' ? '' : sec.id + '/';
      const filePath = path.join(CONTENT, dir, page.file + '.md');
      let md;
      try { md = fs.readFileSync(filePath, 'utf-8'); } catch { md = null; }
      if (md) {
        const { meta, body } = parseFrontmatter(md);
        const plain = body
          .replace(/^[#>\-|`!\*\[\]\(\)]/gm, '')
          .replace(/[#*`\[\]()|<>]/g, '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 120);
        entries.push({
          path: (dir ? sec.id + '/' : '') + page.file + '.html',
          title: page.title,
          section: sec.title,
          keywords: meta.keywords || '',
          excerpt: plain,
        });
      } else {
        // 原始 HTML 页面（无 .md）：取 <title> 与 <header> 文本作为搜索条目
        const htmlPath = path.join(CONTENT, dir, page.file + '.html');
        if (fs.existsSync(htmlPath)) {
          const html = fs.readFileSync(htmlPath, 'utf-8');
          const tm = html.match(/<title>([^<]*)<\/title>/);
          const hm = html.match(/<header>([\s\S]*?)<\/header>/);
          const excerpt = hm
            ? hm[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 120)
            : '西安渭南进面分数线总览（2022—2026）';
          entries.push({
            path: (dir ? sec.id + '/' : '') + page.file + '.html',
            title: tm ? tm[1] : page.title,
            section: sec.title,
            keywords: '渭南,事业单位,进面分数线,数据报告,岗位',
            excerpt,
          });
        }
      }
    }
  }
  return entries;
}

function buildSidebar(currentSection, currentPage, depth) {
  let html = '';
  for (const sec of NAV.sections) {
    const secId = sec.id;
    const isActive = secId === currentSection;
    html += `<div class="nav-group${isActive ? ' open' : ''}">`;
    html += `<button class="nav-group-title" data-target="${esc(secId)}" aria-expanded="${isActive}">`;
    html += `<span>${esc(sec.title)}</span><svg class="chev" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`;
    html += `<ul class="nav-pages">`;
    for (const page of sec.pages) {
      const href = secId === 'home' ? relTo(depth, 'index.html') : relTo(depth, `${secId}/${page.file}.html`);
      const pageActive = isActive && page.file === currentPage;
      html += `<li><a href="${esc(href)}"${pageActive ? ' class="active"' : ''}>${esc(page.title)}</a></li>`;
    }
    html += `</ul></div>`;
  }
  return html;
}

function buildPage(section, page, depth) {
  const dir = section.id === 'home' ? '' : section.id + '/';
  const filePath = path.join(CONTENT, dir, page.file + '.md');
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { meta, body } = parseFrontmatter(raw);
  const contentHtml = renderBlocks(body);
  const title = meta.title || page.title;
  const description = meta.description || `SaDuck 考公知识库 · ${section.title} · ${page.title}`;

  const activeNav = section.id;

  // 面包屑（首页链接按深度生成）
  let crumbs = `<a href="${relTo(depth, 'index.html')}">首页</a>`;
  if (section.id !== 'home') {
    crumbs += `<span class="sep">/</span><span>${esc(section.title)}</span>`;
  }
  crumbs += `<span class="sep">/</span><span class="cur">${esc(title)}</span>`;

  // 侧边导航（当前页高亮）
  const sidebar = buildSidebar(activeNav, page.file, depth);

  let html = TEMPLATE
    .replace(/@@ASSETS@@/g, relTo(depth, 'assets'))
    .replace(/@@HOME@@/g, relTo(depth, 'index.html'))
    .replace(/@@BASE@@/g, JSON.stringify(relTo(depth, '')))
    .replace(/<!--TITLE-->/, esc(title))
    .replace(/<!--DESCRIPTION-->/, esc(description))
    .replace(/<!--KEYWORDS-->/, esc(meta.keywords || '考公,公务员,省考,国考,事业单位,申论,陕西,西安'))
    .replace(/<!--CANONICAL-->/, page.file + '.html')
    .replace(/<!--CONTENT-->/, contentHtml)
    .replace(/<!--ACTIVE-->/, activeNav)
    .replace(/<!--PAGE_TITLE-->/, esc(title))
    .replace(/<!--SIDEBAR-->/, sidebar)
    .replace(/<!--CRUMBS-->/, crumbs);

  return html;
}

/**
 * 给原始 HTML 页面注入「返回站点」导航条（保持独立页与主站连通）
 */
function injectReturnBar(html, homeHref) {
  const bar =
    '<div style="max-width:1080px;margin:18px auto 0;padding:0 20px;font-size:13px;line-height:1.7;">' +
    `<a href="${esc(homeHref)}" style="color:#2563eb;text-decoration:none;font-weight:600;">← 返回 SaDuck 考公知识库</a>` +
    '<span style="color:#9ca3af;margin-left:12px;">西安 · 渭南 进面分数线总览（事业编 · 省考 · 国考）</span>' +
    '</div>';
  // 原报告结构为 <body><div class="wrap">，在该边界插入导航条
  return html.replace('<body><div class="wrap">', '<body>' + bar + '\n<div class="wrap">');
}

function writeSite() {
  if (fs.existsSync(SITE)) fs.rmSync(SITE, { recursive: true });
  fs.mkdirSync(SITE, { recursive: true });

  // 拷贝 assets
  fs.cpSync(path.join(__dirname, 'assets'), path.join(SITE, 'assets'), { recursive: true });

  // 生成搜索索引
  const searchData = computeSearchData();
  fs.writeFileSync(
    path.join(SITE, 'assets', 'search-data.js'),
    'window.SEARCH_DATA = ' + JSON.stringify(searchData) + ';\n'
  );

  // 生成页面
  for (const sec of NAV.sections) {
    if (sec.id !== 'home') {
      fs.mkdirSync(path.join(SITE, sec.id), { recursive: true });
    }
    for (const page of sec.pages) {
      const depth = depthOf((sec.id === 'home' ? '' : sec.id + '/') + page.file + '.html');
      const dir = sec.id === 'home' ? '' : sec.id + '/';
      const mdPath = path.join(CONTENT, dir, page.file + '.md');
      const htmlPath = path.join(CONTENT, dir, page.file + '.html');
      const outPath = path.join(SITE, sec.id === 'home' ? '' : sec.id, page.file + '.html');

      if (fs.existsSync(mdPath)) {
        const html = buildPage(sec, page, depth);
        fs.writeFileSync(outPath, html);
        console.log('  ✓', path.relative(SITE, outPath));
      } else if (fs.existsSync(htmlPath)) {
        // 原始 HTML 页面：原样拷贝，注入返回站点导航条
        const raw = injectReturnBar(fs.readFileSync(htmlPath, 'utf-8'), relTo(depth, 'index.html'));
        fs.writeFileSync(outPath, raw);
        console.log('  ✓ (raw) ', path.relative(SITE, outPath));
      } else {
        console.warn('  ⚠ 页面缺少源文件（.md 与 .html 均不存在）:', page.file);
      }
    }
  }
  console.log('\n构建完成，共', searchData.length, '个页面。打开 site/index.html 即可浏览。');
}

writeSite();
