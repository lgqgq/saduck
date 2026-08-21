/**
 * import-pdfs.mjs — 把超格刷题营 PDF 导入仓库 docs/刷题资料/
 *
 * 用法： node scripts/import-pdfs.mjs
 *
 * 源目录： D:\新建文件夹\【事业单位-夸夸刷】2026超格职测+综应（五合一）夸夸刷刷题营(2)
 * 目标目录结构：
 *   docs/刷题资料/题库/          ← 讲义/ 6 份主干题库
 *   docs/刷题资料/课件/<模块>/   ← 各课件/讲义子目录
 *
 * 文件名清洗规则（重要：构建器 renderInline 的链接正则 [^)]+ 遇 ')' 会截断，
 * 故 URL 中绝不能含半/全角括号）：
 *   1. 全角 （ ） → 去括号，内容保留；半角 ( ) 直接去掉（含其内容前缀空串）
 *   2. 空格、顿号 、 、【 】「」“” → 转 '-' 或去掉
 *   3. 下划线折叠：多个连续 '_' 合并，首尾 '_' 去掉
 *   4. 同名冲突自动追加 -1/-2
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SRC = 'D:/新建文件夹/【事业单位-夸夸刷】2026超格职测+综应（五合一）夸夸刷刷题营(2)';
const DEST = path.join(ROOT, 'docs', '刷题资料');

// 源目录 → 目标子目录
const MAP = [
  { src: '讲义',                      dst: '题库' },
  { src: '判断推理/判断推理/课件',       dst: '课件/判断推理' },
  { src: '判断推理/图形推理/课件',       dst: '课件/图形推理' },
  { src: '数量关系/课件',               dst: '课件/数量关系' },
  { src: '言语理解与表达/1班/讲义',      dst: '课件/言语理解-1班' },
  { src: '言语理解与表达/2班/讲义',      dst: '课件/言语理解-2班' },
  { src: '综应/1班/课件',               dst: '课件/综应-1班' },
  { src: '综应/2班/课件',               dst: '课件/综应-2班' },
  { src: '资料分析/课件',               dst: '课件/资料分析' },
];

function sanitize(name) {
  let base = name.replace(/\.pdf$/i, '');
  // 半角括号：去掉括号及其内容为空，仅去掉符号本身（保留括号内文字，符号连到内容）
  base = base.replace(/[()（）]/g, '');
  // 去掉中文引号与书名号、顿号
  base = base.replace(/["“”]/g, '').replace(/【】/g, '').replace(/、/g, '-');
  // 空格 → '-'
  base = base.replace(/\s+/g, '-');
  // 折叠下划线/连字符
  base = base.replace(/_+/g, '-').replace(/-+/g, '-');
  // 去首尾 '-' 和 '_'
  base = base.replace(/^[-_]+|[-_]+$/g, '');
  base = base || 'file';
  return base + '.pdf';
}

let copied = 0, skipped = 0, renamed = 0;
const used = new Set(); // 全局去重（含已存在的目标文件）

// 预载已存在目标名，避免覆盖
function walkUsed(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkUsed(p);
    else used.add(e.name);
  }
}
walkUsed(DEST);

for (const { src, dst } of MAP) {
  const srcDir = path.join(SRC, src);
  const dstDir = path.join(DEST, dst);
  if (!fs.existsSync(srcDir)) { console.log('⚠ 源目录不存在:', src); continue; }
  fs.mkdirSync(dstDir, { recursive: true });

  const files = fs.readdirSync(srcDir).filter((f) => /\.pdf$/i.test(f));
  for (const f of files.sort()) {
    let newName = sanitize(f);
    let candidate = newName;
    let n = 1;
    while (used.has(candidate)) { candidate = newName.replace(/\.pdf$/, `-${n}.pdf`); n++; }
    if (candidate !== newName) renamed++;
    used.add(candidate);
    fs.copyFileSync(path.join(srcDir, f), path.join(dstDir, candidate));
    copied++;
  }
}

console.log(`完成：拷贝 ${copied} 份 PDF 到 ${path.relative(ROOT, DEST)}（同名重命名 ${renamed} 份）`);
