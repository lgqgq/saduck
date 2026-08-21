/**
 * import-guokao.mjs — 把「必刷题」2026行测5000题+申论100题 PDF 导入仓库 docs/国考省考题库/
 *
 * 用法： node scripts/import-guokao.mjs
 *
 * 源目录： D:\新建文件夹\【必刷题】2026行测5000题+申论100题
 * 目标目录结构：
 *   docs/国考省考题库/行测5000题/        ← 2026 行测5000题/题目/  5 份题目
 *   docs/国考省考题库/行测5000题-新增题/  ← 2026行测5000题（新增题部分）/  10 份
 *   docs/国考省考题库/申论100题/         ← 2026版申论100题（25年4月版）/  3 份
 *
 * 注意：答案 PDF（每份 391~596MB）超出 GitHub 单文件 100MB 上限，不导入，改由用户走网盘。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SRC = 'D:/新建文件夹/【必刷题】2026行测5000题+申论100题';
const DEST = path.join(ROOT, 'docs', '国考省考题库');

const MAP = [
  { src: '2026 行测5000题/题目',            dst: '行测5000题' },
  { src: '2026行测5000题（新增题部分）',      dst: '行测5000题-新增题' },
  { src: '2026版申论100题（25年4月版）',      dst: '申论100题' },
];

function sanitize(name) {
  let base = name.replace(/\.pdf$/i, '');
  base = base.replace(/[()（）]/g, '');
  base = base.replace(/["“”]/g, '').replace(/【】/g, '').replace(/、/g, '-');
  base = base.replace(/\s+/g, '-');
  base = base.replace(/_+/g, '-').replace(/-+/g, '-');
  base = base.replace(/^[-_]+|[-_]+$/g, '');
  base = base || 'file';
  return base + '.pdf';
}

let copied = 0, renamed = 0;
const used = new Set();

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

console.log(`完成：拷贝 ${copied} 份 PDF 到 docs/国考省考题库（同名重命名 ${renamed} 份）`);
