const fs = require('fs');
const path = require('path');
const dir = 'site';
let total = 0;
const broken = [];
function walk(d) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) { walk(p); continue; }
    if (!f.name.endsWith('.html')) continue;
    const html = fs.readFileSync(p, 'utf8');
    const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map(m => m[1])
      .filter(h => !h.startsWith('http') && !h.startsWith('#') && h.includes('.html'));
    for (const h of hrefs) {
      total++;
      const resolved = path.normalize(path.join(path.dirname(p), h));
      if (!fs.existsSync(resolved)) broken.push(p + ' -> ' + h);
    }
  }
}
walk(dir);
console.log('扫描链接数:', total);
console.log('死链数:', broken.length);
if (broken.length) broken.slice(0, 20).forEach(b => console.log('  ✗', b));
else console.log('✓ 全部链接有效');
